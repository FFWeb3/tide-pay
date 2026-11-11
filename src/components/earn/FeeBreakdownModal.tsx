import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RankedVenueResult } from '../../services/routingEngine'
import { currencyService } from '../../services/currencyService'
import { Button } from '../common/Button'
import { Card } from '../common/Card'
import { IconX, IconInfoCircle } from '@tabler/icons-react'

interface FeeBreakdownModalProps {
  item: RankedVenueResult
  depositAmount: number
  durationYears: number
  onClose: () => void
}

export const FeeBreakdownModal: React.FC<FeeBreakdownModalProps> = ({
  item,
  depositAmount,
  durationYears,
  onClose,
}) => {
  const { grossApy, netApy, totalCostsUsd, netYearlyReturnUsd } = item

  const timeframeLabels: Record<number, string> = {
    [1 / 12]: '1 month',
    [0.25]: '3 months',
    [0.5]: '6 months',
    [1]: '1 year',
  }

  const durationLabel = timeframeLabels[durationYears] || `${durationYears} years`

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="w-full max-w-lg max-h-[92dvh] overflow-y-auto rounded-[24px]"
        >
          <Card className="bg-white dark:bg-zinc-900 w-full p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
            <div className="flex items-center justify-between">
              <div className="text-lg sm:text-xl font-normal text-black dark:text-white">
                Transparent return calculation
              </div>
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer text-zinc-400 hover:text-black dark:hover:text-white p-1"
              >
                <IconX size={20} stroke={1.75} />
              </button>
            </div>

            <p className="text-xs sm:text-sm font-normal text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Most platforms advertise gross headline rates and ignore what network fees take away from small balances. Tide computes your real take home return after gas and bridge costs.
            </p>

            <div className="bg-zinc-50 dark:bg-zinc-800/60 p-4 sm:p-5 rounded-[16px] space-y-2.5 sm:space-y-3">
              <div className="flex items-center justify-between text-xs sm:text-sm font-normal">
                <span className="text-zinc-500 dark:text-zinc-400">Deposit principal</span>
                <span className="text-zinc-800 dark:text-zinc-200">{depositAmount.toFixed(2)} USDT</span>
              </div>

              <div className="flex items-center justify-between text-xs sm:text-sm font-normal">
                <span className="text-zinc-500 dark:text-zinc-400">Selected timeframe</span>
                <span className="text-zinc-800 dark:text-zinc-200">{durationLabel}</span>
              </div>

              <div className="flex items-center justify-between text-xs sm:text-sm font-normal">
                <span className="text-zinc-500 dark:text-zinc-400">Gross headline yield</span>
                <span className="text-zinc-800 dark:text-zinc-200">{grossApy.toFixed(2)}% APY</span>
              </div>

              <div className="flex items-center justify-between text-xs sm:text-sm font-normal">
                <span className="text-zinc-500 dark:text-zinc-400">One time gas and routing fee</span>
                <span className="text-zinc-800 dark:text-zinc-200">{currencyService.formatUsd(totalCostsUsd)}</span>
              </div>

              <div className="flex items-center justify-between text-sm sm:text-base font-normal pt-2">
                <span className="text-black dark:text-white font-normal">Real net annual return</span>
                <span className="text-black dark:text-white font-normal">{netApy.toFixed(2)}% APY</span>
              </div>

              <div className="flex items-center justify-between text-xs sm:text-sm font-normal">
                <span className="text-zinc-500 dark:text-zinc-400">Expected net profit</span>
                <span className="text-black dark:text-white font-normal">
                  {currencyService.formatUsd(Math.max(0, netYearlyReturnUsd))}
                </span>
              </div>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-800/60 p-3.5 sm:p-4 rounded-[14px] flex items-start gap-2.5 sm:gap-3">
              <IconInfoCircle size={18} stroke={1.75} className="text-black dark:text-white shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs font-normal text-zinc-600 dark:text-zinc-400 leading-relaxed">
                <div className="text-black dark:text-white font-normal">How the routing rule protects small savers</div>
                <p>
                  A higher rate on another chain can cost a few dollars in bridge fees. On a fifty dollar deposit, that fee can erase months of earnings. Tide only suggests moving across chains when the net gain is clearly positive after all costs.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="primary" size="sm" onClick={onClose} className="w-full sm:w-auto justify-center">
                Understood
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
