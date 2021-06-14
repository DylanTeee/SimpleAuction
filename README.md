# NFT Auction dApp

## Description
An NFT auction repository to track ongoing and existing auctions.

## How to run
1. Start a node, this will run a local development network to deploy your contracts to. `npm hardhat node`
2. Compile your contracts with `npm hardhat compile`, if changes were made, run `npm hardhat test` to ensure it doesn't break.
3. Deploy your contracts to the network. `npx hardhat run scripts/deploy.js --network localhost`
4. Copy the addresses of your contracts deployed to `App.js`, move `artifacts` to /src.
5. Connect to the hardhat node in metamask. Add it there as custom rpc with chain id `31337` connecting to `http://127.0.0.1:8545`
6. Run `npm start`
