export interface DocumentComparisonResult {
  similarity: number
  differences: Array<{
    type: "content" | "structure" | "format"
    description: string
    severity: "low" | "medium" | "high"
  }>
  commonElements: string[]
  uniqueToFirst: string[]
  uniqueToSecond: string[]
}

export interface DocumentQualityMetrics {
  readabilityScore: number
  structureScore: number
  completenessScore: number
  consistencyScore: number
  overallQuality: "excellent" | "good" | "fair" | "poor"
  recommendations: string[]
}

export interface SpecializedDocumentAnalysis {
  invoice?: {
    invoiceNumber: string
    totalAmount: number
    currency: string
    dueDate: string
    vendor: string
    lineItems: Array<{
      description: string
      quantity: number
      unitPrice: number
      total: number
    }>
  }
  contract?: {
    parties: string[]
    effectiveDate: string
    expirationDate: string
    keyTerms: string[]
    obligations: Array<{
      party: string
      obligation: string
    }>
  }
  resume?: {
    candidateName: string
    contactInfo: {
      email?: string
      phone?: string
      location?: string
    }
    experience: Array<{
      company: string
      position: string
      duration: string
      responsibilities: string[]
    }>
    skills: string[]
    education: Array<{
      institution: string
      degree: string
      year: string
    }>
  }
}

export async function compareDocuments(
  text1: string,
  fileName1: string,
  text2: string,
  fileName2: string,
): Promise<DocumentComparisonResult> {
  const response = await fetch("/api/compare-documents", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text1,
      fileName1,
      text2,
      fileName2,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
    throw new Error(errorData.error || `Document comparison failed: ${response.status}`)
  }

  const result = await response.json()
  if (!result.success) {
    throw new Error(result.error || "Document comparison failed")
  }

  return result.comparison
}

export async function analyzeDocumentQuality(text: string, fileName: string): Promise<DocumentQualityMetrics> {
  const response = await fetch("/api/analyze-document-quality", {
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
    throw new Error(errorData.error || `Document quality analysis failed: ${response.status}`)
  }

  const result = await response.json()
  if (!result.success) {
    throw new Error(result.error || "Document quality analysis failed")
  }

  return result.quality
}

export async function performSpecializedAnalysis(
  text: string,
  documentType: string,
  fileName: string,
): Promise<SpecializedDocumentAnalysis> {
  const response = await fetch("/api/specialized-document-analysis", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      documentType,
      fileName,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
    throw new Error(errorData.error || `Specialized analysis failed: ${response.status}`)
  }

  const result = await response.json()
  if (!result.success) {
    throw new Error(result.error || "Specialized analysis failed")
  }

  return result.analysis
}

export function getQualityInsights(quality: DocumentQualityMetrics): string[] {
  const insights: string[] = []

  insights.push(
    `Overall quality: ${quality.overallQuality} (${Math.round((quality.readabilityScore + quality.structureScore + quality.completenessScore + quality.consistencyScore) / 4)}%)`,
  )

  if (quality.readabilityScore < 60) {
    insights.push("Document readability could be improved")
  }

  if (quality.structureScore < 60) {
    insights.push("Document structure needs better organization")
  }

  if (quality.completenessScore < 60) {
    insights.push("Document appears to be missing key information")
  }

  if (quality.consistencyScore < 60) {
    insights.push("Document formatting and style inconsistencies detected")
  }

  return insights
}

export function getComparisonInsights(comparison: DocumentComparisonResult): string[] {
  const insights: string[] = []

  insights.push(`Documents are ${Math.round(comparison.similarity)}% similar`)

  if (comparison.differences.length > 0) {
    const highSeverityDiffs = comparison.differences.filter((d) => d.severity === "high").length
    if (highSeverityDiffs > 0) {
      insights.push(`${highSeverityDiffs} major differences found`)
    }
  }

  if (comparison.commonElements.length > 0) {
    insights.push(`${comparison.commonElements.length} common elements identified`)
  }

  return insights
}
