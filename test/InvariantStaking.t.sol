// SPDX-License-Identifier: MIT
pragma solidity 0.8.33;

import {Test} from "forge-std/Test.sol";
import {StdInvariant} from "forge-std/StdInvariant.sol";

import {VELK} from "../src/token/VELK.sol";
import {xVELK} from "../src/token/xVELK.sol";
import {Staking} from "../src/staking/Staking.sol";
import {RewardsDistributor} from "../src/staking/RewardsDistributor.sol";

contract StakingHandler is Test {
    uint256 private constant MAX_AMOUNT = 1_000_000 ether;

    VELK public velk;
    xVELK public xvelk;
    Staking public staking;
    RewardsDistributor public distributor;
    address[] public actors;
    uint256 public lockDuration;

    constructor(
        VELK velk_,
        xVELK xvelk_,
        Staking staking_,
        RewardsDistributor distributor_,
        address[] memory actors_,
        uint256 lockDuration_
    ) {
        velk = velk_;
        xvelk = xvelk_;
        staking = staking_;
        distributor = distributor_;
        actors = actors_;
        lockDuration = lockDuration_;
    }

    function stake(uint256 rawAmount, uint256 actorSeed) external {
        uint256 amount = bound(rawAmount, 1, MAX_AMOUNT);
        address actor = actors[actorSeed % actors.length];

        velk.mint(actor, amount);
        vm.startPrank(actor);
        velk.approve(address(staking), amount);
        staking.stake(amount);
        vm.stopPrank();
    }

    function instantExit(uint256 rawAmount, uint256 actorSeed) external {
        address actor = actors[actorSeed % actors.length];
        (uint256 deposited, uint256 depositedAt) = staking.deposits(actor);
        if (deposited == 0) {
            return;
        }
        uint256 amount = bound(rawAmount, 1, deposited);
        uint256 unlockAt = depositedAt + lockDuration;
        if (block.timestamp >= unlockAt) {
            vm.warp(unlockAt - 1);
        }
        vm.prank(actor);
        staking.instantExit(amount);
    }

    function exit(uint256 actorSeed) external {
        address actor = actors[actorSeed % actors.length];
        (uint256 deposited, uint256 depositedAt) = staking.deposits(actor);
        if (deposited == 0) {
            return;
        }
        uint256 unlockAt = depositedAt + lockDuration;
        if (block.timestamp < unlockAt) {
            vm.warp(unlockAt);
        }
        vm.prank(actor);
        staking.exit();
    }

    function rewardsDeposit(uint256 rawAmount, uint256 actorSeed) external {
        address actor = actors[actorSeed % actors.length];
        uint256 balance = xvelk.balanceOf(actor);
        if (balance == 0) {
            return;
        }
        uint256 amount = bound(rawAmount, 1, balance);
        vm.startPrank(actor);
        if (xvelk.allowance(actor, address(distributor)) < amount) {
            xvelk.approve(address(distributor), type(uint256).max);
        }
        distributor.deposit(amount);
        vm.stopPrank();
    }

    function rewardsWithdraw(uint256 rawAmount, uint256 actorSeed) external {
        address actor = actors[actorSeed % actors.length];
        uint256 balance = distributor.balanceOf(actor);
        if (balance == 0) {
            return;
        }
        uint256 amount = bound(rawAmount, 1, balance);
        vm.prank(actor);
        distributor.withdraw(amount);
    }

    function rewardsClaim(uint256 actorSeed) external {
        address actor = actors[actorSeed % actors.length];
        vm.prank(actor);
        distributor.claim();
    }
}

contract InvariantStakinggTest is StdInvariant, Test {
    uint256 private constant LOCK_DURATION = 7 days;
    uint256 private constant PENALTY_BPS = 5_000;

    VELK private velk;
    xVELK private xvelk;
    Staking private staking;
    RewardsDistributor private distributor;
    StakingHandler private handler;
    address[] private actors;

    function setUp() public {
        actors.push(vm.addr(1));
        actors.push(vm.addr(2));
        actors.push(vm.addr(3));
        actors.push(vm.addr(4));
        actors.push(vm.addr(5));

        velk = new VELK(address(this));
        xvelk = new xVELK(address(this));
        staking = new Staking(address(velk), address(xvelk), LOCK_DURATION, PENALTY_BPS);
        distributor = new RewardsDistributor(address(xvelk));

        staking.setRewardsDistributor(address(distributor));
        distributor.setStaking(address(staking));

        xvelk.setMinter(address(staking));
        xvelk.setTransferWhitelist(address(distributor), true);

        handler = new StakingHandler(velk, xvelk, staking, distributor, actors, LOCK_DURATION);
        velk.setMinter(address(handler));

        targetContract(address(handler));
    }

    function invariant_stakingHoldsAllDeposits() public view {
        uint256 totalDeposits = 0;
        for (uint256 i = 0; i < actors.length; i++) {
            (uint256 amount,) = staking.deposits(actors[i]);
            totalDeposits += amount;
        }
        assertGe(velk.balanceOf(address(staking)), totalDeposits);
    }

    function invariant_rewardsDepositsAccounting() public view {
        uint256 totalDeposits = 0;
        for (uint256 i = 0; i < actors.length; i++) {
            totalDeposits += distributor.balanceOf(actors[i]);
        }
        assertEq(distributor.totalDeposits(), totalDeposits);
    }

    function invariant_xvelkSupplyMatchesBalances() public view {
        uint256 totalBalances = xvelk.balanceOf(address(distributor));
        for (uint256 i = 0; i < actors.length; i++) {
            totalBalances += xvelk.balanceOf(actors[i]);
        }
        assertEq(xvelk.totalSupply(), totalBalances);
    }
}
