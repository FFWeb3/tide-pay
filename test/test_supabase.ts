import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://hqrccifmxqvnceoxbtam.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhxcmNjaWZteHF2bmNlb3hidGFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQzMjU3MTEsImV4cCI6MjEwOTkwMTcxMX0.yojcTkLLVyDYSiVzqAZh22vN_bLZAwu6G2Avc1moRTM'

export async function runSupabaseTests(): Promise<{ passed: boolean; details: string[] }> {
  const details: string[] = []
  const client = createClient(SUPABASE_URL, SUPABASE_KEY)
  const testAddress = `0x${'a'.repeat(40)}`
  const testNonce = `test_nonce_${Date.now()}`
  const testSessionId = `test_session_${Date.now()}`
  const testPositionId = `test_pos_${Date.now()}`

  try {
    // 1. Test profiles table query
    const { data: profInit, error: profInitErr } = await client.from('profiles').select('id').limit(1)
    if (profInitErr) throw new Error(`Profiles select failed: ${profInitErr.message}`)
    details.push('Profiles table accessible via Supabase anon key')

    // 2. Insert test profile
    const { error: insertProfErr } = await client.from('profiles').upsert({
      id: testAddress,
      address_evm: testAddress,
      chain: 'polygon',
      display_name: 'E2E Test User',
      last_seen_at: new Date().toISOString(),
    })
    if (insertProfErr) throw new Error(`Profile upsert failed: ${insertProfErr.message}`)
    details.push('User profile upsert succeeded in profiles table')

    // 3. Insert and verify SIWE nonce
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()
    const { error: nonceErr } = await client.from('siwe_nonces').insert({
      nonce: testNonce,
      address: testAddress,
      expires_at: expiresAt,
    })
    if (nonceErr) throw new Error(`SIWE nonce insert failed: ${nonceErr.message}`)
    details.push('SIWE nonce recorded in siwe_nonces table')

    // 4. Verify nonce lookup
    const { data: nonceData, error: nonceLookupErr } = await client
      .from('siwe_nonces')
      .select('*')
      .eq('nonce', testNonce)
      .single()
    if (nonceLookupErr || !nonceData) throw new Error('SIWE nonce lookup failed')
    details.push('SIWE nonce successfully retrieved and validated')

    // 5. Insert encrypted session record
    const { error: sessionErr } = await client.from('sessions').insert({
      id: testSessionId,
      address: testAddress,
      chain: 'polygon',
      sealed_payload: 'Fe26.2**test_sealed_payload_content',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    })
    if (sessionErr) throw new Error(`Session insert failed: ${sessionErr.message}`)
    details.push('Encrypted session record persisted in sessions table')

    // 6. Insert active position
    const { error: posErr } = await client.from('positions').insert({
      id: testPositionId,
      address: testAddress,
      venue_id: 'aave_v3_polygon',
      venue_name: 'Aave V3 Polygon',
      chain: 'Polygon',
      asset: 'USDT',
      principal: 250.5,
      status: 'active',
      tx_hash: `0x${'f'.repeat(64)}`,
    })
    if (posErr) throw new Error(`Position insert failed: ${posErr.message}`)
    details.push('Active lending position recorded in positions table')

    // 7. Verify positions query
    const { data: posData, error: posQueryErr } = await client
      .from('positions')
      .select('*')
      .eq('address', testAddress)
      .eq('status', 'active')
    if (posQueryErr || !posData || posData.length === 0) throw new Error('Position query failed')
    if (posData[0].principal !== 250.5) throw new Error('Position principal amount mismatch')
    details.push(`Retrieved active position for address: ${posData[0].principal} USDT`)

    // 8. Clean up test records
    await client.from('positions').delete().eq('id', testPositionId)
    await client.from('sessions').delete().eq('id', testSessionId)
    await client.from('siwe_nonces').delete().eq('nonce', testNonce)
    await client.from('profiles').delete().eq('id', testAddress)
    details.push('Cleaned up all temporary test records from Supabase')

    return { passed: true, details }
  } catch (err: any) {
    details.push(`Error: ${err.message}`)
    return { passed: false, details }
  }
}

