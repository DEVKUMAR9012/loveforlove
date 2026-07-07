const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function callOpenAI(prompt, opts = {}) {
  if (!OPENAI_API_KEY) return null;

  const body = {
    model: opts.model || 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: opts.max_tokens || 150,
    temperature: typeof opts.temperature === 'number' ? opts.temperature : 0.8,
  };

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`OpenAI: ${res.status} ${await res.text()}`);
  const json = await res.json();
  return json.choices?.[0]?.message?.content || null;
}

async function generatePrompt(context) {
  // If API key is available, call OpenAI; otherwise return a friendly fallback
  const prompt = `Generate one short, relationship-focused journaling prompt appropriate for a couple. Context: ${context || 'general'}`;
  try {
    const out = await callOpenAI(prompt, { max_tokens: 60 });
    if (out) return out.trim();
  } catch (err) {
    console.error('AI generatePrompt error:', err.message || err);
  }

  // Fallback prompts
  const fallbacks = [
    'What small moment today made you feel grateful for your partner?',
    'Share a recent moment when you felt supported by your partner.',
    'What is one thing you appreciate about your partner this week?'
  ];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

async function smartReply(contextMessages) {
  // Accepts an array of recent messages and returns 3 short reply suggestions.
  const joined = (contextMessages || []).slice(-8).map((m) => `${m.author}: ${m.text}`).join('\n');
  const prompt = `You are a helpful assistant that crafts 3 short, sweet, personal reply suggestions for a loving partner conversation. Conversation:\n${joined}\n\nReturn three numbered short replies.`;
  try {
    const out = await callOpenAI(prompt, { max_tokens: 200 });
    if (out) return out.trim();
  } catch (err) {
    console.error('AI smartReply error:', err.message || err);
  }

  return '1) That sounds lovely — tell me more!\n2) I miss you — when can we see each other?\n3) You made my day ❤';
}

module.exports = { generatePrompt, smartReply };
