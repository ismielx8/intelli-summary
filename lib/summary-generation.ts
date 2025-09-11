export interface GeneratedSummary {
  summary: string
  keyPoints: string
  summaryLength: "short" | "medium" | "long"
  fileName: string
  wordCount: number
  originalWordCount: number
}

export async function generateSummary(
  text: string,
  fileName: string,
  summaryLength: "short" | "medium" | "long" = "medium",
): Promise<GeneratedSummary> {
  const MAX_RETRIES = 3
  const TIMEOUT_MS = 60000 // 1 minute timeout for AI generation

  // Validate input parameters
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    throw new Error("Invalid input: Text cannot be empty")
  }

  if (!fileName || typeof fileName !== "string") {
    throw new Error("Invalid input: File name is required")
  }

  const wordCount = text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length

  if (wordCount < 10) {
    throw new Error("Text too short: Minimum 10 words required for summarization")
  }

  if (wordCount > 15000) {
    throw new Error("Text too long: Maximum 15,000 words supported for summarization")
  }

  let lastError: Error | null = null

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

      const response = await fetch("/api/generate-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: text.trim(),
          fileName,
          summaryLength,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown server error" }))
        throw new Error(errorData.error || `Server error: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Summary generation failed")
      }

      // Validate the response
      if (!result.summary || !result.keyPoints) {
        throw new Error("Invalid response: Missing summary or key points")
      }

      return {
        summary: result.summary,
        keyPoints: result.keyPoints,
        summaryLength: result.summaryLength,
        fileName: result.fileName,
        wordCount: result.wordCount,
        originalWordCount: result.originalWordCount,
      }
    } catch (error) {
      lastError = error as Error

      if (error instanceof Error) {
        // Don't retry for certain types of errors
        if (error.name === "AbortError") {
          throw new Error("Timeout: Summary generation took too long. Try with shorter text.")
        }

        if (
          error.message.includes("Invalid input") ||
          error.message.includes("too short") ||
          error.message.includes("too long")
        ) {
          throw error // Don't retry validation errors
        }

        if (error.message.includes("rate limit")) {
          // Wait longer for rate limit errors
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 2000))
        }
      }

      // If this is the last attempt, throw the error
      if (attempt === MAX_RETRIES) {
        break
      }

      // Wait before retry with exponential backoff
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000))
    }
  }

  throw new Error(`Summary generation failed after ${MAX_RETRIES} attempts: ${lastError?.message || "Unknown error"}`)
}

export function calculateCompressionRatio(originalWordCount: number, summaryWordCount: number): number {
  if (!originalWordCount || !summaryWordCount || originalWordCount <= 0 || summaryWordCount < 0) {
    return 0
  }

  if (summaryWordCount > originalWordCount) {
    return 0 // Summary shouldn't be longer than original
  }

  return Math.round((1 - summaryWordCount / originalWordCount) * 100)
}

export function validateTextForSummary(text: string): { isValid: boolean; error?: string; wordCount?: number } {
  if (!text || typeof text !== "string") {
    return { isValid: false, error: "Text must be a non-empty string" }
  }

  const trimmedText = text.trim()
  if (trimmedText.length === 0) {
    return { isValid: false, error: "Text cannot be empty" }
  }

  const wordCount = trimmedText.split(/\s+/).filter((word) => word.length > 0).length

  if (wordCount < 10) {
    return { isValid: false, error: "Text must contain at least 10 words", wordCount }
  }

  if (wordCount > 15000) {
    return { isValid: false, error: "Text exceeds maximum length of 15,000 words", wordCount }
  }

  return { isValid: true, wordCount }
}
