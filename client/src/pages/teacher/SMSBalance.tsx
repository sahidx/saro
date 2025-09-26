import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, CheckCircle, CreditCard, Edit, Plus, Save, Send, MessageSquare, Calculator, Globe, Type, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from "wouter";

interface SMSBalance {
  currentBalance: number;
  totalUsed: number;
  monthlyUsage: number;
  lastUpdated: string;
}

interface SMSTemplate {
  id: number;
  name: string;
  type: 'attendance' | 'exam_result' | 'exam_notification' | 'notice' | 'reminder';
  isActive: boolean;
  template: string;
  description?: string;
  language: 'bengali' | 'english';
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

interface Batch {
  id: string;
  name: string;
  subject: string;
  currentStudents: number;
}

// Language detection utility
const detectLanguage = (text: string): 'bengali' | 'english' => {
  // Bengali Unicode range: \\u0980-\\u09FF
  const bengaliPattern = /[\u0980-\u09FF]/;
  return bengaliPattern.test(text) ? 'bengali' : 'english';
};

// Character count utility with language-specific limits
const getCharacterInfo = (text: string) => {
  const language = detectLanguage(text);
  const charCount = text.length;
  const limit = language === 'bengali' ? 25 : 35; // Extra short limits for templates
  const remaining = limit - charCount;
  const smsCount = Math.ceil(charCount / limit) || 1;
  
  return {
    language,
    charCount,
    limit,
    remaining,
    smsCount,
    isOverLimit: charCount > limit
  };
};

const SMSBalance: React.FC = () => {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('balance');
  const [selectedTemplate, setSelectedTemplate] = useState<SMSTemplate | null>(null);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Template form state
  const [templateForm, setTemplateForm] = useState({
    id: 0,
    name: '',
    type: 'attendance' as SMSTemplate['type'],
    template: '',
    description: '',
    language: 'bengali' as 'bengali' | 'english',
    isActive: true,
    variables: [] as Omit<SMSTemplateVariable, 'id' | 'templateId'>[]
  });

  // SMS test form
  const [smsTestForm, setSmsTestForm] = useState({
    message: '',
    targetBatch: '',
    language: 'bengali' as 'bengali' | 'english'
  });



  // Fetch SMS balance
  const { data: balance, isLoading: balanceLoading } = useQuery({
    queryKey: ['sms-balance'],
    queryFn: async () => {
      const response = await fetch('/api/user/sms-credits');
      if (!response.ok) throw new Error('Failed to fetch balance');
      return response.json();
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Fetch SMS templates
  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['sms-templates'],
    queryFn: async () => {
      const response = await fetch('/api/sms/templates');
      if (!response.ok) throw new Error('Failed to fetch templates');
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

  // Create/Update template mutation
  const saveTemplateMutation = useMutation({
    mutationFn: async (templateData: typeof templateForm) => {
      const url = isEditMode ? `/api/sms/templates/${templateData.id}` : '/api/sms/templates';
      const method = isEditMode ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData)
      });
      if (!response.ok) throw new Error(`Failed to ${isEditMode ? 'update' : 'create'} template`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sms-templates'] });
      setIsTemplateDialogOpen(false);
      setIsEditMode(false);
      resetTemplateForm();
      toast({
        title: "Success",
        description: `Template ${isEditMode ? 'updated' : 'created'} successfully`
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${isEditMode ? 'update' : 'create'} template: ${error.message}`,
        variant: "destructive"
      });
    }
  });



  // Test SMS mutation
  const testSMSMutation = useMutation({
    mutationFn: async (smsData: typeof smsTestForm) => {
      const response = await fetch('/api/sms/test-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(smsData)
      });
      if (!response.ok) throw new Error('Failed to test SMS');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Test SMS sent successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to send test SMS: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Create default templates mutation
  const createDefaultTemplatesMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/sms/templates/create-defaults', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create default templates');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sms-templates'] });
      toast({
        title: "Success",
        description: "Default SMS templates created successfully! You can now edit them as needed."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create default templates: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Reset form function
  const resetTemplateForm = () => {
    setTemplateForm({
      id: 0,
      name: '',
      type: 'attendance',
      template: '',
      description: '',
      language: 'bengali',
      isActive: true,
      variables: []
    });
    setSelectedTemplate(null);
  };

  // Handle template edit
  const handleEditTemplate = (template: SMSTemplate) => {
    setTemplateForm({
      id: template.id,
      name: template.name,
      type: template.type,
      template: template.template,
      description: template.description || '',
      language: template.language,
      isActive: template.isActive,
      variables: template.variables?.map(v => ({
        variableName: v.variableName,
        description: v.description,
        isRequired: v.isRequired,
        defaultValue: v.defaultValue
      })) || []
    });
    setSelectedTemplate(template);
    setIsEditMode(true);
    setIsTemplateDialogOpen(true);
  };

  // Auto-detect language when template text changes
  useEffect(() => {
    if (templateForm.template) {
      const detectedLanguage = detectLanguage(templateForm.template);
      if (detectedLanguage !== templateForm.language) {
        setTemplateForm(prev => ({ ...prev, language: detectedLanguage }));
      }
    }
  }, [templateForm.template]);

  // Auto-detect language when SMS test text changes
  useEffect(() => {
    if (smsTestForm.message) {
      const detectedLanguage = detectLanguage(smsTestForm.message);
      if (detectedLanguage !== smsTestForm.language) {
        setSmsTestForm(prev => ({ ...prev, language: detectedLanguage }));
      }
    }
  }, [smsTestForm.message]);

  // Character info for template
  const templateCharInfo = getCharacterInfo(templateForm.template);
  
  // Character info for SMS test
  const smsTestCharInfo = getCharacterInfo(smsTestForm.message);

  const getLanguageColor = (language: 'bengali' | 'english') => {
    return language === 'bengali' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800';
  };

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

  const currentCredits = 0; // SMS Balance set to 0

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="outline" 
          onClick={() => setLocation('/teacher')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>
        <div>
          <h1 className="text-3xl font-bold">SMS Balance & Template Management</h1>
          <p className="text-muted-foreground">Manage SMS balance, create templates, and test messages with Bengali/English support</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="balance" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            SMS Balance
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Templates
          </TabsTrigger>
        </TabsList>

        {/* SMS Balance Tab */}
        <TabsContent value="balance" className="space-y-6">
          <div className="text-center py-12">
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle className="text-xl flex items-center justify-center gap-2">
                  <CreditCard className="h-6 w-6" />
                  SMS Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-red-600 mb-2">
                  {currentCredits}
                </div>
                <p className="text-gray-600">SMS Credits Available</p>
                <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-sm text-red-700">
                    SMS feature is currently disabled. Balance is set to 0.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>


        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">SMS Templates</h2>
            <div className="flex gap-2">
              {templates.length === 0 && (
                <Button 
                  onClick={() => createDefaultTemplatesMutation.mutate()}
                  disabled={createDefaultTemplatesMutation.isPending}
                  variant="outline"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  {createDefaultTemplatesMutation.isPending ? 'Creating...' : 'Create Default Templates'}
                </Button>
              )}
              <Button onClick={() => {
                resetTemplateForm();
                setIsEditMode(false);
                setIsTemplateDialogOpen(true);
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Create Custom Template
              </Button>
            </div>
          </div>

          {templates.length === 0 ? (
            <Card>
              <CardContent className="text-center py-16">
                <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-6" />
                <h3 className="text-xl font-semibold text-gray-900 mb-4">No SMS Templates Yet</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  Create default templates for attendance, exam notifications, and results, or start from scratch with a custom template.
                </p>
                <div className="flex gap-4 justify-center">
                  <Button 
                    onClick={() => createDefaultTemplatesMutation.mutate()}
                    disabled={createDefaultTemplatesMutation.isPending}
                    size="lg"
                    className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
                  >
                    <MessageSquare className="w-5 h-5 mr-2" />
                    {createDefaultTemplatesMutation.isPending ? 'Creating Default Templates...' : 'Create Default Templates'}
                  </Button>
                  <Button 
                    onClick={() => {
                      resetTemplateForm();
                      setIsEditMode(false);
                      setIsTemplateDialogOpen(true);
                    }}
                    size="lg"
                    variant="outline"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Create Custom Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template: SMSTemplate) => (
              <Card key={template.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <div className="flex gap-2">
                      <Badge className={getTypeColor(template.type)}>
                        {template.type}
                      </Badge>
                      <Badge className={getLanguageColor(template.language)}>
                        {template.language === 'bengali' ? 'বাংলা' : 'English'}
                      </Badge>
                    </div>
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditTemplate(template)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          )}

          {/* Template Create/Edit Dialog */}
          <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {isEditMode ? 'Edit SMS Template' : 'Create SMS Template'}
                </DialogTitle>
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
                  <Label>Description (Optional)</Label>
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
                    className={templateCharInfo.isOverLimit ? 'border-red-500' : ''}
                  />
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <Badge className={getLanguageColor(templateCharInfo.language)}>
                        {templateCharInfo.language === 'bengali' ? 'বাংলা' : 'English'}
                      </Badge>
                      <span className={templateCharInfo.isOverLimit ? 'text-red-600' : 'text-muted-foreground'}>
                        {templateCharInfo.charCount}/{templateCharInfo.limit} chars
                      </span>
                      <span className={templateCharInfo.isOverLimit ? 'text-red-600' : 'text-green-600'}>
                        {templateCharInfo.smsCount} SMS {templateCharInfo.smsCount > 1 ? 'segments' : 'segment'}
                      </span>
                    </div>
                    {templateCharInfo.isOverLimit && (
                      <span className="text-red-600 text-xs flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Over limit by {Math.abs(templateCharInfo.remaining)} chars
                      </span>
                    )}
                  </div>
                  
                  {/* 2 SMS Cost Alert */}
                  {templateForm.template.length > 0 && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="text-sm text-yellow-800 flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" />
                        <strong>SMS Cost Alert:</strong> Each template edit costs 2 SMS credits when saved
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Use double curly braces for variables: {"{{variableName}}"}
                  </p>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => saveTemplateMutation.mutate(templateForm)}
                    disabled={saveTemplateMutation.isPending || !templateForm.name || !templateForm.template}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isEditMode ? 'Update' : 'Create'} Template
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>




      </Tabs>
    </div>
  );
};

export default SMSBalance;
