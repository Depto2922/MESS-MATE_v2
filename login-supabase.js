// login-supabase.js
// Updated login functionality using Supabase

document.addEventListener('DOMContentLoaded', async () => {
  // Wait for auth service to initialize
  await new Promise(resolve => {
    const checkAuth = () => {
      if (typeof auth !== 'undefined') {
        resolve();
      } else {
        setTimeout(checkAuth, 100);
      }
    };
    checkAuth();
  });

  // Elements
  const showSignupBtn = document.getElementById('show-signup');
  const showLoginBtn = document.getElementById('show-login');
  const signupForm = document.getElementById('signup-form');
  const loginForm = document.getElementById('login-form');
  const signupError = document.getElementById('signup-error');
  const loginError = document.getElementById('login-error');

  const postAuthSection = document.getElementById('post-auth-section');
  const chooseCreateBtn = document.getElementById('choose-create');
  const chooseJoinBtn = document.getElementById('choose-join');
  const proceedDashboardBtn = document.getElementById('proceed-dashboard');

  const createMessForm = document.getElementById('create-mess-form');
  const joinMessForm = document.getElementById('join-mess-form');
  const createMessError = document.getElementById('create-mess-error');
  const joinMessError = document.getElementById('join-mess-error');

  function show(el) { if (el) el.style.display = ''; }
  function hide(el) { if (el) el.style.display = 'none'; }

  function resetErrors() {
    if (signupError) signupError.textContent = '';
    if (loginError) loginError.textContent = '';
    if (createMessError) createMessError.textContent = '';
    if (joinMessError) joinMessError.textContent = '';
  }

  // Check initial state
  if (auth.isAuthenticated() && auth.getCurrentMess()) {
    window.location.href = 'index.html';
    return;
  }

  if (auth.isAuthenticated() && !auth.getCurrentMess()) {
    // Logged in but no mess selected
    const authSection = document.getElementById('auth-section');
    hide(authSection);
    show(postAuthSection);
    hide(createMessForm);
    hide(joinMessForm);
    show(chooseCreateBtn);
    show(chooseJoinBtn);
    hide(proceedDashboardBtn);
  } else {
    // No user yet
    const authSection = document.getElementById('auth-section');
    show(authSection);
    hide(postAuthSection);
    showLogin();
  }

  // Toggle helpers
  function showSignup() {
    resetErrors();
    show(signupForm);
    hide(loginForm);
  }
  
  function showLogin() {
    resetErrors();
    hide(signupForm);
    show(loginForm);
  }

  if (showSignupBtn) showSignupBtn.addEventListener('click', showSignup);
  if (showLoginBtn) showLoginBtn.addEventListener('click', showLogin);

  // OTP functionality (keeping existing EmailJS implementation)
  const sendOtpBtn = document.getElementById('send-otp');
  const signupOtpInput = document.getElementById('signup-otp');
  const otpStatus = document.getElementById('otp-status');
  let otpCooldownUntil = 0;

  function setOtpStatus(msg, ok = false) {
    if (otpStatus) {
      otpStatus.textContent = msg;
      otpStatus.style.color = ok ? '#b7f7b7' : '#ffb3b3';
    }
  }

  function remainingCooldown() {
    const now = Date.now();
    return Math.max(0, otpCooldownUntil - now);
  }

  function startCooldown(ms) {
    otpCooldownUntil = Date.now() + ms;
  }

  // Initialize EmailJS
  if (window.emailjs) {
    window.emailjs.init('8dyObXNkH9b_b0pxk');
  }

  if (sendOtpBtn) {
    sendOtpBtn.addEventListener('click', async () => {
      const emailEl = document.getElementById('signup-email');
      const email = emailEl ? emailEl.value.trim() : '';
      if (!email) {
        setOtpStatus('Please enter your email first.');
        return;
      }
      const rem = remainingCooldown();
      if (rem > 0) {
        setOtpStatus(`Please wait ${Math.ceil(rem/1000)}s before requesting another OTP.`);
        return;
      }
      const otp = genOTP();
      try {
        await sendOtpEmail(email, otp);
        storeOTP(email, otp);
        setOtpStatus('OTP sent! Please check your email.', true);
        startCooldown(90 * 1000);
      } catch (err) {
        console.error('OTP send failed', err);
        const detail = (err && (err.text || err.message)) ? (err.text || err.message) : 'Please try again later.';
        setOtpStatus(`Failed to send OTP: ${detail}`);
      }
    });
  }

  // Signup with Supabase
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      resetErrors();
      
      const name = document.getElementById('signup-name').value.trim();
      const id = document.getElementById('signup-id').value.trim();
      const email = document.getElementById('signup-email').value.trim();
      const password = document.getElementById('signup-password').value;
      const enteredOtp = signupOtpInput ? signupOtpInput.value.trim() : '';

      if (!name || !id || !email || !password || password.length < 6) {
        if (signupError) signupError.textContent = 'Please fill all fields. Password must be at least 6 characters.';
        return;
      }

      // Verify OTP
      const rec = getStoredOTP();
      if (!rec || rec.email !== email || rec.expiry < Date.now() || hashOTP(enteredOtp) !== rec.h) {
        setOtpStatus('Invalid or expired OTP.');
        return;
      }
      clearStoredOTP();

      // Sign up with Supabase
      const { data, error } = await auth.signUp(email, password, name, id);
      
      if (error) {
        if (signupError) signupError.textContent = error.message;
        return;
      }

      // Show mess selection
      const authSection = document.getElementById('auth-section');
      hide(authSection);
      show(postAuthSection);
      hide(createMessForm);
      hide(joinMessForm);
      show(chooseCreateBtn);
      show(chooseJoinBtn);
      hide(proceedDashboardBtn);
    });
  }

  // Login with Supabase
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      resetErrors();
      
      const loginIdOrEmail = document.getElementById('login-id').value.trim();
      const password = document.getElementById('login-password').value;

      const { data, error } = await auth.signIn(loginIdOrEmail, password);
      
      if (error) {
        if (loginError) loginError.textContent = error.message;
        return;
      }

      // Check if user already has a mess
      if (auth.getCurrentMess()) {
        window.location.href = 'index.html';
        return;
      }

      // Show mess selection
      const authSection = document.getElementById('auth-section');
      hide(authSection);
      show(postAuthSection);
      hide(createMessForm);
      hide(joinMessForm);
      show(chooseCreateBtn);
      show(chooseJoinBtn);
      hide(proceedDashboardBtn);
    });
  }

  // Choose create/join
  if (chooseCreateBtn) chooseCreateBtn.addEventListener('click', () => {
    resetErrors();
    show(createMessForm);
    hide(joinMessForm);
  });
  
  if (chooseJoinBtn) chooseJoinBtn.addEventListener('click', () => {
    resetErrors();
    show(joinMessForm);
    hide(createMessForm);
  });

  // Create mess
  if (createMessForm) {
    createMessForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      resetErrors();
      
      const messName = document.getElementById('create-mess-id').value.trim();
      const messPassword = document.getElementById('create-mess-password').value;
      
      if (!messName || !messPassword) {
        if (createMessError) createMessError.textContent = 'Please provide Mess name and password.';
        return;
      }

      const { data, error } = await auth.createMess(messName, messPassword);
      
      if (error) {
        if (createMessError) createMessError.textContent = error.message;
        return;
      }

      window.location.href = 'index.html';
    });
  }

  // Join mess
  if (joinMessForm) {
    joinMessForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      resetErrors();
      
      const messName = document.getElementById('join-mess-id').value.trim();
      const messPassword = document.getElementById('join-mess-password').value;

      const { data, error } = await auth.joinMess(messName, messPassword);
      
      if (error) {
        if (joinMessError) joinMessError.textContent = error.message;
        return;
      }

      window.location.href = 'index.html';
    });
  }

  if (proceedDashboardBtn) {
    proceedDashboardBtn.addEventListener('click', () => {
      if (auth.getCurrentMess()) {
        window.location.href = 'index.html';
      }
    });
  }

  // Clear data functionality
  const clearLink = document.getElementById('clear-local-data');
  if (clearLink) {
    clearLink.addEventListener('click', async (e) => {
      e.preventDefault();
      if (confirm('This will sign you out and clear local data. Continue?')) {
        await auth.signOut();
        localStorage.clear();
        window.location.href = 'login.html';
      }
    });
  }
});

// OTP helper functions (keeping existing implementation)
function genOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function hashOTP(otp) {
  let h = 0;
  for (let i = 0; i < otp.length; i++) h = ((h << 5) - h) + otp.charCodeAt(i);
  return String(h);
}

function storeOTP(email, otp, ttlMs = 15 * 60 * 1000) {
  const expiry = Date.now() + ttlMs;
  const record = { email, h: hashOTP(otp), expiry };
  localStorage.setItem('signupOTP', JSON.stringify(record));
}

function getStoredOTP() {
  try { return JSON.parse(localStorage.getItem('signupOTP')); } catch { return null; }
}

function clearStoredOTP() {
  localStorage.removeItem('signupOTP');
}

function sendOtpEmail(email, otp) {
  const expiry_time = new Date(Date.now() + 15 * 60 * 1000).toLocaleString();
  const params = {
    to_email: email,
    otp_code: otp,
    passcode: otp,
    app_name: 'MESS-MATE',
    expiry_time,
    time: expiry_time,
    message: `Your verification code is ${otp} for MESS-MATE. It expires at ${expiry_time}. Do not share this code.`
  };
  if (!window.emailjs) {
    throw new Error('EmailJS SDK not loaded');
  }
  return window.emailjs.send('service_64jyzq6', 'template_clgx4oc', params, '8dyObXNkH9b_b0pxk');
}