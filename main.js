const {Blockchain,Transaction} = require('./blockchain');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

const myKey = ec.keyFromPrivate('f4ebd3c597560986914c560efa945fcb9ef55e07dc49cf3465700ccf5f34f4ed');
const myWalletAddress = myKey.getPublic('hex');

let pCoin = new Blockchain();

const tx1 = new Transaction(myWalletAddress,'address69',10);
tx1.signTransaction(myKey);
pCoin.addTransaction(tx1);


console.log('\n Starting the miner')
pCoin.minePendingTransactions(myWalletAddress);

console.log('\nBalance of phone is',pCoin.getBalanceOfAddress(myWalletAddress));
pCoin.chain[1].transactions[0].amount = 1;
console.log('is chain valid',pCoin.isChainValid());
