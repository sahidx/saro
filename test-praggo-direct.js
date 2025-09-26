// Direct test of PraggoAI service
import { GoogleGenAI } from "@google/genai";

// Test the PraggoAI service directly
class PraggoAITest {
  constructor() {
    // Using the primary API key
    this.apiKey = "AIzaSyABdNCR_6wfhSOUJoGPWpSqUTWOGtbbBiQ";
    this.genai = new GoogleGenAI(this.apiKey);
    this.modelName = 'gemini-2.0-flash-exp';
  }

  async testQuestionGeneration() {
    try {
      console.log("🧪 Testing PraggoAI Question Generation...");
      
      const model = this.genai.getGenerativeModel({ model: this.modelName });
      
      const prompt = `
তুমি একজন দক্ষ শিক্ষা বিশেষজ্ঞ। ৬ম শ্রেণীর গণিত বিষয়ের "প্রাকৃতিক সংখ্যা" অধ্যায় থেকে ১টি MCQ প্রশ্ন তৈরি করো।

প্রশ্নের বৈশিষ্ট্য:
- বাংলা ভাষায় হতে হবে
- ৬ম শ্রেণীর উপযুক্ত কঠিনতা
- ৪টি অপশন (a, b, c, d)
- স্পষ্ট সঠিক উত্তর

JSON ফরম্যাট:
{
  "question": "প্রশ্ন এখানে",
  "options": {
    "a": "অপশন এ",
    "b": "অপশন বি", 
    "c": "অপশন সি",
    "d": "অপশন ডি"
  },
  "correctAnswer": "a",
  "explanation": "ব্যাখ্যা"
}
`;

      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      
      console.log("✅ Raw Response:", text);
      
      // Try to parse JSON
      const cleanText = text.replace(/```json\n?|```\n?/g, '').trim();
      const questionData = JSON.parse(cleanText);
      
      console.log("✅ Parsed Question Data:");
      console.log("📝 Question:", questionData.question);
      console.log("📋 Options:", questionData.options);
      console.log("✔️ Correct Answer:", questionData.correctAnswer);
      console.log("💡 Explanation:", questionData.explanation);
      
      return questionData;
      
    } catch (error) {
      console.error("❌ Test Failed:", error);
      
      if (error.message?.includes('quota')) {
        console.log("⚠️ Quota Error Detected - API key rotation needed");
      }
      
      throw error;
    }
  }
}

// Run the test
async function runTest() {
  const tester = new PraggoAITest();
  try {
    const result = await tester.testQuestionGeneration();
    console.log("🎉 Test Successful! Question generation is working.");
    return result;
  } catch (error) {
    console.error("💥 Test Failed:", error.message);
  }
}

runTest();