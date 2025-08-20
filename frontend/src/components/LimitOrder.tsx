'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'ethers';
import Market_ABI from '@/abis/Market.json';
import ERC20_ABI from '@/abis/ERC20.json';

// --- Config ---
const MARKET_CONTRACT_ADDRESS = '0x60d6cf3c5fe359dd232d0502467c0228f4026626';

const TOKENS = [
  { address: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14', symbol: 'WETH', decimals: 18 },
  { address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', symbol: 'USDC', decimals: 6 },
];

const FEE_TIERS = [
    { value: 500, label: '0.05%' },
    { value: 3000, label: '0.3%' },
    { value: 10000, label: '1%' },
]
// --- End Config ---

export function LimitOrder() {
  const { address: account } = useAccount();
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const [fromAmount, setFromAmount] = useState('');
  const [fromToken, setFromToken] = useState(TOKENS[0]);
  const [toToken, setToToken] = useState(TOKENS[1]);
  const [limitPrice, setLimitPrice] = useState('');
  const [selectedFee, setSelectedFee] = useState(FEE_TIERS[1].value);

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: fromToken.address as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [account!, MARKET_CONTRACT_ADDRESS],
    scopeKey: `${account}-${fromToken.address}`,
    enabled: !!account,
  });

  const needsApproval = useMemo(() => {
    if (fromAmount && allowance !== undefined) {
      try {
        const fromAmountParsed = parseUnits(fromAmount, fromToken.decimals);
        return fromAmountParsed > (allowance as bigint);
      } catch (e) {
        return false;
      }
    }
    return false;
  }, [fromAmount, allowance, fromToken.decimals]);

  useEffect(() => {
    if (isConfirmed) {
      refetchAllowance();
    }
  }, [isConfirmed, refetchAllowance]);

  const handleApprove = () => {
    const amount = parseUnits(fromAmount, fromToken.decimals);
    writeContract({
      address: fromToken.address as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [MARKET_CONTRACT_ADDRESS, amount],
    });
  };

  const handlePlaceOrder = () => {
    if (!fromAmount || !account || !limitPrice) return;
    const amount = parseUnits(fromAmount, fromToken.decimals);
    const price = parseUnits(limitPrice, 18);

    writeContract({
      address: MARKET_CONTRACT_ADDRESS,
      abi: Market_ABI,
      functionName: 'openPosition',
      args: [fromToken.address, toToken.address, selectedFee, false, 1, amount, price, 0],
    });
  };

  return (
    <div className="space-y-4">
      <div className="p-4 border rounded-lg bg-gray-50">
        <label className="block text-xs font-medium text-gray-500">From</label>
        <div className="flex items-center gap-4 mt-1">
          <input type="number" className="text-2xl bg-transparent focus:outline-none block w-full" placeholder="0.0" value={fromAmount} onChange={(e) => setFromAmount(e.target.value)} />
          <select className="text-xl font-semibold bg-transparent focus:outline-none" value={fromToken.symbol} onChange={(e) => setFromToken(TOKENS.find(t => t.symbol === e.target.value) || TOKENS[0])}>
            {TOKENS.map(token => <option key={token.symbol}>{token.symbol}</option>)}
          </select>
        </div>
      </div>

      <div className="p-4 border rounded-lg bg-gray-50">
        <label className="block text-xs font-medium text-gray-500">To</label>
        <div className="flex items-center gap-4 mt-1">
          <div className="text-2xl text-gray-500 w-full">~</div>
          <select className="text-xl font-semibold bg-transparent focus:outline-none" value={toToken.symbol} onChange={(e) => setToToken(TOKENS.find(t => t.symbol === e.target.value) || TOKENS[1])}>
            {TOKENS.map(token => <option key={token.symbol}>{token.symbol}</option>)}
          </select>
        </div>
      </div>

      <div className="p-4 border rounded-lg bg-gray-50">
        <label htmlFor="limitPrice" className="block text-xs font-medium text-gray-500">Limit Price ({toToken.symbol} per {fromToken.symbol})</label>
        <div className="mt-1">
          <input type="number" name="limitPrice" id="limitPrice" className="text-2xl bg-transparent focus:outline-none block w-full" placeholder="0.0" value={limitPrice} onChange={(e) => setLimitPrice(e.target.value)} />
        </div>
      </div>

      <div className="p-4 border rounded-lg bg-gray-50">
        <label htmlFor="feeTier" className="block text-xs font-medium text-gray-500">Fee Tier</label>
        <select id="feeTier" name="feeTier" className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md" value={selectedFee} onChange={(e) => setSelectedFee(parseInt(e.target.value, 10))}>
            {FEE_TIERS.map(fee => <option key={fee.value} value={fee.value}>{fee.label}</option>)}
        </select>
      </div>

      <div className="pt-4">
        {needsApproval ? (
          <button type="button" onClick={handleApprove} disabled={isPending || !fromAmount} className="w-full inline-flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400">
            {isPending ? 'Approving...' : 'Approve'}
          </button>
        ) : (
          <button type="button" onClick={handlePlaceOrder} disabled={isPending || !fromAmount || !limitPrice} className="w-full inline-flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400">
            {isPending ? 'Placing Order...' : 'Place Limit Order'}
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
