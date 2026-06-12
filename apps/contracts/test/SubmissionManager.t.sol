// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {SubmissionManager} from "../src/SubmissionManager.sol";

contract SubmissionManagerTest is Test {
    SubmissionManager manager;
    address verifier = address(0xBEEF);
    address participant = address(0xCAFE);

    function setUp() public {
        manager = new SubmissionManager(verifier);
    }

    function testSubmitAndApprove() public {
        vm.prank(participant);
        uint256 id = manager.submitProof(1, bytes32(uint256(42)));

        vm.prank(verifier);
        manager.approveSubmission(id, 92);

        SubmissionManager.Submission memory s = manager.getSubmission(id);
        assertEq(uint256(s.status), uint256(SubmissionManager.ApprovalStatus.Approved));
        assertEq(s.aiScore, 92);
    }

    function testRejectNonVerifier() public {
        vm.prank(participant);
        uint256 id = manager.submitProof(1, bytes32(uint256(42)));

        vm.expectRevert("Only verifier");
        manager.approveSubmission(id, 50);
    }
}
