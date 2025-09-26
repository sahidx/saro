import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Super simple schema - only what's needed
const examSchema = z.object({
  title: z.string().min(1, 'Exam title is required'),
  examDate: z.string().min(1, 'Date is required'),
  batchId: z.string().min(1, 'Please select a batch'),
  totalMarks: z.number().min(1, 'Marks must be at least 1'),
  questionPicture: z.string().min(1, 'Please upload question picture'),
});

type SimpleExamData = z.infer<typeof examSchema>;

interface ExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingExam?: any;
}

export function ExamModal({ isOpen, onClose, editingExam }: ExamModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get batches for dropdown
  const { data: batches = [] } = useQuery({
    queryKey: ['/api/batches'],
  });

  const form = useForm<SimpleExamData>({
    resolver: zodResolver(examSchema),
    defaultValues: {
      title: '',
      examDate: '',
      batchId: '',
      totalMarks: 100,
      questionPicture: '',
    },
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (editingExam && isOpen) {
      const formatDateForInput = (dateString: string) => {
        try {
          const date = new Date(dateString);
          return date.toISOString().slice(0, 16);
        } catch {
          return '';
        }
      };

      form.reset({
        title: editingExam.title || '',
        examDate: editingExam.examDate ? formatDateForInput(editingExam.examDate) : '',
        batchId: editingExam.batchId || '',
        totalMarks: editingExam.totalMarks || 100,
        questionPicture: editingExam.questionContent || '',
      });
    } else if (!editingExam && isOpen) {
      form.reset({
        title: '',
        examDate: '',
        batchId: '',
        totalMarks: 100,
        questionPicture: '',
      });
    }
  }, [editingExam, isOpen, form]);

  const createExamMutation = useMutation({
    mutationFn: async (data: SimpleExamData) => {
      const payload = {
        title: data.title,
        examDate: new Date(data.examDate).toISOString(),
        batchId: data.batchId,
        totalMarks: data.totalMarks,
        questionContent: data.questionPicture,
        // Set defaults for required fields
        subject: 'math',
        duration: 90,
        examType: 'mcq',
        examMode: 'offline',
        questionSource: 'file_upload',
        instructions: '',
      };
      
      console.log('Creating simple exam:', payload);
      
      const method = editingExam ? 'PUT' : 'POST';
      const url = editingExam ? `/api/exams/${editingExam.id}` : '/api/exams';
      const response = await apiRequest(method, url, payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/exams'] });
      queryClient.invalidateQueries({ queryKey: ['/api/student/exams'] });
      
      toast({
        title: "✅ Success",
        description: editingExam ? "Exam updated!" : "Exam created successfully!",
      });
      form.reset();
      onClose();
    },
    onError: (error) => {
      toast({
        title: "❌ Error", 
        description: "Failed to save exam. Please try again.",
        variant: "destructive",
      });
      console.error('Error saving exam:', error);
    },
  });

  const onSubmit = (data: SimpleExamData) => {
    setIsSubmitting(true);
    createExamMutation.mutate(data);
    setIsSubmitting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {editingExam ? '✏️ Edit Exam' : '➕ Create New Exam'}
          </DialogTitle>
          <DialogDescription>
            Simple exam creation - just fill in the basics and upload question picture
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Exam Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">📝 Exam Title</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Example: Monthly Math Test - October 2025" 
                      {...field} 
                      className="text-base"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Date and Marks Row */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="examDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">📅 Date & Time</FormLabel>
                    <FormControl>
                      <Input 
                        type="datetime-local" 
                        {...field} 
                        className="text-base"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="totalMarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">💯 Total Marks</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="100"
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        className="text-base"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Batch Selection */}
            <FormField
              control={form.control}
              name="batchId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">👥 Select Batch</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="text-base">
                        <SelectValue placeholder="Choose which batch will take this exam" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="all">📚 All Batches</SelectItem>
                      {(batches as any[]).map((batch: any) => (
                        <SelectItem key={batch.id} value={batch.id}>
                          {batch.name} - {batch.batchCode}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Question Picture Upload */}
            <FormField
              control={form.control}
              name="questionPicture"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">📷 Question Picture</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Input 
                        type="file" 
                        accept="image/*,application/pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            // Check file size (5MB limit for images, 10MB for PDF)
                            const maxSize = file.type === 'application/pdf' ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
                            if (file.size > maxSize) {
                              const maxSizeMB = file.type === 'application/pdf' ? '10MB' : '5MB';
                              alert(`File too large! Please upload a ${file.type === 'application/pdf' ? 'PDF' : 'image'} smaller than ${maxSizeMB}`);
                              return;
                            }
                            
                            // Convert to base64
                            const reader = new FileReader();
                            reader.onload = () => {
                              const result = reader.result as string;
                              field.onChange(result);
                            };
                            reader.onerror = () => {
                              alert('Error reading file! Please try again');
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="text-base"
                      />
                      <p className="text-sm text-gray-600">
                        📝 Upload JPG, PNG or PDF file (max 5MB for images, 10MB for PDF)
                      </p>
                      {field.value && (
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                          <p className="text-sm text-green-700">✅ File uploaded successfully!</p>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Buttons */}
            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-sm text-gray-600">
                📱 SMS will be sent to batch students after exam is created
              </div>
              <div className="flex space-x-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose}
                  className="px-6"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting || createExamMutation.isPending}
                  className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white px-6"
                >
                  {isSubmitting || createExamMutation.isPending 
                    ? (editingExam ? 'Updating...' : 'Creating...') 
                    : (editingExam ? '💾 Update Exam' : '✨ Create Exam')}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}