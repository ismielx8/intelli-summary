# 📄 Document & Image Analyzer

🔗 **Live Demo:** [https://v0-document-and-image-analyzer.vercel.app/](https://v0-document-and-image-analyzer.vercel.app/)

A powerful **AI-powered web application** that analyzes documents and images to extract meaningful insights.  
Built with **Next.js**, **TypeScript**, and the **Vercel AI SDK**.

![Document & Image Analyzer](https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop&crop=center)

---

## ✨ Features

### 🔍 Multi-Format Analysis
- **Images**: JPEG, PNG, WebP, GIF  
- **Documents**: PDF, TXT  
- Drag-and-drop file upload with live preview  
- File size validation (max **10MB**)

### 🤖 AI-Powered Intelligence
- **Multi-Model Fallback System**: Claude Sonnet 4, GPT-5, Groq  
- **Structured Data Extraction**: Titles, summaries, key points, entities (people, organizations, locations, dates)  
- **Smart Analysis**: Adapts the approach based on content type  
- **Confidence Scoring**: Reliability metrics for all outputs

### 🛡️ Robust Error Handling
- Graceful fallback between AI models  
- Comprehensive file validation  
- Real-time error feedback with toast notifications  
- Processing time tracking for transparency

### 🎨 Modern UI/UX
- Clean, responsive interface built with **Tailwind CSS**  
- Real-time upload progress and analysis status  
- Interactive drag-and-drop experience  
- Dark/Light mode support via **shadcn/ui**

---

## 🧠 Tech Stack

| Category | Technologies |
|----------|---------------|
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS v4 |
| **UI Components** | shadcn/ui |
| **AI Integration** | Vercel AI SDK v5 |
| **Schema Validation** | Zod |
| **Icons** | Lucide React |

---

## ⚙️ Getting Started

### ✅ Prerequisites
- **Node.js** v18+  
- **npm** or **yarn**  
- **Vercel account** (recommended for AI model access)

---

### 📦 Installation

```bash
# Clone the repository
git clone https://github.com/your-username/document-image-analyzer.git

# Navigate to the project directory
cd document-image-analyzer

# Install dependencies
npm install
