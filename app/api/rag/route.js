import { NextResponse } from 'next/server';
import { HfInference } from '@huggingface/inference';
import OpenAI from 'openai';
import NodeCache from 'node-cache';
import fetch from 'node-fetch';
import { Pinecone } from '@pinecone-database/pinecone';

// Use node-fetch as the global fetch
global.fetch = fetch;

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
});

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

// Initialize cache with 1 hour TTL
const cache = new NodeCache({ stdTTL: 3600 });

// Pinecone client and index initialization
let pineconeClient = null;
let pineconeIndex = null;

async function getPineconeClient() {
  if (!pineconeClient) {
    pineconeClient = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });
  }
  return pineconeClient;
}

async function getPineconeIndex() {
  if (!pineconeIndex) {
    const client = await getPineconeClient();
    pineconeIndex = client.index("json");
  }
  return pineconeIndex;
}

async function queryPinecone(embedding) {
  const pineconeIndex = await getPineconeIndex();
  const queryResponse = await pineconeIndex.namespace('json-documents').query({
    vector: embedding,
    topK: 2,
    includeMetadata: true,
  });
  return queryResponse.matches.map(match => match.metadata.text);
}

async function generateEmbedding(query) {
  try {
    console.log("Generating embedding for query:", query);
    const response = await hf.featureExtraction({
      model: 'sentence-transformers/all-MiniLM-L6-v2',
      inputs: query,
    });
    console.log("Generated embedding:", response);
    return response;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

async function generateOpenRouterResponse(augmentedQuery) {
  console.log("Sending augmented query to AI:", augmentedQuery);
  const systemPrompt = 
`Here's a system prompt for a RateMyProfessor agent that helps students find professors based on their queries using RAG (Retrieval-Augmented Generation):
You are an AI assistant specializing in helping students find professors based on their queries. Your knowledge comes from a comprehensive database of professor reviews and ratings. For each user question or topics provided, you will:

Analyze the query to understand the student's needs and preferences.
Use RAG to retrieve relevant information about professors from your knowledge base.
Rank and select the top 3 most suitable professors based on the query and retrieved information.
Present these professors to the user, providing a brief explanation of why each was selected.
Be prepared to answer follow-up questions or provide more details about the recommended professors.

Your responses should be informative, concise, and tailored to the student's specific needs. Always maintain a helpful and friendly tone, and respect the privacy of both students and professors.
Add the ratings of each professor to the response to help students make informed decisions. 
If a query is unclear or lacks specificity, ask for clarification to ensure the most accurate recommendations. Remember that your goal is to help students make informed decisions about their education.
`;
  const response = await openai.chat.completions.create({
    model: 'google/gemma-2-9b-it:free',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: augmentedQuery },
    ],
    stream: true,
  });
  return response;
}

export async function POST(req) {
  const { query } = await req.json();

  // Check cache first
  const cachedResponse = cache.get(query);
  if (cachedResponse) {
    return new NextResponse(cachedResponse);
  }

  try {
    // Perform embedding and Pinecone index retrieval in parallel
    const [embedding, pineconeIndex] = await Promise.all([
      generateEmbedding(query),
      getPineconeIndex(),
    ]);

    const queryResponse = await pineconeIndex.namespace('json-documents').query({
      vector: embedding,
      topK: 2,
      includeMetadata: true,
    });

    const contexts = queryResponse.matches.map(match => match.metadata.text);
    console.log("Retrieved contexts:", contexts);
    const augmentedQuery = `<CONTEXT>\n${contexts.join('\n\n-------\n\n')}\n-------\n</CONTEXT>\n\nMY QUESTION:\n${query}`;
    console.log("Augmented query:", augmentedQuery);

    const stream = await generateOpenRouterResponse(augmentedQuery);

    // Create a TransformStream to process the response
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    // Stream the response
    (async () => {
      let fullResponse = '';
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        fullResponse += content;
        await writer.write(encoder.encode(content));
      }
      // Cache the full response
      cache.set(query, fullResponse);
      writer.close();
    })();

    return new NextResponse(readable, {
      headers: {
        'Content-Type': 'text/plain',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error('Error in RAG process:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to generate response' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
