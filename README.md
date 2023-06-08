To run the Betting Application on Ganache, run the following command:
```
truffle migrate
```
Import the first account from Ganache into metamask, this is the owner of the BettingFactory. This account is the only one who can deploy new games and end the betting process. Paste the address of the BettingFactory into App.js, look for this code snippet.
```js
if (networkData) {
      const contractInstance = new web3.eth.Contract(
        BettingContractFactory.abi,
        '{paste address here}' 
      );
```
Start the react server by navigating to ./betting-dapp/src/ and running the following command:
```
npm start
```

