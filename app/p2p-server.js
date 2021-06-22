const Websocket = require('ws');

const P2P_PORT = process.env.P2P_PORT || 5001;
const peers = process.env.PEERS ? process.env.PEERS.split(',') : [];
const MESSAGE_TYPES = {
    chain: 'CHAIN',
    transaction: 'TRANSACTION',
    clearTransactions: 'CLEAR_TRANSACTIONS',
};

class P2pServer {
    constructor(blockchain, transactionPool) {
        this.blockchain = blockchain;
        this.transactionPool = transactionPool;
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

            switch (data.type) {
                case MESSAGE_TYPES.chain:
                    this.blockchain.replaceChain(data.chain);
                    break;
                case MESSAGE_TYPES.transaction:
                    this.transactionPool.updateOrAddTransaction(data.transaction);
                    break;
                case MESSAGE_TYPES.clearTransactions:
                    this.transactionPool.clear();
                    break;
            }
        });
    }

    sendChain(socket) {
        socket.send(
            JSON.stringify({
                type: MESSAGE_TYPES.chain,
                chain: this.blockchain.chain,
            }),
        );
    }

    sendTransaction(socket, transaction) {
        socket.send(
            JSON.stringify({
                type: MESSAGE_TYPES.transaction,
                transaction,
            }),
        );
    }

    syncChains() {
        this.sockets.forEach((socket) => {
            this.sendChain(socket);
        });
    }

    broadcastTranscaction(transaction) {
        this.sockets.forEach((socket) => {
            this.sendTransaction(socket, transaction);
        });
    }

    broadcastClearTransacttions() {
        this.sockets.forEach((socket) =>
            socket.send(
                JSON.stringify({
                    type: MESSAGE_TYPES.clearTransactions,
                }),
            ),
        );
    }
}

module.exports = P2pServer;
