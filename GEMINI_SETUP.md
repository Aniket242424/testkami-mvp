# Gemini AI Setup for Testkami

## 🔑 Setting up Gemini API Key

To enable AI-powered test script generation, you need to set up your Gemini API key:

### 1. Get Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key

### 2. Configure Environment Variable

Create a `.env` file in the `server` directory:

```bash
# server/.env
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### 3. Restart the Server

After adding the API key, restart the server:

```bash
cd server
node index.js
```

## 🚀 Benefits of Using Gemini

- **Better Test Script Generation**: Gemini provides more accurate and context-aware test scripts
- **Natural Language Understanding**: Better parsing of complex test scenarios
- **Platform-Specific Code**: Generates appropriate code for Android, iOS, and Web platforms
- **Error Handling**: Includes proper error handling and assertions
- **Fallback Support**: Falls back to mock scripts if API is unavailable

## 📝 Example Usage

With Gemini enabled, you can write natural language test cases like:

```
"Click on login button, enter username 'testuser', enter password 'password123', click submit, verify dashboard loads"
```

And Gemini will generate proper Appium test scripts with:
- Element locators
- Wait strategies
- Error handling
- Screenshots
- Proper assertions

## 🔧 Troubleshooting

If you see "Gemini not available, using fallback script":
1. Check that your API key is correct
2. Ensure the `.env` file is in the server directory
3. Restart the server after adding the key
4. Check your Gemini API quota

## 💡 Tips

- Keep your API key secure and never commit it to version control
- The system will automatically fall back to mock scripts if Gemini is unavailable
- Test scripts are generated in real-time for each test execution
