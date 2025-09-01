import puppeteer from "puppeteer-extra";
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { cfg } from './config.js';
import { sleep } from './utils.js';

puppeteer.use(StealthPlugin());

const USER_DATA_DIR = './puppeteer_profile';


async function waitForTimeout(page, ms) {
  if (page.waitForTimeout) {
    await page.waitForTimeout(ms);
  } else if (page.waitForDelay) {
    await page.waitForDelay(ms);
  } else {
    await sleep(ms);
  }
}

export async function openBrowser() {
  const browser = await puppeteer.launch({
    headless: false,
    userDataDir: USER_DATA_DIR,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
    ]
  });

  const pages = await browser.pages();
  const page = pages[0];

  return { browser, page };
}

async function clickButtonByText(page, texts = []) {
  try {
    // Wait for page to be stable
    await waitForTimeout(page, 1000);
    
    const buttons = await page.$$('button, a, input[type="submit"], div[role="button"]');
    
    console.log(`🔍 Found ${buttons.length} clickable elements`);
    
    for (let i = 0; i < buttons.length; i++) {
      const btn = buttons[i];
      try {
        // Check if element handle is still valid
        const elementInfo = await btn.evaluate(el => {
          if (!el || !el.isConnected) return null;
          const rect = el.getBoundingClientRect();
          const isVisible = rect.width > 0 && rect.height > 0 && el.offsetParent !== null;
          const text = el.innerText || el.textContent || el.value || '';
          return { isVisible, text };
        }).catch(() => null);
        
        if (!elementInfo || !elementInfo.isVisible) continue;
        
        const buttonText = elementInfo.text.trim();
        console.log(`🔍 Button ${i}: "${buttonText}"`);
        
        if (texts.some(t => elementInfo.text.toLowerCase().includes(t.toLowerCase()))) {
          console.log(`✅ Found matching button: "${buttonText}"`);
          await btn.evaluate(el => el.scrollIntoView({ behavior: 'smooth', block: 'center' })).catch(() => {});
          await sleep(500);
          await btn.click().catch(() => {});
          return true;
        }
      } catch (error) {
        console.log(`❌ Error checking button ${i}: ${error.message}`);
        continue;
      }
    }
    
    // Fallback: Direct page evaluation
    console.log("🔄 Trying fallback method...");
    const clicked = await page.evaluate((searchTexts) => {
      const allClickable = document.querySelectorAll('button, a, input[type="submit"], div[role="button"], [onclick]');
      
      for (let el of allClickable) {
        try {
          if (!el.isConnected) continue;
          const text = el.innerText || el.textContent || el.value || '';
          if (searchTexts.some(t => text.toLowerCase().includes(t.toLowerCase()))) {
            const rect = el.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              console.log(`Found element with text: "${text.trim()}"`);
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              if (el.click) {
                el.click();
                return true;
              } else if (el.onclick) {
                el.onclick();
                return true;
              }
            }
          }
        } catch (e) {
          continue;
        }
      }
      return false;
    }, texts);
    
    return clicked;
    
  } catch (error) {
    console.log(`❌ Error in clickButtonByText: ${error.message}`);
    return false;
  }
}

// Simplified login check - just try to go to create post page
export async function ensureLoggedIn(page) {
  const base = `https://${cfg.publication}.substack.com`;
  const createPostUrl = `${base}/publish/post?type=newsletter`;

  console.log("🔍 Checking login status by navigating to create post page...");
  
  try {
    // Go directly to create post page
    await page.goto(createPostUrl, { waitUntil: "networkidle2" });
    await sleep(3000);

    // Check if we're on the login page or redirected to login
    const currentUrl = page.url();
    console.log("📍 Current URL:", currentUrl);

    // If we're on a login/sign-in page, we need to login
    if (currentUrl.includes('sign-in') || currentUrl.includes('login')) {
      console.log("🔐 Not logged in. Please login manually in the browser...");
      
      // Wait for manual login - check every 5 seconds if we're redirected away from login
      while (true) {
        await sleep(5000);
        const newUrl = page.url();
        
        // If we're no longer on a login page, assume login was successful
        if (!newUrl.includes('sign-in') && !newUrl.includes('login')) {
          console.log("✅ Login detected! Session saved.");
          break;
        }
        
        console.log("⏳ Still on login page, waiting for manual login...");
      }
      
      // Navigate back to create post page after login
      await page.goto(createPostUrl, { waitUntil: "networkidle2" });
      await sleep(3000);
    } else {
      console.log("✅ Already logged in (session restored)");
    }

    return true;

  } catch (error) {
    console.error("❌ Error checking login status:", error.message);
    throw error;
  }
}

async function setContentEditable(page, selectors, text) {
  for (const selector of selectors) {
    try {
      await page.waitForSelector(selector, { visible: true, timeout: 3000 });
      const tagName = await page.$eval(selector, el => el.tagName.toLowerCase());

      if (tagName === "textarea" || tagName === "input") {

        await page.evaluate((sel, value) => {
          const el = document.querySelector(sel);
          if (!el) return false;
          el.value = value;
          el.dispatchEvent(new Event("input", { bubbles: true }));
          el.dispatchEvent(new Event("change", { bubbles: true }));
          return true;
        }, selector, text);
        return true;
      } else {
        // Handle contenteditable
        const success = await page.evaluate((sel, value) => {
          const el = document.querySelector(sel);
          if (!el) return false;
          el.innerText = value;
          el.dispatchEvent(new Event("input", { bubbles: true }));
          return true;
        }, selector, text);
        if (success) return true;
      }
    } catch {}
  }
  return false;
}


export async function createPost(page, { title, subtitle, body }) {
  console.log("🚀 Starting post creation...");

  const base = `https://${cfg.publication}.substack.com`;
  const createPostUrl = `${base}/publish/post?type=newsletter`;

  try {
    // Ensure logged in
    await ensureLoggedIn(page);

    // Go to create post page
    await page.goto(createPostUrl, { waitUntil: "networkidle2" });
    await sleep(3000);

    // --- Title ---
    console.log("📝 Setting title...");
    const titleSet = await setContentEditable(page, [
      'textarea#post-title.page-title.mousetrap',
      'textarea#post-title',
      'textarea.page-title'
    ], title);
    if (!titleSet) console.log("❌ Failed to set title");

    // --- Subtitle ---
    console.log("📝 Setting subtitle...");
    const subtitleSet = await setContentEditable(page, [
      'textarea.subtitle.mousetrap',
      'textarea.subtitle'
    ], subtitle);
    if (!subtitleSet) console.log("❌ Failed to set subtitle");

    // --- Body ---
    console.log("📝 Setting body...");
    const bodySet = await setContentEditable(page, [
      'div[contenteditable="true"][data-placeholder="Start writing..."]',
      'div[contenteditable="true"][data-placeholder*="Write"]',
      'div[contenteditable="true"][data-placeholder*="Tell your story"]',
      '[data-testid="body-editor"]',
      '.editor-body [contenteditable="true"]'
    ], body);

    if (!bodySet) {
      console.log("⚠️ Falling back to generic editor search...");
      await page.evaluate((bodyText) => {
        const editable = [...document.querySelectorAll("[contenteditable='true']")];
        if (editable.length > 1) {
          editable[1].innerHTML = "<p>" + bodyText + "</p>";
          editable[1].dispatchEvent(new Event("input", { bubbles: true }));
          return true;
        }
        return false;
      }, body);
    }

    // --- Visibility ---
    if (cfg.postVisibility === "subscribers") {
      console.log("🔒 Setting visibility to subscribers only...");
      const visClicked = await clickButtonByText(page, ["Visibility"]);
      if (visClicked) {
        await sleep(500);
        await clickButtonByText(page, ["Subscribers only"]);
      }
    }

    // --- Publish or Draft ---
    if (cfg.publishMode === "publish") {
      console.log("🚀 Publishing post...");
      const continueClicked = await clickButtonByText(page, ["Continue", "Publish"]);
      if (continueClicked) {
        await sleep(1500);
        await clickButtonByText(page, ["Send to everyone now", "Publish now"]);
      }
    } else {
      console.log("💾 Saving as draft...");
      await clickButtonByText(page, ["Save draft", "Preview", "Close"]);
    }

    console.log("✅ Post creation completed successfully");
  } catch (err) {
    console.error("❌ Error in createPost:", err.message);
    await page.screenshot({ path: "create-post-error.png" });
    console.log("📸 Error screenshot saved: create-post-error.png");
    throw err;
  }
}
