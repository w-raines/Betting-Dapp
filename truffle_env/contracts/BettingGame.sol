// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

contract BettingGame {
    address public owner;
    struct Bet {
        uint amount;
        Team chosenTeam;
        bool rewarded;
        uint timePlaced;
    }

    enum Team { Team1Win, Team1Lose, Tie }

    bool public bettingIsActive = true;
    string public team1;
    string public team2;
    Team public winningTeam;

    mapping(address => Bet[]) public bets;
    uint public totalBetTeam1Win;
    uint public totalBetTeam1Lose;
    uint public totalBetTie;
    uint public endTime;

    constructor(string memory _team1, string memory _team2, uint _liveTime) {
        team1 = _team1;
        team2 = _team2;
        owner = tx.origin;
        endTime = block.timestamp + _liveTime;
    }

    modifier bettingOpen {
        require(bettingIsActive, "Betting is not active.");
        require(block.timestamp <= endTime, "Betting period has ended.");
        _;
    }

    modifier onlyOwner {
        require(msg.sender == owner, "Only owner can end the betting.");
        _;
    }

    function placeBet(Team _team) public payable bettingOpen {
        require(msg.value > 0, "Betting amount must be greater than 0.");

        // Push a new Bet to the user's array
        bets[msg.sender].push(Bet({
            amount: msg.value,
            chosenTeam: _team,
            rewarded: false,
            timePlaced: block.timestamp
        }));

        if (_team == Team.Team1Win) {
            totalBetTeam1Win += msg.value;
        } else if (_team == Team.Team1Lose) {
            totalBetTeam1Lose += msg.value;
        } else if (_team == Team.Tie) {
            totalBetTie += msg.value;
        }
    }

    function getOwner() public view returns (address) {
        return owner;
    }

    function getBetHistory(address _better) public view returns (Bet[] memory) {
        return bets[_better];
    }

    function endBetting(Team _winningTeam) public onlyOwner {
        require(block.timestamp >= endTime, "Betting period has not ended.");
        bettingIsActive = false;
        winningTeam = _winningTeam;
    }

    function claimReward() public {
        require(!bettingIsActive, "Betting still active.");

        uint totalPayout = 0;

        for (uint i = 0; i < bets[msg.sender].length; i++) {
            Bet storage bet = bets[msg.sender][i];

            if (bet.amount == 0 || bet.rewarded) {
                continue;
            }

            if (bet.chosenTeam == winningTeam) {
                uint payout = (bet.amount * address(this).balance) / (totalBetTeam1Win + totalBetTeam1Lose + totalBetTie - totalBetTeam1Win);
                bet.rewarded = true;
                totalPayout += payout;
            }
        }

        require(totalPayout > 0, "No winnings to claim.");
        payable(msg.sender).transfer(totalPayout);
    }
}
