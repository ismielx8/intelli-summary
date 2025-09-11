export interface ExtractedText {
  text: string
  wordCount: number
  characterCount: number
  fileName: string
  fileType: "pdf" | "image"
}

export async function extractTextFromFile(file: File, type: "pdf" | "image"): Promise<ExtractedText> {
  const MAX_RETRIES = 3
  const TIMEOUT_MS = 120000 // 2 minutes timeout for large files

  // Validate file before processing
  if (!file || file.size === 0) {
    throw new Error("Invalid file: File is empty or corrupted")
  }

  if (file.size > 50 * 1024 * 1024) {
    // 50MB limit
    throw new Error("File too large: Maximum file size is 50MB")
  }

  if (type === "pdf" && !file.type.includes("pdf") && !file.name.toLowerCase().endsWith(".pdf")) {
    throw new Error("Invalid PDF file: File does not appear to be a valid PDF")
  }

  if (
    type === "image" &&
    !file.type.startsWith("image/") &&
    !file.name.toLowerCase().match(/\.(jpg|jpeg|png|gif|bmp)$/)
  ) {
    throw new Error("Invalid image file: Supported formats are JPG, PNG, GIF, BMP")
  }

  let lastError: Error | null = null

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", type)

      // Create abort controller for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

      const response = await fetch("/api/extract-text", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown server error" }))
        throw new Error(errorData.error || `Server error: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Text extraction failed")
      }

      return {
        text: result.text,
        wordCount: result.wordCount,
        characterCount: result.characterCount,
        fileName: file.name,
        fileType: type,
      }
    } catch (error) {
      lastError = error as Error

      if (error instanceof Error) {
        // Don't retry for certain types of errors
        if (error.name === "AbortError") {
          throw new Error(
            `Timeout: ${type === "pdf" ? "PDF parsing" : "Image OCR"} took too long. Try with a smaller file.`,
          )
        }

        if (error.message.includes("Invalid") || error.message.includes("too large")) {
          throw error // Don't retry validation errors
        }

        if (error.message.includes("rate limit")) {
          // Wait before retry for rate limits
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000))
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

  throw new Error(`Failed after ${MAX_RETRIES} attempts: ${lastError?.message || "Unknown error"}`)
}

export function preprocessTextForSummary(text: string): string {
  if (!text || typeof text !== "string") {
    throw new Error("Invalid text input for preprocessing")
  }

  try {
    return text
      .replace(/\s+/g, " ") // Replace multiple spaces with single space
      .replace(/\n+/g, " ") // Replace newlines with spaces
      .replace(/[^\w\s.,!?;:()-]/g, "") // Remove special characters except basic punctuation
      .trim()
  } catch (error) {
    console.error("Text preprocessing error:", error)
    return text.trim() // Fallback to basic trim
  }
}

export function validateFile(file: File, type: "pdf" | "image"): { isValid: boolean; error?: string } {
  if (!file) {
    return { isValid: false, error: "No file provided" }
  }

  if (file.size === 0) {
    return { isValid: false, error: "File is empty" }
  }

  if (file.size > 50 * 1024 * 1024) {
    return { isValid: false, error: "File size exceeds 50MB limit" }
  }

  if (type === "pdf") {
    if (!file.type.includes("pdf") && !file.name.toLowerCase().endsWith(".pdf")) {
      return { isValid: false, error: "File is not a valid PDF" }
    }
  } else if (type === "image") {
    const validImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/bmp"]
    const validExtensions = [".jpg", ".jpeg", ".png", ".gif", ".bmp"]

    if (
      !validImageTypes.some((t) => file.type.includes(t)) &&
      !validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext))
    ) {
      return { isValid: false, error: "File is not a supported image format" }
    }
  }

  return { isValid: true }
}
