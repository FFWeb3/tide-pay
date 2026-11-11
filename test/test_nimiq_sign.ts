import { seal, unseal, defaults } from 'iron-webcrypto'
import crypto from 'node:crypto'

const TEST_SECRET = 'c4d82b11-0455-4d0a-ad23-1868487e6990'

function createNimiqChallengeMessage(address: string, nonce: string, issuedAt: Date): string {
  const host = 'app-tide.pages.dev'
  return [
    `${host} wants you to sign in with your Nimiq account:`,
    address,
    '',
    'Sign this message to prove ownership of your Nimiq address.',
    'This will not grant Tide access to your funds or trigger any transaction.',
    '',
    `URI: https://${host}`,
    'Version: 1',
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt.toISOString()}`,
  ].join('\n')
}

export async function runNimiqSignTests(): Promise<{ passed: boolean; details: string[] }> {
  const details: string[] = []

  try {
    // 1. Challenge Message Construction
    const testAddress = 'NQ42 1234 ABCD 5678 EFGH 9012 IJKL 3456 MNOP'
    const testNonce = crypto.randomBytes(16).toString('hex')
    const testIssuedAt = new Date('2026-11-10T20:00:00.000Z')

    const challenge = createNimiqChallengeMessage(testAddress, testNonce, testIssuedAt)
    if (!challenge.includes(testAddress)) {
      throw new Error('Challenge message does not include target address')
    }
    if (!challenge.includes(`Nonce: ${testNonce}`)) {
      throw new Error('Challenge message does not include nonce')
    }
    if (!challenge.includes('Version: 1')) {
      throw new Error('Challenge message missing version')
    }
    details.push(`Constructed valid Nimiq Hub challenge message with address & nonce: ${testNonce.slice(0, 12)}...`)

    // 2. Generate Real Ed25519 Keypair & Sign Challenge
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519')
    const rawPublicKey = publicKey.export({ type: 'spki', format: 'der' }).subarray(-32)
    const messageBuffer = Buffer.from(challenge, 'utf-8')
    const signature = crypto.sign(null, messageBuffer, privateKey)

    if (signature.length !== 64) {
      throw new Error(`Unexpected Ed25519 signature length: ${signature.length}`)
    }
    if (rawPublicKey.length !== 32) {
      throw new Error(`Unexpected Ed25519 public key length: ${rawPublicKey.length}`)
    }
    details.push(`Generated real 32-byte Ed25519 public key & 64-byte signature`)

    // 3. Cryptographic Signature Verification
    const isSignatureValid = crypto.verify(null, messageBuffer, publicKey, signature)
    if (!isSignatureValid) {
      throw new Error('Ed25519 signature verification unexpectedly failed')
    }
    details.push('Cryptographic Ed25519 signature verified successfully')

    // 4. Spoof / Tamper Rejection Test
    const tamperedMessage = Buffer.from(challenge.replace(testNonce, 'tampered_nonce'), 'utf-8')
    const isTamperValid = crypto.verify(null, tamperedMessage, publicKey, signature)
    if (isTamperValid) {
      throw new Error('Ed25519 verification unexpectedly accepted tampered message')
    }
    details.push('Tamper protection verified: modified challenge payload rejected')

    // 5. Iron Session Sealing of Nimiq Authenticated Payload
    const signatureHex = signature.toString('hex')
    const pubKeyHex = rawPublicKey.toString('hex')
    const sessionPayload = {
      address: testAddress,
      addressNim: testAddress,
      chain: 'nimiq' as const,
      nonce: testNonce,
      issuedAt: testIssuedAt.getTime(),
      expiresAt: testIssuedAt.getTime() + 7 * 24 * 60 * 60 * 1000,
      signature: signatureHex,
      publicKey: pubKeyHex,
      statement: challenge,
    }

    const sealedToken = await seal(sessionPayload, TEST_SECRET, defaults)
    if (!sealedToken.startsWith('Fe26.2**')) {
      throw new Error(`Invalid Iron sealed token format: ${sealedToken}`)
    }
    details.push(`Encrypted Nimiq Hub session payload via iron-webcrypto: ${sealedToken.slice(0, 32)}...`)

    // 6. Unseal & Validate Fidelity
    const restored = await unseal(sealedToken, TEST_SECRET, defaults)
    const payload = restored as typeof sessionPayload
    if (payload.address !== testAddress || payload.signature !== signatureHex || payload.publicKey !== pubKeyHex) {
      throw new Error('Restored session payload mismatch')
    }
    details.push('Session unsealed and verified with 100% cryptographic fidelity')

    return { passed: true, details }
  } catch (err: any) {
    details.push(`Nimiq Hub sign test error: ${err.message}`)
    return { passed: false, details }
  }
}

// Standalone execution
if (import.meta.url === `file://${process.argv[1]}`) {
  runNimiqSignTests().then((res) => {
    console.log(res.passed ? 'PASSED' : 'FAILED')
    console.log(res.details.join('\n'))
    process.exit(res.passed ? 0 : 1)
  })
}
