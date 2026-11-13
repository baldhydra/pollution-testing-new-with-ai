import { v4 as uuidv4 } from 'uuid';
import { toolDefinitions, validToolNames } from './toolDefinitions.js';
import { executeTool } from './dataTools.js';

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const MODEL_NAME = process.env.OLLAMA_MODEL || 'qwen3:8b';
const MAX_TOOL_ITERATIONS = 5;
const MAX_CONVERSATION_MESSAGES = 20;
const REQUEST_TIMEOUT_MS = 90000;

// In-memory conversation storage: Map<conversationId, { messages: Array, lastUpdated: number }>
const conversations = new Map();

// Periodic cleanup of conversations inactive for > 2 hours
setInterval(() => {
  const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
  for (const [id, conv] of conversations.entries()) {
    if (conv.lastUpdated < twoHoursAgo) {
      conversations.delete(id);
    }
  }
}, 30 * 60 * 1000);

/**
 * Builds system prompt with current date, year, last year context, and rules.
 */
function getSystemPrompt(user) {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const year = now.getFullYear();
  const monthNum = String(now.getMonth() + 1).padStart(2, '0');
  const lastYear = year - 1;

  return `You are an intelligent, highly accurate AI assistant for the Vehicle Pollution Certificate Management System.
Current Date: ${todayStr} (Current Year: ${year}, Current Month: ${monthNum}).
Last Year: ${lastYear}.
User Logged In: "${user.username}" (Admin Privileges: ${user.isAdmin ? 'YES' : 'NO'}).

CORE RULES & CONSTRAINTS:
1. Always use available tools to query database records, counts, statistics, and financial figures.
2. NEVER fabricate, hallucinate, or guess records, dates, counts, or financial numbers. If a tool returns 0 records or no data, state clearly that no records were found.
3. DATE INTERPRETATION:
   - "this month": from ${year}-${monthNum}-01 to the end of the current month.
   - "this year": from ${year}-01-01 to ${year}-12-31.
   - "last year": from ${lastYear}-01-01 to ${lastYear}-12-31.
   - If a specific month name is mentioned without a year (e.g., "in August", "month of august"):
     Query August of the current year (${year}-08-01 to ${year}-08-31). If count is 0, you may also check August of last year (${lastYear}-08-01 to ${lastYear}-08-31) and explain the findings clearly.
   - "profit", "revenue", "collections", "earnings", "income", "money made": Call "get_financial_statistics" with the appropriate start and end dates. In this system, fees collected from issued certificates represent the total collection/revenue (profit).
   - "expiring soon" / "next 30 days": call "get_expiring_certificates" with number_of_days.
4. If a question is a simple greeting or general application usage query not requiring database lookups, answer directly without calling tools.
5. Present answers in clean, professional markdown. When presenting financial data, mention the currency (₹ / INR). Format tables nicely.`;
}

/**
 * Clean model output to remove thinking/scratchpad tags if present
 */
function cleanAssistantContent(content) {
  if (!content || typeof content !== 'string') return '';
  return content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}

/**
 * Clear a conversation session
 */
export function clearConversation(conversationId) {
  if (conversationId && conversations.has(conversationId)) {
    conversations.delete(conversationId);
    return true;
  }
  return false;
}

/**
 * Call Ollama chat API with timeout
 */
async function callOllamaChat(messages, tools) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const payload = {
      model: MODEL_NAME,
      messages,
      stream: false
    };

    if (tools && tools.length > 0) {
      payload.tools = tools;
    }

    const response = await fetch(`${OLLAMA_HOST}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Ollama API error (${response.status}): ${errText}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request to local AI model timed out after 90 seconds.');
    }
    if (error.code === 'ECONNREFUSED' || error.message.includes('ECONNREFUSED') || error.message.includes('fetch failed')) {
      throw new Error('Ollama service is not reachable. Please make sure Ollama is running at ' + OLLAMA_HOST);
    }
    throw error;
  }
}

/**
 * Main chat handler: orchestrates conversation history, Ollama calls, and tool execution.
 */
export async function processUserMessage({ message, conversationId, user }) {
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    throw new Error('Message cannot be empty.');
  }

  const convId = conversationId || uuidv4();
  let convData = conversations.get(convId);

  if (!convData) {
    convData = {
      messages: [
        { role: 'system', content: getSystemPrompt(user) }
      ],
      lastUpdated: Date.now()
    };
    conversations.set(convId, convData);
  } else {
    convData.messages[0] = { role: 'system', content: getSystemPrompt(user) };
  }

  convData.messages.push({ role: 'user', content: message.trim() });
  convData.lastUpdated = Date.now();

  if (convData.messages.length > MAX_CONVERSATION_MESSAGES + 1) {
    convData.messages = [
      convData.messages[0],
      ...convData.messages.slice(-(MAX_CONVERSATION_MESSAGES))
    ];
  }

  const executedTools = [];
  let latestToolResult = null;
  let iterations = 0;

  while (iterations < MAX_TOOL_ITERATIONS) {
    iterations++;

    const ollamaResponse = await callOllamaChat(convData.messages, toolDefinitions);
    const assistantMsg = ollamaResponse.message;

    if (!assistantMsg) {
      throw new Error('Empty response received from Ollama model.');
    }

    const toolCalls = assistantMsg.tool_calls;

    if (!toolCalls || toolCalls.length === 0) {
      // Model produced text answer
      const cleaned = cleanAssistantContent(assistantMsg.content) || assistantMsg.content || 'I processed your query.';
      const finalMsg = { ...assistantMsg, content: cleaned };
      convData.messages.push(finalMsg);
      convData.lastUpdated = Date.now();

      return {
        reply: cleaned,
        conversationId: convId,
        toolCalls: executedTools,
        structuredData: latestToolResult?.data || null
      };
    }

    // Model invoked tools
    convData.messages.push(assistantMsg);

    for (const toolCall of toolCalls) {
      const functionName = toolCall.function?.name;
      let rawArgs = toolCall.function?.arguments || {};

      if (typeof rawArgs === 'string') {
        try {
          rawArgs = JSON.parse(rawArgs);
        } catch {
          rawArgs = {};
        }
      }

      if (!validToolNames.has(functionName)) {
        const errorResult = {
          success: false,
          error: `Tool '${functionName}' is not recognized.`
        };
        convData.messages.push({
          role: 'tool',
          name: functionName,
          content: JSON.stringify(errorResult)
        });
        executedTools.push({
          name: functionName,
          arguments: rawArgs,
          result: errorResult
        });
        continue;
      }

      const toolResult = executeTool(functionName, rawArgs, user);
      latestToolResult = toolResult;

      executedTools.push({
        name: functionName,
        arguments: rawArgs,
        result: toolResult
      });

      convData.messages.push({
        role: 'tool',
        name: functionName,
        content: JSON.stringify(toolResult)
      });
    }
  }

  // Fallback if max iterations reached
  const finalPrompt = {
    role: 'user',
    content: 'Please summarize the retrieved tool data to directly answer my question.'
  };
  convData.messages.push(finalPrompt);

  const finalResponse = await callOllamaChat(convData.messages, null);
  const rawFinal = finalResponse.message?.content || 'Completed processing query.';
  const cleanedFinal = cleanAssistantContent(rawFinal);

  convData.messages.push({ role: 'assistant', content: cleanedFinal });
  convData.lastUpdated = Date.now();

  return {
    reply: cleanedFinal,
    conversationId: convId,
    toolCalls: executedTools,
    structuredData: latestToolResult?.data || null
  };
}
