# Smart Contract Specifications
## OmniMarkets BSC Implementation

---

## Contract Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Contract Hierarchy                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  MarketAggregator.sol (Main Entry Point)                    │
│  ├─ Ownable, AccessControl, ReentrancyGuard                 │
│  ├─ Manages markets, bet slips, settlements                  │
│  └─ Integrates with Oracle & Subjective contracts           │
│                                                               │
│  AIOracleDispute.sol (Dispute Resolution)                   │
│  ├─ AccessControl, ReentrancyGuard                          │
│  ├─ Dispute submission & voting                              │
│  └─ Reward distribution                                      │
│                                                               │
│  SubjectiveMarketFactory.sol (Private Markets)              │
│  ├─ Ownable, AccessControl                                   │
│  ├─ Commit-reveal mechanism                                  │
│  └─ Verifier management                                      │
│                                                               │
│  MarketToken.sol (ERC20 - Optional)                         │
│  └─ Protocol governance token                                │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. MarketAggregator.sol

### Overview
Central contract for market management, bet routing, and settlement.

### Inheritance
```solidity
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
```

### State Variables

```solidity
// Roles
bytes32 public constant ROUTER_ROLE = keccak256("ROUTER_ROLE");
bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");

// Counters
uint256 public marketCount;
uint256 public betSlipCount;

// Protocol fee (in basis points, e.g., 200 = 2%)
uint256 public protocolFeeBps = 200;
address public feeRecipient;

// Mappings
mapping(uint256 => Market) public markets;
mapping(uint256 => ExternalMarket[]) public externalMarkets;
mapping(uint256 => BetSlip) public betSlips;
mapping(address => uint256[]) public userBetSlips;
mapping(uint256 => mapping(address => bool)) public hasClaimedWinnings;
```

### Structs

```solidity
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
```

### Events

```solidity
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
```

### Core Functions

```solidity
/**
 * @notice Create a new market
 * @param question The market question
 * @param category Market category (e.g., "sports", "politics")
 * @param marketType Public or Subjective
 * @param resolutionTime Unix timestamp for resolution
 * @return marketId The created market ID
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
 * @param marketId Internal market ID
 * @param marketplace External marketplace address/identifier
 * @param externalId External market ID
 * @param price Current price in basis points
 * @param liquidity Available liquidity
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
 * @param marketIds Array of market IDs to bet on
 * @param amounts Array of bet amounts per market
 * @param outcomes Array of outcomes (0=NO, 1=YES)
 * @return betSlipId The created bet slip ID
 */
function createBetSlip(
    uint256[] memory marketIds,
    uint256[] memory amounts,
    uint256[] memory outcomes
) external payable nonReentrant returns (uint256) {
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
    
    emit BetSlipCreated(betSlipId, msg.sender, marketIds, totalAmount);
    return betSlipId;
}

/**
 * @notice Record bet placement (called by router service after execution)
 * @param betSlipId Bet slip ID
 * @param expectedPayout Expected payout amount
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
 * @param marketId Market ID
 * @param outcome Final outcome (0=NO, 1=YES, 2=INVALID)
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
 * @param betSlipId Bet slip ID
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
 * @param betSlipId Bet slip ID
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
 * @param betSlipId Bet slip ID
 * @return payout Total payout amount
 */
function calculatePayout(uint256 betSlipId) public view returns (uint256) {
    BetSlip storage slip = betSlips[betSlipId];
    uint256 payout = 0;
    
    for (uint256 i = 0; i < slip.marketIds.length; i++) {
        Market storage market = markets[slip.marketIds[i]];
        
        // If outcome matches bet, add to payout
        if (market.outcome == slip.outcomes[i]) {
            // Simplified: 2x payout for correct prediction
            payout += slip.amounts[i] * 2;
        }
        // If invalid, refund
        else if (market.outcome == 2) {
            payout += slip.amounts[i];
        }
    }
    
    return payout;
}

/**
 * @notice Get user's bet slips
 * @param user User address
 * @return betSlipIds Array of bet slip IDs
 */
function getUserBetSlips(address user) external view returns (uint256[] memory) {
    return userBetSlips[user];
}

/**
 * @notice Get external markets for a market
 * @param marketId Market ID
 * @return externalMarketList Array of external markets
 */
function getExternalMarkets(uint256 marketId) 
    external 
    view 
    returns (ExternalMarket[] memory) 
{
    return externalMarkets[marketId];
}

/**
 * @notice Update protocol fee
 * @param newFeeBps New fee in basis points
 */
function setProtocolFee(uint256 newFeeBps) external onlyRole(DEFAULT_ADMIN_ROLE) {
    require(newFeeBps <= 1000, "Fee too high"); // Max 10%
    protocolFeeBps = newFeeBps;
    emit ProtocolFeeUpdated(newFeeBps);
}

/**
 * @notice Update fee recipient
 * @param newRecipient New recipient address
 */
function setFeeRecipient(address newRecipient) external onlyRole(DEFAULT_ADMIN_ROLE) {
    require(newRecipient != address(0), "Zero address");
    feeRecipient = newRecipient;
    emit FeeRecipientUpdated(newRecipient);
}
```

---

## 2. AIOracleDispute.sol

### Overview
Handles dispute submission, voting, and resolution with AI oracle integration.

### State Variables

```solidity
bytes32 public constant AI_ORACLE_ROLE = keccak256("AI_ORACLE_ROLE");
bytes32 public constant RESOLVER_ROLE = keccak256("RESOLVER_ROLE");

uint256 public disputeCount;
uint256 public constant MIN_STAKE = 0.1 ether;
uint256 public constant VOTING_PERIOD = 3 days;
uint256 public constant QUORUM = 100 ether;

mapping(uint256 => Dispute) public disputes;
mapping(uint256 => Vote[]) public disputeVotes;
mapping(uint256 => mapping(address => bool)) public hasVoted;
mapping(address => uint256) public reputationScore;
```

### Structs

```solidity
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
```

### Events

```solidity
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
```

### Core Functions

```solidity
function submitDispute(
    uint256 marketId,
    bytes32 evidenceHash,
    uint256 proposedOutcome
) external payable nonReentrant returns (uint256);

function voteOnDispute(uint256 disputeId, bool support) external;

function resolveDispute(uint256 disputeId) external;

function claimReward(uint256 disputeId) external nonReentrant;

function suggestDispute(
    uint256 marketId,
    bytes32 evidenceHash,
    uint256 confidence
) external onlyRole(AI_ORACLE_ROLE);
```

---

## 3. SubjectiveMarketFactory.sol

### Overview
Create and manage private markets with verifier circles and commit-reveal.

### State Variables

```solidity
uint256 public marketCount;
uint256 public constant COMMIT_PERIOD = 1 days;
uint256 public constant REVEAL_PERIOD = 1 days;

mapping(uint256 => SubjectiveMarket) public markets;
mapping(uint256 => mapping(address => bytes32)) public commitments;
mapping(uint256 => mapping(address => uint256)) public reveals;
```

### Structs

```solidity
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
```

### Events

```solidity
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
```

### Core Functions

```solidity
function createMarket(
    string memory question,
    address[] memory verifiers,
    uint256 threshold,
    uint256 resolutionTime
) external returns (uint256);

function commitOutcome(uint256 marketId, bytes32 commitment) external;

function revealOutcome(uint256 marketId, uint256 outcome, bytes32 salt) external;

function startCommitPhase(uint256 marketId) external;

function startRevealPhase(uint256 marketId) external;

function isVerifier(uint256 marketId, address account) public view returns (bool);
```

---

## Deployment Strategy

### BSC Testnet Deployment

```bash
# 1. Deploy MarketAggregator
npx hardhat run scripts/deploy-aggregator.ts --network bscTestnet

# 2. Deploy AIOracleDispute
npx hardhat run scripts/deploy-dispute.ts --network bscTestnet

# 3. Deploy SubjectiveMarketFactory
npx hardhat run scripts/deploy-subjective.ts --network bscTestnet

# 4. Configure roles
npx hardhat run scripts/setup-roles.ts --network bscTestnet

# 5. Verify contracts
npx hardhat verify --network bscTestnet <ADDRESS>
```

### Gas Optimization

- Use `calldata` instead of `memory` for read-only arrays
- Pack structs to minimize storage slots
- Use events instead of storage for historical data
- Batch operations where possible
- Cache storage reads in memory

### Security Considerations

- ReentrancyGuard on all payable functions
- AccessControl for privileged operations
- Input validation on all external functions
- SafeMath for Solidity < 0.8
- Pausable for emergency stops
- Time-lock for admin operations

---

## Testing Strategy

### Unit Tests

```typescript
describe("MarketAggregator", () => {
  it("should create market");
  it("should create bet slip");
  it("should resolve market");
  it("should settle bet slip");
  it("should claim winnings");
  it("should enforce access control");
  it("should handle invalid inputs");
});

describe("AIOracleDispute", () => {
  it("should submit dispute");
  it("should vote on dispute");
  it("should resolve dispute");
  it("should distribute rewards");
  it("should enforce quorum");
});

describe("SubjectiveMarketFactory", () => {
  it("should create subjective market");
  it("should commit outcome");
  it("should reveal outcome");
  it("should resolve with threshold");
  it("should enforce verifier access");
});
```

### Integration Tests

- End-to-end bet flow
- Dispute resolution flow
- Subjective market flow
- Cross-contract interactions

### Mainnet Checklist

- [ ] All tests passing
- [ ] Security audit completed
- [ ] Gas optimization done
- [ ] Contracts verified on BscScan
- [ ] Role assignments configured
- [ ] Fee recipient set
- [ ] Emergency pause tested
- [ ] Monitoring set up
