const fs = require('fs');
const path = require('path');

// Your Gemini API key
const GEMINI_API_KEY = 'AIzaSyCbuEZaSavQ1zCZNeU14uAYL1UkqAEPpJY';

// Create .env file content
const envContent = `# Gemini AI API Key for test script generation
GEMINI_API_KEY=${GEMINI_API_KEY}

# Email Configuration (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Server Configuration
PORT=5000
NODE_ENV=development
`;

// Write to server/.env file
const envPath = path.join(__dirname, 'server', '.env');

try {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file created successfully in server directory');
  console.log('🤖 Gemini API key configured');
  console.log('🚀 You can now restart the server to use real AI responses');
} catch (error) {
  console.error('❌ Error creating .env file:', error.message);
  console.log('📝 Please manually create server/.env file with:');
  console.log(`GEMINI_API_KEY=${GEMINI_API_KEY}`);
}
