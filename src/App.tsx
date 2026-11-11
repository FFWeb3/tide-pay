import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TopHeader } from './components/common/TopHeader'
import { BottomDock } from './components/common/BottomDock'
import { WalletDrawer } from './components/common/WalletDrawer'
import { ConnectWalletModal } from './components/common/ConnectWalletModal'
import { RiskFrameworkModal } from './components/common/RiskFrameworkModal'
import { LandingScreen } from './screens/LandingScreen'
import { OverviewScreen } from './screens/OverviewScreen'
import { EarnScreen } from './screens/EarnScreen'
import { StakeScreen } from './screens/StakeScreen'
import { PositionsScreen } from './screens/PositionsScreen'
import { walletService, WalletState } from './services/walletService'
import { authService } from './services/authService'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 60000,
    },
  },
})

const DASHBOARD_TABS = ['overview', 'earn', 'stake', 'positions']

const getRequestedHashTab = (): string => {
  if (typeof window === 'undefined') return 'landing'
  const hash = window.location.hash.replace('#', '').toLowerCase()
  if (DASHBOARD_TABS.includes(hash)) {
    return hash
  }
  return 'landing'
}

export const App: React.FC = () => {
  const [wallet, setWallet] = useState<WalletState>(walletService.getState())
  const [currentTab, setCurrentTabState] = useState<string>(() => {
    const requested = getRequestedHashTab()
    return walletService.getState().isConnected ? requested : 'landing'
  })
  const [isWalletOpen, setIsWalletOpen] = useState(false)
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false)
  const [isInfoOpen, setIsInfoOpen] = useState(false)
  const prevConnectedRef = useRef<boolean>(wallet.isConnected)
  const pendingTabRef = useRef<string | null>(null)

  useEffect(() => {
    const unsub = walletService.subscribe((newState) => {
      setWallet(newState)
    })
    return unsub
  }, [])

  // Handle initial URL hash & session restoration
  useEffect(() => {
    const requested = getRequestedHashTab()
    if (requested !== 'landing') {
      pendingTabRef.current = requested
      authService.restoreSession().then((restored) => {
        if (restored) {
          setCurrentTabState(requested)
          window.history.replaceState(null, '', `#${requested}`)
        } else {
          // Strict auth gate: no account, no dashboard access
          setCurrentTabState('landing')
          window.history.replaceState(null, '', window.location.pathname)
          setIsConnectModalOpen(true)
        }
      })
    }
  }, [])

  // React to authentication state transitions
  useEffect(() => {
    const wasConnected = prevConnectedRef.current
    prevConnectedRef.current = wallet.isConnected

    if (!wasConnected && wallet.isConnected) {
      // User just signed in: navigate to pending dashboard tab or overview
      const target = pendingTabRef.current && DASHBOARD_TABS.includes(pendingTabRef.current)
        ? pendingTabRef.current
        : 'overview'
      pendingTabRef.current = null
      setCurrentTabState(target)
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', `#${target}`)
      }
    } else if (wasConnected && !wallet.isConnected) {
      // User signed out: lock dashboard and return to landing
      pendingTabRef.current = null
      setCurrentTabState('landing')
      setIsWalletOpen(false)
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', window.location.pathname)
      }
    }
  }, [wallet.isConnected])

  const setCurrentTab = (tab: string) => {
    if (tab !== 'landing' && !walletService.getState().isConnected) {
      pendingTabRef.current = tab
      setCurrentTabState('landing')
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', window.location.pathname)
      }
      setIsConnectModalOpen(true)
      return
    }

    setCurrentTabState(tab)
    if (typeof window !== 'undefined') {
      if (tab === 'landing') {
        window.history.replaceState(null, '', window.location.pathname)
      } else {
        window.history.replaceState(null, '', `#${tab}`)
      }
    }
  }

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').toLowerCase()
      if (DASHBOARD_TABS.includes(hash)) {
        if (walletService.getState().isConnected) {
          setCurrentTabState(hash)
        } else {
          pendingTabRef.current = hash
          setCurrentTabState('landing')
          window.history.replaceState(null, '', window.location.pathname)
          setIsConnectModalOpen(true)
        }
      } else if (!hash) {
        setCurrentTabState('landing')
      }
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  // Strict gate: dashboard screens can NEVER render unless wallet.isConnected is true
  const activeTab = wallet.isConnected ? currentTab : 'landing'
  const isLanding = activeTab === 'landing'

  return (
    <QueryClientProvider client={queryClient}>
      <div
        className={`bg-white dark:bg-black text-zinc-900 dark:text-zinc-100 font-normal flex flex-col relative selection:bg-zinc-200 dark:selection:bg-zinc-800 transition-colors ${
          isLanding
            ? 'min-h-[100dvh] h-auto md:h-[100dvh] overflow-x-hidden overflow-y-auto md:overflow-hidden'
            : 'min-h-[100dvh]'
        }`}
      >
        {/* Subtle dual vertical guidelines matching reference */}
        <div className="fixed top-0 bottom-0 w-full pointer-events-none z-0">
          <div className="relative mx-auto max-w-[66rem] h-full">
            <div className="absolute left-0 top-0 h-full w-[1px] bg-[#0000000a] dark:bg-[#ffffff0d]" />
            <div className="absolute right-0 top-0 h-full w-[1px] bg-[#0000000a] dark:bg-[#ffffff0d]" />
          </div>
        </div>

        {isLanding ? (
          <div className="w-full h-full flex flex-col relative z-10">
            {/* Desktop: The top floating dock */}
            <div className="hidden md:block">
              <BottomDock
                currentTab={activeTab}
                onSelectTab={setCurrentTab}
                position="top"
                onOpenWallet={() => setIsWalletOpen(true)}
                onOpenConnect={() => setIsConnectModalOpen(true)}
              />
            </div>

            {/* Mobile: Clean TopHeader with animated hamburger */}
            <div className="block md:hidden w-full max-w-[66rem] mx-auto px-3.5 pt-1">
              <TopHeader
                onOpenWallet={() => setIsWalletOpen(true)}
                onOpenInfo={() => setIsInfoOpen(true)}
                onOpenConnect={() => setIsConnectModalOpen(true)}
                onSelectTab={setCurrentTab}
                currentTab={activeTab}
              />
            </div>

            <LandingScreen
              onOpenDashboard={() => setCurrentTab('overview')}
              onOpenInfo={() => setIsInfoOpen(true)}
              onOpenWallet={() => setIsWalletOpen(true)}
              onOpenConnect={() => setIsConnectModalOpen(true)}
            />
          </div>
        ) : (
          /* Authenticated Dashboard View */
          <>
            <div className="w-full max-w-[66rem] mx-auto px-3.5 sm:px-6 flex-1 flex flex-col relative z-10 pb-24 sm:pb-32">
              <TopHeader
                onOpenWallet={() => setIsWalletOpen(true)}
                onOpenInfo={() => setIsInfoOpen(true)}
                onOpenConnect={() => setIsConnectModalOpen(true)}
                onSelectTab={setCurrentTab}
                currentTab={activeTab}
              />

              <main className="flex-1 mt-4 md:mt-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                  >
                    {activeTab === 'overview' && (
                      <OverviewScreen
                        onNavigateEarn={() => setCurrentTab('earn')}
                        onNavigateStake={() => setCurrentTab('stake')}
                      />
                    )}

                    {activeTab === 'earn' && (
                      <EarnScreen
                        onNavigatePositions={() => setCurrentTab('positions')}
                      />
                    )}

                    {activeTab === 'stake' && (
                      <StakeScreen
                        onNavigatePositions={() => setCurrentTab('positions')}
                      />
                    )}

                    {activeTab === 'positions' && (
                      <PositionsScreen />
                    )}
                  </motion.div>
                </AnimatePresence>
              </main>
            </div>

            {/* Bottom Dock Navigation inside the Dashboard */}
            <BottomDock
              currentTab={activeTab}
              onSelectTab={setCurrentTab}
              position="bottom"
              onOpenWallet={() => setIsWalletOpen(true)}
              onOpenConnect={() => setIsConnectModalOpen(true)}
            />
          </>
        )}

        {/* Global Slide Over Wallet Drawer */}
        <WalletDrawer
          isOpen={isWalletOpen}
          onClose={() => setIsWalletOpen(false)}
          onOpenConnectModal={() => {
            setIsWalletOpen(false)
            setIsConnectModalOpen(true)
          }}
        />

        {/* Connect Wallet Modal */}
        <ConnectWalletModal
          isOpen={isConnectModalOpen}
          onClose={() => setIsConnectModalOpen(false)}
        />

        {/* Risk & Security Framework Modal */}
        <RiskFrameworkModal
          isOpen={isInfoOpen}
          onClose={() => setIsInfoOpen(false)}
        />
      </div>
    </QueryClientProvider>
  )
}

export default App
