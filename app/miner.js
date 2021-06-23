const Wallet = require('../wallet');
const Transaction = require('../wallet/transaction');

class Miner {
    constructor(blockchain, transactionPool, wallet, p2pServer) {
        this.blockchain = blockchain;
        this.transactionPool = transactionPool;
        this.wallet = wallet;
        this.p2pServer = p2pServer;
    }

    mine() {
        //-----------------------------------------------------------------------------------
        //a. This could be done on a blockchain wallet approval self dedicated server
        const validTransactions = this.transactionPool.validTransactions();
        validTransactions.push(Transaction.rewardTransaction(this.wallet, Wallet.blockchainWallet()));
        //-----------------------------------------------------------------------------------

        //-----------------------------------------------------------------------------------
        //b. this could be replaced to just be the `mineBlock` function executed before step a. mentioned
        //above. The server mentioned above would then run addBlock and then carry out the reward transaction
        const block = this.blockchain.addBlock(validTransactions);
        //-----------------------------------------------------------------------------------

        this.p2pServer.syncChains();
        this.transactionPool.clear();
        this.p2pServer.broadcastClearTransactions();

        return block;
    }
}

module.exports = Miner;
