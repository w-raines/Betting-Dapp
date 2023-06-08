const BettingContractFactory = artifacts.require("BettingContractFactory");

contract("BettingContractFactory", function(accounts) {
  let bettingFactory;

  beforeEach(async function() {
    bettingFactory = await BettingContractFactory.new({ from: accounts[0] });
  });

  it("Should deploy the contract and check if the owner is correct", async function() {
    const owner = await bettingFactory.owner();
    assert.equal(owner, accounts[0]);
  });
});
