'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Search, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  Filter,
  Download,
  X
} from 'lucide-react'
import { HKIEntry, JENIS_HKI_OPTIONS, STATUS_OPTIONS } from '@/lib/types'
import { toast } from 'sonner'

interface DataTableProps {
  data: HKIEntry[]
  totalCount: number
  currentPage: number
  pageSize: number
}

export function DataTable({ data, totalCount, currentPage, pageSize }: DataTableProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [jenisFilter, setJenisFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [yearFilter, setYearFilter] = useState<string>('')
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const totalPages = Math.ceil(totalCount / pageSize)

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (searchTerm) params.set('search', searchTerm)
    if (jenisFilter) params.set('jenis', jenisFilter)
    if (statusFilter) params.set('status', statusFilter)
    if (yearFilter) params.set('year', yearFilter)
    params.set('page', '1')
    
    router.push(`/hki?${params.toString()}`)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setJenisFilter('')
    setStatusFilter('')
    setYearFilter('')
    router.push('/hki')
  }

  const handleDelete = async (id: string) => {
    setIsDeleting(id)
    try {
      const response = await fetch(`/api/hki/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete entry')
      }

      toast.success('HKI entry deleted successfully')
      router.refresh()
    } catch (error) {
      toast.error('Failed to delete HKI entry')
    } finally {
      setIsDeleting(null)
    }
  }

  const handleDownloadPDF = async (id: string, namaHki: string) => {
    try {
      const response = await fetch(`/api/hki/${id}/signed-url`)
      const data = await response.json()
      
      if (data.signedUrl) {
        window.open(data.signedUrl, '_blank')
      } else {
        toast.error('No certificate file available')
      }
    } catch (error) {
      toast.error('Failed to generate download link')
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      'Diterima': 'bg-green-50 text-green-700 border-green-200',
      'Didaftar': 'bg-blue-50 text-blue-700 border-blue-200',
      'Ditolak': 'bg-red-50 text-red-700 border-red-200',
      'Dalam Proses': 'bg-yellow-50 text-yellow-700 border-yellow-200'
    }
    return variants[status as keyof typeof variants] || 'bg-gray-50 text-gray-700 border-gray-200'
  }

  const getJenisBadge = (jenis: string) => {
    const variants = {
      'Merek': 'bg-purple-50 text-purple-700 border-purple-200',
      'Hak Cipta': 'bg-indigo-50 text-indigo-700 border-indigo-200',
      'Paten': 'bg-orange-50 text-orange-700 border-orange-200',
      'Paten Sederhana': 'bg-amber-50 text-amber-700 border-amber-200',
      'Indikasi Geografis': 'bg-teal-50 text-teal-700 border-teal-200'
    }
    return variants[jenis as keyof typeof variants] || 'bg-gray-50 text-gray-700 border-gray-200'
  }

  // Get unique years from data for filter
  const years = [...new Set(data.map(item => item.fasilitasi_tahun))].sort((a, b) => b - a)

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Search & Filter
            </CardTitle>
            <Button onClick={() => router.push('/hki/create')} className="gap-2">
              <Plus className="h-4 w-4" />
              Add New HKI
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <Input
                placeholder="Search by nama HKI or pemohon..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full"
              />
            </div>
            
            <Select value={jenisFilter} onValueChange={setJenisFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by jenis" />
              </SelectTrigger>
              <SelectContent>
                {JENIS_HKI_OPTIONS.map((jenis) => (
                  <SelectItem key={jenis} value={jenis}>
                    {jenis}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2 mt-4">
            <Button onClick={handleSearch} className="gap-2">
              <Search className="h-4 w-4" />
              Search
            </Button>
            <Button variant="outline" onClick={clearFilters} className="gap-2">
              <X className="h-4 w-4" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>HKI Entries ({totalCount} total)</CardTitle>
        </CardHeader>
        <CardContent>
          {data.length > 0 ? (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama HKI</TableHead>
                      <TableHead>Jenis</TableHead>
                      <TableHead>Pemohon</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tahun</TableHead>
                      <TableHead>Tanggal Permohonan</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((entry) => (
                      <TableRow key={entry.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">
                          {entry.nama_hki}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={getJenisBadge(entry.jenis_hki)}
                          >
                            {entry.jenis_hki}
                          </Badge>
                        </TableCell>
                        <TableCell>{entry.nama_pemohon}</TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={getStatusBadge(entry.status)}
                          >
                            {entry.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{entry.fasilitasi_tahun}</TableCell>
                        <TableCell>
                          {new Date(entry.tanggal_permohonan).toLocaleDateString('id-ID')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/hki/${entry.id}/view`)}
                              className="gap-1"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/hki/${entry.id}/edit`)}
                              className="gap-1"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {entry.sertifikat_path && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownloadPDF(entry.id, entry.nama_hki)}
                                className="gap-1"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete HKI Entry</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{entry.nama_hki}"? 
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(entry.id)}
                                    disabled={isDeleting === entry.id}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    {isDeleting === entry.id ? 'Deleting...' : 'Delete'}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-gray-600">
                    Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} entries
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage <= 1}
                      onClick={() => {
                        const params = new URLSearchParams(window.location.search)
                        params.set('page', (currentPage - 1).toString())
                        router.push(`/hki?${params.toString()}`)
                      }}
                    >
                      Previous
                    </Button>
                    <span className="flex items-center px-3 text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage >= totalPages}
                      onClick={() => {
                        const params = new URLSearchParams(window.location.search)
                        params.set('page', (currentPage + 1).toString())
                        router.push(`/hki?${params.toString()}`)
                      }}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No HKI entries found
              </h3>
              <p className="text-gray-600 mb-4">
                Start by creating your first HKI entry
              </p>
              <Button onClick={() => router.push('/hki/create')}>
                <Plus className="h-4 w-4 mr-2" />
                Add New HKI Entry
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}