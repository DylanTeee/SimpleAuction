// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.4;

import "./AuctionRepo.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";

contract SimpleAuction is ERC721Holder{
    
    ERC721 public token;
    AuctionRepo public repo;
    
    uint public tokenId;
    uint public auctionId;
    // Index of total bids 
    uint public currentBidIdx;
    uint public startingBid;
    uint public timeAllocated;
    uint public auctionEndTime;
    address payable public beneficiary;
    address public highestBidder;
    
    // Keeps track of bid history
    struct Bid {
        uint bidId;
        address from;
        uint256 amount;
    }
    mapping(uint => Bid) bidsRepo;
    
    // Keeps track of current value held in contract
    address[] bidders;
    // address is assigned index
    mapping(address => uint) biddersRepo;
    // address is assigned bid amount
    mapping(address => uint) bidAmount;

    bool cancelled;
    bool ended;
    bool started;
    
    event AuctionStarted();
    event HighestBidIncreased(address bidder, uint amount);
    event AuctionEnded(address winner, uint amount);
    event AuctionCancelled();
    
    
    modifier tokenOwner() {
        require(address(this) == token.ownerOf(tokenId), "Contract lacks an auction item");
        _;
    }
    
    modifier disallowOwner() {
        require(msg.sender != beneficiary, "Owner not allowed to participate");
        _;
    }
    
    modifier onlyOwner() {
        require(msg.sender == beneficiary, "Not the owner of the auction");
        _;
    }
    
    modifier begun() {
        require(started == true, "Contract has not begun");
        _;
    }

    /// The auction has already ended.
    error AuctionAlreadyEnded(uint _auctionEndTime );
    /// There is already a higher or equal bid.
    error BidNotHighEnough(uint _highestBid);
    /// The auction has not ended yet.
    error AuctionNotYetEnded();
    /// The function auctionEnd has already been called.
    error AuctionEndAlreadyCalled();
    /// The bid passed in is too low
    error BidTooLow(uint _startingBid);
    /// You have already placed a bid, withdraw to overbid
    error BidExisting(uint amt);
    /// You have no bids placed
    error noBids();
    /// The auction has ended, highest bidder funds locked
    error highestBidderFunds();

    constructor(address _repoAddress,
                 address payable _beneficiary, 
                 ERC721 _tokenAddress, 
                 uint _tokenId, 
                 uint _biddingTime,
                 uint _auctionId,
                 uint _startingBid){

        beneficiary = _beneficiary;
        timeAllocated = _biddingTime;
        token = _tokenAddress;
        tokenId = _tokenId;
        repo = AuctionRepo(_repoAddress);
        auctionId = _auctionId;
        startingBid = _startingBid;
    }
    
    
    function getHighestBid() public view begun returns (uint _highestBid, address _bidder) {
        uint amount = 0;
        address bidder;
        
        for (uint i=0; i<bidders.length; i++) {
            if (bidAmount[bidders[i]] > amount) {
                amount = bidAmount[bidders[i]];
                bidder = bidders[i];
            }
        }
        return (amount, bidder);
    }

    function getBidsPlaced() public view begun returns (uint bids) {
        return currentBidIdx;
    }

    function getNumBidders() public view begun returns (uint number) {
        return bidders.length;
    }
    
    function getBidderAddress(uint idx) public view begun returns (address bidder) {
        return bidders[idx];
    }

    function bidAmountStored() public view begun returns (uint amount) {
        return bidAmount[msg.sender];
    }

    function getBid(uint idx) public view begun returns (
        uint _bidId,
        address _bidder,
        uint _bidAmount
    ) {
        return (
            bidsRepo[idx].bidId,
            bidsRepo[idx].from,
            bidsRepo[idx].amount
        );
    }

    function auctionEnded() public view returns (bool) {
        return ended;
    }
    function getTokenId() public view returns (uint _id) {
        return tokenId;
    }
    
    function startAuction() tokenOwner onlyOwner public returns(bool) {
        require(started == false, "Auction has already started");
        auctionEndTime = block.timestamp + timeAllocated;
        started = true;
        emit AuctionStarted();
        
        return true;
    }
    
    

    /** 
     * @notice Bid on the auction with the value sent together with this transaction. 
     */ 
    function bid() public payable disallowOwner tokenOwner begun returns (uint _bidAmount) {
        
        (uint highestBid, address _highestBidder) = getHighestBid();

        
        if (block.timestamp > auctionEndTime) {
            revert AuctionAlreadyEnded(auctionEndTime);
        }    
        if (msg.value < startingBid) {
            revert BidTooLow(startingBid);
        }
        
        if (msg.value <= highestBid) {
            revert BidNotHighEnough(highestBid);
        }

        if (bidAmount[msg.sender] != 0) {
            revert BidExisting(bidAmount[msg.sender]);
        } 

        
        _highestBidder = msg.sender;
        highestBid = msg.value;
        
        // Keep a log of bid placed
        bidsRepo[currentBidIdx].bidId = currentBidIdx;
        bidsRepo[currentBidIdx].from = _highestBidder;
        bidsRepo[currentBidIdx].amount = highestBid;
        currentBidIdx += 1;
        
        // Updates current value of bid held in contract if any
        bidAmount[_highestBidder] += highestBid;

        emit HighestBidIncreased(_highestBidder, highestBid);

        // Gives address an index
        for (uint i=0; i<bidders.length; i++) {
            if (bidders[i] == _highestBidder) {
                return highestBid;
            }
        }

        bidders.push(_highestBidder);

        return highestBid;
    }

    /**
     * @notice Withdraws a bid that was overbid, use function to overbid current bid
     */
    function withdraw() public disallowOwner begun returns (bool) {

        if (bidAmount[msg.sender] == 0) {
            revert noBids();
        }
                
        if (msg.sender == highestBidder && ended == true && cancelled == false) {
            revert highestBidderFunds();
        }
        

        uint amount = bidAmount[msg.sender];
        if (amount > 0) {
            bidAmount[msg.sender] = 0;

            if (!payable(msg.sender).send(amount)) {
                bidAmount[msg.sender] = amount;
                return false;
            }
            
        }
        return true;
    }

    /**
     * @notice Ends the auction, distribute funds and change state of AuctionRepo
     */
    function auctionEnd() public onlyOwner tokenOwner begun {
        
        (uint highestBid, address _highestBidder) = getHighestBid(); 
        
        if (block.timestamp < auctionEndTime) {
            revert AuctionNotYetEnded();
        }
            
        if (ended) {
            revert AuctionEndAlreadyCalled();
        }
        
        if (highestBid != 0) {
            
            bidAmount[_highestBidder] = 0;
            
            // Transfers token to highest bidder
            token.safeTransferFrom(address(this), payable(_highestBidder), tokenId);
            
            // Transfers bid amount to beneficiary
            beneficiary.transfer(highestBid);
        } else {
            token.safeTransferFrom(address(this), payable(beneficiary), tokenId);
        }
        
        require(repo.endAuction(beneficiary, auctionId) == true,"Unable to change state");
        ended = true;
        highestBidder = _highestBidder;
        emit AuctionEnded(_highestBidder, highestBid);
    }

    
    /**
     * @notice Cancel the auction, distribute funds back to beneficiary, change state of repo
     */
    
    function auctionCancel() public onlyOwner {
        if (ended) {
            revert AuctionEndAlreadyCalled();
        }
        
        token.safeTransferFrom(address(this), payable(beneficiary), tokenId);
        
        require(repo.cancelAuction(beneficiary, auctionId) == true, "Unable to change state");
        ended = true;
        cancelled = true;
        emit AuctionCancelled();
    }

    function onERC721Received(address, address, uint256, bytes memory) public virtual override returns (bytes4) {
        return this.onERC721Received.selector;
    }    
    
}