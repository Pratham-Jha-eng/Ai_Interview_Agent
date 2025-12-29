import { GoogleGenAI, Type } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Message } from '../types';

// This is a Vercel Serverless Function running on the Node.js runtime.
// It has a longer timeout than the edge runtime, which is necessary for AI API calls.

// --- Main Handler ---
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, payload } = req.body;

    if (!process.env.API_KEY) {
      throw new Error("API_KEY environment variable not set");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    switch (type) {
      case 'start_topic': {
        const { topic } = payload;
        const chat = ai.chats.create({
          model: 'gemini-1.5-flash',
          config: { systemInstruction: INTERVIEWER_SYSTEM_INSTRUCTION },
        });
        const response = await chat.sendMessage({ message: `I'm ready to start. Please give me a case study about the ${topic} industry.` });
        return res.status(200).json({ role: 'assistant', content: response.text });
      }

      case 'start_generate': {
        const { caseType } = payload;
        const chat = ai.chats.create({
          model: 'gemini-1.5-flash',
          config: { systemInstruction: INTERVIEWER_SYSTEM_INSTRUCTION },
        });
        const response = await chat.sendMessage({ message: `I'm ready to start. Please generate and present a new, unique case study of the '${caseType}' type.` });
        return res.status(200).json({ role: 'assistant', content: response.text });
      }

      case 'start_upload': {
        const { caseContent } = payload;
        const UPLOAD_SYSTEM_INSTRUCTION = getUploadSystemInstruction(caseContent);
        const chat = ai.chats.create({
          model: 'gemini-1.5-flash',
          config: { systemInstruction: UPLOAD_SYSTEM_INSTRUCTION },
        });
        const response = await chat.sendMessage({ message: `I've uploaded my casebook. Please begin.` });
        return res.status(200).json({ role: 'assistant', content: response.text });
      }

      case 'continue': {
        const { history, caseContent } = payload as { history: Message[], caseContent?: string | null };
        const lastMessage = history[history.length - 1];
        const geminiHistory = history.slice(0, -1).map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }],
        }));
        
        // Conditionally set the system instruction
        const systemInstruction = caseContent 
            ? getUploadSystemInstruction(caseContent) 
            : INTERVIEWER_SYSTEM_INSTRUCTION;
            
        const chat = ai.chats.create({ 
            model: 'gemini-1.5-flash',
            history: geminiHistory,
            config: { systemInstruction } // Use the determined system instruction
        });

        const response = await chat.sendMessage({ message: lastMessage.content });
        return res.status(200).json({ role: 'assistant', content: response.text });
      }
      
      case 'feedback': {
        const { history } = payload as { history: Message[] };
        const transcript = history.map(msg => `${msg.role === 'user' ? 'Candidate' : 'Interviewer'}: ${msg.content}`).join('\n\n');
        const prompt = getFeedbackPrompt(transcript);

        const response = await ai.models.generateContent({
          model: "gemini-1.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: FEEDBACK_SCHEMA,
          },
        });
        
        let jsonStr = response.text.trim();
        if (jsonStr.startsWith('```json')) {
            jsonStr = jsonStr.substring(7, jsonStr.length - 3).trim();
        } else if (jsonStr.startsWith('```')) {
            jsonStr = jsonStr.substring(3, jsonStr.length - 3).trim();
        }

        const feedback = JSON.parse(jsonStr);
        return res.status(200).json(feedback);
      }

      default:
        return res.status(400).json({ error: `Invalid type: ${type}` });
    }

  } catch (error: any) {
    console.error('Error in proxy:', error);
    return res.status(500).json({ error: error.message || 'An internal server error occurred' });
  }
}


// --- Prompts and Schemas ---

const INTERVIEWER_SYSTEM_INSTRUCTION = `You are an expert case study interviewer from a top consulting firm like McKinsey, BCG, or Bain. Your goal is to assess the candidate's problem-solving skills.
1.  **Start the Case:** Begin by presenting the case study problem clearly and concisely based on the user's chosen topic or the case you generate.
2.  **Guide, Don't Solve:** Guide the candidate through a structured approach: clarifying questions, framework development, analysis, and final recommendation.
3.  **Probe for Depth:** Do not give away answers. Instead, ask probing questions like "What data would you need to verify that?", "How would you structure your analysis for this part?", or "Are there any risks associated with your recommendation?".
4.  **Maintain Persona:** Maintain a professional, encouraging, yet challenging tone throughout. Keep responses concise and focused on moving the case forward.
5.  **Data Provision:** If the user asks for specific data, you can invent reasonable data points to provide them. For example, if they ask for market size, you can say "The market size is approximately $10 billion annually."
6.  **Clear Formatting:** When presenting complex information, such as the initial case prompt or data points, use clear formatting. Use newlines to separate paragraphs and bullet points (using \`*\` or \`-\`) for lists to enhance readability.
`;

const getUploadSystemInstruction = (caseContent: string) => `You are an expert case study interviewer from a top consulting firm. Your goal is to assess a candidate's problem-solving skills.

**IMPORTANT RULE:** You must conduct the interview based *only* on the following provided case study material. Do not invent a new case. Use the text below as the source for the case problems. When the candidate is ready, you can ask them which case from the provided text they'd like to begin with, or begin with the first one if only one is provided.

--- CASEBOOK CONTENT ---
${caseContent}
--- END CASEBOOK CONTENT ---
`;

const getFeedbackPrompt = (transcript: string) => `Analyze the following case interview transcript. Provide structured, educational feedback on the candidate's performance.

**Formatting Rules (Very Important):**
- Use markdown for all lists, using either \`-\` or \`*\` for bullet points.
- Ensure proper indentation for nested lists.
- When introducing a new topic or point, especially if it's bolded (e.g., **My Point**), YOU MUST start it on a new line. Do not run bolded headers together on the same line.
- Use newlines (\`\\n\`) to create separate paragraphs for distinct ideas to improve readability.

Your feedback should be detailed and aimed at helping the candidate learn and improve. Evaluate their structure, analytical rigor, business acumen, and communication.

Provide the following five sections:
1.  **Overall Summary:** A brief, overall summary of the candidate's performance.
2.  **Strengths:** A list of key strengths, with specific examples from the transcript.
3.  **Areas for Improvement:** A list of specific, actionable areas for improvement, with examples.
4.  **Missed Concepts:** A detailed explanation of any key concepts, frameworks, or analytical points the candidate missed or could have applied more effectively. This section should be educational.
5.  **Key Takeaways:** A set of concise, bullet-pointed notes the candidate can save for future reference. These should be actionable tips and reminders.

Transcript:
---
${transcript}
---
`;

const FEEDBACK_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    overallSummary: { type: Type.STRING, description: "A brief, overall summary of the candidate's performance. Ensure paragraphs are separated by newlines." },
    strengths: { type: Type.STRING, description: "Detail key strengths as a markdown list (using `-` or `*`). Each point, especially if it starts with a bolded phrase like **Communication:**, must be on its own line. Provide specific transcript examples." },
    areasForImprovement: { type: Type.STRING, description: "List actionable areas for improvement as a markdown list (using `-` or `*`). Each point, especially if it starts with a bolded phrase like **Framework:**, must be on its own line. Provide examples." },
    missedConcepts: { type: Type.STRING, description: "A detailed, educational explanation of missed concepts or frameworks. Use bold headers for each concept (e.g., **Profitability Framework:**), and place each on a new line. Use markdown lists and indentation for structure." },
    keyTakeaways: { type: Type.STRING, description: "Provide concise notes as a markdown list (e.g., `- Takeaway 1`). Each takeaway must be on its own line." }
  },
  required: ["overallSummary", "strengths", "areasForImprovement", "missedConcepts", "keyTakeaways"]
};
