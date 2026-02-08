// SPDX-License-Identifier: MIT
pragma solidity 0.8.33;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface ICollector {
    function ETH_MOCK_ADDRESS() external pure returns (address);
    function transfer(IERC20 token, address recipient, uint256 amount) external;
}

contract FeeRouter is AccessControl, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    error ZeroAddress();
    error EmptyTokens();

    bytes32 public constant CLAIMER_ROLE = keccak256("CLAIMER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    ICollector public collector;
    address public treasuryReceiver;
    address[] public tokens;

    event CollectorUpdated(address indexed collector);
    event TreasuryReceiverUpdated(address indexed receiver);
    event TokensUpdated(address[] tokens);
    event Claimed(address indexed token, address indexed receiver, uint256 amount);

    constructor(address collectorAddress, address receiver) {
        if (collectorAddress == address(0) || receiver == address(0)) {
            revert ZeroAddress();
        }
        collector = ICollector(collectorAddress);
        treasuryReceiver = receiver;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(CLAIMER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
    }

    function setCollector(address collectorAddress) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (collectorAddress == address(0)) {
            revert ZeroAddress();
        }
        collector = ICollector(collectorAddress);
        emit CollectorUpdated(collectorAddress);
    }

    function setTreasuryReceiver(address receiver) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (receiver == address(0)) {
            revert ZeroAddress();
        }
        treasuryReceiver = receiver;
        emit TreasuryReceiverUpdated(receiver);
    }

    function setTokens(address[] calldata tokenList) external onlyRole(DEFAULT_ADMIN_ROLE) {
        delete tokens;
        for (uint256 i = 0; i < tokenList.length; i++) {
            tokens.push(tokenList[i]);
        }
        emit TokensUpdated(tokenList);
    }

    function tokensCount() external view returns (uint256) {
        return tokens.length;
    }

    function claimAll() external onlyRole(CLAIMER_ROLE) nonReentrant whenNotPaused {
        if (tokens.length == 0) {
            revert EmptyTokens();
        }
        _claimTokens(tokens);
    }

    function claim(address[] calldata tokenList) external onlyRole(CLAIMER_ROLE) nonReentrant whenNotPaused {
        if (tokenList.length == 0) {
            revert EmptyTokens();
        }
        _claimTokens(tokenList);
    }

    function _claimTokens(address[] memory tokenList) internal {
        address receiver = treasuryReceiver;
        ICollector collectorRef = collector;
        address ethMock = collectorRef.ETH_MOCK_ADDRESS();

        for (uint256 i = 0; i < tokenList.length; i++) {
            address token = tokenList[i];
            uint256 amount;
            if (token == ethMock) {
                amount = address(collectorRef).balance;
                if (amount == 0) {
                    continue;
                }
                collectorRef.transfer(IERC20(ethMock), receiver, amount);
                emit Claimed(token, receiver, amount);
                continue;
            }

            amount = IERC20(token).balanceOf(address(collectorRef));
            if (amount == 0) {
                continue;
            }
            collectorRef.transfer(IERC20(token), receiver, amount);
            emit Claimed(token, receiver, amount);
        }
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }
}
