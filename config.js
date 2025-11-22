// config.js
// Application configuration

// EmailJS configuration
const EMAIL_CONFIG = {
  SERVICE_ID: 'service_64jyzq6',
  TEMPLATE_ID: 'template_clgx4oc',
  PUBLIC_KEY: '8dyObXNkH9b_b0pxk'
};

// Application settings
const APP_CONFIG = {
  NAME: 'MESS-MATE',
  VERSION: '2.0.0',
  OTP_EXPIRY_MINUTES: 15,
  OTP_COOLDOWN_SECONDS: 90
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { EMAIL_CONFIG, APP_CONFIG };
}