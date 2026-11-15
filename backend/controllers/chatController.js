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

Your job: help the customer find, compare and choose products, suggest gifts, and check their orders.
For any of these, call the tools first, then answer from the results.

How to answer:
- Never invent products, prices, stock or order details. Use only what the tools return.
- To compare things (e.g. "earbuds and headphones"), search for each one, then compare price and features in a sentence or two.
- The app shows every product and order you found as a card under your message. So do not list them: no numbered or bulleted lists, no markdown (no ** or #). Mention at most two products by name.
- Write 1 to 3 short sentences in plain text. Prices in rupees, like ₹1,899.
- If nothing matches, say so and suggest something close (another price or category).
- Payment is cash on delivery and delivery is free.

Only if the message has nothing to do with shopping (poems, homework, general knowledge, coding), reply that you can only help with shopping on ShopSmart.`;

const safeParse = (json) => {
  try {
    return JSON.parse(json || '{}');
  } catch {
    return {};
  }
};

// Keep only well-formed user/assistant text messages from the browser.
// The client can't inject "system" or "tool" messages.
const cleanHistory = (messages) =>
  messages
    .filter((m) => ['user', 'assistant'].includes(m?.role) && typeof m.content === 'string' && m.content.trim())
    .slice(-MAX_HISTORY)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_LENGTH) }));

// POST /api/chat   Body: { messages: [{ role: 'user', content: 'running shoes under 2000' }, ...] }
// Answer: { reply, products, orders, toolCalls }. The chat shows products and orders as cards,
// and toolCalls as small chips ("searchProducts · maxPrice: 2000") so you can see what the AI did.
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
  const orders = new Map();
  const toolCalls = [];
  const answer = (reply) => ({ reply, products: [...found.values()].slice(0, 5), orders: [...orders.values()], toolCalls });

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
        return res.json(answer(message.content));
      }

      // The model asked for one or more tools. Keep its request in the conversation,
      // run each tool against MongoDB, and add each result as a "tool" message.
      messages.push(message);
      for (const call of message.tool_calls) {
        const result = await runTool(call.function.name, call.function.arguments, req.user);
        toolCalls.push({ name: call.function.name, args: safeParse(call.function.arguments) });
        for (const p of result.products || []) found.set(p.id, p);
        if (result.product) found.set(result.product.id, result.product);
        for (const o of result.orders || []) orders.set(o.orderNumber, o);
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
  res.json(answer('Sorry, I could not work that out. Could you rephrase?'));
};
