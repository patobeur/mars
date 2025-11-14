
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:8000');
  // Attendre que la scène se charge
  await page.waitForTimeout(10000);
  await page.screenshot({ path: '/home/jules/verification/shadows_verify.png' });
  await browser.close();
})();
