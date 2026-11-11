import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { walletService } from '../../services/walletService'
import { currencyService } from '../../services/currencyService'
import { Button } from '../common/Button'
import { Card } from '../common/Card'
import { CustomInput } from '../common/CustomInput'
import { IconCheck, IconX, IconArrowDownLeft } from '@tabler/icons-react'

interface WithdrawModalProps {
  type: 'NIM' | 'USDT'
  maxAmount: number
  onClose: () => void
  onSuccess: () => void
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({
  type,
  maxAmount,
  onClose,
  onSuccess,
}) => {
  const [amount, setAmount] = useState<number>(maxAmount)
  const [step, setStep] = useState<'input' | 'submitting' | 'done'>('input')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const nimPriceUsd = currencyService.getNimPriceUsd()

  const handleConfirmWithdraw = async () => {
    if (amount <= 0 || amount > maxAmount) {
      setErrorMessage('Please enter a valid amount within your available balance')
      return
    }

    try {
      setStep('submitting')
      setErrorMessage(null)
      if (type === 'NIM') {
        await walletService.unstakeNim(amount)
      } else {
        await walletService.withdrawUsdtFromAave(amount)
      }
      setStep('done')
    } catch (err: unknown) {
      setStep('input')
      if (err instanceof Error) {
        setErrorMessage(err.message)
      } else {
        setErrorMessage('Could not process withdrawal')
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
                {step === 'done' ? 'Withdrawal complete' : `Withdraw ${type}`}
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
                    label="Enter amount to return to wallet"
                    helperText={`Max: ${maxAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${type}`}
                    type="number"
                    max={maxAmount}
                    step={type === 'NIM' ? 100 : 10}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    suffixNode={type}
                    className="text-xl sm:text-2xl font-normal"
                  />

                  <div className="flex items-center gap-1.5 sm:gap-2 pt-1">
                    {[0.25, 0.5, 0.75, 1].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setAmount(Number((maxAmount * pct).toFixed(2)))}
                        className="cursor-pointer text-xs font-normal bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200/80 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 px-2.5 sm:px-3 py-1.5 rounded-[10px] transition-colors"
                      >
                        {pct * 100}%
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-800/60 p-3.5 sm:p-4 rounded-[14px] space-y-1.5 sm:space-y-2">
                  <div className="text-xs font-normal text-zinc-500 dark:text-zinc-400">Destination</div>
                  <div className="text-xs sm:text-sm font-normal text-zinc-800 dark:text-zinc-200">
                    Direct to your active Nimiq Pay address
                  </div>
                  <div className="text-[11px] sm:text-xs font-normal text-zinc-500 dark:text-zinc-400 pt-0.5">
                    Local currency equivalent {currencyService.formatUsd(type === 'NIM' ? amount * nimPriceUsd : amount)}
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
                  <Button variant="primary" onClick={handleConfirmWithdraw} className="w-full sm:w-auto justify-center">
                    <IconArrowDownLeft size={16} stroke={1.75} />
                    Withdraw to wallet
                  </Button>
                </div>
              </div>
            )}

            {step === 'submitting' && (
              <div className="py-10 sm:py-12 text-center space-y-3 sm:space-y-4">
                <div className="text-base font-normal text-black dark:text-white">
                  Processing withdrawal
                </div>
                <p className="text-xs sm:text-sm font-normal text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto">
                  Please approve the transaction prompt in Nimiq Pay. Your funds are being transferred directly to your balance.
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
                    Withdrawal confirmed
                  </div>
                  <p className="text-xs sm:text-sm font-normal text-zinc-600 dark:text-zinc-400">
                    Successfully returned {amount.toLocaleString()} {type} to your wallet.
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
                    Close
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
