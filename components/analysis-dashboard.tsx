"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BarChart3,
  FileText,
  ImageIcon,
  Zap,
  TrendingUp,
  Download,
  Share2,
  Filter,
  Grid3X3,
  List,
  Eye,
  Brain,
  Target,
} from "lucide-react"
import { ImageAnalysisCard } from "./image-analysis-card"
import { DocumentStructureCard } from "./document-structure-card"
import { DocumentQualityCard } from "./document-quality-card"
import { SpecializedAnalysisCard } from "./specialized-analysis-card"

interface AnalysisDashboardProps {
  files: Array<{
    id: string
    name: string
    type: "pdf" | "image"
    size: number
    extractedText?: any
    imageAnalysis?: any
    documentStructure?: any
    documentQuality?: any
    specializedAnalysis?: any
    generatedSummary?: any
  }>
}

export function AnalysisDashboard({ files }: AnalysisDashboardProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [filterType, setFilterType] = useState<"all" | "pdf" | "image">("all")
  const [sortBy, setSortBy] = useState<"name" | "size" | "type">("name")

  const filteredFiles = files.filter((file) => {
    if (filterType === "all") return true
    return file.type === filterType
  })

  const sortedFiles = [...filteredFiles].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name)
      case "size":
        return b.size - a.size
      case "type":
        return a.type.localeCompare(b.type)
      default:
        return 0
    }
  })

  const getAnalysisStats = () => {
    const stats = {
      totalFiles: files.length,
      pdfFiles: files.filter((f) => f.type === "pdf").length,
      imageFiles: files.filter((f) => f.type === "image").length,
      textExtracted: files.filter((f) => f.extractedText).length,
      imagesAnalyzed: files.filter((f) => f.imageAnalysis).length,
      structureAnalyzed: files.filter((f) => f.documentStructure).length,
      qualityAnalyzed: files.filter((f) => f.documentQuality).length,
      specializedAnalyzed: files.filter((f) => f.specializedAnalysis).length,
    }
    return stats
  }

  const stats = getAnalysisStats()

  const exportAllAnalyses = () => {
    const allAnalyses = files.map((file) => ({
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      extractedText: file.extractedText,
      imageAnalysis: file.imageAnalysis,
      documentStructure: file.documentStructure,
      documentQuality: file.documentQuality,
      specializedAnalysis: file.specializedAnalysis,
      summary: file.generatedSummary,
      exportTimestamp: new Date().toISOString(),
    }))

    const dataStr = JSON.stringify(allAnalyses, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `document-analysis-report-${new Date().toISOString().split("T")[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (files.length === 0) {
    return (
      <Card className="bg-white/50 backdrop-blur-sm">
        <CardContent className="p-8 text-center">
          <div className="space-y-4">
            <div className="p-4 bg-slate-100 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
              <BarChart3 className="h-8 w-8 text-slate-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">No Analysis Data</h3>
              <p className="text-slate-600">Upload and analyze documents to see your dashboard</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Analysis Dashboard
              </CardTitle>
              <CardDescription>Comprehensive overview of your document and image analysis results</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={exportAllAnalyses}>
                <Download className="h-4 w-4 mr-2" />
                Export All
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-lg border">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-slate-700">Total Files</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{stats.totalFiles}</p>
              <p className="text-xs text-slate-500">
                {stats.pdfFiles} PDFs, {stats.imageFiles} Images
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg border">
              <div className="flex items-center gap-2 mb-1">
                <Eye className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-slate-700">Text Extracted</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{stats.textExtracted}</p>
              <p className="text-xs text-slate-500">
                {Math.round((stats.textExtracted / stats.totalFiles) * 100)}% completion
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg border">
              <div className="flex items-center gap-2 mb-1">
                <Brain className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium text-slate-700">AI Analyzed</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{stats.imagesAnalyzed + stats.structureAnalyzed}</p>
              <p className="text-xs text-slate-500">
                {stats.imagesAnalyzed} images, {stats.structureAnalyzed} docs
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg border">
              <div className="flex items-center gap-2 mb-1">
                <Target className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium text-slate-700">Quality Scored</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{stats.qualityAnalyzed}</p>
              <p className="text-xs text-slate-500">
                {Math.round((stats.qualityAnalyzed / stats.totalFiles) * 100)}% completion
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <Card className="bg-white/50 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-600" />
                <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Files</SelectItem>
                    <SelectItem value="pdf">PDFs Only</SelectItem>
                    <SelectItem value="image">Images Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-slate-600" />
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">By Name</SelectItem>
                    <SelectItem value="size">By Size</SelectItem>
                    <SelectItem value="type">By Type</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      <div className="space-y-6">
        {sortedFiles.map((file) => (
          <Card key={file.id} className="bg-white/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {file.type === "pdf" ? (
                      <FileText className="h-5 w-5 text-red-600" />
                    ) : (
                      <ImageIcon className="h-5 w-5 text-blue-600" />
                    )}
                    {file.name}
                  </CardTitle>
                  <CardDescription>
                    {file.type.toUpperCase()} • {(file.size / 1024 / 1024).toFixed(2)} MB
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {file.extractedText && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Text Extracted
                    </Badge>
                  )}
                  {file.imageAnalysis && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      Image Analyzed
                    </Badge>
                  )}
                  {file.documentStructure && (
                    <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                      Structure Analyzed
                    </Badge>
                  )}
                  {file.documentQuality && (
                    <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                      Quality Scored
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="image" disabled={!file.imageAnalysis}>
                    Image Analysis
                  </TabsTrigger>
                  <TabsTrigger value="structure" disabled={!file.documentStructure}>
                    Structure
                  </TabsTrigger>
                  <TabsTrigger value="quality" disabled={!file.documentQuality}>
                    Quality
                  </TabsTrigger>
                  <TabsTrigger value="specialized" disabled={!file.specializedAnalysis}>
                    Specialized
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {file.extractedText && (
                      <div className="p-4 bg-white rounded-lg border">
                        <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Extracted Text
                        </h4>
                        <p className="text-sm text-slate-600 mb-2">
                          {file.extractedText.wordCount} words • {file.extractedText.characterCount} characters
                        </p>
                        <p className="text-sm text-slate-600 line-clamp-3">
                          {file.extractedText.text.substring(0, 200)}...
                        </p>
                      </div>
                    )}
                    {file.generatedSummary && (
                      <div className="p-4 bg-white rounded-lg border">
                        <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          AI Summary
                        </h4>
                        <p className="text-sm text-slate-600 mb-2">
                          {file.generatedSummary.summaryLength} • {file.generatedSummary.wordCount} words
                        </p>
                        <p className="text-sm text-slate-600 line-clamp-3">{file.generatedSummary.summary}</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="image" className="mt-4">
                  {file.imageAnalysis && <ImageAnalysisCard analysis={file.imageAnalysis} fileName={file.name} />}
                </TabsContent>

                <TabsContent value="structure" className="mt-4">
                  {file.documentStructure && (
                    <DocumentStructureCard analysis={file.documentStructure} fileName={file.name} />
                  )}
                </TabsContent>

                <TabsContent value="quality" className="mt-4">
                  {file.documentQuality && <DocumentQualityCard quality={file.documentQuality} fileName={file.name} />}
                </TabsContent>

                <TabsContent value="specialized" className="mt-4">
                  {file.specializedAnalysis && file.documentStructure && (
                    <SpecializedAnalysisCard
                      analysis={file.specializedAnalysis}
                      documentType={file.documentStructure.documentType}
                      fileName={file.name}
                    />
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
