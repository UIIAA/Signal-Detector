const SignalClassifier = require('./src/services/SignalClassifier');

async function testGeminiIntegration() {
  const classifier = new SignalClassifier();
  
  // Test activity
  const testActivity = {
    description: "Working on important project",
    duration: 45,
    energyBefore: 7,
    energyAfter: 9
  };
  
  console.log("Testing Gemini integration with activity:", testActivity);
  
  // Test AI classification
  const aiResult = await classifier.classifyWithAI(testActivity);
  console.log("AI Classification result:", aiResult);
  
  // Test rule-based classification
  const ruleResult = classifier.classifyByRules(testActivity);
  console.log("Rule-based Classification result:", ruleResult);
}

testGeminiIntegration().catch(console.error);