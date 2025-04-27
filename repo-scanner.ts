// repo-scanner.ts

import fs from 'fs';
import path from 'path';

const reposFolder = path.join(__dirname, 'repos');
const outputFolder = path.join(__dirname, 'data');

function walk(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(filePath));
    } else if (file.endsWith('.ts') || file.endsWith('.js') || file.endsWith('.vue')) {
      results.push(filePath);
    }
  });
  return results;
}

function chunkText(text: string, size: number): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.slice(i, i + size));
  }
  return chunks;
}

function main() {
  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder);
  }

  const files = walk(reposFolder);
  const chunks: { content: string; filepath: string }[] = [];

  files.forEach((filePath) => {
    const content = fs.readFileSync(filePath, 'utf8');
    const chunked = chunkText(content, 1000);
    chunked.forEach((chunk) => {
      chunks.push({ content: chunk, filepath: filePath });
    });
  });

  fs.writeFileSync(path.join(outputFolder, 'chunks.json'), JSON.stringify(chunks, null, 2));
  console.log(`✅ Scanned ${files.length} files and saved ${chunks.length} chunks.`);
}

main();
