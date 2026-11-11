import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { walletService, WalletState } from '../../services/walletService'
import { authService, AuthState } from '../../services/authService'
import { currencyService } from '../../services/currencyService'
import { fetchOnChainAaveRate, fetchLiveValidatorPools } from '../../services/ratesService'
import { Button } from './Button'
import { Card } from './Card'
import { IconX, IconWallet, IconCheck, IconLogout, IconRefresh, IconExternalLink, IconLock } from '@tabler/icons-react'

interface WalletDrawerProps {
  isOpen: boolean
  onClose: () => void
  onOpenConnectModal?: () => void
}

export const WalletDrawer: React.FC<WalletDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const [wallet, setWallet] = useState<WalletState>(walletService.getState())
  const [auth, setAuth] = useState<AuthState>(authService.getState())
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [liveAaveApy, setLiveAaveApy] = useState<number | null>(null)
  const [liveNimApy, setLiveNimApy] = useState<number | null>(null)

  useEffect(() => {
    const unsubWallet = walletService.subscribe(setWallet)
    const unsubAuth = authService.subscribe(setAuth)
    fetchOnChainAaveRate().then((rate) => {
      if (rate !== null) setLiveAaveApy(rate)
    })
    fetchLiveValidatorPools().then((pools) => {
      if (pools.length > 0) {
        const avg = pools.reduce((acc, p) => acc + p.rewardRatePercent, 0) / pools.length
        setLiveNimApy(Number(avg.toFixed(2)))
      }
    })
    return () => {
      unsubWallet()
      unsubAuth()
    }
  }, [])

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await walletService.refreshLiveBalances()
    await walletService.fetchUserPositionsFromDb()
    await currencyService.refreshLivePrices()
    setIsRefreshing(false)
  }

  const handleDisconnect = async () => {
    await walletService.disconnectWallet()
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-full max-w-md bg-white dark:bg-zinc-900 h-full p-4 sm:p-6 md:p-8 overflow-y-auto space-y-6 sm:space-y-8 flex flex-col justify-between"
          >
            <div className="space-y-6 sm:space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="p-2 sm:p-2.5 rounded-[12px] bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white shrink-0">
                    <IconWallet size={19} stroke={1.75} />
                  </div>
                  <div>
                    <div className="text-base sm:text-lg font-normal text-black dark:text-white">
                      Live wallet
                    </div>
                    <div className="text-xs font-normal text-emerald-600 dark:text-emerald-400">
                      <span>{auth.chain === 'nimiq' ? 'Nimiq PoS network' : 'Polygon mainnet authenticated'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRefresh}
                    className="cursor-pointer text-zinc-400 hover:text-black dark:hover:text-white p-1 transition-transform"
                    title="Refresh live balances"
                  >
                    <IconRefresh size={18} stroke={1.75} className={isRefreshing ? 'animate-spin' : ''} />
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="cursor-pointer text-zinc-400 hover:text-black dark:hover:text-white p-1"
                  >
                    <IconX size={20} stroke={1.75} />
                  </button>
                </div>
              </div>

              {/* Cryptographic Security Card */}
              <Card className="bg-zinc-50 dark:bg-zinc-800/50 p-3.5 sm:p-4 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-normal text-zinc-800 dark:text-zinc-200">
                  <IconLock size={15} className="shrink-0" />
                  <span>Secure session active</span>
                </div>
                <p className="text-[11px] sm:text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal">
                  Cryptographically authenticated and non custodial. Your private keys never leave your wallet.
                </p>
              </Card>

              {/* Live Balances */}
              <div className="space-y-3 sm:space-y-4">
                <div className="text-xs uppercase tracking-wider font-normal text-zinc-500 dark:text-zinc-400">
                  Live on chain balances
                </div>

                {wallet.evmAddress && (
                  <>
                    <Card className="bg-zinc-50 dark:bg-zinc-800/60 p-3.5 sm:p-4 space-y-1 sm:space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">USDT balance on Polygon</span>
                        <span className="text-sm sm:text-base font-normal text-black dark:text-white">
                          {wallet.usdtBalance.toFixed(2)} USDT
                        </span>
                      </div>
                      <div className="text-[11px] sm:text-xs font-normal text-zinc-400 dark:text-zinc-500 text-right">
                        Value {currencyService.formatUsd(wallet.usdtBalance)}
                      </div>
                    </Card>

                    <Card className="bg-zinc-50 dark:bg-zinc-800/60 p-3.5 sm:p-4 space-y-1 sm:space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">Supplied aUSDT (Aave V3)</span>
                        <span className="text-sm sm:text-base font-normal text-emerald-600 dark:text-emerald-400">
                          {wallet.aUsdtBalance.toFixed(2)} aUSDT
                        </span>
                      </div>
                      <div className="text-[11px] sm:text-xs font-normal text-zinc-400 dark:text-zinc-500 text-right">
                        {liveAaveApy !== null ? `Earning ~${liveAaveApy.toFixed(2)}% APY on Polygon` : 'Supplied on Polygon'}
                      </div>
                    </Card>

                    <Card className="bg-zinc-50 dark:bg-zinc-800/60 p-3.5 sm:p-4 space-y-1 sm:space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">POL gas balance</span>
                        <span className="text-sm sm:text-base font-normal text-black dark:text-white">
                          {wallet.polBalance.toFixed(4)} POL
                        </span>
                      </div>
                      <div className="text-[11px] sm:text-xs font-normal text-zinc-400 dark:text-zinc-500 text-right">
                        Value {currencyService.formatUsd(wallet.polBalance * currencyService.getPolPriceUsd())}
                      </div>
                    </Card>
                  </>
                )}

                {wallet.nimAddress && (
                  <>
                    <Card className="bg-zinc-50 dark:bg-zinc-800/60 p-3.5 sm:p-4 space-y-1 sm:space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">NIM wallet balance</span>
                        <span className="text-sm sm:text-base font-normal text-black dark:text-white">
                          {wallet.nimBalance.toLocaleString()} NIM
                        </span>
                      </div>
                      <div className="text-[11px] sm:text-xs font-normal text-zinc-400 dark:text-zinc-500 text-right">
                        Value {currencyService.formatUsd(wallet.nimBalance * currencyService.getNimPriceUsd())}
                      </div>
                    </Card>

                    <Card className="bg-zinc-50 dark:bg-zinc-800/60 p-3.5 sm:p-4 space-y-1 sm:space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">Active NIM staked</span>
                        <span className="text-sm sm:text-base font-normal text-emerald-600 dark:text-emerald-400">
                          {wallet.activeStakeNim.toLocaleString()} NIM
                        </span>
                      </div>
                      <div className="text-[11px] sm:text-xs font-normal text-zinc-400 dark:text-zinc-500 text-right">
                        {liveNimApy !== null ? `Earning ~${liveNimApy.toFixed(2)}% network rewards` : 'Delegated on Nimiq PoS'}
                      </div>
                    </Card>
                  </>
                )}
              </div>

              {/* Wallet Addresses */}
              <div className="space-y-3 sm:space-y-4">
                <div className="text-xs uppercase tracking-wider font-normal text-zinc-500 dark:text-zinc-400">
                  Connected addresses
                </div>

                {wallet.evmAddress && (
                  <div className="bg-zinc-50 dark:bg-zinc-800/60 p-3.5 sm:p-4 rounded-[14px] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">
                        Polygon address
                      </span>
                      <div className="flex items-center gap-2">
                        <a
                          href={`https://polygonscan.com/address/${wallet.evmAddress}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-zinc-400 hover:text-black dark:hover:text-white flex items-center gap-0.5"
                          title="View on Polygonscan"
                        >
                          <IconExternalLink size={13} />
                        </a>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(wallet.evmAddress, 'evm')}
                          className="cursor-pointer text-xs font-normal text-zinc-800 dark:text-zinc-200 hover:text-black dark:hover:text-white flex items-center gap-1"
                        >
                          {copiedKey === 'evm' ? <IconCheck size={14} /> : 'Copy'}
                        </button>
                      </div>
                    </div>
                    <div className="text-xs font-normal text-zinc-700 dark:text-zinc-300 font-mono break-all">
                      {wallet.evmAddress}
                    </div>
                  </div>
                )}

                {wallet.nimAddress && (
                  <div className="bg-zinc-50 dark:bg-zinc-800/60 p-3.5 sm:p-4 rounded-[14px] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">
                        Nimiq address
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(wallet.nimAddress, 'nim')}
                        className="cursor-pointer text-xs font-normal text-zinc-800 dark:text-zinc-200 hover:text-black dark:hover:text-white flex items-center gap-1"
                      >
                        {copiedKey === 'nim' ? <IconCheck size={14} /> : 'Copy'}
                      </button>
                    </div>
                    <div className="text-xs font-normal text-zinc-700 dark:text-zinc-300 font-mono break-all">
                      {wallet.nimAddress}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-6 space-y-2">
              <Button
                variant="secondary"
                size="md"
                onClick={handleDisconnect}
                className="w-full justify-center text-xs sm:text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
              >
                <IconLogout size={16} stroke={1.75} />
                Disconnect session
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
