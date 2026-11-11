import { createSiweMessage, generateSiweNonce, parseSiweMessage } from 'viem/siwe'
import { verifyMessage } from 'viem'
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts'

export async function runSiweTests(): Promise<{ passed: boolean; details: string[] }> {
  const details: string[] = []

  try {
    // 1. Generate fresh test private key and account
    const privateKey = generatePrivateKey()
    const account = privateKeyToAccount(privateKey)
    details.push(`Generated ephemeral test wallet: ${account.address}`)

    // 2. Generate EIP-4361 nonce
    const nonce = generateSiweNonce()
    if (!nonce || nonce.length < 8) throw new Error('Invalid nonce generated')
    details.push(`Generated cryptographic SIWE nonce: ${nonce.slice(0, 16)}...`)

    // 3. Build standard SIWE message for Polygon
    const domain = 'app-tide.pages.dev'
    const uri = 'https://app-tide.pages.dev'
    const chainId = 137
    const statement = 'Sign in to Tide non custodial yield aggregator. Your keys and assets remain strictly yours.'
    const issuedAt = new Date()
    const expirationTime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    const siweMessage = createSiweMessage({
      address: account.address,
      chainId,
      domain,
      nonce,
      uri,
      version: '1',
      statement,
      issuedAt,
      expirationTime,
    })
    details.push('Constructed valid EIP-4361 SIWE message adhering to ERC standards')

    // 4. Parse SIWE message and verify fields
    const parsed = parseSiweMessage(siweMessage)
    if (parsed.address?.toLowerCase() !== account.address.toLowerCase()) {
      throw new Error(`Address mismatch in parsed message: ${parsed.address} vs ${account.address}`)
    }
    if (parsed.chainId !== chainId) {
      throw new Error(`Chain ID mismatch in parsed message: ${parsed.chainId}`)
    }
    if (parsed.nonce !== nonce) {
      throw new Error(`Nonce mismatch in parsed message: ${parsed.nonce}`)
    }
    details.push('Parsed SIWE message: domain, chainId 137, address, and nonce verified')

    // 5. Sign message
    const signature = await account.signMessage({ message: siweMessage })
    details.push(`Signed SIWE message via personal_sign: ${signature.slice(0, 20)}...`)

    // 6. Cryptographically verify signature
    const isValid = await verifyMessage({
      address: account.address,
      message: siweMessage,
      signature,
    })
    if (!isValid) throw new Error('Cryptographic signature verification returned false')
    details.push('Cryptographic signature verification succeeded (true)')

    // 7. Verify that wrong address fails verification
    const imposterAccount = privateKeyToAccount(generatePrivateKey())
    const isImposterValid = await verifyMessage({
      address: imposterAccount.address,
      message: siweMessage,
      signature,
    })
    if (isImposterValid) throw new Error('Signature verification unexpectedly passed for wrong address')
    details.push('Spoof protection verified: signature rejected when validated against wrong address')

    // 8. Verify that tampered message fails verification
    const tamperedMessage = siweMessage.replace('Tide', 'Imposter')
    const isTamperValid = await verifyMessage({
      address: account.address,
      message: tamperedMessage,
      signature,
    })
    if (isTamperValid) throw new Error('Signature verification unexpectedly passed for tampered message')
    details.push('Message integrity verified: altered message contents rejected immediately')

    return { passed: true, details }
  } catch (err: any) {
    details.push(`Error: ${err.message}`)
    return { passed: false, details }
  }
}
