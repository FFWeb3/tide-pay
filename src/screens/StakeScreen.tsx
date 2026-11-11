import React, { useState, useEffect } from 'react'
import { Card } from '../components/common/Card'
import { CustomInput } from '../components/common/CustomInput'
import { CustomDropdown, DropdownOption } from '../components/common/CustomDropdown'
import { PoolCard } from '../components/stake/PoolCard'
import { StakeModal } from '../components/stake/StakeModal'
import { walletService, WalletState } from '../services/walletService'
import { fetchLiveValidatorPools } from '../services/ratesService'
import { NimiqValidatorPool } from '../types'
import { IconSearch, IconRefresh } from '@tabler/icons-react'

interface StakeScreenProps {
  onNavigatePositions: () => void
}

type SortField = 'rate' | 'fee' | 'reliability' | 'stake'

const SORT_OPTIONS: DropdownOption<SortField>[] = [
  { value: 'rate', label: 'Highest reward rate', sublabel: 'Annual percentage' },
  { value: 'fee', label: 'Lowest pool fee', sublabel: 'Validator commission' },
  { value: 'reliability', label: 'Highest reliability', sublabel: 'Block production' },
  { value: 'stake', label: 'Largest total stake', sublabel: 'Community delegation' },
]

export const StakeScreen: React.FC<StakeScreenProps> = ({ onNavigatePositions }) => {
  const [wallet, setWallet] = useState<WalletState>(walletService.getState())
  const [pools, setPools] = useState<NimiqValidatorPool[]>([])
  const [selectedPool, setSelectedPool] = useState<NimiqValidatorPool | null>(null)
  const [filterQuery, setFilterQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortField>('rate')
  const [isLoadingPools, setIsLoadingPools] = useState(true)

  useEffect(() => {
    const unsub = walletService.subscribe(setWallet)
    return () => unsub()
  }, [])

  const loadLivePools = async () => {
    setIsLoadingPools(true)
    const liveList = await fetchLiveValidatorPools()
    setPools(liveList)
    setIsLoadingPools(false)
  }

  useEffect(() => {
    loadLivePools()
  }, [])

  const filteredPools = pools
    .filter(
      (p) =>
        p.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
        p.address.toLowerCase().includes(filterQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'rate') return b.rewardRatePercent - a.rewardRatePercent
      if (sortBy === 'fee') return a.feePercent - b.feePercent
      if (sortBy === 'reliability') return b.reliabilityPercent - a.reliabilityPercent
      if (sortBy === 'stake') return b.totalStakeNim - a.totalStakeNim
      return 0
    })

  const averageRewardRate =
    filteredPools.length > 0
      ? (
          filteredPools.reduce((acc, p) => acc + p.rewardRatePercent, 0) /
          filteredPools.length
        ).toFixed(2)
      : '0.00'

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="space-y-2 sm:space-y-3">
        <h1 className="text-2xl min-[400px]:text-3xl md:text-5xl font-normal tracking-[-0.03em] leading-[115%] text-black dark:text-white">
          Stake NIM coins.
        </h1>
        <p className="text-sm sm:text-base md:text-lg text-zinc-600 dark:text-zinc-400 max-w-xl font-normal leading-relaxed">
          Earn native Proof of Stake rewards directly in your Nimiq address. Tide verifies pool reliability and live payout accuracy.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
        <Card className="p-4 sm:p-5 space-y-1 sm:space-y-1.5">
          <div className="text-xs text-zinc-400 dark:text-zinc-500 font-normal">Available to stake</div>
          <div className="text-xl sm:text-2xl font-normal text-black dark:text-white">
            {wallet.nimBalance.toLocaleString()} NIM
          </div>
          <div className="text-[11px] sm:text-xs text-zinc-400 dark:text-zinc-500">Unstaked in wallet</div>
        </Card>

        <Card className="p-4 sm:p-5 space-y-1 sm:space-y-1.5">
          <div className="text-xs text-zinc-400 dark:text-zinc-500 font-normal">Currently staked</div>
          <div className="text-xl sm:text-2xl font-normal text-black dark:text-white">
            {wallet.activeStakeNim.toLocaleString()} NIM
          </div>
          <div className="text-[11px] sm:text-xs text-zinc-400 dark:text-zinc-500">Earning network rewards</div>
        </Card>

        <Card className="p-4 sm:p-5 space-y-1 sm:space-y-1.5">
          <div className="text-xs text-zinc-400 dark:text-zinc-500 font-normal">Network reward rate</div>
          <div className="text-xl sm:text-2xl font-normal text-emerald-600 dark:text-emerald-400">
            {isLoadingPools && filteredPools.length === 0 ? 'Loading...' : `~${averageRewardRate}%`}
          </div>
          <div className="text-[11px] sm:text-xs text-zinc-400 dark:text-zinc-500">
            {filteredPools.length} live mainnet pools
          </div>
        </Card>
      </div>

      <Card className="p-4 sm:p-5 space-y-2 bg-zinc-50 dark:bg-zinc-800/40">
        <div className="text-xs sm:text-sm font-normal text-black dark:text-white">
          Non custodial delegation
        </div>
        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal">
          Delegating does not transfer ownership of your coins. Your NIM remains secured in your own Nimiq address. Validators simply produce blocks and share rewards based on their fee schedule.
        </p>
      </Card>

      <div className="space-y-3.5 sm:space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <CustomInput
            placeholder="Search validator pools"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            prefixNode={<IconSearch size={18} stroke={1.75} />}
          />

          <div className="flex items-center gap-2">
            <div className="flex-1">
              <CustomDropdown
                options={SORT_OPTIONS}
                value={sortBy}
                onChange={setSortBy}
              />
            </div>
            <button
              type="button"
              onClick={loadLivePools}
              className="cursor-pointer p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 transition-colors"
              title="Refresh live validator pools"
            >
              <IconRefresh size={18} stroke={1.75} className={isLoadingPools ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:gap-4">
          {isLoadingPools && filteredPools.length === 0 ? (
            <Card className="p-8 text-center text-sm text-zinc-500 dark:text-zinc-400 font-normal">
              Querying active validator pools on Nimiq PoS mainnet...
            </Card>
          ) : (
            <>
              {filteredPools.map((pool) => (
                <PoolCard
                  key={pool.id}
                  pool={pool}
                  isCurrentPool={wallet.stakedPoolAddress === pool.address}
                  onStake={() => setSelectedPool(pool)}
                />
              ))}

              {filteredPools.length === 0 && (
                <Card className="p-8 text-center text-sm text-zinc-500">
                  No validator pools match your search query
                </Card>
              )}
            </>
          )}
        </div>
      </div>

      {selectedPool && (
        <StakeModal
          pool={selectedPool}
          onClose={() => setSelectedPool(null)}
          onSuccess={() => {
            setSelectedPool(null)
            onNavigatePositions()
          }}
        />
      )}
    </div>
  )
}
