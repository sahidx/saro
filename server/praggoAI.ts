import { GoogleGenAI } from "@google/genai";
import { db } from "./db";
import { praggoAIKeys, praggoAIUsage } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";

// Praggo AI - Bangladeshi Educational AI Assistant
// Intelligent API key rotation system with database tracking

class PraggoAIService {
  private static instance: PraggoAIService;
  private apiKeys: Array<{ keyName: string; keyValue: string; keyIndex: number; }> = [];
  private currentKeyIndex = 0;
  private readonly maxRetries = 7; // Support up to 7 API keys

  constructor() {
    this.initializeAPIKeys();
  }

  static getInstance(): PraggoAIService {
    if (!PraggoAIService.instance) {
      PraggoAIService.instance = new PraggoAIService();
    }
    return PraggoAIService.instance;
  }

  // Initialize API keys from environment and database
  private async initializeAPIKeys() {
    const keyNames = [
      'GEMINI_API_KEY',      // Primary key
      'GEMINI_API_KEY_2', 
      'GEMINI_API_KEY_3',
      'GEMINI_API_KEY_4',
      'GEMINI_API_KEY_5',
      'GEMINI_API_KEY_6',
      'GEMINI_API_KEY_7'
    ];

    // First, try to restore keys from database to environment
    try {
      const dbKeys = await db.select().from(praggoAIKeys)
        .where(eq(praggoAIKeys.isEnabled, true));
      
      // Restore keys from database to environment
      for (const dbKey of dbKeys) {
        if (dbKey.keyValue && dbKey.keyValue.trim().length > 10) {
          process.env[dbKey.keyName] = dbKey.keyValue;
          console.log(`🔄 Restored Praggo AI key from database: ${dbKey.keyName}`);
        }
      }
    } catch (error) {
      console.log('💾 Database key restoration failed, using environment only');
    }

    this.apiKeys = keyNames
      .map((keyName, index) => ({
        keyName,
        keyValue: process.env[keyName] || '',
        keyIndex: index
      }))
      .filter(key => key.keyValue && key.keyValue.trim() !== '');

    if (this.apiKeys.length > 0) {
      console.log(`🎓 Praggo AI Enhanced System Activated! ${this.apiKeys.length} API keys ready for Bangladesh Education`);
      console.log(`📚 Advanced Features: NCTB Curriculum • University Admission • Bengali AI Support`);
      this.apiKeys.forEach((key, index) => {
        console.log(`   🔑 Key ${index + 1}: ${key.keyName} (${key.keyValue.substring(0, 12)}...)`);
      });
    } else {
      console.warn('⚠️ Praggo AI Demo Mode - Add API keys in Settings for full features');
    }
    
    // Initialize database keys if they don't exist
    await this.initializeDatabaseKeys();
  }

  // Initialize API keys in database
  private async initializeDatabaseKeys() {
    try {
      for (const key of this.apiKeys) {
        const existingKey = await db.select().from(praggoAIKeys)
          .where(eq(praggoAIKeys.keyName, key.keyName)).limit(1);
        
        if (existingKey.length === 0) {
          await db.insert(praggoAIKeys).values({
            keyName: key.keyName,
            keyIndex: key.keyIndex,
            status: 'active',
            isEnabled: true,
            dailyUsageCount: 0
          });
          console.log(`✅ Initialized Praggo AI key: ${key.keyName}`);
        }
      }
    } catch (error) {
      console.log('📝 Database not ready for Praggo AI keys initialization, will use memory only');
    }
  }

  // Refresh API keys from database - callable method
  async refreshKeys() {
    await this.initializeAPIKeys();
  }

  // Get current active API key
  private getCurrentKey(): { keyName: string; keyValue: string; keyIndex: number; } | null {
    if (this.apiKeys.length === 0) {
      return null;
    }
    return this.apiKeys[this.currentKeyIndex];
  }

  // Create Gemini client with current key
  private createGeminiClient(): GoogleGenAI | null {
    const currentKey = this.getCurrentKey();
    if (!currentKey) {
      console.warn('⚠️ No Praggo AI keys configured');
      return null;
    }
    
    console.log(`🤖 Using Praggo AI Key #${currentKey.keyIndex + 1}/${this.apiKeys.length} (${currentKey.keyName})`);
    return new GoogleGenAI({ apiKey: currentKey.keyValue });
  }

  // Rotate to next available API key
  private async rotateToNextKey(): Promise<boolean> {
    if (this.apiKeys.length <= 1) {
      console.warn('⚠️ No additional Praggo AI keys available for rotation');
      return false;
    }

    const oldKey = this.getCurrentKey();
    
    // Mark current key as quota exceeded in database
    if (oldKey) {
      try {
        await db.update(praggoAIKeys)
          .set({ 
            status: 'quota_exceeded',
            quotaResetDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // Reset tomorrow
          })
          .where(eq(praggoAIKeys.keyName, oldKey.keyName));
      } catch (error) {
        console.log('📝 Database update failed, continuing with memory rotation');
      }
    }

    const oldIndex = this.currentKeyIndex;
    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
    const newKey = this.getCurrentKey();
    
    console.log(`🔄 Praggo AI rotated from Key #${oldIndex + 1} to #${this.currentKeyIndex + 1}`);
    return true;
  }

  // Check if error is quota/rate limit related
  private isQuotaError(error: any): boolean {
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

  // Log API usage to database
  private async logUsage(
    userId: string,
    userRole: 'teacher' | 'student',
    requestType: 'generate_questions' | 'solve_doubt',
    subject: 'chemistry' | 'ict',
    success: boolean,
    keyUsed?: string,
    errorMessage?: string,
    processingTime?: number,
    promptLength?: number,
    responseLength?: number
  ) {
    try {
      await db.insert(praggoAIUsage).values({
        userId,
        userRole,
        requestType,
        keyUsed: keyUsed || 'none',
        subject,
        success,
        errorMessage,
        processingTime,
        promptLength,
        responseLength
      });

      // Update key usage count
      if (keyUsed && success) {
        await db.update(praggoAIKeys)
          .set({ 
            dailyUsageCount: sql`${praggoAIKeys.dailyUsageCount} + 1`,
            lastUsed: new Date()
          })
          .where(eq(praggoAIKeys.keyName, keyUsed));
      }
    } catch (error) {
      console.log('📝 Usage logging failed, continuing without database tracking');
    }
  }

  // Main API call method with rotation and error handling
  async makeAPICall(
    prompt: string,
    userId: string,
    userRole: 'teacher' | 'student',
    requestType: 'generate_questions' | 'solve_doubt',
    subject: 'chemistry' | 'ict'
  ): Promise<string> {
    const startTime = Date.now();
    let attempt = 0;
    let lastError: any = null;
    const promptLength = prompt.length;

    while (attempt < this.maxRetries && attempt < this.apiKeys.length) {
      const currentKey = this.getCurrentKey();
      
      if (!currentKey) {
        const errorMsg = 'Praggo AI এর কোনো API key কনফিগার করা নেই। অনুগ্রহ করে GEMINI_API_KEY_1, GEMINI_API_KEY_2 ইত্যাদি সেট করুন।';
        await this.logUsage(userId, userRole, requestType, subject, false, undefined, errorMsg);
        throw new Error(errorMsg);
      }

      const genAI = this.createGeminiClient();
      if (!genAI) {
        attempt++;
        continue;
      }

      try {
        console.log(`🎯 Praggo AI attempt ${attempt + 1}/${this.maxRetries}`);
        
        const response = await genAI.models.generateContent({
          model: "gemini-2.0-flash-exp",
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        });

        // Check if response exists and has expected structure
        if (!response) {
          throw new Error('Gemini API returned no response');
        }

        console.log('🔍 Gemini API Response Debug:', {
          hasResponse: !!response.response,
          hasResponseText: response.response && typeof response.response.text,
          hasText: typeof response.text,
          hasCandidates: !!response.candidates,
          keys: Object.keys(response)
        });

        let result;
        try {
          if (response.response && typeof response.response.text === 'function') {
            result = response.response.text();
          } else if (response.response && response.response.candidates?.[0]?.content?.parts?.[0]?.text) {
            result = response.response.candidates[0].content.parts[0].text;
          } else if (typeof response.text === 'function') {
            result = response.text();
          } else if (response.candidates && response.candidates[0]?.content?.parts?.[0]?.text) {
            result = response.candidates[0].content.parts[0].text;
          } else {
            console.error('🚨 Unexpected Gemini API response structure:', JSON.stringify(response, null, 2));
            throw new Error('Gemini API returned invalid response structure');
          }
        } catch (textError) {
          console.error('🔥 Error accessing response text:', textError);
          console.log('📋 Full response object:', JSON.stringify(response, null, 2));
          throw new Error(`Failed to extract text from Gemini response: ${textError.message}`);
        }
        const processingTime = Date.now() - startTime;
        const responseLength = result.length;

        // Log successful usage
        await this.logUsage(
          userId, userRole, requestType, subject, true, 
          currentKey.keyName, undefined, processingTime, promptLength, responseLength
        );

        return result;

      } catch (error: any) {
        lastError = error;
        const processingTime = Date.now() - startTime;
        
        console.log(`❌ Praggo AI Key #${currentKey.keyIndex + 1} failed:`, error.message);

        // Log failed usage
        await this.logUsage(
          userId, userRole, requestType, subject, false,
          currentKey.keyName, error.message, processingTime, promptLength
        );

        if (this.isQuotaError(error)) {
          console.log(`🔄 Quota exceeded, rotating Praggo AI key...`);
          await this.rotateToNextKey();
          attempt++;
          continue;
        } else {
          // Non-quota error, don't retry
          break;
        }
      }
    }

    // All keys exhausted or non-quota error
    let errorMessage = '';
    if (lastError?.message?.includes('exhausted') || attempt >= this.apiKeys.length) {
      errorMessage = 'আজের জন্য আপনার Praggo AI ব্যবহারের সীমা শেষ! আগামীকাল আবার চেষ্টা করুন।';
    } else if (this.isQuotaError(lastError)) {
      errorMessage = 'Praggo AI এর সকল API key এর সীমা পূর্ণ! অনুগ্রহ করে কিছুক্ষণ পর চেষ্টা করুন।';
    } else {
      errorMessage = lastError?.message || 'Praggo AI সেবায় সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।';
    }

    throw new Error(errorMessage);
  }

  // Generate questions with enhanced Bangladeshi context
  async generateQuestions(
    subject: string,
    examType: string,
    classLevel: string,
    chapter: string,
    questionType: string,
    questionCategory: string,
    difficulty: string,
    count: number,
    userId: string,
    userRole: 'teacher' | 'student'
  ): Promise<any> {
    
    if (this.apiKeys.length === 0) {
      // Return sample questions if no API key
      console.warn('⚠️ No Praggo AI keys configured, returning sample questions');
      const sampleQuestions = [];
      for (let i = 0; i < count; i++) {
        sampleQuestions.push({
          questionText: `নমুনা ${subject === 'chemistry' ? 'রসায়ন' : 'ICT'} প্রশ্ন ${i + 1} - ${chapter} (${difficulty} স্তর)`,
          questionType: questionType,
          options: questionType === 'mcq' ? ['বিকল্প ক', 'বিকল্প খ', 'বিকল্প গ', 'বিকল্প ঘ'] : null,
          correctAnswer: questionType === 'mcq' ? 'বিকল্প ক' : null,
          answer: 'Praggo AI সঠিক উত্তর এখানে প্রদান করবে। sir এর সাথে যোগাযোগ করুন।',
          marks: questionType === 'creative' ? 10 : questionType === 'cq' ? 2 : 1
        });
      }
      return sampleQuestions;
    }

    const subjectBangla = subject === 'chemistry' ? 'রসায়ন' : 'তথ্য ও যোগাযোগ প্রযুক্তি';
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

    // Get question category description
    let questionCategoryDescription = '';
    if (questionCategory === 'math-based') {
      questionCategoryDescription = 'গণিত ভিত্তিক প্রশ্ন - গণনা, সূত্র প্রয়োগ, সংখ্যাগত সমস্যা';
    } else if (questionCategory === 'theory-based') {
      questionCategoryDescription = 'তত্ত্ব ভিত্তিক প্রশ্ন - ধারণা, সংজ্ঞা, ব্যাখ্যা, তুলনা';
    } else {
      questionCategoryDescription = 'মিশ্র প্রশ্ন - গণিত ও তত্ত্ব উভয় ধরনের';
    }

    // Enhanced Bangladeshi context prompt
    const prompt = `আপনি "Praggo AI" - বাংলাদেশের শিক্ষার জন্য বিশেষভাবে ডিজাইন করা একটি AI শিক্ষা সহায়ক।

🏆 Chemistry & ICT Care by Belal Sir কোচিং সেন্টারের জন্য ${count}টি ${difficultyLevels} ${subjectBangla} প্রশ্ন তৈরি করুন।

🎯 **NEXT LEVEL BANGLADESHI ACADEMIC SYSTEM**
আপনি একজন ২০+ বছরের অভিজ্ঞ ${subjectBangla} বিশেষজ্ঞ শিক্ষক যিনি বাংলাদেশের শীর্ষ বিশ্ববিদ্যালয়ের ভর্তি পরীক্ষায় প্রশ্ন প্রণয়ন করেন।

📚 প্রশ্নের বিবরণ:
- বিষয়: ${subjectBangla} (${subject})
- পরীক্ষার ধরন: ${examTypeBangla}
- শ্রেণি: ${classLevelBangla}
- অধ্যায়/টপিক: ${chapter}
- প্রশ্নের ধরন: ${questionType}
- প্রশ্নের বিষয়বস্তু: ${questionCategoryDescription}
- কঠিনতার স্তর: ${difficultyLevels}

🇧🇩 NCTB কারিকুলাম ও বাংলাদেশের শিক্ষাব্যবস্থা অনুযায়ী:

${questionCategory === 'math-based' ? `🧮 **গণিত ভিত্তিক প্রশ্ন তৈরির বিশেষ নির্দেশনা:**
- সূত্র প্রয়োগ ভিত্তিক প্রশ্ন তৈরি করুন
- সংখ্যাগত গণনা ও হিসাব-নিকাশ অন্তর্ভুক্ত করুন
- মান নির্ণয়, পরিমাণ গণনা, শতকরা হিসাব
- গ্রাফ, চার্ট, টেবিল থেকে তথ্য বিশ্লেষণ
- বাস্তব জীবনের ডেটা দিয়ে গাণিতিক সমস্যা
- ধাপে ধাপে সমাধানযোগ্য গণনামূলক প্রশ্ন` : questionCategory === 'theory-based' ? `📖 **তত্ত্ব ভিত্তিক প্রশ্ন তৈরির বিশেষ নির্দেশনা:**
- ধারণা, সংজ্ঞা, ব্যাখ্যা ভিত্তিক প্রশ্ন
- তুলনামূলক বিশ্লেষণ ও পার্থক্য
- কারণ-ফলাফল সম্পর্ক ব্যাখ্যা
- প্রক্রিয়া বর্ণনা ও ক্রমধারা
- বৈশিষ্ট্য, গুণাবলী ও প্রয়োগ বর্ণনা
- তাত্ত্বিক জ্ঞান ও বোঝাপড়া পরীক্ষা` : `🔄 **মিশ্র প্রশ্ন তৈরির নির্দেশনা:**
- গণিত ও তত্ত্ব উভয় ধরনের প্রশ্ন তৈরি করুন
- কিছু প্রশ্নে গণনা ও কিছুতে ধারণা থাকবে
- তাত্ত্বিক জ্ঞানের সাথে ব্যবহারিক প্রয়োগ
- সূত্র ব্যাখ্যা এবং তার প্রয়োগ উভয়ই`}

${subject === 'chemistry' ? `🧪 রসায়নের জন্য বিশেষ নির্দেশনা:
- বাংলাদেশের NCTB পাঠ্যবই অনুযায়ী
- রাসায়নিক সূত্র ও বিক্রিয়া বাংলায়
- দৈনন্দিন জীবনের সাথে সম্পর্কিত উদাহরণ
- HSC/SSC বোর্ড প্রশ্নের ধারা অনুসরণ
- বাংলাদেশী প্রেক্ষাপটের উদাহরণ` : `💻 ICT এর জন্য বিশেষ নির্দেশনা:
- বাংলাদেশের ডিজিটাল যুগের প্রেক্ষাপট
- প্রোগ্রামিং, ডেটাবেস, নেটওয়ার্ক
- ব্যবহারিক সমস্যা ও সমাধান
- বাংলাদেশের প্রযুক্তি খাতের উদাহরণ
- HSC ICT বোর্ড সিলেবাস অনুযায়ী`}

📋 JSON ফরম্যাট (বাংলায় উত্তর):
${questionType === 'mcq' ? 'MCQ ফরম্যাট:' : questionType === 'cq' ? 'CQ ফরম্যাট:' : 'সৃজনশীল প্রশ্ন ফরম্যাট:'}
[{"questionText": "বাংলায় প্রশ্ন", "questionType": "${questionType}", ${questionType === 'mcq' ? '"options": ["ক) ...", "খ) ...", "গ) ...", "ঘ) ..."], "correctAnswer": "ক) ...",' : '"options": null, "correctAnswer": null,'} "answer": "বাংলায় বিস্তারিত উত্তর", "marks": ${questionType === 'creative' ? '10' : questionType === 'cq' ? '2' : '1'}}]`;

    try {
      const content = await this.makeAPICall(
        prompt, userId, userRole, 'generate_questions', subject as 'chemistry' | 'ict'
      );
      
      console.log("Praggo AI response for Bangladesh questions:", content);
      
      // Parse JSON response
      let jsonMatch = content.match(/\[[\s\S]*\]/);
      
      if (!jsonMatch) {
        jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/);
        if (jsonMatch) {
          jsonMatch = [jsonMatch[1]];
        }
      }
      
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (parseError) {
          console.error('JSON parsing failed:', parseError);
          throw new Error('Praggo AI থেকে সঠিক ফরম্যাটে উত্তর পাওয়া যায়নি।');
        }
      } else {
        throw new Error('Praggo AI থেকে JSON ফরম্যাটে উত্তর পাওয়া যায়নি।');
      }
      
    } catch (error: any) {
      console.error('Praggo AI question generation error:', error);
      throw error;
    }
  }

  // Solve student doubts with NCTB context
  async solveDoubt(
    question: string,
    subject: string,
    userId: string,
    userRole: 'student'
  ): Promise<string> {
    
    if (this.apiKeys.length === 0) {
      return `🤖 Praggo AI সমাধান (ডেমো মোড)\n\nআপনার ${subject === 'chemistry' ? 'রসায়ন' : 'ICT'} প্রশ্ন: "${question}"\n\nএটি Praggo AI দ্বারা প্রদত্ত বিস্তারিত ব্যাখ্যা হবে। সঠিক AI সমাধান পেতে sir এর সাথে যোগাযোগ করুন।`;
    }

    const subjectBangla = subject === 'chemistry' ? 'রসায়ন' : 'তথ্য ও যোগাযোগ প্রযুক্তি';

    const prompt = `আপনি "Praggo AI" - বাংলাদেশের শিক্ষার জন্য বিশেষভাবে তৈরি একটি AI শিক্ষা সহায়ক।

🎓 Chemistry & ICT Care by Belal Sir কোচিং সেন্টারের একজন বিশেষজ্ঞ ${subjectBangla} শিক্ষক হিসেবে উত্তর দিন।

📝 শিক্ষার্থীর প্রশ্ন: ${question}

🇧🇩 **বাংলাদেশের সর্বোচ্চ মানের শিক্ষা ব্যবস্থা অনুযায়ী** একটি বিশেষজ্ঞ মানের সমাধান প্রদান করুন:

📖 NCTB কারিকুলাম ২০২৪ অনুযায়ী সর্বশেষ আপডেট
🏆 ঢাবি/বুয়েট/মেডিকেল ভর্তি পরীক্ষার মান বজায় রেখে
🎯 বাংলাদেশের সাংস্কৃতিক ও ভৌগোলিক প্রেক্ষাপটে সমাধান

${subject === 'chemistry' ? `🧪 রসায়নের জন্য:
- ধাপে ধাপে সমাধান সহ রাসায়নিক সমীকরণ
- আণবিক সূত্র ও কাঠামো চিত্র (টেক্সট ফরম্যাটে)
- বাংলাদেশের দৈনন্দিন জীবনের উদাহরণ
- HSC/SSC বোর্ড পরীক্ষার প্রেক্ষাপটে ব্যাখ্যা
- নিরাপত্তা ও পরিবেশগত বিষয়াবলী
- অতিরিক্ত অনুশীলন প্রশ্নের পরামর্শ` : `💻 ICT এর জন্য:
- ব্যবহারিক কোড উদাহরণ (যদি প্রয়োজন হয়)
- প্রযুক্তিগত ধারণার সহজ ব্যাখ্যা
- বাংলাদেশের প্রযুক্তি খাতের বাস্তব প্রয়োগ
- HSC ICT সিলেবাস অনুযায়ী বিশদ বর্ণনা
- ভবিষ্যৎ ক্যারিয়ার সংযোগ
- অনুশীলনের জন্য আরও রিসোর্স`}

✨ উত্তরটি অবশ্যই:
- সহজ ও বোধগম্য বাংলায় লিখুন
- ধাপে ধাপে ব্যাখ্যা করুন
- বাংলাদেশী শিক্ষার্থীদের জন্য প্রাসঙ্গিক উদাহরণ দিন
- উৎসাহমূলক ও শিক্ষণীয় টোন ব্যবহার করুন

🎯 Praggo AI সমাধান:`;

    try {
      const result = await this.makeAPICall(
        prompt, userId, userRole, 'solve_doubt', subject as 'chemistry' | 'ict'
      );
      
      return result;
    } catch (error: any) {
      console.error('Praggo AI doubt solving error:', error);
      return `🤖 Praggo AI সমাধান (ত্রুটি)\n\nআপনার ${subjectBangla} প্রশ্ন: "${question}"\n\n❌ ${error.message}\n\nঅনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন বা শিক্ষকের সাহায্য নিন।`;
    }
  }

  // Get API usage statistics
  async getUsageStats(userId: string): Promise<any> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const usage = await db.select()
        .from(praggoAIUsage)
        .where(
          and(
            eq(praggoAIUsage.userId, userId),
            sql`${praggoAIUsage.createdAt} >= ${today}`
          )
        );
        
      return {
        todayUsage: usage.length,
        successfulCalls: usage.filter(u => u.success).length,
        failedCalls: usage.filter(u => !u.success).length,
        questionsGenerated: usage.filter(u => u.requestType === 'generate_questions').length,
        doubtsResolved: usage.filter(u => u.requestType === 'solve_doubt').length
      };
    } catch (error) {
      return {
        todayUsage: 0,
        successfulCalls: 0,
        failedCalls: 0,
        questionsGenerated: 0,
        doubtsResolved: 0
      };
    }
  }
}

// Export singleton instance
export const praggoAI = PraggoAIService.getInstance();