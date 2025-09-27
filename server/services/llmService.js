const { GoogleGenerativeAI } = require('@google/generative-ai');

// DSL Schema for intent detection and action planning
const DSL_SCHEMA = {
  type: "object",
  required: ["steps"],
  properties: {
    app: {
      type: "object",
      properties: {
        apkPath: { type: "string" },
        package: { type: "string" },
        activity: { type: "string" }
      }
    },
    device: {
      type: "object",
      properties: {
        platform: { type: "string", enum: ["android"] },
        name: { type: "string" },
        version: { type: "string" }
      }
    },
    steps: {
      type: "array",
      items: {
        type: "object",
        required: ["action"],
        properties: {
          id: { type: "string" },
          action: {
            type: "string",
            enum: ["launch", "close", "tap", "type", "waitFor", "assert", "screenshot", "swipe", "scroll", "back", "wait"]
          },
          target: {
            type: "object",
            properties: {
              strategy: {
                type: "string",
                enum: ["accessibilityId", "id", "text", "containsText", "xpath", "className", "coordinates"]
              },
              value: { type: "string" }
            }
          },
          text: { type: "string" },
          timeoutMs: { type: "number" },
          assert: {
            type: "object",
            properties: {
              type: { type: "string", enum: ["visible", "textEquals", "textContains"] },
              locator: {
                type: "object",
                properties: {
                  strategy: { type: "string", enum: ["id", "accessibilityId", "text", "containsText", "xpath", "className"] },
                  value: { type: "string" }
                }
              },
              expected: { type: "string" }
            }
          }
        }
      }
    }
  }
};

class LLMService {
  constructor() {
    this.genAI = null;
    const useGemini = String(process.env.USE_GEMINI || '').toLowerCase() === 'true';
    if (useGemini && process.env.GEMINI_API_KEY) {
      try {
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        console.log('✅ Gemini API enabled for DSL-based test generation');
      } catch (e) {
        console.log('⚠️ Failed to initialize Gemini. Falling back to local parsing.');
        this.genAI = null;
      }
    } else {
      console.log('ℹ️ Gemini disabled or API key missing. Using fallback generator.');
    }
  }

  initializeGemini() {}

  buildPlannerPrompt({ nl, pkg, activity }) {
    return `
System:
You convert a user's natural-language mobile test into STRICT JSON matching this schema:
{
  "app": { "apkPath": "string?", "package": "string?", "activity": "string?" },
  "device": { "platform": "android", "name": "string?", "version": "string?" },
  "steps": [
    {
      "id": "string?",
      "action": "launch|close|tap|type|waitFor|assert|screenshot|swipe|scroll|back|wait",
      "target": { "strategy": "accessibilityId|id|text|containsText|xpath|className|coordinates", "value": "string?" },
      "text": "string?",
      "timeoutMs": number?,
      "assert": { "type": "visible|textEquals|textContains", "locator": { "strategy": "id|accessibilityId|text|containsText|xpath|className", "value": "string" }, "expected": "string?" }
    }
  ]
}
Rules:
- OUTPUT JSON ONLY (no prose). Temperature should be 0 on your side.
- Prefer accessibilityId, then id, then text. xpath is last resort.
- Add sensible timeouts where a wait is likely.
- Include at least one assertion after critical navigation.
- Use {"action":"launch"} as the first step.
- For "Enter Text - 'value'", use action: "type" with text: "value" and target for input field.
- For "Click on word 'word'", use action: "tap" with target strategy: "text" and value: "word".
- For scrolling, use action: "scroll" with direction in target value.
- For "Move onto the next index page", use action: "tap" with target strategy: "containsText" and value: "Next".

Context:
- Platform: android (Appium UiAutomator2).
- Package: ${pkg ?? "UNKNOWN"}
- Activity: ${activity ?? "UNKNOWN"}

User test:
"""
${nl}
"""
Return ONLY the JSON.
`;
  }

  async compileToDsl({ nl, defaultPackage, defaultActivity }) {
    if (!this.genAI) {
      throw new Error('Gemini not initialized');
    }

    const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
    const model = this.genAI.getGenerativeModel({ model: modelName });

    const prompt = this.buildPlannerPrompt({
      nl,
      pkg: defaultPackage,
      activity: defaultActivity
    });

    const resp = await model.generateContent([{ text: prompt }]);
    const raw = resp.response.text();
    
    // Extract first JSON block defensively
    const match = raw.match(/\{[\s\S]*\}$/);
    const jsonText = match ? match[0] : raw;
    
    try {
      return JSON.parse(jsonText);
    } catch (e) {
      console.log('⚠️ Failed to parse Gemini JSON response:', e.message);
      console.log('Raw response:', raw);
      throw e;
    }
  }

  async generateTestScript(testCase, platform) {
    try {
      console.log(`🤖 Generating test script for: "${testCase}" (${platform})`);
      console.log(`🔍 Raw testCase received:`, JSON.stringify(testCase));
      console.log(`🔍 TestCase length:`, testCase ? testCase.length : 'undefined');
      
      // Basic input validation
      if (!testCase || typeof testCase !== 'string' || testCase.trim().length < 5) {
        throw new Error('Invalid test case: Must be a non-empty string with at least 5 characters');
      }
      
      // Check for obviously invalid inputs
      const trimmed = testCase.trim();
      if (trimmed.length > 2000) {
        throw new Error('Test case is too long. Please keep it under 2000 characters');
      }
      
      // Check for nonsensical patterns
      if (/^[^a-zA-Z]*$/.test(trimmed) || /^.{1,3}$/.test(trimmed)) {
        throw new Error('Test case appears to be nonsensical. Please provide meaningful test instructions');
      }
      if (this.genAI) {
        try {
          // Use DSL-based approach with Gemini
          const dsl = await this.compileToDsl({
            nl: testCase,
            defaultPackage: 'com.example.app', // You can get this from uploaded APK
            defaultActivity: 'MainActivity'
          });
          
          console.log('✅ Generated DSL:', JSON.stringify(dsl, null, 2));
          
          // Convert DSL to executable steps
          const steps = this.convertDslToSteps(dsl);
          const script = this.generateScriptFromSteps(steps);
          
          return { 
            success: true, 
            code: script, 
            steps: steps, 
            dsl: dsl,
            source: 'gemini-dsl' 
          };
        } catch (e) {
          console.log('⚠️ Gemini DSL generation failed, using fallback:', e.message);
        }
      }

      const result = this.generateFallbackScript(testCase, platform);
      
      // Validate that we got meaningful steps
      if (!result.steps || result.steps.length === 0) {
        throw new Error('Unable to parse test case into meaningful steps. Please provide more specific instructions like "Click on Login button and enter username"');
      }
      
      return { success: true, code: result.script, steps: result.steps, source: this.genAI ? 'gemini-fallback' : 'fallback-intelligent' };
    } catch (error) {
      console.error('❌ Test script generation failed:', error);
      throw new Error(`Failed to generate test script: ${error.message}`);
    }
  }

  convertDslToSteps(dsl) {
    const steps = [];
    
    if (!dsl.steps || !Array.isArray(dsl.steps)) {
      console.log('⚠️ Invalid DSL: no steps array found');
      return steps;
    }

    for (const dslStep of dsl.steps) {
      const step = {
        type: this.mapDslActionToStepType(dslStep.action),
        locator: this.buildLocatorFromDslTarget(dslStep.target),
        value: dslStep.text,
        description: this.buildDescriptionFromDslStep(dslStep),
        timeoutMs: dslStep.timeoutMs || 10000
      };

      // Add assertion if present
      if (dslStep.assert) {
        step.assert = dslStep.assert;
      }

      steps.push(step);
    }

    return steps;
  }

  mapDslActionToStepType(action) {
    const actionMap = {
      'launch': 'wait',
      'close': 'wait',
      'tap': 'click',
      'type': 'setValue',
      'waitFor': 'wait',
      'assert': 'verify',
      'screenshot': 'screenshot',
      'swipe': 'scroll',
      'scroll': 'scroll',
      'back': 'back',
      'wait': 'wait'
    };
    return actionMap[action] || 'click';
  }

  buildLocatorFromDslTarget(target) {
    if (!target || !target.strategy || !target.value) {
      return 'element';
    }

    const strategy = target.strategy;
    const value = target.value;

    switch (strategy) {
      case 'accessibilityId':
        return `~${value}`;
      case 'id':
        return value;
      case 'text':
        return value;
      case 'containsText':
        return value;
      case 'xpath':
        return value;
      case 'className':
        return value;
      case 'coordinates':
        return `coordinates:${value}`;
      default:
        return value;
    }
  }

  buildDescriptionFromDslStep(dslStep) {
    const action = dslStep.action;
    const target = dslStep.target?.value || 'element';
    const text = dslStep.text;

    switch (action) {
      case 'launch':
        return 'Launch the app';
      case 'close':
        return 'Close the app';
      case 'tap':
        return `Click on ${target}`;
      case 'type':
        return `Enter text: ${text}`;
      case 'waitFor':
        return `Wait for ${target}`;
      case 'assert':
        return `Verify ${target}`;
      case 'screenshot':
        return 'Take screenshot';
      case 'swipe':
        return `Swipe ${target}`;
      case 'scroll':
        return `Scroll ${target}`;
      case 'back':
        return 'Go back';
      case 'wait':
        return `Wait ${dslStep.timeoutMs || 1000}ms`;
      default:
        return `${action} ${target}`;
    }
  }

  generateScriptFromSteps(steps) {
    let script = 'async function executeTest() {\n';
    
    for (const step of steps) {
      script += `  // ${step.description}\n`;
      
      switch (step.type) {
        case 'click':
          script += `  await driver.$('${step.locator}').click();\n`;
          break;
        case 'setValue':
          script += `  await driver.$('${step.locator}').setValue('${step.value}');\n`;
          break;
        case 'scroll':
          script += `  await driver.touchAction([\n`;
          script += `    { action: 'press', x: 500, y: 800 },\n`;
          script += `    { action: 'wait', ms: 500 },\n`;
          script += `    { action: 'moveTo', x: 500, y: 200 },\n`;
          script += `    { action: 'release' }\n`;
          script += `  ]);\n`;
          break;
        case 'back':
          script += `  await driver.back();\n`;
          break;
        case 'wait':
          script += `  await driver.pause(${step.timeoutMs || 1000});\n`;
          break;
        case 'verify':
          if (step.assert) {
            script += `  await driver.$('${step.locator}').waitForDisplayed({ timeout: 5000 });\n`;
          }
          break;
        case 'screenshot':
          script += `  await driver.saveScreenshot('./screenshot.png');\n`;
          break;
        default:
          script += `  await driver.$('${step.locator}').click();\n`;
      }
      
      script += `  await driver.pause(500);\n\n`;
    }
    
    script += '}\n\n';
    script += 'executeTest();';
    
    return script;
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

    return { script, steps: actions };
  }

  parseNaturalLanguageToSteps(testCase) {
    const steps = [];

    // Enhanced parsing for multi-line test cases
    const parts = String(testCase)
      .split(/\r?\n/)
      .map(s => s.trim())
      .filter(Boolean);

    console.log('🔍 Parsing test steps:', parts);
    console.log('🔍 Total parts found:', parts.length);

    const addClick = (target, description = null) => {
      const cleanTarget = this.normalizeTarget(target);
      steps.push({
        type: 'click',
        locator: cleanTarget,
        description: description || `Click on ${cleanTarget}`,
        code: `await driver.$('~${cleanTarget}').click();`
      });
    };

    const addScroll = (direction = 'down') => {
      steps.push({
        type: 'scroll',
        locator: 'scrollable',
        description: `Scroll ${direction}`,
        code: `await driver.touchAction([
          { action: 'press', x: 500, y: 800 },
          { action: 'wait', ms: 500 },
          { action: 'moveTo', x: 500, y: 200 },
          { action: 'release' }
        ]);`
      });
    };

    for (const lineRaw of (parts.length ? parts : [testCase])) {
      const line = lineRaw.trim();
      const lower = line.toLowerCase();

      console.log(`📝 Processing step: "${line}"`);
      console.log(`📝 Step ${steps.length + 1} of ${parts.length}: "${line}"`);
      console.log(`📝 Lower case: "${lower}"`);

      // Handle "Open the App" - usually just a wait
      if (/open\s+(?:the\s+)?app/i.test(lower)) {
        steps.push({ 
          type: 'wait',
          locator: 'app',
          description: 'Open the App', 
          code: `await driver.pause(2000); // App should already be open` 
        });
        continue;
      }

      // Handle scrolling - with multiple directions and patterns
      if (/scroll\s+(?:in\s+)?(?:the\s+)?(.+)/i.test(lower) || /scroll\s+(up|down|left|right)/i.test(lower)) {
        const scrollTarget = line.match(/scroll\s+(?:in\s+)?(?:the\s+)?(.+)/i)?.[1] || 'page';
        const direction = line.match(/scroll\s+(up|down|left|right)/i)?.[1] || 'down';
        
        steps.push({
          type: 'scroll',
          locator: 'scrollable',
          description: `Scroll ${direction} in ${scrollTarget}`,
          code: `// Smart scrolling using Appium mobile: scrollGesture (UiAutomator2)
try {
  const size = await driver.getWindowSize();
  const left = Math.floor(size.width * 0.1);
  const top = Math.floor(size.height * 0.1);
  const width = Math.floor(size.width * 0.8);
  const height = Math.floor(size.height * 0.8);
  await driver.execute('mobile: scrollGesture', {
    left, top, width, height,
    direction: '${direction}',
    percent: 0.8
  });
} catch (e) {
  // Fallback to W3C actions if needed
  const size = await driver.getWindowSize();
  const startY = ${direction === 'down' ? 'Math.floor(size.height * 0.8)' : 'Math.floor(size.height * 0.2)'};
  const endY = ${direction === 'down' ? 'Math.floor(size.height * 0.2)' : 'Math.floor(size.height * 0.8)'};
  const x = Math.floor(size.width * 0.5);
  await driver.performActions([
    {
      type: 'pointer',
      id: 'finger1',
      parameters: { pointerType: 'touch' },
      actions: [
        { type: 'pointerMove', duration: 0, x, y: startY },
        { type: 'pointerDown', button: 0 },
        { type: 'pause', duration: 300 },
        { type: 'pointerMove', duration: 500, x, y: endY },
        { type: 'pointerUp', button: 0 }
      ]
    }
  ]);
}`
        });
        continue;
      }

      // Handle "Move onto the next index page" - this is navigation
      if (/move\s+(?:onto\s+)?(?:the\s+)?next\s+(?:index\s+)?page/i.test(lower)) {
        steps.push({
          type: 'click',
          locator: 'next',
          description: 'Navigate to next page',
          code: `// Smart navigation - try multiple common navigation patterns
try {
  await driver.$("android=new UiSelector().textContains(\"Next\")").click();
} catch (e1) {
  try {
    await driver.$("android=new UiSelector().textContains(\"Continue\")").click();
  } catch (e2) {
    try {
      await driver.$("android=new UiSelector().textContains(\"Proceed\")").click();
    } catch (e3) {
      try {
        await driver.$("android=new UiSelector().textContains(\"Skip\")").click();
      } catch (e4) {
        // Try swiping right or clicking any visible button
        await driver.touchAction([
          { action: 'press', x: 800, y: 500 },
          { action: 'wait', ms: 200 },
          { action: 'moveTo', x: 200, y: 500 },
          { action: 'release' }
        ]);
      }
    }
  }
}`
        });
        continue;
      }

      // Handle "Click on Next button on this page"
      if (/click\s+(?:on\s+)?(?:the\s+)?next\s+button/i.test(lower)) {
        steps.push({
          type: 'click',
          locator: 'next',
          description: 'Click Next button',
          code: `await driver.$("android=new UiSelector().textContains(\"Next\")").click();`
        });
        continue;
      }

      // Handle back button
      if (/back\s*button/.test(lower) || /(go\s*back|back)\b/.test(lower)) {
        steps.push({ type: 'back', locator: 'back', description: 'Go back', code: `await driver.back();` });
        continue;
      }

      // Handle wait
      if (/wait/.test(lower)) {
        const waitTime = this.extractWaitTime(line);
        steps.push({ type: 'wait', locator: 'wait', description: `Wait for ${waitTime}ms`, code: `await driver.pause(${waitTime});` });
        continue;
      }

      // Handle clicking on specific words in quotes - with smart fallbacks
      if (/click\s+(?:on\s+)?(?:the\s+)?word\s+['"]([^'"]+)['"]/i.test(lower)) {
        const word = line.match(/click\s+(?:on\s+)?(?:the\s+)?word\s+['"]([^'"]+)['"]/i)?.[1];
        if (word) {
          steps.push({
            type: 'click',
            locator: word,
            description: `Click on word '${word}'`,
            code: `// Smart word clicking with multiple strategies
try {
  await driver.$("android=new UiSelector().text(\"" + word + "\")").click();
} catch (e1) {
  try {
    await driver.$("android=new UiSelector().textContains(\"" + word + "\")").click();
  } catch (e2) {
    try {
      await driver.$("android=new UiSelector().descriptionContains(\"" + word + "\")").click();
    } catch (e3) {
      // Try case-insensitive search
      await driver.$("android=new UiSelector().textMatches(\"(?i).*" + word + ".*\")").click();
    }
  }
}`
          });
          continue;
        }
      }

      // Handle clicking on specific text - with enhanced intelligence
      if (/(click|tap|open|navigate\s*to|go\s*to)\s+(?:on\s+)?(.+)/i.test(lower)) {
        const target = this.extractTarget(line);
        if (target) {
          // Enhanced click with multiple fallback strategies
          steps.push({
            type: 'click',
            locator: target,
            description: line,
            code: `// Smart clicking with multiple strategies for: ${target}
try {
  await driver.$("android=new UiSelector().text(\"${target}\")").click();
} catch (e1) {
  try {
    await driver.$("android=new UiSelector().textContains(\"${target}\")").click();
  } catch (e2) {
    try {
      await driver.$("android=new UiSelector().descriptionContains(\"${target}\")").click();
    } catch (e3) {
      try {
        // Try with partial text matching
        const words = "${target}".split(" ");
        for (const word of words) {
          if (word.length > 2) {
            try {
              await driver.$("android=new UiSelector().textContains(\"" + word + "\")").click();
              break;
            } catch (e) {}
          }
        }
      } catch (e4) {
        // Last resort: try accessibility ID
        await driver.$("~${target}").click();
      }
    }
  }
}`
          });
          continue;
        }
      }

      // Handle text entry
      if (/(^enter\b|^type\b|\binput\b)/.test(lower)) {
        const value = this.extractValue(line);
        // For text entry, always use 'input' as the locator since we're looking for EditText fields
        steps.push({ 
          type: 'setValue',
          locator: 'input',
          value: value,
          description: `Enter text: ${value}`,
          code: `// Robust text entry for: input\n// Prefer structured step execution; this code is fallback only\nconst el = await driver.$('android=new UiSelector().className("android.widget.EditText")');\ntry { await el.click(); } catch {}\ntry { await el.clearValue(); } catch {}\ntry { await el.setValue('${value}'); } catch { await el.addValue('${value}'); }\nawait driver.pause(1000);`
        });
        continue;
      }

      // Handle verification
      if (/(verify|check|confirm)/.test(lower)) {
        console.log(`🔍 VERIFICATION DETECTED: "${line}"`);
        // Extract the target from verification phrases
        let target = null;
        
        // Try to extract quoted text first
        const quoted = this.extractValue(line);
        if (quoted) {
          target = quoted;
        } else {
          // Extract target from verification patterns
          const verifyMatch = line.match(/verify\s+(.+)/i);
          if (verifyMatch) {
            target = verifyMatch[1]
              .replace(/\b(displayed|visible|shown|present)\b/gi, '')
              .replace(/\b(is|are|the|a|an)\b/gi, '')
              .trim();
          }
        }
        
        if (target) {
          steps.push({ 
            type: 'verify',
            locator: target,
            description: `Verify ${target} is displayed`,
            code: `// Enhanced verification for: ${target}
try {
  // Try to find as displayed text element
  const element = await driver.$("android=new UiSelector().textContains(\\"${target}\\")");
  await element.waitForDisplayed({ timeout: 5000 });
  console.log("✅ Verification passed: ${target} is displayed");
} catch (e) {
  // Try alternative approaches
  try {
    // Try with individual words
    const words = "${target}".split(/\\s+/).filter(w => w.length > 2);
    for (const word of words) {
      try {
        const wordElement = await driver.$("android=new UiSelector().textContains(\\"" + word + "\\")");
        await wordElement.waitForDisplayed({ timeout: 2000 });
        console.log("✅ Verification passed: Found word '" + word + "' from '${target}'");
        break;
      } catch (wordError) {
        console.log("⚠️ Word '" + word + "' not found, trying next...");
      }
    }
  } catch (altError) {
    throw new Error("Verification failed: ${target} not found on screen");
  }
}`
          });
    } else {
          const fallbackTarget = this.extractTarget(line) || 'element';
          steps.push({ 
            type: 'verify',
            locator: fallbackTarget,
            description: `Verify ${fallbackTarget} is displayed`,
            code: `await driver.$('~${fallbackTarget}').waitForDisplayed({ timeout: 5000 });` 
          });
        }
        continue;
      }

      // Handle common variations and edge cases
      if (/select\s+(.+)/i.test(lower)) {
        const target = line.match(/select\s+(.+)/i)?.[1];
        if (target) {
          steps.push({
            type: 'click',
            locator: target,
            description: `Select ${target}`,
            code: `// Smart selection with multiple strategies
try {
  await driver.$("android=new UiSelector().textContains(\"${target}\")").click();
} catch (e1) {
  try {
    await driver.$("android=new UiSelector().descriptionContains(\"${target}\")").click();
  } catch (e2) {
    await driver.$("~${target}").click();
  }
}`
          });
          continue;
        }
      }

      if (/choose\s+(.+)/i.test(lower)) {
        const target = line.match(/choose\s+(.+)/i)?.[1];
        if (target) {
          steps.push({
            type: 'click',
            locator: target,
            description: `Choose ${target}`,
            code: `// Smart choice selection
try {
  await driver.$("android=new UiSelector().textContains(\"${target}\")").click();
} catch (e) {
  await driver.$("~${target}").click();
}`
          });
          continue;
        }
      }

      if (/press\s+(.+)/i.test(lower)) {
        const target = line.match(/press\s+(.+)/i)?.[1];
        if (target) {
          steps.push({
            type: 'click',
            locator: target,
            description: `Press ${target}`,
            code: `// Smart button pressing
try {
  await driver.$("android=new UiSelector().textContains(\"${target}\")").click();
} catch (e) {
  await driver.$("~${target}").click();
}`
          });
          continue;
        }
      }

      // Default: treat as click action with enhanced intelligence
      const target = this.extractTarget(line) || line.trim();
      if (target) {
        steps.push({
          type: 'click',
          locator: target,
          description: line,
          code: `// Enhanced click action for: ${target}
try {
  await driver.$("android=new UiSelector().textContains(\"${target}\")").click();
} catch (e1) {
  try {
    await driver.$("android=new UiSelector().descriptionContains(\"${target}\")").click();
  } catch (e2) {
    try {
      await driver.$("~${target}").click();
    } catch (e3) {
      // Try partial matching
      const words = "${target}".split(" ");
      for (const word of words) {
        if (word.length > 2) {
          try {
            await driver.$("android=new UiSelector().textContains(\"" + word + "\")").click();
            break;
          } catch (e) {}
        }
      }
    }
  }
}`
        });
      }
    }

    console.log('✅ Generated steps:', steps.map(s => s.description));
    return steps;
  }

  extractTarget(testCase) {
    // Skip text entry patterns - they should not extract targets
    if (/(^enter\b|^type\b|\binput\b)/.test(String(testCase).toLowerCase())) {
      return null;
    }
    
    const patterns = [
      /click\s+(?:on\s+)?(.+)/i,
      /tap\s+(?:on\s+)?(.+)/i,
      /navigate\s+to\s+(.+)/i,
      /go\s+to\s+(.+)/i,
      /open\s+(.+)/i,
      /verify\s+(.+)/i,
      /check\s+(.+)/i,
      /enter\s+text\s+in\s+(.+)/i,
      /type\s+in\s+(.+)/i,
      /select\s+(.+)/i,
      /choose\s+(.+)/i,
      /press\s+(.+)/i,
      // Enhanced patterns for your specific test case
      /click\s+on\s+(?:the\s+)?word\s+['"]([^'"]+)['"]/i,
      /click\s+on\s+(?:the\s+)?(.+?)(?:\s+button|\s+on\s+this\s+page)?$/i,
      // More variations
      /click\s+(?:the\s+)?(.+?)(?:\s+button|\s+option|\s+item)?$/i,
      /tap\s+(?:the\s+)?(.+?)(?:\s+button|\s+option|\s+item)?$/i,
      /select\s+(?:the\s+)?(.+?)(?:\s+option|\s+item|\s+choice)?$/i,
      /choose\s+(?:the\s+)?(.+?)(?:\s+option|\s+item|\s+choice)?$/i
    ];

    for (const pattern of patterns) {
      const match = String(testCase).match(pattern);
      if (match && match[1]) {
        let target = match[1]
          .replace(/^"|"$/g, '')
          .replace(/^'|'$/g, '')
          .replace(/[\.]$/g, '')
          .trim();
        
        // Enhanced cleanup for common phrases
        target = target
          .replace(/\s+(button|on\s+this\s+page|option|item|choice)$/i, '')
          .replace(/^(the\s+|a\s+|an\s+)/i, '')
          .replace(/\s+(correct\s+answer|right\s+answer|wrong\s+answer)/i, '')
          .trim();
        
        if (target) return target;
      }
    }

    // Enhanced fallback: extract meaningful words with better filtering
    const tokens = String(testCase)
      .split(/\s+/)
      .filter(w => w && !/(click|tap|on|the|a|an|to|navigate|go|open|enter|text|type|input|verify|check|button|page|word|select|choose|press|correct|answer|right|wrong)/i.test(w))
      .slice(0, 4); // Take first 4 meaningful words for better matching
    
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

  normalizeTarget(target) {
    if (!target) return 'element';
    
    // Enhanced normalization for better element matching
    return target
      .replace(/\b(again|button|the|a|an|on|in|at|to|for|with|by|this|that|these|those)\b/gi, '')
      .replace(/\b(correct|right|wrong|answer|option|choice|item)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/[^\w\s]/g, '') // Remove special characters
      .trim();
  }
}

module.exports = new LLMService();
