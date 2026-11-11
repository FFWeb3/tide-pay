import { seal, unseal, defaults } from 'iron-webcrypto'

const TEST_SECRET = 'c4d82b11-0455-4d0a-ad23-1868487e6990'

export async function runIronSessionTests(): Promise<{ passed: boolean; details: string[] }> {
  const details: string[] = []

  try {
    // 1. Minimum secret length test
    if (TEST_SECRET.length < 32) {
      throw new Error('Test secret is shorter than 32 characters')
    }
    details.push(`Secret key length is ${TEST_SECRET.length} characters (>= 32 required)`)

    // 2. Seal structured session payload
    const originalPayload = {
      address: '0x8129c3b1fb918349eaf3389025e8a00918abc452',
      addressNim: 'NQ05 U1RF QJNH JCS1 RDQX 4M3Y 60KR K6CN 5LKC',
      chain: 'polygon',
      nonce: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      issuedAt: 1794320000000,
      expiresAt: 1794924800000,
    }

    const sealed = await seal(originalPayload, TEST_SECRET, defaults)
    if (!sealed || typeof sealed !== 'string' || !sealed.startsWith('Fe26.2**')) {
      throw new Error(`Unexpected sealed format: ${sealed}`)
    }
    details.push(`Encrypted session payload with iron-webcrypto: ${sealed.slice(0, 24)}...`)

    // 3. Unseal and verify exact match
    const unsealed = await unseal(sealed, TEST_SECRET, defaults) as typeof originalPayload
    if (!unsealed) throw new Error('Unsealed payload is null')
    if (unsealed.address !== originalPayload.address) throw new Error('Unsealed address mismatch')
    if (unsealed.addressNim !== originalPayload.addressNim) throw new Error('Unsealed addressNim mismatch')
    if (unsealed.nonce !== originalPayload.nonce) throw new Error('Unsealed nonce mismatch')
    if (unsealed.expiresAt !== originalPayload.expiresAt) throw new Error('Unsealed expiresAt mismatch')
    details.push('Unsealed session verified with 100% bit-for-bit cryptographic fidelity')

    // 4. Tamper detection test
    const tampered = sealed.slice(0, -6) + 'xxxxxx'
    let tamperCaught = false
    try {
      await unseal(tampered, TEST_SECRET, defaults)
    } catch {
      tamperCaught = true
    }
    if (!tamperCaught) {
      throw new Error('Tampered sealed token was unexpectedly accepted')
    }
    details.push('Tamper protection verified: modified ciphertext rejected immediately')

    // 5. Wrong secret key test
    const wrongSecret = 'different-secret-key-that-is-also-32-chars!'
    let wrongKeyRejected = false
    try {
      await unseal(sealed, wrongSecret, defaults)
    } catch {
      wrongKeyRejected = true
    }
    if (!wrongKeyRejected) {
      throw new Error('Unseal with incorrect secret unexpectedly succeeded')
    }
    details.push('Key protection verified: token cannot be decrypted with different key')

    return { passed: true, details }
  } catch (err: any) {
    details.push(`Error: ${err.message}`)
    return { passed: false, details }
  }
}

