import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from './Button'
import { Card } from './Card'
import { IconX, IconAlertTriangle, IconCircleCheck, IconAlertCircle } from '@tabler/icons-react'

interface RiskFrameworkModalProps {
  isOpen: boolean
  onClose: () => void
}

export const RiskFrameworkModal: React.FC<RiskFrameworkModalProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
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
                  Protocol risk framework
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
                Tide groups yield venues into clear tiers based on contract history, audit verification, and liquidity depth. We never route your funds to unproven or speculative pools.
              </p>

              <div className="space-y-2.5 sm:space-y-3">
                <div className="bg-zinc-50 dark:bg-zinc-800/60 p-3.5 sm:p-4 rounded-[14px] space-y-1 sm:space-y-1.5">
                  <div className="flex items-center gap-1.5 text-black dark:text-white font-normal text-xs sm:text-sm">
                    <IconCircleCheck size={16} stroke={1.75} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Tier A Protocols</span>
                  </div>
                  <p className="text-[11px] sm:text-xs font-normal text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    Live for over two years, vetted through multiple independent security audits, holding over ten million dollars in liquidity, with deep reserves to ensure instant withdrawals at all times.
                  </p>
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-800/60 p-3.5 sm:p-4 rounded-[14px] space-y-1 sm:space-y-1.5">
                  <div className="flex items-center gap-1.5 text-zinc-800 dark:text-zinc-200 font-normal text-xs sm:text-sm">
                    <IconAlertTriangle size={16} stroke={1.75} className="text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>Tier B Protocols</span>
                  </div>
                  <p className="text-[11px] sm:text-xs font-normal text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    Formally audited protocols managed by established institutional risk curators, maintaining at least one million dollars in liquidity and six months of operational track record.
                  </p>
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-800/60 p-3.5 sm:p-4 rounded-[14px] space-y-1 sm:space-y-1.5">
                  <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300 font-normal text-xs sm:text-sm">
                    <IconAlertCircle size={16} stroke={1.75} className="text-rose-600 dark:text-rose-400 shrink-0" />
                    <span>Tier C Protocols</span>
                  </div>
                  <p className="text-[11px] sm:text-xs font-normal text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    Experimental or low liquidity pools. Displayed for information and market visibility only. Tide will not route automated deposits to these venues.
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button variant="primary" size="sm" onClick={onClose} className="w-full sm:w-auto justify-center">
                  Got it
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
