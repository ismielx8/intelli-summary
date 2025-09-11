import { type NextRequest, NextResponse } from "next/server"
import { generateObject } from "ai"
import { groq } from "@ai-sdk/groq"
import { z } from "zod"

const DocumentStructureSchema = z.object({
  documentType: z.enum(["invoice", "receipt", "contract", "report", "letter", "form", "other"]),
  confidence: z.number(),
  structure: z.object({
    title: z.string().optional(),
    headers: z.array(z.string()),
    sections: z.array(
      z.object({
        title: z.string(),
        content: z.string(),
        type: z.enum(["paragraph", "list", "table", "header"]),
      }),
    ),
    tables: z.array(
      z.object({
        headers: z.array(z.string()),
        rows: z.array(z.array(z.string())),
        confidence: z.number(),
      }),
    ),
    keyValuePairs: z.array(
      z.object({
        key: z.string(),
        value: z.string(),
        confidence: z.number(),
      }),
    ),
  }),
  entities: z.array(
    z.object({
      type: z.enum(["person", "organization", "location", "date", "money", "email", "phone"]),
      value: z.string(),
      confidence: z.number(),
    }),
  ),
  sentiment: z
    .object({
      overall: z.enum(["positive", "negative", "neutral"]),
      confidence: z.number(),
    })
    .optional(),
})

export async function POST(request: NextRequest) {
  try {
    const { text, fileName } = await request.json()

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 })
    }

    // Use Groq for document structure analysis
    const { object: analysis } = await generateObject({
      model: groq("llama-3.1-70b-versatile"),
      schema: DocumentStructureSchema,
      messages: [
        {
          role: "user",
          content: `Analyze the structure and content of this document (filename: ${fileName}):

${text}

Provide a comprehensive analysis including:
1. Document type classification with confidence
2. Document structure (title, headers, sections, tables)
3. Key-value pairs extraction
4. Named entity recognition (people, organizations, locations, dates, money, emails, phones)
5. Sentiment analysis if applicable

Be thorough and accurate in identifying the document structure and extracting relevant information.`,
        },
      ],
    })

    return NextResponse.json({
      success: true,
      analysis,
    })
  } catch (error) {
    console.error("Document structure analysis error:", error)
    return NextResponse.json(
      {
        error: "Failed to analyze document structure. Please try again.",
      },
      { status: 500 },
    )
  }
}
