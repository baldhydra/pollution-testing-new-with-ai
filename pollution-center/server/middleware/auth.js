import crypto from 'crypto';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const USERS_FILE = path.join(__dirname, '..', 'data', 'users.json');

// Secret for token signing
const TOKEN_SECRET = crypto.randomBytes(32).toString('hex');

// Store active tokens in memory (maps token -> { username, createdAt })
const activeTokens = new Map();

// Token expiry: 24 hours
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000;

/**
 * Generate a simple auth token for a user
 */
export function generateToken(username) {
  const tokenData = `${username}:${Date.now()}:${crypto.randomBytes(16).toString('hex')}`;
  const token = crypto.createHmac('sha256', TOKEN_SECRET).update(tokenData).digest('hex');
  activeTokens.set(token, { username, createdAt: Date.now() });
  return token;
}

/**
 * Validate a token and return the associated username
 */
export function validateToken(token) {
  const entry = activeTokens.get(token);
  if (!entry) return null;
  if (Date.now() - entry.createdAt > TOKEN_EXPIRY_MS) {
    activeTokens.delete(token);
    return null;
  }
  return entry.username;
}

/**
 * Remove a token (logout)
 */
export function revokeToken(token) {
  activeTokens.delete(token);
}

/**
 * Express middleware: requires valid Bearer token
 * Sets req.user = { username, isAdmin }
 */
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];
  const username = validateToken(token);
  if (!username) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  req.user = {
    username,
    isAdmin: username === 'admin'
  };
  next();
}

/**
 * Login handler: validates credentials and returns token
 */
export function loginHandler(req, res) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const users = fs.readJsonSync(USERS_FILE);
    const user = users.find(u => u.username === username);
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(username);
    res.json({ token, username });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
}

// Periodically clean up expired tokens (every 30 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [token, entry] of activeTokens.entries()) {
    if (now - entry.createdAt > TOKEN_EXPIRY_MS) {
      activeTokens.delete(token);
    }
  }
}, 30 * 60 * 1000);
