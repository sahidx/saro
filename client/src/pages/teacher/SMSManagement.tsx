import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2, Send, MessageSquare, Clock, Users, Settings, Eye } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface SMSTemplate {
  id: number;
  name: string;
  type: 'attendance' | 'exam_result' | 'exam_notification' | 'notice' | 'reminder';
  isActive: boolean;
  template: string;
  description?: string;
  createdBy: string;
  variables?: SMSTemplateVariable[];
}

interface SMSTemplateVariable {
  id: number;
  templateId: number;
  variableName: string;
  description?: string;
  isRequired: boolean;
  defaultValue?: string;
}

interface SMSAutomationRule {
  id: number;
  name: string;
  templateId: number;
  triggerType: 'monthly_exam' | 'attendance_reminder' | 'exam_notification' | 'custom_schedule';
  isActive: boolean;
  targetAudience: 'students' | 'parents' | 'both';
  batchId?: string;
  scheduleDay?: number;
  scheduleTime?: string;
  lastExecuted?: Date;
  createdBy: string;
}

interface Batch {
  id: string;
  name: string;
  subject: string;
  currentStudents: number;
}

const SMSManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('send');
  const [selectedTemplate, setSelectedTemplate] = useState<SMSTemplate | null>(null);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [automationDialogOpen, setAutomationDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch SMS templates
  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['sms-templates'],
    queryFn: async () => {
      const response = await fetch('/api/sms/templates');
      if (!response.ok) throw new Error('Failed to fetch templates');
      return response.json();
    }
  });

  // Fetch automation rules
  const { data: automationRules = [], isLoading: rulesLoading } = useQuery({
    queryKey: ['sms-automation-rules'],
    queryFn: async () => {
      const response = await fetch('/api/sms/automation-rules');
      if (!response.ok) throw new Error('Failed to fetch automation rules');
      return response.json();
    }
  });

  // Fetch batches
  const { data: batches = [], isLoading: batchesLoading } = useQuery({
    queryKey: ['batches'],
    queryFn: async () => {
      const response = await fetch('/api/batches');
      if (!response.ok) throw new Error('Failed to fetch batches');
      return response.json();
    }
  });

  // Template form state
  const [templateForm, setTemplateForm] = useState({
    name: '',
    type: 'attendance' as SMSTemplate['type'],
    template: '',
    description: '',
    isActive: true,
    variables: [] as Omit<SMSTemplateVariable, 'id' | 'templateId'>[]
  });

  // Automation rule form state
  const [automationForm, setAutomationForm] = useState({
    name: '',
    templateId: 0,
    triggerType: 'monthly_exam' as SMSAutomationRule['triggerType'],
    targetAudience: 'both' as SMSAutomationRule['targetAudience'],
    batchId: '',
    scheduleDay: 1,
    scheduleTime: '10:00',
    isActive: true
  });

  // SMS sending form state
  const [smsForm, setSmsForm] = useState({
    templateId: 0,
    targetBatch: '',
    targetAudience: 'both' as 'students' | 'parents' | 'both',
    variables: {} as Record<string, string>,
    customMessage: ''
  });

  // Balance and preview states
  const [balanceInfo, setBalanceInfo] = useState<{
    hasBalance: boolean;
    currentBalance: number;
    requiredCredits: number;
    recipientCount: number;
    message?: string;
  } | null>(null);
  const [batchPreview, setBatchPreview] = useState<{
    totalRecipients: number;
    studentCount: number;
    parentCount: number;
    totalCost: number;
    batches: Array<{
      batchId: string;
      batchName: string;
      students: number;
      parents: number;
      cost: number;
    }>;
  } | null>(null);
  const [monthlyAlert, setMonthlyAlert] = useState<{
    isMonthEndAlert: boolean;
    totalSMSNeeded: number;
    batchPreviews: any[];
  } | null>(null);
  const [creditRequest, setCreditRequest] = useState({
    requestedAmount: 0,
    justification: ''
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (templateData: typeof templateForm) => {
      const response = await fetch('/api/sms/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData)
      });
      if (!response.ok) throw new Error('Failed to create template');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sms-templates'] });
      setTemplateDialogOpen(false);
      toast({
        title: "Success",
        description: "Template created successfully"
      });
      resetTemplateForm();
    }
  });

  // Edit template mutation
  const editTemplateMutation = useMutation({
    mutationFn: async (templateData: typeof templateForm) => {
      if (!selectedTemplate?.id) throw new Error('No template selected');
      const response = await fetch(`/api/sms/templates/${selectedTemplate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData)
      });
      if (!response.ok) throw new Error('Failed to update template');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sms-templates'] });
      setTemplateDialogOpen(false);
      toast({
        title: "Success",
        description: "Template updated successfully"
      });
      resetTemplateForm();
      setSelectedTemplate(null);
    }
  });

  // Create automation rule mutation
  const createAutomationMutation = useMutation({
    mutationFn: async (ruleData: typeof automationForm) => {
      const response = await fetch('/api/sms/automation-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ruleData)
      });
      if (!response.ok) throw new Error('Failed to create automation rule');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sms-automation-rules'] });
      setAutomationDialogOpen(false);
      toast({
        title: "Success",
        description: "Automation rule created successfully"
      });
      resetAutomationForm();
    }
  });

  // Send SMS mutation (enhanced)
  const sendSMSMutation = useMutation({
    mutationFn: async (smsData: typeof smsForm) => {
      const response = await fetch('/api/sms/send-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(smsData)
      });
      if (!response.ok) throw new Error('Failed to send SMS');
      return response.json();
    },
    onSuccess: (data) => {
      if (data.balanceInsufficient) {
        toast({
          title: "Balance Insufficient",
          description: data.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "SMS sent successfully"
        });
        setSmsForm({
          templateId: 0,
          targetBatch: '',
          targetAudience: 'both',
          variables: {},
          customMessage: ''
        });
        setBalanceInfo(null);
        setBatchPreview(null);
      }
    }
  });

  // Request SMS credits mutation
  const requestCreditsMutation = useMutation({
    mutationFn: async (creditData: typeof creditRequest) => {
      const response = await fetch('/api/sms/request-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creditData)
      });
      if (!response.ok) throw new Error('Failed to request credits');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "SMS credit request submitted successfully"
      });
      setCreditRequest({ requestedAmount: 0, justification: '' });
    }
  });

  // Reset form functions
  const resetTemplateForm = () => {
    setTemplateForm({
      name: '',
      type: 'attendance',
      template: '',
      description: '',
      isActive: true,
      variables: []
    });
    setSelectedTemplate(null);
  };

  const resetAutomationForm = () => {
    setAutomationForm({
      name: '',
      templateId: 0,
      triggerType: 'monthly_exam',
      targetAudience: 'both',
      batchId: '',
      scheduleDay: 1,
      scheduleTime: '10:00',
      isActive: true
    });
  };

  // Add variable to template
  const addVariable = () => {
    setTemplateForm(prev => ({
      ...prev,
      variables: [...prev.variables, {
        variableName: '',
        description: '',
        isRequired: true,
        defaultValue: ''
      }]
    }));
  };

  // Remove variable from template
  const removeVariable = (index: number) => {
    setTemplateForm(prev => ({
      ...prev,
      variables: prev.variables.filter((_, i) => i !== index)
    }));
  };

  // Check SMS balance
  const checkSMSBalance = async () => {
    if (!smsForm.targetBatch) {
      toast({
        title: "Error",
        description: "Please select a target batch first",
        variant: "destructive"
      });
      return;
    }

    try {
      const message = selectedTemplate ? getTemplatePreview(selectedTemplate) : smsForm.customMessage;
      const response = await fetch('/api/sms/check-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientCount: batchPreview?.totalRecipients || 0,
          message
        })
      });
      
      if (!response.ok) throw new Error('Failed to check balance');
      const data = await response.json();
      setBalanceInfo(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to check SMS balance",
        variant: "destructive"
      });
    }
  };

  // Get batch preview
  const getBatchPreview = async () => {
    if (!smsForm.targetBatch) {
      toast({
        title: "Error",
        description: "Please select a target batch first",
        variant: "destructive"
      });
      return;
    }

    try {
      const message = selectedTemplate ? getTemplatePreview(selectedTemplate) : smsForm.customMessage;
      const response = await fetch(`/api/sms/batch-preview?batchIds=${smsForm.targetBatch}&message=${encodeURIComponent(message)}`);
      
      if (!response.ok) throw new Error('Failed to get batch preview');
      const data = await response.json();
      setBatchPreview(data);
      
      // Automatically check balance after getting preview
      if (data.totalRecipients > 0) {
        const balanceResponse = await fetch('/api/sms/check-balance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipientCount: data.totalRecipients,
            message
          })
        });
        
        if (balanceResponse.ok) {
          const balanceData = await balanceResponse.json();
          setBalanceInfo(balanceData);
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get batch preview",
        variant: "destructive"
      });
    }
  };

  // Get monthly alert preview
  const getMonthlyAlert = async () => {
    try {
      const response = await fetch('/api/sms/monthly-alert-preview');
      if (!response.ok) throw new Error('Failed to get monthly alert');
      const data = await response.json();
      setMonthlyAlert(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get monthly alert preview",
        variant: "destructive"
      });
    }
  };

  // Process template preview
  const getTemplatePreview = (template: SMSTemplate) => {
    if (!template.template) return '';
    
    let preview = template.template;
    template.variables?.forEach(variable => {
      const placeholder = `{{${variable.variableName}}}`;
      const replacement = smsForm.variables[variable.variableName] || variable.defaultValue || `[${variable.variableName}]`;
      preview = preview.replace(new RegExp(placeholder, 'g'), replacement);
    });
    
    return preview;
  };

  // Update selected template when form changes
  useEffect(() => {
    if (smsForm.templateId > 0) {
      const template = templates.find((t: SMSTemplate) => t.id === smsForm.templateId);
      setSelectedTemplate(template || null);
    } else {
      setSelectedTemplate(null);
    }
  }, [smsForm.templateId, templates]);

  // Clear previews when batch or template changes
  useEffect(() => {
    setBatchPreview(null);
    setBalanceInfo(null);
  }, [smsForm.targetBatch, smsForm.templateId]);

  // Load monthly alert on component mount
  useEffect(() => {
    getMonthlyAlert();
  }, []);

  const getTypeColor = (type: string) => {
    const colors = {
      attendance: 'bg-blue-100 text-blue-800',
      exam_result: 'bg-green-100 text-green-800',
      exam_notification: 'bg-yellow-100 text-yellow-800',
      notice: 'bg-purple-100 text-purple-800',
      reminder: 'bg-orange-100 text-orange-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getTriggerTypeColor = (type: string) => {
    const colors = {
      monthly_exam: 'bg-green-100 text-green-800',
      attendance_reminder: 'bg-blue-100 text-blue-800',
      exam_notification: 'bg-yellow-100 text-yellow-800',
      custom_schedule: 'bg-purple-100 text-purple-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">SMS Management</h1>
        <p className="text-muted-foreground">Manage SMS templates, automation rules, and send messages</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="send" className="flex items-center gap-2">
            <Send className="w-4 h-4" />
            Send SMS
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="automation" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Automation
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Send SMS Tab */}
        <TabsContent value="send" className="space-y-6">
          {/* Monthly Alert Banner */}
          {monthlyAlert?.isMonthEndAlert && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-orange-800">
                  <Clock className="w-5 h-5" />
                  <div>
                    <h4 className="font-medium">Monthly SMS Alert</h4>
                    <p className="text-sm">
                      Month end approaching! Total SMS needed: {monthlyAlert.totalSMSNeeded}
                    </p>
                    {monthlyAlert.batchPreviews.length > 0 && (
                      <div className="mt-2 text-xs">
                        Batches: {monthlyAlert.batchPreviews.map(b => `${b.batchName} (${b.smsRequired})`).join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Credit Request Card */}
          <Card>
            <CardHeader>
              <CardTitle>Request SMS Credits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Requested Amount</Label>
                  <Input
                    type="number"
                    min="1"
                    value={creditRequest.requestedAmount}
                    onChange={(e) => setCreditRequest(prev => ({ 
                      ...prev, 
                      requestedAmount: parseInt(e.target.value) || 0 
                    }))}
                    placeholder="Number of SMS credits"
                  />
                </div>
                <div>
                  <Label>Justification</Label>
                  <Textarea
                    value={creditRequest.justification}
                    onChange={(e) => setCreditRequest(prev => ({ 
                      ...prev, 
                      justification: e.target.value 
                    }))}
                    placeholder="Reason for requesting credits"
                    rows={1}
                  />
                </div>
              </div>
              <Button 
                onClick={() => requestCreditsMutation.mutate(creditRequest)}
                disabled={requestCreditsMutation.isPending || !creditRequest.requestedAmount}
                variant="outline"
              >
                Request Credits from Super Admin
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Send SMS</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Select Template</Label>
                  <Select 
                    value={smsForm.templateId.toString()} 
                    onValueChange={(value) => setSmsForm(prev => ({ ...prev, templateId: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template: SMSTemplate) => (
                        <SelectItem key={template.id} value={template.id.toString()}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Target Batch</Label>
                  <Select 
                    value={smsForm.targetBatch} 
                    onValueChange={(value) => setSmsForm(prev => ({ ...prev, targetBatch: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select batch" />
                    </SelectTrigger>
                    <SelectContent>
                      {batches.map((batch: Batch) => (
                        <SelectItem key={batch.id} value={batch.id}>
                          {batch.name} - {batch.subject} ({batch.currentStudents} students)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Target Audience</Label>
                  <Select 
                    value={smsForm.targetAudience} 
                    onValueChange={(value: any) => setSmsForm(prev => ({ ...prev, targetAudience: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="students">Students Only</SelectItem>
                      <SelectItem value="parents">Parents Only</SelectItem>
                      <SelectItem value="both">Both Students & Parents</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedTemplate && (
                <div className="space-y-4">
                  <h4 className="font-medium">Template Variables</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedTemplate.variables?.map((variable) => (
                      <div key={variable.id}>
                        <Label>{variable.variableName} {variable.isRequired && '*'}</Label>
                        <Input
                          placeholder={variable.description || variable.variableName}
                          value={smsForm.variables[variable.variableName] || ''}
                          onChange={(e) => setSmsForm(prev => ({
                            ...prev,
                            variables: {
                              ...prev.variables,
                              [variable.variableName]: e.target.value
                            }
                          }))}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label>Preview Message</Label>
                <Textarea
                  value={selectedTemplate ? getTemplatePreview(selectedTemplate) : smsForm.customMessage}
                  onChange={(e) => setSmsForm(prev => ({ ...prev, customMessage: e.target.value }))}
                  placeholder="Message preview will appear here"
                  rows={4}
                />
              </div>

              {/* Batch Preview and Balance Check */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  onClick={getBatchPreview}
                  disabled={!smsForm.targetBatch}
                  variant="outline"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Preview Recipients
                </Button>
                
                <Button 
                  onClick={checkSMSBalance}
                  disabled={!smsForm.targetBatch || !batchPreview}
                  variant="outline"
                >
                  Check SMS Balance
                </Button>
              </div>

              {/* Batch Preview Results */}
              {batchPreview && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-4">
                    <h4 className="font-medium mb-2">Batch Preview</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="font-medium">Total Recipients</p>
                        <p className="text-blue-600">{batchPreview.totalRecipients}</p>
                      </div>
                      <div>
                        <p className="font-medium">Students</p>
                        <p className="text-blue-600">{batchPreview.studentCount}</p>
                      </div>
                      <div>
                        <p className="font-medium">Parents</p>
                        <p className="text-blue-600">{batchPreview.parentCount}</p>
                      </div>
                      <div>
                        <p className="font-medium">Estimated Cost</p>
                        <p className="text-blue-600">{batchPreview.totalCost} credits</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Balance Information */}
              {balanceInfo && (
                <Card className={`${balanceInfo.hasBalance ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <CardContent className="pt-4">
                    <h4 className="font-medium mb-2">Balance Status</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="font-medium">Current Balance</p>
                        <p className={balanceInfo.hasBalance ? 'text-green-600' : 'text-red-600'}>
                          {balanceInfo.currentBalance} credits
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">Required Credits</p>
                        <p className={balanceInfo.hasBalance ? 'text-green-600' : 'text-red-600'}>
                          {balanceInfo.requiredCredits} credits
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">Status</p>
                        <Badge variant={balanceInfo.hasBalance ? "default" : "destructive"}>
                          {balanceInfo.hasBalance ? 'Sufficient' : 'Insufficient'}
                        </Badge>
                      </div>
                    </div>
                    {balanceInfo.message && (
                      <p className="mt-2 text-sm text-muted-foreground">{balanceInfo.message}</p>
                    )}
                  </CardContent>
                </Card>
              )}

              <Button 
                onClick={() => sendSMSMutation.mutate(smsForm)}
                disabled={sendSMSMutation.isPending || (!selectedTemplate && !smsForm.customMessage) || !batchPreview}
                className="w-full"
              >
                <Send className="w-4 h-4 mr-2" />
                {balanceInfo?.hasBalance === false ? 'Send SMS (Will Save for Later)' : 'Send SMS'}
              </Button>

              {balanceInfo?.hasBalance === false && (
                <p className="text-sm text-amber-600 text-center">
                  ⚠️ Insufficient balance. SMS will be saved and you'll receive an alert instead of popup.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">SMS Templates</h2>
            <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{selectedTemplate ? 'Edit SMS Template' : 'Create SMS Template'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Template Name</Label>
                      <Input
                        value={templateForm.name}
                        onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter template name"
                      />
                    </div>
                    <div>
                      <Label>Template Type</Label>
                      <Select 
                        value={templateForm.type} 
                        onValueChange={(value: any) => setTemplateForm(prev => ({ ...prev, type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="attendance">Attendance</SelectItem>
                          <SelectItem value="exam_result">Exam Result</SelectItem>
                          <SelectItem value="exam_notification">Exam Notification</SelectItem>
                          <SelectItem value="notice">Notice</SelectItem>
                          <SelectItem value="reminder">Reminder</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Description</Label>
                    <Input
                      value={templateForm.description}
                      onChange={(e) => setTemplateForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description of the template"
                    />
                  </div>

                  <div>
                    <Label>SMS Template</Label>
                    <Textarea
                      value={templateForm.template}
                      onChange={(e) => setTemplateForm(prev => ({ ...prev, template: e.target.value }))}
                      placeholder="Enter your SMS template with variables like {{studentName}}"
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Use double curly braces for variables: {"{{variableName}}"}
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between items-center">
                      <Label>Template Variables</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addVariable}>
                        <Plus className="w-4 h-4 mr-1" />
                        Add Variable
                      </Button>
                    </div>
                    <div className="space-y-2 mt-2">
                      {templateForm.variables.map((variable, index) => (
                        <div key={index} className="flex gap-2 items-end">
                          <div className="flex-1">
                            <Input
                              placeholder="Variable name"
                              value={variable.variableName}
                              onChange={(e) => {
                                const newVariables = [...templateForm.variables];
                                newVariables[index].variableName = e.target.value;
                                setTemplateForm(prev => ({ ...prev, variables: newVariables }));
                              }}
                            />
                          </div>
                          <div className="flex-1">
                            <Input
                              placeholder="Description"
                              value={variable.description}
                              onChange={(e) => {
                                const newVariables = [...templateForm.variables];
                                newVariables[index].description = e.target.value;
                                setTemplateForm(prev => ({ ...prev, variables: newVariables }));
                              }}
                            />
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeVariable(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={templateForm.isActive}
                      onCheckedChange={(checked) => setTemplateForm(prev => ({ ...prev, isActive: checked }))}
                    />
                    <Label>Active Template</Label>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => {
                      setTemplateDialogOpen(false);
                      setSelectedTemplate(null);
                      resetTemplateForm();
                    }}>
                      Cancel
                    </Button>
                    <Button onClick={() => {
                      if (selectedTemplate) {
                        editTemplateMutation.mutate(templateForm);
                      } else {
                        createTemplateMutation.mutate(templateForm);
                      }
                    }}>
                      {selectedTemplate ? 'Update Template' : 'Create Template'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template: SMSTemplate) => (
              <Card key={template.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <Badge className={getTypeColor(template.type)}>
                      {template.type}
                    </Badge>
                  </div>
                  {template.description && (
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium">Template:</p>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {template.template}
                      </p>
                    </div>
                    
                    {template.variables && template.variables.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-1">Variables:</p>
                        <div className="flex flex-wrap gap-1">
                          {template.variables.map((variable) => (
                            <Badge key={variable.id} variant="secondary" className="text-xs">
                              {variable.variableName}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      <Badge variant={template.isActive ? "default" : "secondary"}>
                        {template.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedTemplate(template);
                            setPreviewDialogOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedTemplate(template);
                            setTemplateForm({
                              name: template.name,
                              type: template.type,
                              template: template.template,
                              description: template.description || '',
                              isActive: template.isActive,
                              variables: template.variables?.map(v => ({
                                variableName: v.variableName,
                                description: v.description || '',
                                isRequired: v.isRequired,
                                defaultValue: v.defaultValue || ''
                              })) || []
                            });
                            setTemplateDialogOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete the template "${template.name}"?`)) {
                              fetch(`/api/sms/templates/${template.id}`, {
                                method: 'DELETE'
                              })
                              .then(res => res.json())
                              .then(() => {
                                toast({
                                  title: "Success",
                                  description: "Template deleted successfully"
                                });
                                queryClient.invalidateQueries({ queryKey: ['sms-templates'] });
                              })
                              .catch(() => toast({
                                title: "Error",
                                description: "Failed to delete template",
                                variant: "destructive"
                              }));
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Automation Tab */}
        <TabsContent value="automation" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">SMS Automation Rules</h2>
            <Dialog open={automationDialogOpen} onOpenChange={setAutomationDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Automation Rule
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Automation Rule</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Rule Name</Label>
                      <Input
                        value={automationForm.name}
                        onChange={(e) => setAutomationForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter rule name"
                      />
                    </div>
                    <div>
                      <Label>Select Template</Label>
                      <Select 
                        value={automationForm.templateId.toString()} 
                        onValueChange={(value) => setAutomationForm(prev => ({ ...prev, templateId: parseInt(value) }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose template" />
                        </SelectTrigger>
                        <SelectContent>
                          {templates.map((template: SMSTemplate) => (
                            <SelectItem key={template.id} value={template.id.toString()}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Trigger Type</Label>
                      <Select 
                        value={automationForm.triggerType} 
                        onValueChange={(value: any) => setAutomationForm(prev => ({ ...prev, triggerType: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly_exam">Monthly Exam</SelectItem>
                          <SelectItem value="attendance_reminder">Attendance Reminder</SelectItem>
                          <SelectItem value="exam_notification">Exam Notification</SelectItem>
                          <SelectItem value="custom_schedule">Custom Schedule</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Target Audience</Label>
                      <Select 
                        value={automationForm.targetAudience} 
                        onValueChange={(value: any) => setAutomationForm(prev => ({ ...prev, targetAudience: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="students">Students Only</SelectItem>
                          <SelectItem value="parents">Parents Only</SelectItem>
                          <SelectItem value="both">Both Students & Parents</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Target Batch</Label>
                    <Select 
                      value={automationForm.batchId} 
                      onValueChange={(value) => setAutomationForm(prev => ({ ...prev, batchId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select batch (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Batches</SelectItem>
                        {batches.map((batch: Batch) => (
                          <SelectItem key={batch.id} value={batch.id}>
                            {batch.name} - {batch.subject}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {automationForm.triggerType === 'monthly_exam' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Day of Month (1-31)</Label>
                        <Input
                          type="number"
                          min={1}
                          max={31}
                          value={automationForm.scheduleDay}
                          onChange={(e) => setAutomationForm(prev => ({ 
                            ...prev, 
                            scheduleDay: parseInt(e.target.value) || 1 
                          }))}
                        />
                      </div>
                      <div>
                        <Label>Time</Label>
                        <Input
                          type="time"
                          value={automationForm.scheduleTime}
                          onChange={(e) => setAutomationForm(prev => ({ 
                            ...prev, 
                            scheduleTime: e.target.value 
                          }))}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={automationForm.isActive}
                      onCheckedChange={(checked) => setAutomationForm(prev => ({ ...prev, isActive: checked }))}
                    />
                    <Label>Active Rule</Label>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setAutomationDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => createAutomationMutation.mutate(automationForm)}>
                      Create Rule
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {automationRules.map((rule: SMSAutomationRule) => (
              <Card key={rule.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{rule.name}</CardTitle>
                    <Badge className={getTriggerTypeColor(rule.triggerType)}>
                      {rule.triggerType}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium">Target:</p>
                        <p className="text-muted-foreground">{rule.targetAudience}</p>
                      </div>
                      <div>
                        <p className="font-medium">Schedule:</p>
                        <p className="text-muted-foreground">
                          {rule.scheduleDay && rule.scheduleTime && 
                            `Day ${rule.scheduleDay} at ${rule.scheduleTime}`
                          }
                        </p>
                      </div>
                    </div>

                    {rule.lastExecuted && (
                      <div className="text-sm">
                        <p className="font-medium">Last Executed:</p>
                        <p className="text-muted-foreground">
                          {new Date(rule.lastExecuted).toLocaleDateString()}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      <Badge variant={rule.isActive ? "default" : "secondary"}>
                        {rule.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          {/* SMS Scheduler Status */}
          <Card>
            <CardHeader>
              <CardTitle>Automated SMS Scheduler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  onClick={() => {
                    // Fetch scheduler status
                    fetch('/api/sms/scheduler/status')
                      .then(res => res.json())
                      .then(data => {
                        toast({
                          title: "Scheduler Status",
                          description: `Running: ${data.isRunning}, Today: ${data.todayIsMonthEndAlert ? 'Month End Alert Day' : data.todayIsMonthlyResults ? 'Monthly Results Day' : 'Normal Day'}`
                        });
                      })
                      .catch(() => toast({
                        title: "Error",
                        description: "Failed to get scheduler status",
                        variant: "destructive"
                      }));
                  }}
                  variant="outline"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Check Scheduler Status
                </Button>
                
                <Button 
                  onClick={() => {
                    // Test month-end alert
                    fetch('/api/sms/scheduler/trigger-month-end', { method: 'POST' })
                      .then(res => res.json())
                      .then(() => {
                        toast({
                          title: "Test Triggered",
                          description: "Month-end alert test initiated (check console)"
                        });
                      })
                      .catch(() => toast({
                        title: "Error",
                        description: "Failed to trigger test",
                        variant: "destructive"
                      }));
                  }}
                  variant="outline"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Test Month-End Alert
                </Button>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                <h4 className="font-medium text-blue-800">Automated SMS Features</h4>
                <ul className="text-sm text-blue-600 mt-2 space-y-1">
                  <li>• Day-before month-end alerts showing SMS count per batch</li>
                  <li>• Automatic monthly result SMS on first day of new month</li>
                  <li>• Auto-save exam marks when balance insufficient (with alert instead of popup)</li>
                  <li>• Balance validation before sending any SMS</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">SMS Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {balanceInfo?.currentBalance || 0} credits
                </div>
                <p className="text-sm text-muted-foreground">Available for sending</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Monthly Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">0</div>
                <p className="text-sm text-muted-foreground">SMS sent this month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pending SMS</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {monthlyAlert?.totalSMSNeeded || 0}
                </div>
                <p className="text-sm text-muted-foreground">SMS queued for sending</p>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Alert Details */}
          {monthlyAlert?.batchPreviews && monthlyAlert.batchPreviews.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Monthly SMS Requirements by Batch</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {monthlyAlert.batchPreviews.map((batch, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium">{batch.batchName}</p>
                        <p className="text-sm text-muted-foreground">
                          {batch.studentCount} students, {batch.parentCount} parents
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {batch.smsRequired} SMS needed
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>SMS Usage Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Detailed SMS analytics and usage patterns will be available once you start sending messages.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">By Message Type</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Attendance SMS</span>
                      <Badge variant="outline">0</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Exam Results</span>
                      <Badge variant="outline">0</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Notifications</span>
                      <Badge variant="outline">0</Badge>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">By Target Audience</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Students Only</span>
                      <Badge variant="outline">0</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Parents Only</span>
                      <Badge variant="outline">0</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Both Students & Parents</span>
                      <Badge variant="outline">0</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Template Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">{selectedTemplate.name}</h4>
                <Badge className={getTypeColor(selectedTemplate.type)}>
                  {selectedTemplate.type}
                </Badge>
              </div>
              
              <div>
                <Label>Template Content:</Label>
                <div className="mt-1 p-3 bg-muted rounded-md text-sm">
                  {selectedTemplate.template}
                </div>
              </div>

              <div>
                <Label>Preview with Sample Data:</Label>
                <div className="mt-1 p-3 bg-muted rounded-md text-sm">
                  {getTemplatePreview(selectedTemplate)}
                </div>
              </div>

              {selectedTemplate.variables && selectedTemplate.variables.length > 0 && (
                <div>
                  <Label>Variables:</Label>
                  <div className="mt-1 space-y-2">
                    {selectedTemplate.variables.map((variable) => (
                      <div key={variable.id} className="flex justify-between text-sm">
                        <span className="font-medium">{variable.variableName}</span>
                        <span className="text-muted-foreground">
                          {variable.description} {variable.isRequired && '(Required)'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SMSManagement;