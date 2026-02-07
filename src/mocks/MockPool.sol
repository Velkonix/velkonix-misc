// SPDX-License-Identifier: MIT
pragma solidity 0.8.33;

import {MockAToken} from "./MockAToken.sol";

contract MockPool {
    function mintToTreasury(address[] calldata assets, MockAToken aToken) external {
        for (uint256 i = 0; i < assets.length; i++) {
            if (assets[i] == address(0)) {
                continue;
            }
            aToken.mintToTreasury(100e18);
        }
    }
}
