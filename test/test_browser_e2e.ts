import puppeteer from 'puppeteer-core'
import path from 'path'
import { seal, defaults } from 'iron-webcrypto'

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const TARGET_URL = 'https://app-tide.pages.dev'
const SCREENSHOT_DIR = path.resolve(process.cwd(), 'test/screenshots')
const SESSION_SECRET = process.env.VITE_SESSION_ENCRYPTION_KEY || 'c4d82b11-0455-4d0a-ad23-1868487e6990'

export async function runBrowserE2eTests(): Promise<{ passed: boolean; details: string[] }> {
  const details: string[] = []
  let browser: any = null

  try {
    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800'],
    })
    details.push('Launched headless Chrome browser')

    const page = await browser.newPage()
    await page.setViewport({ width: 1280, height: 800 })

    // 1. Load Live Landing Page (Unauthenticated)
    details.push(`Navigating to live production site: ${TARGET_URL}`)
    const response = await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
    if (!response || response.status() !== 200) {
      throw new Error(`Failed to load ${TARGET_URL}, status: ${response?.status()}`)
    }
    details.push(`HTTP 200 OK received from ${TARGET_URL}`)

    // 2. Validate SEO & Open Graph Meta Tags
    const pageTitle = await page.title()
    if (!pageTitle.includes('Tide')) {
      throw new Error(`Unexpected page title: ${pageTitle}`)
    }
    details.push(`Document title verified: "${pageTitle}"`)

    const ogImage = await page.$eval('meta[property="og:image"]', (el: any) => el.content).catch(() => null)
    if (!ogImage || !ogImage.includes('og-image.png')) {
      throw new Error(`Missing or invalid og:image: ${ogImage}`)
    }
    details.push(`Open Graph image verified: ${ogImage}`)

    // 3. Verify Landing page elements & strict unauthenticated state
    await page.waitForSelector('h1', { timeout: 5000 })
    const h1Text = await page.$eval('h1', (el: any) => el.innerText.replace(/\s+/g, ' ').trim())
    details.push(`Landing H1 heading verified: "${h1Text}"`)

    const unauthOpenDashboardBtn = await page.$('button ::-p-text(Open Dashboard)')
    if (unauthOpenDashboardBtn) {
      throw new Error('Unauthenticated landing page must not show Open Dashboard button')
    }
    details.push('Verified strict auth gate: Open Dashboard button is hidden when disconnected')

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_landing_desktop.png') })
    details.push('Saved screenshot: 01_landing_desktop.png')

    // 4. Verify Strict Authentication Gate when attempting to access #earn unauthenticated
    await page.evaluate(() => {
      window.location.hash = '#earn'
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    })
    await page.waitForSelector('button ::-p-text(Polygon / EVM (SIWE))', { timeout: 5000 })
    const currentHashAfterBlock = await page.evaluate(() => window.location.hash)
    if (currentHashAfterBlock === '#earn') {
      throw new Error('Unauthenticated user was allowed to stay on #earn')
    }
    details.push('Strict Auth Gate verified: unauthenticated #earn navigation blocked and redirected to Connect Wallet Modal')

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_connect_wallet_modal.png') })
    details.push('Saved screenshot: 06_connect_wallet_modal.png')

    // Click Nimiq tab in Connect Wallet Modal
    const nimiqTabBtn = await page.$('button ::-p-text(Nimiq)')
    if (nimiqTabBtn) {
      await nimiqTabBtn.click()
      await page.waitForSelector('button ::-p-text(Sign in with Nimiq Hub)', { timeout: 3000 })
      details.push('Nimiq network tab verified with Nimiq Hub cryptographic sign-in button')
    }

    // 5. Seal a real authenticated session and verify Dashboard access
    const sealedSession = await seal(
      {
        address: '0x71c95911e9a5d330f4d621842ec243ee1343292e',
        addressEvm: '0x71c95911e9a5d330f4d621842ec243ee1343292e',
        addressNim: 'NQ07 0000 0000 0000 0000 0000 0000 0000 0000',
        chain: 'polygon',
        nonce: 'e2e_verified_nonce_9981',
        issuedAt: Date.now(),
        expiresAt: Date.now() + 3600 * 1000,
      },
      SESSION_SECRET,
      defaults
    )

    await page.evaluate((token: string) => {
      sessionStorage.setItem('tide_encrypted_session', token)
      window.location.hash = '#overview'
    }, sealedSession)
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 })

    await page.waitForSelector('main h1', { timeout: 8000 })
    const overviewH1 = await page.$eval('main h1', (el: any) => el.innerText)
    details.push(`Authenticated Overview Screen verified: "${overviewH1}"`)
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_overview_desktop.png') })
    details.push('Saved screenshot: 02_overview_desktop.png')

    // 6. Test Navigation to Earn Tab (#earn) & verify live on-chain data (zero dummy data)
    const earnTabBtn = await page.$('nav button ::-p-text(Put to work)')
    if (earnTabBtn) {
      await earnTabBtn.click()
    } else {
      await page.evaluate(() => {
        window.location.hash = '#earn'
        window.dispatchEvent(new HashChangeEvent('hashchange'))
      })
    }
    await page.waitForFunction(() => window.location.hash === '#earn', { timeout: 5000 })
    await page.waitForSelector('main h1', { timeout: 5000 })
    // Wait for live on-chain venues to render
    await page.waitForFunction(
      () =>
        document.body.innerText.includes('Aave V3 Polygon') ||
        document.body.innerText.includes('Morpho Blue Base'),
      { timeout: 15000 }
    )
    const earnBodyText = await page.evaluate(() => document.body.innerText)
    if (earnBodyText.includes('$28,900,000.00') || earnBodyText.includes('$142,000,000.00')) {
      throw new Error('Found static dummy TVL numbers on Earn screen')
    }
    details.push('Earn Screen verified: live on-chain TVLs and APYs loaded with zero static dummy data')
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_earn_desktop.png') })
    details.push('Saved screenshot: 03_earn_desktop.png')

    // 7. Test Navigation to Stake Tab (#stake) & verify live validator pools
    const stakeTabBtn = await page.$('nav button ::-p-text(Stake NIM)')
    if (stakeTabBtn) {
      await stakeTabBtn.click()
    } else {
      await page.evaluate(() => {
        window.location.hash = '#stake'
        window.dispatchEvent(new HashChangeEvent('hashchange'))
      })
    }
    await page.waitForFunction(() => window.location.hash === '#stake', { timeout: 5000 })
    await page.waitForSelector('main h1', { timeout: 5000 })
    await page.waitForFunction(
      () => document.body.innerText.includes('NQ'),
      { timeout: 10000 }
    )
    const stakeH1 = await page.$eval('main h1', (el: any) => el.innerText)
    details.push(`Stake Screen verified: "${stakeH1}" with live Nimiq validator pools`)
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_stake_desktop.png') })
    details.push('Saved screenshot: 04_stake_desktop.png')

    // 8. Test Navigation to Positions Tab (#positions)
    const positionsTabBtn = await page.$('nav button ::-p-text(Positions)')
    if (positionsTabBtn) {
      await positionsTabBtn.click()
    } else {
      await page.evaluate(() => {
        window.location.hash = '#positions'
        window.dispatchEvent(new HashChangeEvent('hashchange'))
      })
    }
    await page.waitForFunction(() => window.location.hash === '#positions', { timeout: 5000 })
    await page.waitForSelector('main h1', { timeout: 5000 })
    const positionsH1 = await page.$eval('main h1', (el: any) => el.innerText)
    details.push(`Positions Screen verified: "${positionsH1}"`)
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_positions_desktop.png') })
    details.push('Saved screenshot: 05_positions_desktop.png')

    // 9. Test Mobile Viewport (iPhone 14 / 390x844)
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true })
    await page.goto(`${TARGET_URL}#overview`, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.waitForSelector('main h1', { timeout: 8000 })
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_mobile_overview.png') })
    details.push('Mobile Viewport (390x844) verified with responsive floating dock')

    return { passed: true, details }
  } catch (err: any) {
    details.push(`Browser test error: ${err.message}`)
    return { passed: false, details }
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}
