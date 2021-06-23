const ChainUtil = require('../chain-util');
const { INITIAL_BALANCE } = require('../config');
const Transaction = require('./transaction');

class Wallet {
    constructor() {
        this.balance = INITIAL_BALANCE;
        this.keyPair = ChainUtil.genKeyPair();
        this.publicKey = this.keyPair.getPublic().encode('hex');
    }

    toString() {
        return `Wallet -
        publicKey   : ${this.publicKey.toString()}
        balance     : ${this.balance}
        `;
    }

    sign(dataHash) {
        return this.keyPair.sign(dataHash);
    }

    createTransaction(recipient, amount, blockchain, transactionPool) {
        this.balance = this.calculateBalance(blockchain);

        if (amount > this.balance) {
            console.log(`Amount: ${amount} exceeds current balance: ${this.balance}`);
            return;
        }
        let transaction = transactionPool.existingTransaction(this.publicKey);
        if (transaction) {
            transaction.update(this, recipient, amount);
        } else {
            transaction = Transaction.newTransaction(this, recipient, amount);
            transactionPool.updateOrAddTransaction(transaction);
        }

        return transaction;
    }

    calculateBalance(blockchain) {
        let balance = this.balance;
        let transactions = [];
        //get all transaction on blockchain
        blockchain.chain.forEach((block) =>
            block.data.forEach((transaction) => {
                transactions.push(transaction);
            }),
        );

        //get all transactions where the this wallet is the sender
        const walletInputTs = transactions.filter((transaction) => transaction.input.address === this.publicKey);

        let startTime = 0;

        if (walletInputTs.length > 0) {
            //get the most recent transaction where the this wallet is the sender
            const recentInputT = walletInputTs.reduce((prev, current) =>
                prev.input.timestamp > current.input.timestamp ? prev : current,
            );

            //get the most recent balance based on this wallets last transaction sent (the
            //output created with the input of that transaction)
            balance = recentInputT.outputs.find((output) => output.address === this.publicKey).amount;
            startTime = recentInputT.input.timestamp;
        }

        //add all received output amounts since the latest transaction to the balance
        transactions.forEach((transaction) => {
            if (transaction.input.timestamp > startTime) {
                transaction.outputs.find((output) => {
                    if (output.address === this.publicKey) {
                        balance += output.amount;
                    }
                });
            }
        });

        return balance;
    }

    static blockchainWallet() {
        const blockchainWallet = new this();
        blockchainWallet.address = 'blockchain-wallet';
        return blockchainWallet;
    }
}
module.exports = Wallet;
