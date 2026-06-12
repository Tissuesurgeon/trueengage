// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {CampaignManager} from "../src/CampaignManager.sol";
import {SubmissionManager} from "../src/SubmissionManager.sol";
import {RewardEscrow} from "../src/RewardEscrow.sol";

/// @notice Official Circle USDC on Ethereum Sepolia
address constant SEPOLIA_USDC = 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238;

contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("RELAYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        address usdcAddress = _resolveUsdc();

        vm.startBroadcast(deployerPrivateKey);

        CampaignManager campaignManager = new CampaignManager();
        SubmissionManager submissionManager = new SubmissionManager(deployer);
        RewardEscrow escrow = new RewardEscrow(
            usdcAddress,
            deployer,
            address(campaignManager)
        );

        vm.stopBroadcast();

        console.log("USDC_ADDRESS=", usdcAddress);
        console.log("CAMPAIGN_MANAGER_ADDRESS=", address(campaignManager));
        console.log("SUBMISSION_MANAGER_ADDRESS=", address(submissionManager));
        console.log("REWARD_ESCROW_ADDRESS=", address(escrow));
        console.log("PAYMENT_AGENT_ADDRESS=", deployer);
    }

    function _resolveUsdc() internal view returns (address) {
        string memory configured = vm.envOr("USDC_ADDRESS", string(""));
        if (bytes(configured).length > 0) {
            console.log("Using configured USDC at", configured);
            return vm.parseAddress(configured);
        }
        console.log("Using official Sepolia USDC at", SEPOLIA_USDC);
        return SEPOLIA_USDC;
    }
}
