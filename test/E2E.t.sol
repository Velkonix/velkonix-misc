// SPDX-License-Identifier: MIT
pragma solidity 0.8.33;

import {Test} from "forge-std/Test.sol";
import {VELK} from "../src/token/VELK.sol";
import {xVELK} from "../src/token/xVELK.sol";
import {RewardsDistributor} from "../src/staking/RewardsDistributor.sol";
import {Staking} from "../src/staking/Staking.sol";
import {Treasury} from "../src/treasury/Treasury.sol";
import {FeeRouter} from "../src/treasury/FeeRouter.sol";

import {MockERC20} from "../src/mocks/MockERC20.sol";
import {MockCollector} from "../src/mocks/MockCollector.sol";
import {MockAToken} from "../src/mocks/MockAToken.sol";
import {MockPool} from "../src/mocks/MockPool.sol";
import {MockRewardsController} from "../src/mocks/MockRewardsController.sol";

contract E2ETest is Test {
    address public admin = address(this);
    address public user1 = address(0x1111);
    address public user2 = address(0x2222);

    VELK public velk;
    xVELK public xvelk;
    RewardsDistributor public distributor;
    Staking public staking;
    Treasury public treasury;

    MockERC20 public feeToken;
    MockCollector public collector;
    FeeRouter public feeRouter;
    MockAToken public aToken;
    MockPool public pool;

    MockRewardsController public rewardsController;

    function setUp() public {
        velk = new VELK(admin);
        xvelk = new xVELK(admin);

        distributor = new RewardsDistributor(address(xvelk));
        staking = new Staking(address(velk), address(xvelk), 90 days, 3000);
        treasury = new Treasury(address(velk), address(xvelk), address(distributor));

        xvelk.setMinter(address(staking));
        xvelk.setTransferWhitelist(address(distributor), true);
        xvelk.setTransferWhitelist(address(staking), true);
        distributor.setStaking(address(staking));
        staking.setRewardsDistributor(address(distributor));

        feeToken = new MockERC20("FeeToken", "FEE");
        collector = new MockCollector();
        feeRouter = new FeeRouter(address(collector), address(treasury));
        feeRouter.grantRole(feeRouter.CLAIMER_ROLE(), admin);

        aToken = new MockAToken(address(feeToken), address(collector), "aFEE", "aFEE");
        pool = new MockPool();

        rewardsController = new MockRewardsController(address(xvelk));
        xvelk.addMinter(address(rewardsController));
    }

    function test_e2e_flow() public {
        // user1 deposit and user2 borrow (simulated)
        feeToken.mint(user1, 1_000e18);
        feeToken.mint(user2, 1_000e18);

        // simulate aToken minting to treasury (fees accrued)
        address[] memory assets = new address[](1);
        assets[0] = address(feeToken);
        pool.mintToTreasury(assets, aToken);

        // move fees from aToken/collector to treasury via fee router
        feeToken.mint(address(collector), 500e18);
        address[] memory feeList = new address[](1);
        feeList[0] = address(feeToken);
        feeRouter.setTokens(feeList);
        feeRouter.claimAll();

        // mock fee -> xvelk conversion: assume fees converted to VELK, deposit to treasury
        velk.mint(address(this), 200e18);
        velk.approve(address(treasury), 200e18);
        treasury.depositRewards(200e18);

        // users stake xvelk
        velk.mint(user1, 300e18);
        velk.mint(user2, 300e18);

        vm.startPrank(user1);
        velk.approve(address(staking), 300e18);
        staking.stake(300e18);
        xvelk.approve(address(distributor), 300e18);
        distributor.deposit(300e18);
        vm.stopPrank();

        vm.startPrank(user2);
        velk.approve(address(staking), 300e18);
        staking.stake(300e18);
        xvelk.approve(address(distributor), 300e18);
        distributor.deposit(300e18);
        vm.stopPrank();

        // claim staking rewards
        vm.prank(user1);
        distributor.claim();
        vm.prank(user2);
        distributor.claim();

        // mock rewards for deposit/borrow in xvelk
        rewardsController.accrue(user1, 50e18);
        rewardsController.accrue(user2, 70e18);

        // users claim xvelk rewards for deposit/borrow
        address[] memory rewardAssets = new address[](1);
        rewardAssets[0] = address(aToken);

        vm.prank(user1);
        rewardsController.claimAllRewards(rewardAssets, user1);
        vm.prank(user2);
        rewardsController.claimAllRewards(rewardAssets, user2);

        assertGt(xvelk.balanceOf(user1), 0);
        assertGt(xvelk.balanceOf(user2), 0);
    }
}
