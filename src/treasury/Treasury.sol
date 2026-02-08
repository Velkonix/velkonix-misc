// SPDX-License-Identifier: MIT
pragma solidity 0.8.33;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {IRewardsController} from "velkonix-contracts/src/contracts/rewards/interfaces/IRewardsController.sol";
import {xVELK} from "../token/xVELK.sol";
import {RewardsDistributor} from "../staking/RewardsDistributor.sol";

contract Treasury is AccessControl, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    error ZeroAddress();
    error NoController();
    error NoAssets();

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    IERC20 public immutable velk;
    xVELK public immutable xvelk;
    RewardsDistributor public immutable rewardsDistributor;

    IRewardsController public rewardsController;
    address[] public rewardAssets;

    event RewardsControllerUpdated(address indexed controller);
    event RewardAssetsUpdated(address[] assets);
    event AaveRewardsClaimed(address[] rewardsList, uint256[] amounts);

    constructor(address velkToken, address xvelkToken, address rewardsDistributor_) {
        if (velkToken == address(0) || xvelkToken == address(0) || rewardsDistributor_ == address(0)) {
            revert ZeroAddress();
        }
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        velk = IERC20(velkToken);
        xvelk = xVELK(xvelkToken);
        rewardsDistributor = RewardsDistributor(rewardsDistributor_);
    }

    function setRewardsController(address controller) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (controller == address(0)) {
            revert ZeroAddress();
        }
        rewardsController = IRewardsController(controller);
        emit RewardsControllerUpdated(controller);
    }

    function setRewardAssets(address[] calldata assets) external onlyRole(DEFAULT_ADMIN_ROLE) {
        delete rewardAssets;
        for (uint256 i = 0; i < assets.length; i++) {
            rewardAssets.push(assets[i]);
        }
        emit RewardAssetsUpdated(assets);
    }

    function claimAaveRewards()
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
        nonReentrant
        whenNotPaused
        returns (address[] memory rewardsList, uint256[] memory claimedAmounts)
    {
        if (address(rewardsController) == address(0)) {
            revert NoController();
        }
        if (rewardAssets.length == 0) {
            revert NoAssets();
        }
        (rewardsList, claimedAmounts) = rewardsController.claimAllRewards(rewardAssets, address(this));
        emit AaveRewardsClaimed(rewardsList, claimedAmounts);
    }

    function depositRewards(uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant whenNotPaused {
        if (amount == 0) {
            return;
        }
        velk.safeTransferFrom(msg.sender, address(this), amount);
        xvelk.mint(address(rewardsDistributor), amount);
        rewardsDistributor.notifyReward(amount);
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }
}
