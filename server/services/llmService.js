const { GoogleGenerativeAI } = require('@google/generative-ai');

class LLMService {
  constructor() {
    this.genAI = null;
    const useGemini = String(process.env.USE_GEMINI || '').toLowerCase() === 'true';
    if (useGemini && process.env.GEMINI_API_KEY) {
      try {
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        console.log('✅ Gemini API enabled for test generation');
      } catch (e) {
        console.log('⚠️ Failed to initialize Gemini. Falling back to local parsing.');
        this.genAI = null;
      }
    } else {
      console.log('ℹ️ Gemini disabled or API key missing. Using fallback generator.');
    }
  }

  initializeGemini() {}

  async generateTestScript(testCase, platform) {
    try {
      console.log(`🤖 Generating test script for: "${testCase}" (${platform})`);
      if (this.genAI) {
        try {
          const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-pro';
          const model = this.genAI.getGenerativeModel({ model: modelName });
          const prompt = `Convert the following natural language mobile test into a concise WebdriverIO Appium script.\n` +
            `- Platform: ${platform}\n` +
            `- Prefer driver.$('~ACCESSIBILITY') for accessibility labels; otherwise use driver.$(\"android=new UiSelector().text(\\\"TEXT\\\")\").\n` +
            `- Include short waits (driver.pause(500-1000)) between actions.\n` +
            `- Only output executable JS containing an async function executeTest() { ... } and a call to executeTest();\n` +
            `Test Steps:\n${testCase}`;
          const res = await model.generateContent(prompt);
          const text = (res && res.response && res.response.text) ? res.response.text() : '';
          if (text && text.includes('executeTest')) {
            return { success: true, code: text, source: 'gemini' };
          }
          console.log('⚠️ Gemini returned no executable script. Falling back.');
        } catch (e) {
          console.log('⚠️ Gemini generation failed, using fallback:', e.message);
        }
      }

      const script = this.generateFallbackScript(testCase, platform);
      return { success: true, code: script, source: this.genAI ? 'gemini-fallback' : 'fallback-intelligent' };
    } catch (error) {
      console.error('❌ Test script generation failed:', error);
      throw new Error(`Failed to generate test script: ${error.message}`);
    }
  }

  generateFallbackScript(testCase, platform) {
    const actions = this.parseNaturalLanguageToSteps(testCase);
    let script = `
// Generated test script for: "${testCase}"
// Platform: ${platform}

async function executeTest() {
  try {
    console.log('🧪 Starting test execution...');
    await driver.pause(3000);
`;

    actions.forEach((action, index) => {
      script += `
    // Step ${index + 1}: ${action.description}
    ${action.code}
    await driver.pause(800);
`;
    });

    script += `
    console.log('✅ Test completed successfully');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    throw error;
  }
}

executeTest();
`;

    return script;
  }

  parseNaturalLanguageToSteps(testCase) {
    const steps = [];

    const parts = String(testCase)
      .split(/\r?\n|;|\.|\u2022|\-/)
      .map(s => s.trim())
      .filter(Boolean);

    const addClick = (target) => steps.push({
      description: `Click on ${target}`,
      code: `await driver.$('~${target}').click();`
    });

    for (const lineRaw of (parts.length ? parts : [testCase])) {
      const line = lineRaw.trim();
      const lower = line.toLowerCase();

      if (/back\s*button/.test(lower) || /(go\s*back|back)\b/.test(lower)) {
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

      if (/(^enter\b|^type\b|\binput\b)/.test(lower)) {
        // Support formats like: Enter Text - "value" or Enter "value"
        const value = this.extractValue(line);
        const target = this.extractTarget(line);
        const resolvedTarget = (!target || /^text(field)?$/i.test(target)) ? 'input' : target;
        steps.push({ description: `Enter text`, code: `await driver.$('~${resolvedTarget}').setValue('${value}');` });
        continue;
      }

      if (/(verify|check|confirm)/.test(lower)) {
        const quoted = this.extractValue(line);
        if (quoted) {
          // For text verification, check if it's in an input field or as displayed text
          steps.push({ 
            description: `Verify ${quoted} is displayed`,
            type: 'verify',
            target: quoted,
            code: `// Check if text is in input field or displayed as text
const inputField = await driver.$("android=new UiSelector().className(\"android.widget.EditText\")");
const inputText = await inputField.getText();
if (inputText.includes("${quoted}")) {
  console.log("✅ Text found in input field:", inputText);
} else {
  // Try to find as displayed text
  await driver.$("android=new UiSelector().textContains(\"${quoted}\")").waitForDisplayed({ timeout: 5000 });
  console.log("✅ Text found as displayed element");
}`
          });
        } else {
          const target = this.extractTarget(line) || 'element';
          steps.push({ description: `Verify ${target} is displayed`,
            code: `await driver.$('~${target}').waitForDisplayed({ timeout: 5000 });` });
        }
        continue;
      }

      const target = this.extractTarget(line) || line.trim();
      addClick(target);
    }

    return steps;
  }

  extractTarget(testCase) {
    const patterns = [
      /click\s+(?:on\s+)?(.+)/i,
      /tap\s+(?:on\s+)?(.+)/i,
      /navigate\s+to\s+(.+)/i,
      /go\s+to\s+(.+)/i,
      /open\s+(.+)/i,
      /verify\s+(.+)/i,
      /check\s+(.+)/i,
      /enter\s+text\s*(?:-|:)\s*([^"]+)/i,
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

    const tokens = String(testCase).split(/\s+/).filter(w => w && !/(click|tap|on|the|a|to|navigate|go|open|enter|text|type|input|verify|check)/i.test(w));
    return tokens.join(' ').trim();
  }

  extractValue(testCase) {
    const patterns = [
      /enter\s+"([^"]+)"/i,
      /type\s+"([^"]+)"/i,
      /input\s+"([^"]+)"/i,
      /enter\s+'([^']+)'/i,
      /type\s+'([^']+)'/i,
      /input\s+'([^']+)'/i,
      /enter\s+text\s*(?:-|:)\s*"([^"]+)"/i,
      /enter\s+text\s*(?:-|:)\s*'([^']+)'/i
    ];

    for (const pattern of patterns) {
      const match = String(testCase).match(pattern);
      if (match) return match[1];
    }

    return '';
  }

  extractWaitTime(testCase) {
    const patterns = [
      /wait\s+(\d+)\s*seconds?/i,
      /wait\s+(\d+)s/i,
      /wait\s*for\s+(\d+)\s*seconds?/i,
      /wait\s*for\s+(\d+)s/i
    ];

    for (const pattern of patterns) {
      const match = testCase.match(pattern);
      if (match) return parseInt(match[1]) * 1000;
    }

    return 2000;
  }
}

module.exports = new LLMService();
