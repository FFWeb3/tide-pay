import { FiatCurrency } from '../types'
import { INITIAL_CURRENCIES } from '../constants/addresses'

export interface CryptoPrices {
  nimUsd: number
  polUsd: number
  usdtUsd: number
}

class CurrencyService {
  private currentCurrency: FiatCurrency = 'USD'
  private rates: Record<string, { rateAgainstUsd: number; prefix: string; symbol: string }> = {
    ...INITIAL_CURRENCIES,
  }
  private cryptoPrices: CryptoPrices = {
    nimUsd: 0.0002556,
    polUsd: 0.126,
    usdtUsd: 1.0,
  }
  private listeners: Array<(currency: FiatCurrency) => void> = []

  constructor() {
    this.refreshLivePrices()
  }

  public async refreshLivePrices() {
    try {
      const [fxRes, cryptoRes] = await Promise.allSettled([
        fetch('https://open.er-api.com/v6/latest/USD').then((r) => r.json()),
        fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=nimiq-2,matic-network,tether&vs_currencies=usd'
        ).then((r) => r.json()),
      ])

      if (fxRes.status === 'fulfilled' && fxRes.value?.rates) {
        const r = fxRes.value.rates
        if (typeof r.EUR === 'number') this.rates.EUR.rateAgainstUsd = r.EUR
        if (typeof r.NGN === 'number') this.rates.NGN.rateAgainstUsd = r.NGN
        if (typeof r.KES === 'number') this.rates.KES.rateAgainstUsd = r.KES
      }

      if (cryptoRes.status === 'fulfilled' && cryptoRes.value) {
        const c = cryptoRes.value
        if (c['nimiq-2']?.usd) this.cryptoPrices.nimUsd = c['nimiq-2'].usd
        if (c['matic-network']?.usd) this.cryptoPrices.polUsd = c['matic-network'].usd
        if (c.tether?.usd) this.cryptoPrices.usdtUsd = c.tether.usd
      }

      this.notify()
    } catch (err) {
      console.warn('Currency service could not refresh live rates:', err)
    }
  }

  public getPrices(): CryptoPrices {
    return { ...this.cryptoPrices }
  }

  public getNimPriceUsd(): number {
    return this.cryptoPrices.nimUsd
  }

  public getPolPriceUsd(): number {
    return this.cryptoPrices.polUsd
  }

  public getCurrency(): FiatCurrency {
    return this.currentCurrency
  }

  public setCurrency(currency: FiatCurrency) {
    this.currentCurrency = currency
    this.notify()
  }

  public subscribe(listener: (currency: FiatCurrency) => void): () => void {
    this.listeners.push(listener)
    listener(this.currentCurrency)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  private notify() {
    this.listeners.forEach((l) => l(this.currentCurrency))
  }

  public formatUsd(usdValue: number): string {
    const config = this.rates[this.currentCurrency] ?? this.rates.USD
    const converted = usdValue * config.rateAgainstUsd

    if (this.currentCurrency === 'NGN') {
      return `${config.prefix}${converted.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })}`
    }
    return `${config.prefix}${converted.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  public formatNim(nimValue: number): string {
    const nimFormatted = `${nimValue.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })} NIM`
    const usdEquivalent = nimValue * this.cryptoPrices.nimUsd
    const fiatFormatted = this.formatUsd(usdEquivalent)
    return `${nimFormatted} (~${fiatFormatted})`
  }
}

export const currencyService = new CurrencyService()
