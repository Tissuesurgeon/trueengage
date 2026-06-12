// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {CampaignManager} from "../src/CampaignManager.sol";

contract CampaignManagerTest is Test {
    CampaignManager manager;

    function setUp() public {
        manager = new CampaignManager();
    }

    function testCreateCampaign() public {
        uint256 id = manager.createCampaign(
            "Test Campaign",
            bytes32(uint256(1)),
            2e6,
            100e6,
            20,
            block.timestamp + 7 days
        );
        assertEq(id, 1);
        CampaignManager.Campaign memory c = manager.getCampaign(1);
        assertEq(c.reward, 2e6);
        assertEq(c.budget, 100e6);
    }

    function testCloseCampaign() public {
        manager.createCampaign("Test", bytes32(0), 1e6, 10e6, 5, block.timestamp + 1 days);
        manager.closeCampaign(1);
        CampaignManager.Campaign memory c = manager.getCampaign(1);
        assertEq(uint256(c.status), uint256(CampaignManager.Status.Closed));
    }
}
