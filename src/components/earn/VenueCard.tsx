import React from 'react'
import { RankedVenueResult } from '../../services/routingEngine'
import { currencyService } from '../../services/currencyService'
import { Button } from '../common/Button'
import { Card } from '../common/Card'
import { IconArrowRight, IconAlertTriangle, IconCircleCheck, IconAlertCircle } from '@tabler/icons-react'

interface VenueCardProps {
  item: RankedVenueResult
  onSelect: () => void
}

export const VenueCard: React.FC<VenueCardProps> = ({ item, onSelect }) => {
  const { venue, netApy, grossApy, netYearlyReturnUsd, totalCostsUsd, recommended, recommendationReason } = item

  return (
    <Card className="p-4 sm:p-5 space-y-3.5 sm:space-y-4">
      {recommended && (
        <div className="flex flex-col min-[420px]:flex-row min-[420px]:items-center justify-between gap-1 text-xs pb-1 text-zinc-600 dark:text-zinc-400 font-normal">
          <span className="uppercase tracking-wider text-xs text-black dark:text-white font-normal">
            Recommended Route
          </span>
          <span className="text-zinc-500 dark:text-zinc-400">
            {recommendationReason}
          </span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 sm:gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-base sm:text-lg font-normal text-black dark:text-white">{venue.name}</span>
            <span className="text-[11px] sm:text-xs px-2 py-0.5 rounded bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-normal">
              {venue.chain}
            </span>
          </div>
          <div className="text-[11px] sm:text-xs text-zinc-400 dark:text-zinc-500 font-normal">
            {venue.protocol} protocol on {venue.chain} network
          </div>
        </div>

        <div className="sm:text-right space-y-0.5">
          <div className="text-[11px] sm:text-xs text-zinc-400 dark:text-zinc-500 font-normal">Real Net APY</div>
          <div className="text-xl sm:text-2xl font-normal text-black dark:text-white">
            {netApy > 0 ? `${netApy.toFixed(2)}%` : '0.00%'}
          </div>
          <div className="text-[11px] sm:text-xs text-zinc-400 dark:text-zinc-500 font-normal">
            Gross {grossApy.toFixed(2)}%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 py-2 text-xs">
        <div className="space-y-0.5">
          <div className="text-zinc-400 dark:text-zinc-500 font-normal">Net earnings</div>
          <div className="text-xs sm:text-sm font-normal text-black dark:text-white">
            {currencyService.formatUsd(Math.max(0, netYearlyReturnUsd))} / yr
          </div>
        </div>

        <div className="space-y-0.5">
          <div className="text-zinc-400 dark:text-zinc-500 font-normal">Estimated fees</div>
          <div className="text-xs sm:text-sm font-normal text-zinc-700 dark:text-zinc-300">
            {currencyService.formatUsd(totalCostsUsd)}
          </div>
        </div>

        <div className="space-y-0.5">
          <div className="text-zinc-400 dark:text-zinc-500 font-normal">Total liquidity</div>
          <div className="text-xs sm:text-sm font-normal text-zinc-700 dark:text-zinc-300">
            {currencyService.formatUsd(venue.tvlUsd)}
          </div>
        </div>

        <div className="space-y-0.5">
          <div className="text-zinc-400 dark:text-zinc-500 font-normal">Risk rating</div>
          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-normal text-zinc-800 dark:text-zinc-200">
            {venue.riskTier === 'Tier A' && (
              <IconCircleCheck size={15} stroke={1.75} className="text-emerald-600 dark:text-emerald-400" />
            )}
            {venue.riskTier === 'Tier B' && (
              <IconAlertTriangle size={15} stroke={1.75} className="text-amber-600 dark:text-amber-400" />
            )}
            {venue.riskTier === 'Tier C' && (
              <IconAlertCircle size={15} stroke={1.75} className="text-rose-600 dark:text-rose-400" />
            )}
            <span>{venue.riskTier}</span>
          </div>
        </div>
      </div>

      <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal bg-white dark:bg-zinc-950 p-2.5 sm:p-3 rounded-[12px]">
        {venue.riskSummary}
      </p>

      <div className="flex items-center justify-between pt-1">
        <div className="text-[11px] sm:text-xs text-zinc-400 dark:text-zinc-500 font-normal">
          Non custodial position
        </div>
        <Button variant="primary" size="sm" onClick={onSelect} className="py-1.5 sm:py-2 px-3.5 sm:px-4 text-xs font-normal">
          Deposit
          <IconArrowRight size={14} stroke={1.75} />
        </Button>
      </div>
    </Card>
  )
}
