const fs = require('fs-extra');

class InputValidationService {
  constructor() {
    // Common mobile app actions that make sense
    this.validActions = [
      'click', 'tap', 'press', 'touch', 'select', 'choose', 'open', 'close',
      'enter', 'type', 'input', 'fill', 'write', 'send', 'submit',
      'scroll', 'swipe', 'drag', 'pull', 'push', 'move',
      'wait', 'pause', 'sleep', 'delay',
      'verify', 'check', 'assert', 'confirm', 'validate', 'test',
      'navigate', 'go', 'back', 'forward', 'return', 'exit',
      'login', 'logout', 'signin', 'signout', 'register',
      'search', 'find', 'look', 'browse',
      'upload', 'download', 'save', 'delete', 'remove',
      'zoom', 'pinch', 'rotate', 'flip'
    ];

    // Common UI elements that make sense
    this.validElements = [
      'button', 'link', 'menu', 'tab', 'field', 'input', 'textbox', 'box',
      'icon', 'image', 'picture', 'photo', 'logo',
      'list', 'item', 'option', 'choice', 'selection',
      'page', 'screen', 'view', 'window', 'dialog', 'popup', 'modal',
      'header', 'footer', 'sidebar', 'navigation', 'nav',
      'form', 'section', 'area', 'region', 'zone',
      'text', 'label', 'title', 'heading', 'caption',
      'slider', 'toggle', 'switch', 'checkbox', 'radio',
      'dropdown', 'select', 'picker', 'calendar', 'date',
      'search', 'filter', 'sort', 'refresh', 'reload'
    ];

    // Nonsensical patterns that should be rejected
    this.nonsensicalPatterns = [
      /^[^a-zA-Z]*$/, // Only special characters or numbers
      /^.{1,3}$/, // Too short (less than 4 characters)
      /^[a-zA-Z]{1,2}$/, // Single or double letters
      /^(.)\1{10,}$/, // Repeated single character 10+ times
      /^[0-9\s\-_\.]+$/, // Only numbers and separators
      /^[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/, // Only special characters
      /^(test|testing|testcase|test case|automation|automated)$/i, // Generic test words
      /^(click|tap|press|button|element|ui|app|mobile|android|ios)$/i, // Too generic
      /^(asdf|qwerty|zxcv|hjkl|1234|abcd|hello|world|test123)$/i, // Common test strings
      /^(lorem|ipsum|dolor|sit|amet|consectetur|adipiscing)$/i, // Lorem ipsum
      /^(random|gibberish|nonsense|meaningless|invalid|wrong|error)$/i, // Explicitly invalid
      /^[a-z]{1}\s[a-z]{1}\s[a-z]{1}$/i, // Single letters separated by spaces
      /^(a|b|c|d|e|f|g|h|i|j|k|l|m|n|o|p|q|r|s|t|u|v|w|x|y|z)$/i, // Single letters
      /^(1|2|3|4|5|6|7|8|9|0)$/, // Single numbers
      /^[a-zA-Z0-9]{1,2}\s[a-zA-Z0-9]{1,2}\s[a-zA-Z0-9]{1,2}$/ // Short random combinations
    ];

    // Contradictory patterns that should be flagged
    this.contradictoryPatterns = [
      /click.*close.*open/i, // Click close then open
      /open.*close.*open/i, // Open close open
      /login.*logout.*login/i, // Login logout login
      /enter.*delete.*enter/i, // Enter delete enter
      /scroll.*up.*down.*up/i, // Scroll up down up
      /wait.*immediately/i, // Wait immediately
      /click.*nothing/i, // Click nothing
      /type.*empty/i, // Type empty
      /verify.*nothing/i, // Verify nothing
      /click.*invisible/i, // Click invisible element
      /tap.*hidden/i, // Tap hidden element
      /enter.*password.*show/i, // Enter password then show
      /delete.*everything.*verify/i, // Delete everything then verify
      /click.*back.*forward.*back/i, // Click back forward back
      /scroll.*to.*top.*scroll.*to.*bottom/i, // Scroll to top then bottom repeatedly
      /enter.*text.*clear.*enter.*same.*text/i, // Enter text, clear, enter same text
      /click.*button.*wait.*click.*same.*button/i, // Click button, wait, click same button
      /verify.*element.*delete.*element.*verify.*element/i // Verify element, delete it, verify it again
    ];

    // Impossible patterns that should be rejected
    this.impossiblePatterns = [
      /click.*on.*air/i, // Click on air
      /tap.*nothing/i, // Tap nothing
      /enter.*invisible.*text/i, // Enter text in invisible field
      /verify.*deleted.*element/i, // Verify deleted element
      /scroll.*in.*static.*page/i, // Scroll in static page
      /click.*on.*screen.*outside.*app/i, // Click outside app
      /type.*in.*closed.*app/i, // Type in closed app
      /verify.*future.*state/i, // Verify future state
      /click.*on.*element.*that.*doesn.*exist/i, // Click on non-existent element
      /enter.*text.*in.*readonly.*field/i, // Enter text in readonly field
      /click.*on.*disabled.*button/i, // Click on disabled button
      /verify.*text.*that.*was.*never.*entered/i, // Verify text that was never entered
      /scroll.*in.*non.*scrollable.*view/i, // Scroll in non-scrollable view
      /click.*on.*element.*behind.*another.*element/i, // Click on hidden element
      /enter.*password.*in.*username.*field/i, // Enter password in username field
      /verify.*element.*before.*it.*appears/i // Verify element before it appears
    ];
  }

  /**
   * Comprehensive validation of test case input
   * @param {string} testCase - The test case input
   * @param {string} platform - The target platform
   * @returns {Object} - Validation result with success, errors, warnings, and suggestions
   */
  validateTestInput(testCase, platform = 'android') {
    const result = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: [],
      confidence: 100,
      detectedIssues: []
    };

    if (!testCase || typeof testCase !== 'string') {
      result.isValid = false;
      result.errors.push('Test case must be a non-empty string');
      return result;
    }

    const trimmed = testCase.trim();
    
    // Basic length validation
    if (trimmed.length < 10) {
      result.isValid = false;
      result.errors.push('Test case must be at least 10 characters long');
      result.suggestions.push('Try: "Click on Login button and enter username"');
      return result;
    }

    if (trimmed.length > 2000) {
      result.warnings.push('Test case is very long. Consider breaking it into smaller tests');
      result.confidence -= 10;
    }

    // Check for nonsensical patterns
    this.checkNonsensicalPatterns(trimmed, result);
    
    // Check for contradictory patterns
    this.checkContradictoryPatterns(trimmed, result);
    
    // Check for impossible patterns
    this.checkImpossiblePatterns(trimmed, result);
    
    // Check for meaningful content
    this.checkMeaningfulContent(trimmed, result);
    
    // Check for platform-specific issues
    this.checkPlatformSpecificIssues(trimmed, platform, result);
    
    // Check for action clarity
    this.checkActionClarity(trimmed, result);
    
    // Check for element specificity
    this.checkElementSpecificity(trimmed, result);

    // Calculate final confidence score
    result.confidence = Math.max(0, result.confidence);
    
    // Determine if test should be rejected
    if (result.errors.length > 0) {
      result.isValid = false;
    } else if (result.confidence < 30) {
      result.isValid = false;
      result.errors.push('Test case confidence is too low. Please provide more specific instructions');
    }

    return result;
  }

  checkNonsensicalPatterns(testCase, result) {
    for (const pattern of this.nonsensicalPatterns) {
      if (pattern.test(testCase)) {
        result.isValid = false;
        result.errors.push('Test case appears to be nonsensical or too generic');
        result.suggestions.push('Try: "Click on Login button, enter username and password, then click Submit"');
        result.detectedIssues.push('nonsensical_pattern');
        return;
      }
    }
  }

  checkContradictoryPatterns(testCase, result) {
    for (const pattern of this.contradictoryPatterns) {
      if (pattern.test(testCase)) {
        result.warnings.push('Test case contains potentially contradictory actions');
        result.suggestions.push('Review the sequence of actions to ensure they make logical sense');
        result.confidence -= 20;
        result.detectedIssues.push('contradictory_actions');
      }
    }
  }

  checkImpossiblePatterns(testCase, result) {
    for (const pattern of this.impossiblePatterns) {
      if (pattern.test(testCase)) {
        result.isValid = false;
        result.errors.push('Test case contains impossible or invalid actions');
        result.suggestions.push('Ensure all actions are technically feasible and logical');
        result.detectedIssues.push('impossible_actions');
        return;
      }
    }
  }

  checkMeaningfulContent(testCase, result) {
    const words = testCase.toLowerCase().split(/\s+/);
    const meaningfulWords = words.filter(word => 
      this.validActions.includes(word) || 
      this.validElements.includes(word) ||
      word.length > 3
    );

    const meaningfulRatio = meaningfulWords.length / words.length;
    
    if (meaningfulRatio < 0.3) {
      result.warnings.push('Test case contains many non-meaningful words');
      result.confidence -= 15;
      result.detectedIssues.push('low_meaningful_content');
    }

    // Check for at least one action
    const hasAction = this.validActions.some(action => 
      testCase.toLowerCase().includes(action)
    );

    if (!hasAction) {
      result.warnings.push('No clear action detected in test case');
      result.suggestions.push('Include clear actions like: click, enter, verify, scroll, etc.');
      result.confidence -= 25;
      result.detectedIssues.push('no_clear_action');
    }
  }

  checkPlatformSpecificIssues(testCase, platform, result) {
    const lower = testCase.toLowerCase();
    
    if (platform === 'android') {
      // Check for iOS-specific terms
      if (lower.includes('swipe left') || lower.includes('swipe right')) {
        result.warnings.push('Swipe gestures are more common on iOS. Consider using scroll for Android');
        result.confidence -= 5;
      }
      
      if (lower.includes('force touch') || lower.includes('3d touch')) {
        result.warnings.push('Force touch is iOS-specific. Not available on Android');
        result.confidence -= 10;
      }
    }
    
    if (platform === 'ios') {
      // Check for Android-specific terms
      if (lower.includes('back button') && !lower.includes('navigation')) {
        result.warnings.push('Android back button behavior differs from iOS navigation');
        result.confidence -= 5;
      }
    }
  }

  checkActionClarity(testCase, result) {
    const lower = testCase.toLowerCase();
    
    // Check for vague actions
    const vagueActions = ['do something', 'interact', 'use', 'handle', 'manage', 'process'];
    const hasVagueAction = vagueActions.some(action => lower.includes(action));
    
    if (hasVagueAction) {
      result.warnings.push('Test case contains vague actions. Be more specific');
      result.suggestions.push('Instead of "do something", specify: "click on Login button"');
      result.confidence -= 15;
      result.detectedIssues.push('vague_actions');
    }

    // Check for multiple actions without clear sequence
    const actionCount = this.validActions.filter(action => lower.includes(action)).length;
    if (actionCount > 10) {
      result.warnings.push('Test case has many actions. Consider breaking into smaller tests');
      result.confidence -= 10;
    }
  }

  checkElementSpecificity(testCase, result) {
    const lower = testCase.toLowerCase();
    
    // Check for overly generic element references
    const genericElements = ['element', 'thing', 'item', 'object', 'stuff', 'it', 'this', 'that'];
    const hasGenericElement = genericElements.some(element => 
      lower.includes(`click on ${element}`) || 
      lower.includes(`tap ${element}`) ||
      lower.includes(`select ${element}`)
    );
    
    if (hasGenericElement) {
      result.warnings.push('Test case references generic elements. Be more specific');
      result.suggestions.push('Instead of "click on element", specify: "click on Login button"');
      result.confidence -= 20;
      result.detectedIssues.push('generic_elements');
    }

    // Check for missing element context
    const hasClickWithoutTarget = /click|tap|press/.test(lower) && 
      !/(on|the|button|link|menu|field|input|icon|image)/.test(lower);
    
    if (hasClickWithoutTarget) {
      result.warnings.push('Click action without clear target element');
      result.suggestions.push('Specify what to click: "click on Login button"');
      result.confidence -= 15;
      result.detectedIssues.push('missing_target');
    }
  }

  /**
   * Get suggestions for improving a test case
   * @param {string} testCase - The test case input
   * @returns {Array} - Array of improvement suggestions
   */
  getImprovementSuggestions(testCase) {
    const suggestions = [];
    const lower = testCase.toLowerCase();
    
    // Check for common improvements
    if (!lower.includes('click') && !lower.includes('tap')) {
      suggestions.push('Consider adding click/tap actions to interact with UI elements');
    }
    
    if (!lower.includes('enter') && !lower.includes('type') && !lower.includes('input')) {
      suggestions.push('Consider adding text input actions if your app has forms');
    }
    
    if (!lower.includes('verify') && !lower.includes('check') && !lower.includes('assert')) {
      suggestions.push('Consider adding verification steps to validate expected outcomes');
    }
    
    if (lower.includes('login') && !lower.includes('username') && !lower.includes('password')) {
      suggestions.push('Login tests should include username and password entry');
    }
    
    if (lower.includes('form') && !lower.includes('submit')) {
      suggestions.push('Form tests should include submission actions');
    }
    
    return suggestions;
  }

  /**
   * Validate if a test case is suitable for automation
   * @param {string} testCase - The test case input
   * @returns {Object} - Automation suitability result
   */
  validateAutomationSuitability(testCase) {
    const result = {
      suitable: true,
      reasons: [],
      recommendations: []
    };

    const lower = testCase.toLowerCase();
    
    // Check for manual-only actions
    const manualActions = [
      'think', 'decide', 'judge', 'evaluate', 'assess', 'analyze',
      'remember', 'recall', 'imagine', 'visualize', 'feel', 'sense',
      'communicate', 'talk', 'speak', 'discuss', 'negotiate',
      'create', 'design', 'invent', 'innovate', 'brainstorm'
    ];
    
    const hasManualAction = manualActions.some(action => lower.includes(action));
    if (hasManualAction) {
      result.suitable = false;
      result.reasons.push('Contains actions that require human judgment or creativity');
      result.recommendations.push('Focus on objective, repeatable actions that can be automated');
    }
    
    // Check for external dependencies
    const externalDeps = [
      'email', 'sms', 'phone call', 'external api', 'third party',
      'internet', 'network', 'server', 'database', 'file system'
    ];
    
    const hasExternalDep = externalDeps.some(dep => lower.includes(dep));
    if (hasExternalDep) {
      result.reasons.push('May depend on external systems that could affect test reliability');
      result.recommendations.push('Consider mocking external dependencies for consistent testing');
    }
    
    return result;
  }
}

module.exports = new InputValidationService();
