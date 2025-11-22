// app-init.js
// Application initialization and error handling

// Global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  
  // Show user-friendly error message
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #ff4444;
    color: white;
    padding: 15px;
    border-radius: 5px;
    z-index: 10000;
    max-width: 300px;
  `;
  errorDiv.textContent = 'An error occurred. Please refresh the page.';
  document.body.appendChild(errorDiv);
  
  setTimeout(() => {
    if (errorDiv.parentNode) {
      errorDiv.parentNode.removeChild(errorDiv);
    }
  }, 5000);
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  event.preventDefault();
});

// Check if required dependencies are loaded
function checkDependencies() {
  const required = ['supabase'];
  const missing = required.filter(dep => typeof window[dep] === 'undefined');
  
  if (missing.length > 0) {
    console.error('Missing dependencies:', missing);
    return false;
  }
  return true;
}

// Initialize application
async function initializeApp() {
  try {
    // Check dependencies
    if (!checkDependencies()) {
      throw new Error('Required dependencies not loaded');
    }
    
    // Wait for auth service
    if (typeof auth !== 'undefined') {
      await auth.waitForInit();
    }
    
    // Wait for data service
    if (typeof dataService !== 'undefined') {
      await dataService.waitForInit();
    }
    
    console.log('Application initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize application:', error);
    return false;
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { initializeApp, checkDependencies };
}