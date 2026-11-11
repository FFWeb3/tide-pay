import { YieldVenue } from '../types'

export interface RoutingParameters {
  amountUsd: number
  durationYears: number
  venues: YieldVenue[]
}

export interface RankedVenueResult {
  venue: YieldVenue
  grossApy: number
  netApy: number
  grossYearlyReturnUsd: number
  netYearlyReturnUsd: number
  totalCostsUsd: number
  recommended: boolean
  recommendationReason: string
}

export function calculateNetApy(
  grossApy: number,
  amountUsd: number,
  durationYears: number,
  totalCostsUsd: number
): number {
  if (amountUsd <= 0 || durationYears <= 0) {
    return grossApy
  }
  const costImpactApy = (totalCostsUsd / (amountUsd * durationYears)) * 100
  const net = grossApy - costImpactApy
  return Math.max(-100, Number(net.toFixed(2)))
}

export function rankVenues(params: RoutingParameters): RankedVenueResult[] {
  const { amountUsd, durationYears, venues } = params

  const evaluated = venues.map((venue) => {
    const totalCostsUsd = venue.entryFeeUsd + venue.exitFeeUsd
    const grossApy = venue.headlineApy
    const netApy = calculateNetApy(grossApy, amountUsd, durationYears, totalCostsUsd)
    const grossYearlyReturnUsd = Number(((amountUsd * grossApy) / 100).toFixed(2))
    const netYearlyReturnUsd = Number(((amountUsd * netApy) / 100).toFixed(2))

    return {
      venue,
      grossApy,
      netApy,
      grossYearlyReturnUsd,
      netYearlyReturnUsd,
      totalCostsUsd,
      recommended: false,
      recommendationReason: '',
    }
  })

  // Sort descending by net APY
  evaluated.sort((a, b) => b.netApy - a.netApy)

  // Find the top Polygon venue as the benchmark home chain venue
  const homeBenchmark = evaluated.find((item) => item.venue.chain.toLowerCase().includes('polygon'))

  const benchmarkNetApy = homeBenchmark ? homeBenchmark.netApy : 0
  const benchmarkReturnUsd = homeBenchmark ? homeBenchmark.netYearlyReturnUsd : 0

  if (evaluated.length > 0) {
    const topOption = evaluated[0]

    if (!topOption.venue.isCrossChain) {
      topOption.recommended = true
      topOption.recommendationReason = 'Best rate on your current network with lowest network fee'
    } else {
      const marginGain = topOption.netApy - benchmarkNetApy
      const dollarGain = topOption.netYearlyReturnUsd - benchmarkReturnUsd

      if (marginGain >= 1.0 && dollarGain >= 5.0) {
        topOption.recommended = true
        topOption.recommendationReason = 'Cross chain route yields higher net return after bridge and gas fees'
      } else if (homeBenchmark) {
        homeBenchmark.recommended = true
        homeBenchmark.recommendationReason = 'Staying on Polygon earns you more because bridge fees outweigh the rate difference'
      }
    }
  }

  return evaluated
}

