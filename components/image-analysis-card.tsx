"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, Palette, Type, Target, Download, Loader2 } from "lucide-react"
import { type ImageAnalysisResult, getAnalysisInsights } from "@/lib/image-analysis"

interface ImageAnalysisCardProps {
  analysis: ImageAnalysisResult
  fileName: string
  isAnalyzing?: boolean
}

export function ImageAnalysisCard({ analysis, fileName, isAnalyzing }: ImageAnalysisCardProps) {
  const insights = getAnalysisInsights(analysis)

  if (isAnalyzing) {
    return (
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <span className="text-blue-700 font-medium">Analyzing image...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-blue-600" />
          Image Analysis Results
        </CardTitle>
        <CardDescription>Comprehensive AI-powered image analysis for {fileName}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick Insights */}
        <div>
          <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
            <Target className="h-4 w-4" />
            Key Insights
          </h4>
          <div className="space-y-1">
            {insights.map((insight, index) => (
              <p key={index} className="text-sm text-slate-600">
                • {insight}
              </p>
            ))}
          </div>
        </div>

        {/* Object Detection */}
        {analysis.objectDetection.totalObjects > 0 && (
          <div>
            <h4 className="text-sm font-medium text-slate-700 mb-2">Object Detection</h4>
            <div className="flex flex-wrap gap-2">
              {analysis.objectDetection.objects.slice(0, 8).map((obj, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {obj.label} ({Math.round(obj.confidence)}%)
                </Badge>
              ))}
              {analysis.objectDetection.objects.length > 8 && (
                <Badge variant="secondary" className="text-xs">
                  +{analysis.objectDetection.objects.length - 8} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Scene Analysis */}
        <div>
          <h4 className="text-sm font-medium text-slate-700 mb-2">Scene Description</h4>
          <p className="text-sm text-slate-600 leading-relaxed">{analysis.sceneAnalysis.description}</p>
          {analysis.sceneAnalysis.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {analysis.sceneAnalysis.tags.slice(0, 6).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Text Analysis */}
        {analysis.textAnalysis.extractedText && (
          <div>
            <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <Type className="h-4 w-4" />
              Extracted Text
            </h4>
            <div className="p-3 bg-white rounded border text-sm text-slate-600 max-h-32 overflow-y-auto">
              {analysis.textAnalysis.extractedText}
            </div>
          </div>
        )}

        {/* Visual Features */}
        <div>
          <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Visual Features
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-500">Type:</span>
              <span className="ml-2 text-slate-700">{analysis.visualFeatures.imageType}</span>
            </div>
            <div>
              <span className="text-slate-500">Contains Text:</span>
              <span className="ml-2 text-slate-700">{analysis.visualFeatures.hasText ? "Yes" : "No"}</span>
            </div>
            {analysis.visualFeatures.dominantColors.length > 0 && (
              <div className="col-span-2">
                <span className="text-slate-500">Colors:</span>
                <div className="flex gap-1 mt-1">
                  {analysis.visualFeatures.dominantColors.slice(0, 5).map((color, index) => (
                    <div
                      key={index}
                      className="w-4 h-4 rounded border border-slate-300"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Export Button */}
        <div className="pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            className="w-full bg-transparent"
            onClick={() => {
              const dataStr = JSON.stringify(analysis, null, 2)
              const dataBlob = new Blob([dataStr], { type: "application/json" })
              const url = URL.createObjectURL(dataBlob)
              const link = document.createElement("a")
              link.href = url
              link.download = `${fileName}-analysis.json`
              link.click()
              URL.revokeObjectURL(url)
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Analysis
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
