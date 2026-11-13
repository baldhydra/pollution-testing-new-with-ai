import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { processUserMessage, clearConversation } from '../services/aiAgent.js';

const router = express.Router();

/**
 * POST /api/ai/chat
 * Main conversational endpoint with Ollama Qwen3 8B
 */
router.post('/chat', requireAuth, async (req, res) => {
  try {
    const { message, conversationId } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'Field "message" is required and cannot be empty.' });
    }

    const result = await processUserMessage({
      message,
      conversationId,
      user: req.user
    });

    res.json(result);
  } catch (error) {
    console.error('AI chat endpoint error:', error);
    const isServiceUnavailable = error.message.includes('not reachable') || error.message.includes('timed out');
    const statusCode = isServiceUnavailable ? 503 : 500;

    res.status(statusCode).json({
      error: error.message || 'An error occurred while processing your request with the AI assistant.'
    });
  }
});

/**
 * POST /api/ai/clear
 * Resets a conversation session
 */
router.post('/clear', requireAuth, (req, res) => {
  try {
    const { conversationId } = req.body;
    if (conversationId) {
      clearConversation(conversationId);
    }
    res.json({ message: 'Conversation cleared successfully' });
  } catch (error) {
    console.error('Clear conversation error:', error);
    res.status(500).json({ error: 'Failed to clear conversation' });
  }
});

export default router;
