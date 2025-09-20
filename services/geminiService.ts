import type { Message, Feedback } from '../types';

/**
 * A helper function to make POST requests to our secure backend proxy.
 * @param type The type of action the backend should perform.
 * @param payload The data required for that action.
 * @returns The JSON response from the backend.
 */
const postToProxy = async (type: string, payload: object) => {
  const response = await fetch('/api/proxy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ type, payload }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`Proxy request failed with status ${response.status}:`, errorBody);
    throw new Error(`Request failed: ${response.statusText}`);
  }
  return response.json();
};


export const startInterviewWithTopic = async (topic: string): Promise<Message> => {
  return postToProxy('start_topic', { topic });
};

export const startInterviewWithGeneratedCase = async (caseType: string): Promise<Message> => {
  return postToProxy('start_generate', { caseType });
};

export const startInterviewWithUploadedCase = async (caseContent: string): Promise<Message> => {
  return postToProxy('start_upload', { caseContent });
};

export const continueConversation = async (history: Message[]): Promise<Message> => {
  return postToProxy('continue', { history });
};

export const getFinalFeedback = async (history: Message[]): Promise<Feedback> => {
  return postToProxy('feedback', { history });
};