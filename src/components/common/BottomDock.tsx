import React, { useEffect, useState } from 'react'
import {
  IconHexagon,
  IconWallet,
  IconArrowsTransferUpDown,
  IconMoon,
  IconSun,
  IconLayoutDashboard,
  IconLogout,
} from '@tabler/icons-react'
import { TideLogo } from './TideLogo'
import { themeService, ThemeMode } from '../../services/themeService'
import { walletService, WalletState, formatShortAddress } from '../../services/walletService'

interface BottomDockProps {
  currentTab: string
  onSelectTab: (tab: string) => void
  position?: 'top' | 'bottom'
  onOpenWallet?: () => void
  onOpenConnect?: () => void
}

export const BottomDock: React.FC<BottomDockProps> = ({
  currentTab,
  onSelectTab,
  position = 'bottom',
  onOpenWallet,
  onOpenConnect,
}) => {
  const [theme, setTheme] = useState<ThemeMode>(themeService.getTheme())
  const [wallet, setWallet] = useState<WalletState>(walletService.getState())

  useEffect(() => {
    const unsubTheme = themeService.subscribe(setTheme)
    const unsubWallet = walletService.subscribe(setWallet)
    return () => {
      unsubTheme()
      unsubWallet()
    }
  }, [])

  const fullTabs = [
    {
      id: 'landing',
      label: 'Home',
      shortLabel: 'Home',
      icon: <TideLogo size={17} />,
    },
    {
      id: 'overview',
      label: 'Overview',
      shortLabel: 'Overview',
      icon: <IconLayoutDashboard size={17} stroke={1.75} />,
    },
    {
      id: 'earn',
      label: 'Put to work',
      shortLabel: 'Earn',
      icon: <IconArrowsTransferUpDown size={17} stroke={1.75} />,
    },
    {
      id: 'stake',
      label: 'Stake NIM',
      shortLabel: 'Stake',
      icon: <IconHexagon size={17} stroke={1.75} />,
    },
    {
      id: 'positions',
      label: 'Positions',
      shortLabel: 'Positions',
      icon: <IconWallet size={17} stroke={1.75} />,
    },
  ]

  const isLandingHeader = position === 'top'
  const displayAddress = wallet.evmAddress || wallet.nimAddress

  return (
    <div
      className={
        isLandingHeader
          ? 'w-full sticky top-0 z-40 pt-2.5 sm:pt-4 pb-2 px-2 sm:px-4 pointer-events-none'
          : 'fixed bottom-0 left-0 right-0 z-40 pb-3 sm:pb-5 pt-2 px-2 sm:px-4 pointer-events-none'
      }
    >
      <div className="max-w-fit mx-auto pointer-events-auto">
        <nav
          aria-label="Navigation dock"
          className="flex items-center gap-1 sm:gap-1.5 p-1.5 sm:p-2 rounded-[17px] sm:rounded-[20px] bg-zinc-100 dark:bg-zinc-900"
        >
          {/* Logo badge */}
          <button
            type="button"
            onClick={() => onSelectTab('landing')}
            className="cursor-pointer flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-[13px] sm:rounded-[15px] text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200/70 dark:hover:bg-zinc-800 transition-colors"
            title="Tide Home"
          >
            <TideLogo size={18} className="text-black dark:text-white" />
            <span className="hidden min-[480px]:inline text-xs sm:text-sm font-normal tracking-tight">
              Tide
            </span>
          </button>

          {/* Navigation Tabs - Only visible when authenticated */}
          {wallet.isConnected && (
            <div className="flex items-center gap-0.5 sm:gap-1">
              {fullTabs.map((tab) => {
                if (tab.id === 'landing') return null
                const isActive = currentTab === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => onSelectTab(tab.id)}
                    className={`cursor-pointer flex items-center gap-1 sm:gap-2 px-1.5 min-[380px]:px-2 sm:px-3.5 py-1.5 sm:py-2.5 rounded-[12px] sm:rounded-[15px] text-[11px] min-[380px]:text-xs sm:text-sm font-normal transition-all duration-200 ${
                      isActive
                        ? 'bg-white dark:bg-zinc-800 text-black dark:text-white'
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-white/60 dark:hover:bg-zinc-800/60'
                    }`}
                  >
                    {tab.icon}
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.shortLabel}</span>
                  </button>
                )
              })}
            </div>
          )}

          {/* Wallet Section (Desktop only for bottom dock) */}
          <div className={!isLandingHeader ? 'hidden md:flex items-center gap-1' : 'flex items-center gap-1'}>
            {!wallet.isConnected ? (
              <button
                type="button"
                onClick={() => (onOpenConnect ? onOpenConnect() : walletService.connectWallet())}
                className="cursor-pointer flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2.5 rounded-[13px] sm:rounded-[15px] text-xs sm:text-sm font-normal bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all duration-200"
              >
                <IconWallet size={16} stroke={1.75} />
                <span className="hidden sm:inline">Connect wallet</span>
                <span className="sm:hidden">Connect</span>
              </button>
            ) : (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={onOpenWallet}
                  className="cursor-pointer flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2.5 rounded-[13px] sm:rounded-[15px] text-xs sm:text-sm font-normal text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-white dark:hover:bg-zinc-800 transition-all duration-200 font-mono"
                  title="View wallet details"
                >
                  <IconWallet size={16} stroke={1.75} />
                  <span>{formatShortAddress(displayAddress)}</span>
                </button>

                <button
                  type="button"
                  onClick={() => walletService.disconnectWallet()}
                  className="cursor-pointer flex items-center gap-1 px-1.5 sm:px-2.5 py-1.5 sm:py-2.5 rounded-[13px] sm:rounded-[15px] text-xs font-normal text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-white dark:hover:bg-zinc-800 transition-all duration-200"
                  title="Disconnect wallet"
                >
                  <IconLogout size={15} stroke={1.75} />
                  <span className="hidden lg:inline">Disconnect</span>
                </button>
              </div>
            )}
          </div>

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={() => themeService.toggleTheme()}
            className="cursor-pointer flex items-center gap-1 sm:gap-2 px-2 sm:px-3.5 py-1.5 sm:py-2.5 rounded-[13px] sm:rounded-[15px] text-xs sm:text-sm font-normal text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-all duration-200"
            title="Toggle color theme"
          >
            {theme === 'dark' ? (
              <IconSun size={17} stroke={1.75} className="text-amber-400" />
            ) : (
              <IconMoon size={17} stroke={1.75} />
            )}
            <span className="hidden sm:inline">{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>
        </nav>
      </div>
    </div>
  )
}
