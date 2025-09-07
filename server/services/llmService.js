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
    const steps = [];

    // Split into lines/commands
    const parts = String(testCase)
      .split(/\r?\n|;|\.|\u2022|\-/)
      .map(s => s.trim())
      .filter(Boolean);

    const addClick = (target) => steps.push({
      description: `Click on ${target}`,
      code: `await driver.$('~${target}').click();`
    });

    for (const line of (parts.length ? parts : [testCase])) {
      const lower = line.toLowerCase();

      if (/(go\s*back|back)/i.test(lower)) {
        steps.push({ description: 'Go back', code: `await driver.back();` });
        continue;
      }

      if (/wait/.test(lower)) {
        const waitTime = this.extractWaitTime(line);
        steps.push({ description: `Wait for ${waitTime}ms`, code: `await driver.pause(${waitTime});` });
        continue;
      }

      if (/(click|tap|open|navigate\s*to|go\s*to)/.test(lower)) {
        const target = this.extractTarget(line) || 'element';
        addClick(target);
        continue;
      }

      if (/(type|enter|input)/.test(lower)) {
        const target = this.extractTarget(line) || 'input';
        const value = this.extractValue(line);
        steps.push({ description: `Enter text in ${target}`,
          code: `await driver.$('~${target}').setValue('${value}');` });
        continue;
      }

      if (/(verify|check|confirm)/.test(lower)) {
        const target = this.extractTarget(line) || 'element';
        steps.push({ description: `Verify ${target} is displayed`,
          code: `await driver.$('~${target}').waitForDisplayed({ timeout: 5000 });` });
        continue;
      }

      // Fallback: treat as click on the phrase
      const target = this.extractTarget(line) || line.trim();
      addClick(target);
    }

    return steps;
  }

  extractTarget(testCase) {
    // Extract target phrase after common verbs, allow spaces
    const patterns = [
      /click\s+(?:on\s+)?(.+)/i,
      /tap\s+(?:on\s+)?(.+)/i,
      /navigate\s+to\s+(.+)/i,
      /go\s+to\s+(.+)/i,
      /open\s+(.+)/i,
      /verify\s+(.+)/i,
      /check\s+(.+)/i,
      /enter\s+text\s+in\s+(.+)/i,
      /type\s+in\s+(.+)/i
    ];

    for (const pattern of patterns) {
      const match = String(testCase).match(pattern);
      if (match && match[1]) {
        return match[1]
          .replace(/^"|"$/g, '')
          .replace(/^'|'$/g, '')
          .replace(/[\.]$/g, '')
          .trim();
      }
    }

    // Default: take significant words
    const tokens = String(testCase).split(/\s+/).filter(w => w && !/(click|tap|on|the|a|to|navigate|go|open)/i.test(w));
    return tokens.join(' ').trim();
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
