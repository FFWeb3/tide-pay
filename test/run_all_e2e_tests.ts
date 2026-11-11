import { runSupabaseTests } from './test_supabase'
import { runIronSessionTests } from './test_iron_session'
import { runSiweTests } from './test_siwe'
import { runPolygonOnChainTests } from './test_polygon_onchain'
import { runNimiqApiTests } from './test_nimiq_api'
import { runMarketRatesTests } from './test_market_rates'
import { runRoutingEngineTests } from './test_routing_engine'
import { runNimiqSignTests } from './test_nimiq_sign'
import { runBrowserE2eTests } from './test_browser_e2e'

interface SuiteResult {
  name: string
  passed: boolean
  durationMs: number
  details: string[]
}

async function runSuite(name: string, fn: () => Promise<{ passed: boolean; details: string[] }>): Promise<SuiteResult> {
  const start = Date.now()
  try {
    const res = await fn()
    return {
      name,
      passed: res.passed,
      durationMs: Date.now() - start,
      details: res.details,
    }
  } catch (err: any) {
    return {
      name,
      passed: false,
      durationMs: Date.now() - start,
      details: [`Unhandled exception: ${err.message}`],
    }
  }
}

async function main() {
  console.log('='.repeat(70))
  console.log('TIDE EXHAUSTIVE END TO END INTEGRATION & SYSTEM TEST SUITE')
  console.log('='.repeat(70))
  console.log(`Execution started at: ${new Date().toISOString()}`)
  console.log(`Target Environment: Production (Cloudflare Pages + Supabase + Polygon + Nimiq)\n`)

  const suites: SuiteResult[] = []

  // 1. Supabase Database & RLS
  console.log('Running Suite 1: Remote Supabase Database & Security Policies...')
  suites.push(await runSuite('Supabase Database & Migrations', runSupabaseTests))

  // 2. Iron WebCrypto Session Encryption
  console.log('Running Suite 2: Iron WebCrypto Session Storage & Encryption...')
  suites.push(await runSuite('Iron WebCrypto Encryption', runIronSessionTests))

  // 3. EIP-4361 Sign In with Ethereum
  console.log('Running Suite 3: EIP 4361 Sign In with Ethereum (SIWE)...')
  suites.push(await runSuite('SIWE Cryptographic Authentication', runSiweTests))

  // 4. Polygon Mainnet On-Chain Contracts
  console.log('Running Suite 4: Polygon Mainnet On Chain Contracts & Aave V3...')
  suites.push(await runSuite('Polygon Mainnet & Aave V3 On Chain', runPolygonOnChainTests))

  // 5. Nimiq PoS Validators API
  console.log('Running Suite 5: Nimiq PoS Mainnet Validator Pools & Watch API...')
  suites.push(await runSuite('Nimiq Validator Pools & Watch API', runNimiqApiTests))

  // 6. Live FX & Market Prices
  console.log('Running Suite 6: Live Market Rates & CoinGecko Prices...')
  suites.push(await runSuite('Live Market Rates & Price Feeds', runMarketRatesTests))

  // 7. Routing Engine & Small Saver Protection
  console.log('Running Suite 7: Routing Engine & Fee Optimization...')
  suites.push(await runSuite('Routing Engine & Net Yield Optimization', runRoutingEngineTests))

  // 8. Nimiq Hub Cryptographic Message Signing
  console.log('Running Suite 8: Nimiq Hub Cryptographic Signature Challenge...')
  suites.push(await runSuite('Nimiq Hub Cryptographic Signature Verification', runNimiqSignTests))

  // 9. Headless Browser E2E UI
  console.log('Running Suite 9: Headless Browser UI & Navigation on Live Deployment...')
  suites.push(await runSuite('Headless Chrome Browser UI', runBrowserE2eTests))

  console.log('\n' + '='.repeat(70))
  console.log('TEST EXECUTION SUMMARY')
  console.log('='.repeat(70))

  let totalPassed = 0
  let totalFailed = 0

  for (const s of suites) {
    const status = s.passed ? 'PASSED' : 'FAILED'
    console.log(`\n[${status}] ${s.name} (${s.durationMs}ms)`)
    for (const d of s.details) {
      console.log(`  * ${d}`)
    }
    if (s.passed) totalPassed++
    else totalFailed++
  }

  console.log('\n' + '='.repeat(70))
  console.log(`TOTAL SUITES: ${suites.length} | PASSED: ${totalPassed} | FAILED: ${totalFailed}`)
  console.log('='.repeat(70))

  if (totalFailed > 0) {
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('Fatal test execution failure:', err)
  process.exit(1)
})

