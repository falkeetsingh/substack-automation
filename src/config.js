import 'dotenv/config.js';

export const cfg = {
    email: process.env.SUBSTACK_EMAIL?.trim(),
    publication: process.env.SUBSTACK_PUBLICATION?.trim(),
    csvPath: process.env.CSV_PATH || '../data/topics.csv',
    headless: (process.env.HEADLESS || 'true').toLowerCase() === 'true',
    publishMode: (process.env.PUBLISH_MODE || 'draft').toLowerCase(), // 'draft' | 'publish'
    postVisibility: (process.env.POST_VISIBILITY || 'public').toLowerCase(), // 'public' | 'subscribers'
    geminiApiKey: process.env.GEMINI_API_KEY,
    browserExecPath: process.env.BROWSER_EXECUTABLE_PATH || undefined,
    navTimeout: Number(process.env.NAV_TIMEOUT_MS || 45000),
};

for (const [k, v] of Object.entries({
  SUBSTACK_EMAIL: cfg.email,
  SUBSTACK_PUBLICATION: cfg.publication,
  GEMINI_API_KEY: cfg.geminiApiKey,
})) {
  if (!v) {
    console.error(`Missing required env: ${k}`);
    process.exit(1);
  }
}