// rag-server.ts

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
  genModel = await pipeline('text-generation', 'Xenova/phi-2'); // or any tiny local model

  loadDB();
}

function meanPool(features: number[][]): number[] {
  return features[0].map((_, colIndex) => {
    return features.reduce((sum, row) => sum + row[colIndex], 0) / features.length;
  });
}

app.post('/ask', async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).send('Missing query');

  console.log(`💬 Received query: ${query}`);

  const output = await embedModel(query, { pooling: 'mean', normalize: true });
  const queryEmbedding = Array.from(output.data);

  const contextChunks = findRelevant(queryEmbedding, 5)
    .map((entry) => entry.content)
    .join('\n---\n');

  const prompt = `
You are a helpful coding assistant.
Answer based on the following project code snippets:

${contextChunks}

Question: ${query}
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
