import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function FeeCollection() {
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch batches
  const { data: batches = [] } = useQuery({
    queryKey: ['/api/batches'],
  });

  // Fetch students in batch
  const { data: students = [] } = useQuery({
    queryKey: ['/api/batches/' + selectedBatch + '/students'],
    enabled: !!selectedBatch,
  });

  // Fetch fees for batch/month
  const { data: fees = [] } = useQuery({
    queryKey: ['/api/fees?batchId=' + selectedBatch + '&month=' + `${selectedYear}-${String(selectedMonth+1).padStart(2,'0')}`],
    enabled: !!selectedBatch,
  });

  // Local state for fee entry
  const [feeEntries, setFeeEntries] = useState<Record<string, number>>({});

  // Save fees mutation
  const saveFeesMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/fees/batch', data);
      if (!response.ok) throw new Error('Failed to save fees');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: '✅ Fees Saved', description: 'Monthly fees have been recorded.' });
      queryClient.invalidateQueries({ queryKey: ['/api/fees?batchId=' + selectedBatch + '&month=' + `${selectedYear}-${String(selectedMonth+1).padStart(2,'0')}`] });
    },
    onError: (error) => {
      toast({ title: '❌ Failed to Save Fees', description: 'Error saving fees. Please try again.', variant: 'destructive' });
      console.error('Error saving fees:', error);
    },
  });

  const handleFeeChange = (studentId: string, amount: number) => {
    setFeeEntries(prev => ({ ...prev, [studentId]: amount }));
  };

  const handleSaveFees = () => {
    const month = `${selectedYear}-${String(selectedMonth+1).padStart(2,'0')}`;
    const entries = students.map((student: any) => ({
      studentId: student.id,
      batchId: selectedBatch,
      month,
      amount: feeEntries[student.id] || 0,
      status: feeEntries[student.id] > 0 ? 'paid' : 'unpaid',
    }));
    saveFeesMutation.mutate({ batchId: selectedBatch, month, entries });
  };

  // Calculate total collection
  const totalCollection = fees.reduce((sum: number, fee: any) => sum + (fee.amount || 0), 0);

  return (
    <div className="max-w-5xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Fee Collection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <Select value={selectedBatch} onValueChange={setSelectedBatch}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select Batch" />
              </SelectTrigger>
              <SelectContent>
                {batches.map((batch: any) => (
                  <SelectItem key={batch.id} value={batch.id}>{batch.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={String(selectedYear)} onValueChange={v => setSelectedYear(Number(v))}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {[2024,2025,2026].map(y => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={String(selectedMonth)} onValueChange={v => setSelectedMonth(Number(v))}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {monthNames.map((m, i) => (
                  <SelectItem key={i} value={String(i)}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 text-left">Student Name</th>
                  <th className="p-2 text-left">Student ID</th>
                  <th className="p-2 text-left">Fee Amount</th>
                  <th className="p-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student: any) => {
                  const fee = fees.find((f: any) => f.studentId === student.id);
                  return (
                    <tr key={student.id} className="border-b">
                      <td className="p-2">{student.firstName} {student.lastName}</td>
                      <td className="p-2">{student.studentId}</td>
                      <td className="p-2">
                        <Input
                          type="number"
                          min="0"
                          value={feeEntries[student.id] ?? fee?.amount ?? ''}
                          onChange={e => handleFeeChange(student.id, parseInt(e.target.value) || 0)}
                          className="w-24"
                        />
                      </td>
                      <td className="p-2">
                        <Badge variant={fee?.status === 'paid' ? 'default' : 'outline'}>
                          {fee?.status === 'paid' ? 'Paid' : 'Unpaid'}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between items-center mt-6">
            <div>
              <span className="font-semibold">Total Collection:</span>
              <span className="ml-2 text-green-700">৳ {totalCollection}</span>
            </div>
            <Button onClick={handleSaveFees} disabled={saveFeesMutation.isPending || !selectedBatch} className="bg-blue-600 text-white">
              Save Monthly Fees
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
