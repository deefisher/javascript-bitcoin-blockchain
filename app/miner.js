class Miner {
    constructor(blockchain, transactionPool, wallet, p2pServer) {
        this.blockchain = blockchain;
        this.transactionPool = transactionPool;
        this.wallet = wallet;
        this.p2pServer = p2pServer;
    }

    mine() {
        const validTransactions = this.transactionPool.validTransactions();
        //include a reward for the miner
        //create a block consisting of the valid transactions
        //syncronize the chains in the peer-to-peer server
        //clear the transaction pool
        //broadcast to every minor to clear their transactions pools
    }
}
