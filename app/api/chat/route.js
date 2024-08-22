import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const SystemPrompt = `
You are an AI designed to help create flashcards. Please follow these guidelines:
1. Generate concise questions based on the provided material.
2. Ensure each question is clear and unambiguous.
3. Provide answers that are accurate and informative.
4. Include a variety of question types (e.g., definition, multiple choice).
5. Aim for a balance between easy and challenging questions.
6. Use simple language suitable for learners of all levels.
7. Organize flashcards by topic or subject for better categorization.
8. Suggest additional resources for further study if applicable.
9. Limit each flashcard to one question and one answer for clarity.
10. Ensure the content is engaging and encourages active recall.
Return in the following JSON format
{
  "flashcards":[
    {
        "front":str,
        "back":str
    }
    ]
`;

export async function POST(req) {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const data = await req.text();
  
  const result = await model.generateContent([
    { text: SystemPrompt },
    { text: data }
  ]);

  const response = result.response;
  const flashcards = JSON.parse(response.text());

  return NextResponse.json(flashcards.flashcards);
}