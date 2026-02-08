// SPDX-License-Identifier: MIT
pragma solidity 0.8.33;

import {Test} from "forge-std/Test.sol";
import {FeeRouter} from "../src/treasury/FeeRouter.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockToken is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract MockCollector {
    address public constant ETH_MOCK_ADDRESS = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    function transfer(ERC20 token, address recipient, uint256 amount) external {
        if (address(token) == ETH_MOCK_ADDRESS) {
            payable(recipient).transfer(amount);
            return;
        }
        token.transfer(recipient, amount);
    }

    receive() external payable {}
}

contract FeeRouterTest is Test {
    FeeRouter public router;
    MockCollector public collector;
    MockToken public tokenA;
    MockToken public tokenB;

    address public receiver = address(0xBEEF);
    address public claimer = address(0xCAFE);

    function setUp() public {
        collector = new MockCollector();
        router = new FeeRouter(address(collector), receiver);
        tokenA = new MockToken("TokenA", "TKA");
        tokenB = new MockToken("TokenB", "TKB");

        router.grantRole(router.CLAIMER_ROLE(), claimer);
    }

    function test_claim_all_tokens() public {
        tokenA.mint(address(collector), 100e18);
        tokenB.mint(address(collector), 200e18);

        address[] memory list = new address[](2);
        list[0] = address(tokenA);
        list[1] = address(tokenB);
        router.setTokens(list);

        vm.prank(claimer);
        router.claimAll();

        assertEq(tokenA.balanceOf(receiver), 100e18);
        assertEq(tokenB.balanceOf(receiver), 200e18);
    }

    function test_claim_subset() public {
        tokenA.mint(address(collector), 50e18);
        tokenB.mint(address(collector), 80e18);

        address[] memory list = new address[](1);
        list[0] = address(tokenA);

        vm.prank(claimer);
        router.claim(list);

        assertEq(tokenA.balanceOf(receiver), 50e18);
        assertEq(tokenB.balanceOf(receiver), 0);
    }

    function test_claim_eth_mock() public {
        address[] memory list = new address[](1);
        list[0] = collector.ETH_MOCK_ADDRESS();
        router.setTokens(list);

        vm.deal(address(collector), 1 ether);

        vm.prank(claimer);
        router.claimAll();

        assertEq(receiver.balance, 1 ether);
    }

    function test_only_claimer() public {
        address[] memory list = new address[](1);
        list[0] = address(tokenA);
        router.setTokens(list);

        vm.expectRevert();
        router.claimAll();
    }
}
