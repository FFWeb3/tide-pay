import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { NimiqValidatorPool } from '../../types'
import { walletService } from '../../services/walletService'
import { currencyService } from '../../services/currencyService'
import { Button } from '../common/Button'
import { Card } from '../common/Card'
import { CustomInput } from '../common/CustomInput'
import { IconCheck, IconX, IconHexagon } from '@tabler/icons-react'

interface StakeModalProps {
  pool: NimiqValidatorPool
  onClose: () => void
  onSuccess: () => void
}

export const StakeModal: React.FC<StakeModalProps> = ({ pool, onClose, onSuccess }) => {
  const wallet = walletService.getState()
  const [stakeAmount, setStakeAmount] = useState<number>(() =>
    wallet.nimBalance >= 100 ? Math.floor(wallet.nimBalance) : 0
  )
  const [step, setStep] = useState<'input' | 'submitting' | 'done'>('input')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const nimPriceUsd = currencyService.getNimPriceUsd()
  const estimatedYearlyNim = (stakeAmount * pool.rewardRatePercent) / 100
  const estimatedYearlyUsd = estimatedYearlyNim * nimPriceUsd

  const handleConfirmStake = async () => {
    if (stakeAmount < 100) {
      setErrorMessage('Minimum stake on Nimiq is 100 NIM')
      return
    }
    if (stakeAmount > wallet.nimBalance) {
      setErrorMessage('Stake amount exceeds your available NIM balance')
      return
    }

    try {
      setStep('submitting')
      setErrorMessage(null)
      await walletService.stakeNim(pool.address, stakeAmount)
      setStep('done')
    } catch (err: unknown) {
      setStep('input')
      if (err instanceof Error) {
        setErrorMessage(err.message)
      } else {
        setErrorMessage('Could not execute staking transaction')
      }
    }
  }

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
                {step === 'done' ? 'Stake delegated' : `Stake with ${pool.name}`}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer text-zinc-400 hover:text-black dark:hover:text-white p-1"
              >
                <IconX size={20} stroke={1.75} />
              </button>
            </div>

            {step === 'input' && (
              <div className="space-y-4 sm:space-y-6">
                <div className="space-y-2">
                  <CustomInput
                    label="Enter NIM amount"
                    helperText={`Available: ${wallet.nimBalance.toLocaleString()} NIM`}
                    type="number"
                    min={100}
                    step={100}
                    placeholder="100"
                    value={stakeAmount === 0 ? '' : stakeAmount}
                    onChange={(e) => setStakeAmount(Number(e.target.value) || 0)}
                    suffixNode="NIM"
                    className="text-xl sm:text-2xl font-normal"
                  />

                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-1">
                    {[500, 1000, 5000, 10000].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setStakeAmount(val)}
                        className="cursor-pointer text-xs font-normal bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200/80 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 px-2.5 sm:px-3 py-1.5 rounded-[10px] transition-colors"
                      >
                        +{val.toLocaleString()}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setStakeAmount(Math.floor(wallet.nimBalance))}
                      className="cursor-pointer text-xs font-normal bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200/80 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 px-2.5 sm:px-3 py-1.5 rounded-[10px] transition-colors ml-auto"
                    >
                      Max
                    </button>
                  </div>
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-800/60 p-4 sm:p-5 rounded-[16px] space-y-2.5 sm:space-y-3">
                  <div className="text-xs uppercase tracking-wider font-normal text-zinc-500 dark:text-zinc-400">
                    Estimated earnings projection
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-normal text-zinc-500 dark:text-zinc-400">Expected annual rewards</span>
                    <span className="text-xs sm:text-sm font-normal text-black dark:text-white">
                      {estimatedYearlyNim.toFixed(0)} NIM
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-normal text-zinc-500 dark:text-zinc-400">Estimated value in local currency</span>
                    <span className="text-xs sm:text-sm font-normal text-zinc-800 dark:text-zinc-200">
                      {currencyService.formatUsd(estimatedYearlyUsd)} per year
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-normal text-zinc-500 dark:text-zinc-400">Validator fee</span>
                    <span className="text-xs sm:text-sm font-normal text-zinc-800 dark:text-zinc-200">{pool.feePercent.toFixed(1)}%</span>
                  </div>
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
                  <Button variant="primary" onClick={handleConfirmStake} className="w-full sm:w-auto justify-center">
                    <IconHexagon size={16} stroke={1.75} />
                    Stake NIM in Nimiq Pay
                  </Button>
                </div>
              </div>
            )}

            {step === 'submitting' && (
              <div className="py-10 sm:py-12 text-center space-y-3 sm:space-y-4">
                <div className="text-base font-normal text-black dark:text-white">
                  Confirming stake transaction
                </div>
                <p className="text-xs sm:text-sm font-normal text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto">
                  Please sign the staking delegation in your Nimiq Pay wallet. Your coins stay in your account.
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
                    Stake confirmed
                  </div>
                  <p className="text-xs sm:text-sm font-normal text-zinc-600 dark:text-zinc-400">
                    You have delegated {stakeAmount.toLocaleString()} NIM to {pool.name}. Rewards will begin accruing automatically with the next epoch.
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
                    View my positions
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
