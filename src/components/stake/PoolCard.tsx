import React from 'react'
import { NimiqValidatorPool } from '../../types'
import { Button } from '../common/Button'
import { Card } from '../common/Card'
import { IconHexagon } from '@tabler/icons-react'

interface PoolCardProps {
  pool: NimiqValidatorPool
  isCurrentPool: boolean
  onStake: () => void
}

export const PoolCard: React.FC<PoolCardProps> = ({ pool, isCurrentPool, onStake }) => {
  return (
    <Card className="p-4 sm:p-5 space-y-3.5 sm:space-y-4">
      {isCurrentPool && (
        <div className="flex items-center justify-between text-xs pb-1 text-zinc-600 dark:text-zinc-400 font-normal">
          <span className="text-xs text-black dark:text-white font-normal">
            Your active validator node
          </span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 sm:gap-3">
        <div className="space-y-1">
          <div className="text-base sm:text-lg font-normal text-black dark:text-white">{pool.name}</div>
          <div className="text-[11px] sm:text-xs text-zinc-400 dark:text-zinc-500 font-mono break-all">
            {pool.address}
          </div>
        </div>

        <div className="sm:text-right space-y-0.5">
          <div className="text-[11px] sm:text-xs text-zinc-400 dark:text-zinc-500 font-normal">Reward rate</div>
          <div className="text-xl sm:text-2xl font-normal text-emerald-600 dark:text-emerald-400">
            {pool.rewardRatePercent.toFixed(2)}%
          </div>
          <div className="text-[11px] sm:text-xs text-zinc-400 dark:text-zinc-500 font-normal">Paid directly in NIM</div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 py-2 text-xs">
        <div className="space-y-0.5">
          <div className="text-zinc-400 dark:text-zinc-500 font-normal">Pool fee</div>
          <div className="text-xs sm:text-sm font-normal text-zinc-800 dark:text-zinc-200">
            {pool.feePercent.toFixed(1)}% commission
          </div>
        </div>

        <div className="space-y-0.5">
          <div className="text-zinc-400 dark:text-zinc-500 font-normal">Payout reliability</div>
          <div className="text-xs sm:text-sm font-normal text-zinc-800 dark:text-zinc-200">
            {pool.reliabilityPercent.toFixed(1)}% on time
          </div>
        </div>

        <div className="space-y-0.5">
          <div className="text-zinc-400 dark:text-zinc-500 font-normal">Total pool stake</div>
          <div className="text-xs sm:text-sm font-normal text-zinc-800 dark:text-zinc-200">
            {(pool.totalStakeNim / 1e6).toFixed(1)}M NIM
          </div>
        </div>

        <div className="space-y-0.5">
          <div className="text-zinc-400 dark:text-zinc-500 font-normal">Active stakers</div>
          <div className="text-xs sm:text-sm font-normal text-zinc-800 dark:text-zinc-200">
            {pool.activeStakersCount.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <div className="text-[11px] sm:text-xs text-zinc-400 dark:text-zinc-500 font-normal">
          Min stake 100 NIM
        </div>
        <Button variant="primary" size="sm" onClick={onStake} className="py-1.5 sm:py-2 px-3.5 sm:px-4 text-xs font-normal">
          <IconHexagon size={14} stroke={1.75} />
          {isCurrentPool ? 'Add stake' : 'Delegate'}
        </Button>
      </div>
    </Card>
  )
}
