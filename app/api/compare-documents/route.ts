import { type NextRequest, NextResponse } from "next/server"
import { generateObject } from "ai"
import { groq } from "@ai-sdk/groq"
import { z } from "zod"

const DocumentComparisonSchema = z.object({
  similarity: z.number(),
  differences: z.array(
    z.object({
      type: z.enum(["content", "structure", "format"]),
      description: z.string(),
      severity: z.enum(["low", "medium", "high"]),
    }),
  ),
  commonElements: z.array(z.string()),
  uniqueToFirst: z.array(z.string()),
  uniqueToSecond: z.array(z.string()),
})

export async function POST(request: NextRequest) {
  try {
    const { text1, fileName1, text2, fileName2 } = await request.json()

    if (!text1 || !text2) {
      return NextResponse.json({ error: "Both documents are required" }, { status: 400 })
    }

    const { object: comparison } = await generateObject({
      model: groq("llama-3.1-70b-versatile"),
      schema: DocumentComparisonSchema,
      messages: [
        {
          role: "user",
          content: `Compare these two documents and provide a detailed analysis:

Document 1 (${fileName1}):
${text1}

Document 2 (${fileName2}):
${text2}

Provide:
1. Similarity percentage (0-100)
2. Key differences with type (content/structure/format) and severity
3. Common elements between documents
4. Elements unique to each document

Be thorough and accurate in your comparison.`,
        },
      ],
    })

    return NextResponse.json({
      success: true,
      comparison,
    })
  } catch (error) {
    console.error("Document comparison error:", error)
    return NextResponse.json(
      {
        error: "Failed to compare documents. Please try again.",
      },
      { status: 500 },
    )
  }
}
