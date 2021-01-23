const SHA256 = require('crypto-js/sha256')
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

class Transaction{
    constructor(fromAddress, toAddress, amount) {
        this.fromAddress = fromAddress;
        this.toAddress = toAddress;
        this.amount = amount;
    }
    calculateHash() {
        return SHA256(this.fromAddress + this.toAddress + this.amount).toString();

    }
    signTransaction(signingKey){
        if (signingKey.getPublic('hex') !== this.fromAddress){
            throw new Error('You cannot sign transactions for other wallets!')
        }

        const hashTx = this.calculateHash();
        const sig = signingKey.sign(hashTx, 'base64');
        this.signature = sig.toDER('hex');
    }
    isValid() {
        if (this.fromAddress ===null)return true;

        if(!this.signature || this.signature.length === 0) {
            throw new Error('No Signature');
        }

        const publicKey = ec.keyFromPublic(this.fromAddress,'hex');
        return publicKey.verify(this.calculateHash(),this.signature);
    }

}
class Block{
    //index = where the block is in the chain
    //timestamp = when the block is created
    //data = details of transaction(sender,receiver,how much bitcoins)
    //previousHash = contains the hash of the previous block
    constructor(timestamp,transactions,previousHash=''){
        this.timestamp = timestamp
        this.transactions = transactions
        this.previousHash = previousHash
        this.hash = ''
        this.nonce = 0;

    }
    findHash() {
        return SHA256(this.index + this.previousHash + this.timestamp + JSON.stringify(this.data)+this.nonce).toString();
    }
    mineBlock(difficulty) {//proof of work
        while(this.hash.substring(0,difficulty) != Array(difficulty + 1).join("0")){
            this.nonce++;
            this.hash = this.findHash();
        }
        console.log("Block mined: " + this.hash);
    }
    haveValidTransactions() {
        for(const tx of this.transactions) {
            if(!tx.isValid()) {
                return false;

            }
        }
        return true;
    }
}

class Blockchain{
    constructor(){
        this.chain = [this.createGenesisBlock()];
        this.difficulty = 2;
        this.pendingTransactions = [];
        this.miningReward = 100;
    }
    createGenesisBlock(){
        return new Block("01/01/2021","Genesis block","0");
    }
    getLatestBlock(){
        return this.chain[this.chain.length -1];
    }
    minePendingTransactions(miningRewardAddress){
        const rewareTx = new Transaction(null,miningRewardAddress,this.miningReward);
        this.pendingTransactions.push(rewareTx);

        let block = new Block(Date.now(),this.pendingTransactions);//miner can pick the transaction they want to include
        block.mineBlock(this.difficulty);

        console.log('Block successfully mined!')
        this.chain.push(block);

        this.pendingTransactions=[];//reset
    }
    addTransaction(transaction){

        if (!transaction.fromAddress || !transaction.toAddress){
            throw new Error('Transaction must include addresses');
        }
        
        if (transaction.amount <= 0) {
            throw new Error('Transaction amount should be higher than 0');
          }

        if (!transaction.isValid()){
            throw new Error('Cannot add invalid transaction to chain');
        }
        this.pendingTransactions.push(transaction);
    }
    getBalanceOfAddress(address) {
        let balance = 0;
        for (const block of this.chain) {
            for (const trans of block.transactions) {
                if(trans.fromAddress === address){
                    balance -= trans.amount;
                }
                if (trans.toAddress === address) {
                    balance += trans.amount;
                }
            }
            
        }
        return balance;
    }
    isChainValid(){
        //no need to start from i = 0, genesis block
        for(let i =1;i < this.chain.length;i++){
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i-1];
            //actual hash of the block does not match with a hash that actually set
            if (!currentBlock.haveValidTransactions()){
                return false;
            }
            if (currentBlock.hash !== currentBlock.findHash()){
                return false;
            }
            //if the current block previous hash data is not equal to the previous block hash 
            if(currentBlock.previousHash !== previousBlock.hash) {
                return false;
            }
        }
        return true; 
    }
}
module.exports.Blockchain=Blockchain;
module.exports.Transaction = Transaction;
