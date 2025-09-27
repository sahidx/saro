import React, { useState } from 'react';
import { ArrowLeft, Users, Plus, Search, Phone, Eye, EyeOff, Edit2, Trash2, Key, GraduationCap, Clock, Monitor, Beaker, ArrowRightLeft } from 'lucide-react';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';

// Student form validation schema
const studentFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phoneNumber: z.string().min(10, "Valid phone number required"),
  parentPhoneNumber: z.string().min(10, "Valid parent phone number required"),
  batchId: z.string().min(1, "Please select a batch"),
  institution: z.string().min(1, "Institution is required"),
  classLevel: z.string().min(1, "Please select class level"),
  password: z.string().min(4, "Password must be at least 4 characters").optional().or(z.literal("")).nullable(),
});

interface AddStudentFormProps {
  isDarkMode: boolean;
  onSubmit: (data: any) => void;
  batches: any[];
  isLoading: boolean;
}

interface CreateBatchFormProps {
  isDarkMode: boolean;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}

function CreateBatchForm({ isDarkMode, onSubmit, isLoading }: CreateBatchFormProps) {
  const form = useForm({
    defaultValues: {
      name: '',
      subject: '',
      classTime: '',
      classDays: [],
      maxStudents: 50,
      startDate: '',
      endDate: ''
    }
  });

  const handleSubmit = (data: any) => {
    onSubmit(data);
    form.reset();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={isDarkMode ? 'text-cyan-300' : 'text-gray-700'}>Batch Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g., Math Batch 2025" className={isDarkMode ? 'bg-slate-700 border-purple-400/30 text-white' : 'bg-white'} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="subject"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={isDarkMode ? 'text-cyan-300' : 'text-gray-700'}>Subject</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className={isDarkMode ? 'bg-slate-700 border-purple-400/30 text-white' : 'bg-white'}>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="science">Science</SelectItem>
                  <SelectItem value="math">Math</SelectItem>
                  <SelectItem value="higher-math">Higher Math</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="classTime"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={isDarkMode ? 'text-cyan-300' : 'text-gray-700'}>Class Time</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g., 10:00 AM - 12:00 PM" className={isDarkMode ? 'bg-slate-700 border-purple-400/30 text-white' : 'bg-white'} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="maxStudents"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={isDarkMode ? 'text-cyan-300' : 'text-gray-700'}>Maximum Students</FormLabel>
              <FormControl>
                <Input {...field} type="number" placeholder="50" className={isDarkMode ? 'bg-slate-700 border-purple-400/30 text-white' : 'bg-white'} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={isDarkMode ? 'text-cyan-300' : 'text-gray-700'}>Start Date</FormLabel>
                <FormControl>
                  <Input {...field} type="date" className={isDarkMode ? 'bg-slate-700 border-purple-400/30 text-white' : 'bg-white'} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={isDarkMode ? 'text-cyan-300' : 'text-gray-700'}>End Date</FormLabel>
                <FormControl>
                  <Input {...field} type="date" className={isDarkMode ? 'bg-slate-700 border-purple-400/30 text-white' : 'bg-white'} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <DialogFooter>
          <Button
            type="submit"
            disabled={isLoading}
            className={`${isDarkMode ? 'bg-cyan-600 hover:bg-cyan-700' : 'bg-orange-600 hover:bg-orange-700'} text-white`}
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                Creating...
              </div>
            ) : (
              <>
                <GraduationCap className="w-4 h-4 mr-2" />
                Create Batch
              </>
            )}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

function AddStudentForm({ isDarkMode, onSubmit, batches, isLoading }: AddStudentFormProps) {
  const form = useForm({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phoneNumber: '',
      parentPhoneNumber: '',
      batchId: '',
      institution: '',
      classLevel: '',
      password: ''
    }
  });

  const handleSubmit = (data: any) => {
    onSubmit(data);
    form.reset();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={isDarkMode ? 'text-cyan-300' : 'text-gray-700'}>First Name</FormLabel>
                <FormControl>
                  <Input {...field} className={isDarkMode ? 'bg-slate-700 border-purple-400/30 text-white' : 'bg-white'} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={isDarkMode ? 'text-cyan-300' : 'text-gray-700'}>Last Name</FormLabel>
                <FormControl>
                  <Input {...field} className={isDarkMode ? 'bg-slate-700 border-purple-400/30 text-white' : 'bg-white'} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={isDarkMode ? 'text-cyan-300' : 'text-gray-700'}>Phone Number</FormLabel>
              <FormControl>
                <Input {...field} className={isDarkMode ? 'bg-slate-700 border-purple-400/30 text-white' : 'bg-white'} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="parentPhoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={isDarkMode ? 'text-cyan-300' : 'text-gray-700'}>Parent Phone Number</FormLabel>
              <FormControl>
                <Input {...field} className={isDarkMode ? 'bg-slate-700 border-purple-400/30 text-white' : 'bg-white'} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="batchId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={isDarkMode ? 'text-cyan-300' : 'text-gray-700'}>Batch</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className={isDarkMode ? 'bg-slate-700 border-purple-400/30 text-white' : 'bg-white'}>
                    <SelectValue placeholder="Select batch" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {batches.map((batch) => (
                    <SelectItem key={batch.id} value={batch.id}>
                      {batch.name} ({batch.batchCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="institution"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={isDarkMode ? 'text-cyan-300' : 'text-gray-700'}>Institution</FormLabel>
              <FormControl>
                <Input {...field} placeholder="School/College name" className={isDarkMode ? 'bg-slate-700 border-purple-400/30 text-white' : 'bg-white'} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="classLevel"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={isDarkMode ? 'text-cyan-300' : 'text-gray-700'}>Class Level</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className={isDarkMode ? 'bg-slate-700 border-purple-400/30 text-white' : 'bg-white'}>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="9">Class 9</SelectItem>
                  <SelectItem value="10">Class 10</SelectItem>
                  <SelectItem value="11">Class 11</SelectItem>
                  <SelectItem value="12">Class 12</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={isDarkMode ? 'text-cyan-300' : 'text-gray-700'}>
                Student Password 
                <span className="text-xs text-gray-500 ml-2">(Leave empty to auto-generate)</span>
              </FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  type="text"
                  placeholder="Enter custom password or leave empty" 
                  className={isDarkMode ? 'bg-slate-700 border-purple-400/30 text-white' : 'bg-white'} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          disabled={isLoading}
          className={`w-full ${isDarkMode ? 'bg-cyan-600 hover:bg-cyan-700' : 'bg-orange-600 hover:bg-orange-700'} text-white`}
        >
          {isLoading ? 'Adding Student...' : 'Add Student'}
        </Button>
      </form>
    </Form>
  );
}

export default function Students() {
  const [, setLocation] = useLocation();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [isCreateBatchModalOpen, setIsCreateBatchModalOpen] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState<{[key: string]: boolean}>({});
  const [editingPassword, setEditingPassword] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteBatchConfirm, setDeleteBatchConfirm] = useState<string | null>(null);
  const [transferringBatch, setTransferringBatch] = useState<string | null>(null);
  const [selectedBatch, setSelectedBatch] = useState('');
  const { toast } = useToast();

  // Fetch students data
  const studentsQuery = useQuery({
    queryKey: ['/api/students'],
    retry: false,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    staleTime: 0,
    cacheTime: 0,
  });

  const { data: studentsData, isLoading: studentsLoading } = studentsQuery;

  const batchesQuery = useQuery({
    queryKey: ['/api/batches'],
    retry: false,
  });
  
  const { data: batchesData } = batchesQuery;

  const addStudentMutation = useMutation({
    mutationFn: async (studentData: any) => {
      const response = await apiRequest('POST', '/api/students', studentData);
      return await response.json();
    },
    onSuccess: (data) => {
      studentsQuery.refetch();
      toast({
        title: '✅ Student Added Successfully',
        description: `Student password: ${data.password}. Share this with the student for login.`,
        variant: 'default',
      });
      setIsAddStudentModalOpen(false);
    },
    onError: (error) => {
      console.error('Error adding student:', error);
      toast({
        title: '❌ Error',
        description: 'Failed to add student. Please try again.',
        variant: 'destructive',
      });
    }
  });

  const deleteStudentMutation = useMutation({
    mutationFn: async (studentId: string) => {
      const response = await apiRequest('DELETE', `/api/students/${studentId}`);
      return await response.json();
    },
    onSuccess: () => {
      studentsQuery.refetch();
      toast({
        title: '✅ Student Removed',
        description: 'Student has been successfully removed from the database.',
        variant: 'default',
      });
      setDeleteConfirm(null);
    },
    onError: (error) => {
      console.error('Error deleting student:', error);
      toast({
        title: '❌ Error',
        description: 'Failed to remove student. Please try again.',
        variant: 'destructive',
      });
    }
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async ({ studentId, password }: { studentId: string; password: string }) => {
      const response = await apiRequest('PATCH', `/api/students/${studentId}/password`, { password });
      return await response.json();
    },
    onSuccess: (data) => {
      // Force refresh of student data
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      studentsQuery.refetch();
      
      toast({
        title: '✅ Password Updated',
        description: `Student password has been updated successfully. New password: ${data.password}`,
        variant: 'default',
      });
      setEditingPassword(null);
      setNewPassword('');
    },
    onError: (error) => {
      console.error('Error updating password:', error);
      toast({
        title: '❌ Error',
        description: 'Failed to update password. Please try again.',
        variant: 'destructive',
      });
    }
  });

  const transferBatchMutation = useMutation({
    mutationFn: async ({ studentId, batchId }: { studentId: string; batchId: string }) => {
      const response = await apiRequest('PATCH', `/api/students/${studentId}/batch`, { batchId });
      return await response.json();
    },
    onSuccess: () => {
      studentsQuery.refetch();
      toast({
        title: '✅ Batch Transfer Completed',
        description: 'Student has been transferred to the new batch successfully.',
        variant: 'default',
      });
      setTransferringBatch(null);
      setSelectedBatch('');
    },
    onError: (error) => {
      console.error('Error transferring student batch:', error);
      toast({
        title: '❌ Transfer Failed',
        description: 'Failed to transfer student. Please try again.',
        variant: 'destructive',
      });
    }
  });

  const createBatchMutation = useMutation({
    mutationFn: async (batchData: any) => {
      const response = await apiRequest('POST', '/api/batches', batchData);
      
      // Check if response is ok
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || 'Failed to create batch');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      // Only show success if we actually have valid data
      if (data && data.name) {
        batchesQuery.refetch();
        toast({
          title: '✅ Batch Created Successfully',
          description: `Batch "${data.name}" created. Batch code: ${data.batchCode}, Password: ${data.password}`,
          variant: 'default',
        });
        setIsCreateBatchModalOpen(false);
      } else {
        // Handle case where response looks successful but data is invalid
        toast({
          title: '⚠️ Warning',
          description: 'Batch may have been created but with incomplete data. Please check the batch list.',
          variant: 'destructive',
        });
      }
    },
    onError: (error: any) => {
      console.error('Error creating batch:', error);
      toast({
        title: '❌ Error Creating Batch',
        description: error.message || 'Failed to create batch. Please try again.',
        variant: 'destructive',
      });
    }
  });

  const deleteBatchMutation = useMutation({
    mutationFn: async (batchId: string) => {
      const response = await apiRequest('DELETE', `/api/batches/${batchId}`);
      return await response.json();
    },
    onSuccess: () => {
      batchesQuery.refetch();
      studentsQuery.refetch(); // Refresh students as batch counts might change
      toast({
        title: '✅ Batch Removed',
        description: 'Batch has been successfully removed from the system.',
        variant: 'default',
      });
      setDeleteBatchConfirm(null);
    },
    onError: (error: any) => {
      console.error('Error deleting batch:', error);
      toast({
        title: '❌ Cannot Remove Batch', 
        description: error.message || 'Failed to remove batch. Batch may have students.',
        variant: 'destructive',
      });
    }
  });

  const togglePasswordVisibility = (studentId: string) => {
    setPasswordVisible(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  const handlePasswordEdit = (studentId: string) => {
    setEditingPassword(studentId);
    setNewPassword('');
  };

  const handlePasswordUpdate = (studentId: string) => {
    if (!newPassword.trim()) {
      toast({
        title: 'Invalid Password',
        description: 'Please enter a valid password.',
        variant: 'destructive',
      });
      return;
    }
    updatePasswordMutation.mutate({ studentId, password: newPassword });
  };

  const handleDeleteStudent = (studentId: string) => {
    deleteStudentMutation.mutate(studentId);
  };

  const handleDeleteBatch = (batchId: string) => {
    deleteBatchMutation.mutate(batchId);
  };

  const handleBatchTransfer = (studentId: string) => {
    if (!selectedBatch) {
      toast({
        title: '❌ No Batch Selected',
        description: 'Please select a batch before transferring.',
        variant: 'destructive',
      });
      return;
    }
    
    transferBatchMutation.mutate({ studentId, batchId: selectedBatch });
  };

  const startBatchTransfer = (studentId: string) => {
    setTransferringBatch(studentId);
    setSelectedBatch('');
  };

  const cancelBatchTransfer = () => {
    setTransferringBatch(null);
    setSelectedBatch('');
  };

  const getSubjectIcon = (subject: string) => {
    return subject === 'chemistry' ? <Beaker className="w-4 h-4" /> : <Monitor className="w-4 h-4" />;
  };

  const getSubjectTheme = (subject: string, isDarkMode: boolean) => {
    if (subject === 'chemistry') {
      return {
        bgColor: isDarkMode ? 'bg-green-900/30' : 'bg-green-100',
        borderColor: isDarkMode ? 'border-green-400/50' : 'border-green-300',
        textColor: isDarkMode ? 'text-green-300' : 'text-green-700',
        badgeColor: isDarkMode ? 'bg-green-800 text-green-200' : 'bg-green-200 text-green-800'
      };
    } else {
      return {
        bgColor: isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100',
        borderColor: isDarkMode ? 'border-blue-400/50' : 'border-blue-300',
        textColor: isDarkMode ? 'text-blue-300' : 'text-blue-700',
        badgeColor: isDarkMode ? 'bg-blue-800 text-blue-200' : 'bg-blue-200 text-blue-800'
      };
    }
  };

  const filteredStudents = (studentsData || []).filter((student: any) =>
    `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.phoneNumber?.includes(searchTerm)
  );

  return (
    <div className={`min-h-screen ${isDarkMode 
      ? 'bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900' 
      : 'bg-gradient-to-br from-orange-50 via-white to-red-50'
    }`}>
      {/* Header with Back Navigation */}
      <header className={`backdrop-blur-sm border-b ${isDarkMode 
        ? 'bg-gray-800/95 border-orange-400/30' 
        : 'bg-white/95 border-orange-300/50 shadow-sm'
      }`}>
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/teacher')}
              className={`${isDarkMode ? 'text-purple-400 hover:bg-slate-700' : 'text-orange-600 hover:bg-orange-50'}`}
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </Button>
            <div className="flex items-center space-x-2">
              <Users className={`w-6 h-6 ${isDarkMode ? 'text-purple-400' : 'text-orange-600'}`} />
              <h1 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                Student Management
              </h1>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={() => setIsCreateBatchModalOpen(true)}
              variant="outline"
              className={`${isDarkMode ? 'border-purple-400/50 text-purple-400 hover:bg-cyan-600/20' : 'border-orange-400 text-orange-600 hover:bg-orange-50'}`}
            >
              <GraduationCap className="w-4 h-4 mr-2" />
              Create Batch
            </Button>
            <Button
              onClick={() => setIsAddStudentModalOpen(true)}
              className={`${isDarkMode ? 'bg-cyan-600 hover:bg-cyan-700' : 'bg-orange-600 hover:bg-orange-700'} text-white`}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Student
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 space-y-6">
        {/* Search and Filters */}
        <Card className={`${isDarkMode ? 'bg-slate-800/50 border-purple-400/30' : 'bg-white border-orange-300/50'}`}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search students by name or phone..."
                  className={`pl-10 ${isDarkMode ? 'bg-slate-700 border-purple-400/30 text-white' : 'bg-white'}`}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Batch Management Section */}
        <Card className={`${isDarkMode ? 'bg-slate-800/50 border-purple-400/30' : 'bg-white border-orange-300/50'}`}>
          <CardHeader>
            <CardTitle className={`${isDarkMode ? 'text-cyan-300' : 'text-orange-600'}`}>
              <GraduationCap className="w-5 h-5 mr-2 inline" />
              Batch Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {(batchesData || []).map((batch: any) => (
                <div key={batch.id} className={`p-3 border rounded-lg ${getSubjectTheme(batch.subject, isDarkMode).bgColor} ${getSubjectTheme(batch.subject, isDarkMode).borderColor}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {getSubjectIcon(batch.subject)}
                        <h4 className={`font-semibold text-sm ${getSubjectTheme(batch.subject, isDarkMode).textColor}`}>
                          {batch.name}
                        </h4>
                      </div>
                      <div className={`text-xs space-y-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        <div>Code: {batch.batchCode}</div>
                        <div>Students: {batch.students || 0}/{batch.maxStudents}</div>
                        <div>Subject: {batch.subject}</div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteBatchConfirm(batch.id)}
                      className={`h-6 px-2 ${isDarkMode ? 'text-red-400 hover:bg-red-900/20' : 'text-red-600 hover:bg-red-50'}`}
                      data-testid={`button-delete-batch-${batch.batchCode}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Students List */}
        <div className="grid gap-4">
          {studentsLoading ? (
            <div className="text-center py-8">
              <div className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Loading students...
              </div>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-8">
              <div className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {searchTerm ? 'No students found matching your search.' : 'No students enrolled yet.'}
              </div>
            </div>
          ) : (
            (filteredStudents as any[]).map((student: any) => (
              <Card key={student.id} className={`${isDarkMode ? 'bg-slate-800/50 border-purple-400/30' : 'bg-white border-orange-300/50'}`}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className={`font-semibold text-lg ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                          {student.firstName} {student.lastName}
                        </h3>
                        <Badge variant="outline" className="text-xs">
                          {student.studentId}
                        </Badge>
                      </div>
                      
                      <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4" />
                          <span>{student.phoneNumber}</span>
                        </div>
                        {student.parentPhoneNumber && (
                          <div className="flex items-center space-x-2 mt-1">
                            <Phone className="w-4 h-4" />
                            <span>Parent: {student.parentPhoneNumber}</span>
                          </div>
                        )}
                        {student.institution && (
                          <div className="mt-1">
                            <span>Institution: {student.institution}</span>
                          </div>
                        )}
                        {student.classLevel && (
                          <div className="mt-1">
                            <span>Class: {student.classLevel}</span>
                          </div>
                        )}
                        
                        {/* Batch Information */}
                        {student.batch && (
                          <div className={`mt-3 p-3 border rounded-lg ${getSubjectTheme(student.batch.subject, isDarkMode).bgColor} ${getSubjectTheme(student.batch.subject, isDarkMode).borderColor}`}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                {getSubjectIcon(student.batch.subject)}
                                <span className={`text-sm font-medium ${getSubjectTheme(student.batch.subject, isDarkMode).textColor}`}>
                                  Current Batch:
                                </span>
                              </div>
                              {transferringBatch !== student.id && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => startBatchTransfer(student.id)}
                                  className={`h-6 px-2 ${getSubjectTheme(student.batch.subject, isDarkMode).textColor} hover:bg-black/10`}
                                  data-testid={`button-transfer-batch-${student.studentId}`}
                                >
                                  <ArrowRightLeft className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                            
                            {transferringBatch === student.id ? (
                              <div className="space-y-2">
                                <Select onValueChange={setSelectedBatch} value={selectedBatch}>
                                  <SelectTrigger className="h-8 text-sm">
                                    <SelectValue placeholder="Select new batch" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {(batchesData || []).filter((batch: any) => batch.id !== student.batchId).map((batch: any) => (
                                      <SelectItem key={batch.id} value={batch.id}>
                                        <div className="flex items-center space-x-2">
                                          {getSubjectIcon(batch.subject)}
                                          <span>{batch.name}</span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <div className="flex items-center space-x-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleBatchTransfer(student.id)}
                                    disabled={transferBatchMutation.isPending}
                                    className="h-7 px-3 text-xs bg-green-600 hover:bg-green-700 text-white"
                                    data-testid={`button-confirm-transfer-${student.studentId}`}
                                  >
                                    Transfer
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={cancelBatchTransfer}
                                    className="h-7 px-3 text-xs"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <div className={`flex items-center justify-between`}>
                                  <span className={`text-sm font-medium ${getSubjectTheme(student.batch.subject, isDarkMode).textColor}`}>
                                    {student.batch.name}
                                  </span>
                                  <Badge className={`text-xs ${getSubjectTheme(student.batch.subject, isDarkMode).badgeColor}`}>
                                    {student.batch.batchCode}
                                  </Badge>
                                </div>
                                <div className={`text-xs ${getSubjectTheme(student.batch.subject, isDarkMode).textColor} opacity-80`}>
                                  Subject: {student.batch.subject === 'chemistry' ? 'Chemistry' : 'ICT'}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Password Management */}
                        <div className="mt-3 p-2 border rounded-lg bg-gray-50 dark:bg-gray-800">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Key className="w-4 h-4" />
                              <span className="text-xs font-medium">Login Password:</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => togglePasswordVisibility(student.id)}
                                className="h-6 px-2"
                                data-testid={`button-toggle-password-${student.studentId}`}
                              >
                                {passwordVisible[student.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePasswordEdit(student.id)}
                                className="h-6 px-2"
                                data-testid={`button-edit-password-${student.studentId}`}
                              >
                                <Edit2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          {editingPassword === student.id ? (
                            <div className="mt-2 flex items-center space-x-2">
                              <Input
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter new password"
                                className="h-7 text-xs"
                                data-testid={`input-new-password-${student.studentId}`}
                              />
                              <Button
                                size="sm"
                                onClick={() => handlePasswordUpdate(student.id)}
                                disabled={updatePasswordMutation.isPending}
                                className="h-7 px-2 text-xs"
                                data-testid={`button-save-password-${student.studentId}`}
                              >
                                Save
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingPassword(null)}
                                className="h-7 px-2 text-xs"
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <div className="mt-1">
                              <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                {passwordVisible[student.id] ? student.studentPassword || 'No password set' : '••••••'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col space-y-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteConfirm(student.id)}
                        className={`${isDarkMode ? 'border-red-400/30 text-red-400 hover:bg-red-900/20' : 'border-red-300 text-red-600 hover:bg-red-50'}`}
                        data-testid={`button-delete-student-${student.studentId}`}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>

      {/* Add Student Modal */}
      <Dialog open={isAddStudentModalOpen} onOpenChange={setIsAddStudentModalOpen}>
        <DialogContent className={`max-w-md ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-white'}`}>
          <DialogHeader>
            <DialogTitle className={isDarkMode ? 'text-cyan-300' : 'text-gray-800'}>Add New Student</DialogTitle>
          </DialogHeader>
          <AddStudentForm 
            isDarkMode={isDarkMode} 
            onSubmit={(data) => addStudentMutation.mutate(data)}
            batches={batchesData || []}
            isLoading={addStudentMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className={`max-w-md ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-white'}`}>
          <DialogHeader>
            <DialogTitle className={`${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>
              Confirm Student Removal
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Are you sure you want to permanently remove this student from the database? This action cannot be undone.
            </p>
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-700 dark:text-red-300 text-sm font-medium">
                ⚠️ This will delete all student data including:
              </p>
              <ul className="text-red-600 dark:text-red-400 text-sm mt-2 ml-4 list-disc">
                <li>Login credentials</li>
                <li>Exam results and submissions</li>
                <li>Attendance records</li>
                <li>All historical data</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirm(null)}
              disabled={deleteStudentMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDeleteStudent(deleteConfirm)}
              disabled={deleteStudentMutation.isPending}
              data-testid="button-confirm-delete-student"
            >
              {deleteStudentMutation.isPending ? (
                <div className="flex items-center">
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Removing...
                </div>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Yes, Remove Student
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Batch Modal */}
      <Dialog open={isCreateBatchModalOpen} onOpenChange={setIsCreateBatchModalOpen}>
        <DialogContent className={`max-w-md ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-white'}`}>
          <DialogHeader>
            <DialogTitle className={isDarkMode ? 'text-cyan-300' : 'text-gray-800'}>Create New Batch</DialogTitle>
          </DialogHeader>
          <CreateBatchForm 
            isDarkMode={isDarkMode} 
            onSubmit={(data) => createBatchMutation.mutate(data)}
            isLoading={createBatchMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Batch Confirmation Modal */}
      <Dialog open={!!deleteBatchConfirm} onOpenChange={() => setDeleteBatchConfirm(null)}>
        <DialogContent className={`max-w-md ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-white'}`}>
          <DialogHeader>
            <DialogTitle className={`${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>
              Confirm Batch Removal
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Are you sure you want to permanently remove this batch? This action cannot be undone.
            </p>
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-700 dark:text-red-300 text-sm font-medium">
                ⚠️ Batch can only be deleted if:
              </p>
              <ul className="text-red-600 dark:text-red-400 text-sm mt-2 ml-4 list-disc">
                <li>No students are currently enrolled</li>
                <li>All students have been transferred to other batches</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteBatchConfirm(null)}
              disabled={deleteBatchMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteBatchConfirm && handleDeleteBatch(deleteBatchConfirm)}
              disabled={deleteBatchMutation.isPending}
              data-testid="button-confirm-delete-batch"
            >
              {deleteBatchMutation.isPending ? (
                <div className="flex items-center">
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Removing...
                </div>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Yes, Remove Batch
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
