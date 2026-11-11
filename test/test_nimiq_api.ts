export async function runNimiqApiTests(): Promise<{ passed: boolean; details: string[] }> {
  const details: string[] = []

  try {
    // 1. Fetch official Nimiq mainnet validators
    const res = await fetch('https://validators-api-main.je-cf9.workers.dev/api/v1/validators', {
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) throw new Error(`Validator API returned HTTP ${res.status}`)
    const validators = await res.json()

    if (!Array.isArray(validators) || validators.length < 5) {
      throw new Error(`Insufficient validators returned: ${validators?.length}`)
    }
    details.push(`Fetched ${validators.length} active mainnet validator pools from official Nimiq API`)

    // 2. Validate validator schema and top pool metrics
    const sample = validators[0]
    if (!sample.address || !sample.address.startsWith('NQ')) {
      throw new Error(`Invalid validator address format: ${sample.address}`)
    }
    details.push(`Sample validator: ${sample.name || sample.address} (${sample.address})`)

    const totalStakeLuna = sample.balance ?? 0
    const totalStakeNim = Math.round(totalStakeLuna / 100000)
    details.push(`Validator total stake: ${totalStakeNim.toLocaleString()} NIM (${sample.stakers ?? 0} delegators)`)

    const reliability = sample.score?.reliability ? sample.score.reliability * 100 : 100
    details.push(`Validator reliability score: ${reliability.toFixed(1)}%`)

    // 3. Query Nimiq watch API for live account balance
    const testNqAddress = sample.address
    const watchRes = await fetch(`https://api.nimiq.watch/api/v1/account/${encodeURIComponent(testNqAddress)}`)
    if (!watchRes.ok) throw new Error(`Watch API returned HTTP ${watchRes.status}`)
    const accountData = await watchRes.json()

    if (typeof accountData.balance !== 'number') {
      throw new Error(`Invalid balance in watch API response: ${accountData.balance}`)
    }
    const balanceNim = accountData.balance / 100000
    details.push(`Nimiq Watch API returned live account balance: ${balanceNim.toLocaleString()} NIM`)

    return { passed: true, details }
  } catch (err: any) {
    details.push(`Error: ${err.message}`)
    return { passed: false, details }
  }
}

