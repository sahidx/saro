// Fee Collection Management Dashboard
// Professional fee tracking system for teachers

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, Clock, DollarSign, Users, FileDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FeeReport {
  studentId: string;
  studentName: string;
  studentPhone: string;
  batchName: string;
  totalDue: number;
  totalPaid: number;
  remainingBalance: number;
}

interface MonthlyReport {
  month: string;
  batchId: string;
  batchName: string;
  totalStudents: number;
  expectedAmount: number;
  collectedAmount: number;
  pendingAmount: number;
  collectionRate: number;
}

interface CollectionStats {
  totalFees: number;
  totalExpected: number;
  totalCollected: number;
  paidFees: number;
  pendingFees: number;
  partialFees: number;
  collectionRate: number;
}

interface BatchSettings {
  monthlyFee: number;
  admissionFee: number;
  otherFees: number;
  dueDay: number;
}

interface Batch {
  id: string;
  name: string;
  batchCode: string;
  subject: string;
}

interface FeeManagementProps {
  isDarkMode: boolean;
}

const FeeManagement: React.FC<FeeManagementProps> = ({ isDarkMode }) => {
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM format
  const [batches, setBatches] = useState<Batch[]>([]);
  const [feeReports, setFeeReports] = useState<FeeReport[]>([]);
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null);
  const [stats, setStats] = useState<CollectionStats | null>(null);
  const [batchSettings, setBatchSettings] = useState<BatchSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const { toast } = useToast();

  // Form states
  const [paymentDialog, setPaymentDialog] = useState<{ open: boolean; feeId: string; studentName: string }>({
    open: false,
    feeId: '',
    studentName: ''
  });
  const [settingsDialog, setSettingsDialog] = useState(false);

  useEffect(() => {
    fetchBatches();
    fetchStats();
  }, []);

  useEffect(() => {
    if (selectedBatch) {
      fetchBatchSettings();
      fetchFeeReports();
      fetchMonthlyReport();
    }
  }, [selectedBatch, selectedMonth]);

  const fetchBatches = async () => {
    try {
      const response = await fetch('/api/batches');
      const data = await response.json();
      setBatches(data.batches || []);
      if (data.batches?.length > 0) {
        setSelectedBatch(data.batches[0].id);
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
      setError('Failed to load batches');
    }
  };

  const fetchBatchSettings = async () => {
    if (!selectedBatch) return;
    try {
      const response = await fetch(`/api/fee-management/batches/${selectedBatch}/settings`);
      if (response.ok) {
        const data = await response.json();
        setBatchSettings(data);
      } else {
        setBatchSettings(null);
      }
    } catch (error) {
      console.error('Error fetching batch settings:', error);
    }
  };

  const fetchFeeReports = async () => {
    if (!selectedBatch) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/fee-management/reports/students?batchId=${selectedBatch}`);
      const data = await response.json();
      if (data.success) {
        setFeeReports(data.reports);
      }
    } catch (error) {
      console.error('Error fetching fee reports:', error);
      setError('Failed to load fee reports');
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyReport = async () => {
    if (!selectedBatch || !selectedMonth) return;
    try {
      const response = await fetch(`/api/fee-management/reports/monthly/${selectedBatch}/${selectedMonth}`);
      const data = await response.json();
      if (data.success) {
        setMonthlyReport(data.report);
      }
    } catch (error) {
      console.error('Error fetching monthly report:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/fee-management/stats${selectedBatch ? `?batchId=${selectedBatch}` : ''}`);
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const createMonthlyFees = async () => {
    if (!selectedBatch || !selectedMonth) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/fee-management/batches/${selectedBatch}/create-monthly-fees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthYear: selectedMonth })
      });
      const data = await response.json();
      if (data.success) {
        alert(`✅ Created ${data.feesCreated} fee records for ${selectedMonth}`);
        fetchFeeReports();
        fetchMonthlyReport();
        fetchStats();
      } else {
        alert(`❌ Failed: ${data.message}`);
      }
    } catch (error) {
      console.error('Error creating monthly fees:', error);
      alert('❌ Failed to create monthly fees');
    } finally {
      setLoading(false);
    }
  };

  const saveBatchSettings = async (formData: FormData) => {
    if (!selectedBatch) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/fee-management/batches/${selectedBatch}/settings`, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      if (data.success) {
        setBatchSettings(data.settings);
        setSettingsDialog(false);
        alert('✅ Batch settings saved successfully');
      } else {
        alert(`❌ Failed: ${data.message}`);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('❌ Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    if (!selectedBatch || !selectedMonth) {
      toast({
        title: "Selection Required",
        description: "Please select both batch and month before exporting",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/fee-collection/export-excel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          batchId: selectedBatch,
          month: selectedMonth
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Fee_Report_${selectedBatch}_${selectedMonth}_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "Export Successful",
          description: "Excel file has been downloaded successfully",
          variant: "default",
        });
      } else {
        throw new Error('Failed to export Excel file');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Error exporting Excel file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const recordPayment = async (formData: FormData) => {
    if (!paymentDialog.feeId) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/fee-management/fees/${paymentDialog.feeId}/payment`, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      if (data.success) {
        setPaymentDialog({ open: false, feeId: '', studentName: '' });
        alert('✅ Payment recorded successfully');
        fetchFeeReports();
        fetchMonthlyReport();
        fetchStats();
      } else {
        alert(`❌ Failed: ${data.message}`);
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      alert('❌ Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (balance: number) => {
    if (balance <= 0) return 'bg-green-100 text-green-800';
    if (balance > 0) return 'bg-red-100 text-red-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  const formatCurrency = (amount: number) => `৳${amount.toLocaleString()}`;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fee Collection Management</h1>
          <p className="text-gray-600">Professional fee tracking and collection system</p>
        </div>
        <Button onClick={() => window.location.reload()} variant="outline">
          Refresh Data
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-700">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Batch & Month Selection</CardTitle>
          <CardDescription>Select batch and month to manage fees</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="batch-select">Select Batch</Label>
              <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose batch..." />
                </SelectTrigger>
                <SelectContent>
                  {batches.map((batch) => (
                    <SelectItem key={batch.id} value={batch.id}>
                      {batch.name} ({batch.batchCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="month-select">Select Month</Label>
              <Input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              />
            </div>
            <div className="flex items-end space-x-2">
              <Button onClick={createMonthlyFees} disabled={loading || !selectedBatch}>
                Create Monthly Fees
              </Button>
              <Dialog open={settingsDialog} onOpenChange={setSettingsDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" disabled={!selectedBatch}>
                    Batch Settings
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Batch Fee Settings</DialogTitle>
                    <DialogDescription>Configure monthly fees and due dates</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    saveBatchSettings(new FormData(e.currentTarget));
                  }}>
                    <div className="space-y-4">
                      <div>
                        <Label>Monthly Fee (৳)</Label>
                        <Input name="monthlyFee" type="number" defaultValue={batchSettings?.monthlyFee || 1000} required />
                      </div>
                      <div>
                        <Label>Admission Fee (৳)</Label>
                        <Input name="admissionFee" type="number" defaultValue={batchSettings?.admissionFee || 0} />
                      </div>
                      <div>
                        <Label>Other Fees (৳)</Label>
                        <Input name="otherFees" type="number" defaultValue={batchSettings?.otherFees || 0} />
                      </div>
                      <div>
                        <Label>Due Day (1-31)</Label>
                        <Input name="dueDay" type="number" min="1" max="31" defaultValue={batchSettings?.dueDay || 10} required />
                      </div>
                    </div>
                    <DialogFooter className="mt-4">
                      <Button type="submit">Save Settings</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Expected</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.totalExpected)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Collected</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalCollected)}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Collection Rate</p>
                  <p className="text-2xl font-bold">{stats.collectionRate}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Fees</p>
                  <p className="text-2xl font-bold text-red-600">{stats.pendingFees}</p>
                </div>
                <Clock className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Fee Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Student Fee Reports</span>
            <Button variant="outline" size="sm" onClick={handleExportExcel}>
              <FileDown className="mr-2 h-4 w-4" />
              Export Excel
            </Button>
          </CardTitle>
          <CardDescription>
            Comprehensive fee tracking for {selectedBatch ? batches.find(b => b.id === selectedBatch)?.name : 'all batches'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading fee reports...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Total Due</TableHead>
                  <TableHead>Total Paid</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feeReports.map((report) => (
                  <TableRow key={report.studentId}>
                    <TableCell className="font-medium">{report.studentName}</TableCell>
                    <TableCell>{report.studentPhone}</TableCell>
                    <TableCell>{report.batchName}</TableCell>
                    <TableCell>{formatCurrency(report.totalDue)}</TableCell>
                    <TableCell className="text-green-600">{formatCurrency(report.totalPaid)}</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(report.remainingBalance)}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(report.remainingBalance)}>
                        {report.remainingBalance <= 0 ? 'Paid' : 'Pending'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {report.remainingBalance > 0 && (
                        <Button
                          size="sm"
                          onClick={() => setPaymentDialog({
                            open: true,
                            feeId: report.studentId, // This should be the actual fee ID in real implementation
                            studentName: report.studentName
                          })}
                        >
                          Record Payment
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {feeReports.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No fee records found. Create monthly fees to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Payment Recording Dialog */}
      <Dialog open={paymentDialog.open} onOpenChange={(open) => setPaymentDialog(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Recording payment for: {paymentDialog.studentName}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            recordPayment(new FormData(e.currentTarget));
          }}>
            <div className="space-y-4">
              <div>
                <Label>Amount (৳)</Label>
                <Input name="amount" type="number" min="1" required />
              </div>
              <div>
                <Label>Payment Method</Label>
                <Select name="paymentMethod" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select method..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                    <SelectItem value="online">Online Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Transaction ID (Optional)</Label>
                <Input name="transactionId" placeholder="For bank/online payments" />
              </div>
              <div>
                <Label>Remarks (Optional)</Label>
                <Input name="remarks" placeholder="Additional notes" />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setPaymentDialog({ open: false, feeId: '', studentName: '' })}>
                Cancel
              </Button>
              <Button type="submit">Record Payment</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FeeManagement;