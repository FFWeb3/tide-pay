import React from 'react'
import { Card } from '../common/Card'
import { Button } from '../common/Button'
import { currencyService } from '../../services/currencyService'
import { IconArrowDownLeft } from '@tabler/icons-react'

interface PositionCardProps {
  title: string
  subtitle: string
  asset: string
  principalAmount: number
  accruedYield: number
  currentApy: number
  fiatValueUsd: number
  onWithdraw: () => void
}

export const PositionCard: React.FC<PositionCardProps> = ({
  title,
  subtitle,
  asset,
  principalAmount,
  accruedYield,
  currentApy,
  fiatValueUsd,
  onWithdraw,
}) => {
  return (
    <Card className="p-4 sm:p-5 space-y-3.5 sm:space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 sm:gap-3">
        <div className="space-y-0.5">
          <div className="text-base sm:text-lg font-normal text-black dark:text-white">{title}</div>
          <div className="text-[11px] sm:text-xs text-zinc-400 dark:text-zinc-500 font-normal">{subtitle}</div>
        </div>

        <div className="sm:text-right space-y-0.5">
          <div className="text-[11px] sm:text-xs text-zinc-400 dark:text-zinc-500 font-normal">Annual rate</div>
          <div className="text-xl sm:text-2xl font-normal text-black dark:text-white">
            {currentApy.toFixed(2)}%
          </div>
          <div className="text-[11px] sm:text-xs text-zinc-400 dark:text-zinc-500 font-normal">Compounding</div>
        </div>
      </div>

      <div className="grid grid-cols-1 min-[420px]:grid-cols-3 gap-2.5 sm:gap-3 py-2 text-xs">
        <div className="space-y-0.5">
          <div className="text-zinc-400 dark:text-zinc-500 font-normal">Principal balance</div>
          <div className="text-sm sm:text-base font-normal text-black dark:text-white">
            {principalAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} {asset}
          </div>
          <div className="text-[11px] sm:text-xs text-zinc-400 dark:text-zinc-500">
            {currencyService.formatUsd(fiatValueUsd)}
          </div>
        </div>

        <div className="space-y-0.5">
          <div className="text-zinc-400 dark:text-zinc-500 font-normal">Accrued rewards</div>
          <div className="text-sm sm:text-base font-normal text-emerald-600 dark:text-emerald-400">
            +{accruedYield.toLocaleString(undefined, { maximumFractionDigits: 4 })} {asset}
          </div>
          <div className="text-[11px] sm:text-xs text-zinc-400 dark:text-zinc-500">Ready to withdraw</div>
        </div>

        <div className="space-y-0.5">
          <div className="text-zinc-400 dark:text-zinc-500 font-normal">Custody model</div>
          <div className="text-xs sm:text-sm font-normal text-black dark:text-white">Self custodial</div>
          <div className="text-[11px] sm:text-xs text-zinc-400 dark:text-zinc-500">Keys in Nimiq Pay</div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <div className="text-[11px] sm:text-xs text-zinc-400 dark:text-zinc-500 font-normal">
          Direct to wallet
        </div>
        <Button variant="secondary" size="sm" onClick={onWithdraw} className="py-1.5 sm:py-2 px-3.5 sm:px-4 text-xs font-normal">
          <IconArrowDownLeft size={14} stroke={1.75} />
          Withdraw
        </Button>
      </div>
    </Card>
  )
}
