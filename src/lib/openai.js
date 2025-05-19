/**
 * File: openai.js
 * Purpose: Provides OpenAI GPT-4.1 Mini integration for parsing task input
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
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini-2025-04-14", // Use GPT-4.1 Mini
      messages: [
        {
          role: "system",
          content: `You are a helpful task parser that extracts structured data from natural language. 
          Extract the task title, due date (as an ISO string), and urgency level (1-5).
          Today's date is ${new Date().toISOString().split('T')[0]}.
          If urgency is not specified, return null.
          If due date is not specified, return null.
          Format your response as a JSON object with keys: title, dueDate, urgency.
          `
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    })

    // Parse the response
    const result = JSON.parse(completion.choices[0].message.content)
    return result
  } catch (error) {
    console.error("Error parsing task with OpenAI:", error)
    
    // Fallback parsing using basic regex
    return fallbackParsing(prompt)
  }
}

/**
 * Fallback function for basic parsing when OpenAI is unavailable
 * @param {string} prompt - User input
 * @returns {Object} Best-effort parsed task
 */
const fallbackParsing = (prompt) => {
  // Basic parsing logic - extract time expressions like "tomorrow", "today", etc.
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  let dueDate = null
  let title = prompt
  let urgency = null
  
  // Check for common time expressions
  if (prompt.toLowerCase().includes('tomorrow')) {
    dueDate = tomorrow.toISOString()
    title = title.replace(/tomorrow/i, '').trim()
  } else if (prompt.toLowerCase().includes('today')) {
    dueDate = today.toISOString()
    title = title.replace(/today/i, '').trim()
  }
  
  // Check for time expressions like "at 7PM"
  const timeMatch = prompt.match(/at\s+(\d+)(?::(\d+))?\s*(am|pm)?/i)
  if (timeMatch && dueDate) {
    const [_, hours, minutes, ampm] = timeMatch
    const date = new Date(dueDate)
    
    let hour = parseInt(hours)
    if (ampm && ampm.toLowerCase() === 'pm' && hour < 12) {
      hour += 12
    } else if (ampm && ampm.toLowerCase() === 'am' && hour === 12) {
      hour = 0
    }
    
    date.setHours(hour, minutes ? parseInt(minutes) : 0, 0, 0)
    dueDate = date.toISOString()
    
    // Remove time expression from title
    title = title.replace(/at\s+\d+(?::\d+)?\s*(am|pm)?/i, '').trim()
  }
  
  // Check for urgency
  const urgencyMatch = prompt.match(/urgency[:\s]+(\d+)/i)
  if (urgencyMatch) {
    urgency = parseInt(urgencyMatch[1])
    if (urgency < 1) urgency = 1
    if (urgency > 5) urgency = 5
    
    // Remove urgency expression from title
    title = title.replace(/urgency[:\s]+\d+/i, '').trim()
  }
  
  return { title, dueDate, urgency }
}
