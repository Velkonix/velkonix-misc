// SPDX-License-Identifier: MIT
pragma solidity 0.8.33;

import {Test} from "forge-std/Test.sol";

import {VELK} from "../src/token/VELK.sol";
import {xVELK} from "../src/token/xVELK.sol";
import {Staking} from "../src/staking/Staking.sol";
import {RewardsDistributor} from "../src/staking/RewardsDistributor.sol";

contract StakingFuzzTest is Test {
    uint256 private constant LOCK_DURATION = 7 days;
    uint256 private constant PENALTY_BPS = 5_000;
    uint256 private constant MAX_AMOUNT = 1_000_000 ether;

    VELK private velk;
    xVELK private xvelk;
    Staking private staking;
    RewardsDistributor private distributor;

    function setUp() public {
        velk = new VELK(address(this));
        xvelk = new xVELK(address(this));
        staking = new Staking(address(velk), address(xvelk), LOCK_DURATION, PENALTY_BPS);
        distributor = new RewardsDistributor(address(xvelk));

        staking.setRewardsDistributor(address(distributor));
        distributor.setStaking(address(staking));

        xvelk.setMinter(address(staking));
        xvelk.setTransferWhitelist(address(distributor), true);
    }

    function testFuzzStake(uint256 rawAmount, address user) public {
        uint256 amount = bound(rawAmount, 1, MAX_AMOUNT);
        vm.assume(user != address(0));
        vm.assume(user != address(staking));
        vm.assume(user != address(distributor));

        velk.mint(user, amount);
        vm.startPrank(user);
        velk.approve(address(staking), amount);
        staking.stake(amount);
        vm.stopPrank();

        (uint256 deposited,) = staking.deposits(user);
        assertEq(deposited, amount);
        assertEq(velk.balanceOf(address(staking)), amount);
        assertEq(xvelk.balanceOf(user), amount);
    }

    function testFuzzExit(uint256 rawAmount, address user) public {
        uint256 amount = bound(rawAmount, 1, MAX_AMOUNT);
        vm.assume(user != address(0));
        vm.assume(user != address(staking));
        vm.assume(user != address(distributor));

        velk.mint(user, amount);
        vm.startPrank(user);
        velk.approve(address(staking), amount);
        staking.stake(amount);
        vm.stopPrank();

        vm.warp(block.timestamp + LOCK_DURATION);
        vm.prank(user);
        staking.exit();

        (uint256 deposited,) = staking.deposits(user);
        assertEq(deposited, 0);
        assertEq(xvelk.balanceOf(user), 0);
        assertEq(velk.balanceOf(user), amount);
        assertEq(velk.balanceOf(address(staking)), 0);
    }

    function testFuzzInstantExit(uint256 rawAmount, address user) public {
        uint256 amount = bound(rawAmount, 1, MAX_AMOUNT);
        vm.assume(user != address(0));
        vm.assume(user != address(staking));
        vm.assume(user != address(distributor));

        velk.mint(user, amount);
        vm.startPrank(user);
        velk.approve(address(staking), amount);
        staking.stake(amount);
        vm.stopPrank();

        vm.warp(block.timestamp + LOCK_DURATION - 1);
        vm.prank(user);
        staking.instantExit(amount);

        uint256 penalty = (amount * PENALTY_BPS) / 10_000;
        uint256 payout = amount - penalty;

        (uint256 deposited,) = staking.deposits(user);
        assertEq(deposited, 0);
        assertEq(xvelk.balanceOf(user), 0);
        assertEq(velk.balanceOf(user), payout);
        assertEq(xvelk.balanceOf(address(distributor)), penalty);
        assertEq(distributor.pendingRewards(), penalty);
    }
}
