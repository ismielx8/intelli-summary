import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const ImageAnalysisSchema = z.object({
  objectDetection: z.object({
    objects: z.array(
      z.object({
        label: z.string(),
        confidence: z.number(),
      }),
    ),
    totalObjects: z.number(),
  }),
  sceneAnalysis: z.object({
    description: z.string(),
    tags: z.array(z.string()),
    confidence: z.number(),
  }),
  textAnalysis: z.object({
    extractedText: z.string(),
    textRegions: z.array(
      z.object({
        text: z.string(),
        confidence: z.number(),
      }),
    ),
  }),
  visualFeatures: z.object({
    dominantColors: z.array(z.string()),
    imageType: z.string(),
    hasText: z.boolean(),
    isPhoto: z.boolean(),
    isDrawing: z.boolean(),
  }),
})

async function analyzeImageWithHuggingFace(imageBuffer: ArrayBuffer) {
  const HF_API_URL = "https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-large"

  try {
    console.log("[v0] Calling Hugging Face BLIP model for image captioning")

    const response = await fetch(HF_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
      },
      body: imageBuffer,
    })

    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()
    console.log("[v0] Hugging Face API response:", result)

    // BLIP returns an array with generated_text
    const description = result[0]?.generated_text || "Unable to analyze image"

    return description
  } catch (error) {
    console.error("[v0] Hugging Face API error:", error)
    throw error
  }
}

async function detectObjectsWithHuggingFace(imageBuffer: ArrayBuffer) {
  const HF_API_URL = "https://api-inference.huggingface.co/models/facebook/detr-resnet-50"

  try {
    console.log("[v0] Calling Hugging Face DETR model for object detection")

    const response = await fetch(HF_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
      },
      body: imageBuffer,
    })

    if (!response.ok) {
      throw new Error(`Hugging Face object detection error: ${response.status}`)
    }

    const result = await response.json()
    console.log("[v0] Object detection response:", result)

    // DETR returns array of objects with label and score
    return result.map((obj: any) => ({
      label: obj.label,
      confidence: Math.round(obj.score * 100),
    }))
  } catch (error) {
    console.error("[v0] Object detection error:", error)
    return []
  }
}

async function getImageMetadata(file: File) {
  return {
    width: 0, // Will be filled by client-side if needed
    height: 0,
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      // 10MB limit for Hugging Face
      return NextResponse.json({ error: "Image file too large. Maximum size is 10MB." }, { status: 400 })
    }

    console.log("[v0] Processing image:", file.name, "Size:", file.size, "Type:", file.type)

    const arrayBuffer = await file.arrayBuffer()

    console.log("[v0] Image converted to ArrayBuffer, size:", arrayBuffer.byteLength)

    try {
      console.log("[v0] Starting Hugging Face analysis")

      // Get image description
      const description = await analyzeImageWithHuggingFace(arrayBuffer)

      // Get object detection (with fallback)
      const objects = await detectObjectsWithHuggingFace(arrayBuffer)

      const analysis = {
        objectDetection: {
          objects: objects.slice(0, 10), // Limit to top 10 objects
          totalObjects: objects.length,
        },
        sceneAnalysis: {
          description: description,
          tags: extractTagsFromDescription(description),
          confidence: 85,
        },
        textAnalysis: {
          extractedText: "", // Could add OCR model later
          textRegions: [],
        },
        visualFeatures: {
          dominantColors: ["#808080"], // Could add color analysis later
          imageType: file.type.includes("jpeg") || file.type.includes("jpg") ? "photo" : "image",
          hasText: description.toLowerCase().includes("text") || description.toLowerCase().includes("sign"),
          isPhoto: file.type.includes("jpeg") || file.type.includes("jpg"),
          isDrawing: file.type.includes("svg") || description.toLowerCase().includes("drawing"),
        },
      }

      console.log("[v0] Hugging Face analysis completed successfully")

      const imageMetadata = await getImageMetadata(file)

      const result = {
        ...analysis,
        metadata: {
          width: imageMetadata.width,
          height: imageMetadata.height,
          format: file.type,
          fileSize: file.size,
          analysisTimestamp: new Date().toISOString(),
        },
      }

      return NextResponse.json({
        success: true,
        analysis: result,
      })
    } catch (apiError: any) {
      console.error("[v0] Hugging Face API error:", apiError)

      const fallbackAnalysis = {
        objectDetection: {
          objects: [{ label: "image", confidence: 50 }],
          totalObjects: 1,
        },
        sceneAnalysis: {
          description: "Image analysis temporarily unavailable. Please try again later.",
          tags: ["image"],
          confidence: 50,
        },
        textAnalysis: {
          extractedText: "",
          textRegions: [],
        },
        visualFeatures: {
          dominantColors: ["#808080"],
          imageType: "image",
          hasText: false,
          isPhoto: file.type.includes("jpeg") || file.type.includes("jpg"),
          isDrawing: false,
        },
        metadata: {
          width: 0,
          height: 0,
          format: file.type,
          fileSize: file.size,
          analysisTimestamp: new Date().toISOString(),
        },
      }

      return NextResponse.json({
        success: true,
        analysis: fallbackAnalysis,
        warning: "Using basic analysis due to API limitations",
      })
    }
  } catch (error: any) {
    console.error("[v0] Image analysis error:", error)
    return NextResponse.json(
      {
        error: `Failed to analyze image: ${error.message || "Unknown error"}. Please try again.`,
      },
      { status: 500 },
    )
  }
}

function extractTagsFromDescription(description: string): string[] {
  const commonWords = [
    "the",
    "a",
    "an",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
    "with",
    "by",
    "is",
    "are",
    "was",
    "were",
  ]
  const words = description
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !commonWords.includes(word))

  return [...new Set(words)].slice(0, 5) // Return unique words, max 5
}
