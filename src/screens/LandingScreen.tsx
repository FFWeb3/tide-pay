import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { LandingGraphic } from '../components/landing/LandingGraphic'
import { InteractivePillHeadline } from '../components/landing/InteractivePillHeadline'
import { Button } from '../components/common/Button'
import { walletService, WalletState, formatShortAddress } from '../services/walletService'
import { IconArrowUpRight, IconInfoCircle, IconWallet, IconLogout } from '@tabler/icons-react'

interface LandingScreenProps {
  onOpenDashboard: () => void
  onOpenInfo: () => void
  onOpenWallet: () => void
  onOpenConnect: () => void
}

export const LandingScreen: React.FC<LandingScreenProps> = ({
  onOpenDashboard,
  onOpenInfo,
  onOpenWallet,
  onOpenConnect,
}) => {
  const [wallet, setWallet] = useState<WalletState>(walletService.getState())

  useEffect(() => {
    return walletService.subscribe(setWallet)
  }, [])

  const displayAddress = wallet.evmAddress || wallet.nimAddress

  return (
    <div className="w-full h-full min-h-[100dvh] md:min-h-0 flex flex-col justify-between items-center py-4 sm:py-6 px-3 sm:px-4 select-none">
      {/* Top spacer to balance the floating header dock */}
      <div className="h-12 sm:h-16 w-full shrink-0" />

      {/* Main Centered Content */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="flex flex-col items-center text-center max-w-xl mx-auto my-auto py-2"
      >
        {/* The Graphic with 3 stacked window cards & 5 pixel clusters */}
        <LandingGraphic />

        {/* Interactive Floating Pill Headline */}
        <InteractivePillHeadline className="mt-4 sm:mt-6" />

        {/* Description */}
        <p className="text-xs min-[400px]:text-sm sm:text-base text-zinc-600 dark:text-zinc-400 font-normal leading-relaxed max-w-md mx-auto mt-2.5 sm:mt-3">
          {!wallet.isConnected ? (
            <>
              Non custodial automated yield aggregation inside Nimiq Pay.{' '}
              <button
                type="button"
                onClick={onOpenConnect}
                className="cursor-pointer underline underline-offset-4 text-zinc-900 dark:text-white hover:opacity-80 transition-opacity font-normal"
              >
                Connect your wallet
              </button>{' '}
              to access your dashboard and start earning.
            </>
          ) : (
            <>
              Non custodial automated yield aggregation inside Nimiq Pay.{' '}
              <button
                type="button"
                onClick={onOpenDashboard}
                className="cursor-pointer underline underline-offset-4 text-zinc-900 dark:text-white hover:opacity-80 transition-opacity font-normal"
              >
                Open the dashboard
              </button>{' '}
              to manage your positions.
            </>
          )}
        </p>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 mt-5 sm:mt-7">
          {!wallet.isConnected ? (
            <Button
              variant="primary"
              size="md"
              onClick={onOpenConnect}
              className="px-5 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm"
            >
              <IconWallet size={16} stroke={1.75} />
              Connect wallet
            </Button>
          ) : (
            <>
              <Button
                variant="primary"
                size="md"
                onClick={onOpenDashboard}
                className="px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm"
              >
                Open Dashboard
                <IconArrowUpRight size={16} stroke={1.75} />
              </Button>

              <div className="flex items-center gap-1 sm:gap-1.5">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={onOpenWallet}
                  className="px-3 sm:px-3.5 py-2 sm:py-2.5 text-xs sm:text-sm font-mono"
                  title="View wallet details"
                >
                  <IconWallet size={16} stroke={1.75} />
                  <span>{formatShortAddress(displayAddress)}</span>
                </Button>

                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => walletService.disconnectWallet()}
                  className="px-2.5 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400"
                  title="Disconnect wallet"
                >
                  <IconLogout size={15} stroke={1.75} />
                </Button>
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* Footer Info Strip */}
      <div className="w-full flex items-center justify-between text-[11px] sm:text-xs text-zinc-600 dark:text-zinc-400 pt-6 pb-2 shrink-0">
        <div className="flex items-center gap-1.5 font-normal">
          <span>Non custodial on Polygon and Nimiq PoS</span>
        </div>

        <button
          type="button"
          onClick={onOpenInfo}
          className="cursor-pointer text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white flex items-center gap-1 transition-colors font-normal"
        >
          <IconInfoCircle size={14} stroke={1.75} />
          <span>Security & Risk</span>
        </button>
      </div>
    </div>
  )
}
