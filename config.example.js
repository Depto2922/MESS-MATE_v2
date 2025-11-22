// config.example.js
// Copy this file to config.js and update with your Supabase credentials

const CONFIG = {
  SUPABASE_URL: 'https://your-project-ref.supabase.co',
  SUPABASE_ANON_KEY: 'your-anon-key-here',
  
  // EmailJS configuration (for OTP)
  EMAILJS_PUBLIC_KEY: '8dyObXNkH9b_b0pxk',
  EMAILJS_SERVICE_ID: 'service_64jyzq6',
  EMAILJS_TEMPLATE_ID: 'template_clgx4oc',
  
  // App settings
  APP_NAME: 'MESS-MATE',
  OTP_EXPIRY_MINUTES: 15,
  OTP_COOLDOWN_SECONDS: 90
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
} else {
  window.CONFIG = CONFIG;
}