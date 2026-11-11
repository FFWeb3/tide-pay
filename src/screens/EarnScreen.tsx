import React, { useState, useEffect } from 'react'
import { Card } from '../components/common/Card'
import { CustomInput } from '../components/common/CustomInput'
import { CustomDropdown, DropdownOption } from '../components/common/CustomDropdown'
import { VenueCard } from '../components/earn/VenueCard'
import { DepositModal } from '../components/earn/DepositModal'
import { FeeBreakdownModal } from '../components/earn/FeeBreakdownModal'
import { fetchLiveRates } from '../services/ratesService'
import { rankVenues } from '../services/routingEngine'
import { walletService, WalletState } from '../services/walletService'
import { YieldVenue } from '../types'
import { IconInfoCircle, IconRefresh } from '@tabler/icons-react'

interface EarnScreenProps {
  onNavigatePositions: () => void
}

const TIMEFRAME_OPTIONS: DropdownOption<number>[] = [
  { value: 1 / 12, label: '1 month', sublabel: 'Short term parking' },
  { value: 0.25, label: '3 months', sublabel: 'Quarterly savings' },
  { value: 0.5, label: '6 months', sublabel: 'Medium term growth' },
  { value: 1, label: '1 year', sublabel: 'Full annual yield cycle' },
]

const ASSET_OPTIONS: DropdownOption<string>[] = [
  { value: 'USDT', label: 'USDT Stablecoin', sublabel: 'Polygon network' },
]

export const EarnScreen: React.FC<EarnScreenProps> = ({ onNavigatePositions }) => {
  const [wallet, setWallet] = useState<WalletState>(walletService.getState())
  const [venues, setVenues] = useState<YieldVenue[]>([])
  const [amount, setAmount] = useState<number>(() => {
    const initialBal = walletService.getState().usdtBalance
    return initialBal > 0 ? Number(initialBal.toFixed(2)) : 0
  })
  const [durationYears, setDurationYears] = useState<number>(1)
  const [selectedAsset, setSelectedAsset] = useState<string>('USDT')
  const [selectedVenue, setSelectedVenue] = useState<YieldVenue | null>(null)
  const [showFeeInfo, setShowFeeInfo] = useState<boolean>(false)
  const [isLoadingRates, setIsLoadingRates] = useState<boolean>(true)

  useEffect(() => {
    const unsub = walletService.subscribe((state) => {
      setWallet(state)
    })
    return () => unsub()
  }, [])

  const loadLiveYields = async () => {
    setIsLoadingRates(true)
    const live = await fetchLiveRates()
    setVenues(live)
    setIsLoadingRates(false)
  }

  useEffect(() => {
    loadLiveYields()
  }, [])

  const rankedResults = rankVenues({
    amountUsd: amount,
    durationYears,
    venues,
  })

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="space-y-2 sm:space-y-3">
        <h1 className="text-2xl min-[400px]:text-3xl md:text-5xl font-normal tracking-[-0.03em] leading-[115%] text-black dark:text-white">
          Put money to work.
        </h1>
        <p className="text-sm sm:text-base md:text-lg text-zinc-600 dark:text-zinc-400 max-w-xl font-normal leading-relaxed">
          Tide compares yields across audited lending protocols on Polygon and ranks them by net return after network costs.
        </p>
      </div>

      <Card className="p-4 sm:p-5 md:p-6 space-y-4 sm:space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CustomInput
            label="Deposit amount"
            helperText={`Available in wallet: ${wallet.usdtBalance.toFixed(2)} USDT`}
            type="number"
            placeholder="0.00"
            value={amount === 0 ? '' : amount.toString()}
            onChange={(e) => setAmount(Number(e.target.value) || 0)}
            suffixNode={
              <button
                type="button"
                onClick={() => setAmount(Number(wallet.usdtBalance.toFixed(2)))}
                className="cursor-pointer text-xs font-normal text-zinc-500 hover:text-black dark:hover:text-white px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800"
              >
                Max
              </button>
            }
          />

          <CustomDropdown
            label="Asset"
            options={ASSET_OPTIONS}
            value={selectedAsset}
            onChange={setSelectedAsset}
          />
        </div>

        <div className="pt-2">
          <CustomDropdown
            label="Expected holding period"
            options={TIMEFRAME_OPTIONS}
            value={durationYears}
            onChange={setDurationYears}
          />
        </div>
      </Card>

      <div className="space-y-3.5 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg sm:text-xl font-normal text-black dark:text-white tracking-tight">
              Recommended yield venues
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-normal">
              Ranked by net dollar return for your timeline
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadLiveYields}
              className="cursor-pointer p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-black dark:hover:text-white transition-colors"
              title="Refresh live on chain yields"
            >
              <IconRefresh size={16} stroke={1.75} className={isLoadingRates ? 'animate-spin' : ''} />
            </button>
            <button
              type="button"
              onClick={() => setShowFeeInfo(true)}
              className="cursor-pointer text-xs font-normal text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white flex items-center gap-1 py-1"
            >
              <IconInfoCircle size={15} stroke={1.75} />
              <span>How we calculate net yield</span>
            </button>
          </div>
        </div>

        {isLoadingRates && rankedResults.length === 0 ? (
          <Card className="p-8 text-center text-sm text-zinc-500 dark:text-zinc-400 font-normal">
            Reading live reserve rates and liquidity from on chain lending contracts...
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:gap-4">
            {rankedResults.map((item) => (
              <VenueCard
                key={item.venue.id}
                item={item}
                onSelect={() => setSelectedVenue(item.venue)}
              />
            ))}
          </div>
        )}
      </div>

      {selectedVenue && (
        <DepositModal
          venue={selectedVenue}
          depositAmount={amount}
          onClose={() => setSelectedVenue(null)}
          onSuccess={() => {
            setSelectedVenue(null)
            onNavigatePositions()
          }}
        />
      )}

      {showFeeInfo && rankedResults[0] && (
        <FeeBreakdownModal
          item={rankedResults[0]}
          depositAmount={amount}
          durationYears={durationYears}
          onClose={() => setShowFeeInfo(false)}
        />
      )}
    </div>
  )
}
