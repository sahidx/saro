import Anthropic from '@anthropic-ai/sdk';

const DEFAULT_MODEL_STR = "claude-sonnet-4-20250514";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Generate questions using Claude AI
export async function generateQuestions(topic: string, subject: string, count: number, difficulty: string): Promise<any> {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('Anthropic API key is required for question generation. Please configure ANTHROPIC_API_KEY in environment variables.');
    }

    const prompt = `Generate ${count} ${difficulty} level multiple choice questions about ${topic} in ${subject}. 
    
For ${subject === 'chemistry' ? 'Chemistry' : 'ICT'} questions:
${subject === 'chemistry' 
  ? '- Include molecular formulas, chemical equations, and reactions\n- Cover concepts like atomic structure, bonding, thermodynamics\n- Use proper chemical nomenclature' 
  : '- Cover programming, networks, databases, web development\n- Include practical scenarios and real-world applications\n- Focus on both theoretical and practical skills'
}

Return only a JSON array of questions in this exact format:
[
  {
    "questionText": "Question text here?",
    "questionType": "mcq",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option A",
    "marks": 2
  }
]`;

    const response = await anthropic.messages.create({
      model: DEFAULT_MODEL_STR,
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = (response.content[0] as any).text;
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('Invalid AI response format');
    }
  } catch (error) {
    console.error('Error generating questions:', error);
    throw new Error('Failed to generate questions. Please check API configuration and try again.');
  }
}

// Solve student doubts using Claude AI
export async function solveDoubt(question: string, subject: string): Promise<string> {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('Anthropic API key is required for doubt solving. Please configure ANTHROPIC_API_KEY in environment variables.');
    }

    const prompt = `As an expert ${subject} teacher, solve this student's doubt:

Question: ${question}

Provide a clear, step-by-step explanation that includes:
${subject === 'chemistry' 
  ? '- Chemical formulas and equations if relevant\n- Conceptual explanations\n- Real-world applications\n- Safety considerations if applicable' 
  : '- Code examples if relevant\n- Technical concepts\n- Practical applications\n- Best practices'
}

Make it educational and easy to understand for a student.`;

    const response = await anthropic.messages.create({
      model: DEFAULT_MODEL_STR,
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }]
    });

    return (response.content[0] as any).text;
  } catch (error) {
    console.error('Error solving doubt:', error);
    throw new Error('Failed to solve doubt. Please check API configuration and try again.');
  }
}