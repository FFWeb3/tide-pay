import puppeteer from 'puppeteer-core'
import { spawn } from 'child_process'
import path from 'path'

async function inspectMobile() {
  const preview = spawn('npx', ['vite', 'preview', '--port', '4173'], { stdio: 'ignore' })
  await new Promise((r) => setTimeout(r, 2000))

  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--no-sandbox', '--window-size=375,812'],
  })

  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true })

    // 1. Landing page header at 375px
    await page.goto('http://localhost:4173/', { waitUntil: 'networkidle2' })
    const landingMetrics = await page.evaluate(() => {
      const header = document.querySelector('header')
      return {
        bodyScrollWidth: document.body.scrollWidth,
        bodyClientWidth: document.body.clientWidth,
        headerScrollWidth: header?.scrollWidth,
        headerClientWidth: header?.clientWidth,
      }
    })
    console.log('Landing Metrics at 375px:', landingMetrics)
    await page.screenshot({ path: path.resolve('test/screenshots/mobile_landing_header_375.png') })

    // 2. Open Hamburger on Landing
    const hamburgerBtn = await page.$('header button[aria-label*="navigation menu"]')
    if (hamburgerBtn) {
      await hamburgerBtn.click()
      await new Promise((r) => setTimeout(r, 400))
      await page.screenshot({ path: path.resolve('test/screenshots/mobile_hamburger_menu_open.png') })
      console.log('Saved mobile_hamburger_menu_open.png')

      // 3. Click "Overview" in mobile menu
      const overviewBtn = await page.$('header div[role="dialog"] button, header div button ::-p-text(Overview)')
      if (overviewBtn) {
        await overviewBtn.click()
        await new Promise((r) => setTimeout(r, 400))
        console.log('Navigated to overview via hamburger menu')
      }
    }

    // 4. Overview page header at 375px
    await page.goto('http://localhost:4173/#overview', { waitUntil: 'networkidle2' })
    const overviewMetrics = await page.evaluate(() => {
      const header = document.querySelector('header')
      const dock = document.querySelector('nav[aria-label="Navigation dock"]')
      return {
        bodyScrollWidth: document.body.scrollWidth,
        bodyClientWidth: document.body.clientWidth,
        headerScrollWidth: header?.scrollWidth,
        headerClientWidth: header?.clientWidth,
        dockScrollWidth: dock?.scrollWidth,
        dockClientWidth: dock?.clientWidth,
      }
    })
    console.log('Overview Metrics at 375px:', overviewMetrics)
    await page.screenshot({ path: path.resolve('test/screenshots/mobile_overview_header_375.png') })

    // 5. Open Hamburger on Overview
    const overviewHamburger = await page.$('header button[aria-label*="navigation menu"]')
    if (overviewHamburger) {
      await overviewHamburger.click()
      await new Promise((r) => setTimeout(r, 400))
      await page.screenshot({ path: path.resolve('test/screenshots/mobile_overview_menu_open.png') })
      console.log('Saved mobile_overview_menu_open.png')
    }
  } finally {
    await browser.close()
    preview.kill()
  }
}

inspectMobile().catch((e) => {
  console.error(e)
  process.exit(1)
})
