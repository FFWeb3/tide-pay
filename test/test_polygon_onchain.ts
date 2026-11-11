import { createPublicClient, http, formatUnits, parseAbi } from 'viem'
import { polygon } from 'viem/chains'

const POLYGON_RPC = 'https://polygon-bor-rpc.publicnode.com'
const USDT_ADDRESS = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F'
const A_USDT_ADDRESS = '0x6ab707Aca953eDAeFBc4fD23bA73294241490620'
const AAVE_V3_POOL_ADDRESS = '0x794a61358D6845594F94dc1DB02A252b5b4814aD'

const ERC20_ABI = parseAbi([
  'function balanceOf(address account) external view returns (uint256)',
  'function decimals() external view returns (uint8)',
  'function symbol() external view returns (string)',
  'function totalSupply() external view returns (uint256)',
])

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

export async function runPolygonOnChainTests(): Promise<{ passed: boolean; details: string[] }> {
  const details: string[] = []

  try {
    const client = createPublicClient({
      chain: polygon,
      transport: http(POLYGON_RPC, { timeout: 8000 }),
    })

    // 1. Fetch latest block number
    const blockNumber = await client.getBlockNumber()
    if (!blockNumber || blockNumber < 50000000n) {
      throw new Error(`Unexpected Polygon block height: ${blockNumber}`)
    }
    details.push(`Connected to Polygon Mainnet: Block #${blockNumber.toString()}`)

    // 2. Query USDT ERC-20 contract properties
    const [usdtSymbol, usdtDecimals, usdtSupply] = await Promise.all([
      client.readContract({
        address: USDT_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'symbol',
      }),
      client.readContract({
        address: USDT_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'decimals',
      }),
      client.readContract({
        address: USDT_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'totalSupply',
      }),
    ])

    if (usdtDecimals !== 6) throw new Error(`Expected 6 decimals for USDT, got ${usdtDecimals}`)
    details.push(`Polygon USDT Contract (${USDT_ADDRESS}): Symbol=${usdtSymbol}, Decimals=${usdtDecimals}`)

    // 3. Query aPolUSDT receipt token properties
    const [aUsdtSymbol, aUsdtDecimals] = await Promise.all([
      client.readContract({
        address: A_USDT_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'symbol',
      }),
      client.readContract({
        address: A_USDT_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'decimals',
      }),
    ])
    details.push(`Aave Receipt Token (${A_USDT_ADDRESS}): Symbol=${aUsdtSymbol}, Decimals=${aUsdtDecimals}`)

    // 4. Query Aave V3 Pool Reserve Data
    const reserveData = await client.readContract({
      address: AAVE_V3_POOL_ADDRESS,
      abi: AAVE_POOL_ABI,
      functionName: 'getReserveData',
      args: [USDT_ADDRESS],
    })

    const liquidityRateRay = Number(reserveData.currentLiquidityRate)
    const apyPercent = (liquidityRateRay / 1e27) * 100

    if (apyPercent <= 0 || apyPercent > 50) {
      throw new Error(`Unreasonable on-chain Aave APY: ${apyPercent}%`)
    }
    details.push(`Live on-chain Aave V3 Polygon USDT APY: ${apyPercent.toFixed(2)}% (Ray=${liquidityRateRay})`)

    // 5. Verify aToken address matches configured receipt address
    if (reserveData.aTokenAddress.toLowerCase() !== A_USDT_ADDRESS.toLowerCase()) {
      throw new Error(`Configured aToken address mismatch: ${reserveData.aTokenAddress} vs ${A_USDT_ADDRESS}`)
    }
    details.push('Aave reserve data aTokenAddress matches Tide configuration')

    return { passed: true, details }
  } catch (err: any) {
    details.push(`Error: ${err.message}`)
    return { passed: false, details }
  }
}

