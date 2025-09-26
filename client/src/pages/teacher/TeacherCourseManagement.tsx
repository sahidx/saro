import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Edit3, Trash2, BookOpen, FlaskConical, Monitor, GraduationCap, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

const courseFormSchema = z.object({
  title: z.string().min(1, "Course title is required"),
  titleBangla: z.string().min(1, "Bengali title is required"),
  description: z.string().min(1, "Description is required"),
  subject: z.enum(["chemistry", "ict"]),
  targetClass: z.string().min(1, "Target class is required"),
  iconName: z.string().min(1, "Icon is required"),
  colorScheme: z.string().min(1, "Color scheme is required"),
  displayOrder: z.number().min(0, "Display order must be non-negative"),
  isActive: z.boolean(),
});

type CourseFormData = z.infer<typeof courseFormSchema>;

export default function TeacherCourseManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);

  const form = useForm<CourseFormData>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      title: "",
      titleBangla: "",
      description: "",
      subject: "chemistry",
      targetClass: "",
      iconName: "FlaskConical",
      colorScheme: "cyan",
      displayOrder: 0,
      isActive: true,
    },
  });

  // Fetch courses
  const { data: courses = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/teacher/courses"],
  });

  // Create course mutation
  const createCourseMutation = useMutation({
    mutationFn: async (data: CourseFormData) => {
      const response = await fetch("/api/teacher/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create course");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "সফল!",
        description: "কোর্স সফলভাবে তৈরি হয়েছে।",
      });
    },
    onError: () => {
      toast({
        title: "ত্রুটি!",
        description: "কোর্স তৈরি করতে সমস্যা হয়েছে।",
        variant: "destructive",
      });
    },
  });

  // Update course mutation
  const updateCourseMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CourseFormData> }) => {
      const response = await fetch(`/api/teacher/courses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update course");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      setEditingCourse(null);
      form.reset();
      toast({
        title: "সফল!",
        description: "কোর্স সফলভাবে আপডেট হয়েছে।",
      });
    },
    onError: () => {
      toast({
        title: "ত্রুটি!",
        description: "কোর্স আপডেট করতে সমস্যা হয়েছে।",
        variant: "destructive",
      });
    },
  });

  // Delete course mutation
  const deleteCourseMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/teacher/courses/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete course");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({
        title: "সফল!",
        description: "কোর্স সফলভাবে মুছে ফেলা হয়েছে।",
      });
    },
    onError: () => {
      toast({
        title: "ত্রুটি!",
        description: "কোর্স মুছতে সমস্যা হয়েছে।",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CourseFormData) => {
    if (editingCourse) {
      updateCourseMutation.mutate({ id: editingCourse.id, data });
    } else {
      createCourseMutation.mutate(data);
    }
  };

  const handleEdit = (course: any) => {
    setEditingCourse(course);
    form.reset({
      title: course.title,
      titleBangla: course.titleBangla,
      description: course.description,
      subject: course.subject,
      targetClass: course.targetClass,
      iconName: course.iconName,
      colorScheme: course.colorScheme,
      displayOrder: course.displayOrder,
      isActive: course.isActive,
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = (courseId: string) => {
    if (confirm("আপনি কি নিশ্চিত যে এই কোর্সটি মুছে ফেলতে চান?")) {
      deleteCourseMutation.mutate(courseId);
    }
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "FlaskConical": return <FlaskConical className="h-6 w-6" />;
      case "Monitor": return <Monitor className="h-6 w-6" />;
      case "BookOpen": return <BookOpen className="h-6 w-6" />;
      case "GraduationCap": return <GraduationCap className="h-6 w-6" />;
      default: return <FlaskConical className="h-6 w-6" />;
    }
  };

  const getColorClass = (colorScheme: string) => {
    switch (colorScheme) {
      case "cyan": return "from-cyan-500 to-cyan-600";
      case "purple": return "from-purple-500 to-purple-600";
      case "green": return "from-green-500 to-green-600";
      case "yellow": return "from-yellow-500 to-yellow-600";
      case "red": return "from-red-500 to-red-600";
      case "blue": return "from-blue-500 to-blue-600";
      default: return "from-cyan-500 to-cyan-600";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Back button */}
      <div className="flex items-center space-x-4 mb-4">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setLocation('/teacher')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          data-testid="button-back-to-dashboard"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Button>
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">কোর্স ব্যবস্থাপনা</h2>
          <p className="text-muted-foreground">
            আপনার কোচিং সেন্টারের কোর্সগুলি পরিচালনা করুন
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingCourse(null); form.reset(); }}>
              <Plus className="mr-2 h-4 w-4" />
              নতুন কোর্স
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingCourse ? "কোর্স সম্পাদনা" : "নতুন কোর্স তৈরি"}
              </DialogTitle>
              <DialogDescription>
                কোর্সের বিস্তারিত তথ্য দিন।
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>কোর্সের নাম (ইংরেজি)</FormLabel>
                        <FormControl>
                          <Input placeholder="Chemistry 9-10" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="titleBangla"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>কোর্সের নাম (বাংলা)</FormLabel>
                        <FormControl>
                          <Input placeholder="রসায়ন (নবম-দশম)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>বিবরণ</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="কোর্সের বিস্তারিত বিবরণ লিখুন..."
                          rows={3}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>বিষয়</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="বিষয় নির্বাচন" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="chemistry">রসায়ন</SelectItem>
                            <SelectItem value="ict">তথ্য ও যোগাযোগ প্রযুক্তি</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="targetClass"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>লক্ষ্য শ্রেণী</FormLabel>
                        <FormControl>
                          <Input placeholder="9-10" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="displayOrder"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>প্রদর্শন ক্রম</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="iconName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>আইকন</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="আইকন নির্বাচন" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="FlaskConical">FlaskConical</SelectItem>
                            <SelectItem value="Monitor">Monitor</SelectItem>
                            <SelectItem value="BookOpen">BookOpen</SelectItem>
                            <SelectItem value="GraduationCap">GraduationCap</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="colorScheme"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>রঙের স্কিম</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="রং নির্বাচন" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="cyan">Cyan</SelectItem>
                            <SelectItem value="purple">Purple</SelectItem>
                            <SelectItem value="green">Green</SelectItem>
                            <SelectItem value="yellow">Yellow</SelectItem>
                            <SelectItem value="red">Red</SelectItem>
                            <SelectItem value="blue">Blue</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={form.watch("isActive")}
                    onChange={(e) => form.setValue("isActive", e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium">
                    কোর্সটি সক্রিয় রাখুন
                  </label>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    বাতিল
                  </Button>
                  <Button type="submit" disabled={createCourseMutation.isPending || updateCourseMutation.isPending}>
                    {editingCourse ? "আপডেট করুন" : "তৈরি করুন"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <Card key={course.id} className="group hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${getColorClass(course.colorScheme)} text-white`}>
                  {getIcon(course.iconName)}
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={course.isActive ? "default" : "secondary"}>
                    {course.isActive ? (
                      <><Eye className="h-3 w-3 mr-1" /> সক্রিয়</>
                    ) : (
                      <><EyeOff className="h-3 w-3 mr-1" /> নিষ্ক্রিয়</>
                    )}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(course)}
                    data-testid={`edit-course-${course.id}`}
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(course.id)}
                    data-testid={`delete-course-${course.id}`}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardTitle className="text-lg">{course.titleBangla}</CardTitle>
              <CardDescription>{course.title}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                {course.description}
              </p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>শ্রেণী: {course.targetClass}</span>
                <span>ক্রম: {course.displayOrder}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {courses.length === 0 && (
        <Card className="p-8 text-center">
          <CardContent>
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">কোনো কোর্স নেই</h3>
            <p className="text-muted-foreground mb-4">
              আপনার প্রথম কোর্স তৈরি করে শুরু করুন।
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              প্রথম কোর্স তৈরি করুন
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
