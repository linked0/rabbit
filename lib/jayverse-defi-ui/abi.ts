// Hand-kept minimal ABIs for the UI. The full ABIs live in out/ (forge build
// output, gitignored); the UI only needs the surface below, and keeping it
// explicit shows exactly what the screens depend on.
import { parseAbi } from "viem";

export const poolAbi = parseAbi([
  "function deposit() payable returns (uint256)",
  "function requestWithdraw(uint256 shares) returns (uint256)",
  "function claim(uint256 id)",
  "function exchangeRate() view returns (uint256)",
  "function totalPooledETH() view returns (uint256)",
  "function totalShares() view returns (uint256)",
  "function avs() view returns (address)",
  "function WITHDRAW_DELAY() view returns (uint256)",
  "function withdrawQueueLength() view returns (uint256)",
  "function withdrawQueue(uint256) view returns (address user, uint256 ethOwed, uint256 readyAt, bool claimed)",
  "event Deposited(address indexed user, uint256 ethIn, uint256 sharesMinted)",
  "event RewardsAdded(string source, uint256 amount, uint256 totalPooledETH, uint256 totalShares)",
  "event Slashed(uint256 amount, uint256 totalPooledETH, uint256 totalShares)",
]);

export const jeEthAbi = parseAbi([
  "function balanceOf(address) view returns (uint256)",
  "function sharesOf(address) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address, address) view returns (uint256)",
]);

export const jweEthAbi = parseAbi([
  "function balanceOf(address) view returns (uint256)",
  "function wrap(uint256 jeETHAmount) returns (uint256)",
  "function unwrap(uint256 jweETHAmount) returns (uint256)",
  "function ethPerToken() view returns (uint256)",
]);

export type DefiAddresses = {
  chainId: number;
  liquidityPool: `0x${string}`;
  jeETH: `0x${string}`;
  jweETH: `0x${string}`;
  mockAVS: `0x${string}`;
};
