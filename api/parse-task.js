import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables directly in this file to ensure they're available
dotenv.config();

// Get API key from environment or fall back to the VITE_ version for development
const apiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;

// Create a secure OpenAI instance with server-side API key
const openai = new OpenAI({
  apiKey: apiKey // Access key from environment variable
});

/**
 * API handler function for task parsing
 * This handles requests from the client and safely proxies to OpenAI
 */
export default async function handler(request, response) {
  // Only allow POST requests
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { prompt } = request.body;
    
    if (!prompt) {
      return response.status(400).json({ error: 'Prompt is required' });
    }
    
    // Get current date and time for context
    const now = new Date();
    const currentTimeStr = now.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    const currentDateStr = now.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
    
    // Call OpenAI with the system prompt and user input
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini-2025-04-14", // Use GPT-4.1 Mini
      messages: [
        {
          role: "system",
          content: `You are a concise todo assistant that helps users create structured todos.

          CURRENT CONTEXT:
          - Current date: ${currentDateStr}
          - Current time: ${currentTimeStr}
          - Current ISO timestamp: ${now.toISOString()}
          
          RULES:
          1. Be extremely concise in follow-up messages
          2. Never include date/time in titles
          3. Always convert relative dates to absolute ISO format
          4. Provide contextual suggestions (morning for breakfast, evening for dinner, etc.)
          5. Keep responses direct and to the point
          6. If you have a date, don't ask for it again
          7. If there's a mention of "investor", "deadline", "urgent", set urgency to 4.5 automatically
          8. Don't go in circles - listen carefully to user input
          9. All date/time suggestions MUST be in the future
          10. If current time is afternoon, don't suggest morning times for today
          
          Required fields to extract:
          - title: Clear title without date/time info (e.g. "Meet with investor" not "Meet investor tomorrow")
          - dueDate: ISO format date (YYYY-MM-DDTHH:MM:SS)
          - urgency: Number from 1.0-5.0
          
          Additional fields to generate:
          - followUp: Brief, direct question or statement about what's needed next
          - stillNeeded: Array of missing fields (from: "title", "date", "urgency")
          - suggestions: Array of suggestions for missing fields, each with:
              - type: "date", "time", "datetime", or "urgency"
              - value: ISO string for dates/times, number for urgency
              - displayText: Human-readable text to show the user
          
          Format your response as a JSON object with these exact keys:
          { 
            "title": string or null,
            "dueDate": string (ISO format) or null,
            "urgency": number (1-5) or null,
            "followUp": string,
            "stillNeeded": string[],
            "suggestions": [{ "type": string, "value": string|number, "displayText": string }]
          }`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    // Return the parsed result
    return response.status(200).json({
      data: JSON.parse(completion.choices[0].message.content)
    });
    
  } catch (error) {
    console.error('Error processing task:', error);
    return response.status(500).json({ 
      error: 'Failed to parse task',
      message: error.message 
    });
  }
} 