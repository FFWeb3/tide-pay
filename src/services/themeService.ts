export type ThemeMode = 'light' | 'dark'

class ThemeService {
  private currentTheme: ThemeMode = 'light'
  private listeners: Array<(theme: ThemeMode) => void> = []

  constructor() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('tide_theme') as ThemeMode | null
      if (stored === 'dark' || stored === 'light') {
        this.currentTheme = stored
      }
      this.applyTheme(this.currentTheme)
    }
  }

  public getTheme(): ThemeMode {
    return this.currentTheme
  }

  public toggleTheme(): ThemeMode {
    const nextTheme: ThemeMode = this.currentTheme === 'light' ? 'dark' : 'light'
    this.setTheme(nextTheme)
    return nextTheme
  }

  public setTheme(theme: ThemeMode) {
    this.currentTheme = theme
    if (typeof window !== 'undefined') {
      localStorage.setItem('tide_theme', theme)
      this.applyTheme(theme)
    }
    this.listeners.forEach((listener) => listener(theme))
  }

  private applyTheme(theme: ThemeMode) {
    if (typeof document !== 'undefined') {
      const root = document.documentElement
      if (theme === 'dark') {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }
  }

  public subscribe(listener: (theme: ThemeMode) => void): () => void {
    this.listeners.push(listener)
    listener(this.currentTheme)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }
}

export const themeService = new ThemeService()

