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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { model, messages, temperature = 0.0, stream = false } = req.body;

    // Validate required fields
    if (!model || !messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Missing required fields: model, messages' });
    }

    // Get API key from environment variables (server-side only)
    const apiKey = process.env.OPENROUTER_API_KEY;
    
    if (!apiKey) {
      console.error('OPENROUTER_API_KEY not configured in server environment');
      return res.status(500).json({ error: 'API configuration error' });
    }

    // Make request to OpenRouter API
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': req.headers?.origin || 'https://unitracker.vercel.app',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        stream
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
