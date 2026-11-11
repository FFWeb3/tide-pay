import { rankVenues, calculateNetApy } from '../src/services/routingEngine'
import { fetchLiveRates } from '../src/services/ratesService'

export async function runRoutingEngineTests(): Promise<{ passed: boolean; details: string[] }> {
  const details: string[] = []

  try {
    const liveVenues = await fetchLiveRates()
    if (liveVenues.length === 0) {
      throw new Error('fetchLiveRates returned 0 live venues')
    }
    details.push(`Fetched ${liveVenues.length} live on-chain yield venues (${liveVenues.map((v) => `${v.name}: ${v.headlineApy}% APY, $${v.tvlUsd.toLocaleString()} TVL`).join(' | ')})`)

    // 1. Test calculation of net return
    const aavePolygon = liveVenues.find((v) => v.id === 'aave_v3_polygon')!
    if (!aavePolygon) {
      throw new Error('Live Aave V3 Polygon venue missing from on-chain query')
    }
    const totalCostsUsd = aavePolygon.entryFeeUsd + aavePolygon.exitFeeUsd
    const netApy = calculateNetApy(aavePolygon.headlineApy, 1000, 1, totalCostsUsd)

    if (netApy <= 0 || netApy > aavePolygon.headlineApy) {
      throw new Error(`Unexpected net APY: ${netApy}`)
    }
    details.push(`Net APY calculation for $1,000 / 1 yr on Aave Polygon: Headline=${aavePolygon.headlineApy}%, Net=${netApy}%, Costs=$${totalCostsUsd.toFixed(2)}`)

    // 2. Small saver scenario ($50 for 1 month)
    // Cross chain fees must severely penalize Arbitrum/Base/Optimism, ranking Polygon #1
    const smallSaverResults = rankVenues({
      amountUsd: 50,
      durationYears: 1 / 12,
      venues: liveVenues,
    })

    const recommendedSmall = smallSaverResults.find((r) => r.recommended) || smallSaverResults[0]
    if (recommendedSmall.venue.chain !== 'Polygon') {
      throw new Error(`Small saver should be recommended low cost home chain Polygon, but was recommended ${recommendedSmall.venue.chain}`)
    }
    details.push(`Small Saver Protection ($50, 1mo): Recommended route is ${recommendedSmall.venue.name} on ${recommendedSmall.venue.chain} (${recommendedSmall.recommendationReason})`)

    // 3. Medium saver scenario ($1,000 for 1 year)
    const mediumSaverResults = rankVenues({
      amountUsd: 1000,
      durationYears: 1,
      venues: liveVenues,
    })
    details.push(`Medium Saver ($1,000, 1yr): Top venue is ${mediumSaverResults[0].venue.name} with Net APY ${mediumSaverResults[0].netApy}%`)

    // 4. Large capital scenario ($50,000 for 1 year)
    const largeCapitalResults = rankVenues({
      amountUsd: 50000,
      durationYears: 1,
      venues: liveVenues,
    })
    details.push(`Large Capital ($50,000, 1yr): Top venue is ${largeCapitalResults[0].venue.name} with Net Return $${largeCapitalResults[0].netYearlyReturnUsd.toFixed(2)}`)

    return { passed: true, details }
  } catch (err: any) {
    details.push(`Error: ${err.message}`)
    return { passed: false, details }
  }
}
