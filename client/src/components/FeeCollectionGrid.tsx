/**
 * Enhanced Fee Collection Grid Component
 * Shows months as columns and students as rows for easier fee management
 */

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  CalendarDays, Users, DollarSign, Download, FileSpreadsheet, 
  CheckCircle, XCircle, Clock, Eye, Edit, Plus 
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  studentId?: string;
}

interface FeeRecord {
  id: string;
  studentId: string;
  month: string; // '2025-01'
  amount: number;
  amountPaid: number;
  status: 'paid' | 'unpaid' | 'partial';
  dueDate: string;
}

interface Batch {
  id: string;
  name: string;
  classLevel: string;
}

interface FeeGridData {
  [studentId: string]: {
    [month: string]: FeeRecord | null;
  };
}

export default function FeeCollectionGrid() {
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [feeGridData, setFeeGridData] = useState<FeeGridData>({});
  const [paymentDialog, setPaymentDialog] = useState<{
    open: boolean;
    feeRecord: FeeRecord | null;
    studentName: string;
  }>({
    open: false,
    feeRecord: null,
    studentName: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Generate months for the selected year
  const months = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    return {
      key: `${selectedYear}-${String(month).padStart(2, '0')}`,
      label: new Date(selectedYear, i).toLocaleString('default', { month: 'short' }),
      fullLabel: new Date(selectedYear, i).toLocaleString('default', { month: 'long' })
    };
  });

  // Fetch batches
  const { data: batches = [] } = useQuery<Batch[]>({
    queryKey: ['/api/batches'],
  });

  // Fetch students in selected batch
  const { data: students = [] } = useQuery<Student[]>({
    queryKey: [`/api/batches/${selectedBatch}/students`],
    enabled: !!selectedBatch,
  });

  // Fetch fee records for the year
  const { data: feeRecords = [], refetch: refetchFees } = useQuery<FeeRecord[]>({
    queryKey: [`/api/fees/batch-year/${selectedBatch}/${selectedYear}`],
    enabled: !!selectedBatch,
  });

  // Build grid data when records or students change
  useEffect(() => {
    const gridData: FeeGridData = {};
    
    students.forEach(student => {
      gridData[student.id] = {};
      months.forEach(month => {
        const feeRecord = feeRecords.find(
          record => record.studentId === student.id && record.month === month.key
        );
        gridData[student.id][month.key] = feeRecord || null;
      });
    });
    
    setFeeGridData(gridData);
  }, [students, feeRecords, months]);

  // Create monthly fees mutation
  const createMonthlyFeesMutation = useMutation({
    mutationFn: async ({ batchId, month }: { batchId: string; month: string }) => {
      const response = await apiRequest('POST', `/api/fee-management/batches/${batchId}/create-monthly-fees`, {
        monthYear: month
      });
      if (!response.ok) throw new Error('Failed to create monthly fees');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "✅ Monthly Fees Created",
        description: "Fee records have been generated for all students",
      });
      refetchFees();
    },
    onError: (error: any) => {
      toast({
        title: "❌ Failed to Create Fees",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  // Record payment mutation
  const recordPaymentMutation = useMutation({
    mutationFn: async ({ feeId, amount, paymentMethod, remarks }: {
      feeId: string;
      amount: number;
      paymentMethod: string;
      remarks?: string;
    }) => {
      const response = await apiRequest('POST', `/api/fee-management/fees/${feeId}/payment`, {
        amount,
        paymentMethod: paymentMethod || 'cash',
        remarks
      });
      if (!response.ok) throw new Error('Failed to record payment');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "✅ Payment Recorded",
        description: "Fee payment has been successfully recorded",
      });
      setPaymentDialog({ open: false, feeRecord: null, studentName: '' });
      refetchFees();
    },
    onError: (error: any) => {
      toast({
        title: "❌ Payment Failed",
        description: error.message || "Failed to record payment",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'partial': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'unpaid': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getStatusIcon = (status: string | undefined) => {
    switch (status) {
      case 'paid': return <CheckCircle className="h-3 w-3" />;
      case 'partial': return <Clock className="h-3 w-3" />;
      case 'unpaid': return <XCircle className="h-3 w-3" />;
      default: return null;
    }
  };

  const createMonthlyFees = (month: string) => {
    if (!selectedBatch) {
      toast({
        title: "No Batch Selected",
        description: "Please select a batch first",
        variant: "destructive",
      });
      return;
    }
    createMonthlyFeesMutation.mutate({ batchId: selectedBatch, month });
  };

  const openPaymentDialog = (feeRecord: FeeRecord, studentName: string) => {
    setPaymentDialog({
      open: true,
      feeRecord,
      studentName
    });
  };

  const handlePaymentSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const amount = parseFloat(formData.get('amount') as string);
    const paymentMethod = formData.get('paymentMethod') as string;
    const remarks = formData.get('remarks') as string;

    if (!paymentDialog.feeRecord) return;

    recordPaymentMutation.mutate({
      feeId: paymentDialog.feeRecord.id,
      amount,
      paymentMethod,
      remarks
    });
  };

  // Export to Excel
  const exportToExcel = () => {
    if (students.length === 0) {
      toast({
        title: "No Data",
        description: "No students found to export",
        variant: "destructive",
      });
      return;
    }

    const exportData = students.map(student => {
      const row: any = {
        'Student Name': `${student.firstName} ${student.lastName}`,
        'Student ID': student.studentId || '',
        'Phone': student.phoneNumber || ''
      };
      
      months.forEach(month => {
        const feeRecord = feeGridData[student.id]?.[month.key];
        if (feeRecord) {
          row[`${month.label} Amount`] = feeRecord.amount;
          row[`${month.label} Paid`] = feeRecord.amountPaid;
          row[`${month.label} Status`] = feeRecord.status;
        } else {
          row[`${month.label} Amount`] = 0;
          row[`${month.label} Paid`] = 0;
          row[`${month.label} Status`] = 'Not Created';
        }
      });

      return row;
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Fee Collection');
    
    const batchName = batches.find(b => b.id === selectedBatch)?.name || 'Batch';
    XLSX.writeFile(wb, `Fee_Collection_${batchName}_${selectedYear}.xlsx`);
    
    toast({
      title: "✅ Excel Downloaded",
      description: "Fee collection data has been exported to Excel",
    });
  };

  // Calculate statistics
  const stats = React.useMemo(() => {
    let totalAmount = 0;
    let totalPaid = 0;
    let totalRecords = 0;
    let paidRecords = 0;

    Object.values(feeGridData).forEach(studentData => {
      Object.values(studentData).forEach(feeRecord => {
        if (feeRecord) {
          totalAmount += feeRecord.amount;
          totalPaid += feeRecord.amountPaid;
          totalRecords++;
          if (feeRecord.status === 'paid') paidRecords++;
        }
      });
    });

    return {
      totalAmount,
      totalPaid,
      pending: totalAmount - totalPaid,
      collectionRate: totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0,
      totalRecords,
      paidRecords
    };
  }, [feeGridData]);

  const selectedBatchName = batches.find(b => b.id === selectedBatch)?.name || '';

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">💰 Fee Collection Grid</h1>
          <p className="text-gray-600 mt-2">
            Manage student fees with month-wise view for easy tracking
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={exportToExcel}
            disabled={!selectedBatch}
            className="text-green-600 border-green-600 hover:bg-green-50"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CalendarDays className="h-5 w-5" />
            <span>Batch & Year Selection</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Batch
              </label>
              <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                <SelectTrigger>
                  <SelectValue placeholder="Select batch" />
                </SelectTrigger>
                <SelectContent>
                  {batches.map((batch) => (
                    <SelectItem key={batch.id} value={batch.id}>
                      {batch.name} - Class {batch.classLevel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Year
              </label>
              <Select 
                value={selectedYear.toString()} 
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026].map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      {selectedBatch && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Amount</p>
                  <p className="text-2xl font-bold text-gray-900">৳{stats.totalAmount.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Collected</p>
                  <p className="text-2xl font-bold text-green-600">৳{stats.totalPaid.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-orange-600">৳{stats.pending.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Collection Rate</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.collectionRate.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Fee Grid */}
      {selectedBatch && students.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Fee Collection Grid - {selectedBatchName} ({selectedYear})</span>
              <Badge variant="outline" className="text-blue-600">
                <Users className="h-3 w-3 mr-1" />
                {students.length} Students
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-4 py-3 text-left font-semibold sticky left-0 bg-gray-50">
                      Student
                    </th>
                    {months.map((month) => (
                      <th key={month.key} className="border border-gray-200 px-3 py-3 text-center font-semibold min-w-[120px]">
                        <div className="space-y-1">
                          <div>{month.label}</div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => createMonthlyFees(month.key)}
                            className="text-xs h-6 px-2"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Create
                          </Button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="border border-gray-200 px-4 py-3 sticky left-0 bg-white">
                        <div className="font-medium">
                          {student.firstName} {student.lastName}
                        </div>
                        <div className="text-sm text-gray-600">
                          ID: {student.studentId || 'N/A'}
                        </div>
                      </td>
                      {months.map((month) => {
                        const feeRecord = feeGridData[student.id]?.[month.key];
                        return (
                          <td key={month.key} className="border border-gray-200 px-3 py-3 text-center">
                            {feeRecord ? (
                              <div className="space-y-2">
                                <Badge 
                                  className={getStatusColor(feeRecord.status)}
                                  variant="outline"
                                >
                                  {getStatusIcon(feeRecord.status)}
                                  <span className="ml-1">{feeRecord.status}</span>
                                </Badge>
                                <div className="text-xs">
                                  <div>৳{feeRecord.amount}</div>
                                  <div className="text-green-600">Paid: ৳{feeRecord.amountPaid}</div>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openPaymentDialog(feeRecord, `${student.firstName} ${student.lastName}`)}
                                  className="text-xs h-6 px-2 text-blue-600 border-blue-600"
                                >
                                  <Edit className="h-3 w-3 mr-1" />
                                  Pay
                                </Button>
                              </div>
                            ) : (
                              <div className="text-gray-400 text-xs">
                                No record
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Dialog */}
      <Dialog open={paymentDialog.open} onOpenChange={(open) => setPaymentDialog(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Fee Payment</DialogTitle>
          </DialogHeader>
          {paymentDialog.feeRecord && (
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Student: {paymentDialog.studentName}
                </label>
                <div className="text-sm text-gray-600">
                  Month: {paymentDialog.feeRecord.month} | Fee Amount: ৳{paymentDialog.feeRecord.amount}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Amount
                </label>
                <Input
                  name="amount"
                  type="number"
                  max={paymentDialog.feeRecord.amount - paymentDialog.feeRecord.amountPaid}
                  defaultValue={paymentDialog.feeRecord.amount - paymentDialog.feeRecord.amountPaid}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <Select name="paymentMethod" defaultValue="cash">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                    <SelectItem value="online">Online Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Remarks (Optional)
                </label>
                <Input name="remarks" placeholder="Any additional notes" />
              </div>

              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setPaymentDialog(prev => ({ ...prev, open: false }))}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={recordPaymentMutation.isPending}>
                  {recordPaymentMutation.isPending ? 'Recording...' : 'Record Payment'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}