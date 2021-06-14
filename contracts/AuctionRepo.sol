// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.4;

import "./SimpleAuction.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";


contract AuctionRepo{
    
    uint private numberOfBeneficiaries;

    struct Auction {
        uint auctionId;
        uint startingBid;
        address beneficiary;
        ERC721 token;
        uint tokenId;
        SimpleAuction auctionContract;
        bool active;
    }
    
    // repository of all auctions existing
    Auction[] private auctionsRepo;
    
    // mapping of auctions owned by address
    mapping(address => uint[]) auctionsOwned;
    
    event auctionCreated(address indexed _beneficiary, SimpleAuction indexed auctionContract);
    
    /*
    * Getter functions
    */
    function getAuction (uint idx) public view returns (
        uint _auctionId,
        uint _startingBid,
        address _beneficiary,
        ERC721 _token,
        uint _tokenId,
        SimpleAuction _auctionContract,
        bool _active ) 
        {
            Auction memory auction = auctionsRepo[idx];
            return (
                auction.auctionId,
                auction.startingBid,
                auction.beneficiary,
                auction.token,
                auction.tokenId,
                auction.auctionContract,
                auction.active);
        }
        
    function getAuctionsOwned (address _beneficiary) public view returns (uint[] memory) {
        return auctionsOwned[_beneficiary];
    }
    
    function getAuctionsCount () public view returns (uint _len) {
        return auctionsRepo.length;
    }
    
    function getBeneficiariesCount () public view returns (uint _len) {
        return numberOfBeneficiaries;
    }


    /*
    * Setter functions
    */
    
    /**
     * @notice Creates an auction contract, if successful updates the state with new auction
     * @param  _beneficiary address of owner of ERC721 token
     * @param _token ERC721 type contract
     * @param _tokenId Id of token 
     * @param _timeToEnd Time from contract creation before end of auction >= 600s
     * @return Boolean
     */
    function createAuction( 
        address payable _beneficiary,
        ERC721 _token,
        uint _tokenId,
        uint _timeToEnd,
        uint _startingBid
        ) public returns(bool)
        {   
            require(_beneficiary == _token.ownerOf(_tokenId), "Not the owner of token" );
			// require( address(this) == _token.getApproved(_tokenId), "Unable to approve auction contract" );
            // require(_timeToEnd >= 600, "Time to end to be more than 10 minutes");
            
            uint currentId = getAuctionsCount();
            
            // Creates a contract 
            SimpleAuction newAuctionContract = new SimpleAuction(
                address(this), 
                _beneficiary, 
                _token, 
                _tokenId, 
                _timeToEnd, 
                currentId, 
                _startingBid);
			
			
			Auction memory newAuction;
			newAuction.auctionId = currentId;
			newAuction.startingBid = _startingBid;
			newAuction.beneficiary = _beneficiary;
			newAuction.token = _token;
			newAuction.tokenId = _tokenId;
			newAuction.auctionContract = newAuctionContract;
			newAuction.active = true;
			
			auctionsRepo.push(newAuction);
			
			auctionsOwned[_beneficiary].push(currentId);
			
			numberOfBeneficiaries += 1;
			
            // first id = 0
            currentId += 1;
            
			emit auctionCreated(_beneficiary, newAuctionContract);   
            
            return true;
        }
        
    /**
     * @notice Cancel existing auction 
     * @param _beneficiary payable address
     * @param _auctionId id of an existing auction
     */
    function cancelAuction(address _beneficiary, uint _auctionId) external returns (bool) {
        
        Auction storage myAuction = auctionsRepo[_auctionId];
        require(address(myAuction.auctionContract) == msg.sender, "Not called from auction contract");
        require(_beneficiary == myAuction.beneficiary, "Not the beneficiary");
        require(myAuction.active == true, "Auction has ended");

        myAuction.active = false;

        return true;
    }
    /**
     * @notice Ends the auction, changing the state of the auction repository
     * @param _beneficiary payable address
     * @param _auctionId id of an existing auction
     */
    function endAuction(address _beneficiary, uint _auctionId) external returns (bool) {
        
        Auction storage myAuction = auctionsRepo[_auctionId];
        require(address(myAuction.auctionContract) == msg.sender, "Not called from auction contract");
        require(_beneficiary == myAuction.beneficiary, "Not the beneficiary");
        require(myAuction.active == true, "Auction has already ended");

        myAuction.active = false;

        return true;
    }
}