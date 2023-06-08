import React, { Component } from 'react';
import Web3 from 'web3';
import BettingContractFactory from './contracts/BettingContractFactory.json'; 
import BettingGame from './contracts/BettingGame.json'; 
import AccountInfo from './AccountInfo';
import { ethers } from 'ethers';
import './App.css'; // Import the CSS file


class BettingApp extends Component {
  
  state = {
    web3: null,
    contractInstance: null,
    account: null,
    team1: '',
    team2: '',
    endTime: '',
    newGameAddress: '',
    selectedWinningTeam: "0",
    betHistory: []
  };

  accountsChangedListener = (accounts) => {
    const activeAccount = accounts[0];
    this.setState({ account: activeAccount });
  };

  async componentDidMount() {
    await this.loadWeb3();
    await this.loadBlockchainData();
    this.getBetHistory();
    console.log("dingus")
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', this.accountsChangedListener);
    }
    this.interval = setInterval(this.refreshGameDetails.bind(this), 1000); // Call refreshGameDetails every 1 second
  }
  
  componentWillUnmount() {
    clearInterval(this.interval);
    if (window.ethereum) {
      window.ethereum.removeListener('accountsChanged', this.accountsChangedListener);
    }
  }

  endBetting = async () => {
    try {
      // Make sure web3 is initialized
      if (!window.web3) {
        console.error("Web3 is not initialized");
        return;
      }
  
      const { selectedWinningTeam } = this.state;
  
      // Convert the selected winning team to the corresponding enum value
      const winningTeamEnum = parseInt(selectedWinningTeam);
  
      // Call endBetting from your contract
      await this.state.contractInstance.methods.endBetting(winningTeamEnum).send({ from: this.state.account });
  
      console.log("endBetting transaction sent");
    } catch (error) {
      console.error("endBetting error", error);
    }
  }
  
  async loadWeb3() {
    console.log('loadWeb3 start');
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      try {
        // Request account access if needed
        await window.ethereum.request({ method: 'eth_requestAccounts' });
      } catch (error) {
        // User denied account access...
        console.error("User denied account access")
      }
    } else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider);
    } else {
      window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!');
    }
    console.log('loadWeb3 end');
  }
  
  async loadBlockchainData() {
    console.log('loadBlockchainData start');
    const web3 = window.web3;
    const accounts = await web3.eth.getAccounts();
    this.setState({ account: accounts[0] });
  
    const networkId = await web3.eth.net.getId();
    const networkData = BettingContractFactory.networks[networkId];
  
    if (networkData) {
      const contractInstance = new web3.eth.Contract(
        BettingContractFactory.abi,
        '0x7b52AE61c6C59a16B1C17C305c3EEEb11A954C13' 
      );


      
      this.setState({ contractInstance }, () => console.log("contractInstance set in state", this.state.contractInstance));
    } else {
      console.warn('BettingContractFactory contract not deployed to detected network.');
    }
    console.log('loadBlockchainData end');
  }
  
  
  createNewGame = async () => {
    console.log("createNewGame start");
  
    // Make sure web3 is initialized
    if (!window.web3) {
      console.error("Web3 is not initialized");
      return;
    }
  
    let { team1, team2, endTime } = this.state;
    let bettingEndTime = parseInt(endTime) * 60; // endTime input is considered in minutes from now
    
    let gameStartTime = Math.floor(Date.now() / 1000); // Current timestamp in seconds
    this.setState({ gameStartTime, gameDuration: bettingEndTime });

    // Call createNewGame from your contract
    this.state.contractInstance.methods.createNewGame(team1, team2, bettingEndTime)
      .send({ from: this.state.account })
      .on('receipt', (receipt) => {
        // This will be called when the transaction is mined
  
        // Extract new game address from transaction receipt
        const newGameAddress = receipt.events.NewGame.returnValues[0];
  
        // Update state with new game address
        this.setState({ newGameAddress }, () => {
          const bettingGame = new window.web3.eth.Contract(
            BettingGame.abi,
            newGameAddress
          );
          this.setState({ bettingGame }, () => {
            console.log("bettingGame set in state", this.state.bettingGame);
            this.refreshGameDetails();
          });
          
        });
      })
      .on('error', (error) => {
        // This will be called if the transaction fails
        console.error("createNewGame transaction error", error);
      });
  }
  
  betTeam1Win = async () => {
    console.log("betTeam1Win start");
    
    console.log("bettingGame in state", this.state.bettingGame);
    if (!this.state.bettingGame) {
      console.log("bettingGame is not available in state. Exiting betTeam1Win.");
      return;
    }
    
    try {
      const betAmount = window.web3.utils.toWei('1', 'Ether'); // Adjust this value as needed
      await this.state.bettingGame.methods.placeBet(0).send({ from: this.state.account, value: betAmount });

      console.log("betTeam1Win transaction sent");
    } catch (error) {
      console.error("betTeam1Win error", error);
    }
    
    console.log("betTeam1Win end");
}

betTie = async () => {
  if (!this.state.bettingGame) {
    console.log("bettingGame is not available in state. Exiting betTie.");
    return;
  }
  try {
    const betAmount = window.web3.utils.toWei('1', 'Ether'); // Adjust this value as needed
    await this.state.bettingGame.methods.placeBet(2).send({ from: this.state.account, value: betAmount });
  } catch (error) {
    console.error("betTie error", error);
  }
}

betTeam1Lose = async () => {
  console.log("betTeam1Lose start");

  console.log("bettingGame in state", this.state.bettingGame);
  if (!this.state.bettingGame) {
    console.log("bettingGame is not available in state. Exiting betTeam1Lose.");
    return;
  }

  try {
    const betAmount = window.web3.utils.toWei('1', 'Ether'); // Adjust this value as needed
    await this.state.bettingGame.methods.placeBet(1).send({ from: this.state.account, value: betAmount });

    console.log("betTeam1Lose transaction sent");
  } catch (error) {
    console.error("betTeam1Lose error", error);
  }

  console.log("betTeam1Lose end");
}

async getBetHistory() {
  try {
    const betHistory = await this.state.bettingGame.methods.getBetHistory().call({ from: this.state.account });
    this.setState({ betHistory });
  } catch (error) {
    console.error("getBetHistory error", error);
  }
}

async refreshGameDetails() {
  if (!this.state.bettingGame) {
    console.log("No bettingGame in state. Skipping refresh");
    return;
  }

  console.log("refreshGameDetails start");

  // Get updated details of the game
  const totalBetTeam1Win = await this.state.bettingGame.methods.totalBetTeam1Win().call();
  const totalBetTeam1Lose = await this.state.bettingGame.methods.totalBetTeam1Lose().call();
  const totalBetTie = await this.state.bettingGame.methods.totalBetTie().call();
  const team1Name = await this.state.bettingGame.methods.team1().call();
  const team2Name = await this.state.bettingGame.methods.team2().call();
  const ownerAddress = await this.state.bettingGame.methods.getOwner().call();
  // console.log("NO00000000000000000000000000000000000000000000000")
  // const bigOwner = await this.state.bettingGame.methods.getOwner().call();
  
  const { gameStartTime, gameDuration } = this.state;
  const currentUnixTimestamp = Math.floor(Date.now() / 1000); // Current timestamp in seconds
  const contractEndTime = gameStartTime + gameDuration;
  const timeLeft = contractEndTime - currentUnixTimestamp; // in seconds
  this.getBetHistory();

  this.state.bettingGame.methods.getBetHistory(this.state.account).call()
  .then((betHistory) => {
    console.log(betHistory);
    this.setState({ betHistory }); // Update the betHistory state
  })
  .catch((error) => {
    console.error("Error fetching bet history", error);
  });




  // Update state with the updated game details
  this.setState({ totalBetTeam1Win, totalBetTeam1Lose, totalBetTie, team1Name, team2Name, timeLeft, ownerAddress});
}

// Update the endBetting function to use the newGameAddress
endBetting = async () => {
  try {
    // Make sure web3 is initialized
    if (!window.web3) {
      console.error("Web3 is not initialized");
      return;
    }

    const { newGameAddress, selectedWinningTeam } = this.state;

    // Create a new instance of the game contract using the newGameAddress
    const gameContract = new window.web3.eth.Contract(BettingGame.abi, newGameAddress);

    // Convert the selected winning team to the corresponding enum value
    const winningTeamEnum = parseInt(selectedWinningTeam);

    // Call endBetting from the game contract
    await gameContract.methods.endBetting(winningTeamEnum).send({ from: this.state.account });

    console.log("endBetting transaction sent");
  } catch (error) {
    console.error("endBetting error", error);
  }
}

claimReward = async () => {
  try {
    // Make sure web3 is initialized
    if (!window.web3) {
      console.error("Web3 is not initialized");
      return;
    }

    const { newGameAddress } = this.state;

    // Create a new instance of the game contract using the newGameAddress
    const gameContract = new window.web3.eth.Contract(BettingGame.abi, newGameAddress);

    // Call claimReward from the game contract
    await gameContract.methods.claimReward().send({ from: this.state.account });

    console.log("claimReward transaction sent");
  } catch (error) {
    console.error("claimReward error", error);
  }
}




handleWinnerSelection = (event) => {
  this.setState({ selectedWinningTeam: event.target.value });
}


  handleInputChange = (event) => {
    this.setState({
      [event.target.name]: event.target.value
    });
  }

  render() {
    const { selectedWinningTeam } = this.state;
    console.log("betHistory:", this.state.betHistory);
    const styles = {
      container: { margin: 'auto', width: '50%', padding: '10px' },
      input: { margin: '5px' },
      button: { margin: '5px', backgroundColor: '#4CAF50', color: 'white', padding: '10px 20px', cursor: 'pointer', },
      select: { margin: '5px', padding: '10px', },
      gameDetails: { margin: '15px', padding: '10px', border: '1px solid #ddd' },
      newGameAddress: { fontWeight: 'bold' }
    }
  
    return (
      <div style={styles.container}>
        <h2>Create New Game</h2>
        <input style={styles.input} type='text' name='team1' placeholder='Team 1' onChange={this.handleInputChange} />
        <input style={styles.input} type='text' name='team2' placeholder='Team 2' onChange={this.handleInputChange} />
        <input style={styles.input} type='text' name='endTime' placeholder='End Time (in minutes)' onChange={this.handleInputChange} />
        <button style={styles.button} onClick={() => this.createNewGame()}>Create Game</button>
        <p>New game contract address: <span style={styles.newGameAddress}>{this.state.newGameAddress}</span></p>
  
        <div style={styles.gameDetails}>
          <h3>Game Details</h3>
          <p>Owner: {this.state.ownerAddress }</p>
          <p>Team 1: {this.state.team1Name}</p>
          <p>Team 2: {this.state.team2Name}</p>
          <p>Team 1 Win Pool: {this.state.totalBetTeam1Win}</p>
          <p>Team 2 Win Pool: {this.state.totalBetTeam1Lose}</p>
          <p>Tie Pool: {this.state.totalBetTie}</p>
          <p>Time Left: {this.state.timeLeft} seconds</p>
  
          <button style={styles.button} onClick={this.betTeam1Win}>Bet Team 1 Win</button>
          <button style={styles.button} onClick={this.betTeam1Lose}>Bet Team 1 Lose</button>
          <button style={styles.button} onClick={this.betTie}>Bet Tie</button>
        </div>
  
        <select style={styles.select} value={selectedWinningTeam} onChange={this.handleWinnerSelection}>
          <option value="0">Team1 Win</option>
          <option value="1">Team1 Lose</option>
          <option value="2">Tie</option>
        </select>
        <button style={styles.button} onClick={this.endBetting}>End Betting</button>
        <button style={styles.button} onClick={this.claimReward}>Claim Reward</button>
        <AccountInfo account={this.state.account} bettingStatus={this.state.bettingStatus} />
      
        <div>
  <h2>Bet History</h2>
  <div className="bet-history-container">
    {this.state.betHistory.map((bet, index) => (
      <div key={index} className="bet-box">
        <p>Amount: {bet.amount}</p>
        <p>Chosen Team: {bet.chosenTeam}</p>
        <p>Rewarded: {bet.rewarded ? 'Yes' : 'No'}</p>
        <p>Time Placed: {new Date(bet.timePlaced * 1000).toLocaleString()}</p>
      </div>
    ))}
  </div>
</div>



      
      
      
      </div>      
    );
  }
  
}

export default BettingApp;
