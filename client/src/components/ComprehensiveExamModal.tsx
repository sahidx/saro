import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Upload, Link, Image, Plus, Trash2, BookOpen, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { ALL_SUBJECTS, ALL_CLASSES, getSubjectsByClass, getClassesBySubject } from '@/../../shared/educationSystem';

// Schema for regular exam
const regularExamSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  subject: z.enum(ALL_SUBJECTS.map(s => s.id) as [string, ...string[]]),
  targetClass: z.enum(ALL_CLASSES.map(c => c.id) as [string, ...string[]]),
  chapter: z.string().optional(),
  duration: z.number().min(1, 'Duration must be at least 1 minute'),
  examType: z.enum(['written', 'practical', 'mixed']),
  batchId: z.string().optional(),
  questionPaperImage: z.string().min(1, 'Question paper image is required'),
  totalMarks: z.number().min(1, 'Total marks must be at least 1'),
  instructions: z.string().optional(),
});

type RegularExamData = z.infer<typeof regularExamSchema>;

interface Question {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
  marks: number;
}

interface ComprehensiveExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingExam?: any;
}

export function ComprehensiveExamModal({ isOpen, onClose, editingExam }: ComprehensiveExamModalProps) {
  const [examMode, setExamMode] = useState<'regular'>('regular');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch batches
  const { data: batches = [] } = useQuery({
    queryKey: ['/api/batches'],
  });

  // Form for online exams
  const onlineForm = useForm<OnlineExamData>({
    resolver: zodResolver(onlineExamSchema),
    defaultValues: {
      title: '',
      subject: 'science',
      targetClass: '9-10',
      chapter: '',
      examDate: '',
      duration: 30,
      batchId: '',
      instructions: '',
      questions: [],
    },
  });

  // Form for regular exams
  const regularForm = useForm<RegularExamData>({
    resolver: zodResolver(regularExamSchema),
    defaultValues: {
      title: '',
      subject: 'science',
      targetClass: '9-10',
      chapter: '',
      duration: 90,
      examType: 'written',
      batchId: '',
      questionPaperImage: '',
      totalMarks: 100,
      instructions: '',
    },
  });

  // Initialize default question
  useEffect(() => {
    if (questions.length === 0 && examMode === 'online') {
      addQuestion();
    }
  }, [examMode]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen && !editingExam) {
      onlineForm.reset();
      regularForm.reset();
      setQuestions([]);
      setExamMode('online');
    }
  }, [isOpen, editingExam]);

  const addQuestion = () => {
    const newQuestion: Question = {
      questionText: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctAnswer: 'A',
      explanation: '',
      marks: 1,
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const updatedQuestions = [...questions];
    (updatedQuestions[index] as any)[field] = value;
    setQuestions(updatedQuestions);
  };

  // Create online exam mutation
  const createOnlineExamMutation = useMutation({
    mutationFn: async (data: OnlineExamData & { questions: Question[] }) => {
      const payload = {
        title: data.title,
        subject: data.subject,
        targetClass: data.targetClass,
        chapter: data.chapter,
        examDate: new Date(data.examDate).toISOString(),
        duration: data.duration,
        batchId: data.batchId || null,
        instructions: data.instructions || '',
        questions: data.questions,
      };
      
      const response = await apiRequest('POST', '/api/online-exams', payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/exams'] });
      queryClient.invalidateQueries({ queryKey: ['/api/student/online-exams'] });
      toast({
        title: "Success",
        description: "Online MCQ exam created successfully!",
      });
      onlineForm.reset();
      setQuestions([]);
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create online exam. Please try again.",
        variant: "destructive",
      });
      console.error('Error creating online exam:', error);
    },
  });

  // Create regular exam mutation
  const createRegularExamMutation = useMutation({
    mutationFn: async (data: RegularExamData) => {
      const payload = {
        title: data.title,
        subject: data.subject,
        targetClass: data.targetClass,
        chapter: data.chapter,
        duration: data.duration,
        examType: data.examType,
        examMode: 'regular',
        batchId: data.batchId || null,
        questionPaperImage: data.questionPaperImage,
        totalMarks: data.totalMarks,
        instructions: data.instructions || '',
      };
      
      const response = await apiRequest('POST', '/api/exams', payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/exams'] });
      queryClient.invalidateQueries({ queryKey: ['/api/student/exams'] });
      toast({
        title: "Success",
        description: "Regular exam created successfully!",
      });
      regularForm.reset();
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create regular exam. Please try again.",
        variant: "destructive",
      });
      console.error('Error creating regular exam:', error);
    },
  });

  const onSubmitOnline = (data: OnlineExamData) => {
    if (questions.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one question.",
        variant: "destructive",
      });
      return;
    }

    // Validate questions
    const invalidQuestions = questions.some(q => 
      !q.questionText || !q.optionA || !q.optionB || !q.optionC || !q.optionD
    );
    
    if (invalidQuestions) {
      toast({
        title: "Error",
        description: "Please fill in all question fields.",
        variant: "destructive",
      });
      return;
    }

    createOnlineExamMutation.mutate({ ...data, questions });
  };

  const onSubmitRegular = (data: RegularExamData) => {
    createRegularExamMutation.mutate(data);
  };

  const totalMarksOnline = questions.reduce((sum, q) => sum + q.marks, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Create New Exam - Science & Math Care
          </DialogTitle>
          <DialogDescription>
            Create online MCQ exams with automatic grading or regular exams with manual grading.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={examMode} onValueChange={(value) => setExamMode(value as 'online' | 'regular')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="online" className="flex items-center gap-2">
              📱 Online MCQ Exam
            </TabsTrigger>
            <TabsTrigger value="regular" className="flex items-center gap-2">
              📝 Regular Exam
            </TabsTrigger>
          </TabsList>

          {/* Online MCQ Exam Tab */}
          <TabsContent value="online" className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Online MCQ Exam Features:</h3>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>✅ Automatic grading and instant results</li>
                <li>✅ Timer-based exam with auto-submission</li>
                <li>✅ Multiple choice questions (A, B, C, D)</li>
                <li>✅ Question-by-question navigation</li>
                <li>✅ Immediate score and grade calculation</li>
              </ul>
            </div>

            <Form {...onlineForm}>
              <form onSubmit={onlineForm.handleSubmit(onSubmitOnline)} className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={onlineForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Exam Title *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Chapter 1 MCQ Test" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={onlineForm.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ALL_SUBJECTS.map((subject) => (
                              <SelectItem key={subject.id} value={subject.id}>
                                {subject.icon} {subject.nameBangla} ({subject.name})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={onlineForm.control}
                    name="targetClass"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Class *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ALL_CLASSES.map((classInfo) => (
                              <SelectItem key={classInfo.id} value={classInfo.id}>
                                {classInfo.nameBangla} ({classInfo.name})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <FormField
                    control={onlineForm.control}
                    name="chapter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Chapter (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., রসায়নের ধারণা" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={onlineForm.control}
                    name="examDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Exam Date & Time *</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={onlineForm.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (minutes) *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="30"
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={onlineForm.control}
                    name="batchId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Batch</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="All Batches" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">All Batches</SelectItem>
                            {(batches as any[]).map((batch: any) => (
                              <SelectItem key={batch.id} value={batch.id}>
                                {batch.name} - {batch.subject}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={onlineForm.control}
                  name="instructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instructions (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter instructions for students..." 
                          rows={2}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Questions Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Questions ({questions.length})</h3>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline">Total Marks: {totalMarksOnline}</Badge>
                      <Button
                        type="button"
                        onClick={addQuestion}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Question
                      </Button>
                    </div>
                  </div>

                  {questions.map((question, index) => (
                    <Card key={index}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">Question {index + 1}</CardTitle>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              placeholder="Marks"
                              value={question.marks}
                              onChange={(e) => updateQuestion(index, 'marks', parseInt(e.target.value) || 1)}
                              className="w-20"
                              min="1"
                            />
                            {questions.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeQuestion(index)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <Textarea
                          placeholder="Enter question text..."
                          value={question.questionText}
                          onChange={(e) => updateQuestion(index, 'questionText', e.target.value)}
                          rows={3}
                        />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <Input
                            placeholder="Option A"
                            value={question.optionA}
                            onChange={(e) => updateQuestion(index, 'optionA', e.target.value)}
                          />
                          <Input
                            placeholder="Option B"
                            value={question.optionB}
                            onChange={(e) => updateQuestion(index, 'optionB', e.target.value)}
                          />
                          <Input
                            placeholder="Option C"
                            value={question.optionC}
                            onChange={(e) => updateQuestion(index, 'optionC', e.target.value)}
                          />
                          <Input
                            placeholder="Option D"
                            value={question.optionD}
                            onChange={(e) => updateQuestion(index, 'optionD', e.target.value)}
                          />
                        </div>

                        <div className="flex items-center gap-4">
                          <Label>Correct Answer:</Label>
                          <RadioGroup
                            value={question.correctAnswer}
                            onValueChange={(value) => updateQuestion(index, 'correctAnswer', value as 'A' | 'B' | 'C' | 'D')}
                            className="flex space-x-4"
                          >
                            {['A', 'B', 'C', 'D'].map((option) => (
                              <div key={option} className="flex items-center space-x-2">
                                <RadioGroupItem value={option} id={`${index}-${option}`} />
                                <Label htmlFor={`${index}-${option}`}>{option}</Label>
                              </div>
                            ))}
                          </RadioGroup>
                        </div>

                        <Textarea
                          placeholder="Explanation (optional)"
                          value={question.explanation}
                          onChange={(e) => updateQuestion(index, 'explanation', e.target.value)}
                          rows={2}
                        />
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="flex justify-end space-x-4 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createOnlineExamMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {createOnlineExamMutation.isPending ? 'Creating...' : 'Create Online Exam'}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>

          {/* Regular Exam Tab */}
          <TabsContent value="regular" className="space-y-6">
            <div className="bg-orange-50 p-4 rounded-lg">
              <h3 className="font-semibold text-orange-800 mb-2">Regular Exam Features:</h3>
              <ul className="text-orange-700 text-sm space-y-1">
                <li>📝 Traditional written/practical exams</li>
                <li>👨‍🏫 Manual grading by teachers</li>
                <li>📄 Question paper upload (PDF/Image/Drive link)</li>
                <li>🎯 Flexible exam types (written, practical, mixed)</li>
                <li>📊 Manual marks entry and feedback</li>
              </ul>
            </div>

            <Form {...regularForm}>
              <form onSubmit={regularForm.handleSubmit(onSubmitRegular)} className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={regularForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Exam Title *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., মধ্যবর্তী পরীক্ষা" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={regularForm.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ALL_SUBJECTS.map((subject) => (
                              <SelectItem key={subject.id} value={subject.id}>
                                {subject.icon} {subject.nameBangla} ({subject.name})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={regularForm.control}
                    name="targetClass"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Class *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ALL_CLASSES.map((classInfo) => (
                              <SelectItem key={classInfo.id} value={classInfo.id}>
                                {classInfo.nameBangla} ({classInfo.name})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <FormField
                    control={regularForm.control}
                    name="chapter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Chapter (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., জৈব রসায়ন" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />


                  <FormField
                    control={regularForm.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (minutes) *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="90"
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={regularForm.control}
                    name="totalMarks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Marks *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="100"
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={regularForm.control}
                    name="batchId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Batch</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="All Batches" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">All Batches</SelectItem>
                            {(batches as any[]).map((batch: any) => (
                              <SelectItem key={batch.id} value={batch.id}>
                                {batch.name} - {batch.subject}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Exam Type */}
                <FormField
                  control={regularForm.control}
                  name="examType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exam Type *</FormLabel>
                      <FormControl>
                        <RadioGroup 
                          onValueChange={field.onChange} 
                          value={field.value} 
                          className="flex space-x-6"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="written" id="written" />
                            <Label htmlFor="written">📝 Written Exam</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="practical" id="practical" />
                            <Label htmlFor="practical">🔬 Practical Exam</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="mixed" id="mixed" />
                            <Label htmlFor="mixed">📋 Mixed (Theory + Practical)</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Question Paper Image Upload */}
                <FormField
                  control={regularForm.control}
                  name="questionPaperImage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Upload Question Paper Image (PNG/JPG) *</FormLabel>
                      <FormControl>
                        <Input 
                          type="file" 
                          accept=".png,.jpg,.jpeg"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              // File size check (5MB max for images)
                              const maxSize = 5 * 1024 * 1024;
                              if (file.size > maxSize) {
                                toast({
                                  title: "File too large!",
                                  description: "Please upload an image smaller than 5MB",
                                  variant: "destructive",
                                });
                                return;
                              }
                              
                              // Convert to base64
                              const reader = new FileReader();
                              reader.onload = () => {
                                const result = reader.result as string;
                                field.onChange(result);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                      {field.value && (
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                          ✓ Question paper image uploaded successfully
                        </div>
                      )}
                    </FormItem>
                  )}
                />

                <FormField
                  control={regularForm.control}
                  name="instructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exam Instructions (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter special instructions for students..." 
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-4 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createRegularExamMutation.isPending}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    {createRegularExamMutation.isPending ? 'Creating...' : 'Create Regular Exam'}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
