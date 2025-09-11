"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, AlertTriangle, XCircle, Lightbulb } from "lucide-react"
import { type DocumentQualityMetrics, getQualityInsights } from "@/lib/advanced-document-analysis"

interface DocumentQualityCardProps {
  quality: DocumentQualityMetrics
  fileName: string
}

export function DocumentQualityCard({ quality, fileName }: DocumentQualityCardProps) {
  const insights = getQualityInsights(quality)

  const getQualityColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getQualityIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-4 w-4 text-green-600" />
    if (score >= 60) return <AlertTriangle className="h-4 w-4 text-yellow-600" />
    return <XCircle className="h-4 w-4 text-red-600" />
  }

  return (
    <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-amber-600" />
          Document Quality Analysis
        </CardTitle>
        <CardDescription>Quality assessment and improvement recommendations for {fileName}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Quality */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-slate-700">Overall Quality</h4>
            <Badge
              variant={
                quality.overallQuality === "excellent"
                  ? "default"
                  : quality.overallQuality === "good"
                    ? "secondary"
                    : quality.overallQuality === "fair"
                      ? "outline"
                      : "destructive"
              }
              className="capitalize"
            >
              {quality.overallQuality}
            </Badge>
          </div>
        </div>

        {/* Quality Metrics */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {getQualityIcon(quality.readabilityScore)}
                <span className="text-sm font-medium text-slate-700">Readability</span>
              </div>
              <span className={`text-sm font-medium ${getQualityColor(quality.readabilityScore)}`}>
                {Math.round(quality.readabilityScore)}%
              </span>
            </div>
            <Progress value={quality.readabilityScore} className="h-2" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {getQualityIcon(quality.structureScore)}
                <span className="text-sm font-medium text-slate-700">Structure</span>
              </div>
              <span className={`text-sm font-medium ${getQualityColor(quality.structureScore)}`}>
                {Math.round(quality.structureScore)}%
              </span>
            </div>
            <Progress value={quality.structureScore} className="h-2" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {getQualityIcon(quality.completenessScore)}
                <span className="text-sm font-medium text-slate-700">Completeness</span>
              </div>
              <span className={`text-sm font-medium ${getQualityColor(quality.completenessScore)}`}>
                {Math.round(quality.completenessScore)}%
              </span>
            </div>
            <Progress value={quality.completenessScore} className="h-2" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {getQualityIcon(quality.consistencyScore)}
                <span className="text-sm font-medium text-slate-700">Consistency</span>
              </div>
              <span className={`text-sm font-medium ${getQualityColor(quality.consistencyScore)}`}>
                {Math.round(quality.consistencyScore)}%
              </span>
            </div>
            <Progress value={quality.consistencyScore} className="h-2" />
          </div>
        </div>

        {/* Key Insights */}
        <div>
          <h4 className="text-sm font-medium text-slate-700 mb-2">Key Insights</h4>
          <div className="space-y-1">
            {insights.map((insight, index) => (
              <p key={index} className="text-sm text-slate-600">
                • {insight}
              </p>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        {quality.recommendations.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-slate-700 mb-2">Recommendations</h4>
            <div className="space-y-2">
              {quality.recommendations.map((recommendation, index) => (
                <div key={index} className="p-2 bg-white rounded border border-amber-200">
                  <p className="text-sm text-slate-600">{recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
