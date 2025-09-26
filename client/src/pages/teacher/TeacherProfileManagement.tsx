import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Save, Mail, Phone, Globe, Eye, EyeOff, GraduationCap, Camera, Trash2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const profileFormSchema = z.object({
  displayName: z.string().min(1, "Display name is required"),
  education: z.string().optional(),
  currentPosition: z.string().optional(), 
  specialization: z.string().optional(),
  bio: z.string().optional(),
  avatarUrl: z.string().optional(),
  contactEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  contactPhone: z.string().optional(),
  youtubeChannel: z.string().optional(),
  facebookPage: z.string().optional(),
  isPublic: z.boolean(),
});

type ProfileFormData = z.infer<typeof profileFormSchema>;

export default function TeacherProfileManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: "",
      education: "",
      currentPosition: "",
      specialization: "",
      bio: "",
      avatarUrl: "",
      contactEmail: "",
      contactPhone: "",
      youtubeChannel: "",
      facebookPage: "",
      isPublic: true,
    },
  });

  // Fetch teacher profile
  const { data: profile, isLoading } = useQuery<any>({
    queryKey: ["/api/teacher/profile"],
  });

  // Update form when profile data is loaded
  useEffect(() => {
    if (profile) {
      form.reset({
        displayName: profile.displayName || "",
        education: profile.education || "",
        currentPosition: profile.currentPosition || "",
        specialization: profile.specialization || "",
        bio: profile.bio || "",
        avatarUrl: profile.avatarUrl || "",
        contactEmail: profile.contactEmail || "",
        contactPhone: profile.contactPhone || "",
        youtubeChannel: profile.youtubeChannel || "",
        facebookPage: profile.facebookPage || "",
        isPublic: profile.isPublic !== false,
      });
    }
  }, [profile, form]);

  // Save profile mutation
  const saveProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const response = await fetch("/api/teacher/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to save profile");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teacher-profiles"] });
      setIsEditing(false);
      toast({
        title: "সফল!",
        description: "প্রোফাইল সফলভাবে সংরক্ষিত হয়েছে।",
      });
    },
    onError: () => {
      toast({
        title: "ত্রুটি!",
        description: "প্রোফাইল সংরক্ষণ করতে সমস্যা হয়েছে।",
        variant: "destructive",
      });
    },
  });

  // Profile picture upload mutation
  const uploadPictureMutation = useMutation({
    mutationFn: async (imageData: string) => {
      const response = await fetch("/api/teacher/profile/upload-picture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ imageData }),
      });
      if (!response.ok) throw new Error("Failed to upload picture");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/profile"] });
      toast({
        title: "সফল!",
        description: "প্রোফাইল ছবি সফলভাবে আপলোড হয়েছে।",
      });
    },
    onError: () => {
      toast({
        title: "ত্রুটি!",
        description: "ছবি আপলোড করতে সমস্যা হয়েছে।",
        variant: "destructive",
      });
    },
  });

  // Profile picture delete mutation
  const deletePictureMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/teacher/profile/delete-picture", {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete picture");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/profile"] });
      toast({
        title: "সফল!",
        description: "প্রোফাইল ছবি সফলভাবে মুছে ফেলা হয়েছে।",
      });
    },
    onError: () => {
      toast({
        title: "ত্রুটি!",
        description: "ছবি মুছতে সমস্যা হয়েছে।",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    saveProfileMutation.mutate(data);
  };

  const handlePictureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        uploadPictureMutation.mutate(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePictureDelete = () => {
    deletePictureMutation.mutate();
  };

  const handleCancel = () => {
    if (profile) {
      form.reset({
        displayName: profile.displayName || "",
        education: profile.education || "",
        currentPosition: profile.currentPosition || "",
        specialization: profile.specialization || "",
        bio: profile.bio || "",
        avatarUrl: profile.avatarUrl || "",
        contactEmail: profile.contactEmail || "",
        contactPhone: profile.contactPhone || "",
        youtubeChannel: profile.youtubeChannel || "",
        facebookPage: profile.facebookPage || "",
        isPublic: profile.isPublic !== false,
      });
    }
    setIsEditing(false);
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">প্রোফাইল ব্যবস্থাপনা</h2>
          <p className="text-muted-foreground">
            আপনার শিক্ষক প্রোফাইল তথ্য পরিচালনা করুন
          </p>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            <User className="mr-2 h-4 w-4" />
            প্রোফাইল সম্পাদনা
          </Button>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Profile Picture Management Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                প্রোফাইল ছবি
              </CardTitle>
              <CardDescription>
                আপনার প্রোফাইল ছবি আপলোড ও পরিচালনা করুন
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                {/* Profile Picture Display */}
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                    {profile?.avatarUrl ? (
                      <img 
                        src={profile.avatarUrl} 
                        alt="Profile Picture" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to initials if image fails to load
                          const target = e.currentTarget;
                          const parent = target.parentElement;
                          if (parent) {
                            target.style.display = 'none';
                            const initialsDiv = parent.querySelector('.initials-fallback') as HTMLElement;
                            if (initialsDiv) {
                              initialsDiv.style.display = 'flex';
                            }
                          }
                        }}
                        onLoad={(e) => {
                          // Hide initials when image loads successfully
                          const target = e.currentTarget;
                          const parent = target.parentElement;
                          if (parent) {
                            const initialsDiv = parent.querySelector('.initials-fallback') as HTMLElement;
                            if (initialsDiv) {
                              initialsDiv.style.display = 'none';
                            }
                          }
                        }}
                      />
                    ) : null}
                    <div className={`initials-fallback w-full h-full flex items-center justify-center ${profile?.avatarUrl ? 'hidden' : 'flex'}`}>
                      {profile?.displayName?.charAt(0) || 'B'}
                    </div>
                  </div>
                </div>

                {/* Picture Management Buttons */}
                <div className="flex flex-col space-y-2">
                  <div className="flex space-x-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePictureUpload}
                      className="hidden"
                      id="picture-upload"
                      data-testid="input-picture-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('picture-upload')?.click()}
                      disabled={uploadPictureMutation.isPending}
                      data-testid="button-upload-picture"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {uploadPictureMutation.isPending ? 'আপলোড হচ্ছে...' : 'ছবি আপলোড'}
                    </Button>
                    
                    {profile?.avatarUrl && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handlePictureDelete}
                        disabled={deletePictureMutation.isPending}
                        data-testid="button-delete-picture"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {deletePictureMutation.isPending ? 'মুছে ফেলা হচ্ছে...' : 'ছবি মুছুন'}
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    JPG, PNG বা GIF ফরম্যাট সাপোর্ট করে। সর্বোচ্চ ৫MB।
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                মূল তথ্য
              </CardTitle>
              <CardDescription>
                আপনার প্রাথমিক প্রোফাইল তথ্য
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>প্রদর্শন নাম *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Belal Sir" 
                          {...field} 
                          disabled={!isEditing}
                          data-testid="input-display-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="education"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>শিক্ষাগত যোগ্যতা</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Graduate from Rajshahi University" 
                        {...field} 
                        disabled={!isEditing}
                        data-testid="input-education"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currentPosition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>বর্তমান পদবী</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Teacher at Jahangirpur Girls School and College" 
                        {...field} 
                        disabled={!isEditing}
                        data-testid="input-position"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="specialization"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>বিশেষত্ব</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Specialist in Chemistry & ICT" 
                        {...field} 
                        disabled={!isEditing}
                        data-testid="input-specialization"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>জীবনী</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="আপনার সম্পর্কে বিস্তারিত লিখুন..."
                        rows={4}
                        {...field} 
                        disabled={!isEditing}
                        data-testid="textarea-bio"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                যোগাযোগের তথ্য
              </CardTitle>
              <CardDescription>
                ছাত্রছাত্রীরা আপনার সাথে যোগাযোগ করতে ব্যবহার করবে
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ইমেইল</FormLabel>
                      <FormControl>
                        <Input 
                          type="email"
                          placeholder="belal.sir@chemistry-ict.edu.bd" 
                          {...field} 
                          disabled={!isEditing}
                          data-testid="input-contact-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ফোন নম্বর</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="01712345678" 
                          {...field} 
                          disabled={!isEditing}
                          data-testid="input-contact-phone"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="youtubeChannel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ইউটিউব চ্যানেল</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://youtube.com/@BelalSirChemistry" 
                          {...field} 
                          disabled={!isEditing}
                          data-testid="input-youtube-channel"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="facebookPage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ফেসবুক পেজ</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://facebook.com/BelalSirChemistry" 
                          {...field} 
                          disabled={!isEditing}
                          data-testid="input-facebook-page"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>প্রোফাইল দৃশ্যমানতা</CardTitle>
              <CardDescription>
                আপনার প্রোফাইল সবার জন্য দেখা যাবে কি না তা নির্ধারণ করুন
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge variant={form.watch("isPublic") ? "default" : "secondary"}>
                    {form.watch("isPublic") ? (
                      <><Eye className="h-3 w-3 mr-1" /> প্রকাশ্য</>
                    ) : (
                      <><EyeOff className="h-3 w-3 mr-1" /> ব্যক্তিগত</>
                    )}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {form.watch("isPublic") 
                      ? "আপনার প্রোফাইল ল্যান্ডিং পেজে দেখা যাবে"
                      : "আপনার প্রোফাইল শুধুমাত্র আপনি দেখতে পাবেন"
                    }
                  </span>
                </div>
                {isEditing && (
                  <input
                    type="checkbox"
                    checked={form.watch("isPublic")}
                    onChange={(e) => form.setValue("isPublic", e.target.checked)}
                    className="rounded border-gray-300"
                    data-testid="checkbox-public"
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {isEditing && (
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={handleCancel}>
                বাতিল
              </Button>
              <Button type="submit" disabled={saveProfileMutation.isPending}>
                <Save className="mr-2 h-4 w-4" />
                সংরক্ষণ করুন
              </Button>
            </div>
          )}
        </form>
      </Form>

      {!isEditing && !profile && (
        <Card className="p-8 text-center">
          <CardContent>
            <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">প্রোফাইল তৈরি করুন</h3>
            <p className="text-muted-foreground mb-4">
              আপনার শিক্ষক প্রোফাইল তৈরি করে ছাত্রছাত্রীদের কাছে নিজেকে তুলে ধরুন।
            </p>
            <Button onClick={() => setIsEditing(true)}>
              <User className="mr-2 h-4 w-4" />
              প্রোফাইল তৈরি করুন
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
