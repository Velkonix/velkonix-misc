// SPDX-License-Identifier: MIT
pragma solidity 0.8.33;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {xVELK} from "../token/xVELK.sol";
import {RewardsDistributor} from "./RewardsDistributor.sol";

contract Staking is AccessControl, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    error ZeroAddress();
    error ZeroAmount();
    error Locked();
    error Unlocked();
    error InvalidBps();
    error InsufficientBalance();
    error RewardsDistributorNotSet();

    struct Deposit {
        uint256 amount;
        uint256 depositTimestamp;
    }

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    IERC20 public immutable velk;
    xVELK public immutable xvelk;

    uint256 public immutable lockDuration;
    uint256 public immutable instantExitPenaltyBps;

    RewardsDistributor public rewardsDistributor;
    mapping(address => Deposit) public deposits;

    event Staked(address indexed account, uint256 amount, uint256 depositTimestamp);
    event Exited(address indexed account, uint256 amount);
    event InstantExit(address indexed account, uint256 amount, uint256 penalty);
    event RewardsDistributorUpdated(address indexed distributor);

    constructor(address velkToken, address xvelkToken, uint256 lockDuration_, uint256 instantExitPenaltyBps_) {
        if (velkToken == address(0) || xvelkToken == address(0)) {
            revert ZeroAddress();
        }
        if (instantExitPenaltyBps_ > 10_000) {
            revert InvalidBps();
        }
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        velk = IERC20(velkToken);
        xvelk = xVELK(xvelkToken);
        lockDuration = lockDuration_;
        instantExitPenaltyBps = instantExitPenaltyBps_;
    }

    function setRewardsDistributor(address distributor) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (distributor == address(0)) {
            revert ZeroAddress();
        }
        rewardsDistributor = RewardsDistributor(distributor);
        emit RewardsDistributorUpdated(distributor);
    }

    function stake(uint256 amount) external nonReentrant whenNotPaused {
        if (amount == 0) {
            revert ZeroAmount();
        }
        Deposit storage info = deposits[msg.sender];
        info.amount += amount;
        info.depositTimestamp = block.timestamp;
        velk.safeTransferFrom(msg.sender, address(this), amount);
        xvelk.mint(msg.sender, amount);
        emit Staked(msg.sender, amount, info.depositTimestamp);
    }

    function exit() external nonReentrant whenNotPaused {
        Deposit storage info = deposits[msg.sender];
        uint256 amount = info.amount;
        if (amount == 0) {
            revert InsufficientBalance();
        }
        if (block.timestamp < info.depositTimestamp + lockDuration) {
            revert Locked();
        }
        delete deposits[msg.sender];
        xvelk.burnFrom(msg.sender, amount);
        velk.safeTransfer(msg.sender, amount);
        emit Exited(msg.sender, amount);
    }

    function instantExit(uint256 amount) external nonReentrant whenNotPaused {
        if (amount == 0) {
            revert ZeroAmount();
        }
        Deposit storage info = deposits[msg.sender];
        if (info.amount < amount) {
            revert InsufficientBalance();
        }
        if (block.timestamp >= info.depositTimestamp + lockDuration) {
            revert Unlocked();
        }
        if (address(rewardsDistributor) == address(0)) {
            revert RewardsDistributorNotSet();
        }
        info.amount -= amount;
        if (info.amount == 0) {
            info.depositTimestamp = 0;
        }
        uint256 penalty = (amount * instantExitPenaltyBps) / 10_000;
        uint256 payout = amount - penalty;
        xvelk.burnFrom(msg.sender, amount);
        if (penalty > 0) {
            xvelk.mint(address(rewardsDistributor), penalty);
            rewardsDistributor.notifyReward(penalty);
        }
        velk.safeTransfer(msg.sender, payout);
        emit InstantExit(msg.sender, amount, penalty);
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }
}
