const { OPENAI_API_KEY, OPENAI_MODEL = 'gpt-4o-mini' } = process.env;

export interface AiComposeOptions {
  prompt: string;
  tone?: string;
  outline?: string[];
}

const buildPrompt = ({ prompt, tone, outline }: AiComposeOptions) => {
  const toneLine = tone ? `Tone: ${tone}.` : '';
  const outlineLine = outline && outline.length > 0
    ? `Follow this outline:\n${outline.map((item, index) => `${index + 1}. ${item}`).join('\n')}`
    : '';

  return `${toneLine}\n${outlineLine}\n${prompt}`.trim();
};

const fallbackResponse = (options: AiComposeOptions) => ({
  title: 'Your Stellar Post Title',
  body: `This is a placeholder response because the AI provider is not configured.\n\nYou asked for: ${options.prompt}`,
});

export const composePost = async (options: AiComposeOptions) => {
  if (!OPENAI_API_KEY) {
    return fallbackResponse(options);
  }

  const payload = {
    model: OPENAI_MODEL,
    temperature: 0.8,
    messages: [
      {
        role: 'system',
        content:
          'You are Starforge, an AI writing assistant for a futuristic community platform called Ripple. Craft engaging, original posts with clear structure, optional headings, and call-to-action elements.',
      },
      {
        role: 'user',
        content: buildPrompt(options),
      },
    ],
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
    throw new Error('Failed to generate AI post');
  }

  const data = await response.json() as {
    choices: Array<{
      message: {
        content: string;
      };
    }>;
  };

  const content = data.choices?.[0]?.message?.content || '';
  const [firstLine, ...rest] = content.split('\n').filter(Boolean);

  return {
    title: firstLine.replace(/^#+\s*/, '').slice(0, 140),
    body: rest.join('\n').trim() || content,
  };
};
