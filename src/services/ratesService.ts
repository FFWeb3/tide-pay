import { YieldVenue, NimiqValidatorPool } from '../types'
import { CONTRACT_ADDRESSES } from '../constants/addresses'
import { createPublicClient, http } from 'viem'
import { polygon, arbitrum, optimism } from 'viem/chains'

const AAVE_POOL_ABI = [
  {
    inputs: [{ name: 'asset', type: 'address' }],
    name: 'getReserveData',
    outputs: [
      {
        components: [
          { name: 'configuration', type: 'uint256' },
          { name: 'liquidityIndex', type: 'uint128' },
          { name: 'currentLiquidityRate', type: 'uint128' },
          { name: 'variableBorrowIndex', type: 'uint128' },
          { name: 'currentVariableBorrowRate', type: 'uint128' },
          { name: 'currentStableBorrowRate', type: 'uint128' },
          { name: 'lastUpdateTimestamp', type: 'uint40' },
          { name: 'id', type: 'uint16' },
          { name: 'aTokenAddress', type: 'address' },
          { name: 'stableDebtTokenAddress', type: 'address' },
          { name: 'variableDebtTokenAddress', type: 'address' },
          { name: 'interestRateStrategyAddress', type: 'address' },
          { name: 'accruedToTreasury', type: 'uint128' },
          { name: 'unbacked', type: 'uint128' },
          { name: 'isolationModeTotalDebt', type: 'uint128' },
        ],
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const

const ERC20_SUPPLY_ABI = [
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

const POLYGON_RPCS = [
  'https://polygon-bor-rpc.publicnode.com',
  'https://1rpc.io/matic',
  'https://rpc.ankr.com/polygon',
]

const ARBITRUM_RPCS = [
  'https://arbitrum-one-rpc.publicnode.com',
  'https://1rpc.io/arb',
]

const OPTIMISM_RPCS = [
  'https://optimism-rpc.publicnode.com',
  'https://1rpc.io/op',
]

async function readOnChainAaveMarket(params: {
  id: string
  name: string
  chainName: string
  viemChain: typeof polygon | typeof arbitrum | typeof optimism
  rpcUrls: string[]
  poolAddress: string
  usdtAddress: string
  aTokenAddress: string
  isCrossChain: boolean
  bridgeFeeUsd: number
  riskTier: 'Tier A' | 'Tier B'
  riskSummary: string
}): Promise<YieldVenue | null> {
  for (const rpcUrl of params.rpcUrls) {
    try {
      const client = createPublicClient({
        chain: params.viemChain,
        transport: http(rpcUrl, { timeout: 3500 }),
      })

      const [reserve, aTokenSupply, gasPrice] = await Promise.all([
        client.readContract({
          address: params.poolAddress as `0x${string}`,
          abi: AAVE_POOL_ABI,
          functionName: 'getReserveData',
          args: [params.usdtAddress as `0x${string}`],
        }),
        client.readContract({
          address: params.aTokenAddress as `0x${string}`,
          abi: ERC20_SUPPLY_ABI,
          functionName: 'totalSupply',
        }),
        client.getGasPrice().catch(() => BigInt(30_000_000_000)),
      ])

      const liquidityRate = Number(reserve.currentLiquidityRate)
      const headlineApy = Number(((liquidityRate / 1e27) * 100).toFixed(2))
      const tvlUsd = Number((Number(aTokenSupply) / 1e6).toFixed(2))
      const borrowRate = Number(reserve.currentVariableBorrowRate)
      const utilizationRate =
        borrowRate > 0 ? Number(Math.min(99, (liquidityRate / borrowRate) * 100).toFixed(2)) : 0

      // Compute network execution gas fee in USD from live gasPrice (approx 180k gas units for supply)
      const gasCostWei = Number(gasPrice) * 180000
      const nativeGasUsd = params.isCrossChain
        ? (gasCostWei / 1e18) * 2600
        : (gasCostWei / 1e18) * 0.45
      const oneWayFeeUsd = Number(Math.max(0.01, nativeGasUsd + params.bridgeFeeUsd).toFixed(2))
      const netApy = Math.max(0, Number((headlineApy - (oneWayFeeUsd * 2) / 10).toFixed(2)))

      if (headlineApy <= 0 || tvlUsd <= 0) continue

      return {
        id: params.id,
        name: params.name,
        protocol: 'Aave V3',
        asset: 'USDT',
        chain: params.chainName,
        headlineApy,
        netApy,
        grossYearlyReturn: 0,
        netYearlyReturn: 0,
        entryFeeUsd: oneWayFeeUsd,
        exitFeeUsd: oneWayFeeUsd,
        tvlUsd,
        utilizationRate,
        riskTier: params.riskTier,
        riskSummary: params.riskSummary,
        contractAddress: params.poolAddress,
        isCrossChain: params.isCrossChain,
      }
    } catch {
      continue
    }
  }
  return null
}

async function fetchMorphoBaseMarket(): Promise<YieldVenue | null> {
  try {
    const query = `{
      vaultByAddress(
        address: "${CONTRACT_ADDRESSES.BASE.MORPHO_VAULT}",
        chainId: 8453
      ) {
        address
        name
        state {
          apy
          netApy
          totalAssetsUsd
          fee
        }
      }
    }`
    const res = await fetch('https://blue-api.morpho.org/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    })
    if (!res.ok) return null
    const json = await res.json()
    const vault = json?.data?.vaultByAddress
    if (!vault?.state) return null

    const headlineApy = Number(((vault.state.apy || 0) * 100).toFixed(2))
    const netVaultApy = Number(((vault.state.netApy || vault.state.apy || 0) * 100).toFixed(2))
    const tvlUsd = Number((vault.state.totalAssetsUsd || 0).toFixed(2))
    if (headlineApy <= 0 || tvlUsd <= 0) return null

    const entryFeeUsd = 0.35
    const exitFeeUsd = 0.35

    return {
      id: 'morpho_base',
      name: 'Morpho Blue Base',
      protocol: 'Morpho',
      asset: 'USDT',
      chain: 'Base',
      headlineApy,
      netApy: netVaultApy,
      grossYearlyReturn: 0,
      netYearlyReturn: 0,
      entryFeeUsd,
      exitFeeUsd,
      tvlUsd,
      utilizationRate: 84.5,
      riskTier: 'Tier B',
      riskSummary: 'Audited institutional vault on Base with active collateral risk curation',
      contractAddress: CONTRACT_ADDRESSES.BASE.MORPHO_VAULT,
      isCrossChain: true,
    }
  } catch {
    return null
  }
}

export async function fetchOnChainAaveRate(): Promise<number | null> {
  for (const rpcUrl of POLYGON_RPCS) {
    try {
      const client = createPublicClient({
        chain: polygon,
        transport: http(rpcUrl, { timeout: 4000 }),
      })
      const data = await client.readContract({
        address: CONTRACT_ADDRESSES.POLYGON.AAVE_V3_POOL as `0x${string}`,
        abi: AAVE_POOL_ABI,
        functionName: 'getReserveData',
        args: [CONTRACT_ADDRESSES.POLYGON.USDT as `0x${string}`],
      })
      const liquidityRate = Number(data.currentLiquidityRate)
      const apy = (liquidityRate / 1e27) * 100
      if (apy > 0 && apy < 100) {
        return Number(apy.toFixed(2))
      }
    } catch {
      continue
    }
  }
  return null
}

export async function fetchLiveRates(): Promise<YieldVenue[]> {
  const results = await Promise.allSettled([
    readOnChainAaveMarket({
      id: 'aave_v3_polygon',
      name: 'Aave V3 Polygon',
      chainName: 'Polygon',
      viemChain: polygon,
      rpcUrls: POLYGON_RPCS,
      poolAddress: CONTRACT_ADDRESSES.POLYGON.AAVE_V3_POOL,
      usdtAddress: CONTRACT_ADDRESSES.POLYGON.USDT,
      aTokenAddress: CONTRACT_ADDRESSES.POLYGON.A_USDT_TOKEN,
      isCrossChain: false,
      bridgeFeeUsd: 0,
      riskTier: 'Tier A',
      riskSummary: 'Primary Polygon USDT lending pool with direct on chain withdrawals',
    }),
    readOnChainAaveMarket({
      id: 'aave_v3_arbitrum',
      name: 'Aave V3 Arbitrum',
      chainName: 'Arbitrum',
      viemChain: arbitrum,
      rpcUrls: ARBITRUM_RPCS,
      poolAddress: CONTRACT_ADDRESSES.ARBITRUM.AAVE_V3_POOL,
      usdtAddress: CONTRACT_ADDRESSES.ARBITRUM.USDT,
      aTokenAddress: CONTRACT_ADDRESSES.ARBITRUM.A_USDT_TOKEN,
      isCrossChain: true,
      bridgeFeeUsd: 0.42,
      riskTier: 'Tier A',
      riskSummary: 'High liquidity Arbitrum USDT reserve with active borrowing demand',
    }),
    readOnChainAaveMarket({
      id: 'aave_v3_optimism',
      name: 'Aave V3 Optimism',
      chainName: 'Optimism',
      viemChain: optimism,
      rpcUrls: OPTIMISM_RPCS,
      poolAddress: CONTRACT_ADDRESSES.OPTIMISM.AAVE_V3_POOL,
      usdtAddress: CONTRACT_ADDRESSES.OPTIMISM.USDT,
      aTokenAddress: CONTRACT_ADDRESSES.OPTIMISM.A_USDT_TOKEN,
      isCrossChain: true,
      bridgeFeeUsd: 0.38,
      riskTier: 'Tier A',
      riskSummary: 'Audited Optimism USDT lending market with steady utilization',
    }),
    fetchMorphoBaseMarket(),
  ])

  const liveVenues: YieldVenue[] = []
  for (const res of results) {
    if (res.status === 'fulfilled' && res.value !== null) {
      liveVenues.push(res.value)
    }
  }

  return liveVenues
}

export async function fetchLiveValidatorPools(): Promise<NimiqValidatorPool[]> {
  try {
    const res = await fetch('https://validators-api-main.je-cf9.workers.dev/api/v1/validators', {
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) {
      throw new Error(`Validator API returned HTTP ${res.status}`)
    }
    const rawList = await res.json()
    if (!Array.isArray(rawList) || rawList.length === 0) {
      throw new Error('Invalid validator API response')
    }

    const validEntries = rawList.filter(
      (v: { address?: string; balance?: number }) =>
        typeof v.address === 'string' && v.address.trim().length > 0 && (v.balance ?? 0) > 0
    )

    const totalNetworkNim = validEntries.reduce(
      (sum: number, v: { balance?: number }) => sum + Math.round((v.balance ?? 0) / 100000),
      0
    )

    // Nimiq Albatross PoS protocol reward emission relative to live active staked supply (~13.2B circulating NIM)
    const stakingRatio = totalNetworkNim > 0 ? Math.min(0.85, Math.max(0.15, totalNetworkNim / 13_200_000_000)) : 0.42
    const protocolGrossYield = 3.6 / stakingRatio

    return validEntries.map(
      (v: {
        id: number | string
        name?: string
        address: string
        fee?: number
        score?: { reliability?: number; total?: number }
        balance?: number
        stakers?: number
      }) => {
        const rawFee = typeof v.fee === 'number' && v.fee >= 0 ? v.fee : 0
        const feePercent = Math.round(rawFee * 100 * 10) / 10
        const reliability =
          v.score && typeof v.score.reliability === 'number'
            ? Number((v.score.reliability * 100).toFixed(1))
            : v.score && typeof v.score.total === 'number'
            ? Number((v.score.total * 100).toFixed(1))
            : 100
        const totalStakeNim = Math.round((v.balance ?? 0) / 100000)
        const reliabilityFactor = reliability / 100
        const rewardRatePercent = Number(
          (protocolGrossYield * (1 - Math.min(0.5, rawFee)) * reliabilityFactor).toFixed(2)
        )

        return {
          id: `pool_${v.id}`,
          name: v.name?.trim() ? v.name.trim() : v.address,
          address: v.address,
          feePercent,
          reliabilityPercent: Math.min(100, reliability),
          totalStakeNim,
          rewardRatePercent,
          minimumStakeNim: 100,
          activeStakersCount: v.stakers ?? 0,
        }
      }
    )
  } catch (error) {
    console.warn('Failed to fetch live validator pools from API', error)
    return []
  }
}
