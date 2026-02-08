// SPDX-License-Identifier: MIT
pragma solidity 0.8.33;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract MockCollector {
    using SafeERC20 for IERC20;

    address public constant ETH_MOCK_ADDRESS = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    function transfer(IERC20 token, address recipient, uint256 amount) external {
        if (address(token) == ETH_MOCK_ADDRESS) {
            payable(recipient).transfer(amount);
            return;
        }
        token.safeTransfer(recipient, amount);
    }

    receive() external payable {}
}
