/**
 * File: openai.js
 * Purpose: Provides OpenAI GPT-4.1 Mini integration for parsing task input
 * 
 * Parses natural language input into structured task data with:
 * - title: The main task description
 * - dueDate: When the task is due (ISO string or null)
 * - urgency: Priority level from 1-5 (or null if not specified)
 */
import OpenAI from 'openai'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // For client-side usage (not recommended for production)
})

/**
 * Parse natural language task input using GPT-4.1 Mini
 * @param {string} prompt - User input like "Learn JavaScript tomorrow at 7PM"
 * @returns {Promise<Object>} Parsed task object with title, dueDate, and urgency
 */
export const parseTaskInput = async (prompt) => {
  // Return default for empty prompts
  if (!prompt || !prompt.trim()) {
    return { title: "Untitled Task", dueDate: null, urgency: null };
  }
  
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini-2025-04-14", // Use GPT-4.1 Mini
      messages: [
        {
          role: "system",
          content: `You are a task parsing assistant that extracts structured data from natural language.
          
          RULES:
          - Extract the core task title, removing any time/date/urgency mentions
          - Convert any date reference (today, tomorrow, next week, Friday, etc.) to a precise ISO string
          - Extract urgency level (1-5) from explicit mentions or keywords
          - Today's date is ${new Date().toISOString().split('T')[0]}
          - Set times to 9:00 AM by default if only a date is provided
          - If a time is mentioned without AM/PM, infer based on context
          - Set urgency to null if not specified
          - Set dueDate to null if not specified
          - Ensure the title is never shorter than 3 words unless the entire prompt is very short
          
          Format your response as a JSON object with these exact keys:
          { 
            "title": string,
            "dueDate": string (ISO format) or null,
            "urgency": number (1-5) or null
          }`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.2, // Lower temperature for more consistent parsing
      response_format: { type: "json_object" }
    });

    // Parse the response
    const result = JSON.parse(completion.choices[0].message.content);
    
    // Validate the response
    if (!result.title || result.title.trim().length === 0) {
      result.title = prompt.length > 30 ? prompt.substring(0, 30) + "..." : prompt;
    }
    
    // Title fallback
    if (!result.title || result.title.trim().length === 0) {
      result.title = "Untitled Task";
    }
    
    return result;
  } catch (error) {
    console.error("Error parsing task with OpenAI:", error);
    
    // Fallback to local parsing when API fails
    return fallbackParsing(prompt);
  }
}

/**
 * Fallback function for local parsing when OpenAI is unavailable
 * @param {string} prompt - User input
 * @returns {Object} Best-effort parsed task data
 */
const fallbackParsing = (prompt) => {
  if (!prompt || !prompt.trim()) {
    return { title: "Untitled Task", dueDate: null, urgency: null };
  }
  
  const today = new Date();
  let dueDate = null;
  let title = prompt.trim();
  let urgency = null;
  
  // Create a clean version of the prompt for easier parsing
  const lowerPrompt = prompt.toLowerCase();
  
  // -------------------------------------------------------------------
  // DATE PARSING
  // -------------------------------------------------------------------
  
  // Extract relative date expressions (today, tomorrow, etc.)
  if (lowerPrompt.includes('today')) {
    dueDate = new Date(today);
    title = title.replace(/\btoday\b/i, '').trim();
  } else if (lowerPrompt.includes('tomorrow')) {
    dueDate = new Date(today);
    dueDate.setDate(dueDate.getDate() + 1);
    title = title.replace(/\btomorrow\b/i, '').trim();
  } else if (lowerPrompt.includes('next week') || lowerPrompt.includes('in a week')) {
    dueDate = new Date(today);
    dueDate.setDate(dueDate.getDate() + 7);
    title = title.replace(/\bnext week\b|\bin a week\b/i, '').trim();
  } else if (lowerPrompt.includes('next month') || lowerPrompt.includes('in a month')) {
    dueDate = new Date(today);
    dueDate.setMonth(dueDate.getMonth() + 1);
    title = title.replace(/\bnext month\b|\bin a month\b/i, '').trim();
  }
  
  // Extract weekday references
  const weekdays = [
    { day: 'sunday', index: 0 },
    { day: 'monday', index: 1 },
    { day: 'tuesday', index: 2 },
    { day: 'wednesday', index: 3 },
    { day: 'thursday', index: 4 },
    { day: 'friday', index: 5 },
    { day: 'saturday', index: 6 }
  ];
  
  // Check for weekday mentions
  for (const { day, index } of weekdays) {
    // Look for patterns like "on monday", "next monday", "this monday"
    const dayRegex = new RegExp(`\\b(on|next|this)\\s+${day}\\b`, 'i');
    const nextDayRegex = new RegExp(`\\bnext\\s+${day}\\b`, 'i'); 
    
    if (lowerPrompt.match(dayRegex)) {
      const targetDay = new Date(today);
      const currentDay = today.getDay();
      let daysToAdd;
      
      if (nextDayRegex.test(lowerPrompt)) {
        // For "next Monday", go to the Monday after this coming one
        daysToAdd = (index - currentDay + 7) % 7;
        if (daysToAdd === 0) daysToAdd = 7; // If today is the day, go to next week
      } else {
        // For "on Monday" or "this Monday", go to the upcoming one
        daysToAdd = (index - currentDay + 7) % 7;
        if (daysToAdd === 0 && day !== 'today') daysToAdd = 7; // Same day but not "today"
      }
      
      targetDay.setDate(targetDay.getDate() + daysToAdd);
      dueDate = targetDay;
      
      // Remove the weekday reference from the title
      title = title.replace(dayRegex, '').trim();
    }
  }
  
  // -------------------------------------------------------------------
  // TIME PARSING
  // -------------------------------------------------------------------
  
  // Look for time expressions like "at 7PM", "at 3:30pm", "7PM", "3:30pm", "5 o'clock"
  // More comprehensive than before - captures various time formats
  const timeRegex = /\b(?:at\s+)?(\d{1,2})(?::(\d{1,2}))?\s*(?:([ap]\.?m\.?)|o'clock)?\b/i;
  const timeMatch = lowerPrompt.match(timeRegex);
  
  if (timeMatch) {
    // If we have a time but no date yet, set date to today
    if (!dueDate) {
      dueDate = new Date(today);
    }
    
    const [fullMatch, hourStr, minuteStr, ampmStr] = timeMatch;
    let hour = parseInt(hourStr, 10);
    const minutes = minuteStr ? parseInt(minuteStr, 10) : 0;
    
    // Convert to 24-hour format
    if (ampmStr && /p/i.test(ampmStr) && hour < 12) {
      hour += 12; // Convert PM to 24-hour
    } else if (ampmStr && /a/i.test(ampmStr) && hour === 12) {
      hour = 0; // 12AM is 0 in 24-hour
    } else if (!ampmStr && hour < 12) {
      // No AM/PM specified
      const currentHour = today.getHours();
      
      // For ambiguous times (no am/pm), assume reasonable defaults
      if (currentHour > hour) {
        // If the hour has already passed today, assume PM
        hour += 12;
      } else if (hour < 7) {
        // Very early hours without am/pm likely mean PM
        hour += 12;
      }
    }
    
    // Set time on the due date
    dueDate.setHours(hour, minutes, 0, 0);
    
    // Remove the time expression from the title
    title = title.replace(fullMatch, '').trim();
  } else if (dueDate) {
    // If we have a date but no time specified, set a reasonable default time (9AM)
    dueDate.setHours(9, 0, 0, 0);
  }
  
  // -------------------------------------------------------------------
  // URGENCY PARSING
  // -------------------------------------------------------------------
  
  // Check for urgency in various formats
  const urgencyPatterns = [
    { regex: /\b(?:urgency|priority|importance)(?:\s+(?:level|rating))?(?:\s*[:=]?\s*)(\d+)\b/i, group: 1 },
    { regex: /\b(\d+)(?:\s+(?:urgency|priority|importance))\b/i, group: 1 },
    { regex: /\b(?:priority|urgency)(?:\s+(?:is|of))?\s+(high|medium|low)\b/i, group: 1, 
      map: { 'high': 5, 'medium': 3, 'low': 1 } }
  ];
  
  // Try each urgency pattern
  for (const pattern of urgencyPatterns) {
    const match = title.match(pattern.regex);
    if (match) {
      if (pattern.map) {
        urgency = pattern.map[match[pattern.group].toLowerCase()];
      } else {
        urgency = parseInt(match[pattern.group], 10);
      }
      
      // Enforce valid range
      if (urgency < 1) urgency = 1;
      if (urgency > 5) urgency = 5;
      
      // Remove urgency expression from title
      title = title.replace(match[0], '').trim();
      break; // Stop after first match
    }
  }
  
  // Look for urgency keywords
  const urgencyKeywords = [
    { word: 'urgent', value: 5 },
    { word: 'asap', value: 5 },
    { word: 'emergency', value: 5 },
    { word: 'critical', value: 5 },
    { word: 'immediate', value: 5 },
    { word: 'important', value: 4 },
    { word: 'high priority', value: 4 },
    { word: 'soon', value: 3 },
    { word: 'moderate', value: 3 },
    { word: 'normal', value: 3 },
    { word: 'low priority', value: 2 },
    { word: 'whenever', value: 1 },
    { word: 'low importance', value: 1 },
    { word: 'not urgent', value: 1 }
  ];
  
  // If urgency not set yet, check for keywords
  if (!urgency) {
    for (const keyword of urgencyKeywords) {
      if (lowerPrompt.includes(keyword.word)) {
        urgency = keyword.value;
        // Remove the keyword from the title
        title = title.replace(new RegExp('\\b' + keyword.word + '\\b', 'i'), '').trim();
        break;
      }
    }
  }
  
  // -------------------------------------------------------------------
  // FINAL CLEANUP
  // -------------------------------------------------------------------
  
  // Clean up the title - remove extra spaces, dots, etc.
  title = title
    .replace(/\s{2,}/g, ' ')            // Replace multiple spaces with single space
    .replace(/^\s*[,;:.]\s*/g, '')      // Remove leading punctuation
    .replace(/\s*[,;:.]\s*$/g, '')      // Remove trailing punctuation
    .trim();
  
  // If title is empty or too short after all the replacements, use a default
  if (!title || title.length < 3) {
    title = "Untitled Task";
  }
  
  // For any date in the past, push it to the future
  if (dueDate && dueDate < today) {
    // If it's earlier today, keep the time but make it tomorrow
    if (dueDate.toDateString() === today.toDateString()) {
      dueDate.setDate(dueDate.getDate() + 1);
    } else {
      // If it's a past date, move it to next occurrence (e.g., "Monday" when today is Wednesday)
      dueDate.setDate(dueDate.getDate() + 7);
    }
  }
  
  return {
    title,
    dueDate: dueDate ? dueDate.toISOString() : null,
    urgency
  };
};
