import { type NextRequest, NextResponse } from "next/server"
import { generateObject } from "ai"
import { groq } from "@ai-sdk/groq"
import { z } from "zod"

const InvoiceAnalysisSchema = z.object({
  invoiceNumber: z.string(),
  totalAmount: z.number(),
  currency: z.string(),
  dueDate: z.string(),
  vendor: z.string(),
  lineItems: z.array(
    z.object({
      description: z.string(),
      quantity: z.number(),
      unitPrice: z.number(),
      total: z.number(),
    }),
  ),
})

const ContractAnalysisSchema = z.object({
  parties: z.array(z.string()),
  effectiveDate: z.string(),
  expirationDate: z.string(),
  keyTerms: z.array(z.string()),
  obligations: z.array(
    z.object({
      party: z.string(),
      obligation: z.string(),
    }),
  ),
})

const ResumeAnalysisSchema = z.object({
  candidateName: z.string(),
  contactInfo: z.object({
    email: z.string().optional(),
    phone: z.string().optional(),
    location: z.string().optional(),
  }),
  experience: z.array(
    z.object({
      company: z.string(),
      position: z.string(),
      duration: z.string(),
      responsibilities: z.array(z.string()),
    }),
  ),
  skills: z.array(z.string()),
  education: z.array(
    z.object({
      institution: z.string(),
      degree: z.string(),
      year: z.string(),
    }),
  ),
})

export async function POST(request: NextRequest) {
  try {
    const { text, documentType, fileName } = await request.json()

    if (!text || !documentType) {
      return NextResponse.json({ error: "Document text and type are required" }, { status: 400 })
    }

    const analysis: any = {}

    switch (documentType) {
      case "invoice":
        const { object: invoiceData } = await generateObject({
          model: groq("llama-3.1-70b-versatile"),
          schema: InvoiceAnalysisSchema,
          messages: [
            {
              role: "user",
              content: `Extract detailed invoice information from this document:

${text}

Extract:
- Invoice number
- Total amount (as number)
- Currency
- Due date
- Vendor name
- Line items with descriptions, quantities, unit prices, and totals

Be precise with numerical values and dates.`,
            },
          ],
        })
        analysis.invoice = invoiceData
        break

      case "contract":
        const { object: contractData } = await generateObject({
          model: groq("llama-3.1-70b-versatile"),
          schema: ContractAnalysisSchema,
          messages: [
            {
              role: "user",
              content: `Extract detailed contract information from this document:

${text}

Extract:
- All parties involved
- Effective date
- Expiration date
- Key terms and conditions
- Specific obligations for each party

Be thorough and accurate in identifying legal elements.`,
            },
          ],
        })
        analysis.contract = contractData
        break

      case "resume":
        const { object: resumeData } = await generateObject({
          model: groq("llama-3.1-70b-versatile"),
          schema: ResumeAnalysisSchema,
          messages: [
            {
              role: "user",
              content: `Extract detailed resume information from this document:

${text}

Extract:
- Candidate name
- Contact information (email, phone, location)
- Work experience with companies, positions, durations, and responsibilities
- Skills
- Education with institutions, degrees, and years

Be comprehensive in extracting professional information.`,
            },
          ],
        })
        analysis.resume = resumeData
        break

      default:
        return NextResponse.json({ error: "Unsupported document type for specialized analysis" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      analysis,
    })
  } catch (error) {
    console.error("Specialized document analysis error:", error)
    return NextResponse.json(
      {
        error: "Failed to perform specialized analysis. Please try again.",
      },
      { status: 500 },
    )
  }
}
