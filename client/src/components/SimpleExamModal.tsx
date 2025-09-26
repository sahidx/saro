import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Upload, Calendar, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

// Simplified exam schema - only essential fields
const examSchema = z.object({
  title: z.string().min(1, 'Exam title is required'),
  examDate: z.string().min(1, 'Exam date is required'),
  totalMarks: z.number().min(1, 'Total marks must be at least 1'),
  batchId: z.string().min(1, 'Please select a batch'),
  questionPaperImage: z.string().min(1, 'Question paper image is required'),
});

type ExamData = z.infer<typeof examSchema>;

interface SimpleExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingExam?: any;
}

export function SimpleExamModal({ isOpen, onClose, editingExam }: SimpleExamModalProps) {
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch batches
  const { data: batches = [] } = useQuery({
    queryKey: ['/api/batches'],
  });

  // Form setup
  const form = useForm<ExamData>({
    resolver: zodResolver(examSchema),
    defaultValues: {
      title: '',
      examDate: format(new Date(), 'yyyy-MM-dd'),
      totalMarks: 100,
      batchId: '',
      questionPaperImage: '',
    },
  });

  // Create exam mutation
  const createExamMutation = useMutation({
    mutationFn: async (data: ExamData) => {
      const response = await apiRequest('POST', '/api/exams', data);
      if (!response.ok) {
        throw new Error('Failed to create exam');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: '✅ Exam Created Successfully',
        description: 'The exam has been created and is now available for students.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/exams'] });
      form.reset();
      setImagePreview('');
      onClose();
    },
    onError: (error) => {
      toast({
        title: '❌ Failed to Create Exam',
        description: 'There was an error creating the exam. Please try again.',
        variant: 'destructive',
      });
      console.error('Error creating exam:', error);
    },
  });

  // Handle image upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: '❌ Invalid File Type',
        description: 'Please upload only image files (JPG, PNG, etc.)',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: '❌ File Too Large',
        description: 'Please upload an image smaller than 10MB',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload/question-paper', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      form.setValue('questionPaperImage', result.url);
      setImagePreview(result.url);

      toast({
        title: '✅ Image Uploaded',
        description: 'Question paper image uploaded successfully',
      });
    } catch (error) {
      toast({
        title: '❌ Upload Failed',
        description: 'Failed to upload image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = (data: ExamData) => {
    createExamMutation.mutate(data);
  };

  const handleClose = () => {
    form.reset();
    setImagePreview('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold flex items-center">
              <BookOpen className="w-6 h-6 mr-2 text-blue-600" />
              Create New Exam
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Exam Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">Exam Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Chapter 1 - Mathematics Test"
                      className="text-base"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Exam Date and Total Marks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="examDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">Exam Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        className="text-base"
                        {...field}
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
                    <FormLabel className="text-base font-medium">Total Marks</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="100"
                        className="text-base"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Select Batch */}
            <FormField
              control={form.control}
              name="batchId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">Select Batch</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="text-base">
                        <SelectValue placeholder="Choose a batch for this exam" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(batches as any[])?.map((batch: any) => (
                        <SelectItem key={batch.id} value={batch.id}>
                          {batch.name} - {batch.subject} ({batch.currentStudents} students)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Question Paper Upload */}
            <Card className="border-dashed border-2 border-gray-300">
              <CardHeader>
                <CardTitle className="text-base">Question Paper Image</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Question paper preview"
                        className="w-full max-w-md mx-auto rounded-lg border shadow-sm"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Change Image
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 space-y-3">
                      <Upload className="w-12 h-12 text-gray-400" />
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Upload question paper image</p>
                        <p className="text-xs text-gray-500">JPG, PNG, or PDF (Max 10MB)</p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {uploading ? 'Uploading...' : 'Choose File'}
                      </Button>
                    </div>
                  )}
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createExamMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {createExamMutation.isPending ? 'Creating...' : 'Create Exam'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}