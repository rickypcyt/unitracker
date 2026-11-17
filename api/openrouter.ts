interface VercelRequest {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  origin?: string;
}

interface VercelResponse {
  status(code: number): VercelResponse;
  json(data: any): void;
  send(data?: any): void;
}

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const ALLOWED_ORIGINS = [
  'https://unitracker.vercel.app',
  'https://unitracker.me',
  'http://localhost:5173',
  'http://localhost:4173',
];
const APP_URL = 'https://unitracker.vercel.app';

// Simple in-memory rate limiting (per IP, resets on serverless cold start)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per minute per IP

// Only these models can be requested (prevents using the endpoint to run expensive models)
const ALLOWED_MODELS = ['openrouter/free'];
const MAX_MESSAGES_CHARS = 8000;
const MAX_OUTPUT_TOKENS = 1500;

// Verify the Supabase access token and return the user id (or null)
async function getUserId(authHeader: string | undefined): Promise<string | null> {
  const token = authHeader?.replace(/^Bearer\s+/i, '');
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!token || !url || !anonKey) return null;
  try {
    const r = await fetch(`${url}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: anonKey },
    });
    if (!r.ok) return null;
    const user = (await r.json()) as { id?: string };
    return user.id ?? null;
  } catch {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Require a logged-in user
  const userId = await getUserId(req.headers?.['authorization'] ?? req.headers?.['Authorization']);
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Rate limiting check (per user)
  const clientIp = userId;
  const now = Date.now();
  const record = rateLimitMap.get(clientIp);

  if (record && now < record.resetTime) {
    if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }
    record.count++;
  } else {
    rateLimitMap.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
  }

  try {
    const { model, messages, temperature = 0.0, stream = false } = req.body;

    // Validate required fields
    if (!model || !messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Missing required fields: model, messages' });
    }

    if (!ALLOWED_MODELS.includes(model)) {
      return res.status(400).json({ error: 'Model not allowed' });
    }
    if (JSON.stringify(messages).length > MAX_MESSAGES_CHARS) {
      return res.status(413).json({ error: 'Input too long' });
    }

    // Get API key from environment variables (server-side only)
    const apiKey = process.env.OPENROUTER_API_KEY;
    
    if (!apiKey) {
      console.error('OPENROUTER_API_KEY not configured in server environment');
      return res.status(500).json({ error: 'API configuration error' });
    }

    // Validate and sanitize the origin header
    const origin = req.headers?.origin || '';
    const referer = ALLOWED_ORIGINS.includes(origin) ? origin : APP_URL;

    // Make request to OpenRouter API
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': referer,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        stream,
        max_tokens: MAX_OUTPUT_TOKENS
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: `OpenRouter API error: ${response.status} ${response.statusText}`,
        details: errorText
      });
    }

    const data = await response.json();
    
    // Return the successful response
    return res.status(200).json(data);

  } catch (error) {
    console.error('API handler error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
