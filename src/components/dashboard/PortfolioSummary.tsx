import React, { useEffect, useState } from 'react'
import { Card } from '../common/Card'
import { Button } from '../common/Button'
import { walletService, WalletState } from '../../services/walletService'
import { currencyService } from '../../services/currencyService'
import { fetchOnChainAaveRate, fetchLiveValidatorPools } from '../../services/ratesService'
import { IconArrowUpRight, IconHexagon, IconCurrencyDollar } from '@tabler/icons-react'

interface PortfolioSummaryProps {
  onNavigateEarn: () => void
  onNavigateStake: () => void
}

export const PortfolioSummary: React.FC<PortfolioSummaryProps> = ({
  onNavigateEarn,
  onNavigateStake,
}) => {
  const [wallet, setWallet] = useState<WalletState>(walletService.getState())
  const [, setCurrency] = useState(currencyService.getCurrency())
  const [liveAaveApy, setLiveAaveApy] = useState<number>(0)
  const [liveNimApy, setLiveNimApy] = useState<number>(0)

  useEffect(() => {
    const unsubWallet = walletService.subscribe(setWallet)
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

  const nimPriceUsd = currencyService.getNimPriceUsd()
  const stakedNimUsd = wallet.activeStakeNim * nimPriceUsd
  const usdtDepositedUsd = wallet.aUsdtBalance
  const totalBalanceUsd = stakedNimUsd + usdtDepositedUsd

  const nimAnnualYieldUsd = stakedNimUsd * (liveNimApy / 100)
  const usdtAnnualYieldUsd = usdtDepositedUsd * (liveAaveApy / 100)
  const blendedApy =
    totalBalanceUsd > 0
      ? ((nimAnnualYieldUsd + usdtAnnualYieldUsd) / totalBalanceUsd) * 100
      : 0

  const estimatedEarnedUsd =
    (wallet.activeStakeNim * nimPriceUsd * (liveNimApy / 100) +
      wallet.aUsdtBalance * (liveAaveApy / 100)) *
    (30 / 365)

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Hero Header */}
      <div className="space-y-2 sm:space-y-3">
        <h1 className="text-2xl min-[400px]:text-3xl md:text-5xl font-normal tracking-[-0.03em] leading-[115%] text-black dark:text-white">
          Put your idle crypto to work.
        </h1>
        <p className="text-sm sm:text-base md:text-lg text-zinc-600 dark:text-zinc-400 max-w-xl font-normal leading-relaxed">
          Tide aggregates native NIM staking and audited USDT lending pools into one screen. Every deposit stays in your own wallet.
        </p>
      </div>

      {/* Main Net Worth Card */}
      <Card className="p-4 sm:p-5 md:p-6 space-y-5 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 sm:gap-6">
          <div className="space-y-1.5 sm:space-y-2">
            <span className="text-xs uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-normal">
              Total money at work
            </span>
            <div className="text-3xl min-[400px]:text-4xl md:text-6xl font-normal tracking-tight text-black dark:text-white break-words">
              {currencyService.formatUsd(totalBalanceUsd)}
            </div>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-normal">
              Blended annual return of {blendedApy.toFixed(2)} percent across your holdings
            </p>
          </div>

          <div className="flex flex-col min-[400px]:flex-row items-stretch min-[400px]:items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
            <Button
              variant="primary"
              onClick={onNavigateEarn}
              className="text-xs sm:text-sm py-2 px-3.5 sm:px-4 justify-center"
            >
              Put to work
              <IconArrowUpRight size={16} stroke={1.75} />
            </Button>
            <Button
              variant="secondary"
              onClick={onNavigateStake}
              className="text-xs sm:text-sm py-2 px-3.5 sm:px-4 justify-center"
            >
              <IconHexagon size={16} stroke={1.75} />
              Stake NIM
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 pt-2 sm:pt-3">
          <div className="space-y-0.5 sm:space-y-1">
            <div className="text-xs text-zinc-400 dark:text-zinc-500 font-normal">Estimated monthly return</div>
            <div className="text-lg sm:text-xl font-normal text-black dark:text-white">
              {currencyService.formatUsd(estimatedEarnedUsd)}
            </div>
            <div className="text-[11px] sm:text-xs text-zinc-400 dark:text-zinc-500">Updated with live block rates</div>
          </div>

          <div className="space-y-0.5 sm:space-y-1">
            <div className="text-xs text-zinc-400 dark:text-zinc-500 font-normal">Staked in Nimiq pools</div>
            <div className="text-lg sm:text-xl font-normal text-black dark:text-white">
              {wallet.activeStakeNim.toLocaleString()} NIM
            </div>
            <div className="text-[11px] sm:text-xs text-zinc-400 dark:text-zinc-500">
              {currencyService.formatUsd(stakedNimUsd)} value
            </div>
          </div>

          <div className="space-y-0.5 sm:space-y-1">
            <div className="text-xs text-zinc-400 dark:text-zinc-500 font-normal">USDT in lending markets</div>
            <div className="text-lg sm:text-xl font-normal text-black dark:text-white">
              {wallet.aUsdtBalance.toFixed(2)} USDT
            </div>
            <div className="text-[11px] sm:text-xs text-zinc-400 dark:text-zinc-500">
              {currencyService.formatUsd(usdtDepositedUsd)} on Polygon
            </div>
          </div>
        </div>
      </Card>

      {/* Two Venue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
        <Card className="p-4 sm:p-5 space-y-3.5 sm:space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="p-2 sm:p-2.5 rounded-[12px] bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white shrink-0">
                <IconHexagon size={20} stroke={1.75} />
              </div>
              <div>
                <div className="text-sm sm:text-base font-normal text-black dark:text-white">NIM Proof of Stake</div>
                <div className="text-[11px] sm:text-xs text-zinc-400 dark:text-zinc-500">Native blockchain rewards</div>
              </div>
            </div>
            <div className="text-xs sm:text-sm font-normal text-emerald-600 dark:text-emerald-400 shrink-0">
              {liveNimApy > 0 ? `~${liveNimApy.toFixed(2)}% APY` : 'Live APY'}
            </div>
          </div>

          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal">
            Earn native network rewards by delegating your NIM coins to reliable community validators. Minimum stake is 100 NIM. Your coins never leave your wallet.
          </p>

          <div className="pt-2 flex items-center justify-between">
            <div>
              <div className="text-[11px] sm:text-xs text-zinc-400 dark:text-zinc-500">Available in wallet</div>
              <div className="text-xs sm:text-sm font-normal text-black dark:text-white">
                {wallet.nimBalance.toLocaleString()} NIM
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={onNavigateStake}
              className="py-1.5 px-3 sm:px-3.5 text-xs"
            >
              Choose validator
            </Button>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 space-y-3.5 sm:space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="p-2 sm:p-2.5 rounded-[12px] bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white shrink-0">
                <IconCurrencyDollar size={20} stroke={1.75} />
              </div>
              <div>
                <div className="text-sm sm:text-base font-normal text-black dark:text-white">USDT Dollar Savings</div>
                <div className="text-[11px] sm:text-xs text-zinc-400 dark:text-zinc-500">Audited decentralized lending</div>
              </div>
            </div>
            <div className="text-xs sm:text-sm font-normal text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 px-2 sm:px-2.5 py-1 rounded-[8px] shrink-0">
              {liveAaveApy > 0 ? `~${liveAaveApy.toFixed(2)}% Live APY` : 'Live APY'}
            </div>
          </div>

          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal">
            Supply USDT to time tested lending markets like Aave V3. Tide computes the real net return after network costs so small savers never lose money to gas.
          </p>

          <div className="pt-2 flex items-center justify-between">
            <div>
              <div className="text-[11px] sm:text-xs text-zinc-400 dark:text-zinc-500">Available in wallet</div>
              <div className="text-xs sm:text-sm font-normal text-black dark:text-white">
                {wallet.usdtBalance.toFixed(2)} USDT
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={onNavigateEarn}
              className="py-1.5 px-3 sm:px-3.5 text-xs"
            >
              Compare rates
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
