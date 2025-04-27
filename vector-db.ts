// vector-db.ts

import fs from 'fs';
import path from 'path';

const dataDir = path.join(__dirname, 'data');
const embeddingsPath = path.join(dataDir, 'embeddings.json');

interface EmbeddingEntry {
  filepath: string;
  content: string;
  embedding: number[];
}

let db: EmbeddingEntry[] = [];

function loadDB() {
  const raw = fs.readFileSync(embeddingsPath, 'utf-8');
  db = JSON.parse(raw);
  console.log(`✅ Loaded ${db.length} embeddings.`);
}

function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
  const magB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
  return dot / (magA * magB);
}

function findRelevant(queryEmbedding: number[], topK: number = 5) {
  const results = db.map((entry) => {
    const score = cosineSimilarity(queryEmbedding, entry.embedding);
    return { ...entry, score };
  });

  return results.sort((a, b) => b.score - a.score).slice(0, topK);
}

export { loadDB, findRelevant };
