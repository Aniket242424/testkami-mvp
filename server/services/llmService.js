const { GoogleGenerativeAI } = require('@google/generative-ai');

class LLMService {
  constructor() {
    this.genAI = null;
    // Temporarily disable Gemini API to test emulator functionality
    console.log('⚠️ Gemini API temporarily disabled for emulator testing');
    console.log('🔄 Using intelligent fallback script generation only');
  }

  initializeGemini() {
    // Temporarily skip Gemini initialization
    console.log('⚠️ Skipping Gemini API initialization for emulator testing');
  }

  async generateTestScript(testCase, platform) {
    try {
      console.log(`🤖 Generating test script for: "${testCase}" (${platform})`);
      
      // Skip Gemini API entirely and go straight to fallback
      console.log('🔄 Using intelligent fallback script generation...');
      
      const script = this.generateFallbackScript(testCase, platform);
      
      return {
        success: true,
        code: script,
        source: 'fallback-intelligent'
      };
      
    } catch (error) {
      console.error('❌ Test script generation failed:', error);
      throw new Error(`Failed to generate test script: ${error.message}`);
    }
  }

  generateFallbackScript(testCase, platform) {
    // Parse the test case to understand what action is needed
    const testCaseLower = testCase.toLowerCase();
    
    // Extract common actions from natural language
    const actions = this.parseNaturalLanguageToSteps(testCase);
    
    let script = `
// Generated test script for: "${testCase}"
// Platform: ${platform}

async function executeTest() {
  try {
    console.log('🧪 Starting test execution...');
    
    // Wait for app to load
    await driver.pause(3000);
    
`;

    // Add specific actions based on parsed steps
    actions.forEach((action, index) => {
      script += `
    // Step ${index + 1}: ${action.description}
    ${action.code}
    await driver.pause(1000);
`;
    });

    script += `
    console.log('✅ Test completed successfully');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    throw error;
  }
}

// Execute the test
executeTest();
`;

    return script;
  }

  parseNaturalLanguageToSteps(testCase) {
    const testCaseLower = testCase.toLowerCase();
    const steps = [];

    // Click actions
    if (testCaseLower.includes('click') || testCaseLower.includes('tap')) {
      const target = this.extractTarget(testCase);
      steps.push({
        description: `Click on ${target}`,
        code: `await driver.$('~${target}').click();`
      });
    }

    // Input/type actions
    if (testCaseLower.includes('type') || testCaseLower.includes('enter') || testCaseLower.includes('input')) {
      const target = this.extractTarget(testCase);
      const value = this.extractValue(testCase);
      steps.push({
        description: `Enter text in ${target}`,
        code: `await driver.$('~${target}').setValue('${value}');`
      });
    }

    // Wait actions
    if (testCaseLower.includes('wait')) {
      const waitTime = this.extractWaitTime(testCase);
      steps.push({
        description: `Wait for ${waitTime}ms`,
        code: `await driver.pause(${waitTime});`
      });
    }

    // Navigate actions
    if (testCaseLower.includes('navigate') || testCaseLower.includes('go to') || testCaseLower.includes('open')) {
      const target = this.extractTarget(testCase);
      steps.push({
        description: `Navigate to ${target}`,
        code: `await driver.$('~${target}').click();`
      });
    }

    // Verify actions
    if (testCaseLower.includes('verify') || testCaseLower.includes('check') || testCaseLower.includes('confirm')) {
      const target = this.extractTarget(testCase);
      steps.push({
        description: `Verify ${target} is displayed`,
        code: `await driver.$('~${target}').waitForDisplayed({ timeout: 5000 });`
      });
    }

    // Exit/close actions
    if (testCaseLower.includes('exit') || testCaseLower.includes('close') || testCaseLower.includes('back')) {
      steps.push({
        description: 'Go back or exit',
        code: `await driver.back();`
      });
    }

    // If no specific actions found, create a generic click action
    if (steps.length === 0) {
      const target = this.extractTarget(testCase) || 'main_element';
      steps.push({
        description: `Click on ${target}`,
        code: `await driver.$('~${target}').click();`
      });
    }

    return steps;
  }

  extractTarget(testCase) {
    // Extract target element from test case
    const patterns = [
      /click on (\w+)/i,
      /tap on (\w+)/i,
      /click (\w+)/i,
      /tap (\w+)/i,
      /navigate to (\w+)/i,
      /go to (\w+)/i,
      /open (\w+)/i,
      /verify (\w+)/i,
      /check (\w+)/i,
      /enter text in (\w+)/i,
      /type in (\w+)/i
    ];

    for (const pattern of patterns) {
      const match = testCase.match(pattern);
      if (match) {
        return match[1];
      }
    }

    // If no pattern matches, try to extract any word that might be a target
    const words = testCase.split(' ').filter(word => word.length > 3);
    return words[0] || 'element';
  }

  extractValue(testCase) {
    // Extract value for input actions
    const patterns = [
      /enter "([^"]+)"/i,
      /type "([^"]+)"/i,
      /input "([^"]+)"/i,
      /enter '([^']+)'/i,
      /type '([^']+)'/i,
      /input '([^']+)'/i
    ];

    for (const pattern of patterns) {
      const match = testCase.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return 'test_value';
  }

  extractWaitTime(testCase) {
    // Extract wait time from test case
    const patterns = [
      /wait (\d+) seconds?/i,
      /wait (\d+)s/i,
      /wait for (\d+) seconds?/i,
      /wait for (\d+)s/i
    ];

    for (const pattern of patterns) {
      const match = testCase.match(pattern);
      if (match) {
        return parseInt(match[1]) * 1000; // Convert to milliseconds
      }
    }

    return 2000; // Default wait time
  }
}

module.exports = new LLMService();
