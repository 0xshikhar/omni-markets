// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title SubjectiveMarketFactory
 * @dev Create and manage private markets with verifier circles and commit-reveal
 */
contract SubjectiveMarketFactory is Ownable, AccessControl {
    // ============ Types ============
    
    enum MarketPhase { Active, Commit, Reveal, Resolved }

    struct SubjectiveMarket {
        uint256 id;
        string question;
        address creator;
        address[] verifiers;
        uint256 threshold;
        uint256 resolutionTime;
        MarketPhase phase;
        uint256 outcome;
        uint256 revealCount;
        uint256 createdAt;
    }

    // ============ State ============
    
    uint256 public marketCount;
    uint256 public constant COMMIT_PERIOD = 1 days;
    uint256 public constant REVEAL_PERIOD = 1 days;

    mapping(uint256 => SubjectiveMarket) public markets;
    mapping(uint256 => mapping(address => bytes32)) public commitments;
    mapping(uint256 => mapping(address => uint256)) public reveals;

    // ============ Events ============
    
    event SubjectiveMarketCreated(
        uint256 indexed marketId,
        string question,
        address[] verifiers,
        uint256 threshold
    );

    event CommitmentSubmitted(
        uint256 indexed marketId,
        address indexed verifier
    );

    event OutcomeRevealed(
        uint256 indexed marketId,
        address indexed verifier,
        uint256 outcome
    );

    event MarketResolved(
        uint256 indexed marketId,
        uint256 outcome
    );

    event PhaseChanged(
        uint256 indexed marketId,
        MarketPhase newPhase
    );

    // ============ Constructor ============
    
    constructor() Ownable(msg.sender) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // ============ Core Functions ============
    
    /**
     * @notice Create a new subjective market
     */
    function createMarket(
        string memory question,
        address[] memory verifiers,
        uint256 threshold,
        uint256 resolutionTime
    ) external returns (uint256) {
        require(verifiers.length > 0, "No verifiers");
        require(threshold <= verifiers.length, "Invalid threshold");
        require(threshold > verifiers.length / 2, "Threshold too low");
        require(resolutionTime > block.timestamp, "Invalid resolution time");
        
        uint256 marketId = ++marketCount;
        
        SubjectiveMarket storage market = markets[marketId];
        market.id = marketId;
        market.question = question;
        market.creator = msg.sender;
        market.verifiers = verifiers;
        market.threshold = threshold;
        market.resolutionTime = resolutionTime;
        market.phase = MarketPhase.Active;
        market.outcome = 0;
        market.revealCount = 0;
        market.createdAt = block.timestamp;
        
        emit SubjectiveMarketCreated(marketId, question, verifiers, threshold);
        return marketId;
    }

    /**
     * @notice Submit a commitment for market outcome
     */
    function commitOutcome(uint256 marketId, bytes32 commitment) external {
        SubjectiveMarket storage market = markets[marketId];
        require(market.phase == MarketPhase.Commit, "Not in commit phase");
        require(isVerifier(marketId, msg.sender), "Not a verifier");
        require(commitments[marketId][msg.sender] == bytes32(0), "Already committed");
        
        commitments[marketId][msg.sender] = commitment;
        
        emit CommitmentSubmitted(marketId, msg.sender);
    }

    /**
     * @notice Reveal outcome with salt
     */
    function revealOutcome(uint256 marketId, uint256 outcome, bytes32 salt) external {
        SubjectiveMarket storage market = markets[marketId];
        require(market.phase == MarketPhase.Reveal, "Not in reveal phase");
        require(isVerifier(marketId, msg.sender), "Not a verifier");
        require(outcome <= 1, "Invalid outcome");
        
        bytes32 commitment = keccak256(abi.encodePacked(outcome, salt));
        require(commitments[marketId][msg.sender] == commitment, "Invalid reveal");
        
        reveals[marketId][msg.sender] = outcome;
        market.revealCount++;
        
        emit OutcomeRevealed(marketId, msg.sender, outcome);
        
        // Auto-resolve if threshold reached
        if (market.revealCount >= market.threshold) {
            _resolveMarket(marketId);
        }
    }

    /**
     * @notice Start commit phase (after resolution time)
     */
    function startCommitPhase(uint256 marketId) external {
        SubjectiveMarket storage market = markets[marketId];
        require(market.phase == MarketPhase.Active, "Invalid phase");
        require(block.timestamp >= market.resolutionTime, "Not ready");
        
        market.phase = MarketPhase.Commit;
        emit PhaseChanged(marketId, MarketPhase.Commit);
    }

    /**
     * @notice Start reveal phase (after commit period)
     */
    function startRevealPhase(uint256 marketId) external {
        SubjectiveMarket storage market = markets[marketId];
        require(market.phase == MarketPhase.Commit, "Invalid phase");
        require(block.timestamp >= market.resolutionTime + COMMIT_PERIOD, "Commit ongoing");
        
        market.phase = MarketPhase.Reveal;
        emit PhaseChanged(marketId, MarketPhase.Reveal);
    }

    /**
     * @notice Force resolve market (after reveal period if threshold not met)
     */
    function forceResolveMarket(uint256 marketId) external {
        SubjectiveMarket storage market = markets[marketId];
        require(market.phase == MarketPhase.Reveal, "Invalid phase");
        require(
            block.timestamp >= market.resolutionTime + COMMIT_PERIOD + REVEAL_PERIOD,
            "Reveal ongoing"
        );
        
        _resolveMarket(marketId);
    }

    /**
     * @notice Internal function to resolve market
     */
    function _resolveMarket(uint256 marketId) internal {
        SubjectiveMarket storage market = markets[marketId];
        
        // Count votes for each outcome
        uint256 yesVotes = 0;
        uint256 noVotes = 0;
        
        for (uint256 i = 0; i < market.verifiers.length; i++) {
            address verifier = market.verifiers[i];
            uint256 vote = reveals[marketId][verifier];
            
            if (vote == 1) {
                yesVotes++;
            } else if (vote == 0) {
                noVotes++;
            }
        }
        
        // Determine outcome (majority wins, ties go to NO)
        uint256 finalOutcome = yesVotes > noVotes ? 1 : 0;
        
        market.outcome = finalOutcome;
        market.phase = MarketPhase.Resolved;
        
        emit MarketResolved(marketId, finalOutcome);
    }

    // ============ View Functions ============
    
    /**
     * @notice Check if address is a verifier for market
     */
    function isVerifier(uint256 marketId, address account) public view returns (bool) {
        address[] memory verifiers = markets[marketId].verifiers;
        for (uint256 i = 0; i < verifiers.length; i++) {
            if (verifiers[i] == account) {
                return true;
            }
        }
        return false;
    }

    /**
     * @notice Get market details
     */
    function getMarket(uint256 marketId) external view returns (
        uint256 id,
        string memory question,
        address creator,
        address[] memory verifiers,
        uint256 threshold,
        uint256 resolutionTime,
        MarketPhase phase,
        uint256 outcome,
        uint256 revealCount,
        uint256 createdAt
    ) {
        SubjectiveMarket storage market = markets[marketId];
        return (
            market.id,
            market.question,
            market.creator,
            market.verifiers,
            market.threshold,
            market.resolutionTime,
            market.phase,
            market.outcome,
            market.revealCount,
            market.createdAt
        );
    }

    /**
     * @notice Get verifier's commitment
     */
    function getCommitment(uint256 marketId, address verifier) external view returns (bytes32) {
        return commitments[marketId][verifier];
    }

    /**
     * @notice Get verifier's reveal
     */
    function getReveal(uint256 marketId, address verifier) external view returns (uint256) {
        return reveals[marketId][verifier];
    }

    /**
     * @notice Get all verifiers for a market
     */
    function getVerifiers(uint256 marketId) external view returns (address[] memory) {
        return markets[marketId].verifiers;
    }
}
