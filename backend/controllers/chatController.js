import OpenAI from 'openai';
import { runTool, tools } from '../services/aiTools.js';

const MODEL = 'gpt-4o-mini';
const MAX_TOOL_ROUNDS = 3; // stop a confused model from looping forever
const MAX_HISTORY = 12; // only the latest messages are sent, to keep cost and size down
const MAX_MESSAGE_LENGTH = 1000;

// Created on first use, so the rest of the API still starts without a key
let client = null;
const getClient = () => {
  client ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
};

const systemPrompt = (user) => `You are the shopping assistant for ShopSmart, an Indian online store.
The customer's name is ${user.name}. Today is ${new Date().toDateString()}.

Rules:
- Use the tools for every question about products, prices, stock or orders. Never invent products, prices or order details.
- Prices are in Indian rupees; write them like ₹1,899.
- Keep replies short: 1 to 3 sentences. The app shows the products you found as cards, so don't list every detail.
- If nothing matches, say so and suggest a nearby option (another price range or category).
- Payment is cash on delivery and delivery is free.
- Only help with shopping on ShopSmart. For anything else, politely say you can only help with shopping here.`;

// Keep only well-formed user/assistant text messages from the browser.
// The client can't inject "system" or "tool" messages.
const cleanHistory = (messages) =>
  messages
    .filter((m) => ['user', 'assistant'].includes(m?.role) && typeof m.content === 'string' && m.content.trim())
    .slice(-MAX_HISTORY)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_LENGTH) }));

// POST /api/chat   Body: { messages: [{ role: 'user', content: 'running shoes under 2000' }, ...] }
// Answer: { reply: 'text', products: [...] }
export const chat = async (req, res) => {
  if (!process.env.OPENAI_API_KEY) {
    res.status(503);
    throw new Error('The assistant is not set up yet');
  }
  if (!Array.isArray(req.body.messages)) {
    res.status(400);
    throw new Error('Send the conversation as a messages array');
  }

  const history = cleanHistory(req.body.messages);
  if (history.at(-1)?.role !== 'user') {
    res.status(400);
    throw new Error('The last message must be from the user');
  }

  const messages = [{ role: 'system', content: systemPrompt(req.user) }, ...history];
  const found = new Map(); // products from tool results, shown as cards (Map = no duplicates)

  try {
    for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
      const response = await getClient().chat.completions.create({
        model: MODEL,
        messages,
        // On the last round, take the tools away so the model must answer in text
        ...(round < MAX_TOOL_ROUNDS && { tools }),
        temperature: 0.3, // lower = more factual, less creative
        max_tokens: 400,
      });
      const message = response.choices[0].message;

      // No tool requested: this is the final answer
      if (!message.tool_calls?.length) {
        return res.json({ reply: message.content, products: [...found.values()].slice(0, 5) });
      }

      // The model asked for one or more tools. Keep its request in the conversation,
      // run each tool against MongoDB, and add each result as a "tool" message.
      messages.push(message);
      for (const call of message.tool_calls) {
        const result = await runTool(call.function.name, call.function.arguments, req.user);
        for (const p of result.products || []) found.set(p.id, p);
        if (result.product) found.set(result.product.id, result.product);
        messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(result) });
      }
    }
  } catch (err) {
    // OpenAI down, key wrong, quota used up... Log the details, show a friendly message.
    console.error('OpenAI error:', err.status, err.message);
    res.status(503);
    throw new Error('The assistant is having trouble right now. Please try again in a moment.');
  }

  // Only reached if every round asked for tools (very unlikely)
  res.json({ reply: 'Sorry, I could not work that out. Could you rephrase?', products: [...found.values()].slice(0, 5) });
};
