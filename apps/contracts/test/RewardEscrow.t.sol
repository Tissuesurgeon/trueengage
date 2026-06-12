// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {MockUSDC} from "../src/MockUSDC.sol";
import {CampaignManager} from "../src/CampaignManager.sol";
import {RewardEscrow} from "../src/RewardEscrow.sol";

contract RewardEscrowTest is Test {
    MockUSDC usdc;
    CampaignManager campaignManager;
    RewardEscrow escrow;
    address agent = address(0xBEEF);
    address creator = address(0xCAFE);
    address participant = address(0xDEAD);

    function setUp() public {
        usdc = new MockUSDC();
        campaignManager = new CampaignManager();
        escrow = new RewardEscrow(address(usdc), agent, address(campaignManager));
        usdc.mint(creator, 1000e6);
    }

    function testDepositAndRelease() public {
        vm.startPrank(creator);
        usdc.approve(address(escrow), 100e6);
        escrow.deposit(1, 100e6);
        vm.stopPrank();

        vm.prank(agent);
        escrow.releaseReward(1, participant, 2e6);

        assertEq(usdc.balanceOf(participant), 2e6);
        assertEq(escrow.getBalance(1), 98e6);
    }

    function testCannotExceedBudget() public {
        vm.startPrank(creator);
        usdc.approve(address(escrow), 10e6);
        escrow.deposit(1, 10e6);
        vm.stopPrank();

        vm.prank(agent);
        vm.expectRevert("Exceeds budget");
        escrow.releaseReward(1, participant, 11e6);
    }

    function testOnlyAgentCanRelease() public {
        vm.startPrank(creator);
        usdc.approve(address(escrow), 10e6);
        escrow.deposit(1, 10e6);
        vm.stopPrank();

        vm.expectRevert("Only payment agent");
        escrow.releaseReward(1, participant, 1e6);
    }
}
