export async function runMarketRatesTests(): Promise<{ passed: boolean; details: string[] }> {
  const details: string[] = []

  try {
    // 1. Fetch live fiat FX rates
    const fxRes = await fetch('https://open.er-api.com/v6/latest/USD')
    if (!fxRes.ok) throw new Error(`FX API returned HTTP ${fxRes.status}`)
    const fxData = await fxRes.json()

    if (!fxData.rates || typeof fxData.rates.EUR !== 'number' || typeof fxData.rates.NGN !== 'number' || typeof fxData.rates.KES !== 'number') {
      throw new Error('Missing expected fiat currency rates')
    }
    details.push(`Live Fiat FX: 1 USD = ${fxData.rates.EUR.toFixed(4)} EUR`)
    details.push(`Live Fiat FX: 1 USD = ${fxData.rates.NGN.toFixed(2)} NGN`)
    details.push(`Live Fiat FX: 1 USD = ${fxData.rates.KES.toFixed(2)} KES`)

    // 2. Fetch live crypto prices
    const cryptoRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=nimiq-2,matic-network,tether&vs_currencies=usd')
    if (!cryptoRes.ok) throw new Error(`CoinGecko API returned HTTP ${cryptoRes.status}`)
    const cryptoData = await cryptoRes.json()

    const nimUsd = cryptoData['nimiq-2']?.usd
    const polUsd = cryptoData['matic-network']?.usd
    const usdtUsd = cryptoData.tether?.usd

    if (typeof nimUsd !== 'number' || typeof polUsd !== 'number' || typeof usdtUsd !== 'number') {
      throw new Error('Missing crypto price feeds')
    }
    details.push(`Live CoinGecko: 1 NIM = $${nimUsd.toFixed(6)} USD`)
    details.push(`Live CoinGecko: 1 POL = $${polUsd.toFixed(4)} USD`)
    details.push(`Live CoinGecko: 1 USDT = $${usdtUsd.toFixed(4)} USD`)

    return { passed: true, details }
  } catch (err: any) {
    details.push(`Error: ${err.message}`)
    return { passed: false, details }
  }
}

