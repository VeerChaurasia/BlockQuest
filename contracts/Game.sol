// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

contract Game {
    uint256 player1Time;
    uint256 player2Time;
    // Game state tracking
    address public player1;
    address public player2;
    uint8 public gameType;
    uint256 public roomNumber;
    uint256 public gameStartTime;

    // Game state flags
    bool public player1Joined;
    bool public player2Joined;
    bool public player1Completed;
    bool public player2Completed;

    // Events
    event GameInitialized(uint256 indexed roomNumber, address indexed creator, uint8 gameType);
    event PlayerJoined(uint256 indexed roomNumber, address indexed player);
    event GameCompleted(uint256 indexed roomNumber, address indexed winner);

    // Enum for different game types
    enum GameType {
        Solidity,
        JavaScript,
        ZkMath,
        CryptoGraphy,
        AccountAbstraction,
        Layer2
    }

    // Modifier to restrict access to game creator or joined players
    modifier onlyGameParticipants() {
        require(
            msg.sender == player1 || msg.sender == player2, 
            "Not a game participant"
        );
        _;
    }
    
    constructor() {}
    
    // Initialize game with first player
    function initializeGame(address creator, uint8 _gameType, uint256 _roomNumber) external {
        require(player1 == address(0), "Game already initialized");
        
        player1 = creator;
        player1Joined = true;
        gameType = _gameType;
        roomNumber = _roomNumber;
        
        emit GameInitialized(_roomNumber, creator, _gameType);
    }

    // Second player joins the game
    function joinGame(address player) external {
        require(!player2Joined, "Game is full");
        require(player != player1, "Cannot join own game");
        
        player2 = player;
        player2Joined = true;
        gameStartTime = block.timestamp;
        
        emit PlayerJoined(roomNumber, player);
    }

    // Check if game is ready to start
    function isGameReady() external view returns (bool) {
        return player1Joined && player2Joined;
    }

    // Player completes their game
    function completeGame(address user) external {
        if (user == player1) {
            require(!player1Completed, "Already completed");
            player1Completed = true;
            player1Time = block.timestamp - gameStartTime;
        } else {
            require(!player2Completed, "Already completed");
            player2Completed = true;
            player2Time = block.timestamp - gameStartTime;
        }
    }

    // Function to get game details
    function getGameDetails(uint256 _roomNumber) external view returns (address winner, uint256 timeTaken, uint8 gameTypeResult) {
        require(_roomNumber == roomNumber, "Invalid room number");
        require(player1Completed && player2Completed, "Game not completed");

        // Determine winner based on time taken
        if (player1Time < player2Time) {
            winner = player1;
            timeTaken = player1Time;
        } else {
            winner = player2;
            timeTaken = player2Time;
        }

        gameTypeResult = gameType;
    }

    // Internal function to reset game state
    function _resetGame() internal {
        player1 = address(0);
        player2 = address(0);
        player1Joined = false;
        player2Joined = false;
        player1Completed = false;
        player2Completed = false;
        gameStartTime = 0;
    }

    // Admin function to force reset game
    function adminResetGame() external {
        _resetGame();
    }
}
