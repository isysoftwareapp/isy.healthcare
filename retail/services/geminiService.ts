/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";

const API_KEY = process.env.API_KEY || '';

let chatSession: Chat | null = null;

export const initializeChat = (): Chat => {
  if (chatSession) return chatSession;

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  chatSession = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: `You are 'ISY', the specialized sales consultant for isy.software.
      
      Your Product:
      "KIOSK & Admin Panel System" - An integrated digital ecosystem for retail, specifically tailored for Cannabis Retail but applicable elsewhere.
      
      Key Selling Points:
      1. One platform, total control.
      2. Modular system: Kiosk (Customer), Admin Panel (Management), Member Card (Loyalty).
      3. Features: Custom Joint Creator (3D), Real-time stock, Cashback/Loyalty engine, Offline mode.
      
      Pricing:
      - KIOSK System: ฿ 2.000/month
      - POS System: ฿ 1.000/month
      - Full Package: ฿ 3.000/month (Best Value)
      
      Tone: Professional, efficient, clear, helpful. Minimalist and precise.
      
      Goal: Explain the benefits of the system and encourage booking a demo.`,
    },
  });

  return chatSession;
};

export const sendMessageToGemini = async (message: string): Promise<string> => {
  if (!API_KEY) {
    return "I'm currently offline. Please contact us via email at info@isy.software";
  }

  try {
    const chat = initializeChat();
    const response: GenerateContentResponse = await chat.sendMessage({ message });
    return response.text || "I didn't catch that. Could you rephrase?";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I'm having trouble connecting to the server. Please try again shortly.";
  }
};