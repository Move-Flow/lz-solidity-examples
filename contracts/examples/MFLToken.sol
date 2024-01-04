// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MFLToken is ERC20 {
    constructor() ERC20("MFL Token", "MFL") {
        _mint(msg.sender, 100 * 10**uint(decimals()));
    }

    function mint() public {
        require(totalSupply() + 100 * 10**uint(decimals()) <= 999999999 * 10**uint(decimals()), "Token cap reached");
        _mint(msg.sender, 100 * 10**uint(decimals()));
    }
}