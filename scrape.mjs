import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

mkdirSync('images', { recursive: true });

const POSTS = [
  'https://www.instagram.com/bailyautostudio/p/DHcxjh2sjQc/',
  'https://www.instagram.com/bailyautostudio/reel/DIIGY6AusCq/',
  'https://www.instagram.com/bailyautostudio/reel/DIIGG7muSQb/',
  'https://www.instagram.com/bailyautostudio/reel/DIAQMk3ulIJ/',
  'https://www.instagram.com/bailyautostudio/p/DIAOoRVO8Hf/',
  'https://www.instagram.com/bailyautostudio/p/DHcxn9UsgtI/',
  'https://www.instagram.com/bailyautostudio/p/DHcxajIszNp/',
  'https://www.instagram.com/bailyautostudio/p/DHcxTAnMHIB/',
  'https://www.instagram.com/bailyautostudio/p/DHcwvDPsulq/',
];

const browser = await chromium.launch({ headless: false, slowMo: 200 });
const ctx = await browser.newContext({
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  viewport: { width: 1280, height: 900 },
});
const page = await ctx.newPage();

// Load profile page first
await page.goto('https://www.instagram.com/bailyautostudio/', { waitUntil: 'networkidle', timeout: 20000 });
await page.waitForTimeout(2000);

for (let i = 0; i < POSTS.length; i++) {
  const url = POSTS[i];
  const dest = `images/gallery-${i + 1}.jpg`;
  console.log(`[${i+1}/${POSTS.length}] ${url}`);

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(2000);

    // Dismiss any popup/dialog
    try { await page.keyboard.press('Escape'); await page.waitForTimeout(500); } catch {}
    try {
      const closeBtn = page.locator('[aria-label="Close"], button:has-text("Not Now"), button:has-text("Close")').first();
      if (await closeBtn.count() > 0) { await closeBtn.click(); await page.waitForTimeout(500); }
    } catch {}

    // Try multiple selectors for the post image
    const selectors = [
      'article div._aagv img',
      'article div[style*="padding-bottom"] img',
      'div[role="dialog"] img',
      'article img[style*="object-fit"]',
      'article img',
      'main img',
    ];

    let screenshotted = false;
    for (const sel of selectors) {
      try {
        const el = page.locator(sel).first();
        if (await el.count() > 0) {
          const box = await el.boundingBox();
          if (box && box.width > 200 && box.height > 200) {
            await page.screenshot({ path: dest, clip: { x: box.x, y: box.y, width: box.width, height: box.height } });
            console.log(`  ✓ ${dest} via "${sel}" (${Math.round(box.width)}x${Math.round(box.height)})`);
            screenshotted = true;
            break;
          }
        }
      } catch {}
    }

    if (!screenshotted) {
      // Last resort: clip to known IG post image area (left column)
      await page.screenshot({ path: dest, clip: { x: 130, y: 50, width: 490, height: 610 } });
      console.log(`  ✓ ${dest} (clipped fallback)`);
    }
  } catch (e) {
    console.log(`  ✗ ${e.message}`);
  }
}

await browser.close();
console.log('\nDone.');
