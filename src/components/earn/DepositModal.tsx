import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { YieldVenue } from '../../types'
import { walletService } from '../../services/walletService'
import { currencyService } from '../../services/currencyService'
import { Button } from '../common/Button'
import { Card } from '../common/Card'
import { IconCheck, IconX, IconArrowRight, IconInfoCircle, IconCircleCheck, IconAlertTriangle, IconAlertCircle } from '@tabler/icons-react'

interface DepositModalProps {
  venue: YieldVenue
  depositAmount: number
  onClose: () => void
  onSuccess: () => void
}

export const DepositModal: React.FC<DepositModalProps> = ({
  venue,
  depositAmount,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<'review' | 'submitting' | 'done'>('review')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleConfirmDeposit = async () => {
    try {
      setStep('submitting')
      setErrorMessage(null)
      await walletService.supplyUsdtToAave(depositAmount)
      setStep('done')
    } catch (err: unknown) {
      setStep('review')
      if (err instanceof Error) {
        setErrorMessage(err.message)
      } else {
        setErrorMessage('Transaction could not be completed')
      }
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="w-full max-w-lg max-h-[92dvh] overflow-y-auto rounded-[24px]"
        >
          <Card className="bg-white dark:bg-zinc-900 w-full p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
            <div className="flex items-center justify-between">
              <div className="text-lg sm:text-xl font-normal tracking-tight text-black dark:text-white">
                {step === 'done' ? 'Deposit complete' : `Deposit into ${venue.name}`}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer text-zinc-400 hover:text-black dark:hover:text-white p-1 transition-colors"
              >
                <IconX size={20} stroke={1.75} />
              </button>
            </div>

            {step === 'review' && (
              <div className="space-y-4 sm:space-y-6">
                <div className="bg-zinc-50 dark:bg-zinc-800/60 p-4 sm:p-5 rounded-[16px] space-y-2.5 sm:space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-normal">Deposit amount</span>
                    <span className="text-base sm:text-lg font-normal text-black dark:text-white">
                      {depositAmount.toFixed(2)} USDT
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-normal">Local currency value</span>
                    <span className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 font-normal">
                      {currencyService.formatUsd(depositAmount)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-normal">Target protocol</span>
                    <span className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 font-normal">{venue.protocol}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-normal">Network</span>
                    <span className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 font-normal">{venue.chain}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-normal">Estimated gas fee</span>
                    <span className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 font-normal">
                      {currencyService.formatUsd(venue.entryFeeUsd)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-normal">Risk rating</span>
                    <span className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 font-normal flex items-center gap-1.5">
                      {venue.riskTier === 'Tier A' && (
                        <IconCircleCheck size={15} stroke={1.75} className="text-emerald-600 dark:text-emerald-400" />
                      )}
                      {venue.riskTier === 'Tier B' && (
                        <IconAlertTriangle size={15} stroke={1.75} className="text-amber-600 dark:text-amber-400" />
                      )}
                      {venue.riskTier === 'Tier C' && (
                        <IconAlertCircle size={15} stroke={1.75} className="text-rose-600 dark:text-rose-400" />
                      )}
                      {venue.riskTier}
                    </span>
                  </div>
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-800/60 p-3.5 sm:p-4 rounded-[14px] flex items-start gap-2.5 sm:gap-3">
                  <IconInfoCircle size={18} stroke={1.75} className="text-black dark:text-white shrink-0 mt-0.5" />
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal">
                    Tide never takes custody of your funds. The deposit will be made in your own wallet address. You receive interest bearing receipt tokens directly in your account and can withdraw at any time.
                  </p>
                </div>

                {errorMessage && (
                  <div className="bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 p-3.5 rounded-[12px] text-xs font-normal">
                    {errorMessage}
                  </div>
                )}

                <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-2.5 pt-2">
                  <Button variant="secondary" onClick={onClose} className="w-full sm:w-auto justify-center">
                    Cancel
                  </Button>
                  <Button variant="primary" onClick={handleConfirmDeposit} className="w-full sm:w-auto justify-center">
                    Confirm and sign transaction
                    <IconArrowRight size={16} stroke={1.75} />
                  </Button>
                </div>
              </div>
            )}

            {step === 'submitting' && (
              <div className="py-10 sm:py-12 text-center space-y-3">
                <div className="text-base font-normal text-black dark:text-white">
                  Confirming transaction
                </div>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto font-normal">
                  Please approve the transaction prompt in your Nimiq Pay wallet. Your funds are moving directly to the Aave contract.
                </p>
              </div>
            )}

            {step === 'done' && (
              <div className="space-y-5 sm:space-y-6">
                <div className="bg-zinc-50 dark:bg-zinc-800/60 p-5 sm:p-6 rounded-[16px] text-center space-y-3">
                  <div className="w-12 h-12 rounded-[14px] bg-black dark:bg-white text-white dark:text-black flex items-center justify-center mx-auto">
                    <IconCheck size={22} stroke={2} />
                  </div>
                  <div className="text-base sm:text-lg font-normal text-black dark:text-white">
                    Deposit completed successfully
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 font-normal">
                    You have deposited {depositAmount.toFixed(2)} USDT into {venue.name}. Your balance is now earning interest every second.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3">
                  <Button
                    variant="primary"
                    className="w-full sm:w-auto justify-center"
                    onClick={() => {
                      onSuccess()
                      onClose()
                    }}
                  >
                    View active positions
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
