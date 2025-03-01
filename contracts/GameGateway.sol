// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

import "./Game.sol";

contract GameGateway {
    // Game configuration and tracking
    uint256 public totalRooms;
    mapping(uint256 => Game) public games;
    mapping(address => Player) public players;
    mapping(address => bool) public userSignUp;
    mapping(address => bool) public hasGameStarted;
    mapping(uint256 => LeaderboardEntry) public leaderboard;

    struct Player {
        address playerAddress;
        uint256 totalGamesPlayed;
        uint256 totalGamesWon;
    }

    struct LeaderboardEntry {
        address winner;
        uint256 timeTaken;
        uint256 roomNumber;
        uint8 gameType;
        uint256 timestamp;
    }

    enum GameType {
        Solidity,
        JavaScript,
        ZkMath,
        CryptoGraphy,
        AccountAbstraction,
        Layer2
    }

    event UserSignedUp(address indexed user);
    event GameCreated(uint256 indexed roomNumber, address indexed creator, uint8 gameType);
    event GameJoined(uint256 indexed roomNumber, address indexed player);
    event GameEnded(uint256 indexed roomNumber, address indexed winner);
    event LeaderboardUpdated(uint256 indexed roomNumber, address indexed winner);

    function signUpUser() external {
        require(!userSignUp[msg.sender], "User already signed up");
        userSignUp[msg.sender] = true;
        players[msg.sender] = Player({
            playerAddress: msg.sender,
            totalGamesPlayed: 0,
            totalGamesWon: 0
        });
        emit UserSignedUp(msg.sender);
    }

    function createGame(address _instance, uint8 gameType) external returns (uint256) {
        require(userSignUp[msg.sender], "User must sign up first");
        require(!hasGameStarted[_instance], "Game already started");

        uint256 roomNumber = ++totalRooms;
        Game newGame = Game(_instance);
        games[roomNumber] = newGame;
        newGame.initializeGame(msg.sender, gameType, roomNumber);

        emit GameCreated(roomNumber, msg.sender, gameType);
        return roomNumber;
    }

    function joinGame(uint256 roomNumber) external {
        require(userSignUp[msg.sender], "User must sign up first");
        Game game = games[roomNumber];
        game.joinGame(msg.sender);
        emit GameJoined(roomNumber, msg.sender);
        hasGameStarted[address(game)] = true;
    }

    function endGame(uint256 roomNumber) external {
        Game game = games[roomNumber];
        require(hasGameStarted[address(game)], "Game not started");
        game.completeGame(msg.sender);

        (address winner, uint256 timeTaken, uint8 gameType) = game.getGameDetails(roomNumber);

        Player storage winnerPlayer = players[winner];
        winnerPlayer.totalGamesPlayed++;
        winnerPlayer.totalGamesWon++;

        leaderboard[roomNumber] = LeaderboardEntry({
            winner: winner,
            timeTaken: timeTaken,
            roomNumber: roomNumber,
            gameType: gameType,
            timestamp: block.timestamp
        });

        emit GameEnded(roomNumber, winner);
        emit LeaderboardUpdated(roomNumber, winner);

        hasGameStarted[address(game)] = false;
        delete games[roomNumber];
    }

    function getPlayerStats(address player) external view returns (Player memory) {
        return players[player];
    }

    function getLeaderboardEntry(uint256 roomNumber) external view returns (LeaderboardEntry memory) {
        return leaderboard[roomNumber];
    }
}

