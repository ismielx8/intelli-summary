import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"

export async function POST(request: NextRequest) {
  try {
    const { text, summaryLength = "medium", fileName } = await request.json()

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: "No text provided for summarization" }, { status: 400 })
    }

    const cleanText = text.trim()
    const wordCount = cleanText.split(/\s+/).filter((word: string) => word.length > 0).length

    if (wordCount < 10) {
      return NextResponse.json({ error: "Text is too short to summarize effectively" }, { status: 400 })
    }

    if (wordCount > 10000) {
      // Truncate very long texts to prevent API limits
      const truncatedText = cleanText.split(/\s+/).slice(0, 10000).join(" ")
      console.log(`Text truncated from ${wordCount} to 10000 words for processing`)
    }

    const lengthConfig = {
      short: {
        instruction: "in 2-3 concise sentences (40-80 words)",
        maxTokens: 120,
        targetWords: "40-80",
      },
      medium: {
        instruction: "in 1-2 well-structured paragraphs (100-250 words)",
        maxTokens: 400,
        targetWords: "100-250",
      },
      long: {
        instruction: "in 3-4 comprehensive paragraphs (300-500 words)",
        maxTokens: 700,
        targetWords: "300-500",
      },
    }

    const config = lengthConfig[summaryLength as keyof typeof lengthConfig] || lengthConfig.medium

    const summaryPrompt = `You are an expert document analyst. Analyze the following text and create a high-quality summary ${config.instruction}.

REQUIREMENTS:
- Focus on the main themes, key findings, and important conclusions
- Maintain the original tone and context
- Use clear, professional language
- Ensure the summary is self-contained and informative
- Target ${config.targetWords} words

DOCUMENT TEXT:
${cleanText}

SUMMARY:`

    const { text: summary } = await generateText({
      model: groq("llama-3.1-70b-versatile"), // Using the most capable model
      prompt: summaryPrompt,
      maxTokens: config.maxTokens,
      temperature: 0.2, // Lower temperature for more consistent results
      topP: 0.9, // Slightly focused sampling
    })

    const keyPointsPrompt = `Extract the 4-6 most important key points from the following text. Format as a clean bulleted list with each point being concise but informative (10-20 words per point).

DOCUMENT TEXT:
${cleanText}

KEY POINTS (format as • Point 1 • Point 2 etc.):`

    const { text: keyPoints } = await generateText({
      model: groq("llama-3.1-70b-versatile"),
      prompt: keyPointsPrompt,
      maxTokens: 300,
      temperature: 0.1, // Very low temperature for consistent formatting
    })

    const finalSummary = summary.trim()
    const finalKeyPoints = keyPoints.trim()

    if (!finalSummary || finalSummary.length < 20) {
      throw new Error("Generated summary is too short or empty")
    }

    const summaryWordCount = finalSummary.split(/\s+/).filter((word) => word.length > 0).length

    return NextResponse.json({
      summary: finalSummary,
      keyPoints: finalKeyPoints,
      summaryLength,
      fileName,
      wordCount: summaryWordCount,
      originalWordCount: wordCount,
      compressionRatio: Math.round((1 - summaryWordCount / wordCount) * 100),
      success: true,
    })
  } catch (error) {
    console.error("Summary generation error:", error)

    let errorMessage = "Failed to generate summary. Please try again."

    if (error instanceof Error) {
      if (error.message.includes("rate limit")) {
        errorMessage = "Rate limit exceeded. Please wait a moment and try again."
      } else if (error.message.includes("timeout")) {
        errorMessage = "Request timed out. Please try with a shorter document."
      } else if (error.message.includes("too short")) {
        errorMessage = error.message
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        success: false,
      },
      { status: 500 },
    )
  }
}
