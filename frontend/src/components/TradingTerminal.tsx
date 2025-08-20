'use client';

import { useState } from 'react';
import { MarketOrder } from './MarketOrder';
import { LimitOrder } from './LimitOrder';
import { StopLossOrder } from './StopLossOrder';
import { MarginOrder } from './MarginOrder';

const TABS = ['Market', 'Limit', 'Stop Loss', 'Margin'];

export function TradingTerminal() {
  const [activeTab, setActiveTab] = useState(TABS[0]);

  return (
    <div className="border rounded-lg p-4 max-w-md mx-auto">
      <div className="flex border-b mb-4">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`px-4 py-2 -mb-px border-b-2 text-sm font-medium ${
              activeTab === tab
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
      <div>
        {activeTab === 'Market' && <MarketOrder />}
        {activeTab === 'Limit' && <LimitOrder />}
        {activeTab === 'Stop Loss' && <StopLossOrder />}
        {activeTab === 'Margin' && <MarginOrder />}
      </div>
    </div>
  );
}
