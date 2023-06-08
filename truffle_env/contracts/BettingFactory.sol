// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import "./BettingGame.sol";

contract BettingContractFactory {
    address[] public bettingGames;
    address public owner;

    event NewGame(address gameAddress);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner {
        require(msg.sender == owner, "Only owner can create a new game.");
        _;
    }

    function createNewGame(string memory _team1, string memory _team2, uint256 _endTime) public onlyOwner returns (address) {
        BettingGame bg = new BettingGame(_team1, _team2, _endTime);
        bettingGames.push(address(bg));
        emit NewGame(address(bg));
        return address(bg);
    }

}