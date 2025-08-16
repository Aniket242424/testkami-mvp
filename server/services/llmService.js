const OpenAI = require('openai');

class LLMService {
  constructor() {
    this.openai = null;
    this.initializeOpenAI();
  }

  initializeOpenAI() {
    try {
      if (process.env.OPENAI_API_KEY) {
        this.openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY
        });
        console.log('✅ OpenAI client initialized successfully');
      } else {
        console.warn('⚠️ OPENAI_API_KEY not found, using fallback mode');
      }
    } catch (error) {
      console.warn('⚠️ Failed to initialize OpenAI client:', error.message);
    }
  }

  async generateTestScript(testCase, platform) {
    try {
      console.log(`🤖 Generating test script for: "${testCase}" (${platform})`);

      // Check if OpenAI is available
      if (!this.openai) {
        console.warn('OpenAI not available, using fallback script');
        return this.getFallbackScript(testCase, platform);
      }

      const systemPrompt = this.getSystemPrompt(platform);
      const userPrompt = this.getUserPrompt(testCase, platform);

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      });

      const generatedScript = response.choices[0].message.content;
      
      // Parse and validate the generated script
      const parsedScript = this.parseGeneratedScript(generatedScript, platform);
      
      console.log(`✅ Test script generated successfully`);
      
      return parsedScript;

    } catch (error) {
      console.error('LLM service error:', error);
      
      // Fallback to mock script if OpenAI fails
      if (error.code === 'insufficient_quota' || error.code === 'invalid_api_key') {
        console.warn('OpenAI API error, using fallback script');
        return this.getFallbackScript(testCase, platform);
      }
      
      throw new Error(`Failed to generate test script: ${error.message}`);
    }
  }

  getSystemPrompt(platform) {
    const basePrompt = `You are an expert test automation engineer specializing in ${platform} testing. 
Your task is to convert natural language test cases into structured Appium test scripts.

Key requirements:
1. Generate valid JavaScript/Node.js code using Appium WebDriver
2. Include proper error handling and assertions
3. Add meaningful comments for each step
4. Use best practices for ${platform} automation
5. Return ONLY the JavaScript code, no explanations or markdown formatting
6. Include screenshot capture at key verification points
7. Add proper waits and timeouts for element interactions

Platform-specific guidelines:
`;

    if (platform === 'android') {
      return basePrompt + `
- Use Android-specific locators (resource-id, accessibility-id, xpath)
- Include Android-specific capabilities and setup
- Handle Android permissions and system dialogs
- Use Android-specific gestures and interactions`;
    } else if (platform === 'ios') {
      return basePrompt + `
- Use iOS-specific locators (accessibility-id, predicate, xpath)
- Include iOS-specific capabilities and setup
- Handle iOS permissions and alerts
- Use iOS-specific gestures and interactions`;
    } else {
      return basePrompt + `
- Use web-specific locators (id, css, xpath)
- Include web-specific capabilities and setup
- Handle web-specific elements and interactions
- Use web-specific waits and timeouts`;
    }
  }

  getUserPrompt(testCase, platform) {
    return `Convert the following test case into an Appium test script for ${platform}:

Test Case: "${testCase}"

Requirements:
1. Create a complete test function that can be executed
2. Include proper setup and teardown
3. Add screenshots at verification points
4. Include detailed logging
5. Handle common error scenarios
6. Use appropriate waits and timeouts

Generate the complete test script:`;
  }

  parseGeneratedScript(generatedScript, platform) {
    try {
      // Clean up the generated script
      let cleanedScript = generatedScript.trim();
      
      // Remove markdown code blocks if present
      cleanedScript = cleanedScript.replace(/```javascript/g, '').replace(/```/g, '');
      
      // Ensure it starts with proper function declaration
      if (!cleanedScript.includes('async function') && !cleanedScript.includes('describe')) {
        cleanedScript = `async function runTest() {\n${cleanedScript}\n}`;
      }
      
      // Add platform-specific imports and setup
      const scriptWithImports = this.addPlatformImports(cleanedScript, platform);
      
      return {
        code: scriptWithImports,
        platform: platform,
        generatedAt: new Date().toISOString(),
        version: '1.0.0'
      };

    } catch (error) {
      console.error('Script parsing error:', error);
      return this.getFallbackScript(testCase, platform);
    }
  }

  addPlatformImports(script, platform) {
    const imports = [
      "const { remote } = require('webdriverio');",
      "const fs = require('fs');",
      "const path = require('path');"
    ];

    if (platform === 'android') {
      imports.push("// Android-specific imports");
    } else if (platform === 'ios') {
      imports.push("// iOS-specific imports");
    } else {
      imports.push("// Web-specific imports");
    }

    return imports.join('\n') + '\n\n' + script;
  }

  getFallbackScript(testCase, platform) {
    // Mock script for when OpenAI is not available
    const mockScript = `
const { remote } = require('webdriverio');
const fs = require('fs');
const path = require('path');

async function runTest() {
  let driver;
  
  try {
    console.log('🚀 Starting test execution...');
    
    // Setup capabilities based on platform
    const capabilities = ${this.getPlatformCapabilities(platform)};
    
    // Initialize driver
    driver = await remote({
      path: '/wd/hub',
      port: 4723,
      capabilities: capabilities
    });
    
    console.log('📱 App launched successfully');
    
    // Execute test steps based on test case
    ${this.generateMockSteps(testCase, platform)}
    
    console.log('✅ Test completed successfully');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    throw error;
  } finally {
    if (driver) {
      await driver.deleteSession();
    }
  }
}

module.exports = { runTest };
`;

    return {
      code: mockScript,
      platform: platform,
      generatedAt: new Date().toISOString(),
      version: '1.0.0',
      isFallback: true
    };
  }

  getPlatformCapabilities(platform) {
    if (platform === 'android') {
      return `{
        platformName: 'Android',
        automationName: 'UiAutomator2',
        deviceName: 'Android Emulator',
        app: '/path/to/app.apk',
        noReset: false
      }`;
    } else if (platform === 'ios') {
      return `{
        platformName: 'iOS',
        automationName: 'XCUITest',
        deviceName: 'iPhone Simulator',
        app: '/path/to/app.app',
        noReset: false
      }`;
    } else {
      return `{
        browserName: 'chrome',
        'goog:chromeOptions': {
          args: ['--no-sandbox', '--disable-dev-shm-usage']
        }
      }`;
    }
  }

  generateMockSteps(testCase, platform) {
    const steps = [];
    
    // Generate basic steps based on common test patterns
    if (testCase.toLowerCase().includes('login')) {
      steps.push(`
    // Step 1: Navigate to login screen
    console.log('Step 1: Navigating to login screen');
    ${platform === 'web' ? 'await driver.url("https://example.com/login");' : '// Navigate to login screen'}
    
    // Step 2: Enter username
    console.log('Step 2: Entering username');
    const usernameField = ${this.getLocator('username', platform)};
    await usernameField.setValue('testuser@example.com');
    
    // Step 3: Enter password
    console.log('Step 3: Entering password');
    const passwordField = ${this.getLocator('password', platform)};
    await passwordField.setValue('password123');
    
    // Step 4: Click login button
    console.log('Step 4: Clicking login button');
    const loginButton = ${this.getLocator('login', platform)};
    await loginButton.click();
    
    // Step 5: Verify successful login
    console.log('Step 5: Verifying successful login');
    const dashboard = ${this.getLocator('dashboard', platform)};
    await dashboard.waitForDisplayed({ timeout: 10000 });
    
    // Take screenshot
    await driver.saveScreenshot('./screenshots/login_success.png');
    console.log('📸 Screenshot saved: login_success.png');
      `);
    } else {
      steps.push(`
    // Generic test steps
    console.log('Executing test case: ${testCase}');
    
    // Add your specific test steps here
    await driver.pause(2000);
    
    // Take screenshot
    await driver.saveScreenshot('./screenshots/test_result.png');
    console.log('📸 Screenshot saved: test_result.png');
      `);
    }
    
    return steps.join('\n');
  }

  getLocator(elementType, platform) {
    if (platform === 'android') {
      const locators = {
        username: "await driver.$('~username_input')",
        password: "await driver.$('~password_input')",
        login: "await driver.$('~login_button')",
        dashboard: "await driver.$('~dashboard_container')"
      };
      return locators[elementType] || "await driver.$('~element')";
    } else if (platform === 'ios') {
      const locators = {
        username: "await driver.$('-ios predicate string:type == \"XCUIElementTypeTextField\" AND accessibilityIdentifier == \"username_input\"')",
        password: "await driver.$('-ios predicate string:type == \"XCUIElementTypeSecureTextField\" AND accessibilityIdentifier == \"password_input\"')",
        login: "await driver.$('-ios predicate string:type == \"XCUIElementTypeButton\" AND accessibilityIdentifier == \"login_button\"')",
        dashboard: "await driver.$('-ios predicate string:type == \"XCUIElementTypeOther\" AND accessibilityIdentifier == \"dashboard_container\"')"
      };
      return locators[elementType] || "await driver.$('-ios predicate string:type == \"XCUIElementTypeOther\"')";
    } else {
      const locators = {
        username: "await driver.$('#username')",
        password: "await driver.$('#password')",
        login: "await driver.$('#login-button')",
        dashboard: "await driver.$('.dashboard')"
      };
      return locators[elementType] || "await driver.$('.element')";
    }
  }
}

module.exports = new LLMService();
