const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'NODE_ENV'
];

const optionalEnvVars = [
  'STRIPE_SECRET_KEY',
  'STRIPE_PUBLISHABLE_KEY',
  'EMAIL_HOST',
  'EMAIL_USER',
  'EMAIL_PASS',
  'FRONTEND_URL'
];

function checkEnvironmentVariables() {
  console.log('🔍 Checking environment variables...');
  
  const missing = [];
  const warnings = [];
  
  // Check required variables
  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
    } else {
      console.log(`✅ ${varName}: ${varName === 'JWT_SECRET' ? '***' : process.env[varName]}`);
    }
  });
  
  // Check optional variables
  optionalEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      warnings.push(varName);
    } else {
      console.log(`✅ ${varName}: ${varName.includes('SECRET') || varName.includes('PASS') ? '***' : process.env[varName]}`);
    }
  });
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(varName => console.error(`   - ${varName}`));
    process.exit(1);
  }
  
  if (warnings.length > 0) {
    console.warn('⚠️  Missing optional environment variables:');
    warnings.forEach(varName => console.warn(`   - ${varName}`));
  }
  
  console.log('✅ Environment check completed!');
}

if (require.main === module) {
  checkEnvironmentVariables();
}

module.exports = { checkEnvironmentVariables }; 