import { type NextRequest, NextResponse } from "next/server"
import { createWorker } from "tesseract.js"

async function parsePDF(buffer: Buffer) {
  try {
    const pdfParse = (await import("pdf-parse")).default
    return await pdfParse(buffer)
  } catch (error) {
    console.error("PDF parse import error:", error)
    throw new Error("PDF parsing library not available")
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const fileType = formData.get("type") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    let extractedText = ""

    if (fileType === "pdf") {
      try {
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        const pdfData = await parsePDF(buffer)
        extractedText = pdfData.text.trim()

        if (!extractedText) {
          extractedText = "No readable text found in this PDF document."
        }
      } catch (pdfError) {
        console.error("PDF parsing error:", pdfError)
        extractedText = "Failed to parse PDF. The document may be image-based or corrupted."
      }
    } else if (fileType === "image") {
      try {
        const arrayBuffer = await file.arrayBuffer()

        // Create worker with better configuration
        const worker = await createWorker("eng", 1, {
          logger: (m) => {
            if (m.status === "recognizing text") {
              console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`)
            }
          },
        })

        // Configure Tesseract for better accuracy
        await worker.setParameters({
          tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,!?;:()-",
          tessedit_pageseg_mode: "1", // Automatic page segmentation with OSD
        })

        const {
          data: { text, confidence },
        } = await worker.recognize(arrayBuffer)
        await worker.terminate()

        extractedText = text.trim()

        // Check confidence level
        if (confidence < 30) {
          extractedText += `\n\n[Note: Low confidence OCR result (${Math.round(confidence)}%). Text may be inaccurate.]`
        }

        if (!extractedText.replace(/\s/g, "")) {
          extractedText = "No readable text found in this image."
        }
      } catch (ocrError) {
        console.error("OCR Error:", ocrError)
        return NextResponse.json(
          {
            error: "Failed to extract text from image. Please ensure the image contains clear, readable text.",
          },
          { status: 500 },
        )
      }
    }

    const words = extractedText.split(/\s+/).filter((word) => word.length > 0)

    return NextResponse.json({
      text: extractedText,
      wordCount: words.length,
      characterCount: extractedText.length,
      success: true,
    })
  } catch (error) {
    console.error("Text extraction error:", error)
    return NextResponse.json(
      {
        error: "An unexpected error occurred during text extraction. Please try again.",
      },
      { status: 500 },
    )
  }
}
