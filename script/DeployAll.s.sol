// SPDX-License-Identifier: MIT
pragma solidity 0.8.33;

import {Script} from "forge-std/Script.sol";
import {VELK} from "../src/token/VELK.sol";
import {xVELK} from "../src/token/xVELK.sol";
import {RewardsDistributor} from "../src/staking/RewardsDistributor.sol";
import {Staking} from "../src/staking/Staking.sol";
import {Treasury} from "../src/treasury/Treasury.sol";
import {FeeRouter} from "../src/treasury/FeeRouter.sol";

contract DeployAll is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        address velkMinter = _envOrDefault("VELK_MINTER", deployer);
        uint256 lockDuration = _envOrDefaultUint("STAKING_LOCK_DURATION", 90 days);
        uint256 penaltyBps = _envOrDefaultUint("STAKING_PENALTY_BPS", 3000);

        address feeCollector = _envOrDefault("FEE_COLLECTOR", address(0));
        address feeReceiver = _envOrDefault("FEE_RECEIVER", address(0));
        address feeClaimer = _envOrDefault("FEE_CLAIMER", address(0));

        vm.startBroadcast(deployerKey);

        VELK velk = new VELK(velkMinter);
        xVELK xvelk = new xVELK(address(this));
        RewardsDistributor rewards = new RewardsDistributor(address(xvelk));
        Staking staking = new Staking(address(velk), address(xvelk), lockDuration, penaltyBps);
        Treasury treasury = new Treasury(address(velk), address(xvelk), address(rewards));

        xvelk.setMinter(address(staking));
        xvelk.setTransferWhitelist(address(rewards), true);
        xvelk.setTransferWhitelist(address(staking), true);

        rewards.setStaking(address(staking));
        staking.setRewardsDistributor(address(rewards));

        FeeRouter feeRouter;
        if (feeCollector != address(0) && feeReceiver != address(0)) {
            feeRouter = new FeeRouter(feeCollector, feeReceiver);
            if (feeClaimer != address(0)) {
                feeRouter.grantRole(feeRouter.CLAIMER_ROLE(), feeClaimer);
            }
        }

        vm.stopBroadcast();

        string memory path = _envOrDefaultString(
            "DEPLOYMENT_PATH",
            "deployments/arbitrum-sepolia/velkonix-misc-deployment.json"
        );

        string memory json;
        json = vm.serializeAddress("deploy", "deployer", deployer);
        json = vm.serializeAddress("deploy", "velk", address(velk));
        json = vm.serializeAddress("deploy", "xvelk", address(xvelk));
        json = vm.serializeAddress("deploy", "rewardsDistributor", address(rewards));
        json = vm.serializeAddress("deploy", "staking", address(staking));
        json = vm.serializeAddress("deploy", "treasury", address(treasury));
        if (address(feeRouter) != address(0)) {
            json = vm.serializeAddress("deploy", "feeRouter", address(feeRouter));
        }
        vm.writeJson(json, path);
    }

    function _envOrDefault(string memory key, address fallbackValue) internal view returns (address) {
        try vm.envAddress(key) returns (address value) {
            if (value == address(0)) {
                return fallbackValue;
            }
            return value;
        } catch {
            return fallbackValue;
        }
    }

    function _envOrDefaultUint(string memory key, uint256 fallbackValue) internal view returns (uint256) {
        try vm.envUint(key) returns (uint256 value) {
            if (value == 0) {
                return fallbackValue;
            }
            return value;
        } catch {
            return fallbackValue;
        }
    }

    function _envOrDefaultString(string memory key, string memory fallbackValue) internal view returns (string memory) {
        try vm.envString(key) returns (string memory value) {
            if (bytes(value).length == 0) {
                return fallbackValue;
            }
            return value;
        } catch {
            return fallbackValue;
        }
    }
}
