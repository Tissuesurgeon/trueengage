// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract RewardEscrow {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;
    address public paymentAgent;
    address public campaignManager;

    mapping(uint256 => uint256) public deposited;
    mapping(uint256 => uint256) public released;

    event Deposited(uint256 indexed campaignId, address indexed from, uint256 amount);
    event RewardReleased(uint256 indexed campaignId, address indexed to, uint256 amount);

    constructor(address _usdc, address _paymentAgent, address _campaignManager) {
        usdc = IERC20(_usdc);
        paymentAgent = _paymentAgent;
        campaignManager = _campaignManager;
    }

    function deposit(uint256 campaignId, uint256 amount) external {
        require(amount > 0, "Amount required");
        usdc.safeTransferFrom(msg.sender, address(this), amount);
        deposited[campaignId] += amount;
        emit Deposited(campaignId, msg.sender, amount);
    }

    function releaseReward(uint256 campaignId, address to, uint256 amount) external {
        require(msg.sender == paymentAgent, "Only payment agent");
        require(amount > 0, "Amount required");
        require(deposited[campaignId] >= released[campaignId] + amount, "Exceeds budget");

        released[campaignId] += amount;
        usdc.safeTransfer(to, amount);
        emit RewardReleased(campaignId, to, amount);
    }

    function getBalance(uint256 campaignId) external view returns (uint256) {
        return deposited[campaignId] - released[campaignId];
    }
}
