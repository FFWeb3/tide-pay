import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CurrencyToggle } from './CurrencyToggle'
import { TideLogo } from './TideLogo'
import { walletService, WalletState, formatShortAddress } from '../../services/walletService'
import { currencyService } from '../../services/currencyService'
import { themeService, ThemeMode } from '../../services/themeService'
import { FiatCurrency } from '../../types'
import {
  IconWallet,
  IconInfoCircle,
  IconLogout,
  IconMenu2,
  IconX,
  IconSun,
  IconMoon,
  IconLayoutDashboard,
  IconArrowsTransferUpDown,
  IconHexagon,
} from '@tabler/icons-react'

interface TopHeaderProps {
  onOpenWallet: () => void
  onOpenInfo: () => void
  onOpenConnect: () => void
  onSelectTab: (tab: string) => void
  currentTab?: string
}

const CURRENCIES: FiatCurrency[] = ['USD', 'NGN', 'EUR', 'KES']

export const TopHeader: React.FC<TopHeaderProps> = ({
  onOpenWallet,
  onOpenInfo,
  onOpenConnect,
  onSelectTab,
  currentTab = 'overview',
}) => {
  const [wallet, setWallet] = useState<WalletState>(walletService.getState())
  const [currency, setCurrency] = useState<FiatCurrency>(currencyService.getCurrency())
  const [theme, setTheme] = useState<ThemeMode>(themeService.getTheme())
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    const unsubWallet = walletService.subscribe(setWallet)
    const unsubCurrency = currencyService.subscribe(setCurrency)
    const unsubTheme = themeService.subscribe(setTheme)
    return () => {
      unsubWallet()
      unsubCurrency()
      unsubTheme()
    }
  }, [])

  // Close mobile menu on Escape key press
  useEffect(() => {
    if (!isMenuOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isMenuOpen])

  const displayAddress = wallet.evmAddress || wallet.nimAddress

  const navItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <IconLayoutDashboard size={16} stroke={1.75} />,
    },
    {
      id: 'earn',
      label: 'Put to work',
      icon: <IconArrowsTransferUpDown size={16} stroke={1.75} />,
    },
    {
      id: 'stake',
      label: 'Stake NIM',
      icon: <IconHexagon size={16} stroke={1.75} />,
    },
    {
      id: 'positions',
      label: 'Positions',
      icon: <IconWallet size={16} stroke={1.75} />,
    },
  ]

  const handleTabClick = (id: string) => {
    setIsMenuOpen(false)
    onSelectTab(id)
  }

  return (
    <header className="w-full relative z-30 py-3 md:py-4">
      <div className="flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div
          onClick={() => {
            setIsMenuOpen(false)
            onSelectTab('landing')
          }}
          className="cursor-pointer flex items-center gap-2 sm:gap-2.5 group shrink-0"
          title="Return to home"
        >
          <TideLogo size={22} className="text-black dark:text-white transition-transform duration-200 group-hover:scale-105" />
          <span className="text-lg sm:text-xl md:text-2xl font-normal tracking-[-0.03em] text-black dark:text-white">
            Tide
          </span>
          <span className="hidden sm:inline-block text-xs text-zinc-400 dark:text-zinc-500 font-normal">
            Nimiq Pay
          </span>
        </div>

        {/* Desktop Controls (hidden on mobile) */}
        <div className="hidden md:flex items-center gap-2">
          <CurrencyToggle />

          <button
            type="button"
            onClick={onOpenInfo}
            className="cursor-pointer p-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all flex items-center justify-center"
            title="Protocol risk & routing information"
          >
            <IconInfoCircle size={16} stroke={1.75} />
          </button>

          {!wallet.isConnected ? (
            <button
              type="button"
              onClick={onOpenConnect}
              className="cursor-pointer flex items-center gap-1.5 text-xs font-normal text-white bg-black dark:bg-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 px-3.5 py-2 rounded-xl transition-all"
            >
              <IconWallet size={15} stroke={1.75} />
              <span>Connect wallet</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onOpenWallet}
                className="cursor-pointer flex items-center gap-1.5 text-xs font-normal text-zinc-800 dark:text-zinc-200 hover:text-black dark:hover:text-white bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-800 px-3 py-2 rounded-xl transition-all"
                title="View wallet details"
              >
                <IconWallet size={15} stroke={1.75} />
                <span className="font-mono text-xs">{formatShortAddress(displayAddress)}</span>
              </button>

              <button
                type="button"
                onClick={() => walletService.disconnectWallet()}
                className="cursor-pointer flex items-center gap-1 text-xs font-normal text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-800 px-2.5 py-2 rounded-xl transition-all"
                title="Disconnect wallet"
              >
                <IconLogout size={14} stroke={1.75} />
                <span>Disconnect</span>
              </button>
            </div>
          )}
        </div>

        {/* Mobile Right Controls: Compact Connect + Hamburger Button */}
        <div className="flex md:hidden items-center gap-1.5">
          {!wallet.isConnected ? (
            <button
              type="button"
              onClick={onOpenConnect}
              className="cursor-pointer flex items-center gap-1 text-xs font-normal text-white bg-black dark:bg-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 px-2.5 py-1.5 rounded-xl transition-all"
            >
              <IconWallet size={14} stroke={1.75} />
              <span>Connect</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenWallet}
              className="cursor-pointer flex items-center gap-1 text-[11px] font-mono text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800/80 px-2 py-1.5 rounded-xl"
              title="View wallet details"
            >
              <IconWallet size={13} stroke={1.75} />
              <span>{formatShortAddress(displayAddress)}</span>
            </button>
          )}

          {/* Animated Hamburger Toggle Button */}
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="cursor-pointer p-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center"
          >
            {isMenuOpen ? (
              <IconX size={18} stroke={1.85} />
            ) : (
              <IconMenu2 size={18} stroke={1.85} />
            )}
          </button>
        </div>
      </div>

      {/* Animated Mobile Hamburger Menu Drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop Blur Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
            />

            {/* Menu Card Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="absolute top-full left-0 right-0 mt-2 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 z-50 space-y-4 md:hidden"
            >
              {/* Menu Header with Tide Home link and Close */}
              <div className="flex items-center justify-between pb-1">
                <button
                  type="button"
                  onClick={() => handleTabClick('landing')}
                  className="cursor-pointer flex items-center gap-2 text-sm font-normal text-black dark:text-white"
                >
                  <TideLogo size={18} />
                  <span>Tide Home</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsMenuOpen(false)}
                  className="cursor-pointer p-1 rounded-lg text-zinc-400 hover:text-black dark:hover:text-white"
                >
                  <IconX size={16} />
                </button>
              </div>

              {/* Navigation Links - Strictly shown only when authenticated */}
              {wallet.isConnected && (
                <div className="space-y-1.5">
                  <div className="text-[10px] font-normal uppercase tracking-wider text-zinc-400 dark:text-zinc-500 px-1">
                    Navigate
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {navItems.map((item) => {
                      const isActive = currentTab === item.id
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleTabClick(item.id)}
                          className={`cursor-pointer flex items-center gap-2 p-2.5 rounded-xl text-xs font-normal transition-all ${
                            isActive
                              ? 'bg-zinc-200/80 dark:bg-zinc-800 text-black dark:text-white'
                              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 hover:text-black dark:hover:text-white'
                          }`}
                        >
                          {item.icon}
                          <span>{item.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Display Currency Segmented Control */}
              <div className="space-y-1.5 pt-1">
                <div className="text-[10px] font-normal uppercase tracking-wider text-zinc-400 dark:text-zinc-500 px-1">
                  Currency
                </div>
                <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-zinc-200/60 dark:bg-zinc-800/80">
                  {CURRENCIES.map((c) => {
                    const isSelected = currency === c
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => currencyService.setCurrency(c)}
                        className={`cursor-pointer py-1.5 text-xs font-normal rounded-lg text-center transition-colors ${
                          isSelected
                            ? 'bg-white dark:bg-zinc-900 text-black dark:text-white'
                            : 'text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white'
                        }`}
                      >
                        {c}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Preferences & Quick Actions */}
              <div className="space-y-1.5 pt-1">
                <div className="text-[10px] font-normal uppercase tracking-wider text-zinc-400 dark:text-zinc-500 px-1">
                  Preferences
                </div>
                <div className="space-y-1.5">
                  {/* Theme Mode Toggle */}
                  <button
                    type="button"
                    onClick={() => themeService.toggleTheme()}
                    className="w-full cursor-pointer flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-normal text-zinc-800 dark:text-zinc-200 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {theme === 'dark' ? (
                        <IconSun size={16} stroke={1.75} className="text-amber-400" />
                      ) : (
                        <IconMoon size={16} stroke={1.75} />
                      )}
                      <span>Color theme</span>
                    </div>
                    <span className="text-zinc-400 dark:text-zinc-500 text-[11px] capitalize">{theme}</span>
                  </button>

                  {/* Security & Risk Framework */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false)
                      onOpenInfo()
                    }}
                    className="w-full cursor-pointer flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-normal text-zinc-800 dark:text-zinc-200 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <IconInfoCircle size={16} stroke={1.75} />
                      <span>Security & Risk</span>
                    </div>
                    <span className="text-zinc-400 dark:text-zinc-500 text-[11px]">Audit and model</span>
                  </button>
                </div>
              </div>

              {/* Wallet Section */}
              <div className="pt-1">
                {!wallet.isConnected ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false)
                      onOpenConnect()
                    }}
                    className="w-full cursor-pointer py-2.5 px-4 rounded-xl text-xs font-normal text-white bg-black dark:bg-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <IconWallet size={15} stroke={1.75} />
                    <span>Connect wallet</span>
                  </button>
                ) : (
                  <div className="space-y-1.5">
                    <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-800/50 flex items-center justify-between">
                      <div className="flex items-center gap-2 font-mono text-xs text-zinc-800 dark:text-zinc-200">
                        <IconWallet size={14} stroke={1.75} />
                        <span>{formatShortAddress(displayAddress)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false)
                          onOpenWallet()
                        }}
                        className="cursor-pointer text-[11px] text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white underline underline-offset-2"
                      >
                        Details
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false)
                        walletService.disconnectWallet()
                      }}
                      className="w-full cursor-pointer py-2 px-3 rounded-xl text-xs font-normal text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <IconLogout size={14} stroke={1.75} />
                      <span>Disconnect wallet</span>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  )
}
