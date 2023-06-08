const BettingContractFactory = artifacts.require("BettingContractFactory");
const BettingGame = artifacts.require("BettingGame");

module.exports = async function(deployer, network, accounts) {
    // Deploy BettingContractFactory
    await deployer.deploy(BettingContractFactory);
    let factoryInstance = await BettingContractFactory.deployed();

    // Use the factory to create a new BettingGame
    let team1 = "Team 1";
    let team2 = "Team 2";
    // let endTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

    await factoryInstance.createNewGame(team1, team2, 600, { from: accounts[0] });
};
