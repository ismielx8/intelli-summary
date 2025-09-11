"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  FileText,
  Users,
  MapPin,
  Calendar,
  DollarSign,
  Mail,
  Phone,
  Download,
  Loader2,
  Table,
  Hash,
} from "lucide-react"
import { type DocumentStructureAnalysis, getDocumentInsights } from "@/lib/image-analysis"

interface DocumentStructureCardProps {
  analysis: DocumentStructureAnalysis
  fileName: string
  isAnalyzing?: boolean
}

export function DocumentStructureCard({ analysis, fileName, isAnalyzing }: DocumentStructureCardProps) {
  const insights = getDocumentInsights(analysis)

  const getEntityIcon = (type: string) => {
    switch (type) {
      case "person":
        return <Users className="h-3 w-3" />
      case "organization":
        return <Users className="h-3 w-3" />
      case "location":
        return <MapPin className="h-3 w-3" />
      case "date":
        return <Calendar className="h-3 w-3" />
      case "money":
        return <DollarSign className="h-3 w-3" />
      case "email":
        return <Mail className="h-3 w-3" />
      case "phone":
        return <Phone className="h-3 w-3" />
      default:
        return <Hash className="h-3 w-3" />
    }
  }

  if (isAnalyzing) {
    return (
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-green-600" />
            <span className="text-green-700 font-medium">Analyzing document structure...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-green-600" />
          Document Structure Analysis
        </CardTitle>
        <CardDescription>AI-powered document understanding for {fileName}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick Insights */}
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

        {/* Document Classification */}
        <div>
          <h4 className="text-sm font-medium text-slate-700 mb-2">Document Type</h4>
          <Badge variant="default" className="bg-green-100 text-green-800">
            {analysis.documentType} ({Math.round(analysis.confidence)}% confidence)
          </Badge>
        </div>

        {/* Document Structure */}
        {analysis.structure.sections.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-slate-700 mb-2">Document Sections</h4>
            <div className="space-y-2">
              {analysis.structure.sections.slice(0, 5).map((section, index) => (
                <div key={index} className="p-2 bg-white rounded border">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      {section.type}
                    </Badge>
                    <span className="text-sm font-medium text-slate-700">{section.title}</span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2">{section.content}</p>
                </div>
              ))}
              {analysis.structure.sections.length > 5 && (
                <p className="text-xs text-slate-500">+{analysis.structure.sections.length - 5} more sections</p>
              )}
            </div>
          </div>
        )}

        {/* Tables */}
        {analysis.structure.tables.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <Table className="h-4 w-4" />
              Tables Found ({analysis.structure.tables.length})
            </h4>
            <div className="space-y-2">
              {analysis.structure.tables.map((table, index) => (
                <div key={index} className="p-2 bg-white rounded border">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      {table.headers.length} columns × {table.rows.length} rows
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {Math.round(table.confidence)}% confidence
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600">Headers: {table.headers.join(", ")}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Key-Value Pairs */}
        {analysis.structure.keyValuePairs.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-slate-700 mb-2">Key Information</h4>
            <div className="grid grid-cols-1 gap-2">
              {analysis.structure.keyValuePairs.slice(0, 6).map((pair, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-white rounded border text-sm">
                  <span className="text-slate-600 font-medium">{pair.key}:</span>
                  <span className="text-slate-800">{pair.value}</span>
                </div>
              ))}
              {analysis.structure.keyValuePairs.length > 6 && (
                <p className="text-xs text-slate-500">+{analysis.structure.keyValuePairs.length - 6} more pairs</p>
              )}
            </div>
          </div>
        )}

        {/* Entities */}
        {analysis.entities.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-slate-700 mb-2">Identified Entities</h4>
            <div className="space-y-2">
              {analysis.entities.slice(0, 8).map((entity, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-white rounded border">
                  {getEntityIcon(entity.type)}
                  <span className="text-sm text-slate-700">{entity.value}</span>
                  <Badge variant="outline" className="text-xs ml-auto">
                    {entity.type} ({Math.round(entity.confidence)}%)
                  </Badge>
                </div>
              ))}
              {analysis.entities.length > 8 && (
                <p className="text-xs text-slate-500">+{analysis.entities.length - 8} more entities</p>
              )}
            </div>
          </div>
        )}

        {/* Sentiment */}
        {analysis.sentiment && (
          <div>
            <h4 className="text-sm font-medium text-slate-700 mb-2">Sentiment Analysis</h4>
            <Badge
              variant={
                analysis.sentiment.overall === "positive"
                  ? "default"
                  : analysis.sentiment.overall === "negative"
                    ? "destructive"
                    : "secondary"
              }
              className="capitalize"
            >
              {analysis.sentiment.overall} ({Math.round(analysis.sentiment.confidence)}% confidence)
            </Badge>
          </div>
        )}

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
              link.download = `${fileName}-structure-analysis.json`
              link.click()
              URL.revokeObjectURL(url)
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Structure Analysis
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
