const { expect } = require("chai");
const { ethers } = require("hardhat");


// `describe` is a mocha function that allows you to organize your tests
describe("Deployment", function() {

    it("Deployment should assign a token to the owner", async function() {
        // signer is an object representing an eth account, keep the first account
        const [owner] = await ethers.getSigners();

        // abstraction in ethers.js to deploy new smart contracts. Token is a factory for instances of token contract
        const hardhatToken = await ethers.getContractFactory("SwiftNFT");

        // returns a promise that resolves to a contract
        const Token = await hardhatToken.deploy();

        await Token.createCollectible(owner.address, "ipfs://QmZhQho7NniB1pZLzAz9aZzHFw2M7jyZm2bmStFshYWURT");

        expect(await Token.balanceOf(owner.address)).to.equal(1);
    });
});

describe("Interaction with NFT", function() {
    it("Transaction should transfer token to an address", async function() {

        // console.log(Object.keys(Token));
        // Since more than one of the same function
        const [owner, addr1, addr2] = await ethers.getSigners();

        const hardhatToken = await ethers.getContractFactory("SwiftNFT");

        const Token = await hardhatToken.deploy();

        await Token.createCollectible(owner.address, "ipfs://QmZhQho7NniB1pZLzAz9aZzHFw2M7jyZm2bmStFshYWURT");

        await Token["safeTransferFrom(address,address,uint256)"](owner.address, addr1.address, 1);
        await Token.connect(addr1)["safeTransferFrom(address,address,uint256)"](addr1.address, addr2.address, 1);

        expect(await Token.ownerOf(1)).to.equal(addr2.address);
    });
});



describe("Interaction with auction repo", async function() {

    let Token;
    let Repo;
    let auction;
    let owner;
    let provider;
    let hardhatToken;
    let hardhatRepo;
    let hardhatAuction;


    beforeEach(async function() {

        provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");

        // signer is an object representing an eth account, keep the first account
        [owner] = await ethers.getSigners();

        hardhatToken = await ethers.getContractFactory("SwiftNFT")
        Token = await hardhatToken.deploy();
        await Token.createCollectible(owner.address, "ipfs://QmZhQho7NniB1pZLzAz9aZzHFw2M7jyZm2bmStFshYWURT");

        hardhatRepo = await ethers.getContractFactory("AuctionRepo");
        Repo = await hardhatRepo.deploy();
    });

    it("Creating an auction", async function() {
        // address of beneficiary, ERC721 token address, token Id, time allocated, starting bid
        await Repo.createAuction(owner.address, Token.address, 1, 120, 10000000000);
        auctionInfo = await Repo.getAuction(0);
        auctionAddress = auctionInfo._auctionContract;

        hardhatAuction = await ethers.getContractFactory("SimpleAuction");
        auction = new ethers.Contract(auctionAddress, hardhatAuction.interface, provider)

        let exists = await provider.getCode(auction.address);
        expect(exists != "0x");

        expect(Repo.getAuctionsOwned(owner.address) == 1);
        expect(Repo.getAuctionsCount() == 1);
        expect(Repo.getBeneficiariesCount() == 1);
    });
});

describe("Interaction with auction contract", function() {

    let Token;
    let Repo;
    let auction;
    let owner;
    let addr1;
    let addr2;
    let addr3;
    let provider;
    let hardhatToken;
    let hardhatRepo;
    let hardhatAuction;


    beforeEach(async function() {

        provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");

        // signer is an object representing an eth account, keep the first account
        [owner, addr1, addr2, addr3] = await ethers.getSigners();

        // abstraction in ethers.js to deploy new smart contracts. Token is a factory for instances of token contract
        hardhatToken = await ethers.getContractFactory("SwiftNFT")
            // returns a promise that resolves to a contract
        Token = await hardhatToken.deploy();

        await Token.createCollectible(owner.address, "ipfs://QmZhQho7NniB1pZLzAz9aZzHFw2M7jyZm2bmStFshYWURT");

        hardhatRepo = await ethers.getContractFactory("AuctionRepo");
        Repo = await hardhatRepo.deploy();

        let tx = await Repo.createAuction(owner.address, Token.address, 1, 120, 10000000000);
        auctionInfo = await Repo.getAuction(0);
        auctionAddress = auctionInfo._auctionContract;
        hardhatAuction = await ethers.getContractFactory("SimpleAuction");
        auction = new ethers.Contract(auctionAddress, hardhatAuction.interface, provider)

        let exists = await provider.getCode(auction.address);
        expect(exists != "0x");

        await Token["safeTransferFrom(address,address,uint256)"](owner.address, auction.address, 1);
        expect(await Token.ownerOf(1)).to.equal(auction.address);

    });

    it("Starting an auction", async function() {

        expect(await auction.connect(owner).startAuction());

    });

    it("Participant able to bid", async function() {

        await auction.connect(owner).startAuction();

        let overrides = {
            value: ethers.utils.parseEther("1.0")
        };

        await auction.connect(addr1).bid(overrides);

        expect(await auction.connect(addr1).bidAmountStored() == "10000000000");
        expect(await auction.getHighestBid() == addr1.address, "10000000000");
        expect(await auction.getBidsPlaced() == 1);
        expect(await auction.getNumBidders() == 1);
        expect(await auction.getBidderAddress(0) == addr1.address);
        expect(await auction.getBid(0) == "0", addr1.address, "10000000000");
    });

    it("Auction ending with bids", async function() {
        await auction.connect(owner).startAuction();

        await auction.connect(addr1).bid({ value: 10000000000 });
        await auction.connect(addr2).bid({ value: 20000000000 });

        await network.provider.send("evm_increaseTime", [120]);

        await auction.connect(owner).auctionEnd();
        expect(await auction.auctionEnded() == "true");
        expect(await Token.ownerOf(1)).to.equal(addr2.address);
        expect(await auction.getBidsPlaced() == 2);
        expect(await auction.getNumBidders() == 2);
        expect(await auction.getBidderAddress(1) == addr2.address);
    });

    it("Auction ending without bids", async function() {
        await auction.connect(owner).startAuction();

        await network.provider.send("evm_increaseTime", [120]);
        await auction.connect(owner).auctionEnd();

        expect(await auction.auctionEnded() == "true");
        expect(await Token.ownerOf(1)).to.equal(owner.address);
    });

    it("Losers withdrawing after auction has ended", async function() {
        await auction.connect(owner).startAuction();
        await auction.connect(addr1).bid({ value: 10000000000 });
        await auction.connect(addr2).bid({ value: 20000000000 });
        await auction.connect(addr3).bid({ value: 30000000000 });

        await network.provider.send("evm_increaseTime", [120]);
        await auction.connect(owner).auctionEnd();

        expect(await auction.auctionEnded() == "true");
        expect(await Token.ownerOf(1)).to.equal(addr3.address);

        expect(await auction.connect(addr1).bidAmountStored() == "10000000000");
        expect(await auction.connect(addr2).bidAmountStored() == "20000000000");

        await auction.connect(addr1).withdraw();
        await auction.connect(addr2).withdraw();

        expect(await auction.connect(addr1).bidAmountStored() == "0");
        expect(await auction.connect(addr2).bidAmountStored() == "0");
        expect(await auction.connect(addr3).bidAmountStored() == "0");

    });

    it("Auction cancelled with bids", async function() {
        await auction.connect(owner).startAuction();

        await auction.connect(addr1).bid({ value: 10000000000 });
        await auction.connect(addr2).bid({ value: 20000000000 });

        await auction.connect(owner).auctionCancel();

        expect(await auction.auctionEnded() == "true");
        expect(await Token.ownerOf(1)).to.equal(owner.address);
    });

    it("Auction cancelled without bids", async function() {
        await auction.connect(owner).startAuction();

        await auction.connect(owner).auctionCancel();

        expect(await auction.auctionEnded() == "true");
        expect(await Token.ownerOf(1)).to.equal(owner.address);
    });


    it("Losers withdrawing after auction has cancelled", async function() {
        await auction.connect(owner).startAuction();
        await auction.connect(addr1).bid({ value: 10000000000 });
        await auction.connect(addr2).bid({ value: 20000000000 });
        await auction.connect(addr3).bid({ value: 30000000000 });

        await auction.connect(owner).auctionCancel();

        expect(await auction.auctionEnded() == "true");
        expect(await Token.ownerOf(1)).to.equal(owner.address);

        expect(await auction.connect(addr1).bidAmountStored() == "10000000000");
        expect(await auction.connect(addr2).bidAmountStored() == "20000000000");

        await auction.connect(addr1).withdraw();
        await auction.connect(addr2).withdraw();

        expect(await auction.connect(addr1).bidAmountStored() == "0");
        expect(await auction.connect(addr2).bidAmountStored() == "0");
        expect(await auction.connect(addr3).bidAmountStored() == "0");

    });

    it("HighestBidder withdrawing before auction ended", async function() {
        await auction.connect(owner).startAuction();
        await auction.connect(addr1).bid({ value: 10000000000 });
        await auction.connect(addr2).bid({ value: 20000000000 });
        await auction.connect(addr3).bid({ value: 30000000000 });

        await auction.connect(addr3).withdraw();

        await network.provider.send("evm_increaseTime", [120]);
        await auction.connect(owner).auctionEnd();

        expect(await auction.auctionEnded() == "true");
        expect(await Token.ownerOf(1)).to.equal(addr2.address);

        expect(await auction.connect(addr1).bidAmountStored() == "10000000000");
        expect(await auction.connect(addr2).bidAmountStored() == "0");
        expect(await auction.connect(addr3).bidAmountStored() == "0");

        await auction.connect(addr1).withdraw();

        expect(await auction.connect(addr1).bidAmountStored() == "0");
    });

    it("All bidders withdrawing before auction ended", async function() {
        await auction.connect(owner).startAuction();
        await auction.connect(addr1).bid({ value: 10000000000 });
        await auction.connect(addr2).bid({ value: 20000000000 });
        await auction.connect(addr3).bid({ value: 30000000000 });

        await auction.connect(addr1).withdraw();
        await auction.connect(addr2).withdraw();
        await auction.connect(addr3).withdraw();

        await network.provider.send("evm_increaseTime", [120]);
        await auction.connect(owner).auctionEnd();

        expect(await auction.auctionEnded() == "true");
        expect(await Token.ownerOf(1)).to.equal(owner.address);

        expect(await auction.connect(addr1).bidAmountStored() == "0");
        expect(await auction.connect(addr2).bidAmountStored() == "0");
        expect(await auction.connect(addr3).bidAmountStored() == "0");
    });
});


describe("Dealing with errors", function() {

    let Token;
    let Repo;
    let auction;
    let owner;
    let addr1;
    let provider;
    let hardhatToken;
    let hardhatRepo;
    let hardhatAuction;


    beforeEach(async function() {

        provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");

        // signer is an object representing an eth account, keep the first account
        [owner, addr1] = await ethers.getSigners();

        // abstraction in ethers.js to deploy new smart contracts. Token is a factory for instances of token contract
        hardhatToken = await ethers.getContractFactory("SwiftNFT")
            // returns a promise that resolves to a contract
        Token = await hardhatToken.deploy();

        await Token.createCollectible(owner.address, "ipfs://QmZhQho7NniB1pZLzAz9aZzHFw2M7jyZm2bmStFshYWURT");

        hardhatRepo = await ethers.getContractFactory("AuctionRepo");
        Repo = await hardhatRepo.deploy();

        let tx = await Repo.createAuction(owner.address, Token.address, 1, 120, 10000000000);
        auctionInfo = await Repo.getAuction(0);
        auctionAddress = auctionInfo._auctionContract;
        hardhatAuction = await ethers.getContractFactory("SimpleAuction");
        auction = new ethers.Contract(auctionAddress, hardhatAuction.interface, provider)

        let exists = await provider.getCode(auction.address);
        expect(exists != "0x");


    });

    it("Revert if owner does not have token", async function() {

        await Token["safeTransferFrom(address,address,uint256)"](owner.address, addr1.address, 1);

        await expect(
            Token["safeTransferFrom(address,address,uint256)"](owner.address, auction.address, 1)
        ).to.be.reverted;
    });

    it("Revert if owner transfers wrong token", async function() {

        await Token.createCollectible(owner.address, "ipfs://QmZhQho7NniB1pZLzAz9aZzHFw2M7jyZm2bmStFshYWURT");

        // Transfer incorrect token to auction
        await Token["safeTransferFrom(address,address,uint256)"](owner.address, auction.address, 2);

        await expect(
            auction.startAuction()
        ).to.be.reverted;
    });

    it("Revert if bid before auction start", async function() {
        await Token["safeTransferFrom(address,address,uint256)"](owner.address, auction.address, 1);

        await expect(
            auction.connect(addr1).bid({ value: 10000000000 })
        ).to.be.reverted;
    });

    it("Revert if owner bids in the auction", async function() {
        await Token["safeTransferFrom(address,address,uint256)"](owner.address, auction.address, 1);
        await auction.connect(owner).startAuction();

        await expect(
            auction.connect(owner).bid({ value: 10000000000 })
        ).to.be.reverted;
    });
    it("Revert if bid too low", async function() {
        await Token["safeTransferFrom(address,address,uint256)"](owner.address, auction.address, 1);
        await auction.connect(owner).startAuction();

        await expect(
            auction.connect(addr1).bid({ value: 500 })
        ).to.be.reverted;
    });
    it("Revert if bidding without withdrawal", async function() {
        await Token["safeTransferFrom(address,address,uint256)"](owner.address, auction.address, 1);
        await auction.connect(owner).startAuction();

        await auction.connect(addr1).bid({ value: 10000000000 });

        await expect(
            auction.connect(addr1).bid({ value: 20000000000 })
        ).to.be.reverted;
    });

    it("Revert if withdrawing zero balance", async function() {

        await Token["safeTransferFrom(address,address,uint256)"](owner.address, auction.address, 1);
        await auction.connect(owner).startAuction();

        await expect(
            auction.connect(addr1).withdraw()
        ).to.be.reverted;

    });

    it("Revert if end auction after auction ended", async function() {

        await Token["safeTransferFrom(address,address,uint256)"](owner.address, auction.address, 1);
        await auction.connect(owner).startAuction();
        await network.provider.send("evm_increaseTime", [120]);
        await auction.connect(owner).auctionEnd();

        await expect(
            auction.connect(owner).auctionEnd()
        ).to.be.reverted;
    });

    it("Revert if cancel auction after auction cancelled/ended", async function() {
        await Token["safeTransferFrom(address,address,uint256)"](owner.address, auction.address, 1);
        await auction.connect(owner).startAuction();
        await network.provider.send("evm_increaseTime", [120]);
        await auction.connect(owner).auctionEnd();

        await expect(
            auction.connect(owner).auctionCancel()
        ).to.be.reverted;
    });

    it("Revert if bid after auction cancelled/ended", async function() {
        await Token["safeTransferFrom(address,address,uint256)"](owner.address, auction.address, 1);
        await auction.connect(owner).startAuction();
        await network.provider.send("evm_increaseTime", [120]);
        await auction.connect(owner).auctionEnd();

        await expect(
            auction.connect(addr1).bid({ value: 10000000000 })
        ).to.be.reverted;
    });

    it("Revert if bid before auction started", async function() {
        await Token["safeTransferFrom(address,address,uint256)"](owner.address, auction.address, 1);

        await expect(
            auction.connect(addr1).bid({ value: 10000000000 })
        ).to.be.reverted;
    });

});