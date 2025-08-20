'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'ethers';
import Market_ABI from '@/abis/Market.json';
import LiquidityPool_ABI from '@/abis/LiquidityPool.json';
import ERC20_ABI from '@/abis/ERC20.json';

// --- Config ---
const MARKET_CONTRACT_ADDRESS = '0x60d6cf3c5fe359dd232d0502467c0228f4026626';

const TOKENS = [
  { address: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14', symbol: 'WETH', decimals: 18 },
  { address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', symbol: 'USDC', decimals: 6 },
];
// --- End Config ---

export function LiquidityProvision() {
  const { address: account } = useAccount();
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const [selectedToken, setSelectedToken] = useState(TOKENS[0]);
  const [depositAmount, setDepositAmount] = useState('');

  const { data: poolAddress } = useReadContract({
    address: MARKET_CONTRACT_ADDRESS,
    abi: Market_ABI,
    functionName: 'getTokenToLiquidityPools',
    args: [selectedToken.address],
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: selectedToken.address as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [account!, poolAddress as `0x${string}`],
    scopeKey: `${account}-${selectedToken.address}-${poolAddress}`,
    enabled: !!account && !!poolAddress,
  });

  const needsApproval = useMemo(() => {
    if (depositAmount && allowance !== undefined) {
      try {
        const depositAmountParsed = parseUnits(depositAmount, selectedToken.decimals);
        return depositAmountParsed > (allowance as bigint);
      } catch (e) {
        return false;
      }
    }
    return false;
  }, [depositAmount, allowance, selectedToken.decimals]);

  useEffect(() => {
    if (isConfirmed) {
      refetchAllowance();
    }
  }, [isConfirmed, refetchAllowance]);

  const handleApprove = () => {
    const amount = parseUnits(depositAmount, selectedToken.decimals);
    writeContract({
      address: selectedToken.address as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [poolAddress as `0x${string}`, amount],
    });
  };

  const handleDeposit = () => {
    if (!depositAmount || !account || !poolAddress) return;
    const amount = parseUnits(depositAmount, selectedToken.decimals);
    writeContract({
      address: poolAddress as `0x${string}`,
      abi: LiquidityPool_ABI,
      functionName: 'deposit',
      args: [amount, account],
    });
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="p-4 border rounded-lg space-y-4">
        <div className="mb-4">
          <label htmlFor="depositToken" className="block text-sm font-medium text-gray-700">Token</label>
          <select
            id="depositToken"
            name="depositToken"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            value={selectedToken.symbol}
            onChange={(e) => setSelectedToken(TOKENS.find(t => t.symbol === e.target.value) || TOKENS[0])}
          >
            {TOKENS.map(token => <option key={token.symbol}>{token.symbol}</option>)}
          </select>
        </div>
        <div className="mb-4">
          <label htmlFor="depositAmount" className="block text-sm font-medium text-gray-700">Amount</label>
          <input
            type="number"
            name="depositAmount"
            id="depositAmount"
            className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            placeholder="0.0"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
          />
        </div>

        {needsApproval ? (
          <button type="button" onClick={handleApprove} disabled={isPending || !depositAmount} className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400">
            {isPending ? 'Approving...' : 'Approve'}
          </button>
        ) : (
          <button type="button" onClick={handleDeposit} disabled={isPending || !depositAmount} className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400">
            {isPending ? 'Depositing...' : 'Deposit'}
          </button>
        )}
      </div>

      {hash && (
        <div className="mt-4 text-center text-xs text-gray-500">
          <p>Tx: <a href={`https://sepolia.etherscan.io/tx/${hash}`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">{hash.slice(0, 6)}...{hash.slice(-4)}</a></p>
          {isConfirming && <p>Waiting for confirmation...</p>}
          {isConfirmed && <p className="text-green-600">Transaction successful!</p>}
          {error && <p className="text-red-600">Error: {error.shortMessage}</p>}
        </div>
      )}
    </div>
  );
}
