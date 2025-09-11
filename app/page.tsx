"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Upload,
  FileText,
  ImageIcon,
  Loader2,
  CheckCircle,
  AlertCircle,
  Sparkles,
  BookOpen,
  Target,
  Eye,
  BarChart3,
  Lightbulb,
  Zap,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { extractTextFromFile, type ExtractedText } from "@/lib/text-extraction"
import { generateSummary, type GeneratedSummary, calculateCompressionRatio } from "@/lib/summary-generation"
import { ImageAnalysisCard } from "@/components/image-analysis-card"
import { DocumentStructureCard } from "@/components/document-structure-card"
import { AnalysisDashboard } from "@/components/analysis-dashboard"
import {
  analyzeImage,
  analyzeDocumentStructure,
  type ImageAnalysisResult,
  type DocumentStructureAnalysis,
} from "@/lib/image-analysis"
import {
  analyzeDocumentQuality,
  performSpecializedAnalysis,
  type DocumentQualityMetrics,
  type SpecializedDocumentAnalysis,
} from "@/lib/advanced-document-analysis"

interface UploadedFile {
  file: File
  id: string
  type: "pdf" | "image"
  preview?: string
  extractedText?: ExtractedText
  isExtracting?: boolean
  extractionError?: string
  generatedSummary?: GeneratedSummary
  isSummarizing?: boolean
  summaryError?: string
  imageAnalysis?: ImageAnalysisResult
  isAnalyzingImage?: boolean
  imageAnalysisError?: string
  documentStructure?: DocumentStructureAnalysis
  isAnalyzingStructure?: boolean
  structureAnalysisError?: string
  documentQuality?: DocumentQualityMetrics
  isAnalyzingQuality?: boolean
  qualityAnalysisError?: string
  specializedAnalysis?: SpecializedDocumentAnalysis
  isAnalyzingSpecialized?: boolean
  specializedAnalysisError?: string
}

export default function DocumentAnalyzer() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [summaryLength, setSummaryLength] = useState<"short" | "medium" | "long">("medium")
  const [activeTab, setActiveTab] = useState("upload")
  const { toast } = useToast()

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const processFiles = useCallback(
    (files: FileList) => {
      const validFiles: UploadedFile[] = []

      Array.from(files).forEach((file) => {
        const fileType = file.type
        const fileName = file.name.toLowerCase()

        if (fileType === "application/pdf" || fileName.endsWith(".pdf")) {
          validFiles.push({
            file,
            id: Math.random().toString(36).substr(2, 9),
            type: "pdf",
          })
        } else if (
          fileType.startsWith("image/") ||
          fileName.endsWith(".jpg") ||
          fileName.endsWith(".jpeg") ||
          fileName.endsWith(".png") ||
          fileName.endsWith(".gif") ||
          fileName.endsWith(".bmp")
        ) {
          const reader = new FileReader()
          reader.onload = (e) => {
            validFiles.push({
              file,
              id: Math.random().toString(36).substr(2, 9),
              type: "image",
              preview: e.target?.result as string,
            })
            if (
              validFiles.length ===
              Array.from(files).filter(
                (f) =>
                  f.type === "application/pdf" ||
                  f.name.toLowerCase().endsWith(".pdf") ||
                  f.type.startsWith("image/") ||
                  f.name.toLowerCase().match(/\.(jpg|jpeg|png|gif|bmp)$/),
              ).length
            ) {
              setUploadedFiles((prev) => [...prev, ...validFiles])
            }
          }
          reader.readAsDataURL(file)
        } else {
          toast({
            title: "Unsupported file type",
            description: `${file.name} is not a supported file type. Please upload PDF or image files.`,
            variant: "destructive",
          })
        }
      })

      // Add PDF files immediately (no preview needed)
      const pdfFiles = validFiles.filter((f) => f.type === "pdf")
      if (pdfFiles.length > 0) {
        setUploadedFiles((prev) => [...prev, ...pdfFiles])
      }
    },
    [toast],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)

      const files = e.dataTransfer.files
      if (files.length > 0) {
        processFiles(files)
      }
    },
    [processFiles],
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files && files.length > 0) {
        processFiles(files)
      }
    },
    [processFiles],
  )

  const removeFile = useCallback((id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id))
  }, [])

  const extractTextFromFiles = useCallback(async () => {
    setIsProcessing(true)

    const filesToProcess = uploadedFiles.filter((f) => !f.extractedText && !f.extractionError)

    for (const uploadedFile of filesToProcess) {
      // Mark file as being processed
      setUploadedFiles((prev) => prev.map((f) => (f.id === uploadedFile.id ? { ...f, isExtracting: true } : f)))

      try {
        const extractedText = await extractTextFromFile(uploadedFile.file, uploadedFile.type)

        // Update file with extracted text
        setUploadedFiles((prev) =>
          prev.map((f) => (f.id === uploadedFile.id ? { ...f, extractedText, isExtracting: false } : f)),
        )

        toast({
          title: "Text extracted successfully",
          description: `Extracted ${extractedText.wordCount} words from ${uploadedFile.file.name}`,
        })
      } catch (error) {
        console.error("Extraction error:", error)

        // Update file with error
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === uploadedFile.id
              ? { ...f, extractionError: error instanceof Error ? error.message : "Unknown error", isExtracting: false }
              : f,
          ),
        )

        toast({
          title: "Text extraction failed",
          description: `Failed to extract text from ${uploadedFile.file.name}`,
          variant: "destructive",
        })
      }
    }

    setIsProcessing(false)
  }, [uploadedFiles, toast])

  const generateSummaries = useCallback(async () => {
    setIsProcessing(true)

    const filesToSummarize = uploadedFiles.filter((f) => f.extractedText && !f.generatedSummary && !f.summaryError)

    for (const uploadedFile of filesToSummarize) {
      if (!uploadedFile.extractedText) continue

      // Mark file as being summarized
      setUploadedFiles((prev) => prev.map((f) => (f.id === uploadedFile.id ? { ...f, isSummarizing: true } : f)))

      try {
        const summary = await generateSummary(uploadedFile.extractedText.text, uploadedFile.file.name, summaryLength)

        // Update file with generated summary
        setUploadedFiles((prev) =>
          prev.map((f) => (f.id === uploadedFile.id ? { ...f, generatedSummary: summary, isSummarizing: false } : f)),
        )

        const compressionRatio = calculateCompressionRatio(uploadedFile.extractedText.wordCount, summary.wordCount)

        toast({
          title: "Summary generated successfully",
          description: `Generated ${summary.summaryLength} summary (${compressionRatio}% compression) for ${uploadedFile.file.name}`,
        })
      } catch (error) {
        console.error("Summary generation error:", error)

        // Update file with error
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === uploadedFile.id
              ? { ...f, summaryError: error instanceof Error ? error.message : "Unknown error", isSummarizing: false }
              : f,
          ),
        )

        toast({
          title: "Summary generation failed",
          description: `Failed to generate summary for ${uploadedFile.file.name}`,
          variant: "destructive",
        })
      }
    }

    setIsProcessing(false)
  }, [uploadedFiles, summaryLength, toast])

  const analyzeImages = useCallback(async () => {
    setIsProcessing(true)

    const imagesToAnalyze = uploadedFiles.filter((f) => f.type === "image" && !f.imageAnalysis && !f.imageAnalysisError)

    for (const uploadedFile of imagesToAnalyze) {
      // Mark file as being analyzed
      setUploadedFiles((prev) => prev.map((f) => (f.id === uploadedFile.id ? { ...f, isAnalyzingImage: true } : f)))

      try {
        const analysis = await analyzeImage(uploadedFile.file)

        // Update file with analysis
        setUploadedFiles((prev) =>
          prev.map((f) => (f.id === uploadedFile.id ? { ...f, imageAnalysis: analysis, isAnalyzingImage: false } : f)),
        )

        toast({
          title: "Image analysis complete",
          description: `Analyzed ${uploadedFile.file.name} successfully`,
        })
      } catch (error) {
        console.error("Image analysis error:", error)

        // Update file with error
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === uploadedFile.id
              ? {
                  ...f,
                  imageAnalysisError: error instanceof Error ? error.message : "Unknown error",
                  isAnalyzingImage: false,
                }
              : f,
          ),
        )

        toast({
          title: "Image analysis failed",
          description: `Failed to analyze ${uploadedFile.file.name}`,
          variant: "destructive",
        })
      }
    }

    setIsProcessing(false)
  }, [uploadedFiles, toast])

  const analyzeDocumentStructures = useCallback(async () => {
    setIsProcessing(true)

    const documentsToAnalyze = uploadedFiles.filter(
      (f) => f.extractedText && !f.documentStructure && !f.structureAnalysisError,
    )

    for (const uploadedFile of documentsToAnalyze) {
      if (!uploadedFile.extractedText) continue

      // Mark file as being analyzed
      setUploadedFiles((prev) => prev.map((f) => (f.id === uploadedFile.id ? { ...f, isAnalyzingStructure: true } : f)))

      try {
        const analysis = await analyzeDocumentStructure(uploadedFile.extractedText.text, uploadedFile.file.name)

        // Update file with analysis
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === uploadedFile.id ? { ...f, documentStructure: analysis, isAnalyzingStructure: false } : f,
          ),
        )

        toast({
          title: "Document structure analysis complete",
          description: `Analyzed structure of ${uploadedFile.file.name}`,
        })
      } catch (error) {
        console.error("Document structure analysis error:", error)

        // Update file with error
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === uploadedFile.id
              ? {
                  ...f,
                  structureAnalysisError: error instanceof Error ? error.message : "Unknown error",
                  isAnalyzingStructure: false,
                }
              : f,
          ),
        )

        toast({
          title: "Document structure analysis failed",
          description: `Failed to analyze structure of ${uploadedFile.file.name}`,
          variant: "destructive",
        })
      }
    }

    setIsProcessing(false)
  }, [uploadedFiles, toast])

  const analyzeDocumentQualities = useCallback(async () => {
    setIsProcessing(true)

    const documentsToAnalyze = uploadedFiles.filter(
      (f) => f.extractedText && !f.documentQuality && !f.qualityAnalysisError,
    )

    for (const uploadedFile of documentsToAnalyze) {
      if (!uploadedFile.extractedText) continue

      // Mark file as being analyzed
      setUploadedFiles((prev) => prev.map((f) => (f.id === uploadedFile.id ? { ...f, isAnalyzingQuality: true } : f)))

      try {
        const quality = await analyzeDocumentQuality(uploadedFile.extractedText.text, uploadedFile.file.name)

        // Update file with quality analysis
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === uploadedFile.id ? { ...f, documentQuality: quality, isAnalyzingQuality: false } : f,
          ),
        )

        toast({
          title: "Document quality analysis complete",
          description: `Analyzed quality of ${uploadedFile.file.name}`,
        })
      } catch (error) {
        console.error("Document quality analysis error:", error)

        // Update file with error
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === uploadedFile.id
              ? {
                  ...f,
                  qualityAnalysisError: error instanceof Error ? error.message : "Unknown error",
                  isAnalyzingQuality: false,
                }
              : f,
          ),
        )

        toast({
          title: "Document quality analysis failed",
          description: `Failed to analyze quality of ${uploadedFile.file.name}`,
          variant: "destructive",
        })
      }
    }

    setIsProcessing(false)
  }, [uploadedFiles, toast])

  const performSpecializedAnalyses = useCallback(async () => {
    setIsProcessing(true)

    const documentsToAnalyze = uploadedFiles.filter(
      (f) =>
        f.extractedText &&
        f.documentStructure &&
        !f.specializedAnalysis &&
        !f.specializedAnalysisError &&
        ["invoice", "contract", "resume"].includes(f.documentStructure.documentType),
    )

    for (const uploadedFile of documentsToAnalyze) {
      if (!uploadedFile.extractedText || !uploadedFile.documentStructure) continue

      // Mark file as being analyzed
      setUploadedFiles((prev) =>
        prev.map((f) => (f.id === uploadedFile.id ? { ...f, isAnalyzingSpecialized: true } : f)),
      )

      try {
        const analysis = await performSpecializedAnalysis(
          uploadedFile.extractedText.text,
          uploadedFile.documentStructure.documentType,
          uploadedFile.file.name,
        )

        // Update file with specialized analysis
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === uploadedFile.id ? { ...f, specializedAnalysis: analysis, isAnalyzingSpecialized: false } : f,
          ),
        )

        toast({
          title: "Specialized analysis complete",
          description: `Performed ${uploadedFile.documentStructure.documentType} analysis for ${uploadedFile.file.name}`,
        })
      } catch (error) {
        console.error("Specialized analysis error:", error)

        // Update file with error
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === uploadedFile.id
              ? {
                  ...f,
                  specializedAnalysisError: error instanceof Error ? error.message : "Unknown error",
                  isAnalyzingSpecialized: false,
                }
              : f,
          ),
        )

        toast({
          title: "Specialized analysis failed",
          description: `Failed to perform specialized analysis for ${uploadedFile.file.name}`,
          variant: "destructive",
        })
      }
    }

    setIsProcessing(false)
  }, [uploadedFiles, toast])

  const runComprehensiveAnalysis = useCallback(async () => {
    setIsProcessing(true)

    try {
      // Step 1: Extract text from all files that need it
      await extractTextFromFiles()

      // Step 2: Analyze images
      await analyzeImages()

      // Step 3: Analyze document structures
      await analyzeDocumentStructures()

      // Step 4: Analyze document quality
      await analyzeDocumentQualities()

      // Step 5: Perform specialized analysis
      await performSpecializedAnalyses()

      // Step 6: Generate summaries
      await generateSummaries()

      toast({
        title: "Comprehensive analysis complete",
        description: "All files have been analyzed successfully",
      })

      // Switch to dashboard view
      setActiveTab("dashboard")
    } catch (error) {
      console.error("Comprehensive analysis error:", error)
      toast({
        title: "Analysis failed",
        description: "Some analyses may have failed. Check individual files for details.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }, [
    extractTextFromFiles,
    analyzeImages,
    analyzeDocumentStructures,
    analyzeDocumentQualities,
    performSpecializedAnalyses,
    generateSummaries,
    toast,
  ])

  const hasExtractedText = uploadedFiles.some((f) => f.extractedText)
  const canExtractText = uploadedFiles.some((f) => !f.extractedText && !f.extractionError)
  const canGenerateSummaries = uploadedFiles.some((f) => f.extractedText && !f.generatedSummary && !f.summaryError)
  const canAnalyzeImages = uploadedFiles.some((f) => f.type === "image" && !f.imageAnalysis && !f.imageAnalysisError)
  const canAnalyzeStructures = uploadedFiles.some(
    (f) => f.extractedText && !f.documentStructure && !f.structureAnalysisError,
  )
  const canAnalyzeQuality = uploadedFiles.some((f) => f.extractedText && !f.documentQuality && !f.qualityAnalysisError)
  const canPerformSpecialized = uploadedFiles.some(
    (f) =>
      f.extractedText &&
      f.documentStructure &&
      !f.specializedAnalysis &&
      !f.specializedAnalysisError &&
      ["invoice", "contract", "resume"].includes(f.documentStructure.documentType),
  )

  const dashboardFiles = uploadedFiles.map((f) => ({
    id: f.id,
    name: f.file.name,
    type: f.type,
    size: f.file.size,
    extractedText: f.extractedText,
    imageAnalysis: f.imageAnalysis,
    documentStructure: f.documentStructure,
    documentQuality: f.documentQuality,
    specializedAnalysis: f.specializedAnalysis,
    generatedSummary: f.generatedSummary,
  }))

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4 pt-8">
          <h1 className="text-4xl font-bold text-slate-900 text-balance">Document & Image Analyzer</h1>
          <p className="text-lg text-slate-600 text-pretty max-w-2xl mx-auto">
            Upload PDF documents or images for comprehensive AI analysis including text extraction, structure analysis,
            object detection, and more
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload & Process
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="flex items-center gap-2" disabled={uploadedFiles.length === 0}>
              <BarChart3 className="h-4 w-4" />
              Analysis Dashboard
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-8">
            {/* Upload Area */}
            <Card className="border-2 border-dashed border-slate-300 bg-white/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload Documents
                </CardTitle>
                <CardDescription>Drag and drop your PDF files or images here, or click to browse</CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    isDragOver ? "border-blue-400 bg-blue-50" : "border-slate-300 hover:border-slate-400"
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    multiple
                    accept=".pdf,image/*"
                    onChange={handleFileSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <div className="p-4 bg-slate-100 rounded-full">
                        <Upload className="h-8 w-8 text-slate-600" />
                      </div>
                    </div>
                    <div>
                      <p className="text-lg font-medium text-slate-700">Drop your files here or click to browse</p>
                      <p className="text-sm text-slate-500 mt-1">
                        Supports PDF documents and image files (JPG, PNG, GIF, BMP)
                      </p>
                    </div>
                    <Button variant="outline" className="mt-4 bg-transparent">
                      Choose Files
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Uploaded Files */}
            {uploadedFiles.length > 0 && (
              <Card className="bg-white/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Uploaded Files ({uploadedFiles.length})</CardTitle>
                  <CardDescription>Files ready for processing and analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {uploadedFiles.map((uploadedFile) => (
                      <div key={uploadedFile.id} className="border rounded-lg bg-white p-6">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0">
                            {uploadedFile.type === "pdf" ? (
                              <div className="p-3 bg-red-100 rounded-lg">
                                <FileText className="h-8 w-8 text-red-600" />
                              </div>
                            ) : (
                              <div className="p-3 bg-blue-100 rounded-lg">
                                <ImageIcon className="h-8 w-8 text-blue-600" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <h3 className="text-lg font-semibold text-slate-900 truncate">
                                  {uploadedFile.file.name}
                                </h3>
                                <p className="text-sm text-slate-500">
                                  {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFile(uploadedFile.id)}
                                className="text-slate-400 hover:text-red-500"
                              >
                                ×
                              </Button>
                            </div>

                            {/* Status indicators */}
                            <div className="flex items-center gap-3 mb-4 flex-wrap">
                              {uploadedFile.isExtracting && (
                                <Badge variant="secondary" className="flex items-center gap-1">
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  Extracting text...
                                </Badge>
                              )}
                              {uploadedFile.extractedText && (
                                <Badge
                                  variant="default"
                                  className="flex items-center gap-1 bg-green-100 text-green-800"
                                >
                                  <CheckCircle className="h-3 w-3" />
                                  Text extracted ({uploadedFile.extractedText.wordCount} words)
                                </Badge>
                              )}
                              {uploadedFile.isSummarizing && (
                                <Badge variant="secondary" className="flex items-center gap-1">
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  Generating summary...
                                </Badge>
                              )}
                              {uploadedFile.generatedSummary && (
                                <Badge
                                  variant="default"
                                  className="flex items-center gap-1 bg-purple-100 text-purple-800"
                                >
                                  <Sparkles className="h-3 w-3" />
                                  Summary ready
                                </Badge>
                              )}
                              {uploadedFile.isAnalyzingImage && (
                                <Badge variant="secondary" className="flex items-center gap-1">
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  Analyzing image...
                                </Badge>
                              )}
                              {uploadedFile.imageAnalysis && (
                                <Badge variant="default" className="flex items-center gap-1 bg-blue-100 text-blue-800">
                                  <Eye className="h-3 w-3" />
                                  Image analyzed
                                </Badge>
                              )}
                              {uploadedFile.isAnalyzingStructure && (
                                <Badge variant="secondary" className="flex items-center gap-1">
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  Analyzing structure...
                                </Badge>
                              )}
                              {uploadedFile.documentStructure && (
                                <Badge
                                  variant="default"
                                  className="flex items-center gap-1 bg-green-100 text-green-800"
                                >
                                  <FileText className="h-3 w-3" />
                                  Structure analyzed
                                </Badge>
                              )}
                              {uploadedFile.isAnalyzingQuality && (
                                <Badge variant="secondary" className="flex items-center gap-1">
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  Analyzing quality...
                                </Badge>
                              )}
                              {uploadedFile.documentQuality && (
                                <Badge
                                  variant="default"
                                  className="flex items-center gap-1 bg-amber-100 text-amber-800"
                                >
                                  <Lightbulb className="h-3 w-3" />
                                  Quality analyzed
                                </Badge>
                              )}
                              {uploadedFile.isAnalyzingSpecialized && (
                                <Badge variant="secondary" className="flex items-center gap-1">
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  Specialized analysis...
                                </Badge>
                              )}
                              {uploadedFile.specializedAnalysis && (
                                <Badge
                                  variant="default"
                                  className="flex items-center gap-1 bg-indigo-100 text-indigo-800"
                                >
                                  <Zap className="h-3 w-3" />
                                  Specialized analysis
                                </Badge>
                              )}
                              {(uploadedFile.extractionError ||
                                uploadedFile.summaryError ||
                                uploadedFile.imageAnalysisError ||
                                uploadedFile.structureAnalysisError ||
                                uploadedFile.qualityAnalysisError ||
                                uploadedFile.specializedAnalysisError) && (
                                <Badge variant="destructive" className="flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" />
                                  Error
                                </Badge>
                              )}
                            </div>

                            {/* Extracted Text Preview */}
                            {uploadedFile.extractedText && (
                              <div className="mb-4 p-4 bg-slate-50 rounded-lg border">
                                <div className="flex items-center gap-2 mb-2">
                                  <BookOpen className="h-4 w-4 text-slate-600" />
                                  <span className="text-sm font-medium text-slate-700">Extracted Text</span>
                                </div>
                                <p className="text-sm text-slate-600 line-clamp-3">
                                  {uploadedFile.extractedText.text.substring(0, 300)}
                                  {uploadedFile.extractedText.text.length > 300 && "..."}
                                </p>
                              </div>
                            )}

                            {/* Generated Summary */}
                            {uploadedFile.generatedSummary && (
                              <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <Target className="h-4 w-4 text-purple-600" />
                                    <span className="text-sm font-medium text-purple-700">AI Summary</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">
                                      {uploadedFile.generatedSummary.summaryLength}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      {calculateCompressionRatio(
                                        uploadedFile.generatedSummary.originalWordCount,
                                        uploadedFile.generatedSummary.wordCount,
                                      )}
                                      % compression
                                    </Badge>
                                  </div>
                                </div>
                                <div className="space-y-3">
                                  <div>
                                    <h4 className="text-sm font-medium text-slate-700 mb-1">Summary:</h4>
                                    <p className="text-sm text-slate-600 leading-relaxed">
                                      {uploadedFile.generatedSummary.summary}
                                    </p>
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-medium text-slate-700 mb-1">Key Points:</h4>
                                    <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                                      {uploadedFile.generatedSummary.keyPoints}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Image Analysis Results */}
                            {uploadedFile.imageAnalysis && (
                              <div className="mt-4">
                                <ImageAnalysisCard
                                  analysis={uploadedFile.imageAnalysis}
                                  fileName={uploadedFile.file.name}
                                />
                              </div>
                            )}

                            {uploadedFile.isAnalyzingImage && (
                              <div className="mt-4">
                                <ImageAnalysisCard
                                  analysis={{} as ImageAnalysisResult}
                                  fileName={uploadedFile.file.name}
                                  isAnalyzing={true}
                                />
                              </div>
                            )}

                            {/* Document Structure Analysis Results */}
                            {uploadedFile.documentStructure && (
                              <div className="mt-4">
                                <DocumentStructureCard
                                  analysis={uploadedFile.documentStructure}
                                  fileName={uploadedFile.file.name}
                                />
                              </div>
                            )}

                            {uploadedFile.isAnalyzingStructure && (
                              <div className="mt-4">
                                <DocumentStructureCard
                                  analysis={{} as DocumentStructureAnalysis}
                                  fileName={uploadedFile.file.name}
                                  isAnalyzing={true}
                                />
                              </div>
                            )}

                            {/* Error Messages */}
                            {uploadedFile.extractionError && (
                              <div className="p-3 bg-red-50 rounded border border-red-200">
                                <p className="text-sm text-red-600">Extraction Error: {uploadedFile.extractionError}</p>
                              </div>
                            )}
                            {uploadedFile.summaryError && (
                              <div className="p-3 bg-red-50 rounded border border-red-200">
                                <p className="text-sm text-red-600">Summary Error: {uploadedFile.summaryError}</p>
                              </div>
                            )}
                            {uploadedFile.imageAnalysisError && (
                              <div className="p-3 bg-red-50 rounded border border-red-200">
                                <p className="text-sm text-red-600">
                                  Image Analysis Error: {uploadedFile.imageAnalysisError}
                                </p>
                              </div>
                            )}
                            {uploadedFile.structureAnalysisError && (
                              <div className="p-3 bg-red-50 rounded border border-red-200">
                                <p className="text-sm text-red-600">
                                  Structure Analysis Error: {uploadedFile.structureAnalysisError}
                                </p>
                              </div>
                            )}
                            {uploadedFile.qualityAnalysisError && (
                              <div className="p-3 bg-red-50 rounded border border-red-200">
                                <p className="text-sm text-red-600">
                                  Quality Analysis Error: {uploadedFile.qualityAnalysisError}
                                </p>
                              </div>
                            )}
                            {uploadedFile.specializedAnalysisError && (
                              <div className="p-3 bg-red-50 rounded border border-red-200">
                                <p className="text-sm text-red-600">
                                  Specialized Analysis Error: {uploadedFile.specializedAnalysisError}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 flex flex-col sm:flex-row justify-center gap-4">
                    <Button
                      size="lg"
                      onClick={runComprehensiveAnalysis}
                      disabled={isProcessing || uploadedFiles.length === 0}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Running Analysis...
                        </>
                      ) : (
                        <>
                          <Zap className="mr-2 h-4 w-4" />
                          Run Full Analysis
                        </>
                      )}
                    </Button>

                    {canExtractText && (
                      <Button
                        size="lg"
                        onClick={extractTextFromFiles}
                        disabled={isProcessing}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Extracting Text...
                          </>
                        ) : (
                          "Extract Text"
                        )}
                      </Button>
                    )}

                    {hasExtractedText && (
                      <div className="flex items-center gap-4">
                        <Select
                          value={summaryLength}
                          onValueChange={(value: "short" | "medium" | "long") => setSummaryLength(value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="short">Short</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="long">Long</SelectItem>
                          </SelectContent>
                        </Select>

                        <Button
                          size="lg"
                          onClick={generateSummaries}
                          disabled={isProcessing || !canGenerateSummaries}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="mr-2 h-4 w-4" />
                              Generate Summaries
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="dashboard">
            <AnalysisDashboard files={dashboardFiles} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
