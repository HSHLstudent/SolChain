# SolChain 1.0
A small set of applications that are supposed to demonstrate the features of a blockchain-based accounting software that specifically operates with solar panels. It is by no means marketable, but could either be used to learn about a few things about the blockchain technology or as a foundation for more ambitious programs.

Once it´s set up and running, it automatically keeps track of the of the produced power and reacts to any button pressed by the user.
If, for example, the creation of the of a new block is requested, the program starts its proof-of-work algorithm to calculate a new block which contains all the unprocessed transactions.

Have fun with the software! A shoutout goes out to Savjee (https://github.com/Savjee) for inspiring me to create SolChain. Check out his GitHub, he´s amazing.

# Overview of available features
- automated measurements of the solar panel and upload to a ThingSpeak-channel
- easy-to-understand proof-of-work algorithm
- easy-to-use interface
- intergrated MongoDB-database, that automatically keeps track of the created blockchain
- verification algorithm
- automated payment calculation for the produced power
- account balance algorithm

# Description
SolChain consists of two independent programs, that work together to let the user measure the power created by his solar panel and simulate a payment process on a blockchain that is created just for this purpose.

The first one is a small application for the "arduino nano"-microcontroller. It measures the produced power and uploads the data to a specified ThingSpeak-channel.
The second one, a server application written in JavaScript (using Node.js), is the blockchain itself. When started for the first time, it checks the database for an existing blockchain and, depending on the outcome, either imports the existing chain or creates a new genesis block.
After that, it downloads all the data from the ThingSpeak cloud and compares the existing chain with the downloaded measurements. New measurements are morphed into a transaction by using the exchange rate embedded in the code. The default setting pays two Coins per produced Watt-second. Transactions have to have a sender and a receiver and in order to simulate that, the application creates two accounts that represent the owner of the solar panel and the consumer of the power.
At this point, the application is ready to react to requests sent to it from the user interface:

- If the user chooses to create a block, the application starts the mining process by calculating a hash with all the open transactions plus all the meta data available. As an additional condition, the hash has to have to have a certain amount of zeros at the start, which means that the calculation has to be done over and over again. This, in essence, is the proof-of-work algorithm.
Once a hash has been found, the created block can be seen in the console of the user interface.

- If the user chooses to verify the blockchain, the server recalculates all the hashes of all blocks and compares the "previous hash" of the current block with the hash of the previous block. The result can be seen in the console of the interface

- If the user chooses to check account balances, the server goes through all the blocks to calculate the balance of the chosen account. It then outputs the result in the console.

- If the user chooses to view the latest block, the server outputs the latest block to the console.

- If the user chooses to start the scanning process, the server continiously looks for new data in the cloud and downloads it. the option can be turned on or off. 

# Installation

 To use this application efficiently, you need to have the following hardware available:

- a small solar panel (p<10 W is best)
- an arduino nano with an integrated esp-8266 wifi module
- a pc

1. Download all files and connect the solar panel to the arduino. After that, change the Wifi login data and the ThingSpeak-Channel to whatever you set up previously.
2. 
