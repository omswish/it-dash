const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const COOKIES_PATH = path.join(__dirname, 'session_cookies.json');

async function launchSession(portalUrl, usernameSelector, passwordSelector, submitSelector, username, password) {
  // Launch standard browser instance
  const browser = await puppeteer.launch({
    headless: false, // Set to false so the user can see and resolve MFA/Captcha challenges if they occur
    defaultViewport: null
  });
  
  const page = await browser.newPage();

  // 1. Load previously saved session cookies if they exist
  if (fs.existsSync(COOKIES_PATH)) {
    console.log("Loading saved session cookies...");
    const cookiesString = fs.readFileSync(COOKIES_PATH, 'utf-8');
    const cookies = JSON.parse(cookiesString);
    await page.setCookie(...cookies);
  }

  // 2. Navigate to portal URL
  await page.goto(portalUrl, { waitUntil: 'networkidle2' });

  // 3. Determine if login is required (check if username field is visible)
  const isLoggedOut = await page.evaluate((selector) => {
    return !!document.querySelector(selector);
  }, usernameSelector);

  if (isLoggedOut) {
    console.log("Session expired or not found. Performing login...");
    
    // Type credentials
    await page.type(usernameSelector, username);
    await page.type(passwordSelector, password);
    
    // Submit form
    await Promise.all([
      page.click(submitSelector),
      page.waitForNavigation({ waitUntil: 'networkidle2' })
    ]);

    // Save cookies for future runs to prevent logout
    const cookies = await page.cookies();
    fs.writeFileSync(COOKIES_PATH, JSON.stringify(cookies, null, 2));
    console.log("Session cookies saved successfully.");
  } else {
    console.log("Session remains active. Bypassed login form.");
  }

  // Keep browser active/running
  console.log("Browser is running with an active session. Close manually when done.");
}

// Example usage:
// launchSession(
//   "https://example.com/login", 
//   "#txtUsername", 
//   "#txtPassword", 
//   "#btnLogin", 
//   "user_here", 
//   "pass_here"
// );
