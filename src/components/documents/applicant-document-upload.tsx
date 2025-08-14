"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, File, Download, Trash2, Eye, CheckCircle, XCircle, Clock } from "lucide-react"
import { DocumentType, IdCardType } from "@prisma/client"

interface Document {
  id: string
  fileName: string
  type: DocumentType
  fileSize: number
  filePath: string
  uploadedAt: string
  idCardType?: IdCardType
}

interface ApplicantDocumentUploadProps {
  loanApplicationId: string
  onDocumentsUploaded?: () => void
  onStepComplete?: () => void
}

export function ApplicantDocumentUpload({ 
  loanApplicationId, 
  onDocumentsUploaded, 
  onStepComplete 
}: ApplicantDocumentUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [documents, setDocuments] = useState<Document[]>([])
  const [error, setError] = useState<string | null>(null)
  const [selectedIdCardType, setSelectedIdCardType] = useState<IdCardType>(IdCardType.NATIONAL_ID)
  const [isUploadingIdCard, setIsUploadingIdCard] = useState(false)
  const [isUploadingProofOfFunds, setIsUploadingProofOfFunds] = useState(false)
  const idCardInputRef = useRef<HTMLInputElement>(null)
  const proofOfFundsInputRef = useRef<HTMLInputElement>(null)

  const idCardTypes = [
    { type: IdCardType.NATIONAL_ID, label: "National ID Card" },
    { type: IdCardType.VOTERS_CARD, label: "Voters Card" },
    { type: IdCardType.INTERNATIONAL_PASSPORT, label: "International Passport" },
    { type: IdCardType.DRIVERS_LICENSE, label: "Driver's License" },
  ]

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getStatusIcon = (type: DocumentType) => {
    return <Clock className="h-4 w-4 text-yellow-600" />
  }

  const getStatusColor = (type: DocumentType) => {
    return "bg-yellow-100 text-yellow-800"
  }

  const handleIdCardUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploadingIdCard(true)
    setUploadProgress(0)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("documentType", "ID_CARD")
      formData.append("idCardType", selectedIdCardType)
      formData.append("loanApplicationId", loanApplicationId)

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

      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to upload ID card")
      }

      const result = await response.json()
      setDocuments(prev => [result.document, ...prev])
      onDocumentsUploaded?.()
      
      // Reset file input
      if (idCardInputRef.current) {
        idCardInputRef.current.value = ""
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload ID card")
    } finally {
      setIsUploadingIdCard(false)
      setTimeout(() => setUploadProgress(0), 1000)
    }
  }

  const handleProofOfFundsUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploadingProofOfFunds(true)
    setUploadProgress(0)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("documentType", "PROOF_OF_FUNDS")
      formData.append("loanApplicationId", loanApplicationId)

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

      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to upload proof of funds")
      }

      const result = await response.json()
      setDocuments(prev => [result.document, ...prev])
      onDocumentsUploaded?.()
      
      // Reset file input
      if (proofOfFundsInputRef.current) {
        proofOfFundsInputRef.current.value = ""
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload proof of funds")
    } finally {
      setIsUploadingProofOfFunds(false)
      setTimeout(() => setUploadProgress(0), 1000)
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
      onDocumentsUploaded?.()
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

  // Check if both required documents are uploaded
  const hasIdCard = documents.some(doc => doc.type === DocumentType.ID_CARD)
  const hasProofOfFunds = documents.some(doc => doc.type === DocumentType.PROOF_OF_FUNDS)
  const canProceed = hasIdCard && hasProofOfFunds

  // Fetch documents on component mount
  useState(() => {
    fetchDocuments()
  })

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* ID Card Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            ID Card Upload
          </CardTitle>
          <CardDescription>
            Upload a valid government-issued ID card for identification verification.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">ID Card Type</label>
            <Select value={selectedIdCardType} onValueChange={(value) => setSelectedIdCardType(value as IdCardType)}>
              <SelectTrigger>
                <SelectValue placeholder="Select ID card type" />
              </SelectTrigger>
              <SelectContent>
                {idCardTypes.map(({ type, label }) => (
                  <SelectItem key={type} value={type}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <input
              ref={idCardInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={handleIdCardUpload}
              disabled={isUploadingIdCard || hasIdCard}
              className="hidden"
            />
            <Button
              onClick={() => idCardInputRef.current?.click()}
              disabled={isUploadingIdCard || hasIdCard}
              className="w-full"
              variant={hasIdCard ? "outline" : "default"}
            >
              <Upload className="h-4 w-4 mr-2" />
              {hasIdCard ? "ID Card Uploaded" : (isUploadingIdCard ? "Uploading..." : "Select ID Card")}
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

      {/* Proof of Funds Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Proof of Funds
          </CardTitle>
          <CardDescription>
            Upload a recent bank statement or proof of income to verify your financial capacity.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <input
              ref={proofOfFundsInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleProofOfFundsUpload}
              disabled={isUploadingProofOfFunds || hasProofOfFunds}
              className="hidden"
            />
            <Button
              onClick={() => proofOfFundsInputRef.current?.click()}
              disabled={isUploadingProofOfFunds || hasProofOfFunds}
              className="w-full"
              variant={hasProofOfFunds ? "outline" : "default"}
            >
              <Upload className="h-4 w-4 mr-2" />
              {hasProofOfFunds ? "Proof of Funds Uploaded" : (isUploadingProofOfFunds ? "Uploading..." : "Select Proof of Funds")}
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

      {/* Uploaded Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <File className="h-5 w-5" />
            Uploaded Documents
          </CardTitle>
          <CardDescription>
            View and manage your uploaded documents
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
                          <span className="ml-1">
                            {document.type === DocumentType.ID_CARD && document.idCardType 
                              ? document.idCardType.replace('_', ' ') 
                              : document.type.replace('_', ' ')}
                          </span>
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
                      onClick={() => window.open(document.filePath, '_blank')}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(document.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Continue Button */}
      {canProceed && (
        <Card>
          <CardContent className="pt-6">
            <Button
              onClick={onStepComplete}
              className="w-full"
              size="lg"
            >
              Continue to Account Details
            </Button>
          </CardContent>
        </Card>
      )}

      {!canProceed && documents.length > 0 && (
        <Alert>
          <AlertDescription>
            Please upload both required documents (ID Card and Proof of Funds) to continue.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}