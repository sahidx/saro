import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Key, CreditCard, Users, Settings, MessageCircle, Shield } from "lucide-react";

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  smsCredits: number;
  lastLogin: Date;
  isActive: boolean;
}

export default function SuperUserDashboard() {
  const { toast } = useToast();
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [smsCredits, setSmsCredits] = useState('');
  const [creditReason, setCreditReason] = useState('');

  // Fetch all teachers
  const { data: teachers, isLoading } = useQuery({
    queryKey: ['/api/super/teachers'],
    retry: false,
  });

  // Change teacher password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async ({ teacherId, password }: { teacherId: string; password: string }) => {
      return apiRequest('PUT', `/api/super/teachers/${teacherId}/password`, { newPassword: password });
    },
    onSuccess: () => {
      toast({
        title: "Password Changed",
        description: "Teacher password updated successfully",
      });
      setNewPassword('');
      setSelectedTeacher(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Password Change Failed",
        description: error.message || "Failed to change password",
        variant: "destructive",
      });
    }
  });

  // Add SMS credits mutation
  const addCreditsMutation = useMutation({
    mutationFn: async ({ teacherId, credits, reason }: { teacherId: string; credits: number; reason: string }) => {
      return apiRequest('PUT', `/api/super/teachers/${teacherId}/sms-credits`, { credits, reason });
    },
    onSuccess: () => {
      toast({
        title: "Credits Added",
        description: "SMS credits added successfully",
      });
      setSmsCredits('');
      setCreditReason('');
      setSelectedTeacher(null);
      queryClient.invalidateQueries({ queryKey: ['/api/super/teachers'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Credit Addition Failed",
        description: error.message || "Failed to add credits",
        variant: "destructive",
      });
    }
  });

  const handlePasswordChange = () => {
    if (!selectedTeacher || !newPassword || newPassword.length < 4) {
      toast({
        title: "Invalid Input",
        description: "Password must be at least 4 characters",
        variant: "destructive",
      });
      return;
    }

    changePasswordMutation.mutate({
      teacherId: selectedTeacher.id,
      password: newPassword
    });
  };

  const handleAddCredits = () => {
    if (!selectedTeacher || smsCredits === '') {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid credit amount",
        variant: "destructive",
      });
      return;
    }

    addCreditsMutation.mutate({
      teacherId: selectedTeacher.id,
      credits: parseInt(smsCredits),
      reason: creditReason || 'Offline payment'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Super User Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-900">Super User Dashboard</h1>
          </div>
          <p className="text-gray-600">Manage teacher accounts, passwords, and SMS credits</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Teachers</p>
                  <p className="text-3xl font-bold text-indigo-600">{(teachers as Teacher[])?.length || 0}</p>
                </div>
                <Users className="w-8 h-8 text-indigo-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">SMS Rate</p>
                  <p className="text-3xl font-bold text-green-600">৳0.39</p>
                  <p className="text-xs text-gray-500">Per SMS</p>
                </div>
                <MessageCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Teachers</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {(teachers as Teacher[])?.filter((t: Teacher) => t.isActive).length || 0}
                  </p>
                </div>
                <Shield className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Teachers Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Teacher Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(teachers as Teacher[])?.map((teacher: Teacher) => (
                <div key={teacher.id} className="border rounded-lg p-4 bg-white">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">
                        {teacher.firstName} {teacher.lastName}
                      </h3>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>📧 {teacher.email || 'No email'}</p>
                        <p>📱 {teacher.phoneNumber}</p>
                        <p>💳 SMS Credits: <span className="font-semibold text-green-600">{teacher.smsCredits}</span></p>
                        <p>🕒 Last Login: {teacher.lastLogin ? new Date(teacher.lastLogin).toLocaleDateString() : 'Never'}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      {/* Password Change Dialog */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedTeacher(teacher)}
                          >
                            <Key className="w-4 h-4 mr-2" />
                            Change Password
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Change Password for {teacher.firstName} {teacher.lastName}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="newPassword">New Password</Label>
                              <Input
                                id="newPassword"
                                type="password"
                                placeholder="Enter new password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                              />
                            </div>
                            <Button
                              onClick={handlePasswordChange}
                              disabled={changePasswordMutation.isPending}
                              className="w-full"
                            >
                              {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      {/* SMS Credits Dialog */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedTeacher(teacher)}
                          >
                            <CreditCard className="w-4 h-4 mr-2" />
                            Add Credits
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add SMS Credits for {teacher.firstName} {teacher.lastName}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="credits">SMS Credits</Label>
                              <Input
                                id="credits"
                                type="number"
                                placeholder="Enter number of credits"
                                value={smsCredits}
                                onChange={(e) => setSmsCredits(e.target.value)}
                              />
                            </div>
                            <div>
                              <Label htmlFor="reason">Reason (Optional)</Label>
                              <Input
                                id="reason"
                                placeholder="e.g., Offline payment received"
                                value={creditReason}
                                onChange={(e) => setCreditReason(e.target.value)}
                              />
                            </div>
                            <Button
                              onClick={handleAddCredits}
                              disabled={addCreditsMutation.isPending}
                              className="w-full"
                            >
                              {addCreditsMutation.isPending ? 'Adding...' : 'Add Credits'}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              )) || (
                <div className="text-center py-8 text-gray-500">
                  No teachers found
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
