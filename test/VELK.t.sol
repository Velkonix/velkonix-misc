// SPDX-License-Identifier: MIT
pragma solidity 0.8.33;

import {Test} from "forge-std/Test.sol";
import {VELK} from "../src/token/VELK.sol";

contract VELKTest is Test {
    VELK private token;

    address private owner = address(this);
    address private minter = address(0xBEEF);
    address private alice = address(0xA11CE);

    function setUp() public {
        token = new VELK(minter);
    }

    function testConstructorSetsMinter() public view {
        assertEq(token.minter(), minter);
        assertTrue(token.hasRole(token.DEFAULT_ADMIN_ROLE(), owner));
    }

    function testSetMinterOnlyOwner() public {
        vm.prank(alice);
        vm.expectRevert();
        token.setMinter(alice);

        token.setMinter(alice);
        assertEq(token.minter(), alice);
    }

    function testSetMinterRejectsZero() public {
        vm.expectRevert(VELK.ZeroAddress.selector);
        token.setMinter(address(0));
    }

    function testMintOnlyMinter() public {
        vm.prank(alice);
        vm.expectRevert(VELK.OnlyMinter.selector);
        token.mint(alice, 1e18);

        vm.prank(minter);
        token.mint(alice, 2e18);
        assertEq(token.balanceOf(alice), 2e18);
        assertEq(token.totalSupply(), 2e18);
    }

    function testBurnOnlyMinter() public {
        vm.prank(minter);
        token.mint(alice, 3e18);

        vm.prank(alice);
        vm.expectRevert(VELK.OnlyMinter.selector);
        token.burnFrom(alice, 1e18);

        vm.prank(minter);
        token.burnFrom(alice, 1e18);
        assertEq(token.balanceOf(alice), 2e18);
        assertEq(token.totalSupply(), 2e18);
    }
}
