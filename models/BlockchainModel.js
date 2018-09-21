const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create a Schema and a Model

const BlockSchema = new Schema({
    ID: Number,
    previousHash: String,
    timestamp: Number,
    transactions: Array,
    hash: String,
    nonce:Number
    
    
});

const BlockchainModel = mongoose.model('BlockchainModel', BlockSchema);

module.exports = BlockchainModel;