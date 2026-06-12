# TrueEngage

## Autonomous AI-Powered Creator Engagement Marketplace

## Overview

TrueEngage is a decentralized AI-powered engagement marketplace where creators, brands, and communities can launch verified engagement campaigns while autonomous AI agents handle task verification, reputation scoring, and reward distribution.

The platform enables creators to define campaign tasks with specific rules, budgets, and permissions. Participants complete these tasks and submit proof of completion. Venice AI analyzes submitted proof to determine authenticity, quality, and compliance with campaign requirements. Once approved, a payment agent automatically executes rewards through MetaMask Smart Accounts using permission-based wallet execution.

TrueEngage transforms creator engagement from a manual trust-based system into an autonomous, transparent, and verifiable onchain economy.

Built for the MetaMask Smart Accounts Kit × Venice AI × 1Shot API Hackathon.

---

## Problem

Creator campaigns today rely heavily on centralized platforms and manual verification.

Common problems:

- Fake engagement and bot activity
- Low-quality submissions
- Manual campaign management
- Slow reward distribution
- Lack of trust between creators and participants

Creators need a system where they can say:

> "I want 100 real users to create meaningful engagement around my product, and I only pay when the work is verified."

TrueEngage solves this using AI agents and programmable wallets.

---

## Core Idea

TrueEngage combines:

- Fiverr-style task marketplace
- Galxe-style campaign completion
- AI-powered verification
- Smart wallet automation
- Permission-based payments

The platform creates an autonomous workflow:

**Creator creates campaign → Users complete tasks → AI verifies proof → Agent executes payment**

---

## MVP Architecture

### Network

**Blockchain:** Ethereum Sepolia Testnet

**Purpose:**

- Smart contract deployment
- Testing wallet permissions
- Demonstrating automated rewards
- Safe hackathon environment

---

## User Roles

### 1. Campaign Creator

Creators launch engagement campaigns.

**Example campaign:**

| Field | Value |
|-------|-------|
| Campaign | "Promote our Web3 product launch" |
| Task | Create an X post |
| Requirements | Mention project account, include campaign hashtag, minimum word count, positive sentiment |
| Reward | 2 USDC |
| Budget | 100 USDC |

### 2. Engagement Participant

Participants browse available campaigns. They can:

- Accept tasks
- Submit proof
- Receive rewards

**Proof examples:** Social media URL, screenshot, text explanation, media attachment

---

## System Architecture

```
                 Creator

                    |
                    |

          MetaMask Smart Account

                    |
                    |

          Campaign Smart Contract

                    |
                    |

              TrueEngage AI Agents

        /              |              \

Campaign Agent   Verification Agent   Payment Agent

        |              |              |

        |              |              |

 Task Rules       Venice AI        Smart Account

        |              |              |

        --------------------------------

                    |

             Participant Reward
```

---

## Smart Contract Layer

TrueEngage uses Solidity smart contracts deployed on Sepolia.

### CampaignManager Contract

Responsible for:

- Creating campaigns
- Storing campaign rules
- Tracking budgets
- Managing campaign status

**Data stored:** Campaign ID, creator address, task description, reward amount, maximum participants, deadline, status

### SubmissionManager Contract

Handles:

- Participant submissions
- AI verification results
- Approval status

**Stores:** Submission ID, campaign ID, participant wallet, AI score, approval status, verification result

### RewardEscrow Contract

Handles:

- Campaign funds
- Reward distribution
- Secure payouts

---

## MetaMask Smart Accounts Integration

TrueEngage uses MetaMask Smart Accounts to allow creators to delegate controlled wallet actions to autonomous agents.

Instead of manually approving every reward, creators authorize the TrueEngage payment agent.

**Example permission:**

```
Agent Permission:

Allowed Action:    Transfer USDC
Maximum Amount:    100 USDC
Purpose:           Campaign rewards
Expiration:        7 days
```

This enables autonomous execution while maintaining user control.

---

## Venice AI Integration

Venice AI acts as the intelligence layer of TrueEngage.

The AI Verification Agent evaluates:

- Proof authenticity
- Task completion
- Content quality
- Spam likelihood
- Campaign compliance

**Example analysis:**

```
Campaign Requirement Match: 95%
Content Quality:            89%
Authenticity Score:         92%
Spam Risk:                  Low

Decision: Approved
```

---

## Agent Architecture

TrueEngage uses multiple autonomous agents.

### Campaign Agent

- Understand campaign requirements
- Validate task structure
- Monitor campaign progress

### Verification Agent

Powered by Venice AI.

- Analyze submissions
- Generate quality scores
- Approve/reject tasks

**Output:**

```json
{
  "approved": true,
  "score": 92,
  "reason": "Task requirements satisfied"
}
```

### Payment Agent

- Check AI approval
- Verify campaign balance
- Execute reward transaction via MetaMask Smart Account permissions

---

## 1Shot API Integration

TrueEngage uses **1Shot API as the primary payout relayer** when configured. The payment agent tries 1Shot first, then falls back to direct delegation/escrow if needed.

**Setup (1Shot dashboard):**

1. Create API key + secret at [1Shot API](https://docs.1shotapi.com/api/api.html)
2. Configure a contract method for `RewardEscrow.releaseReward(campaignId, to, amount)` on Sepolia
3. Copy the method UUID into `ONESHOT_METHOD_ID`
4. (Optional) For delegated smart-account payouts: configure a USDC `transfer` method, set `ONESHOT_DELEGATOR_METHOD_ID` + `ONESHOT_WALLET_ID`, and grant campaign permission (delegation syncs to 1Shot on `wallet/delegate`)

```bash
ONESHOT_API_KEY=your_client_id
ONESHOT_API_SECRET=your_client_secret
ONESHOT_METHOD_ID=uuid-of-releaseReward-method
```

**Problem:** Many users completing tasks may not hold ETH for gas.

**Solution:** 1Shot relays reward transactions so participants receive USDC without holding ETH.

---

## End-to-End Workflow

1. **Creator** connects MetaMask
2. **Creator** creates campaign (task, reward, slots)
3. **Creator** deposits funds into escrow
4. **Creator** grants AI payment permissions
5. **Participant** completes task
6. **Participant** submits proof
7. **Venice AI** verifies submission
8. **Payment agent** executes reward
9. **Participant** receives USDC on Sepolia

---

## Frontend Architecture

**Technology:** Next.js, TypeScript, TailwindCSS, Wagmi, Viem

**Pages:**

| Page | Purpose |
|------|---------|
| Landing Page | Explains marketplace |
| Campaign Marketplace | Displays active campaigns |
| Campaign Creation | Define task, rules, reward, budget |
| Submission Dashboard | Submit proof |
| AI Verification Dashboard | AI score, reasoning, payment status |

---

## Backend Architecture

**Technology:** Node.js, Express, PostgreSQL

**Responsibilities:**

- Store metadata
- Manage AI requests
- Coordinate agents
- Index blockchain events

---

## Security Model

TrueEngage minimizes risk through:

### Permission Limits

Agents cannot spend unlimited funds, access unrelated assets, or execute outside campaign scope.

### Escrow System

Funds remain locked until verification.

### Transparent Verification

AI decisions are recorded and linked to submissions.

---

## Hackathon Alignment

| Sponsor | Usage |
|---------|-------|
| **MetaMask Smart Accounts** | Programmable creator wallets, delegated AI execution, permission-controlled payments |
| **Venice AI** | Autonomous verification intelligence, content evaluation engine |
| **1Shot API** | Gasless reward execution, better participant experience |

**Agentic Application:** Multiple AI agents coordinate campaign creation → verification → payment.

---

## Future Expansion

Future versions can introduce:

- Creator reputation scores
- AI campaign optimization
- Cross-chain campaigns
- Automated influencer matching
- Onchain engagement reputation NFTs
- AI-generated campaign recommendations

---

## Final Vision

TrueEngage creates an autonomous creator economy where AI agents handle trust, verification, and payments while smart wallets provide secure programmable execution.

**Creators** focus on campaigns. **Participants** focus on contribution. **AI** handles verification. **Blockchain** handles ownership and settlement.

---

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL 16
- Foundry (forge)
- API keys: Venice AI, 1Shot
- Funded Sepolia relayer wallet
- **Sepolia USDC** from [Circle faucet](https://faucet.circle.com) (official testnet USDC, not MockUSDC)

### Sepolia USDC

TrueEngage uses **official Circle USDC** on Ethereum Sepolia:

`0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`

Get free testnet USDC at [faucet.circle.com](https://faucet.circle.com).

### Setup

```bash
cp .env.example .env
# Fill VENICE_API_KEY, ONESHOT_API_KEY, RELAYER_PRIVATE_KEY

pnpm install
pnpm build
docker compose -f docker/docker-compose.yml up postgres -d
pnpm db:push
```

### Deploy Contracts

```bash
cd apps/contracts
forge install foundry-rs/forge-std OpenZeppelin/openzeppelin-contracts --no-commit
pnpm contracts:test
pnpm contracts:deploy
# Copy printed addresses into .env

# If switching from MockUSDC, redeploy escrow only:
pnpm contracts:deploy-escrow
```

`USDC_ADDRESS` defaults to official Sepolia USDC — the deploy script no longer mints MockUSDC.

### Run

```bash
cp .env apps/backend/.env
pnpm --filter @trueengage/backend dev
pnpm --filter @trueengage/frontend dev
```

Open http://localhost:3000

### Verify Demo Flow

With backend running and PostgreSQL available:

```bash
node scripts/demo-flow.mjs
```

This walks through: create campaign → deposit → submit proof → AI verify → payment agent.

## Demo Flow

1. **Creator** connects MetaMask Smart Account
2. **Creator** pays **1 USDC platform fee** and creates campaign (title, rules, reward, budget)
3. **Creator** deposits USDC into escrow
4. **Creator** grants payment agent permission (ERC-7715)
5. **Participant** browses marketplace and accepts task
6. **Participant** submits proof (URL, screenshot, description)
7. **Venice AI** verifies submission (authenticity, quality, compliance)
8. **Payment Agent** releases USDC reward (gasless via 1Shot/relayer)
9. **Dashboard** shows AI scores and payout status

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/wallet/connect` | Connect wallet |
| POST | `/wallet/delegate` | Grant campaign permissions |
| GET | `/platform/fee` | Platform fee info (1 USDC) |
| POST | `/campaigns` | Create campaign (requires `platformFeeTxHash`) |
| GET | `/campaigns` | List campaigns |
| GET | `/campaigns/:id` | Campaign details |
| POST | `/campaigns/:id/deposit` | Deposit to escrow |
| POST | `/submissions` | Submit proof |
| POST | `/submissions/:id/verify` | Run AI verification + payment |
| GET | `/agents/activity` | Agent decision feed |

## WebSocket Events

`submissionCreated` · `verificationStarted` · `verificationCompleted` · `paymentExecuted` · `campaignUpdated` · `agentDecision`

## License

MIT
