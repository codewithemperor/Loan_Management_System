"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, File, Download, Trash2, Eye, CheckCircle, XCircle, Clock } from "lucide-react"
import { DocumentType } from "@prisma/client"

interface Document {
  id: string
  fileName: string
  type: DocumentType
  fileSize: number
  filePath: string
  uploadedAt: string
}

interface DocumentUploadProps {
  loanApplicationId: string
  onDocumentUploaded?: () => void
  readOnly?: boolean
}

export function DocumentUpload({ loanApplicationId, onDocumentUploaded, readOnly = false }: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [documents, setDocuments] = useState<Document[]>([])
  const [error, setError] = useState<string | null>(null)
  const [selectedDocumentType, setSelectedDocumentType] = useState<DocumentType>(DocumentType.ID_CARD)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const documentTypes = [
    { type: DocumentType.ID_CARD, label: "ID Card" },
    { type: DocumentType.PASSPORT, label: "Passport" },
    { type: DocumentType.BANK_STATEMENT, label: "Bank Statement" },
    { type: DocumentType.PAY_SLIP, label: "Pay Slip" },
    { type: DocumentType.UTILITY_BILL, label: "Utility Bill" },
    { type: DocumentType.BUSINESS_REGISTRATION, label: "Business Registration" },
    { type: DocumentType.TAX_CLEARANCE, label: "Tax Clearance" },
    { type: DocumentType.COLLATERAL_DOCUMENT, label: "Collateral Document" },
    { type: DocumentType.OTHER, label: "Other Document" }
  ]

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getStatusIcon = (type: DocumentType) => {
    // For now, all documents are considered pending until reviewed
    return <Clock className="h-4 w-4 text-yellow-600" />
  }

  const getStatusColor = (type: DocumentType) => {
    // For now, all documents are considered pending until reviewed
    return "bg-yellow-100 text-yellow-800"
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    setUploadProgress(0)
    setError(null)

    try {
      // Create Cloudinary upload signature
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

      if (!cloudName || !uploadPreset) {
        throw new Error("Cloudinary configuration is missing")
      }

      const formData = new FormData()
      formData.append("file", file)
      formData.append("upload_preset", uploadPreset)
      formData.append("folder", "loan_documents")

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      // Upload to Cloudinary
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      )

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || "Failed to upload document")
      }

      const cloudinaryData = await response.json()

      // Save document metadata to database
      const dbResponse = await fetch("/api/documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          loanApplicationId,
          documentType: selectedDocumentType,
          fileName: file.name,
          filePath: cloudinaryData.secure_url,
          fileSize: file.size,
          mimeType: file.type,
          publicId: cloudinaryData.public_id
        })
      })

      if (!dbResponse.ok) {
        const errorData = await dbResponse.json()
        throw new Error(errorData.error || "Failed to save document metadata")
      }

      const result = await dbResponse.json()
      setDocuments(prev => [result.document, ...prev])
      onDocumentUploaded?.()
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload document")
    } finally {
      setUploading(false)
      setTimeout(() => setUploadProgress(0), 1000)
    }
  }

  const handleDownload = async (documentId: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}`)
      if (!response.ok) throw new Error("Failed to download document")
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = documents.find(d => d.id === documentId)?.fileName || "document"
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to download document")
    }
  }

  const handleDelete = async (documentId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE"
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete document")
      }

      setDocuments(prev => prev.filter(d => d.id !== documentId))
      onDocumentUploaded?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete document")
    }
  }

  const fetchDocuments = async () => {
    try {
      const response = await fetch(`/api/documents?loanApplicationId=${loanApplicationId}`)
      if (!response.ok) throw new Error("Failed to fetch documents")
      
      const docs = await response.json()
      setDocuments(docs)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch documents")
    }
  }

  // Fetch documents on component mount
  useEffect(() => {
    fetchDocuments()
  }, [loanApplicationId])

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!readOnly && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Document
            </CardTitle>
            <CardDescription>
              Upload required documents for your loan application. Supported formats: PDF, JPEG, PNG, DOC (Max 10MB)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Document Type</label>
              <select
                value={selectedDocumentType}
                onChange={(e) => setSelectedDocumentType(e.target.value as DocumentType)}
                className="w-full p-2 border rounded-md"
              >
                {documentTypes.map(({ type, label }) => (
                  <option key={type} value={type}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={handleFileSelect}
                disabled={uploading}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? "Uploading..." : "Select File"}
              </Button>
            </div>

            {uploading && (
              <div className="space-y-2">
                <Progress value={uploadProgress} className="w-full" />
                <p className="text-sm text-gray-600 text-center">
                  {uploadProgress < 100 ? "Uploading..." : "Processing..."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <File className="h-5 w-5" />
            Uploaded Documents
          </CardTitle>
          <CardDescription>
            View and manage all documents associated with this loan application
          </CardDescription>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No documents uploaded yet</p>
          ) : (
            <div className="space-y-3">
              {documents.map((document) => (
                <div key={document.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <File className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="font-medium">{document.fileName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getStatusColor(document.type)}>
                          {getStatusIcon(document.type)}
                          <span className="ml-1">{document.type.replace('_', ' ')}</span>
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {formatFileSize(document.fileSize)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(document.uploadedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(document.id)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    {!readOnly && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(document.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}