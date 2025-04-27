# embedder.py

import json
import os
from sentence_transformers import SentenceTransformer
import numpy as np

DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
CHUNKS_FILE = os.path.join(DATA_DIR, 'chunks.json')
EMBEDDINGS_FILE = os.path.join(DATA_DIR, 'embeddings.json')

def load_chunks():
    with open(CHUNKS_FILE, 'r') as f:
        return json.load(f)

def save_embeddings(embeddings):
    with open(EMBEDDINGS_FILE, 'w') as f:
        json.dump(embeddings, f)

def embed_chunks(chunks):
    model = SentenceTransformer('all-MiniLM-L6-v2')
    results = []

    for chunk in chunks:
        embedding = model.encode(chunk['content']).tolist()
        results.append({
            'filepath': chunk['filepath'],
            'content': chunk['content'],
            'embedding': embedding
        })

    return results

def main():
    print("🔍 Loading code chunks...")
    chunks = load_chunks()
    print(f"✅ {len(chunks)} chunks loaded.")

    print("🧠 Embedding chunks...")
    embeddings = embed_chunks(chunks)
    print(f"✅ {len(embeddings)} embeddings created.")

    print(f"💾 Saving embeddings to {EMBEDDINGS_FILE}...")
    save_embeddings(embeddings)
    print("🏁 Done!")

if __name__ == "__main__":
    main()
