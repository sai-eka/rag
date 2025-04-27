import express from 'express';
import { loadDB, findRelevant } from './vector-db';
import { pipeline } from '@xenova/transformers';

const app = express();
app.use(express.json());

let embedModel: any;
let genModel: any;

async function initModels() {
  console.log('🧠 Loading embedding model...');
  embedModel = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

  console.log('🧠 Loading generation model...');
  genModel = await pipeline('text-generation', 'Xenova/distilgpt2');  // Using distilgpt2

  loadDB();
}

app.post('/ask', async (req, res):Promise<any> => {
  const { query } = req.body;
  if (!query) return res.status(400).send('Missing query');

  console.log(`💬 Received query: ${query}`);

  // Truncate the query if it exceeds the max length (optional)
  const maxInputLength = 512;  // Adjust this limit based on the model's token size
  const truncatedQuery = query.length > maxInputLength ? query.slice(0, maxInputLength) : query;

  const output = await embedModel(truncatedQuery, { pooling: 'mean', normalize: true });
  const queryEmbedding = Array.from(output.data) as number[];

  const contextChunks = findRelevant(queryEmbedding, 5)
    .map((entry) => entry.content)
    .join('\n---\n');

  // Detailed instruction in the prompt
  const prompt = `
You are a helpful coding assistant who explains and analyzes code. Answer based on the following project code snippets:

${contextChunks}

Question: ${truncatedQuery}

Please explain the code above in detail, clarifying the purpose and functionality of each section. If possible, suggest improvements or best practices.
Answer:
`;

  const generated = await genModel(prompt, {
    temperature: 0.2,
    max_new_tokens: 300,
  });

  res.json({ answer: generated[0].generated_text });
});

const PORT = 3000;
app.listen(PORT, async () => {
  await initModels();
  console.log(`🚀 RAG server listening at http://localhost:${PORT}`);
});
