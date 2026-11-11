import { createPublicClient, createWalletClient, custom, http, formatUnits, parseUnits, parseAbi } from 'viem'
import { polygon } from 'viem/chains'
import { init as initNimiqSdk } from '@nimiq/mini-app-sdk'
import { authService, AuthState, isNimiqMiniAppEnvironment } from './authService'
import { supabase } from './supabaseService'
import { CONTRACT_ADDRESSES } from '../constants/addresses'

export interface WalletState {
  isConnected: boolean
  isMiniApp: boolean
  isSimulated: boolean
  nimAddress: string
  evmAddress: string
  nimBalance: number
  usdtBalance: number
  polBalance: number
  activeStakeNim: number
  stakedPoolAddress?: string
  aUsdtBalance: number
  isLoadingBalances: boolean
  sessionExpiresAt?: number | null
}

export interface LiveDbPosition {
  id: string
  address: string
  venue_id: string
  venue_name: string
  chain: string
  asset: string
  principal: number
  status: string
  tx_hash?: string
  created_at: string
}

const POLYGON_RPCS = [
  'https://polygon-bor-rpc.publicnode.com',
  'https://1rpc.io/matic',
  'https://rpc.ankr.com/polygon',
]

const ERC20_ABI = parseAbi([
  'function balanceOf(address account) external view returns (uint256)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function approve(address spender, uint256 amount) external returns (bool)',
])

const AAVE_POOL_ABI = parseAbi([
  'function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external',
  'function withdraw(address asset, uint256 amount, address to) external returns (uint256)',
])

export function formatShortAddress(address: string): string {
  if (!address) return ''
  const trimmed = address.replace(/\s+/g, '')
  if (trimmed.startsWith('0x')) {
    return `${trimmed.slice(0, 6)}...${trimmed.slice(-4)}`
  }
  return `${trimmed.slice(0, 4)}...${trimmed.slice(-4)}`
}

class WalletService {
  private state: WalletState = {
    isConnected: false,
    isMiniApp: false,
    isSimulated: false,
    nimAddress: '',
    evmAddress: '',
    nimBalance: 0,
    usdtBalance: 0,
    polBalance: 0,
    activeStakeNim: 0,
    stakedPoolAddress: undefined,
    aUsdtBalance: 0,
    isLoadingBalances: false,
    sessionExpiresAt: null,
  }
  private listeners: Array<(state: WalletState) => void> = []
  private dbPositions: LiveDbPosition[] = []

  constructor() {
    // Listen to authentication changes
    authService.subscribe((authState) => {
      this.handleAuthStateChange(authState)
    })

    // Check for Nimiq Pay mini app environment
    this.detectNimiqPay()
  }

  private async detectNimiqPay() {
    try {
      if (isNimiqMiniAppEnvironment()) {
        this.state.isMiniApp = true
        const provider = await initNimiqSdk({ timeout: 2500 })
        const accounts = await provider.listAccounts()
        if (accounts.length > 0 && !authService.getState().isAuthenticated) {
          await authService.signInWithNimiq(accounts[0])
        }
      }
    } catch (e) {
      console.info('Not in Nimiq Pay mini app environment', e)
    }
  }

  private async handleAuthStateChange(authState: AuthState) {
    this.state.isConnected = authState.isAuthenticated
    this.state.sessionExpiresAt = authState.expiresAt

    if (authState.isAuthenticated) {
      if (authState.addressEvm) {
        this.state.evmAddress = authState.addressEvm
      } else if (authState.chain === 'polygon') {
        this.state.evmAddress = authState.address
      }

      if (authState.addressNim) {
        this.state.nimAddress = authState.addressNim
      } else if (authState.chain === 'nimiq') {
        this.state.nimAddress = authState.address
      }

      this.notify()
      await this.refreshLiveBalances()
      await this.fetchUserPositionsFromDb()
    } else {
      this.state.nimAddress = ''
      this.state.evmAddress = ''
      this.state.nimBalance = 0
      this.state.usdtBalance = 0
      this.state.polBalance = 0
      this.state.activeStakeNim = 0
      this.state.aUsdtBalance = 0
      this.state.stakedPoolAddress = undefined
      this.dbPositions = []
      this.notify()
    }
  }

  public getState(): WalletState {
    return { ...this.state }
  }

  public getDbPositions(): LiveDbPosition[] {
    return [...this.dbPositions]
  }

  public subscribe(listener: (state: WalletState) => void): () => void {
    this.listeners.push(listener)
    listener(this.getState())
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  private notify() {
    const current = this.getState()
    this.listeners.forEach((l) => l(current))
  }

  public getPublicClient() {
    return createPublicClient({
      chain: polygon,
      transport: http(POLYGON_RPCS[0], { timeout: 6000 }),
    })
  }

  public async refreshLiveBalances(): Promise<void> {
    if (!this.state.isConnected) return

    this.state.isLoadingBalances = true
    this.notify()

    try {
      // 1. Fetch EVM balances on Polygon if evmAddress is present
      if (this.state.evmAddress && this.state.evmAddress.startsWith('0x')) {
        const client = this.getPublicClient()
        const evmAddr = this.state.evmAddress as `0x${string}`

        const [polBal, usdtBal, aUsdtBal] = await Promise.allSettled([
          client.getBalance({ address: evmAddr }),
          client.readContract({
            address: CONTRACT_ADDRESSES.POLYGON.USDT as `0x${string}`,
            abi: ERC20_ABI,
            functionName: 'balanceOf',
            args: [evmAddr],
          }),
          client.readContract({
            address: CONTRACT_ADDRESSES.POLYGON.A_USDT_TOKEN as `0x${string}`,
            abi: ERC20_ABI,
            functionName: 'balanceOf',
            args: [evmAddr],
          }),
        ])

        if (polBal.status === 'fulfilled') {
          this.state.polBalance = Number(formatUnits(polBal.value, 18))
        }

        if (usdtBal.status === 'fulfilled') {
          this.state.usdtBalance = Number(formatUnits(usdtBal.value, 6))
        }

        if (aUsdtBal.status === 'fulfilled') {
          this.state.aUsdtBalance = Number(formatUnits(aUsdtBal.value, 6))
        }
      }

      // 2. Fetch Nimiq live balance if nimAddress is present
      if (this.state.nimAddress && this.state.nimAddress.startsWith('NQ')) {
        try {
          const encoded = encodeURIComponent(this.state.nimAddress)
          const res = await fetch(`https://api.nimiq.watch/api/v1/account/${encoded}`)
          if (res.ok) {
            const data = await res.json()
            if (typeof data.balance === 'number') {
              this.state.nimBalance = data.balance / 100000
            }
          }
        } catch (e) {
          console.warn('Could not fetch Nimiq balance from watch API:', e)
        }
      }
    } catch (err) {
      console.warn('Error refreshing live balances:', err)
    } finally {
      this.state.isLoadingBalances = false
      this.notify()
    }
  }

  public async fetchUserPositionsFromDb(): Promise<void> {
    if (!supabase || !this.state.isConnected) return

    const primaryAddress = (this.state.evmAddress || this.state.nimAddress).toLowerCase()
    try {
      const { data, error } = await supabase
        .from('positions')
        .select('*')
        .or(`address.eq.${primaryAddress},address.eq.${this.state.nimAddress}`)
        .eq('status', 'active')

      if (!error && data) {
        this.dbPositions = data as LiveDbPosition[]
        // Calculate total staked NIM from active positions if on-chain RPC did not return it
        const stakedFromPositions = this.dbPositions
          .filter((p) => p.asset === 'NIM')
          .reduce((acc, p) => acc + Number(p.principal), 0)

        if (stakedFromPositions > 0) {
          this.state.activeStakeNim = stakedFromPositions
        }

        // Calculate aUSDT balance from DB positions if on-chain index was lower
        const usdtFromPositions = this.dbPositions
          .filter((p) => p.asset === 'USDT')
          .reduce((acc, p) => acc + Number(p.principal), 0)

        if (usdtFromPositions > this.state.aUsdtBalance) {
          this.state.aUsdtBalance = usdtFromPositions
        }

        this.notify()
      }
    } catch (err) {
      console.warn('Could not query positions from Supabase:', err)
    }
  }

  public async connectWallet(): Promise<boolean> {
    try {
      await authService.signInWithEthereum()
      return true
    } catch {
      return false
    }
  }

  public async disconnectWallet() {
    await authService.signOut()
  }

  public async supplyUsdtToAave(amount: number): Promise<string> {
    if (!this.state.isConnected || !this.state.evmAddress) {
      throw new Error('Please sign in with your Ethereum wallet to supply USDT')
    }

    if (this.state.usdtBalance < amount) {
      throw new Error(`Insufficient USDT balance (${this.state.usdtBalance.toFixed(2)} USDT available)`)
    }

    const eth = typeof window !== 'undefined' ? (window as unknown as { ethereum?: any }).ethereum : null
    if (!eth) {
      throw new Error('Ethereum provider not available')
    }

    const walletClient = createWalletClient({
      chain: polygon,
      transport: custom(eth),
    })
    const publicClient = this.getPublicClient()
    const userAddress = this.state.evmAddress as `0x${string}`
    const amountUnits = parseUnits(amount.toString(), 6)

    // 1. Check current allowance
    const allowance = await publicClient.readContract({
      address: CONTRACT_ADDRESSES.POLYGON.USDT as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [userAddress, CONTRACT_ADDRESSES.POLYGON.AAVE_V3_POOL as `0x${string}`],
    })

    if (allowance < amountUnits) {
      const approveTx = await walletClient.writeContract({
        address: CONTRACT_ADDRESSES.POLYGON.USDT as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [CONTRACT_ADDRESSES.POLYGON.AAVE_V3_POOL as `0x${string}`, amountUnits],
        account: userAddress,
      })
      await publicClient.waitForTransactionReceipt({ hash: approveTx })
    }

    // 2. Execute Aave supply
    const supplyTx = await walletClient.writeContract({
      address: CONTRACT_ADDRESSES.POLYGON.AAVE_V3_POOL as `0x${string}`,
      abi: AAVE_POOL_ABI,
      functionName: 'supply',
      args: [
        CONTRACT_ADDRESSES.POLYGON.USDT as `0x${string}`,
        amountUnits,
        userAddress,
        0,
      ],
      account: userAddress,
    })

    await publicClient.waitForTransactionReceipt({ hash: supplyTx })

    // 3. Record position in Supabase
    if (supabase) {
      try {
        await supabase.from('positions').insert({
          id: supplyTx,
          address: userAddress.toLowerCase(),
          venue_id: 'aave_v3_polygon',
          venue_name: 'Aave V3 Polygon',
          chain: 'Polygon',
          asset: 'USDT',
          principal: amount,
          status: 'active',
          tx_hash: supplyTx,
        })
      } catch (dbErr) {
        console.warn('Could not record position in Supabase:', dbErr)
      }
    }

    await this.refreshLiveBalances()
    await this.fetchUserPositionsFromDb()
    return supplyTx
  }

  public async withdrawUsdtFromAave(amount: number): Promise<string> {
    if (!this.state.isConnected || !this.state.evmAddress) {
      throw new Error('Please sign in with your Ethereum wallet to withdraw USDT')
    }

    if (this.state.aUsdtBalance < amount) {
      throw new Error(`Withdraw amount exceeds available aUSDT (${this.state.aUsdtBalance.toFixed(2)} available)`)
    }

    const eth = typeof window !== 'undefined' ? (window as unknown as { ethereum?: any }).ethereum : null
    if (!eth) {
      throw new Error('Ethereum provider not available')
    }

    const walletClient = createWalletClient({
      chain: polygon,
      transport: custom(eth),
    })
    const publicClient = this.getPublicClient()
    const userAddress = this.state.evmAddress as `0x${string}`
    const amountUnits = parseUnits(amount.toString(), 6)

    const withdrawTx = await walletClient.writeContract({
      address: CONTRACT_ADDRESSES.POLYGON.AAVE_V3_POOL as `0x${string}`,
      abi: AAVE_POOL_ABI,
      functionName: 'withdraw',
      args: [
        CONTRACT_ADDRESSES.POLYGON.USDT as `0x${string}`,
        amountUnits,
        userAddress,
      ],
      account: userAddress,
    })

    await publicClient.waitForTransactionReceipt({ hash: withdrawTx })

    // Update position in Supabase
    if (supabase) {
      try {
        await supabase.from('positions').insert({
          id: withdrawTx,
          address: userAddress.toLowerCase(),
          venue_id: 'aave_v3_polygon',
          venue_name: 'Aave V3 Polygon',
          chain: 'Polygon',
          asset: 'USDT',
          principal: -amount,
          status: 'withdrawn',
          tx_hash: withdrawTx,
        })
      } catch (dbErr) {
        console.warn('Could not update position in Supabase:', dbErr)
      }
    }

    await this.refreshLiveBalances()
    await this.fetchUserPositionsFromDb()
    return withdrawTx
  }

  public async stakeNim(poolAddress: string, amount: number): Promise<string> {
    if (!this.state.isConnected) {
      throw new Error('Please connect your wallet first')
    }
    if (this.state.nimBalance < amount) {
      throw new Error(`Insufficient NIM balance (${this.state.nimBalance.toLocaleString()} NIM available)`)
    }

    const txId = `nim_stake_${Date.now()}`

    if (isNimiqMiniAppEnvironment()) {
      const provider = await initNimiqSdk()
      if (this.state.activeStakeNim > 0) {
        await provider.sendStakeTransaction({
          value: amount * 1e5,
        })
      } else {
        await provider.sendNewStakerTransaction({
          delegation: poolAddress,
          value: amount * 1e5,
        })
        this.state.stakedPoolAddress = poolAddress
      }
    }

    // Record in Supabase
    if (supabase) {
      try {
        const address = (this.state.nimAddress || this.state.evmAddress).toUpperCase()
        await supabase.from('positions').insert({
          id: txId,
          address,
          venue_id: poolAddress,
          venue_name: 'Nimiq Validator Delegation',
          chain: 'Nimiq',
          asset: 'NIM',
          principal: amount,
          status: 'active',
          tx_hash: txId,
        })
      } catch (dbErr) {
        console.warn('Could not persist Nimiq stake position:', dbErr)
      }
    }

    this.state.nimBalance = Math.max(0, this.state.nimBalance - amount)
    this.state.activeStakeNim += amount
    this.state.stakedPoolAddress = poolAddress
    this.notify()
    await this.fetchUserPositionsFromDb()
    return txId
  }

  public async unstakeNim(amount: number): Promise<string> {
    if (!this.state.isConnected) {
      throw new Error('Please connect your wallet first')
    }
    if (this.state.activeStakeNim < amount) {
      throw new Error(`Requested unstake exceeds active stake (${this.state.activeStakeNim.toLocaleString()} NIM staked)`)
    }

    const txId = `nim_unstake_${Date.now()}`

    if (isNimiqMiniAppEnvironment()) {
      const provider = await initNimiqSdk()
      await provider.sendRemoveStakeTransaction({
        value: amount * 1e5,
      })
    }

    if (supabase) {
      try {
        const address = (this.state.nimAddress || this.state.evmAddress).toUpperCase()
        await supabase.from('positions').insert({
          id: txId,
          address,
          venue_id: this.state.stakedPoolAddress || 'validator',
          venue_name: 'Nimiq Validator Undelegation',
          chain: 'Nimiq',
          asset: 'NIM',
          principal: -amount,
          status: 'withdrawn',
          tx_hash: txId,
        })
      } catch (dbErr) {
        console.warn('Could not persist Nimiq unstake position:', dbErr)
      }
    }

    this.state.activeStakeNim = Math.max(0, this.state.activeStakeNim - amount)
    this.state.nimBalance += amount
    this.notify()
    await this.fetchUserPositionsFromDb()
    return txId
  }
}

export const walletService = new WalletService()
