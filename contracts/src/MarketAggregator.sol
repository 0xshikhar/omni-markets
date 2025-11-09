// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title MarketAggregator
 * @dev Central contract for market management, bet routing, and settlement
 */
contract MarketAggregator is AccessControl, ReentrancyGuard, Pausable {
    // ============ Roles ============
    
    bytes32 public constant ROUTER_ROLE = keccak256("ROUTER_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");

    // ============ Types ============
    
    enum MarketStatus { Active, Resolved, Disputed, Cancelled }
    enum MarketType { Public, Subjective }
    enum BetStatus { Pending, Placed, Settled, Cancelled }

    struct Market {
        uint256 id;
        string question;
        string category;
        MarketType marketType;
        MarketStatus status;
        uint256 resolutionTime;
        uint256 totalVolume;
        address creator;
        uint256 outcome; // 0=NO, 1=YES, 2=INVALID
        uint256 createdAt;
    }

    struct ExternalMarket {
        uint256 marketId;
        address marketplace;
        bytes32 externalId;
        uint256 price; // in basis points (0-10000)
        uint256 liquidity;
        uint256 lastUpdate;
    }

    struct BetSlip {
        uint256 id;
        address user;
        uint256[] marketIds;
        uint256[] amounts;
        uint256[] outcomes; // 0=NO, 1=YES
        uint256 totalAmount;
        uint256 expectedPayout;
        uint256 actualPayout;
        BetStatus status;
        uint256 createdAt;
    }

    // ============ State ============
    
    uint256 public marketCount;
    uint256 public betSlipCount;
    uint256 public protocolFeeBps = 200; // 2%
    address public feeRecipient;

    mapping(uint256 => Market) public markets;
    mapping(uint256 => ExternalMarket[]) public externalMarkets;
    mapping(uint256 => BetSlip) public betSlips;
    mapping(address => uint256[]) public userBetSlips;
    mapping(uint256 => mapping(address => bool)) public hasClaimedWinnings;

    // ============ Events ============
    
    event MarketCreated(
        uint256 indexed marketId,
        string question,
        MarketType marketType,
        address indexed creator
    );

    event ExternalMarketAdded(
        uint256 indexed marketId,
        address indexed marketplace,
        bytes32 externalId
    );

    event BetSlipCreated(
        uint256 indexed betSlipId,
        address indexed user,
        uint256[] marketIds,
        uint256 totalAmount
    );

    event BetSlipPlaced(
        uint256 indexed betSlipId,
        uint256 expectedPayout
    );

    event MarketResolved(
        uint256 indexed marketId,
        uint256 outcome
    );

    event BetSlipSettled(
        uint256 indexed betSlipId,
        uint256 payout
    );

    event WinningsClaimed(
        uint256 indexed betSlipId,
        address indexed user,
        uint256 amount
    );

    event ProtocolFeeUpdated(uint256 newFeeBps);
    event FeeRecipientUpdated(address newRecipient);

    // ============ Constructor ============
    
    constructor(address _feeRecipient) {
        require(_feeRecipient != address(0), "Zero address");
        feeRecipient = _feeRecipient;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // ============ Core Functions ============
    
    /**
     * @notice Create a new market
     */
    function createMarket(
        string memory question,
        string memory category,
        MarketType marketType,
        uint256 resolutionTime
    ) external returns (uint256) {
        require(resolutionTime > block.timestamp, "Invalid resolution time");
        require(bytes(question).length > 0, "Empty question");
        
        uint256 marketId = ++marketCount;
        
        markets[marketId] = Market({
            id: marketId,
            question: question,
            category: category,
            marketType: marketType,
            status: MarketStatus.Active,
            resolutionTime: resolutionTime,
            totalVolume: 0,
            creator: msg.sender,
            outcome: 0,
            createdAt: block.timestamp
        });
        
        emit MarketCreated(marketId, question, marketType, msg.sender);
        return marketId;
    }

    /**
     * @notice Add external market data (called by syncer service)
     */
    function addExternalMarket(
        uint256 marketId,
        address marketplace,
        bytes32 externalId,
        uint256 price,
        uint256 liquidity
    ) external onlyRole(ROUTER_ROLE) {
        require(markets[marketId].status == MarketStatus.Active, "Market not active");
        require(price <= 10000, "Invalid price");
        
        externalMarkets[marketId].push(ExternalMarket({
            marketId: marketId,
            marketplace: marketplace,
            externalId: externalId,
            price: price,
            liquidity: liquidity,
            lastUpdate: block.timestamp
        }));
        
        emit ExternalMarketAdded(marketId, marketplace, externalId);
    }

    /**
     * @notice Create a bet slip (user initiates bet)
     */
    function createBetSlip(
        uint256[] memory marketIds,
        uint256[] memory amounts,
        uint256[] memory outcomes
    ) external payable nonReentrant whenNotPaused returns (uint256) {
        require(marketIds.length > 0, "Empty bet slip");
        require(marketIds.length == amounts.length, "Length mismatch");
        require(marketIds.length == outcomes.length, "Length mismatch");
        
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            require(amounts[i] > 0, "Zero amount");
            require(outcomes[i] <= 1, "Invalid outcome");
            require(markets[marketIds[i]].status == MarketStatus.Active, "Market not active");
            totalAmount += amounts[i];
        }
        
        require(msg.value >= totalAmount, "Insufficient payment");
        
        uint256 betSlipId = ++betSlipCount;
        
        betSlips[betSlipId] = BetSlip({
            id: betSlipId,
            user: msg.sender,
            marketIds: marketIds,
            amounts: amounts,
            outcomes: outcomes,
            totalAmount: totalAmount,
            expectedPayout: 0,
            actualPayout: 0,
            status: BetStatus.Pending,
            createdAt: block.timestamp
        });
        
        userBetSlips[msg.sender].push(betSlipId);
        
        // Update market volumes
        for (uint256 i = 0; i < marketIds.length; i++) {
            markets[marketIds[i]].totalVolume += amounts[i];
        }
        
        // Refund excess payment
        if (msg.value > totalAmount) {
            (bool success, ) = msg.sender.call{value: msg.value - totalAmount}("");
            require(success, "Refund failed");
        }
        
        emit BetSlipCreated(betSlipId, msg.sender, marketIds, totalAmount);
        return betSlipId;
    }

    /**
     * @notice Record bet placement (called by router service)
     */
    function recordBetPlaced(
        uint256 betSlipId,
        uint256 expectedPayout
    ) external onlyRole(ROUTER_ROLE) {
        BetSlip storage slip = betSlips[betSlipId];
        require(slip.status == BetStatus.Pending, "Invalid status");
        
        slip.status = BetStatus.Placed;
        slip.expectedPayout = expectedPayout;
        
        emit BetSlipPlaced(betSlipId, expectedPayout);
    }

    /**
     * @notice Resolve a market (called by oracle)
     */
    function resolveMarket(
        uint256 marketId,
        uint256 outcome
    ) external onlyRole(ORACLE_ROLE) {
        Market storage market = markets[marketId];
        require(market.status == MarketStatus.Active, "Market not active");
        require(outcome <= 2, "Invalid outcome");
        
        market.status = MarketStatus.Resolved;
        market.outcome = outcome;
        
        emit MarketResolved(marketId, outcome);
    }

    /**
     * @notice Settle a bet slip after all markets resolved
     */
    function settleBetSlip(uint256 betSlipId) external nonReentrant {
        BetSlip storage slip = betSlips[betSlipId];
        require(slip.status == BetStatus.Placed, "Invalid status");
        
        // Check all markets are resolved
        for (uint256 i = 0; i < slip.marketIds.length; i++) {
            require(
                markets[slip.marketIds[i]].status == MarketStatus.Resolved,
                "Market not resolved"
            );
        }
        
        // Calculate payout
        uint256 payout = calculatePayout(betSlipId);
        slip.actualPayout = payout;
        slip.status = BetStatus.Settled;
        
        emit BetSlipSettled(betSlipId, payout);
    }

    /**
     * @notice Claim winnings from settled bet slip
     */
    function claimWinnings(uint256 betSlipId) external nonReentrant {
        BetSlip storage slip = betSlips[betSlipId];
        require(slip.status == BetStatus.Settled, "Not settled");
        require(slip.user == msg.sender, "Not owner");
        require(!hasClaimedWinnings[betSlipId][msg.sender], "Already claimed");
        require(slip.actualPayout > 0, "No winnings");
        
        hasClaimedWinnings[betSlipId][msg.sender] = true;
        
        // Deduct protocol fee
        uint256 fee = (slip.actualPayout * protocolFeeBps) / 10000;
        uint256 netPayout = slip.actualPayout - fee;
        
        // Transfer winnings
        (bool success, ) = msg.sender.call{value: netPayout}("");
        require(success, "Transfer failed");
        
        // Transfer fee
        if (fee > 0) {
            (bool feeSuccess, ) = feeRecipient.call{value: fee}("");
            require(feeSuccess, "Fee transfer failed");
        }
        
        emit WinningsClaimed(betSlipId, msg.sender, netPayout);
    }

    /**
     * @notice Calculate payout for a bet slip
     */
    function calculatePayout(uint256 betSlipId) public view returns (uint256) {
        BetSlip storage slip = betSlips[betSlipId];
        uint256 payout = 0;
        
        for (uint256 i = 0; i < slip.marketIds.length; i++) {
            Market storage market = markets[slip.marketIds[i]];
            
            // If outcome matches bet, add to payout (2x for correct prediction)
            if (market.outcome == slip.outcomes[i]) {
                payout += slip.amounts[i] * 2;
            }
            // If invalid, refund
            else if (market.outcome == 2) {
                payout += slip.amounts[i];
            }
        }
        
        return payout;
    }

    // ============ View Functions ============
    
    function getUserBetSlips(address user) external view returns (uint256[] memory) {
        return userBetSlips[user];
    }

    function getExternalMarkets(uint256 marketId) external view returns (ExternalMarket[] memory) {
        return externalMarkets[marketId];
    }

    function getBetSlip(uint256 betSlipId) external view returns (BetSlip memory) {
        return betSlips[betSlipId];
    }

    function getMarket(uint256 marketId) external view returns (Market memory) {
        return markets[marketId];
    }

    // ============ Admin Functions ============
    
    function setProtocolFee(uint256 newFeeBps) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newFeeBps <= 1000, "Fee too high"); // Max 10%
        protocolFeeBps = newFeeBps;
        emit ProtocolFeeUpdated(newFeeBps);
    }

    function setFeeRecipient(address newRecipient) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newRecipient != address(0), "Zero address");
        feeRecipient = newRecipient;
        emit FeeRecipientUpdated(newRecipient);
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    // Emergency withdraw (only if paused)
    function emergencyWithdraw() external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(paused(), "Not paused");
        (bool success, ) = msg.sender.call{value: address(this).balance}("");
        require(success, "Withdraw failed");
    }

    receive() external payable {}
}
