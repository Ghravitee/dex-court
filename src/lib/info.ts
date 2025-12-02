// Backend Development Update: On-Chain Dispute System Integration
// ---------------------------------------------------------------
// File prepared for backend developer
// Contains: interfaces, requirements, payload examples, and integration notes

// 1. Updated Interface for Dispute Creation
export interface CreateDisputeRequest {
  // Existing fields
  title: string;
  description: string;
  requestKind: number; // DisputeTypeEnum
  defendant: string;
  claim: string;
  witnesses: string[];

  // NEW FIELDS FOR ON-CHAIN INTEGRATION
  votingId: string; // Unique identifier for on-chain voting
  proBonoFlag: boolean; // True = Pro Bono, False = Paid
  feeArg: number; // Fee amount (0 for Pro Bono, >0 for Paid)
}

// 2. Backend API Updates Required
// --------------------------------
// Endpoint: POST /dispute
// Required changes:
// - Accept votingId, proBonoFlag, feeArg
// - Store all three in database
// - Ensure votingId is UNIQUE
// - Update validation logic accordingly

// 3. Database Schema Changes
// ---------------------------
// Add the following fields to the disputes table:
// - voting_id         VARCHAR / TEXT   (unique)
// - pro_bono_flag     BOOLEAN          (not null)
// - fee_arg           NUMERIC          (not null)
// Ensure voting_id is unique for cross‑referencing with smart contract state

// 4. Smart Contract Integration Flow
// ----------------------------------
// Sequence:
// 1. Frontend sends POST /dispute with all new params
// 2. Backend creates dispute and returns success
// 3. Frontend calls contract.openVote(votingId, proBonoFlag, feeArg)
// 4. Smart contract emits on-chain events → frontend updates dispute status

// Smart Contract Signature:
// function openVote(uint256 votingId, bool proBono, uint256 feeAmount) external payable

// 5. Example Payloads
// ---------------------
// BEFORE:
// {
//   "title": "Refund dispute",
//   "description": "User refused refund",
//   "requestKind": 1,
//   "defendant": "john_doe",
//   "claim": "Requesting full refund",
//   "witnesses": ["witness1", "witness2"]
// }

// AFTER:
// {
//   "title": "Refund dispute",
//   "description": "User refused refund",
//   "requestKind": 1,
//   "defendant": "john_doe",
//   "claim": "Requesting full refund",
//   "witnesses": ["witness1", "witness2"],
//   "votingId": "12345678901234567890",
//   "proBonoFlag": false,
//   "feeArg": 10000000000000000
// }

// 6. Testing Requirements
// ------------------------
// Backend must validate both proBono and Paid flows:
// - Pro Bono: proBonoFlag: true,  feeArg: 0
// - Paid:     proBonoFlag: false, feeArg: >0
// Must validate and enforce unique votingId
// Ensure old dispute logic remains unchanged

// 7. Integration Expectations
// ----------------------------
// Backend responsibilities:
// - Accept and store new fields
// - Return them in all dispute retrieval responses
// - Maintain consistency for cross-chain tracking

// Priority: HIGH – Needed for complete on-chain dispute workflow
