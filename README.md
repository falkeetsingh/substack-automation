# Substack Automation Tool

This project automates the creation and publication of posts on Substack using Puppeteer for browser automation and the Gemini API for AI-powered content generation. Topics are sourced from a CSV or Excel file, streamlining the entire workflow.

# Features

- Automated Substack Posting: Quickly create and publish new posts.
- AI-Generated Content: Uses the Gemini API to generate post titles, subtitles, and content.
- Customizable Visibility: Set posts to be visible to the public or subscribers only.
- Flexible Execution: Run the script in headless mode (invisible browser) or with a visible browser window.
- Secure Session-Based Login: Bypasses Substack's bot detection by reusing a stored login session.

# Installation

To get started, clone the repository and install the necessary dependencies.

**Clone the repository**

git clone https://github.com/falkeetsingh/substack-automation.git
cd substack-automation

**Install dependencies**

npm install

**Environment Variables**  
Create a .env file in the root directory to configure the script.

SUBSTACK_EMAIL=your_email@example.com # Your Substack email
SUBSTACK_PASSWORD=your_password # Your Substack password
SUBSTACK_PUBLICATION=yourblog.substack.com # Your Substack publication URL
GEMINI_API_KEY=your_gemini_api_key # Your Gemini API key

CSV_PATH=./data/topics.csv # Path to your topics CSV file
HEADLESS=false # true | false (false opens a visible browser window)
PUBLISH_MODE=draft # draft | publish
POST_VISIBILITY=public # public | subscribers

BROWSER_EXECUTABLE_PATH= # Leave empty to use Puppeteer's bundled Chromium
NAV_TIMEOUT_MS=45000 # Navigation timeout in milliseconds

**Usage**

- Prepare your topics: Add your content topics to the data/topics.csv file.

- Run the script: Execute the following command in your terminal:
  node index.js

- Puppeteer will then automate the following steps:
  Open Substack in a browser.
  Reuse a stored login session.
  Generate post content using the Gemini API for each topic.
  Create a draft or publish the post based on your PUBLISH_MODE setting.

**Notes**

- First-Time Login: The first time you run the tool, you'll need to manually log in to Substack in the browser window that opens. The session will then be stored and reused for all future runs.

- Session Refresh: If Substack updates its login process, you may need to delete the stored session and log in manually again to refresh it.

- Security: Keep your .env file secure as it contains sensitive information.
