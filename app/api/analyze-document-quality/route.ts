import { type NextRequest, NextResponse } from "next/server"
import { generateObject } from "ai"
import { groq } from "@ai-sdk/groq"
import { z } from "zod"

const DocumentQualitySchema = z.object({
  readabilityScore: z.number(),
  structureScore: z.number(),
  completenessScore: z.number(),
  consistencyScore: z.number(),
  overallQuality: z.enum(["excellent", "good", "fair", "poor"]),
  recommendations: z.array(z.string()),
})

export async function POST(request: NextRequest) {
  try {
    const { text, fileName } = await request.json()

    if (!text) {
      return NextResponse.json({ error: "Document text is required" }, { status: 400 })
    }

    const { object: quality } = await generateObject({
      model: groq("llama-3.1-70b-versatile"),
      schema: DocumentQualitySchema,
      messages: [
        {
          role: "user",
          content: `Analyze the quality of this document (${fileName}):

${text}

Evaluate and score (0-100) the following aspects:
1. Readability: How clear and easy to understand is the text?
2. Structure: How well organized and logical is the document structure?
3. Completeness: Does the document contain all necessary information for its purpose?
4. Consistency: Are formatting, style, and terminology consistent throughout?

Also provide:
- Overall quality rating (excellent/good/fair/poor)
- Specific recommendations for improvement

Be thorough and constructive in your analysis.`,
        },
      ],
    })

    return NextResponse.json({
      success: true,
      quality,
    })
  } catch (error) {
    console.error("Document quality analysis error:", error)
    return NextResponse.json(
      {
        error: "Failed to analyze document quality. Please try again.",
      },
      { status: 500 },
    )
  }
}
