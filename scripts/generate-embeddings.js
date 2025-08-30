import { pipeline } from '@huggingface/transformers';
import { readFileSync, writeFileSync } from 'fs';
import { globSync } from 'glob';
import path from 'path';

const EMBEDDING_MODEL = 'Xenova/all-MiniLM-L6-v2';
const OUTPUT_FILE = './public/workspace_embeddings.json'; // Store in public for easy access by frontend

async function generateEmbeddings() {
    console.log('Starting embedding generation...');
    console.log(`Using embedding model: ${EMBEDDING_MODEL}`);
    console.log(`Output file: ${OUTPUT_FILE}`);

    const embedder = await pipeline('feature-extraction', EMBEDDING_MODEL);
    console.log('Embedding model loaded.');

    const filesToProcess = globSync([
        '*.md',
        '*.txt',
        'src/**/*.ts',
        'src/**/*.tsx',
        'src/**/*.js',
        'src/**/*.jsx',
        'backend/**/*.ts',
        'backend/**/*.js',
        'public/data/*.json',
        'public/data/*.csv',
    ], {
        ignore: [
            'node_modules/**',
            'dist/**',
            'backend/node_modules/**',
            'backend/dist/**',
            '**/*.d.ts', // Ignore TypeScript declaration files
            '**/*.map', // Ignore source maps
            '**/*.test.ts', // Ignore test files
            '**/*.spec.ts', // Ignore test files
            '**/*.test.tsx', // Ignore test files
            '**/*.spec.tsx', // Ignore test files
            '**/*.test.js', // Ignore test files
            '**/*.spec.js', // Ignore test files
        ]
    });

    console.log(`Found ${filesToProcess.length} files to process.`);

    const documents = [];

    for (const filePath of filesToProcess) {
        try {
            console.log(`Processing file: ${filePath}`);
            const content = readFileSync(filePath, 'utf-8');
            // Simple chunking for now: split by lines or paragraphs
            const chunks = content.split(/\r?\n\r?\n|\r?\n/).filter(chunk => chunk.trim().length > 50); // Chunks must be at least 50 characters
            console.log(`  Extracted ${chunks.length} chunks from ${filePath}.`);

            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                if (chunk.trim().length === 0) {
                    console.log(`  Skipping empty chunk ${i} in ${filePath}.`);
                    continue;
                }

                console.log(`  Generating embedding for chunk ${i} of ${filePath} (length: ${chunk.length})...`);
                const output = await embedder(chunk, { pooling: 'mean', normalize: true });
                const embedding = Array.from(output.data); // Convert Float32Array to regular Array
                console.log(`  Embedding generated for chunk ${i}.`);

                documents.push({
                    id: `${filePath}_${i}`,
                    filePath: filePath,
                    chunkIndex: i,
                    content: chunk,
                    embedding: embedding,
                });
            }
            console.log(`Finished processing ${filePath}.`);
        } catch (error) {
            console.error(`Error processing ${filePath}:`, error);
        }
    }

    writeFileSync(OUTPUT_FILE, JSON.stringify(documents, null, 2));
    console.log(`\n--- Embedding Generation Summary ---`);
    console.log(`Total documents processed: ${documents.length}`);
    console.log(`Embeddings generated and saved to ${OUTPUT_FILE}`);
    console.log(`----------------------------------`);
}

generateEmbeddings();