// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract SubmissionManager {
    enum ApprovalStatus {
        Pending,
        Approved,
        Rejected
    }

    struct Submission {
        uint256 campaignId;
        address participant;
        bytes32 proofHash;
        uint256 aiScore;
        ApprovalStatus status;
    }

    address public verifier;
    uint256 public nextSubmissionId = 1;
    mapping(uint256 => Submission) public submissions;

    event ProofSubmitted(uint256 indexed submissionId, uint256 indexed campaignId, address participant);
    event SubmissionApproved(uint256 indexed submissionId, uint256 aiScore);
    event SubmissionRejected(uint256 indexed submissionId, uint256 aiScore);

    constructor(address _verifier) {
        verifier = _verifier;
    }

    function submitProof(uint256 campaignId, bytes32 proofHash) external returns (uint256 submissionId) {
        submissionId = nextSubmissionId++;
        submissions[submissionId] = Submission({
            campaignId: campaignId,
            participant: msg.sender,
            proofHash: proofHash,
            aiScore: 0,
            status: ApprovalStatus.Pending
        });
        emit ProofSubmitted(submissionId, campaignId, msg.sender);
    }

    function approveSubmission(uint256 submissionId, uint256 aiScore) external {
        require(msg.sender == verifier, "Only verifier");
        Submission storage s = submissions[submissionId];
        require(s.status == ApprovalStatus.Pending, "Not pending");
        s.aiScore = aiScore;
        s.status = ApprovalStatus.Approved;
        emit SubmissionApproved(submissionId, aiScore);
    }

    function rejectSubmission(uint256 submissionId, uint256 aiScore) external {
        require(msg.sender == verifier, "Only verifier");
        Submission storage s = submissions[submissionId];
        require(s.status == ApprovalStatus.Pending, "Not pending");
        s.aiScore = aiScore;
        s.status = ApprovalStatus.Rejected;
        emit SubmissionRejected(submissionId, aiScore);
    }

    function getSubmission(uint256 submissionId) external view returns (Submission memory) {
        return submissions[submissionId];
    }
}
