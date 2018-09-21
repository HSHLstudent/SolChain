
const SHA256 = require("crypto-js/sha256");
var request = require("request");
var urlThingSpeak = "https://api.thingspeak.com/channels/472255/feeds.json?results"; //Die URL der Cloud.
var Adresse1 = "SolarpanelBesitzer";
var Adresse2 = "Strombezieher"
var AdresseMiner = "Maltes-Adresse";
const mongoose = require('mongoose');
var express = require('express');
var AppControllers = require('./BlockchainControllers/AppControllers.js');
const BlockchainModel = require('../models/BlockchainModel');
var assert = require('assert');
var express = require('express');
var controlNumber = 0;
var savedBlockchainLength = 0;
var oldBlockchain = [];
var Interval;
var setTheScanner = false;
var testArray;
var app = express();
var x = 0;
var newestHash = '';
var newestTransactions = [];
var newestNonce = 0;
var newestID = 0;
var newestTimestamp;
var newestPreviousHash = '';
app.listen(8000);
var i = 1;
app.set('view engine', 'ejs');
var exchangeRate = 2;


app.use(express.static('./'));

AppControllers(app);

class Transaction{ //Die Transaktions-Klasse. Jede zu verarbeitende Transaktion muss dem im Konstruktor vorgegebenen Schema folgen.
  constructor(fromAddress, toAddress, amount, PowerCreatedAt){ 
    this.fromAddress = fromAddress;
    this.PowerCreatedAt = PowerCreatedAt;
    this.toAddress = toAddress;
    this.amount = amount;
  }
}


class Block { //Die Block-Klasse. Jede zu verarbeitende Transaktion muss dem im Konstruktor vorgegebenen Schema folgen.
  constructor(ID, timestamp, transactions, previousHash = '', nonce) {
    this.ID = ID;
    this.previousHash = previousHash;
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.hash = this.calculateHash();
    this.nonce = nonce;
  }

  calculateHash() { // Diese Methode kalkuliert entweder den Hash (wenn 'else' zutrifft) oder gibt die Variable "NewestHash" als Hash des Blockes weiter.
    
    if(controlNumber != 0){
      return newestHash;
    }
    else{
    return SHA256(this.previousHash + this.timestamp + JSON.stringify(this.transactions) + this.nonce).toString();
    };
  }

  

  mineBlock(difficulty) { //diese Methode kalkuliert den Hash eines Block solange neu, bis dieser den Vorgaben der 'difficulty'-Variable des Konstruktors der Blockchain entspricht.
    while (this.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")) {
        this.nonce++;// die 'nonce' wird immer um 1 erhöht, wenn der Hash nicht die geforderte Menge an Nullen am Anfang besitzt.
        this.hash = this.calculateHash();
    }
    console.log("BLOCK MINED: " + this.hash);
    console.log("It took only " + this.nonce + ' tries to generate this Hash with ' + difficulty + ' Zeros.');//diese Ausgabe gibt die Menge der Kalkulierungsvesuche aus.
  }



}


class Blockchain{// Die Blockchain-Klasse.
  constructor() {
    this.difficulty = 3;//Diese Variable gibt die Menge an Nullen am Anfang des Hashes an.
    this.pendingTransactions = [];//Diese Variable speichert die offenen Transaktionen.
    this.miningReward = 100;//Diese Variable bestimmt die Belohnung für das 'Mining' eines Blocks.
    this.chain = [];// Diese Variable speichert die erstellten Blöcke. Sie ist damit die eigentliche Blockchain.
    
  }
  async updateBlockchain(){ //Diese Methode updated die Blockchain, indem sie die auf der Datenbank gespeicherten Blöcke ausliest.
    
    
    if(controlNumber != 0){
      console.log('updating Blockchain');
      
      
      for(let a of oldBlockchain){
          newestTransactions = await this.updateTransactions();
          newestHash = oldBlockchain[x].hash;
          console.log('Hash has been updated. Hash of the latest Block is ' + newestHash);
          newestTimestamp = oldBlockchain[x].timestamp;
          newestID = oldBlockchain[x].ID;
          newestPreviousHash = oldBlockchain[x].previousHash;
          newestNonce = oldBlockchain[x].nonce;
          let block = new Block(newestID, newestTimestamp, newestTransactions, newestPreviousHash, newestNonce);
          console.log(block);
          this.chain.push(block);
          x++;
        }
        
    }else{console.log('too bad')
    }
  }

  updateTransactions(){// Diese Methode updated explizit die Transaktionen, die etwas komplizierter sind als die anderen Eigenschaften eines Blockes.
    
    var newTransaction = [];
    var thisarray = [];
    if(oldBlockchain[x].transactions.length == 0){

      return thisarray;
    }
    else{
    for(let f = 0;  f < oldBlockchain[x].transactions.length; f++){
      
       newTransaction = new Transaction(oldBlockchain[x].transactions[f].fromAddress,
                                        oldBlockchain[x].transactions[f].toAddress,
                                        oldBlockchain[x].transactions[f].amount,
                                        oldBlockchain[x].transactions[f].PowerCreatedAt)
                         
                         
       thisarray.push(newTransaction);
       console.log('transaction updated');
      };
    return thisarray;
    }
  }


  async checkForBlockchain(){ //Diese Methode sucht bei Start der Applikation nach einer gespeicherten Blockchain und speichert diese in einer Variable.
    var connection = '';
    
    
      connection = await this.connectToBlockchain().then(function(result){
      console.log(result);
    
    

    //hier funktioniert push
    
    BlockchainModel.find().then(function(result){
      //hier nicht
      if(result.length == 0){
        console.log('no existing Blockchchain found');
        
      }
      else{

        oldBlockchain = Array.from(result);
        result.length = savedBlockchainLength;
        console.log('old Blockchain reestablished')
        
        controlNumber = 1;
        HSHLCoin.updateBlockchain();
        }
      })
    });
    }
    async connectToBlockchain(){ //Diese Funktion stellt eine Verbindung zur Datenbank her.
      var returnValue = '';
      mongoose.connect('mongodb://localhost/testaroo');
  
      mongoose.connection.once('open', function(){
      console.log('Connection has been made, now make fireworks...');
      returnValue = 'Connection has been made, now make fireworks...';
        }).on('error', function(error){
      console.log('Connection error:', error);
      console.log('Starting new Blockchain...')
      returnValue = 'Connection error:';
      });
      return returnValue;
    }


  createGenesisBlock() { //Diese Methode erstellt, wenn nötig, den ersten Block einer neuen Blockchain. Danach startet sie den den Update-Prozess der zu verarbeitenden Messwerte.
    console.log("test");
    if(controlNumber == 0){
      this.createTransaction(new Transaction(null, Adresse2, 100, 0));
      let block = new Block(0, Date.parse("2017-01-01"),this.pendingTransactions , "0",0 );
      block.mineBlock(this.difficulty);
      this.chain.push(block);
      block = new BlockchainModel({
        ID: 0,
        previousHash:"0",
        timestamp: Date.parse("2017-01-01"),
        transactions: this.pendingTransactions,
        hash: this.getLatestBlock().hash,
        nonce: this.getLatestBlock().nonce
        });
  
        block.save().then(function(){
        assert(!block.isNew);
        })
    console.log("Genesis Block created");
    controlNumber = 0;
    this.pendingTransactions = [];
    this.UpdatingMeasurements();
    }

    else{
      console.log('Existing up-to-Date Blockchain detected');
      this.UpdatingMeasurements();
     
    };
  }
  getLatestBlock() { //Diese Methode gibt den neuesten Block aus.
    return this.chain[this.chain.length - 1];
  }

  getSecondToLatestBlock() {// Diese Methode gibt den zweitneuesten Block aus.
    return this.chain[this.chain.length - 2];
  }


  minePendingTransactions(miningRewardAddress) {
    //Diese Methode erstellt einen neuen Block und speichert ihn in der Datenbank. 
    //Anschließend erstellt sie eine offene Transaktion mit der Belohnung des Miners.
    var SavedBlock;
    if (this.pendingTransactions.length<1){
      this.createTransaction(new Transaction(null, null, 0, this.getLatestBlock().transactions[this.getLatestBlock().transactions.length-1].PowerCreatedAt ));
    };
      let block = new Block(newestID + i, Date.now(), this.pendingTransactions, this.getLatestBlock().hash,0);
      block.mineBlock(this.difficulty);
      console.log('Block successfully mined!');
      this.chain.push(block);
      SavedBlock = new BlockchainModel({
      ID: block.ID,
      previousHash: block.previousHash,
      timestamp: block.timestamp,
      transactions: block.transactions,
      hash: block.hash,
      nonce:block.nonce
      });

      SavedBlock.save().then(function(){
      assert(!SavedBlock.isNew);
      })
     i++;
      
      this.pendingTransactions = [
      new Transaction(null, miningRewardAddress, this.miningReward,this.getLatestBlock().transactions[this.getLatestBlock().transactions.length-1].PowerCreatedAt)
    ];
    }
  intervalManager(flag){ // Diese Funktion scannt die Cloud alle 5 Sekunden nach neuen Messwerten und übersetzt diese in offene Transaktionen. 
     var ScanIntervalTime = 5000;

      if (flag ==  true){
        
        if(Interval) {
          clearInterval(Interval);
        }
        Interval = setInterval(function() {
          var counter = 0;
          console.log('scanning..');
        request({url: urlThingSpeak,json: true }, function (error, response, body) {
          if (!error && response.statusCode === 200) {
            
          for(let r = 0;r <body.feeds.length;r++){
            if (HSHLCoin.getLatestBlock().transactions[HSHLCoin.getLatestBlock().transactions.length-1].PowerCreatedAt < Date.parse(body.feeds[r].created_at)
              && HSHLCoin.pendingTransactions[HSHLCoin.pendingTransactions.length-1].PowerCreatedAt < Date.parse(body.feeds[r].created_at)){
              var totalCoins = Number(body.feeds[r].field1)*exchangeRate;
              var timestampOfNewMeasurement = Date.parse(body.feeds[r].created_at);
              HSHLCoin.createTransaction(new Transaction(Adresse2, Adresse1, totalCoins, timestampOfNewMeasurement)); 
              counter++;
              }
            }
          return console.log(counter + ' Measurements have been updated!')

          };
                 
              });
             }, ScanIntervalTime);
          }
          else{
            clearInterval(Interval);
            console.log('Scan has stopped');
    
          }
        };
 

  createTransaction(transaction){ //Diese Methode pusht die Transaktion in die Tabelle offener Transaktionen.
    this.pendingTransactions.push(transaction);
  }

  getBalanceOfAddress(address){//Mit dieser Methode wird der Kontostand einzelner Accounts abgefragt.
    let balance = 0;

    for(const block of this.chain){
      for(const trans of block.transactions){
        if(trans.fromAddress === address){
          balance -= trans.amount;
        }

        if(trans.toAddress === address){
          balance += trans.amount;
        }
      }
      if (balance < 0){

      }
    }

    return balance;
  }
  async UpdatingMeasurements(){//Die Methode, die den Update-Prozess der Messwerte koordiniert.
   
    const valueB = await this.trackingNewestMeasurement();
    console.log('Update complete');
    if (valueB != undefined )
    return this.createTransaction(new Transaction(Adresse2, Adresse1, valueB[0], valueB[1]));
    else{
      return console.log('everything up-to-date');
    }    
  }
  async trackingNewestMeasurement(){ //Diese Methode identifiziert neue Messwerte und speichert sie als Transaktionen.
    var r = 0;
    var totalWattHours = 0;
    var timestampOfNewMeasurement = '';
    
    //console.log(testArray);
    if(controlNumber == 0){
        for(let z = 0 ; z < testArray.length ; z++) {
          totalWattHours += Number(testArray[z].field1);
          
          timestampOfNewMeasurement = Date.parse(testArray[z].created_at);

      }
      console.log(totalWattHours + ' unprocessed Ws have been detected.');
      return [totalWattHours*exchangeRate, timestampOfNewMeasurement];
    }
    else{
      if(this.getLatestBlock().transactions[this.getLatestBlock().transactions.length-1].PowerCreatedAt >= Date.parse(testArray[testArray.length-1].created_at))
        {
          return console.log('Measurements up to Date');
        }
        else{
          console.log('New Meaurements! Updating...');
          for(let r = 0; r < testArray.length; r++){
            if (this.getLatestBlock().transactions[this.getLatestBlock().transactions.length-1].PowerCreatedAt < Number(Date.parse(testArray[r].created_at) )){
              totalWattHours += Number(testArray[r].field1);
              console.log(totalWattHours);
              timestampOfNewMeasurement = Date.parse(testArray[r].created_at);
              ;
            }
            else{console.log('a miss');
          
            console.log(this.getLatestBlock().transactions[this.getLatestBlock().transactions.length-1].PowerCreatedAt);
            console.log(Date.parse(testArray[r].created_at));
          
          };

          

        }
        return [totalWattHours*exchangeRate,Number(timestampOfNewMeasurement)];

    };
  };

    

  }




 downloadMeasurements(){//Diese Methode lädt alle verfügbaren Messwerte der Cloud herunter. 
   
  request({url: urlThingSpeak,json: true },function (error, response, body) {
      if (!error && response.statusCode === 200) {
        testArray = Array.from(body.feeds);
        console.log('download complete');
        

      };
    });
    
  }

  isChainValid() {//Diese Methode überprüft, ob die erstellte Blockchain valide ist. 
    for (let i = 1; i < this.chain.length; i++){
        const currentBlock = this.chain[i];
        const previousBlock = this.chain[i - 1];

        if (currentBlock.hash !== SHA256(previousBlock.hash + currentBlock.timestamp 
            + JSON.stringify(currentBlock.transactions) + currentBlock.nonce).toString()){
            console.log(SHA256(previousBlock.hash + currentBlock.timestamp 
            + JSON.stringify(currentBlock.transactions) + currentBlock.nonce).toString());
            console.log(currentBlock);
            console.log('Berechnung falsch.');
            return false;
        }

        if (currentBlock.previousHash !== previousBlock.hash) {
            console.log('previousHash falsch');
            console.log(currentBlock.previousHash);
            console.log(previousBlock.hash);

            return false;
        }
    }
    console.log('chain is valid');
    return true;
  }
}

app.get("/", function (req,res) {//Rendering der Website.
  res.render('Website',  { isScanning: setTheScanner });
});

app.get('/validateChain',function(req,res){//"Validate Chain"-Button
  res.send({
    success: true,
    console: 'Check whether the chain is valid:   ' + HSHLCoin.isChainValid()
  });
});

app.get('/mineBlock',function(req,res){//"mine Block"-Button
  controlNumber = 0;

  HSHLCoin.minePendingTransactions(AdresseMiner);

  res.send({
    success: true,
    console: 'The following Block has been mined:   ' + JSON.stringify(HSHLCoin.getLatestBlock(), null, 4)
  });
});

app.get('/balances/:id',function(req,res){//steuert das Eingabefenster für das Abfragen der Kontostände.
  res.send({
    success: true,
    console: 'Balance of ' + req.params.id + ' is ' + HSHLCoin.getBalanceOfAddress(req.params.id)
  });
});



app.get('/stopScanning', function (req,res) {//Stoppt den Scanner.
  setTheScanner = false;
  HSHLCoin.intervalManager(setTheScanner);
  res.send({
    success: true,
    console: 'Scanning stopped'
  });

  });
app.get('/startScanning', function (req,res) {//Startet den Scanner.
    setTheScanner = true;
    HSHLCoin.intervalManager(setTheScanner);
    console.log('Scanning started');
    res.send({
      success: true,
      console: 'Scanning started'
    }); 
});

app.get('/getLatestBlock', function (req,res) {  //"Get Latest Block"-Button
  res.send({
    success: true,
    console: 'Latest Block:\n' + JSON.stringify(HSHLCoin.getLatestBlock(), null, 4)
  });
})

let HSHLCoin = new Blockchain(); // Ein neues Blockchain-Objekt mit dem Namen "HSHLCoin" wird erstellt.

HSHLCoin.checkForBlockchain(); //Datenbank wird auf eine existierende Blockchain hin überprüft.
HSHLCoin.downloadMeasurements();//Cloud wird nach neuen Messwerten durchsucht.
setTimeout(function () { 

HSHLCoin.createGenesisBlock();

}, 4000+savedBlockchainLength*100);


