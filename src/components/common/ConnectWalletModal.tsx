import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { authService, isNimiqMiniAppEnvironment, isMobileBrowser } from '../../services/authService'
import { Card } from './Card'
import { Button } from './Button'
import { IconX, IconWallet, IconCheck, IconAlertCircle, IconLock, IconCopy } from '@tabler/icons-react'

interface ConnectWalletModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export const ConnectWalletModal: React.FC<ConnectWalletModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'ethereum' | 'nimiq'>('ethereum')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successStep, setSuccessStep] = useState<string | null>(null)
  const [copiedAppLink, setCopiedAppLink] = useState(false)

  const inMiniApp = isNimiqMiniAppEnvironment()
  const onMobile = isMobileBrowser()

  const handleEthereumSignIn = async () => {
    try {
      setLoading(true)
      setErrorMessage(null)
      setSuccessStep('Requesting Polygon account...')
      await authService.signInWithEthereum()
      setSuccessStep('Sign In with Ethereum verified and sealed!')
      setTimeout(() => {
        setLoading(false)
        setSuccessStep(null)
        onClose()
        if (onSuccess) onSuccess()
      }, 700)
    } catch (err: unknown) {
      setLoading(false)
      setSuccessStep(null)
      if (err instanceof Error) {
        setErrorMessage(err.message)
      } else {
        setErrorMessage('Wallet sign in failed')
      }
    }
  }

  const handleNimiqConnect = async (useRedirect = false) => {
    try {
      setLoading(true)
      setErrorMessage(null)
      setSuccessStep(inMiniApp ? 'Connecting Nimiq Pay...' : 'Opening Nimiq Hub...')
      await authService.signInWithNimiqHub({
        useRedirect,
      })
      if (!useRedirect) {
        setSuccessStep('Nimiq signature verified and session sealed!')
        setTimeout(() => {
          setLoading(false)
          setSuccessStep(null)
          onClose()
          if (onSuccess) onSuccess()
        }, 700)
      }
    } catch (err: unknown) {
      setLoading(false)
      setSuccessStep(null)
      if (err instanceof Error) {
        setErrorMessage(err.message)
      } else {
        setErrorMessage('Nimiq sign in failed')
      }
    }
  }

  const handleCopyMiniAppLink = async () => {
    try {
      const url = typeof window !== 'undefined' ? window.location.origin : 'https://app-tide.pages.dev'
      await navigator.clipboard.writeText(url)
      setCopiedAppLink(true)
      setTimeout(() => setCopiedAppLink(false), 3000)
    } catch {
      // Fallback
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="w-full max-w-md max-h-[92dvh] overflow-y-auto rounded-[24px]"
        >
          <Card className="bg-white dark:bg-zinc-900 w-full p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white">
                  <IconWallet size={19} stroke={1.75} />
                </div>
                <div>
                  <div className="text-base sm:text-lg font-normal text-black dark:text-white">
                    Connect wallet
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    Live non custodial authentication
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer text-zinc-400 hover:text-black dark:hover:text-white p-1 transition-colors"
              >
                <IconX size={20} stroke={1.75} />
              </button>
            </div>

            {/* Network / Provider Selector */}
            <div className="grid grid-cols-2 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('ethereum')
                  setErrorMessage(null)
                }}
                className={`cursor-pointer py-2 text-xs sm:text-sm font-normal rounded-lg transition-all ${
                  activeTab === 'ethereum'
                    ? 'bg-white dark:bg-zinc-700 text-black dark:text-white'
                    : 'text-zinc-500 hover:text-black dark:hover:text-white'
                }`}
              >
                Polygon / EVM (SIWE)
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('nimiq')
                  setErrorMessage(null)
                }}
                className={`cursor-pointer py-2 text-xs sm:text-sm font-normal rounded-lg transition-all ${
                  activeTab === 'nimiq'
                    ? 'bg-white dark:bg-zinc-700 text-black dark:text-white'
                    : 'text-zinc-500 hover:text-black dark:hover:text-white'
                }`}
              >
                Nimiq
              </button>
            </div>

            {activeTab === 'ethereum' ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 space-y-2">
                  <div className="text-xs sm:text-sm font-normal text-black dark:text-white">
                    Sign In with Ethereum
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-normal">
                    Connect MetaMask, Rabby, or any browser wallet on Polygon. A cryptographic signature verifies ownership without granting custody of your funds.
                  </p>
                  <div className="pt-2 flex items-center gap-1.5 text-[11px] text-zinc-600 dark:text-zinc-400 font-mono">
                    <IconLock size={14} className="text-zinc-500 shrink-0" />
                    <span>Non custodial encrypted session</span>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="md"
                  onClick={handleEthereumSignIn}
                  disabled={loading}
                  className="w-full justify-center py-2.5 text-xs sm:text-sm"
                >
                  {loading ? (successStep || 'Signing in...') : 'Sign in with Ethereum'}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 space-y-2">
                  <div className="text-xs sm:text-sm font-normal text-black dark:text-white">
                    {inMiniApp ? 'Nimiq Pay Mini App' : 'Nimiq Wallet Authentication'}
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-normal">
                    {inMiniApp
                      ? 'Nimiq Pay detected. Sign the challenge directly inside Nimiq Pay to unlock your dashboard.'
                      : 'Sign in with Nimiq Hub in your browser, or copy the link below to open Tide directly inside the Nimiq Pay mobile app.'}
                  </p>
                  <div className="pt-2 flex items-center gap-1.5 text-[11px] text-zinc-600 dark:text-zinc-400 font-mono">
                    <IconLock size={14} className="text-zinc-500 shrink-0" />
                    <span>Non custodial encrypted session</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => handleNimiqConnect(onMobile && !inMiniApp)}
                    disabled={loading}
                    className="w-full justify-center py-2.5 text-xs sm:text-sm"
                  >
                    {loading
                      ? successStep || 'Waiting for Nimiq signature...'
                      : inMiniApp
                      ? 'Connect Nimiq Pay wallet'
                      : 'Sign in with Nimiq Hub'}
                  </Button>

                  {!inMiniApp && (
                    <Button
                      variant="secondary"
                      size="md"
                      onClick={handleCopyMiniAppLink}
                      className="w-full justify-center py-2 text-xs"
                    >
                      {copiedAppLink ? (
                        <>
                          <IconCheck size={15} stroke={1.75} />
                          <span>Link copied to open in Nimiq Pay app</span>
                        </>
                      ) : (
                        <>
                          <IconCopy size={15} stroke={1.75} />
                          <span>Copy link for Nimiq Pay mobile app</span>
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs flex items-start gap-2">
                <IconAlertCircle size={16} className="shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {successStep && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                <IconCheck size={16} className="shrink-0" />
                <span>{successStep}</span>
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
