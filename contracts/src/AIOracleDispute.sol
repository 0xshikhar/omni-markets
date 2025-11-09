// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title AIOracleDispute
 * @dev Handles dispute submission, voting, and resolution with AI oracle integration
 */
contract AIOracleDispute is AccessControl, ReentrancyGuard {
    // ============ Roles ============
    
    bytes32 public constant AI_ORACLE_ROLE = keccak256("AI_ORACLE_ROLE");
    bytes32 public constant RESOLVER_ROLE = keccak256("RESOLVER_ROLE");

    // ============ Types ============
    
    enum DisputeStatus { Active, Resolved, Rejected, Expired }

    struct Dispute {
        uint256 id;
        uint256 marketId;
        address submitter;
        bytes32 evidenceHash; // IPFS hash
        uint256 stake;
        uint256 submittedAt;
        DisputeStatus status;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 proposedOutcome;
        uint256 aiConfidence; // 0-100
    }

    struct Vote {
        address voter;
        bool support;
        uint256 weight;
        uint256 timestamp;
    }

    // ============ State ============
    
    uint256 public disputeCount;
    uint256 public constant MIN_STAKE = 0.1 ether;
    uint256 public constant VOTING_PERIOD = 3 days;
    uint256 public constant QUORUM = 100 ether;

    mapping(uint256 => Dispute) public disputes;
    mapping(uint256 => Vote[]) public disputeVotes;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(address => uint256) public reputationScore;

    // ============ Events ============
    
    event DisputeSubmitted(
        uint256 indexed disputeId,
        uint256 indexed marketId,
        address indexed submitter,
        bytes32 evidenceHash,
        uint256 proposedOutcome
    );

    event DisputeVoted(
        uint256 indexed disputeId,
        address indexed voter,
        bool support,
        uint256 weight
    );

    event DisputeResolved(
        uint256 indexed disputeId,
        bool accepted,
        uint256 outcome
    );

    event RewardClaimed(
        uint256 indexed disputeId,
        address indexed claimer,
        uint256 amount
    );

    event AISuggestion(
        uint256 indexed marketId,
        bytes32 evidenceHash,
        uint256 confidence
    );

    // ============ Constructor ============
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // ============ Core Functions ============
    
    /**
     * @notice Submit a dispute for a market
     */
    function submitDispute(
        uint256 marketId,
        bytes32 evidenceHash,
        uint256 proposedOutcome
    ) external payable nonReentrant returns (uint256) {
        require(msg.value >= MIN_STAKE, "Insufficient stake");
        require(proposedOutcome <= 2, "Invalid outcome");
        
        uint256 disputeId = ++disputeCount;
        
        disputes[disputeId] = Dispute({
            id: disputeId,
            marketId: marketId,
            submitter: msg.sender,
            evidenceHash: evidenceHash,
            stake: msg.value,
            submittedAt: block.timestamp,
            status: DisputeStatus.Active,
            votesFor: 0,
            votesAgainst: 0,
            proposedOutcome: proposedOutcome,
            aiConfidence: 0
        });
        
        emit DisputeSubmitted(disputeId, marketId, msg.sender, evidenceHash, proposedOutcome);
        return disputeId;
    }

    /**
     * @notice Vote on a dispute
     */
    function voteOnDispute(uint256 disputeId, bool support) external nonReentrant {
        Dispute storage dispute = disputes[disputeId];
        require(dispute.status == DisputeStatus.Active, "Dispute not active");
        require(!hasVoted[disputeId][msg.sender], "Already voted");
        require(block.timestamp < dispute.submittedAt + VOTING_PERIOD, "Voting ended");
        
        // Weight based on reputation (simplified for MVP - 1 ether per vote)
        uint256 weight = 1 ether;
        if (reputationScore[msg.sender] > 0) {
            weight = reputationScore[msg.sender];
        }
        
        disputeVotes[disputeId].push(Vote({
            voter: msg.sender,
            support: support,
            weight: weight,
            timestamp: block.timestamp
        }));
        
        hasVoted[disputeId][msg.sender] = true;
        
        if (support) {
            dispute.votesFor += weight;
        } else {
            dispute.votesAgainst += weight;
        }
        
        emit DisputeVoted(disputeId, msg.sender, support, weight);
    }

    /**
     * @notice Resolve a dispute after voting period
     */
    function resolveDispute(uint256 disputeId) external nonReentrant {
        Dispute storage dispute = disputes[disputeId];
        require(dispute.status == DisputeStatus.Active, "Dispute not active");
        require(block.timestamp >= dispute.submittedAt + VOTING_PERIOD, "Voting ongoing");
        
        uint256 totalVotes = dispute.votesFor + dispute.votesAgainst;
        
        // Check if quorum reached
        if (totalVotes < QUORUM) {
            dispute.status = DisputeStatus.Expired;
            // Refund stake
            (bool success, ) = dispute.submitter.call{value: dispute.stake}("");
            require(success, "Refund failed");
            emit DisputeResolved(disputeId, false, 0);
            return;
        }
        
        bool accepted = dispute.votesFor > dispute.votesAgainst;
        
        if (accepted) {
            dispute.status = DisputeStatus.Resolved;
            // Reward submitter (stake + 50% bonus)
            uint256 reward = dispute.stake + (dispute.stake / 2);
            (bool success, ) = dispute.submitter.call{value: reward}("");
            require(success, "Reward failed");
            
            // Increase reputation
            reputationScore[dispute.submitter] += 1 ether;
        } else {
            dispute.status = DisputeStatus.Rejected;
            // Stake is slashed (kept in contract for rewards pool)
            
            // Decrease reputation
            if (reputationScore[dispute.submitter] >= 1 ether) {
                reputationScore[dispute.submitter] -= 1 ether;
            }
        }
        
        emit DisputeResolved(disputeId, accepted, dispute.proposedOutcome);
    }

    /**
     * @notice Claim reward for voting on correct side
     */
    function claimReward(uint256 disputeId) external nonReentrant {
        Dispute storage dispute = disputes[disputeId];
        require(
            dispute.status == DisputeStatus.Resolved || dispute.status == DisputeStatus.Rejected,
            "Dispute not resolved"
        );
        require(hasVoted[disputeId][msg.sender], "Did not vote");
        
        // Find voter's vote
        Vote[] storage votes = disputeVotes[disputeId];
        bool votedCorrectly = false;
        uint256 voterWeight = 0;
        
        for (uint256 i = 0; i < votes.length; i++) {
            if (votes[i].voter == msg.sender) {
                voterWeight = votes[i].weight;
                // Check if voted on winning side
                if (dispute.status == DisputeStatus.Resolved && votes[i].support) {
                    votedCorrectly = true;
                } else if (dispute.status == DisputeStatus.Rejected && !votes[i].support) {
                    votedCorrectly = true;
                }
                break;
            }
        }
        
        require(votedCorrectly, "Voted incorrectly");
        
        // Calculate reward proportional to vote weight
        uint256 totalCorrectVotes = dispute.status == DisputeStatus.Resolved 
            ? dispute.votesFor 
            : dispute.votesAgainst;
        
        uint256 rewardPool = dispute.stake / 2; // 50% of stake goes to voters
        uint256 reward = (rewardPool * voterWeight) / totalCorrectVotes;
        
        // Transfer reward
        (bool success, ) = msg.sender.call{value: reward}("");
        require(success, "Reward transfer failed");
        
        // Increase reputation
        reputationScore[msg.sender] += voterWeight / 10;
        
        emit RewardClaimed(disputeId, msg.sender, reward);
    }

    /**
     * @notice AI oracle suggests a dispute (called by AI service)
     */
    function suggestDispute(
        uint256 marketId,
        bytes32 evidenceHash,
        uint256 confidence
    ) external onlyRole(AI_ORACLE_ROLE) {
        require(confidence <= 100, "Invalid confidence");
        emit AISuggestion(marketId, evidenceHash, confidence);
    }

    /**
     * @notice Update AI confidence for a dispute
     */
    function updateAIConfidence(
        uint256 disputeId,
        uint256 confidence
    ) external onlyRole(AI_ORACLE_ROLE) {
        require(confidence <= 100, "Invalid confidence");
        disputes[disputeId].aiConfidence = confidence;
    }

    // ============ View Functions ============
    
    function getDispute(uint256 disputeId) external view returns (Dispute memory) {
        return disputes[disputeId];
    }

    function getDisputeVotes(uint256 disputeId) external view returns (Vote[] memory) {
        return disputeVotes[disputeId];
    }

    function getReputationScore(address user) external view returns (uint256) {
        return reputationScore[user];
    }

    // ============ Admin Functions ============
    
    function withdrawRewardsPool() external onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 balance = address(this).balance;
        (bool success, ) = msg.sender.call{value: balance}("");
        require(success, "Withdraw failed");
    }

    receive() external payable {}
}
