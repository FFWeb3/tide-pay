import React, { useEffect, useState } from 'react'
import { Card } from '../components/common/Card'
import { PositionCard } from '../components/positions/PositionCard'
import { WithdrawModal } from '../components/positions/WithdrawModal'
import { walletService, WalletState, LiveDbPosition } from '../services/walletService'
import { currencyService } from '../services/currencyService'
import { fetchOnChainAaveRate, fetchLiveValidatorPools } from '../services/ratesService'
import { IconInfoCircle, IconRefresh } from '@tabler/icons-react'

export const PositionsScreen: React.FC = () => {
  const [wallet, setWallet] = useState<WalletState>(walletService.getState())
  const [dbPositions, setDbPositions] = useState<LiveDbPosition[]>(walletService.getDbPositions())
  const [, setCurrency] = useState(currencyService.getCurrency())
  const [withdrawTarget, setWithdrawTarget] = useState<'NIM' | 'USDT' | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [liveAaveApy, setLiveAaveApy] = useState<number>(0)
  const [liveNimApy, setLiveNimApy] = useState<number>(0)

  useEffect(() => {
    const unsubWallet = walletService.subscribe((state) => {
      setWallet(state)
      setDbPositions(walletService.getDbPositions())
    })
    const unsubCurrency = currencyService.subscribe(setCurrency)
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
      unsubCurrency()
    }
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await walletService.refreshLiveBalances()
    await walletService.fetchUserPositionsFromDb()
    setDbPositions(walletService.getDbPositions())
    setIsRefreshing(false)
  }

  const nimPriceUsd = currencyService.getNimPriceUsd()
  const stakedNimUsd = wallet.activeStakeNim * nimPriceUsd
  const usdtDepositedUsd = wallet.aUsdtBalance
  const totalBalanceUsd = stakedNimUsd + usdtDepositedUsd

  const computeElapsedYears = (asset: string): number => {
    const matching = dbPositions.filter((p) => p.asset === asset && p.created_at)
    if (matching.length === 0) return 0
    const earliest = Math.min(...matching.map((p) => new Date(p.created_at).getTime()))
    if (!Number.isFinite(earliest)) return 0
    return Math.max(0, (Date.now() - earliest) / (365.25 * 24 * 3600 * 1000))
  }

  const nimElapsedYears = computeElapsedYears('NIM')
  const usdtElapsedYears = computeElapsedYears('USDT')

  const nimAccrued = wallet.activeStakeNim * (liveNimApy / 100) * nimElapsedYears
  const usdtAccrued = wallet.aUsdtBalance * (liveAaveApy / 100) * usdtElapsedYears

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div className="space-y-2 sm:space-y-3">
          <h1 className="text-2xl min-[400px]:text-3xl md:text-5xl font-normal tracking-[-0.03em] leading-[115%] text-black dark:text-white">
            Active positions.
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-zinc-600 dark:text-zinc-400 max-w-xl font-normal leading-relaxed">
            Track balances, accrued interest, and initiate non custodial withdrawals back into your wallet at any time.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          className="cursor-pointer self-start sm:self-auto p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-black dark:hover:text-white transition-colors flex items-center gap-1.5 text-xs"
        >
          <IconRefresh size={16} stroke={1.75} className={isRefreshing ? 'animate-spin' : ''} />
          <span>Refresh positions</span>
        </button>
      </div>

      <Card className="p-4 sm:p-5 md:p-6 space-y-2 sm:space-y-3">
        <div className="text-xs uppercase tracking-wider font-normal text-zinc-400 dark:text-zinc-500">
          Combined positions value
        </div>
        <div className="text-3xl min-[400px]:text-4xl md:text-6xl font-normal text-black dark:text-white tracking-tight break-words">
          {currencyService.formatUsd(totalBalanceUsd)}
        </div>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 font-normal">
          All positions are held directly by your wallet address without intermediary smart contract custody
        </p>
      </Card>

      <div className="space-y-4">
        {wallet.activeStakeNim > 0 && (
          <PositionCard
            title="NIM Proof of Stake"
            subtitle="Delegated to community validator"
            asset="NIM"
            principalAmount={wallet.activeStakeNim}
            accruedYield={nimAccrued}
            currentApy={liveNimApy}
            fiatValueUsd={stakedNimUsd}
            onWithdraw={() => setWithdrawTarget('NIM')}
          />
        )}

        {wallet.aUsdtBalance > 0 && (
          <PositionCard
            title="USDT Supply on Aave V3"
            subtitle="Supplied on Polygon network"
            asset="USDT"
            principalAmount={wallet.aUsdtBalance}
            accruedYield={usdtAccrued}
            currentApy={liveAaveApy}
            fiatValueUsd={usdtDepositedUsd}
            onWithdraw={() => setWithdrawTarget('USDT')}
          />
        )}

        {/* List distinct positions saved in Supabase if any additional exist */}
        {dbPositions.map((pos) => {
          if (
            (pos.asset === 'USDT' && wallet.aUsdtBalance > 0) ||
            (pos.asset === 'NIM' && wallet.activeStakeNim > 0)
          ) {
            return null
          }
          const isNim = pos.asset === 'NIM'
          const principal = Number(pos.principal)
          const fiatVal = isNim ? principal * nimPriceUsd : principal
          const apy = isNim ? liveNimApy : liveAaveApy
          const elapsed = pos.created_at
            ? Math.max(0, (Date.now() - new Date(pos.created_at).getTime()) / (365.25 * 24 * 3600 * 1000))
            : 0
          const accrued = principal * (apy / 100) * elapsed

          return (
            <PositionCard
              key={pos.id}
              title={pos.venue_name}
              subtitle={`Live position on ${pos.chain}`}
              asset={isNim ? 'NIM' : 'USDT'}
              principalAmount={principal}
              accruedYield={accrued}
              currentApy={apy}
              fiatValueUsd={fiatVal}
              onWithdraw={() => setWithdrawTarget(isNim ? 'NIM' : 'USDT')}
            />
          )
        })}

        {wallet.activeStakeNim === 0 && wallet.aUsdtBalance === 0 && dbPositions.length === 0 && (
          <Card className="p-8 text-center space-y-2">
            <div className="text-base font-normal text-black dark:text-white">
              No active earning positions yet
            </div>
            <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto font-normal">
              Deposit USDT to earn from audited lending protocols or stake NIM with validator pools to begin earning rewards.
            </p>
          </Card>
        )}
      </div>

      <Card className="p-5 space-y-2 bg-zinc-50 dark:bg-zinc-800/40">
        <div className="flex items-center gap-2 text-sm font-normal text-black dark:text-white">
          <IconInfoCircle size={17} stroke={1.75} />
          <span>Non custodial withdrawal guarantee</span>
        </div>
        <p className="text-xs md:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal">
          Because Tide executes deposits on behalf of your own address, your receipt tokens and stake entries belong strictly to you. If Tide were ever unavailable, you could still withdraw directly via the Aave web interface or through native Nimiq commands.
        </p>
      </Card>

      {withdrawTarget && (
        <WithdrawModal
          type={withdrawTarget}
          maxAmount={withdrawTarget === 'NIM' ? wallet.activeStakeNim : wallet.aUsdtBalance}
          onClose={() => setWithdrawTarget(null)}
          onSuccess={() => {
            setWithdrawTarget(null)
            handleRefresh()
          }}
        />
      )}
    </div>
  )
}
