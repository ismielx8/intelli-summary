export interface ImageAnalysisResult {
  objectDetection: {
    objects: Array<{
      label: string
      confidence: number
      boundingBox?: {
        x: number
        y: number
        width: number
        height: number
      }
    }>
    totalObjects: number
  }
  sceneAnalysis: {
    description: string
    tags: string[]
    confidence: number
  }
  textAnalysis: {
    extractedText: string
    textRegions: Array<{
      text: string
      confidence: number
      boundingBox?: {
        x: number
        y: number
        width: number
        height: number
      }
    }>
  }
  visualFeatures: {
    dominantColors: string[]
    imageType: string
    hasText: boolean
    isPhoto: boolean
    isDrawing: boolean
  }
  metadata: {
    width: number
    height: number
    format: string
    fileSize: number
    analysisTimestamp: string
  }
}

export interface DocumentStructureAnalysis {
  documentType: "invoice" | "receipt" | "contract" | "report" | "letter" | "form" | "other"
  confidence: number
  structure: {
    title?: string
    headers: string[]
    sections: Array<{
      title: string
      content: string
      type: "paragraph" | "list" | "table" | "header"
    }>
    tables: Array<{
      headers: string[]
      rows: string[][]
      confidence: number
    }>
    keyValuePairs: Array<{
      key: string
      value: string
      confidence: number
    }>
  }
  entities: Array<{
    type: "person" | "organization" | "location" | "date" | "money" | "email" | "phone"
    value: string
    confidence: number
  }>
  sentiment?: {
    overall: "positive" | "negative" | "neutral"
    confidence: number
  }
}

export async function analyzeImage(file: File): Promise<ImageAnalysisResult> {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("analysisType", "comprehensive")

  const response = await fetch("/api/analyze-image", {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
    throw new Error(errorData.error || `Analysis failed: ${response.status}`)
  }

  const result = await response.json()
  if (!result.success) {
    throw new Error(result.error || "Image analysis failed")
  }

  return result.analysis
}

export async function analyzeDocumentStructure(text: string, fileName: string): Promise<DocumentStructureAnalysis> {
  const response = await fetch("/api/analyze-document-structure", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      fileName,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
    throw new Error(errorData.error || `Document analysis failed: ${response.status}`)
  }

  const result = await response.json()
  if (!result.success) {
    throw new Error(result.error || "Document structure analysis failed")
  }

  return result.analysis
}

export function getAnalysisInsights(analysis: ImageAnalysisResult): string[] {
  const insights: string[] = []

  // Object detection insights
  if (analysis.objectDetection.totalObjects > 0) {
    const topObjects = analysis.objectDetection.objects
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3)
      .map((obj) => obj.label)
    insights.push(`Detected ${analysis.objectDetection.totalObjects} objects: ${topObjects.join(", ")}`)
  }

  // Text insights
  if (analysis.textAnalysis.extractedText.length > 0) {
    const wordCount = analysis.textAnalysis.extractedText.split(/\s+/).length
    insights.push(`Contains ${wordCount} words of readable text`)
  }

  // Visual insights
  if (analysis.visualFeatures.dominantColors.length > 0) {
    insights.push(`Dominant colors: ${analysis.visualFeatures.dominantColors.slice(0, 3).join(", ")}`)
  }

  // Image type insights
  if (analysis.visualFeatures.isPhoto) {
    insights.push("Appears to be a photograph")
  } else if (analysis.visualFeatures.isDrawing) {
    insights.push("Appears to be a drawing or illustration")
  }

  return insights
}

export function getDocumentInsights(analysis: DocumentStructureAnalysis): string[] {
  const insights: string[] = []

  insights.push(`Document type: ${analysis.documentType} (${Math.round(analysis.confidence)}% confidence)`)

  if (analysis.structure.sections.length > 0) {
    insights.push(`Contains ${analysis.structure.sections.length} main sections`)
  }

  if (analysis.structure.tables.length > 0) {
    insights.push(`Found ${analysis.structure.tables.length} tables`)
  }

  if (analysis.entities.length > 0) {
    const entityTypes = [...new Set(analysis.entities.map((e) => e.type))]
    insights.push(`Identified entities: ${entityTypes.join(", ")}`)
  }

  if (analysis.sentiment) {
    insights.push(`Overall sentiment: ${analysis.sentiment.overall}`)
  }

  return insights
}
