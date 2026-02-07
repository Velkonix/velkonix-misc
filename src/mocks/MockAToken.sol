// SPDX-License-Identifier: MIT
pragma solidity 0.8.33;

import {ERC20} from "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

contract MockAToken is ERC20 {
    IERC20 public immutable underlying;
    address public treasury;

    constructor(address underlyingAsset, address treasuryAddress, string memory name, string memory symbol)
        ERC20(name, symbol)
    {
        underlying = IERC20(underlyingAsset);
        treasury = treasuryAddress;
    }

    function setTreasury(address treasuryAddress) external {
        treasury = treasuryAddress;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function mintToTreasury(uint256 amount) external {
        if (amount == 0) {
            return;
        }
        _mint(treasury, amount);
    }
}
