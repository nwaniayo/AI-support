import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-Flash" });

export async function POST(req) {
  const stream = new ReadableStream({
    async start(controller) {
      const prompt = "Write a story about an AI and magic";
      
      try {
        const result = await model.generateContentStream(prompt);
        
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          console.log(chunkText);
          controller.enqueue(new TextEncoder().encode(chunkText));
        }
      } catch (err) {
        controller.error(err);
      } finally {
        controller.close();
      }
    }
  });

  return new NextResponse(stream);
}