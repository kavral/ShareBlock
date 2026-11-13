// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract PropertyToken is ERC20, AccessControl, ReentrancyGuard {
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");

    mapping(address => uint256) public dividends;
    uint256 public totalDividendsDistributed;

    event DividendsDeposited(uint256 amount);
    event DividendClaimed(address indexed investor, uint256 amount);
    event TokensMinted(address indexed to, uint256 amount);

    constructor(string memory name, string memory symbol, address admin) ERC20(name, symbol) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MANAGER_ROLE, admin);
    }

    function mint(address to, uint256 amount) external onlyRole(MANAGER_ROLE) {
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }

    function depositDividends() external payable onlyRole(MANAGER_ROLE) {
        require(msg.value > 0, "No dividends to deposit");
        uint256 supply = totalSupply();
        require(supply > 0, "No tokens minted yet");

        totalDividendsDistributed += msg.value;
        emit DividendsDeposited(msg.value);
    }

    function claimDividends() external nonReentrant {
        uint256 balance = balanceOf(msg.sender);
        require(balance > 0, "No tokens held");
        
        uint256 totalShare = (balance * totalDividendsDistributed) / totalSupply();
        uint256 payout = totalShare - dividends[msg.sender];
        require(payout > 0, "No new dividends to claim");

        dividends[msg.sender] = totalShare;
        
        (bool success, ) = payable(msg.sender).call{value: payout}("");
        require(success, "Transfer failed");

        emit DividendClaimed(msg.sender, payout);
    }
}