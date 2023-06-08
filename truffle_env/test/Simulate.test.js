const BettingContractFactory = artifacts.require("BettingContractFactory");
const BettingGame = artifacts.require("BettingGame");
const truffleAssert = require('truffle-assertions');

contract("BettingGame", function(accounts) {
  let bettingFactory;
  let bettingGame;

  beforeEach(async function() {
    bettingFactory = await BettingContractFactory.new({ from: accounts[0] });
    const result = await bettingFactory.createNewGame("TeamA", "TeamB", 600, { from: accounts[0] });
    const gameAddress = result.logs[0].args.gameAddress;
    bettingGame = await BettingGame.at(gameAddress);
  });

  it("Should simulate a betting game", async function() {
    // Make sure the game is deployed correctly
    const team1 = await bettingGame.team1();
    const team2 = await bettingGame.team2();
    assert.equal(team1, "TeamA");
    assert.equal(team2, "TeamB");

    // Account 2 bets 2 ether on team 1 win
    await bettingGame.placeBet(0, { from: accounts[1], value: web3.utils.toWei('2', 'ether') });

    // Account 3 bets 2 ether on team 1 lose
    await bettingGame.placeBet(1, { from: accounts[2], value: web3.utils.toWei('2', 'ether') });

    // Account 4 bets 2 ether on tie
    await bettingGame.placeBet(2, { from: accounts[3], value: web3.utils.toWei('2', 'ether') });

    // Speed up the blockchain 600+ seconds (this is done via evm_increaseTime in a local ganache environment)
    await web3.currentProvider.send({ method: 'evm_increaseTime', params: [601] }, (error, result) => { if (error) console.log(error); });

    // Speed up the blockchain 600+ seconds (this is done via evm_increaseTime in a local Ganache environment)
    await new Promise((resolve, reject) => {
        web3.currentProvider.send({ jsonrpc: '2.0', method: 'evm_increaseTime', params: [601] }, (err, result) => {
            if(err){ return reject(err) }
            return resolve(result)
        });
    });

    // then we need to mine a new block, because time won't actually move forward until the next block is mined
    await new Promise((resolve, reject) => {
        web3.currentProvider.send({ jsonrpc: '2.0', method: 'evm_mine', params: [] }, (err, result) => {
            if(err){ return reject(err) }
            return resolve(result)
        });
    });

    // Account 1 ends the betting and sets the winner to 1
    await bettingGame.endBetting(0, { from: accounts[0] });

    // Account 2 withdraws
    await bettingGame.claimReward({ from: accounts[1] });

    // Account 3 tries to withdraw, but fails
    await truffleAssert.reverts(bettingGame.claimReward({ from: accounts[2] }), "No winnings to claim.");

    // // Account 4 tries to withdraw, but fails
    await truffleAssert.reverts(bettingGame.claimReward({ from: accounts[3] }), "No winnings to claim.");
  });
});
