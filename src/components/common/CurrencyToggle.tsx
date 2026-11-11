import React, { useEffect, useState } from 'react'
import { currencyService } from '../../services/currencyService'
import { FiatCurrency } from '../../types'

const CURRENCIES: FiatCurrency[] = ['USD', 'NGN', 'EUR', 'KES']

export const CurrencyToggle: React.FC = () => {
  const [selected, setSelected] = useState<FiatCurrency>(currencyService.getCurrency())

  useEffect(() => {
    return currencyService.subscribe((c) => setSelected(c))
  }, [])

  return (
    <div className="flex items-center gap-0.5 sm:gap-1 bg-zinc-100 dark:bg-zinc-800/80 p-0.5 sm:p-1 rounded-xl transition-colors">
      {CURRENCIES.map((c) => {
        const isSelected = selected === c
        return (
          <button
            key={c}
            onClick={() => currencyService.setCurrency(c)}
            className={`cursor-pointer px-1.5 sm:px-2.5 py-1 text-[11px] sm:text-xs font-normal rounded-lg transition-colors ${
              isSelected
                ? 'bg-white dark:bg-zinc-900 text-black dark:text-white'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white'
            }`}
          >
            {c}
          </button>
        )
      })}
    </div>
  )
}
