import './App.css';
import { useState } from 'react';
import { ethers } from 'ethers';
import Token from "./artifacts/contracts/SwiftNFT.sol/SwiftNFT.json";
import Repo from "./artifacts/contracts/AuctionRepo.sol/AuctionRepo.json";


// Update with the contract address logged out to the CLI when it was deployed 
const tokenAddress = "0x32EEce76C2C2e8758584A83Ee2F522D4788feA0f";
const repoAddress = "0x01c1DeF3b91672704716159C9041Aeca392DdFfb";

function App() {
    // store tokenId in local state
    // returns a pair of values: the current state and a function that updates it.
    const [tokenId, setTokenId] = useState();
    const [biddingTime, setBidTime] = useState();
    const [startingBid, setStartingBid] = useState();

    // request access to the user's MetaMask account
    async function requestAccount() {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
    }

    // call the smart contract, mint token
    async function mintToken() {
        if (typeof window.ethereum !== 'undefined') {
            await requestAccount();
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const contract = new ethers.Contract(tokenAddress, Token.abi, signer);
            let signerAddress = await signer.getAddress();
            console.log("Account:", signerAddress);

            try {
                const tx = await contract.createCollectible(signerAddress, "ipfs://QmZhQho7NniB1pZLzAz9aZzHFw2M7jyZm2bmStFshYWURT");
                console.log('data: ', tx);
            } catch (err) {
                console.log("Error: ", err);
            }
        }
    }

    // call the smart contract, create auction
    async function createAuction() {
        if (!tokenId) return;
        if (typeof window.ethereum !== 'undefined') {
            await requestAccount();
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const contract = new ethers.Contract(repoAddress, Repo.abi, signer);
            try {
                const tx = await contract.createAuction(signer.getAddress(), tokenAddress, tokenId, biddingTime, startingBid);
                console.log(await contract.getAuction(0));
                console.log('data: ', tx);
            } catch (err) {
                console.log("Error: ", err);
            }

        }
    }

    return ( <
        div className = "App" >
        <
        header className = "App-header" >
        <
        button onClick = { mintToken } > Mint Token < /button> <
        button onClick = { createAuction } > Create Auction < /button> <
        input onChange = { e => setTokenId(e.target.value) }
        placeholder = "Token Id" / >
        <
        input onChange = { e => setBidTime(e.target.value) }
        placeholder = "Bidding Time" / >
        <
        input onChange = { e => setStartingBid(e.target.value) }
        placeholder = "Bid Amount" / >
        <
        /header> < /
        div >
    );
}

export default App;