// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract CampaignManager {
    enum Status {
        Active,
        Closed,
        Completed
    }

    struct Campaign {
        address creator;
        string title;
        bytes32 requirementsHash;
        uint256 reward;
        uint256 budget;
        uint256 maxParticipants;
        uint256 participantCount;
        uint256 deadline;
        Status status;
    }

    uint256 public nextCampaignId = 1;
    mapping(uint256 => Campaign) public campaigns;

    event CampaignCreated(
        uint256 indexed campaignId,
        address indexed creator,
        string title,
        uint256 reward,
        uint256 budget
    );
    event CampaignClosed(uint256 indexed campaignId);

    function createCampaign(
        string calldata title,
        bytes32 requirementsHash,
        uint256 reward,
        uint256 budget,
        uint256 maxParticipants,
        uint256 deadline
    ) external returns (uint256 campaignId) {
        require(reward > 0, "Reward must be positive");
        require(budget >= reward, "Budget must cover reward");
        require(maxParticipants > 0, "Max participants required");
        require(deadline > block.timestamp, "Deadline must be future");

        campaignId = nextCampaignId++;
        campaigns[campaignId] = Campaign({
            creator: msg.sender,
            title: title,
            requirementsHash: requirementsHash,
            reward: reward,
            budget: budget,
            maxParticipants: maxParticipants,
            participantCount: 0,
            deadline: deadline,
            status: Status.Active
        });

        emit CampaignCreated(campaignId, msg.sender, title, reward, budget);
    }

    function getCampaign(uint256 campaignId) external view returns (Campaign memory) {
        return campaigns[campaignId];
    }

    function incrementParticipantCount(uint256 campaignId) external {
        Campaign storage c = campaigns[campaignId];
        require(c.status == Status.Active, "Campaign not active");
        require(c.participantCount < c.maxParticipants, "Campaign full");
        c.participantCount++;
    }

    function closeCampaign(uint256 campaignId) external {
        Campaign storage c = campaigns[campaignId];
        require(msg.sender == c.creator, "Only creator");
        require(c.status == Status.Active, "Not active");
        c.status = Status.Closed;
        emit CampaignClosed(campaignId);
    }
}
