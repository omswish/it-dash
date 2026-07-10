// Generic Extension Content Script Template
console.log('Ingested Session Keeper & Autofill Template');

// 1. Keep Session Alive
// Simulates a heartbeat interaction every 4 minutes to reset inactivity timers
function keepSessionAlive() {
  console.log('[Heartbeat] Simulating activity to keep session active...');
  
  // Dispatch a simulated click on the document body (does not disrupt navigation)
  const clickEvent = new MouseEvent('click', {
    view: window,
    bubbles: true,
    cancelable: true
  });
  document.body.dispatchEvent(clickEvent);
}

// Start keep-alive loop (e.g., run every 4 minutes)
setInterval(keepSessionAlive, 240000);


// 2. Autofill and Submit Login Form (Conceptual)
// Listens for login forms and populates inputs from extension storage parameters
function autofillLoginForm(usernameSelector, passwordSelector, submitButtonSelector) {
  // Query inputs
  const userInput = document.querySelector(usernameSelector);
  const passInput = document.querySelector(passwordSelector);
  const submitBtn = document.querySelector(submitButtonSelector);

  if (userInput && passInput && submitBtn) {
    console.log('Login form detected. Fetching secure credentials...');
    
    // Retrieve credentials stored in extension local storage
    chrome.storage.local.get(['portalCredentials'], (result) => {
      if (result.portalCredentials) {
        // Autofill credentials
        userInput.value = result.portalCredentials.username;
        passInput.value = result.portalCredentials.password;

        // Dispatch input events so the page framework (Angular/React) detects values
        userInput.dispatchEvent(new Event('input', { bubbles: true }));
        passInput.dispatchEvent(new Event('input', { bubbles: true }));

        console.log('Autofilled. Submitting form...');
        submitBtn.click();
      } else {
        console.warn('No credentials configured in storage.');
      }
    });
  }
}

// Check for login forms on page load
// window.addEventListener('load', () => {
//   autofillLoginForm('#username-field', '#password-field', '#login-submit-btn');
// });
