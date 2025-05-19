/**
 * File: openai.js
 * Purpose: Provides OpenAI GPT-4.1 Mini integration for parsing task input
 * 
 * Parses natural language input into structured task data with:
 * - title: The main task description (without date/time info)
 * - dueDate: When the task is due (ISO string or null)
 * - urgency: Priority level from 1-5 (or null if not specified)
 * - followUp: Brief, direct question or statement about what's needed next
 * - stillNeeded: Array of missing fields
 * - suggestions: Array of date/time/urgency suggestions
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
 * @returns {Promise<Object>} Parsed task object with title, dueDate, urgency, followUp, stillNeeded, and suggestions
 */
export const parseTaskInput = async (prompt) => {
  // Return default for empty prompts
  if (!prompt || !prompt.trim()) {
    return { 
      title: "Untitled Task", 
      dueDate: null, 
      urgency: null,
      followUp: "What's this task about?",
      stillNeeded: ["title", "date", "urgency"],
      suggestions: []
    };
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
  
  try {
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
    
    // Ensure all required fields exist
    if (!result.followUp) {
      result.followUp = "Anything else to add?";
    }
    
    if (!result.stillNeeded || !Array.isArray(result.stillNeeded)) {
      result.stillNeeded = [];
      if (!result.title) result.stillNeeded.push("title");
      if (!result.dueDate) result.stillNeeded.push("date");
      if (!result.urgency) result.stillNeeded.push("urgency");
    }
    
    if (!result.suggestions || !Array.isArray(result.suggestions)) {
      result.suggestions = [];
      
      // Add default suggestions for missing fields
      if (!result.dueDate && !result.stillNeeded.includes("date")) {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);
        
        result.suggestions.push({
          type: "datetime",
          value: tomorrow.toISOString(),
          displayText: "Tomorrow morning"
        });
        
        const today = new Date(now);
        today.setHours(now.getHours() + 2, 0, 0, 0);
        if (today.getHours() < 23) {
          result.suggestions.push({
            type: "datetime",
            value: today.toISOString(),
            displayText: "Later today"
          });
        }
      }
      
      if (!result.urgency && !result.stillNeeded.includes("urgency")) {
        result.suggestions.push(
          {
            type: "urgency",
            value: 4.0,
            displayText: "High (4)"
          },
          {
            type: "urgency",
            value: 3.0,
            displayText: "Medium (3)"
          }
        );
      }
    }
    
    // Check for investor, deadline, or urgent keywords for automatic urgency
    if (!result.urgency && 
        (prompt.toLowerCase().includes("investor") || 
         prompt.toLowerCase().includes("deadline") || 
         prompt.toLowerCase().includes("urgent"))) {
      result.urgency = 4.5;
      // Remove urgency from still needed if it was set automatically
      result.stillNeeded = result.stillNeeded.filter(item => item !== "urgency");
    }
    
    // Ensure all dates in suggestions are in the future
    if (result.suggestions && Array.isArray(result.suggestions)) {
      result.suggestions = result.suggestions.map(suggestion => {
        if ((suggestion.type === "date" || suggestion.type === "datetime" || suggestion.type === "time") && 
            suggestion.value) {
          const suggestionDate = new Date(suggestion.value);
          if (suggestionDate < now) {
            // Adjust date to be in the future
            if (suggestionDate.toDateString() === now.toDateString()) {
              // Same day but earlier time, add a day
              suggestionDate.setDate(suggestionDate.getDate() + 1);
            } else {
              // Past date, set to appropriate future time
              while (suggestionDate < now) {
                suggestionDate.setDate(suggestionDate.getDate() + 1);
              }
            }
            suggestion.value = suggestionDate.toISOString();
          }
        }
        return suggestion;
      });
    }
    
    return result;
  } catch (error) {
    console.error("Error parsing task with OpenAI:", error);
    
    // Fallback to local parsing when API fails
    return fallbackParsing(prompt, now);
  }
}

/**
 * Fallback function for local parsing when OpenAI is unavailable
 * @param {string} prompt - User input
 * @param {Date} currentTime - Current time reference
 * @returns {Object} Best-effort parsed task data
 */
const fallbackParsing = (prompt, currentTime) => {
  const now = currentTime || new Date();
  
  if (!prompt || !prompt.trim()) {
    return { 
      title: "Untitled Task", 
      dueDate: null, 
      urgency: null,
      followUp: "What's this task about?",
      stillNeeded: ["title", "date", "urgency"],
      suggestions: [
        {
          type: "datetime",
          value: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
          displayText: "Tomorrow morning"
        },
        {
          type: "urgency",
          value: 3,
          displayText: "Medium priority"
        }
      ]
    };
  }
  
  const today = new Date(now);
  let dueDate = null;
  let title = prompt.trim();
  let urgency = null;
  let stillNeeded = [];
  let suggestions = [];
  
  // Create a clean version of the prompt for easier parsing
  const lowerPrompt = prompt.toLowerCase();
  
  // Automatically set higher urgency for investor, deadline, or urgent mentions
  if (lowerPrompt.includes("investor") || lowerPrompt.includes("deadline") || lowerPrompt.includes("urgent")) {
    urgency = 4.5;
  } else {
    stillNeeded.push("urgency");
    suggestions.push(
      {
        type: "urgency",
        value: 4.0,
        displayText: "High (4)"
      },
      {
        type: "urgency",
        value: 3.0,
        displayText: "Medium (3)"
      }
    );
  }
  
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
  
  // Look for time expressions like "at 7PM", "at 3:30pm", "7PM", "3:30pm", "5 o'clock", "evening", "morning", etc.
  // First check for specific time patterns with numbers
  const specificTimeRegex = /\b(?:at\s+)?(\d{1,2})(?::(\d{1,2}))?\s*(?:([ap]\.?m\.?)|o'clock)?\b/i;
  const pmAmIndicator = /\b(?:\d{1,2})(?::(?:\d{1,2}))?\s*([ap]\.?m\.?)\b/i; // Separate check for AM/PM
  const militaryTimeRegex = /\b(\d{1,2})(?::(\d{1,2}))?\s*(?:hours?|h)\b/i;
  
  // Check for PM specifically mentioned in the entire prompt
  const isPmMentioned = /\b(?:evening|night|afternoon|pm|p\.m\.|[2-9]pm)\b/i.test(lowerPrompt);
  const isAmMentioned = /\b(?:morning|dawn|am|a\.m\.|[2-9]am)\b/i.test(lowerPrompt);
  
  const timeMatch = lowerPrompt.match(specificTimeRegex) || lowerPrompt.match(militaryTimeRegex);
  const pmAmMatch = lowerPrompt.match(pmAmIndicator);
  
  // Check for general time descriptors if no specific time found
  const timeDescriptors = [
    // More precise time periods
    { terms: ['early morning', 'dawn', 'sunrise', 'first thing in the morning'], hour: 6, minute: 0 },
    { terms: ['morning', 'before noon', 'am', 'a.m.'], hour: 9, minute: 0 },
    { terms: ['late morning'], hour: 11, minute: 0 },
    { terms: ['noon', 'lunch', 'midday', 'lunch time', 'lunch hour'], hour: 12, minute: 0 },
    { terms: ['early afternoon', 'after lunch'], hour: 13, minute: 0 },
    { terms: ['afternoon', 'mid afternoon', 'pm', 'p.m.'], hour: 15, minute: 0 },
    { terms: ['late afternoon', 'end of day', 'before evening'], hour: 17, minute: 0 },
    { terms: ['evening', 'dusk', 'sunset', 'dinnertime', 'dinner time', '6pm', '7pm'], hour: 18, minute: 0 },
    { terms: ['early evening'], hour: 19, minute: 0 },
    { terms: ['night', 'tonight', 'nighttime', '8pm', '9pm'], hour: 20, minute: 0 },
    { terms: ['late night', '10pm', '11pm'], hour: 23, minute: 0 },
    { terms: ['midnight', '12am'], hour: 0, minute: 0 },
    // Handle relative time expressions
    { regex: /\bin\s+(\d+)\s+hours?\b/i, hourOffset: true },
    { regex: /\bin\s+an\s+hour\b/i, hourOffset: 1 },
    { regex: /\bin\s+half\s+an\s+hour\b/i, minuteOffset: 30 },
    { regex: /\bin\s+(\d+)\s+minutes?\b/i, minuteOffset: true },
    { regex: /\bafter\s+(\d+)\s+hours?\b/i, hourOffset: true },
    { regex: /\bafter\s+(\d+)\s+minutes?\b/i, minuteOffset: true },
  ];
  
  if (timeMatch) {
    // If we have a time but no date yet, set date to today
    if (!dueDate) {
      dueDate = new Date(today);
    }
    
    const [fullMatch, hourStr, minuteStr, ampmStr] = timeMatch;
    let hour = parseInt(hourStr, 10);
    const minutes = minuteStr ? parseInt(minuteStr, 10) : 0;
    
    // Handle military time format (24-hour clock)
    if (lowerPrompt.match(/\b\d{1,2}(?::\d{1,2})?\s*(?:hours?|h)\b/i)) {
      // Already in 24-hour format
      if (hour > 23) hour = 23; // Validate hour
    } else {
      // Check for AM/PM indicator from both the matched time and the entire prompt
      const ampmIndicator = ampmStr || (pmAmMatch ? pmAmMatch[1] : null);
      
      // Convert to 24-hour format for 12-hour clock
      if (ampmIndicator && /p/i.test(ampmIndicator) && hour < 12) {
        hour += 12; // Convert PM to 24-hour
      } else if (ampmIndicator && /a/i.test(ampmIndicator) && hour === 12) {
        hour = 0; // 12AM is 0 in 24-hour
      } else if (!ampmIndicator) {
        // No explicit AM/PM specified in the time expression, use context clues
        
        // Special handling for common hour expressions with context clues
        if (hour >= 1 && hour <= 6) {
          // For hours 1-6, check for PM context clues in the entire prompt
          if (isPmMentioned || lowerPrompt.includes('evening') || lowerPrompt.includes('night') || 
              lowerPrompt.includes('afternoon') || lowerPrompt.includes('dinner')) {
            hour += 12; // Convert to PM based on context
            console.log(`Converted ${hour-12} to ${hour} (PM) based on context clues`);
          }
        } else if (hour >= 7 && hour <= 11) {
          // For 7-11, use context to determine AM/PM
          if (isPmMentioned && !isAmMentioned) {
            hour += 12; // Convert to PM based on context
            console.log(`Converted ${hour-12} to ${hour} (PM) based on context clues`);
          }
        } else if (hour === 12) {
          // 12 without AM/PM is usually noon, not midnight
          if (isAmMentioned && !isPmMentioned) {
            hour = 0; // Convert to midnight if AM is mentioned
          }
        } else if (hour > 12 && hour < 24) {
          // Hours > 12 without AM/PM are already in 24-hour format
        } else if (hour === 0) {
          // 0 hour means midnight
        } else {
          // Invalid hour, default to 9AM
          hour = 9;
        }
      }
    }
    
    // Set time on the due date
    dueDate.setHours(hour, minutes, 0, 0);
    
    // Remove the time expression from the title
    title = title.replace(fullMatch, '').trim();
  } else {
    // If no specific time found, check for time descriptors
    let timeDescriptorFound = false;
    
    // First check for relative time offsets
    for (const descriptor of timeDescriptors) {
      if (descriptor.regex) {
        const match = lowerPrompt.match(descriptor.regex);
        if (match) {
          // If we have a descriptor but no date yet, set date to today
          if (!dueDate) {
            dueDate = new Date(today);
          }
          
          if (descriptor.hourOffset === true && match[1]) {
            // "in X hours" or "after X hours"
            const hours = parseInt(match[1], 10);
            dueDate.setHours(dueDate.getHours() + hours);
          } else if (typeof descriptor.hourOffset === 'number') {
            // "in an hour"
            dueDate.setHours(dueDate.getHours() + descriptor.hourOffset);
          } else if (descriptor.minuteOffset === true && match[1]) {
            // "in X minutes" or "after X minutes"
            const minutes = parseInt(match[1], 10);
            dueDate.setMinutes(dueDate.getMinutes() + minutes);
          } else if (typeof descriptor.minuteOffset === 'number') {
            // "in half an hour"
            dueDate.setMinutes(dueDate.getMinutes() + descriptor.minuteOffset);
          }
          
          title = title.replace(match[0], '').trim();
          timeDescriptorFound = true;
          break;
        }
      }
    }
    
    // If no relative offsets found, check for named time periods
    if (!timeDescriptorFound) {
      for (const descriptor of timeDescriptors) {
        if (descriptor.terms) {
          for (const term of descriptor.terms) {
            if (lowerPrompt.includes(term)) {
              // If we have a descriptor but no date yet, set date to today
              if (!dueDate) {
                dueDate = new Date(today);
              }
              
              dueDate.setHours(descriptor.hour, descriptor.minute, 0, 0);
              title = title.replace(new RegExp(`\\b${term}\\b`, 'i'), '').trim();
              timeDescriptorFound = true;
              break;
            }
          }
          if (timeDescriptorFound) break;
        }
      }
    }
    
    // If we have a date but no time specified from any method, set a reasonable default time (9AM)
    if (dueDate && !timeDescriptorFound) {
      dueDate.setHours(9, 0, 0, 0);
    }
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
    const dueHour = dueDate.getHours();
    const dueMinute = dueDate.getMinutes();
    
    // If it's earlier today, keep the time but make it tomorrow
    if (dueDate.toDateString() === today.toDateString()) {
      console.log("Adjusting time: parsed time is in the past today");
      dueDate.setDate(dueDate.getDate() + 1);
    } else if (dueDate.getDate() === today.getDate() &&
              dueDate.getMonth() === today.getMonth() &&
              dueDate.getFullYear() === today.getFullYear()) {
      // Same day but somehow earlier (this is an edge case)
      console.log("Adjusting time: same day but earlier time");
      dueDate.setDate(dueDate.getDate() + 1);
    } else {
      // If it's a past date (e.g., "Monday" when today is Wednesday)
      console.log("Adjusting date: parsed date is in the past");
      
      // For weekday references, skip to next week
      if (lowerPrompt.match(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i) ||
          lowerPrompt.match(/\bnext\s+(week|month)\b/i)) {
        console.log("Weekday or next week/month reference found, adding 7 days");
        dueDate.setDate(dueDate.getDate() + 7);
      } else {
        // For other cases, just increment the date until it's in the future
        while (dueDate < today) {
          dueDate.setDate(dueDate.getDate() + 1);
        }
      }
    }
    
    // Verify the adjustment worked
    console.log(`Adjusted due date: ${dueDate.toISOString()}`);
  }
  
  // Create date suggestions if no date was found
  if (!dueDate) {
    stillNeeded.push("date");
    
    // Generate some reasonable date suggestions
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    
    const laterToday = new Date(today);
    laterToday.setHours(today.getHours() + 2, 0, 0, 0);
    
    // Only suggest times that are in the future
    if (laterToday > today) {
      suggestions.push({
        type: "datetime",
        value: laterToday.toISOString(),
        displayText: "Later today"
      });
    }
    
    suggestions.push({
      type: "datetime",
      value: tomorrow.toISOString(),
      displayText: "Tomorrow morning"
    });
    
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    nextWeek.setHours(9, 0, 0, 0);
    
    suggestions.push({
      type: "datetime",
      value: nextWeek.toISOString(),
      displayText: "Next week"
    });
  }
  
  // Generate follow-up message based on missing information
  let followUp = "";
  
  if (!title || title === "Untitled Task") {
    stillNeeded.push("title");
    followUp = "What would you like to call this task?";
  } else if (!dueDate) {
    followUp = "When is this task due?";
  } else if (!urgency) {
    followUp = "How urgent is this task? (1-5)";
  } else {
    followUp = "Anything else to add?";
  }
  
  return {
    title: title === "Untitled Task" ? null : title,
    dueDate: dueDate ? dueDate.toISOString() : null,
    urgency,
    followUp,
    stillNeeded,
    suggestions
  };
};
