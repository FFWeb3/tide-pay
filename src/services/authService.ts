import { createSiweMessage, generateSiweNonce, parseSiweMessage } from 'viem/siwe'
import { verifyMessage } from 'viem'
import HubApi from '@nimiq/hub-api'
import { init as initNimiqSdk } from '@nimiq/mini-app-sdk'
import { supabase } from './supabaseService'
import { sealData, unsealData, setEncryptedSessionItem, removeSessionItem } from './sessionService'

export interface SessionPayload {
  address: string
  addressNim?: string
  addressEvm?: string
  chain: 'polygon' | 'nimiq' | 'dual'
  nonce: string
  issuedAt: number
  expiresAt: number
  signature?: string
  publicKey?: string
  statement?: string
}

export function createNimiqChallengeMessage(address: string, nonce: string, issuedAt: Date): string {
  const host = typeof window !== 'undefined' ? window.location.host : 'app-tide.pages.dev'
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

export function isNimiqMiniAppEnvironment(): boolean {
  if (typeof window === 'undefined') return false
  const win = window as unknown as { nimiq?: unknown; nimiqPay?: unknown }
  return Boolean(win.nimiq || win.nimiqPay)
}

export function isMobileBrowser(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
}

export interface AuthState {
  isAuthenticated: boolean
  chain: 'polygon' | 'nimiq' | 'dual' | null
  address: string
  addressEvm: string
  addressNim: string
  expiresAt: number | null
  isSyncing: boolean
  error: string | null
}

const SESSION_STORAGE_KEY = 'tide_encrypted_session'
const POLYGON_CHAIN_ID = 137
const POLYGON_CHAIN_HEX = '0x89'
const NIMIQ_HUB_URL = 'https://hub.nimiq.com'

class AuthService {
  private state: AuthState = {
    isAuthenticated: false,
    chain: null,
    address: '',
    addressEvm: '',
    addressNim: '',
    expiresAt: null,
    isSyncing: false,
    error: null,
  }
  private listeners: Array<(state: AuthState) => void> = []
  private hubApiInstance: HubApi | null = null

  constructor() {
    this.restoreSession().catch((err) => {
      console.warn('Failed to restore session on startup:', err)
    })
    this.initHubRedirectHandler()
  }

  private getHubApi(): HubApi {
    if (!this.hubApiInstance) {
      const Ctor = (HubApi as any).default || HubApi
      this.hubApiInstance = new Ctor(NIMIQ_HUB_URL)
    }
    return this.hubApiInstance!
  }

  private initHubRedirectHandler(): void {
    if (typeof window === 'undefined') return
    try {
      const hub = this.getHubApi()
      const reqType = (HubApi as any).RequestType?.SIGN_MESSAGE || 'sign-message'
      hub.on(
        reqType,
        async (signedMessage: any, state: any) => {
          if (!signedMessage || !signedMessage.signature) return
          const nonce = state?.nonce || generateSiweNonce()
          const issuedAt = state?.issuedAt ? new Date(state.issuedAt) : new Date()
          const statement =
            state?.statement || createNimiqChallengeMessage(signedMessage.signer, nonce, issuedAt)
          await this.finalizeNimiqHubSignature(signedMessage, nonce, issuedAt, statement)
        },
        (err: Error) => {
          this.state.isSyncing = false
          this.state.error = err?.message || 'Nimiq sign in was cancelled'
          this.notify()
        }
      )
      hub.checkRedirectResponse().catch(() => {})
    } catch {
      // Ignore in headless/non-browser environments
    }
  }

  public getState(): AuthState {
    return { ...this.state }
  }

  public subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.push(listener)
    listener(this.getState())
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  private notify() {
    this.listeners.forEach((l) => l(this.getState()))
  }

  public async generateNonce(address?: string): Promise<string> {
    const nonce = generateSiweNonce()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()

    if (supabase) {
      try {
        await supabase.from('siwe_nonces').insert({
          nonce,
          address: address?.toLowerCase() ?? null,
          expires_at: expiresAt,
        })
      } catch (err) {
        console.warn('Could not persist nonce to Supabase:', err)
      }
    }
    return nonce
  }

  public async signInWithEthereum(): Promise<{ address: string }> {
    this.state.isSyncing = true
    this.state.error = null
    this.notify()

    try {
      const eth = typeof window !== 'undefined' ? (window as unknown as { ethereum?: any }).ethereum : null
      if (!eth) {
        if (typeof window !== 'undefined' && isMobileBrowser()) {
          const dappUrl = `${window.location.host}${window.location.pathname}`
          window.location.href = `https://metamask.app.link/dapp/${dappUrl}`
          throw new Error('Opening in MetaMask mobile app...')
        }
        throw new Error('No Ethereum wallet detected. Please open in MetaMask, Rabby, or a Web3 browser.')
      }

      // Request accounts
      const accounts: string[] = await eth.request({ method: 'eth_requestAccounts' })
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts selected in wallet')
      }
      const rawAddress = accounts[0]
      const address = rawAddress.toLowerCase()

      // Ensure user is on Polygon Mainnet (chainId 137)
      try {
        await eth.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: POLYGON_CHAIN_HEX }],
        })
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          await eth.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: POLYGON_CHAIN_HEX,
                chainName: 'Polygon Mainnet',
                nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
                rpcUrls: ['https://polygon-bor-rpc.publicnode.com', 'https://1rpc.io/matic'],
                blockExplorerUrls: ['https://polygonscan.com'],
              },
            ],
          })
        }
      }

      // Generate SIWE Nonce
      const nonce = await this.generateNonce(address)
      const domain = typeof window !== 'undefined' ? window.location.host : 'app-tide.pages.dev'
      const uri = typeof window !== 'undefined' ? window.location.origin : 'https://app-tide.pages.dev'

      const issuedAt = new Date().toISOString()
      const expirationDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      const expirationTime = expirationDate.toISOString()

      // Create EIP-4361 SIWE message
      const siweMessage = createSiweMessage({
        address: rawAddress as `0x${string}`,
        chainId: POLYGON_CHAIN_ID,
        domain,
        nonce,
        uri,
        version: '1',
        statement: 'Sign in to Tide non custodial yield aggregator. Your keys and assets remain strictly yours.',
        issuedAt: new Date(issuedAt),
        expirationTime: expirationDate,
      })

      // Request personal sign
      const signature: string = await eth.request({
        method: 'personal_sign',
        params: [siweMessage, rawAddress],
      })

      // Cryptographically verify signature
      const isValid = await verifyMessage({
        address: rawAddress as `0x${string}`,
        message: siweMessage,
        signature: signature as `0x${string}`,
      })

      if (!isValid) {
        throw new Error('SIWE signature verification failed')
      }

      const parsed = parseSiweMessage(siweMessage)
      if (parsed.nonce !== nonce) {
        throw new Error('SIWE nonce mismatch')
      }

      const sessionPayload: SessionPayload = {
        address,
        addressEvm: rawAddress,
        chain: 'polygon',
        nonce,
        issuedAt: Date.now(),
        expiresAt: expirationDate.getTime(),
        signature,
      }

      const sealedToken = await sealData(sessionPayload)

      if (supabase) {
        try {
          await supabase.from('profiles').upsert(
            {
              id: address,
              address_evm: rawAddress,
              chain: 'polygon',
              last_seen_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          )

          await supabase.from('sessions').insert({
            id: `session_${Date.now()}_${nonce.slice(0, 12)}`,
            address,
            chain: 'polygon',
            sealed_payload: sealedToken,
            expires_at: expirationTime,
          })
        } catch (dbErr) {
          console.warn('Supabase session recording error:', dbErr)
        }
      }

      await setEncryptedSessionItem(SESSION_STORAGE_KEY, sessionPayload)

      this.state = {
        isAuthenticated: true,
        chain: 'polygon',
        address,
        addressEvm: rawAddress,
        addressNim: this.state.addressNim,
        expiresAt: sessionPayload.expiresAt,
        isSyncing: false,
        error: null,
      }
      this.notify()

      return { address: rawAddress }
    } catch (err: any) {
      this.state.isSyncing = false
      this.state.error = err.message ?? 'Sign in failed'
      this.notify()
      throw err
    }
  }

  public async signInWithNimiq(inputAddress?: string): Promise<{ address: string }> {
    return this.signInWithNimiqHub({ inputAddress })
  }

  private async finalizeNimiqHubSignature(
    signedMessage: { signer: string; signature: Uint8Array | string; signerPublicKey?: Uint8Array },
    nonce: string,
    issuedAt: Date,
    statement: string
  ): Promise<{ address: string }> {
    const expirationDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    const signerAddress = signedMessage.signer.toUpperCase()

    const signatureHex =
      typeof signedMessage.signature === 'string'
        ? signedMessage.signature
        : Array.from(signedMessage.signature as Uint8Array)
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('')

    let publicKeyHex = ''
    if (signedMessage.signerPublicKey) {
      publicKeyHex = Array.from(signedMessage.signerPublicKey as Uint8Array)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
    }

    const sessionPayload: SessionPayload = {
      address: signerAddress,
      addressNim: signerAddress,
      chain: 'nimiq',
      nonce,
      issuedAt: issuedAt.getTime(),
      expiresAt: expirationDate.getTime(),
      signature: signatureHex,
      publicKey: publicKeyHex || undefined,
      statement,
    }

    const sealedToken = await sealData(sessionPayload)

    if (supabase) {
      try {
        await supabase.from('profiles').upsert(
          {
            id: signerAddress,
            address_nim: signerAddress,
            chain: 'nimiq',
            last_seen_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        )

        await supabase.from('sessions').insert({
          id: `session_nim_${Date.now()}_${nonce.slice(0, 12)}`,
          address: signerAddress,
          chain: 'nimiq',
          sealed_payload: sealedToken,
          expires_at: expirationDate.toISOString(),
        })
      } catch (dbErr) {
        console.warn('Supabase Nimiq session recording error:', dbErr)
      }
    }

    await setEncryptedSessionItem(SESSION_STORAGE_KEY, sessionPayload)

    this.state = {
      isAuthenticated: true,
      chain: 'nimiq',
      address: signerAddress,
      addressEvm: this.state.addressEvm,
      addressNim: signerAddress,
      expiresAt: sessionPayload.expiresAt,
      isSyncing: false,
      error: null,
    }
    this.notify()

    return { address: signerAddress }
  }

  public async signInWithNimiqHub(options?: {
    inputAddress?: string
    useRedirect?: boolean
  }): Promise<{ address: string }> {
    this.state.isSyncing = true
    this.state.error = null
    this.notify()

    try {
      const nonce = generateSiweNonce()
      const issuedAt = new Date()

      // 1. If running inside Nimiq Pay mobile mini app (window.nimiq or window.nimiqPay injected)
      if (isNimiqMiniAppEnvironment()) {
        const provider = await initNimiqSdk({ timeout: 4000 })
        const accounts = await provider.listAccounts()
        const rawAddress = options?.inputAddress?.trim() || (accounts && accounts[0]) || ''
        if (!rawAddress) {
          throw new Error('No Nimiq account available in Nimiq Pay')
        }
        const signerAddress = rawAddress.toUpperCase()
        const statement = createNimiqChallengeMessage(signerAddress, nonce, issuedAt)

        const signResult = await provider.sign(statement)
        if ('error' in signResult || !signResult.signature) {
          throw new Error('Nimiq Pay sign request was rejected')
        }

        return await this.finalizeNimiqHubSignature(
          {
            signer: signerAddress,
            signature: signResult.signature,
          },
          nonce,
          issuedAt,
          statement
        )
      }

      // 2. Standard Web Browser (PC or Mobile Web): Official Nimiq Hub API
      // Note: No async await occurs before hub.signMessage() so the browser user gesture is preserved for popups!
      const hub = this.getHubApi()
      const targetSigner = options?.inputAddress?.trim() || undefined
      const statement = createNimiqChallengeMessage(targetSigner || 'Nimiq Account', nonce, issuedAt)

      const RedirectBehaviorCtor = (HubApi as any).RedirectRequestBehavior
      if (options?.useRedirect && RedirectBehaviorCtor && typeof window !== 'undefined') {
        const redirectBehavior = new RedirectBehaviorCtor(window.location.href, {
          nonce,
          issuedAt: issuedAt.toISOString(),
          statement,
        })
        await hub.signMessage(
          {
            appName: 'Tide',
            message: statement,
            signer: targetSigner,
          },
          redirectBehavior
        )
        return { address: '' }
      }

      const signedMessage = await hub.signMessage({
        appName: 'Tide',
        message: statement,
        signer: targetSigner,
      })

      if (!signedMessage || !signedMessage.signature) {
        throw new Error('Nimiq Hub signature challenge was not completed')
      }

      return await this.finalizeNimiqHubSignature(signedMessage as any, nonce, issuedAt, statement)
    } catch (err: any) {
      this.state.isSyncing = false
      const message = err instanceof Error ? err.message : 'Nimiq sign in failed'
      this.state.error = message
      this.notify()
      throw new Error(message)
    }
  }

  public async restoreSession(): Promise<boolean> {
    try {
      const stored = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(SESSION_STORAGE_KEY) : null
      if (!stored) return false

      const payload = await unsealData<SessionPayload>(stored)
      if (!payload || !payload.address) {
        removeSessionItem(SESSION_STORAGE_KEY)
        return false
      }

      if (payload.expiresAt && Date.now() > payload.expiresAt) {
        removeSessionItem(SESSION_STORAGE_KEY)
        return false
      }

      this.state = {
        isAuthenticated: true,
        chain: payload.chain,
        address: payload.address,
        addressEvm: payload.addressEvm ?? (payload.chain === 'polygon' ? payload.address : ''),
        addressNim: payload.addressNim ?? (payload.chain === 'nimiq' ? payload.address : ''),
        expiresAt: payload.expiresAt,
        isSyncing: false,
        error: null,
      }
      this.notify()

      if (supabase) {
        Promise.resolve(
          supabase
            .from('profiles')
            .update({ last_seen_at: new Date().toISOString() })
            .eq('id', payload.address)
        ).catch(() => {})
      }

      return true
    } catch (err) {
      console.warn('Could not restore session:', err)
      return false
    }
  }

  public async signOut(): Promise<void> {
    const address = this.state.address
    if (supabase && address) {
      try {
        await supabase.from('sessions').delete().eq('address', address)
      } catch (err) {
        console.warn('Failed to delete remote session on logout:', err)
      }
    }

    removeSessionItem(SESSION_STORAGE_KEY)
    this.state = {
      isAuthenticated: false,
      chain: null,
      address: '',
      addressEvm: '',
      addressNim: '',
      expiresAt: null,
      isSyncing: false,
      error: null,
    }
    this.notify()
  }
}

export const authService = new AuthService()
