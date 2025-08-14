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

interface SummaryDocumentUploadProps {
  loanApplicationId: string
  onDocumentsUploaded?: () => void
  onSubmitComplete?: () => void
}

export function SummaryDocumentUpload({ 
  loanApplicationId, 
  onDocumentsUploaded, 
  onSubmitComplete 
}: SummaryDocumentUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [documents, setDocuments] = useState<Document[]>([])
  const [error, setError] = useState<string | null>(null)
  const [selectedIdCardType, setSelectedIdCardType] = useState<IdCardType>(IdCardType.NATIONAL_ID)
  const [idCardFile, setIdCardFile] = useState<File | null>(null)
  const [proofOfFundsFile, setProofOfFundsFile] = useState<File | null>(null)
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

  const handleIdCardSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setIdCardFile(file)
    }
  }

  const handleProofOfFundsSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setProofOfFundsFile(file)
    }
  }

  const handleUploadDocuments = async () => {
    if (!idCardFile || !proofOfFundsFile) {
      setError("Please select both documents before uploading")
      return
    }

    setUploading(true)
    setUploadProgress(0)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("idCard", idCardFile)
      formData.append("proofOfFunds", proofOfFundsFile)
      formData.append("idCardType", selectedIdCardType)

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

      const response = await fetch(`/api/applications/${loanApplicationId}/documents`, {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to upload documents")
      }

      const result = await response.json()
      setDocuments(result.documents)
      onDocumentsUploaded?.()
      onSubmitComplete?.()
      
      // Reset file inputs
      setIdCardFile(null)
      setProofOfFundsFile(null)
      if (idCardInputRef.current) {
        idCardInputRef.current.value = ""
      }
      if (proofOfFundsInputRef.current) {
        proofOfFundsInputRef.current.value = ""
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload documents")
    } finally {
      setUploading(false)
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

      {/* Document Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Required Documents
          </CardTitle>
          <CardDescription>
            Upload both required documents to complete your loan application.
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">ID Card</label>
              <input
                ref={idCardInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleIdCardSelect}
                disabled={uploading || hasIdCard}
                className="hidden"
              />
              <Button
                onClick={() => idCardInputRef.current?.click()}
                disabled={uploading || hasIdCard}
                className="w-full"
                variant={idCardFile || hasIdCard ? "outline" : "default"}
              >
                <Upload className="h-4 w-4 mr-2" />
                {hasIdCard ? "ID Card Uploaded" : (idCardFile ? idCardFile.name : "Select ID Card")}
              </Button>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Proof of Funds</label>
              <input
                ref={proofOfFundsInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleProofOfFundsSelect}
                disabled={uploading || hasProofOfFunds}
                className="hidden"
              />
              <Button
                onClick={() => proofOfFundsInputRef.current?.click()}
                disabled={uploading || hasProofOfFunds}
                className="w-full"
                variant={proofOfFundsFile || hasProofOfFunds ? "outline" : "default"}
              >
                <Upload className="h-4 w-4 mr-2" />
                {hasProofOfFunds ? "Proof of Funds Uploaded" : (proofOfFundsFile ? proofOfFundsFile.name : "Select Proof of Funds")}
              </Button>
            </div>
          </div>

          {(idCardFile || proofOfFundsFile) && !canProceed && (
            <Button
              onClick={handleUploadDocuments}
              disabled={uploading || !idCardFile || !proofOfFundsFile}
              className="w-full"
              size="lg"
            >
              {uploading ? "Uploading Documents..." : "Upload Both Documents"}
            </Button>
          )}

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
      {documents.length > 0 && (
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