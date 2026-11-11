export type SupportedAsset = 'USDT' | 'NIM'

export type FiatCurrency = 'USD' | 'NGN' | 'EUR' | 'KES'

export type RiskTier = 'Tier A' | 'Tier B' | 'Tier C'

export interface YieldVenue {
  id: string
  name: string
  protocol: string
  asset: SupportedAsset
  chain: string
  headlineApy: number
  netApy: number
  grossYearlyReturn: number
  netYearlyReturn: number
  entryFeeUsd: number
  exitFeeUsd: number
  tvlUsd: number
  utilizationRate: number
  riskTier: RiskTier
  riskSummary: string
  contractAddress: string
  isCrossChain: boolean
}

export interface NimiqValidatorPool {
  id: string
  name: string
  address: string
  feePercent: number
  reliabilityPercent: number
  totalStakeNim: number
  rewardRatePercent: number
  minimumStakeNim: number
  activeStakersCount: number
}

export interface UserPosition {
  id: string
  venueId: string
  venueName: string
  asset: SupportedAsset
  chain: string
  principalAmount: number
  earnedAmount: number
  currentApy: number
  depositTimestamp: number
}

export interface CurrencyRate {
  symbol: string
  rateAgainstUsd: number
  prefix: string
}

