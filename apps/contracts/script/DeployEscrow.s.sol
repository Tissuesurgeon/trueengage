// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {RewardEscrow} from "../src/RewardEscrow.sol";

/// @notice Redeploy RewardEscrow only (e.g. when switching from MockUSDC to official Sepolia USDC)
contract DeployEscrow is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("RELAYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        address usdc = vm.envAddress("USDC_ADDRESS");
        address campaignManager = vm.envAddress("CAMPAIGN_MANAGER_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        RewardEscrow escrow = new RewardEscrow(usdc, deployer, campaignManager);

        vm.stopBroadcast();

        console.log("USDC_ADDRESS=", usdc);
        console.log("REWARD_ESCROW_ADDRESS=", address(escrow));
        console.log("PAYMENT_AGENT_ADDRESS=", deployer);
    }
}
