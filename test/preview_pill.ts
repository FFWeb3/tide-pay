import puppeteer from 'puppeteer-core'
import { spawn } from 'child_process'
import path from 'path'

async function testVisual() {
  const preview = spawn('npx', ['vite', 'preview', '--port', '4173'], { stdio: 'ignore' })
  await new Promise((r) => setTimeout(r, 2000))

  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--no-sandbox', '--window-size=1280,800'],
  })

  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 1280, height: 800 })
    await page.goto('http://localhost:4173', { waitUntil: 'networkidle2' })

    // 1. Dark Mode (Default)
    await page.evaluate(() => {
      document.documentElement.classList.add('dark')
    })
    await page.screenshot({ path: path.resolve('test/screenshots/test_pill_dark.png') })
    console.log('Saved test_pill_dark.png')

    // 2. Light Mode
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark')
    })
    await page.screenshot({ path: path.resolve('test/screenshots/test_pill_light.png') })
    console.log('Saved test_pill_light.png')

    // 3. Click the pill badge to cycle
    const pill = await page.$('h1 div[title*="Click to cycle"]')
    if (pill) {
      await pill.click()
      await new Promise((r) => setTimeout(r, 600))
      await page.screenshot({ path: path.resolve('test/screenshots/test_pill_cycled.png') })
      console.log('Saved test_pill_cycled.png')
    }

    // 4. Mobile viewport screenshot
    await page.setViewport({ width: 390, height: 844, isMobile: true })
    await page.goto('http://localhost:4173', { waitUntil: 'networkidle2' })
    await page.screenshot({ path: path.resolve('test/screenshots/test_pill_mobile.png') })
    console.log('Saved test_pill_mobile.png')
  } finally {
    await browser.close()
    preview.kill()
  }
}

testVisual().catch((e) => {
  console.error(e)
  process.exit(1)
})
