import { seal, unseal, defaults } from 'iron-webcrypto'

const sessionSecret = (
  import.meta.env?.VITE_SESSION_ENCRYPTION_KEY ??
  (typeof process !== 'undefined' ? process.env?.VITE_SESSION_ENCRYPTION_KEY : undefined)
) as string | undefined

export const isEncryptionConfigured = Boolean(
  typeof sessionSecret === 'string' && sessionSecret.trim().length >= 32
)

export async function sealData<T = unknown>(data: T): Promise<string> {
  if (!isEncryptionConfigured || !sessionSecret) {
    throw new Error(
      'Session encryption key is not configured. Set VITE_SESSION_ENCRYPTION_KEY (at least 32 characters) in your .env file.'
    )
  }
  return await seal(data, sessionSecret, defaults)
}

export async function unsealData<T = unknown>(sealedText: string): Promise<T | null> {
  if (!isEncryptionConfigured || !sessionSecret) {
    throw new Error(
      'Session encryption key is not configured. Set VITE_SESSION_ENCRYPTION_KEY (at least 32 characters) in your .env file.'
    )
  }
  try {
    const unsealed = await unseal(sealedText, sessionSecret, defaults)
    return unsealed as T
  } catch (error) {
    console.error('Failed to unseal session data:', error)
    return null
  }
}

export async function setEncryptedSessionItem<T = unknown>(key: string, data: T): Promise<void> {
  if (typeof window === 'undefined') return
  const sealed = await sealData(data)
  sessionStorage.setItem(key, sealed)
}

export async function getEncryptedSessionItem<T = unknown>(key: string): Promise<T | null> {
  if (typeof window === 'undefined') return null
  const sealed = sessionStorage.getItem(key)
  if (!sealed) return null
  return await unsealData<T>(sealed)
}

export function removeSessionItem(key: string): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(key)
}

export function clearAllSessionItems(): void {
  if (typeof window === 'undefined') return
  sessionStorage.clear()
}

