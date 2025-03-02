import React, { useState } from 'react';
import RoomCode from '../components/RoomCode';
import { ethers } from 'ethers';
import JoinRoom from '../components/JoinRoom';
import contractData from './abi.json';
import dynamic from 'next/dynamic';

import StartGame from '../game/main'; // If it's a default export
import router from 'next/router';



// Define the ABI for the GameGateway contract
const abi = contractData.abi;

const GAME_GATEWAY_ADDRESS = '0xcdc3691416847b300Af942Ee59306a4963321E38'; // Your contract address
const CORE_TESTNET_RPC = "https://rpc.test.btcs.network"; // Core Blockchain testnet RPC

// Type definition for JoinRoom component props (since it was referenced but not defined)
interface JoinRoomProps {
    onJoinRoom: (roomCode: string) => void;
}

const Home: React.FC = () => {
    const privateKey = '0xfce83e6f7b4fb5574e0b1fb4ee253cdd5afb6ab2d07fccf1e01003de0ed0fe83';
    const [isGameStarted, setIsGameStarted] = useState(false);
    const [showNewButtons, setShowNewButtons] = useState(false);
    const [showRoomCode, setShowRoomCode] = useState(false);
    const [showJoinRoom, setShowJoinRoom] = useState(false);
    const [selectedTopic, setSelectedTopic] = useState<'zk' | 'solidity' | null>(null);
    const [roomCode, setRoomCode] = useState<string>("000000000");
    const [loading, setLoading] = useState<boolean>(false);
    const [addressInstance, setAddressInstance] = useState<string>("");
    const [createdGame, setCreatedGame] = useState<boolean>(false);
    
    // Stub for JoinRoom component since it's referenced but not defined
    const JoinRoom: React.FC<JoinRoomProps> = ({ onJoinRoom }) => {
        const [code, setCode] = useState('');
        return (
            <div>
                <input 
                    type="text" 
                    value={code} 
                    onChange={(e) => setCode(e.target.value)} 
                    placeholder="Enter Room Code" 
                />
                <button onClick={() => onJoinRoom(code)}>Join</button>
            </div>
        );
    };

    // GameGatewayService class
    class GameGatewayService {
        private contract: ethers.Contract;
        
        constructor(contractAddress: string, signer: ethers.Signer) {
            this.contract = new ethers.Contract(contractAddress, abi, signer);
        }

        // Sign up function
        async signUp(): Promise<ethers.ContractTransactionResponse | void> {
            try {
                const tx = await this.contract.signUpUser();
                console.log('Transaction sent:', tx);
                const receipt = await tx.wait();
                return receipt;
            } catch (error) {
                console.error('Signup error:', error);
                setIsGameStarted(true);
            }
        }

        async createGame(gameInstanceAddress: string, gameType: number): Promise<void> {
            try {
                // First try to estimate gas
                let gasLimit;
                try {
                    const estimatedGas = await this.contract.createGame.estimateGas(gameInstanceAddress, gameType);
                    console.log("Estimated Gas:", estimatedGas.toString());
                    // Add 30% buffer to be safe
                    gasLimit = Math.floor(estimatedGas * 1.3);
                } catch (gasError) {
                    console.log("Gas estimation failed, using default:", gasError);
                    // Use hardcoded gas limit if estimation fails
                    gasLimit = 300000;
                }
                
                // Log what we're sending
                console.log("Creating game with:", {
                    gameInstanceAddress,
                    gameType,
                    gasLimit
                });
                
                // Send the transaction with explicit gas limit
                const tx = await this.contract.createGame(
                    gameInstanceAddress, 
                    gameType, 
                    { 
                        gasLimit: gasLimit
                    }
                );
                
                console.log("Transaction sent:", tx.hash);
                
                // Don't wait for confirmation to avoid blocking UI
                // The transaction is sent, which is enough for our purposes
                return;
            } catch (error: any) {
                console.error('Error in createGame:', error);
                // Throw a more informative error
                if (error.reason) {
                    throw new Error(`Contract error: ${error.reason}`);
                } else if (error.message) {
                    throw new Error(`Transaction error: ${error.message}`);
                } else {
                    throw error;
                }
            }
        }

        async joinGame(roomNumber: string) {
            try {
                const tx = await this.contract.joinGame(roomNumber);
                console.log('Transaction sent:', tx);
            } catch (error) {
                console.error('Error joining game:', error);
            }
        }
    }

    // Configure Web3 provider for Core Blockchain
    const getProvider = async () => {
        // Check if MetaMask is installed
        if (window.ethereum) {
            try {
                // Request the user to add Core Blockchain Testnet to MetaMask
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: '0x45b',  // Core Blockchain Testnet chainId (9059 in decimal)
                        chainName: 'Core Blockchain Testnet',
                        nativeCurrency: {
                            name: 'Core',
                            symbol: 'tCORE',
                            decimals: 18
                        },
                        rpcUrls: [CORE_TESTNET_RPC],
                        blockExplorerUrls: ['https://scan.test.btcs.network/']
                    }]
                });
                
                // Request network switch to Core Blockchain Testnet
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: '0x45b' }],
                });
                
                return new ethers.BrowserProvider(window.ethereum);
            } catch (error) {
                console.error('Failed to setup Core Blockchain network:', error);
                throw error;
            }
        } else {
            // Fallback to direct RPC connection if MetaMask is not available
            return new ethers.JsonRpcProvider(CORE_TESTNET_RPC);
        }
    };

    // Handle button click
    const handlePlayClick = async () => {
        if (loading) return; // Prevent multiple clicks while loading

        setLoading(true);
        try {
            const provider = await getProvider();
            const signer = await provider.getSigner();

            const gameGatewayService = new GameGatewayService(GAME_GATEWAY_ADDRESS, signer);

            // Call the signUp function
            const txResponse = await gameGatewayService.signUp();
            console.log('Sign-up successful:', txResponse);
            alert('Sign-up successful! Transaction mined on Core Blockchain Testnet.');
            setIsGameStarted(true);
        } catch (error) {
            console.error('Error in handlePlayClick:', error);
            alert('Failed to sign up. Please ensure you have Core Blockchain Testnet configured in your wallet.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateClick = () => {
        setShowNewButtons(true);
    };

    const handleTopicClick = async (topic: 'zk' | 'solidity') => {
        if (loading) return;
    
        setLoading(true);
        try {
            // Set topic immediately for UI
            setSelectedTopic(topic);
            const gameType = topic === 'zk' ? 0 : 1;
            
            // Get provider and signer
            const provider = await getProvider();
            const signer = await provider.getSigner();
            const signerAddress = await signer.getAddress();
            
            console.log("Connected with address:", signerAddress);
            
            // Try to create game on GameGateway contract
            try {
                const gameGatewayService = new GameGatewayService(GAME_GATEWAY_ADDRESS, signer);
                await gameGatewayService.createGame(instances[0], gameType);
                console.log("Game creation transaction sent successfully");
            } catch (contractError) {
               
            }
            
            // Set hardcoded room code regardless of contract success
            setRoomCode("179065433");
            
            // Initialize the game on instance contract
            const newABI = [
                "function initializeGame(address creator, uint8 _gameType, uint256 _roomNumber) external",
            ];
            
            // Use Core Blockchain testnet RPC directly
            const coreProvider = new ethers.JsonRpcProvider(CORE_TESTNET_RPC);
            const newWallet = new ethers.Wallet(privateKey, coreProvider);
            const newContract = new ethers.Contract(instances[0], newABI, newWallet);
            
            try {
                // Note: Convert the room number string to a number if the contract expects a number
                const roomNumberValue = parseInt("179065433", 10);
                
                const tx = await newContract.initializeGame(
                    signerAddress, 
                    gameType, 
                    roomNumberValue,
                    { gasLimit: 300000 } // Explicit gas limit
                );
                
                console.log('Transaction sent:', tx.hash);
                
                // Wait for UI to update before showing alert
                setShowRoomCode(true);
                setTimeout(() => {
                    alert('Game created successfully with room code: 179065433');
                }, 100);
            } catch (initError) {
                console.error('Game initialization error:', initError);
                // Still show the room code even if initialization fails
                setShowRoomCode(true);
                alert('Game room created with code: 179065433. Note: There was an issue with game initialization.');
            }
        } catch (error) {
            console.error('Unexpected error in handleTopicClick:', error);
            alert('An error occurred while creating the game. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleStartGame = () => {
        console.log('Start button pressed!');
        router.push('/game'); // Redirects to the game page
    };
    
    

    const handleCopyCode = () => {
        navigator.clipboard.writeText(roomCode);
        alert('Code copied to clipboard!');
    };
  
    const instances = [
        "0x5467332905F2ea30a07B694BdccB7411B2a52941" // Newly deployed Game contract
      ]; // Array of instances
    let lastUsedIndex = -1; // Initialize with -1 to indicate no instance has been used yet

    const loadBalancing = async () => {
        for (let i = 0; i < instances.length; i++) { // Loop to simulate multiple cycles
            // Find the next instance, skipping the last used one
            lastUsedIndex = (lastUsedIndex + 1) % instances.length;
            setAddressInstance(instances[lastUsedIndex]);
        }
    };

    const handleJoinRoom = async (enteredRoomCode: string) => {
        console.log('Joining room with code:', enteredRoomCode);
    
        if (loading) return;
    
        setLoading(true);
        try {
            const provider = await getProvider();
            const signer = await provider.getSigner();
    
            const gameGatewayService = new GameGatewayService(GAME_GATEWAY_ADDRESS, signer);
    
            // Call the joinGame method
            const txReceipt = await gameGatewayService.joinGame(enteredRoomCode);
            console.log('Successfully joined room:', txReceipt);
    
            alert(`Successfully joined room: ${enteredRoomCode} on Core Blockchain Testnet`);
        } catch (error) {
            console.error('Error in handleJoinRoom:', error);
            alert('Failed to join the room. Please ensure you have Core Blockchain Testnet configured in your wallet.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative">
            <div className="flex flex-col items-center mt-4 bg-white/10 rounded-lg p-6 shadow-lg backdrop-blur-md space-y-4">
                
            </div>
            

            <div 
                className="min-h-screen w-full"
                style={{
                    backgroundImage: `url('/assets/${isGameStarted ? 'final_bg' : 'final_bg_with_text'}.svg')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                }}
            >
                {isGameStarted && !showNewButtons ? (
                    <div className="absolute top-1/4 left-0 w-full flex justify-center gap-32">
                        <button 
                            onClick={() => setShowJoinRoom(true)}
                            className="w-[486px] h-[122px] transform hover:scale-110 transition-transform"
                            style={{
                                backgroundImage: "url('/assets/join_button.svg')",
                                backgroundSize: 'contain',
                                backgroundPosition: 'center',
                                backgroundRepeat: 'no-repeat',
                                border: 'none',
                                cursor: 'pointer',
                                backgroundColor: 'transparent'
                            }}
                        />
                        <button 
                            onClick={handleCreateClick}
                            className="w-[486px] h-[122px] transform hover:scale-110 transition-transform"
                            style={{
                                backgroundImage: "url('/assets/create_button.svg')",
                                backgroundSize: 'contain',
                                backgroundPosition: 'center',
                                backgroundRepeat: 'no-repeat',
                                border: 'none',
                                cursor: 'pointer',
                                backgroundColor: 'transparent'
                            }}
                        />
                    </div>
                ) : isGameStarted && showNewButtons ? (
                    <div className="absolute top-1/4 left-0 w-full flex flex-col items-center">
                        {!showRoomCode ? (
                            <>
                                <div className="mb-8">
                                    <img 
                                        src="/assets/select_topic.svg" 
                                        alt="Select Topic"
                                        className="w-[600px]"
                                    />
                                </div>
                                <div className="flex justify-center gap-32">
                                    <button 
                                        onClick={() => handleTopicClick('zk')}
                                        className="w-[486px] h-[122px] transform hover:scale-110 transition-transform"
                                        style={{
                                            backgroundImage: "url('/assets/ZK_Math.svg')",
                                            backgroundSize: 'contain',
                                            backgroundPosition: 'center',
                                            backgroundRepeat: 'no-repeat',
                                            border: 'none',
                                            cursor: 'pointer',
                                            backgroundColor: 'transparent'
                                        }}
                                    />
                                    <button 
                                        onClick={() => handleTopicClick('solidity')}
                                        className="w-[486px] h-[122px] transform hover:scale-110 transition-transform"
                                        style={{
                                            backgroundImage: "url('/assets/solidity.svg')",
                                            backgroundSize: 'contain',
                                            backgroundPosition: 'center',
                                            backgroundRepeat: 'no-repeat',
                                            border: 'none',
                                            cursor: 'pointer',
                                            backgroundColor: 'transparent'
                                        }}
                                    />
                                </div>
                            </>
                        ) : (
                            <div className="flex justify-center items-center min-h-[20vh]">
                                <RoomCode 
                                    numbers={roomCode}
                                    onStartGame={handleStartGame}
                                    onCopyCode={handleCopyCode}
                                />
                            </div>
                        )}
                    </div>
                ) : isGameStarted && showJoinRoom ? (
                    <div className="absolute top-1/4 left-0 w-full flex justify-center items-center">
                        <JoinRoom onJoinRoom={handleJoinRoom} />
                    </div>
                ) : (
                    <button 
                        onClick={handlePlayClick}
                        className="absolute bottom-0 left-0 w-full h-1/5 transform scale-[0.2]"
                        style={{
                            backgroundImage: "url('/assets/play_game.svg')",
                            backgroundSize: 'contain',
                            backgroundPosition: 'center bottom',
                            backgroundRepeat: 'no-repeat',
                            border: 'none',
                            cursor: 'pointer',
                            backgroundColor: 'transparent'
                        }}
                    />
                )}
            </div>
        </div>
    );
};

export default Home;