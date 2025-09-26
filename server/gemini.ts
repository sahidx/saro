import { GoogleGenAI } from "@google/genai";

// Multiple API keys support for rotation
const API_KEYS = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
  process.env.GEMINI_API_KEY_4,
  process.env.GEMINI_API_KEY_5,
  process.env.GEMINI_API_KEY_6,
  // Fallback to old key name for backward compatibility
  process.env.GOOGLE_API_KEY,
  process.env.GEMINI_API_KEY
].filter(key => key && key.trim() !== ''); // Remove empty/undefined keys

console.log(`🔑 Gemini API Keys configured: ${API_KEYS.length} keys available`);

let currentKeyIndex = 0;

// Function to get current API client with rotation
function getCurrentGeminiClient(): GoogleGenAI | null {
  if (API_KEYS.length === 0) {
    console.warn('⚠️  No Gemini API keys configured');
    return null;
  }
  
  const apiKey = API_KEYS[currentKeyIndex];
  console.log(`🔄 Using Gemini API Key #${currentKeyIndex + 1}/${API_KEYS.length}`);
  return new GoogleGenAI({ apiKey });
}

// Function to rotate to next API key
function rotateToNextKey(): boolean {
  if (API_KEYS.length <= 1) {
    console.warn('⚠️  No additional API keys available for rotation');
    return false;
  }
  
  const oldIndex = currentKeyIndex;
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
  console.log(`🔄 Rotated from API Key #${oldIndex + 1} to #${currentKeyIndex + 1}`);
  return true;
}

// Function to check if error is quota/rate limit related
function isQuotaError(error: any): boolean {
  const errorMessage = error?.message?.toLowerCase() || '';
  const errorStatus = error?.status || error?.code;
  
  return (
    errorMessage.includes('quota') ||
    errorMessage.includes('rate limit') ||
    errorMessage.includes('limit exceeded') ||
    errorMessage.includes('resource exhausted') ||
    errorStatus === 429 ||
    errorStatus === 403
  );
}

// Function to attempt API call with current key and retry with rotation on quota errors
async function attemptGeminiCall(prompt: string, maxRetries: number = API_KEYS.length): Promise<any> {
  let attempt = 0;
  let lastError: any = null;

  while (attempt < maxRetries) {
    const genAI = getCurrentGeminiClient();
    
    if (!genAI) {
      throw new Error('No Gemini API keys configured. Please set GEMINI_API_KEY_1, GEMINI_API_KEY_2, etc.');
    }

    try {
      console.log(`🤖 Attempting Gemini API call (attempt ${attempt + 1}/${maxRetries})`);
      
      const response = await genAI.models.generateContent({
        model: "gemini-1.5-flash",
        contents: prompt,
      });
      const text = response.text || "";

      console.log(`✅ Gemini API call successful with Key #${currentKeyIndex + 1}`);
      return text;

    } catch (error: any) {
      lastError = error;
      console.error(`❌ Gemini API call failed with Key #${currentKeyIndex + 1}:`, error.message);

      // If this is a quota/rate limit error and we have more keys, try the next one
      if (isQuotaError(error)) {
        console.log(`🚫 Quota/Rate limit reached for Key #${currentKeyIndex + 1}`);
        
        if (rotateToNextKey()) {
          console.log(`🔄 Retrying with next API key...`);
          attempt++;
          continue;
        } else {
          console.error('❌ All API keys exhausted');
          break;
        }
      } else {
        // For non-quota errors, don't retry
        console.error(`❌ Non-quota error occurred: ${error.message}`);
        throw error;
      }
    }
  }

  // If we get here, all keys failed
  throw new Error(`All ${API_KEYS.length} Gemini API keys exhausted or failed. Last error: ${lastError?.message}`);
}

export async function generateQuestionsWithGemini(subject: string, examType: string, classLevel: string, paper: string, chapter: string, questionType: string, questionLanguage: string, difficulty: string, count: number): Promise<any> {
  try {
    if (API_KEYS.length === 0) {
      throw new Error('Google Gemini API key is required for question generation. Please configure GEMINI_API_KEY in environment variables.');
    }

  const subjectBangla = subject === 'science' ? 'বিজ্ঞান' : 'গণিত';
    const examTypeBangla = examType === 'academic' ? 'একাডেমিক' : 'ভর্তি পরীক্ষা';
    const classLevelBangla = classLevel === '9-10' ? 'নবম-দশম শ্রেণি' : 'একাদশ-দ্বাদশ শ্রেণি (HSC)';
    
    let difficultyLevels = '';
    if (difficulty === 'mixed') {
      difficultyLevels = 'সহজ, মধ্যম ও জটিল স্তরের মিশ্রণ';
    } else if (difficulty === 'easy') {
      difficultyLevels = 'সহজ স্তরের';
    } else if (difficulty === 'medium') {
      difficultyLevels = 'মধ্যম স্তরের';
    } else {
      difficultyLevels = 'জটিল স্তরের';
    }

    const questionTypeDetails: {[key: string]: string} = {
      mcq: 'বহুনির্বাচনী প্রশ্ন (MCQ) - ৪টি অপশনসহ',
      cq: 'সংক্ষিপ্ত প্রশ্ন (CQ) - ২-৩ লাইনের উত্তর',
      creative: 'সৃজনশীল প্রশ্ন - জ্ঞান, অনুধাবন, প্রয়োগ ও উচ্চতর দক্ষতা স্তর'
    };

    const prompt = `আপনি একজন অভিজ্ঞ ${subjectBangla} শিক্ষক। বাংলাদেশের NCTB কারিকুলাম এবং ${examTypeBangla} পরীক্ষার মানদণ্ড অনুসারে ${count}টি ${difficultyLevels} ${questionTypeDetails[questionType] || 'প্রশ্ন'} তৈরি করুন।

**প্রশ্নের বিবরণ:**
- বিষয়: ${subjectBangla}
- শ্রেণি: ${classLevelBangla}
${paper ? `- পত্র: ${paper}` : ''}
- অধ্যায়: ${chapter}
- প্রশ্নের ধরন: ${questionTypeDetails[questionType] || 'সাধারণ প্রশ্ন'}
- কঠিনতা: ${difficultyLevels}
- প্রশ্নের ভাষা: বাংলা

**নির্দেশনা:**
1. প্রশ্ন ও অপশন সর্বদা বাংলায় লিখুন
2. উত্তর সর্বদা বাংলায় বিস্তারিত ব্যাখ্যাসহ দিন
3. বাংলাদেশি প্রেক্ষাপট, স্থানীয় উদাহরণ এবং বাস্তব জীবনের প্রয়োগ অন্তর্ভুক্ত করুন
4. ${examTypeBangla === 'ভর্তি পরীক্ষা' ? 'বিশ্ববিদ্যালয় ভর্তি পরীক্ষার মান অনুযায়ী' : 'বোর্ড পরীক্ষার মান অনুযায়ী'} প্রশ্ন তৈরি করুন

${subject === 'science' ? `
**বিজ্ঞানের জন্য বিশেষ নির্দেশনা:**
- পদার্থবিজ্ঞান, রসায়ন, জীববিজ্ঞান সমন্বিত ধারণা
- বাংলাদেশী প্রেক্ষাপটে উদাহরণ (কৃষি, পরিবেশ, স্বাস্থ্য, প্রযুক্তি)
- প্রয়োজনীয় ক্ষেত্রে সূত্র, বিক্রিয়া, জৈব প্রক্রিয়া লিখুন
- বাস্তব জীবনের প্রয়োগ প্রশ্নে আনুন` : `
**গণিতের জন্য বিশেষ নির্দেশনা:**
- অ্যালজেব্রা, জ্যামিতি, ত্রিকোণমিতি, পরিসংখ্যান/সম্ভাব্যতা (শ্রেণি অনুযায়ী)
- ধাপে ধাপে সমাধান যোগ্য প্রশ্ন
- সূত্র প্রয়োগ ও বাস্তব উদাহরণ (ডেটা, পরিমাপ, আর্থিক প্রেক্ষাপট)
- বিভ্রান্তিকর কিন্তু যুক্তিযুক্ত MCQ অপশন তৈরি করুন`}

গুরুত্বপূর্ণ: শুধুমাত্র একটি বৈধ JSON অ্যারে রিটার্ন করুন। কোনো অতিরিক্ত টেক্সট, ব্যাখ্যা বা মার্কডাউন যোগ করবেন না।

${questionType === 'mcq' ? 'MCQ ফরম্যাট:' : questionType === 'cq' ? 'CQ ফরম্যাট:' : 'সৃজনশীল প্রশ্ন ফরম্যাট:'}
[{"questionText": "বাংলায় প্রশ্ন", "questionType": "${questionType}", ${questionType === 'mcq' ? '"options": ["ক) ...", "খ) ...", "গ) ...", "ঘ) ..."], "correctAnswer": "ক) ...",' : '"options": null, "correctAnswer": null,'} "answer": "বাংলায় বিস্তারিত উত্তর", "marks": ${questionType === 'creative' ? '10' : questionType === 'cq' ? '2' : '1'}}]`;

    // Use the new rotation system for API calls
    const content = await attemptGeminiCall(prompt);
    console.log("Gemini raw response for Bangladesh questions:", content);
    
    // Try to extract JSON from the response
    let jsonMatch = content.match(/\[[\s\S]*\]/);
    
    // If no JSON found, try to extract from code blocks
    if (!jsonMatch) {
      const codeBlockMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/);
      if (codeBlockMatch) {
        jsonMatch = [codeBlockMatch[1]];
      }
    }
    
    if (jsonMatch) {
      try {
        const questions = JSON.parse(jsonMatch[0]);
        console.log("Parsed Bangladesh Gemini questions:", questions);
        return questions;
      } catch (parseError) {
        console.error("JSON parsing error:", parseError);
        throw new Error('Failed to parse AI response JSON');
      }
    } else {
      console.log("No JSON match found in Bangladesh Gemini response:", content);
      throw new Error('Invalid AI response format - no JSON found');
    }
  } catch (error: any) {
    console.error('Error generating Bangladesh questions with Gemini:', error);
    
    // Enhanced error messages for API key rotation system
    let errorMessage = '';
    if (error?.message?.includes('exhausted')) {
      errorMessage = `সকল ${API_KEYS.length}টি Gemini API key এর limit শেষ! নতুন key যোগ করুন বা quota reset এর অপেক্ষা করুন।`;
    } else if (error?.status === 429 || isQuotaError(error)) {
      errorMessage = 'API quota/rate limit পৌঁছেছে! পরে আবার চেষ্টা করুন।';
    } else if (error?.message?.includes('API key')) {
      errorMessage = 'Gemini API key সমস্যা! GEMINI_API_KEY_1, GEMINI_API_KEY_2 etc. সেট করুন।';
    } else {
      errorMessage = `API সংযোগ সমস্যা: ${error.message || 'অজানা ত্রুটি'}`;
    }
    
    // Return error questions that clearly indicate the problem
    const errorQuestions = [];
    for (let i = 0; i < count; i++) {
      errorQuestions.push({
        questionText: `❌ API ত্রুটি: ${subject === 'science' ? 'বিজ্ঞান' : 'গণিত'} প্রশ্ন ${i + 1} তৈরি করা যায়নি - ${errorMessage}`,
        questionType: questionType,
        options: questionType === 'mcq' ? [
          '⚠️ API সমস্যার জন্য প্রশ্ন লোড হয়নি',
          'পরে আবার চেষ্টা করুন',
          'Multiple API keys সেট করুন',
          'Technical support এর সাথে যোগাযোগ করুন'
        ] : null,
        correctAnswer: questionType === 'mcq' ? '⚠️ API সমস্যার জন্য প্রশ্ন লোড হয়নি' : null,
        answer: `প্রশ্ন তৈরি করতে সমস্যা হয়েছে। কারণ: ${errorMessage}। অনুগ্রহ করে GEMINI_API_KEY_1, GEMINI_API_KEY_2 etc. সেট করুন এবং পরে আবার চেষ্টা করুন।`,
        marks: 1
      });
    }
    return errorQuestions;
  }
}

export async function solveDoubtWithGemini(question: string, subject: string): Promise<string> {
  try {
    if (API_KEYS.length === 0) {
      return `🤖 Praggo AI সমাধান (ডেমো মোড)\n\nআপনার ${subject === 'science' ? 'বিজ্ঞান' : 'গণিত'} প্রশ্ন: "${question}"\n\nAPI key ছাড়া পূর্ণ সমাধান সম্ভব নয়।`;
    }

    const subjectBangla = subject === 'science' ? 'বিজ্ঞান' : 'গণিত';

  const prompt = `আপনি বাংলাদেশের NCTB ভিত্তিক একজন বিশেষজ্ঞ ${subjectBangla} শিক্ষক। 

শিক্ষার্থীর প্রশ্ন: ${question}

বাংলাদেশের শিক্ষাব্যবস্থা ও NCTB কারিকুলাম অনুযায়ী একটি বিস্তারিত, শিক্ষামূলক সমাধান প্রদান করুন যাতে রয়েছে:

${subject === 'science' ? `🔬 বিজ্ঞানের জন্য:
- ধাপে ধাপে সমাধান (ধারণা → সূত্র/প্রক্রিয়া → প্রয়োগ)
- পরিবেশ, স্বাস্থ্য, কৃষি বা প্রযুক্তি ভিত্তিক স্থানীয় উদাহরণ
- বাড়তি অনুশীলনের জন্য ১-২টি প্রশ্ন প্রস্তাব
- প্রয়োজনে সতর্কতা বা নিরাপত্তা তথ্য` : `➗ গণিতের জন্য:
- Step by step সমাধান
- কোন ধাপে কোন সূত্র প্রয়োগ হলো উল্লেখ করুন
- সাধারণ ভুল (common mistakes) হাইলাইট করুন
- বিকল্প সমাধান থাকলে সংক্ষেপে উল্লেখ করুন`}

আপনার উত্তর এইভাবে সাজান:
- 📚 মূল ধারণা
- 🔍 ধাপে ধাপে সমাধান  
- 💡 টিপস ও অন্তর্দৃষ্টি
- 🎯 সারসংক্ষেপ/মূল বিষয়সমূহ

শিক্ষার্থীদের কাছে আকর্ষণীয় ও শিক্ষামূলক করে তুলুন যারা সত্যিকারের ধারণা বুঝতে চায়।`;

    const response = await attemptGeminiCall(prompt);
    return response || "দুঃখিত, আমি কোনো সমাধান তৈরি করতে পারিনি। আবার চেষ্টা করুন।";
  } catch (error: any) {
    console.error('Error solving doubt with Gemini:', error);
    
    let errorMessage = '';
    if (error?.message?.includes('exhausted')) {
      errorMessage = `সকল ${API_KEYS.length}টি API key এর limit শেষ!`;
    } else if (isQuotaError(error)) {
      errorMessage = 'API quota/rate limit reached!';
    } else {
      errorMessage = error?.message || 'অজানা ত্রুটি';
    }
    
  return `🤖 Praggo AI সমাধান (ত্রুটি)\n\nআপনার ${subject === 'science' ? 'বিজ্ঞান' : 'গণিত'} প্রশ্ন প্রক্রিয়া করতে সমস্যা হয়েছে: "${question}"\n\nত্রুটি: ${errorMessage}\n\nঅনুগ্রহ করে multiple GEMINI_API_KEY সেট করুন এবং আবার চেষ্টা করুন।`;
  }
}

// Sentiment analysis function for feedback
export async function analyzeSentiment(text: string): Promise<{ rating: number; confidence: number }> {
  try {
    if (API_KEYS.length === 0) {
      return { rating: 3, confidence: 0.5 };
    }

    const prompt = `Analyze the sentiment of this text and provide a rating from 1-5 and confidence 0-1. 
    Respond only with JSON: {"rating": number, "confidence": number}
    
    Text: ${text}`;

    const responseText = await attemptGeminiCall(prompt);
    const jsonText = responseText.replace(/```json|```/g, '').trim();
    
    return JSON.parse(jsonText);
  } catch (error) {
    console.error('Error analyzing sentiment:', error);
    return { rating: 3, confidence: 0.5 };
  }
}

// Bengali doubt solving function for students  
export async function solveBanglaDoubt(question: string): Promise<string> {
  try {
    if (API_KEYS.length === 0) {
      return 'GEMINI_API_KEY_1, GEMINI_API_KEY_2 etc. configured করুন doubt solve করার জন্য।';
    }

  const prompt = `আপনি একজন অভিজ্ঞ বিজ্ঞান ও গণিত শিক্ষক। নিচের প্রশ্নের উত্তর বাংলায় বিস্তারিত ব্যাখ্যাসহ দিন:

**নির্দেশনা:**
1. উত্তর সর্বদা বাংলায় দিন
2. বাংলাদেশি প্রেক্ষাপট ও উদাহরণ ব্যবহার করুন (বিজ্ঞান/গণিত প্রসঙ্গ অনুযায়ী)
3. ধাপে ধাপে সমাধান দিন
4. প্রয়োজনে সূত্র ও গাণিতিক সমাধান দিন

প্রশ্ন: ${question}`;

    const response = await attemptGeminiCall(prompt);
    return response || 'দুঃখিত, এই মুহূর্তে প্রশ্নের উত্তর দিতে পারছি না। পরে আবার চেষ্টা করুন।';
  } catch (error) {
    console.error('Error solving doubt:', error);
    return 'দুঃখিত, এই মুহূর্তে প্রশ্নের উত্তর দিতে পারছি না। পরে আবার চেষ্টা করুন।';
  }
}