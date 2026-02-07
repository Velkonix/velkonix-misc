// SPDX-License-Identifier: MIT
pragma solidity 0.8.33;

import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {xVELK} from "../token/xVELK.sol";

contract MockRewardsController {
    xVELK public immutable rewardToken;

    mapping(address => uint256) public pendingRewards;

    event RewardsAccrued(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);

    constructor(address rewardTokenAddress) {
        rewardToken = xVELK(rewardTokenAddress);
    }

    function accrue(address user, uint256 amount) external {
        pendingRewards[user] += amount;
        emit RewardsAccrued(user, amount);
    }

    function claimAllRewards(address[] calldata, address to)
        external
        returns (address[] memory rewardsList, uint256[] memory claimedAmounts)
    {
        uint256 amount = pendingRewards[msg.sender];
        pendingRewards[msg.sender] = 0;
        if (amount > 0) {
            rewardToken.mint(to, amount);
        }
        rewardsList = new address[](1);
        claimedAmounts = new uint256[](1);
        rewardsList[0] = address(rewardToken);
        claimedAmounts[0] = amount;
        emit RewardsClaimed(msg.sender, amount);
    }
}
