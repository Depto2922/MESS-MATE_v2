// login-simple.js
// Simplified login functionality

let authService = null;

// Wait for dependencies to load
async function waitForDependencies() {
  let attempts = 0;
  while (attempts < 100) {
    if (typeof supabase !== 'undefined' && typeof auth !== 'undefined') {
      authService = auth;
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, 50));
    attempts++;
  }
  return false;
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOM loaded, waiting for dependencies...');
  
  const loaded = await waitForDependencies();
  if (!loaded) {
    alert('Failed to load application. Please refresh the page.');
    return;
  }
  
  console.log('Dependencies loaded, initializing...');
  
  // Wait for auth service to initialize
  if (authService.waitForInit) {
    await authService.waitForInit();
  }
  
  initializeUI();
});

function initializeUI() {
  // Get elements
  const showSignupBtn = document.getElementById('show-signup');
  const showLoginBtn = document.getElementById('show-login');
  const signupForm = document.getElementById('signup-form');
  const loginForm = document.getElementById('login-form');
  const postAuthSection = document.getElementById('post-auth-section');
  const authSection = document.getElementById('auth-section');
  
  // Helper functions
  function show(el) { if (el) el.style.display = ''; }
  function hide(el) { if (el) el.style.display = 'none'; }
  
  function showSignup() {
    show(signupForm);
    hide(loginForm);
  }
  
  function showLogin() {
    hide(signupForm);
    show(loginForm);
  }
  
  // Check if already authenticated
  if (authService.isAuthenticated() && authService.getCurrentMess()) {
    window.location.href = 'index.html';
    return;
  }
  
  if (authService.isAuthenticated() && !authService.getCurrentMess()) {
    hide(authSection);
    show(postAuthSection);
    setupMessSelection();
    return;
  }
  
  // Show login by default
  showLogin();
  
  // Event listeners
  if (showSignupBtn) showSignupBtn.addEventListener('click', showSignup);
  if (showLoginBtn) showLoginBtn.addEventListener('click', showLogin);
  
  // Setup forms
  setupSignupForm();
  setupLoginForm();
}

function setupSignupForm() {
  const signupForm = document.getElementById('signup-form');
  const sendOtpBtn = document.getElementById('send-otp');
  
  if (sendOtpBtn) {
    sendOtpBtn.addEventListener('click', async () => {
      const email = document.getElementById('signup-email').value.trim();
      if (!email) {
        alert('Please enter your email first.');
        return;
      }
      
      try {
        const otp = generateOTP();
        await sendOtpEmail(email, otp);
        storeOTP(email, otp);
        document.getElementById('otp-status').textContent = 'OTP sent! Check your email.';
        document.getElementById('otp-status').style.color = '#b7f7b7';
      } catch (error) {
        console.error('OTP send failed:', error);
        document.getElementById('otp-status').textContent = 'Failed to send OTP. Try again.';
        document.getElementById('otp-status').style.color = '#ffb3b3';
      }
    });
  }
  
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const name = document.getElementById('signup-name').value.trim();
      const uniqueId = document.getElementById('signup-id').value.trim();
      const email = document.getElementById('signup-email').value.trim();
      const password = document.getElementById('signup-password').value;
      const otp = document.getElementById('signup-otp').value.trim();
      
      if (!name || !uniqueId || !email || !password || !otp) {
        document.getElementById('signup-error').textContent = 'Please fill all fields.';
        return;
      }
      
      // Verify OTP
      if (!verifyOTP(email, otp)) {
        document.getElementById('otp-status').textContent = 'Invalid or expired OTP.';
        document.getElementById('otp-status').style.color = '#ffb3b3';
        return;
      }
      
      try {
        const { data, error } = await authService.signUp(email, password, name, uniqueId);
        if (error) throw error;
        
        // Show mess selection
        document.getElementById('auth-section').style.display = 'none';
        document.getElementById('post-auth-section').style.display = '';
        setupMessSelection();
        
      } catch (error) {
        document.getElementById('signup-error').textContent = error.message;
      }
    });
  }
}

function setupLoginForm() {
  const loginForm = document.getElementById('login-form');
  
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const loginId = document.getElementById('login-id').value.trim();
      const password = document.getElementById('login-password').value;
      
      if (!loginId || !password) {
        document.getElementById('login-error').textContent = 'Please fill all fields.';
        return;
      }
      
      try {
        const { data, error } = await authService.signIn(loginId, password);
        if (error) throw error;
        
        // Check if user has a mess
        if (authService.getCurrentMess()) {
          window.location.href = 'index.html';
        } else {
          // Show mess selection
          document.getElementById('auth-section').style.display = 'none';
          document.getElementById('post-auth-section').style.display = '';
          setupMessSelection();
        }
        
      } catch (error) {
        document.getElementById('login-error').textContent = error.message;
      }
    });
  }
}

function setupMessSelection() {
  const chooseCreateBtn = document.getElementById('choose-create');
  const chooseJoinBtn = document.getElementById('choose-join');
  const createMessForm = document.getElementById('create-mess-form');
  const joinMessForm = document.getElementById('join-mess-form');
  
  function show(el) { if (el) el.style.display = ''; }
  function hide(el) { if (el) el.style.display = 'none'; }
  
  if (chooseCreateBtn) {
    chooseCreateBtn.addEventListener('click', () => {
      show(createMessForm);
      hide(joinMessForm);
    });
  }
  
  if (chooseJoinBtn) {
    chooseJoinBtn.addEventListener('click', () => {
      show(joinMessForm);
      hide(createMessForm);
    });
  }
  
  // Create mess form
  if (createMessForm) {
    createMessForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const messName = document.getElementById('create-mess-id').value.trim();
      const messPassword = document.getElementById('create-mess-password').value;
      
      if (!messName || !messPassword) {
        document.getElementById('create-mess-error').textContent = 'Please fill all fields.';
        return;
      }
      
      try {
        const { data, error } = await authService.createMess(messName, messPassword);
        if (error) throw error;
        
        window.location.href = 'index.html';
      } catch (error) {
        document.getElementById('create-mess-error').textContent = error.message;
      }
    });
  }
  
  // Join mess form
  if (joinMessForm) {
    joinMessForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const messName = document.getElementById('join-mess-id').value.trim();
      const messPassword = document.getElementById('join-mess-password').value;
      
      if (!messName || !messPassword) {
        document.getElementById('join-mess-error').textContent = 'Please fill all fields.';
        return;
      }
      
      try {
        const { data, error } = await authService.joinMess(messName, messPassword);
        if (error) throw error;
        
        window.location.href = 'index.html';
      } catch (error) {
        document.getElementById('join-mess-error').textContent = error.message;
      }
    });
  }
}

// OTP functions
function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function storeOTP(email, otp) {
  const expiry = Date.now() + (15 * 60 * 1000); // 15 minutes
  const record = { email, otp, expiry };
  localStorage.setItem('signupOTP', JSON.stringify(record));
}

function verifyOTP(email, otp) {
  try {
    const stored = JSON.parse(localStorage.getItem('signupOTP'));
    if (!stored) return false;
    
    if (stored.email !== email || stored.expiry < Date.now()) {
      localStorage.removeItem('signupOTP');
      return false;
    }
    
    if (stored.otp === otp) {
      localStorage.removeItem('signupOTP');
      return true;
    }
    
    return false;
  } catch {
    return false;
  }
}

async function sendOtpEmail(email, otp) {
  if (!window.emailjs) {
    throw new Error('EmailJS not loaded');
  }
  
  const params = {
    to_email: email,
    otp_code: otp,
    app_name: 'MESS-MATE',
    expiry_time: new Date(Date.now() + 15 * 60 * 1000).toLocaleString()
  };
  
  return window.emailjs.send('service_64jyzq6', 'template_clgx4oc', params, '8dyObXNkH9b_b0pxk');
}