const BettingContractFactory = artifacts.require("BettingContractFactory");
const BettingGame = artifacts.require("BettingGame");

contract("BettingGame", function(accounts) {
  let bettingFactory;
  let bettingGame;

  beforeEach(async function() {
    bettingFactory = await BettingContractFactory.new({ from: accounts[0] });
    const result = await bettingFactory.createNewGame("TeamA", "TeamB", 600, { from: accounts[0] });
    const gameAddress = result.logs[0].args.gameAddress;
    bettingGame = await BettingGame.at(gameAddress);
  });

  it("Should deploy the contract and check if the parameters are correct", async function() {
    const team1 = await bettingGame.team1();
    const team2 = await bettingGame.team2();
    const endTime = await bettingGame.endTime();

    assert.equal(team1, "TeamA");
    assert.equal(team2, "TeamB");

    // let currentTime = Math.floor(Date.now() / 1000);
    // assert.isTrue(endTime.toNumber() >= currentTime && endTime.toNumber() <= currentTime + 600);
  });
});
