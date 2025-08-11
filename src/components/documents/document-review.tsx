"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { File, Download, Eye, CheckCircle, XCircle, Clock, MessageSquare } from "lucide-react"
import { DocumentType, DocumentStatus } from "@prisma/client"

interface Document {
  id: string
  fileName: string
  fileType: string
  fileSize: number
  documentType: DocumentType
  status: DocumentStatus
  uploadedAt: Date
  notes?: string
  uploadedBy: {
    name: string
    email: string
  }
}

interface DocumentReviewProps {
  loanApplicationId: string
  onDocumentReviewed?: () => void
}

export function DocumentReview({ loanApplicationId, onDocumentReviewed }: DocumentReviewProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [reviewNotes, setReviewNotes] = useState("")
  const [reviewing, setReviewing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getStatusIcon = (status: DocumentStatus) => {
    switch (status) {
      case DocumentStatus.APPROVED:
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case DocumentStatus.REJECTED:
        return <XCircle className="h-4 w-4 text-red-600" />
      case DocumentStatus.PENDING:
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <File className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: DocumentStatus) => {
    switch (status) {
      case DocumentStatus.APPROVED:
        return "bg-green-100 text-green-800"
      case DocumentStatus.REJECTED:
        return "bg-red-100 text-red-800"
      case DocumentStatus.PENDING:
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
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

  const handlePreview = async (documentId: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}`)
      if (!response.ok) throw new Error("Failed to load document")
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      setPreviewUrl(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load document")
    }
  }

  const handleReview = async (status: DocumentStatus) => {
    if (!selectedDocument) return

    setReviewing(true)
    setError(null)

    try {
      const response = await fetch(`/api/documents/${selectedDocument.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          status,
          notes: reviewNotes
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update document status")
      }

      // Update documents list
      setDocuments(prev => prev.map(doc => 
        doc.id === selectedDocument.id 
          ? { ...doc, status, notes: reviewNotes }
          : doc
      ))

      // Reset review state
      setSelectedDocument(null)
      setReviewNotes("")
      onDocumentReviewed?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update document status")
    } finally {
      setReviewing(false)
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
  useState(() => {
    fetchDocuments()
  })

  const pendingDocuments = documents.filter(d => d.status === DocumentStatus.PENDING)
  const reviewedDocuments = documents.filter(d => d.status !== DocumentStatus.PENDING)

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Pending Documents */}
      {pendingDocuments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              Documents Pending Review ({pendingDocuments.length})
            </CardTitle>
            <CardDescription>
              Review and approve or reject pending documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingDocuments.map((document) => (
                <div key={document.id} className="flex items-center justify-between p-3 border rounded-lg bg-yellow-50">
                  <div className="flex items-center gap-3">
                    <File className="h-8 w-8 text-yellow-600" />
                    <div>
                      <p className="font-medium">{document.fileName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getStatusColor(document.status)}>
                          {getStatusIcon(document.status)}
                          <span className="ml-1">{document.status}</span>
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {formatFileSize(document.fileSize)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(document.uploadedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Uploaded by: {document.uploadedBy.name} ({document.uploadedBy.email})
                      </p>
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
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedDocument(document)
                            setReviewNotes(document.notes || "")
                          }}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Review Document</DialogTitle>
                          <DialogDescription>
                            Review {document.fileName} and provide your decision
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{document.fileName}</p>
                              <p className="text-sm text-gray-500">
                                {formatFileSize(document.fileSize)} • {document.documentType}
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              onClick={() => handlePreview(document.id)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Preview
                            </Button>
                          </div>
                          
                          <div>
                            <label className="text-sm font-medium mb-2 block">Review Notes</label>
                            <Textarea
                              value={reviewNotes}
                              onChange={(e) => setReviewNotes(e.target.value)}
                              placeholder="Add your review notes here..."
                              rows={4}
                            />
                          </div>
                          
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={() => setSelectedDocument(null)}
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => handleReview(DocumentStatus.REJECTED)}
                              disabled={reviewing}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              {reviewing ? "Rejecting..." : "Reject"}
                            </Button>
                            <Button
                              onClick={() => handleReview(DocumentStatus.APPROVED)}
                              disabled={reviewing}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              {reviewing ? "Approving..." : "Approve"}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviewed Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Reviewed Documents ({reviewedDocuments.length})
          </CardTitle>
          <CardDescription>
            All documents that have been reviewed
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reviewedDocuments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No documents reviewed yet</p>
          ) : (
            <div className="space-y-3">
              {reviewedDocuments.map((document) => (
                <div key={document.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <File className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="font-medium">{document.fileName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getStatusColor(document.status)}>
                          {getStatusIcon(document.status)}
                          <span className="ml-1">{document.status}</span>
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {formatFileSize(document.fileSize)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(document.uploadedAt).toLocaleDateString()}
                        </span>
                      </div>
                      {document.notes && (
                        <p className="text-sm text-gray-600 mt-1">
                          <strong>Notes:</strong> {document.notes}
                        </p>
                      )}
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Preview Modal */}
      {previewUrl && (
        <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Document Preview</DialogTitle>
            </DialogHeader>
            <div className="flex justify-center items-center h-96">
              <iframe
                src={previewUrl}
                className="w-full h-full border rounded"
                title="Document Preview"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}