// Test Gemini API functionality
const { generateVTUAnswer } = require('./lib/gemini-2-flash.ts');

async function testGemini() {
  try {
    console.log('🧪 Testing Gemini API with retry logic...');
    
    const testPrompt = `
    You are VTU EduMate, an advanced AI assistant for Visvesvaraya Technological University students.
    
    Question: What is Machine Learning? (2 marks)
    Subject: Computer Science
    Scheme: 2021
    
    Provide a 2-mark answer according to VTU standards.
    `;
    
    const result = await generateVTUAnswer(testPrompt);
    console.log('✅ Gemini API test successful!');
    console.log('📝 Response length:', result.length, 'characters');
    console.log('🎯 First 200 characters:', result.substring(0, 200) + '...');
    
  } catch (error) {
    console.error('❌ Gemini API test failed:', error.message);
  }
}

testGemini();
