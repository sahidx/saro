// Test PraggoAI Service directly using TypeScript
import { GoogleGenAI } from "@google/genai";

// Copy the working structure from praggoAI.ts
class PraggoAITester {
  private readonly API_KEY = "AIzaSyABdNCR_6wfhSOUJoGPWpSqUTWOGtbbBiQ";
  private readonly modelName = 'gemini-2.0-flash-exp';

  private getClient() {
    try {
      return new GoogleGenAI({ apiKey: this.API_KEY });
    } catch (error) {
      console.error('❌ Failed to create Gemini client:', error);
      return null;
    }
  }

  async testQuestionGeneration() {
    console.log("🧪 Testing PraggoAI Question Generation System...");
    
    const genAI = this.getClient();
    if (!genAI) {
      throw new Error('Failed to initialize Gemini client');
    }

    try {
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

      console.log("📡 Making API call to Gemini...");
      
      const response = await genAI.models.generateContent({
        model: this.modelName,
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });

      console.log("✅ API Response received!");

      // Parse response using the same logic as praggoAI.ts
      const anyResp: any = response as any;
      let result: string = '';
      
      if (typeof anyResp.text === 'function') {
        result = anyResp.text();
      } else if (typeof anyResp.text === 'string') {
        result = anyResp.text;
      } else if (anyResp.candidates?.[0]?.content?.parts?.[0]?.text) {
        result = anyResp.candidates[0].content.parts[0].text;
      } else if (anyResp.output_text) {
        result = anyResp.output_text;
      } else {
        console.log('🔍 Full Response Structure:', JSON.stringify(anyResp, null, 2));
        throw new Error('Could not extract text from response');
      }

      console.log("📝 Raw AI Response:");
      console.log(result);
      console.log("\n" + "=".repeat(50) + "\n");

      // Try to parse as JSON
      const cleanText = result.replace(/```json\n?|```\n?/g, '').trim();
      
      try {
        const questionData = JSON.parse(cleanText);
        console.log("✅ Successfully parsed question:");
        console.log("📋 Question:", questionData.question);
        console.log("🔤 Options:", questionData.options);
        console.log("✔️ Correct Answer:", questionData.correctAnswer);
        console.log("💡 Explanation:", questionData.explanation);
        
        return {
          success: true,
          data: questionData,
          raw: result
        };
      } catch (parseError) {
        console.log("⚠️ Failed to parse as JSON, but AI responded:");
        console.log(result);
        return {
          success: false,
          error: "JSON parsing failed",
          raw: result
        };
      }

    } catch (error: any) {
      console.error("❌ API Call Failed:", error.message);
      
      if (error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED')) {
        console.log("⚠️ Quota Error - API key needs replacement or billing");
      }
      
      throw error;
    }
  }
}

// Run the test
async function runTest() {
  const tester = new PraggoAITester();
  
  try {
    const result = await tester.testQuestionGeneration();
    
    if (result.success) {
      console.log("\n🎉 QUESTION GENERATION IS WORKING! ✅");
      console.log("✨ The PraggoAI system can generate proper Bengali questions.");
    } else {
      console.log("\n⚠️ AI responds but JSON format needs adjustment");
      console.log("🔧 The system works but may need prompt refinement");
    }
    
    return result;
  } catch (error: any) {
    console.error("\n💥 QUESTION GENERATION FAILED!");
    console.error("❌ Error:", error.message);
    
    if (error.message?.includes('quota')) {
      console.log("\n🔑 SOLUTION: Add more API keys to the rotation system");
      console.log("📍 Location: server/praggoAI.ts lines 10-15");
    }
  }
}

runTest();