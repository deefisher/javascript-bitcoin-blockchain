const Websocket = require('ws');

const P2P_PORT = process.env.P2P_PORT || 5001;
const peers = process.env.PEERS ? process.env.PEERS.split(',') : [];

class P2pServer {
    constructor(blockchain) {
        this.blockchain = blockchain;
        this.sockets = [];
    }

    listen() {
        const server = new Websocket.Server({ port: P2P_PORT });
        server.on('connection', (socket) => {
            this.connectSocket(socket, 'server');
        });

        this.connectToPeers();

        console.log(`Listening for peer-to-peer connections on: ${P2P_PORT}`);
    }

    connectSocket(socket, type) {
        this.sockets.push(socket);
        console.log(`Socket connected - ${type}`);

        this.messageHandler(socket);
        this.sendChain(socket);
    }

    connectToPeers() {
        peers.forEach((peer) => {
            //ws://localhost:5001
            //A socket is a network connection defined by the combination of IP address and port number
            const socket = new Websocket(peer);
            socket.on('open', () => {
                this.connectSocket(socket, 'peer');
            });
        });
    }

    messageHandler(socket) {
        socket.on('message', (message) => {
            const data = JSON.parse(message);

            this.blockchain.replaceChain(data);
        });
    }

    sendChain(socket) {
        socket.send(JSON.stringify(this.blockchain.chain));
    }

    syncChains() {
        this.sockets.forEach((socket) => {
            this.sendChain(socket);
        });
    }
}

module.exports = P2pServer;
