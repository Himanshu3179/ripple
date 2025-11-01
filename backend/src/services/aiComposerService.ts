const {
  AI_PROVIDER = 'gemini',
  GEMINI_API_KEY,
  GEMINI_MODEL = 'gemini-2.5-flash-lite', // Cheap model as requested
  OPENAI_API_KEY,
  OPENAI_MODEL = 'gpt-4o-mini',
} = process.env;

export interface AiComposeOptions {
  prompt: string;
  tone?: string;
  outline?: string[];
}

export interface AiComposeResult {
  title: string;
  body: string;
  topic: string;
}

const buildPrompt = ({ prompt, tone, outline }: AiComposeOptions) => {
  const toneLine = tone ? `Tone: ${tone}.` : '';
  const outlineLine = outline && outline.length > 0
    ? `Follow this outline:\n${outline.map((item, index) => `${index + 1}. ${item}`).join('\n')}`
    : '';

  return `${toneLine}\n${outlineLine}\n${prompt}`.trim();
};

const fallbackResponse = (options: AiComposeOptions): AiComposeResult => ({
  title: 'Your Stellar Post Title',
  body: `This is a placeholder response because the AI provider is not configured.\n\nYou asked for: ${options.prompt}`,
  topic: 'general',
});

const composeWithGemini = async (options: AiComposeOptions): Promise<AiComposeResult> => {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key is not configured');
  }

  const systemInstruction = `You are Starforge, an AI writing assistant for a futuristic community platform called Ripple. 

Your task is to generate a complete post with:
1. A short, catchy topic/tag (1-3 words) that describes the main subject
2. A compelling title (max 140 characters)
3. Engaging body content with clear structure, optional headings, and call-to-action elements

Format your response as JSON:
{
  "topic": "the-topic-tag",
  "title": "The Post Title",
  "body": "The full post body content..."
}

Make the topic tag URL-friendly (lowercase, no spaces, use hyphens).`;

  const userPrompt = `Generate a post with topic, title, and body based on this request:

${buildPrompt(options)}

Ensure the topic is a concise, relevant tag for the post subject.`;

  // Use configured Gemini model (default: gemini-1.5-flash-lite for cost-effectiveness)
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: `${systemInstruction}\n\n${userPrompt}` },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
      }),
    },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Gemini API Error:', {
      status: response.status,
      statusText: response.statusText,
      error: errorData,
    });
    throw new Error(`Failed to generate AI post with Gemini: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          text?: string;
        }>;
      };
    }>;
  };

  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  // Try to parse JSON response
  try {
    // Extract JSON from markdown code blocks if present
    const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      return {
        topic: parsed.topic || 'general',
        title: parsed.title || 'Untitled Post',
        body: parsed.body || content,
      };
    }
  } catch (e) {
    // If JSON parsing fails, extract from text
    console.warn('Failed to parse Gemini JSON response, extracting from text');
  }

  // Fallback: extract topic, title, and body from text
  const lines = content.split('\n').filter(Boolean);
  let topic = 'general';
  let title = '';
  let bodyStart = 0;

  // Look for topic, title, and body patterns
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.toLowerCase().startsWith('topic:')) {
      topic = line.replace(/^topic:\s*/i, '').trim().toLowerCase().replace(/\s+/g, '-');
      continue;
    }
    if (line.toLowerCase().startsWith('title:')) {
      title = line.replace(/^title:\s*/i, '').trim().replace(/^#+\s*/, '');
      bodyStart = i + 1;
      break;
    }
    if (!title && line.length > 0 && !line.startsWith('#')) {
      // First substantial line is likely the title
      title = line.replace(/^#+\s*/, '').slice(0, 140);
      bodyStart = i + 1;
      break;
    }
  }

  if (!title && lines.length > 0) {
    title = lines[0].replace(/^#+\s*/, '').slice(0, 140);
    bodyStart = 1;
  }

  const body = bodyStart > 0 ? lines.slice(bodyStart).join('\n').trim() : content;

  // Extract topic from title or prompt if not found
  if (topic === 'general') {
    const promptWords = options.prompt.toLowerCase().split(/\s+/).slice(0, 3);
    topic = promptWords.join('-').replace(/[^a-z0-9-]/g, '');
  }

  return {
    topic: topic || 'general',
    title: title || 'Untitled Post',
    body: body || content,
  };
};

const composeWithOpenAI = async (options: AiComposeOptions): Promise<AiComposeResult> => {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured');
  }

  const payload = {
    model: OPENAI_MODEL,
    temperature: 0.8,
    messages: [
      {
        role: 'system',
        content:
          'You are Starforge, an AI writing assistant for a futuristic community platform called Ripple. Generate a complete post with a topic tag (1-3 words, URL-friendly), a compelling title (max 140 chars), and engaging body content with clear structure. Respond with JSON: {"topic": "the-topic", "title": "The Title", "body": "The body..."}',
      },
      {
        role: 'user',
        content: buildPrompt(options),
      },
    ],
    response_format: { type: 'json_object' },
  };

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('OpenAI API Error:', {
      status: response.status,
      statusText: response.statusText,
      error: errorData,
    });
    throw new Error(`Failed to generate AI post with OpenAI: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as {
    choices: Array<{
      message: {
        content: string;
      };
    }>;
  };

  const content = data.choices?.[0]?.message?.content || '';
  
  try {
    const parsed = JSON.parse(content);
    return {
      topic: parsed.topic || 'general',
      title: parsed.title || 'Untitled Post',
      body: parsed.body || content,
    };
  } catch (e) {
    // Fallback: extract from text format
    const [firstLine, ...rest] = content.split('\n').filter(Boolean);
    return {
      topic: 'general',
      title: firstLine.replace(/^#+\s*/, '').slice(0, 140),
      body: rest.join('\n').trim() || content,
    };
  }
};

export const composePost = async (options: AiComposeOptions): Promise<AiComposeResult> => {
  const provider = (AI_PROVIDER?.toLowerCase() || 'gemini') as 'gemini' | 'openai';

  try {
    if (provider === 'gemini') {
      return await composeWithGemini(options);
    } else if (provider === 'openai') {
      return await composeWithOpenAI(options);
    } else {
      throw new Error(`Unknown AI provider: ${provider}`);
    }
  } catch (error) {
    // If primary provider fails and we have fallback, try it
    if (provider === 'gemini' && OPENAI_API_KEY) {
      console.warn('Gemini failed, falling back to OpenAI', error);
      try {
        return await composeWithOpenAI(options);
      } catch (fallbackError) {
        console.error('Both providers failed', { gemini: error, openai: fallbackError });
        throw error; // Throw original error
      }
    } else if (provider === 'openai' && GEMINI_API_KEY) {
      console.warn('OpenAI failed, falling back to Gemini', error);
      try {
        return await composeWithGemini(options);
      } catch (fallbackError) {
        console.error('Both providers failed', { openai: error, gemini: fallbackError });
        throw error; // Throw original error
      }
    }
    throw error;
  }
};
