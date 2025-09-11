"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Receipt,
  LucideContrast as FileContract,
  User,
  Building,
  Calendar,
  DollarSign,
  MapPin,
  Mail,
  Phone,
} from "lucide-react"
import type { SpecializedDocumentAnalysis } from "@/lib/advanced-document-analysis"

interface SpecializedAnalysisCardProps {
  analysis: SpecializedDocumentAnalysis
  documentType: string
  fileName: string
}

export function SpecializedAnalysisCard({ analysis, documentType, fileName }: SpecializedAnalysisCardProps) {
  const getDocumentIcon = () => {
    switch (documentType) {
      case "invoice":
        return <Receipt className="h-5 w-5 text-green-600" />
      case "contract":
        return <FileContract className="h-5 w-5 text-blue-600" />
      case "resume":
        return <User className="h-5 w-5 text-purple-600" />
      default:
        return <FileContract className="h-5 w-5 text-slate-600" />
    }
  }

  return (
    <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getDocumentIcon()}
          Specialized {documentType.charAt(0).toUpperCase() + documentType.slice(1)} Analysis
        </CardTitle>
        <CardDescription>Detailed extraction and analysis for {fileName}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Invoice Analysis */}
        {analysis.invoice && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-white rounded border">
                <div className="flex items-center gap-2 mb-1">
                  <Receipt className="h-4 w-4 text-slate-600" />
                  <span className="text-sm font-medium text-slate-700">Invoice Number</span>
                </div>
                <p className="text-sm text-slate-900 font-mono">{analysis.invoice.invoiceNumber}</p>
              </div>
              <div className="p-3 bg-white rounded border">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="h-4 w-4 text-slate-600" />
                  <span className="text-sm font-medium text-slate-700">Total Amount</span>
                </div>
                <p className="text-sm text-slate-900 font-mono">
                  {analysis.invoice.currency} {analysis.invoice.totalAmount.toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-white rounded border">
                <div className="flex items-center gap-2 mb-1">
                  <Building className="h-4 w-4 text-slate-600" />
                  <span className="text-sm font-medium text-slate-700">Vendor</span>
                </div>
                <p className="text-sm text-slate-900">{analysis.invoice.vendor}</p>
              </div>
              <div className="p-3 bg-white rounded border">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-4 w-4 text-slate-600" />
                  <span className="text-sm font-medium text-slate-700">Due Date</span>
                </div>
                <p className="text-sm text-slate-900">{analysis.invoice.dueDate}</p>
              </div>
            </div>

            {analysis.invoice.lineItems.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-2">Line Items</h4>
                <div className="space-y-2">
                  {analysis.invoice.lineItems.slice(0, 5).map((item, index) => (
                    <div key={index} className="p-2 bg-white rounded border">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-700">{item.description}</p>
                          <p className="text-xs text-slate-500">
                            Qty: {item.quantity} × {analysis.invoice?.currency} {item.unitPrice.toFixed(2)}
                          </p>
                        </div>
                        <p className="text-sm font-medium text-slate-900">
                          {analysis.invoice?.currency} {item.total.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {analysis.invoice.lineItems.length > 5 && (
                    <p className="text-xs text-slate-500">+{analysis.invoice.lineItems.length - 5} more items</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Contract Analysis */}
        {analysis.contract && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-white rounded border">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-4 w-4 text-slate-600" />
                  <span className="text-sm font-medium text-slate-700">Effective Date</span>
                </div>
                <p className="text-sm text-slate-900">{analysis.contract.effectiveDate}</p>
              </div>
              <div className="p-3 bg-white rounded border">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-4 w-4 text-slate-600" />
                  <span className="text-sm font-medium text-slate-700">Expiration Date</span>
                </div>
                <p className="text-sm text-slate-900">{analysis.contract.expirationDate}</p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-slate-700 mb-2">Parties</h4>
              <div className="flex flex-wrap gap-2">
                {analysis.contract.parties.map((party, index) => (
                  <Badge key={index} variant="outline">
                    {party}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-slate-700 mb-2">Key Terms</h4>
              <div className="space-y-1">
                {analysis.contract.keyTerms.slice(0, 5).map((term, index) => (
                  <p key={index} className="text-sm text-slate-600">
                    • {term}
                  </p>
                ))}
              </div>
            </div>

            {analysis.contract.obligations.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-2">Obligations</h4>
                <div className="space-y-2">
                  {analysis.contract.obligations.slice(0, 4).map((obligation, index) => (
                    <div key={index} className="p-2 bg-white rounded border">
                      <div className="flex items-start gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {obligation.party}
                        </Badge>
                        <p className="text-sm text-slate-600 flex-1">{obligation.obligation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Resume Analysis */}
        {analysis.resume && (
          <div className="space-y-4">
            <div className="p-3 bg-white rounded border">
              <h4 className="text-lg font-semibold text-slate-900 mb-2">{analysis.resume.candidateName}</h4>
              <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                {analysis.resume.contactInfo.email && (
                  <div className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {analysis.resume.contactInfo.email}
                  </div>
                )}
                {analysis.resume.contactInfo.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {analysis.resume.contactInfo.phone}
                  </div>
                )}
                {analysis.resume.contactInfo.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {analysis.resume.contactInfo.location}
                  </div>
                )}
              </div>
            </div>

            {analysis.resume.experience.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-2">Experience</h4>
                <div className="space-y-3">
                  {analysis.resume.experience.slice(0, 3).map((exp, index) => (
                    <div key={index} className="p-3 bg-white rounded border">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{exp.position}</p>
                          <p className="text-sm text-slate-600">{exp.company}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {exp.duration}
                        </Badge>
                      </div>
                      {exp.responsibilities.length > 0 && (
                        <div className="text-xs text-slate-600">
                          {exp.responsibilities.slice(0, 2).map((resp, idx) => (
                            <p key={idx}>• {resp}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analysis.resume.skills.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-2">Skills</h4>
                <div className="flex flex-wrap gap-1">
                  {analysis.resume.skills.slice(0, 12).map((skill, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {analysis.resume.skills.length > 12 && (
                    <Badge variant="outline" className="text-xs">
                      +{analysis.resume.skills.length - 12} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {analysis.resume.education.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-2">Education</h4>
                <div className="space-y-2">
                  {analysis.resume.education.map((edu, index) => (
                    <div key={index} className="p-2 bg-white rounded border">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-slate-700">{edu.degree}</p>
                          <p className="text-xs text-slate-600">{edu.institution}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {edu.year}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
