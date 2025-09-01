import chalk from 'chalk';
import { cfg } from './config.js';
import { readTopics } from './csv.js';
import { generatePost } from './gemini.js';
import { openBrowser, ensureLoggedIn, createPost } from './substack.js';
import inquirer from 'inquirer';

async function main() {
  console.log(chalk.cyanBright(`\nSubstack Automation`));
  console.log(chalk.gray(`Publication: ${cfg.publication}.substack.com`));
  console.log(chalk.gray(`Email from .env: ${cfg.email}`));
  console.log(chalk.gray(`CSV: ${cfg.csvPath}`));
  console.log(chalk.gray(`Mode: ${cfg.publishMode.toUpperCase()} | Visibility: ${cfg.postVisibility}\n`));

  const topics = await readTopics(cfg.csvPath);
  if (topics.length === 0) {
    console.log(chalk.red('No topics found in CSV.'));
    process.exit(1);
  }

  const { browser, page } = await openBrowser();
  try {

    await ensureLoggedIn(page);

    for (const row of topics) {
      console.log(chalk.yellow(`\nTopic: ${row.topic}`));
      const { proceed } = await inquirer.prompt([
        { type: 'confirm', name: 'proceed', message: 'Generate & create a post for this topic?', default: true }
      ]);
      if (!proceed) continue;

      console.log(chalk.gray('Generating with Gemini...'));
      const { title, subtitle, body } = await generatePost(row.topic);

      console.log(chalk.green(`\nTitle: ${title}\nSubtitle: ${subtitle}\n`));
      const { ok } = await inquirer.prompt([
        { type: 'confirm', name: 'ok', message: 'Use this content?', default: true }
      ]);
      if (!ok) continue;

      console.log(chalk.gray('Opening Substack editor...'));
      await createPost(page, { title, subtitle, body });

      console.log(chalk.green(`✅ Created ${cfg.publishMode === 'publish' ? 'published post' : 'draft'} for: ${title}`));
    }
    console.log(chalk.cyanBright('\nAll done.'));
  } catch (e) {
    console.error(chalk.red('Error:'), e.message);
  } finally {
    await browser.close().catch(()=>{});
  }
}

main();