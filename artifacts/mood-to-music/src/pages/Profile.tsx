import { useEffect } from "react";
import { useGetMe, useUpdateProfile, useChangePassword, useDeleteAccount, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useUser, useClerk } from "@clerk/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { User, Lock, AlertTriangle } from "lucide-react";

const profileSchema = z.object({
  userName: z.string().min(2, "Username must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  mobileNumber: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

const deleteSchema = z.object({
  confirmation: z.string().refine(val => val === "DELETE", {
    message: "You must type DELETE to confirm",
  }),
});

export default function Profile() {
  const { user: clerkUser } = useUser();
  const { signOut } = useClerk();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: me, isLoading: loadingMe } = useGetMe();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();
  const deleteAccount = useDeleteAccount();

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      userName: "",
      email: "",
      mobileNumber: "",
    },
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
    },
  });

  const deleteForm = useForm<z.infer<typeof deleteSchema>>({
    resolver: zodResolver(deleteSchema),
    defaultValues: {
      confirmation: "",
    },
  });

  useEffect(() => {
    if (me) {
      profileForm.reset({
        userName: me.userName,
        email: me.email,
        mobileNumber: me.mobileNumber || "",
      });
    }
  }, [me, profileForm]);

  const onProfileSubmit = (values: z.infer<typeof profileSchema>) => {
    updateProfile.mutate({ data: values }, {
      onSuccess: () => {
        toast({ title: "Profile updated successfully" });
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      },
      onError: () => {
        toast({ title: "Failed to update profile", variant: "destructive" });
      }
    });
  };

  const onPasswordSubmit = (values: z.infer<typeof passwordSchema>) => {
    changePassword.mutate({ data: values }, {
      onSuccess: () => {
        toast({ title: "Password changed successfully" });
        passwordForm.reset();
      },
      onError: () => {
        toast({ title: "Failed to change password", variant: "destructive" });
      }
    });
  };

  const onDeleteSubmit = (values: z.infer<typeof deleteSchema>) => {
    if (values.confirmation !== "DELETE") return;
    
    deleteAccount.mutate({ data: values }, {
      onSuccess: () => {
        toast({ title: "Account deleted" });
        signOut({ redirectUrl: import.meta.env.BASE_URL || "/" });
      },
      onError: () => {
        toast({ title: "Failed to delete account", variant: "destructive" });
      }
    });
  };

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Profile Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences and personal information.</p>
      </div>

      {loadingMe ? (
        <Skeleton className="h-[200px] w-full rounded-2xl" />
      ) : (
        <div className="flex flex-col md:flex-row items-center gap-6 p-8 glass-card bg-transparent rounded-2xl border-white/10">
          <Avatar className="h-32 w-32 border-4 border-primary/20 bg-primary/10">
            <AvatarImage src={clerkUser?.imageUrl} />
            <AvatarFallback className="text-4xl text-primary font-bold">{getInitials(me?.userName)}</AvatarFallback>
          </Avatar>
          <div className="text-center md:text-left space-y-2">
            <h2 className="text-3xl font-bold text-white">{me?.userName}</h2>
            <p className="text-lg text-muted-foreground">{me?.email}</p>
            <p className="text-sm text-primary">Member since {me?.createdAt ? new Date(me.createdAt).toLocaleDateString() : 'recently'}</p>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="glass-card bg-transparent border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <User className="w-5 h-5 text-primary" />
              Edit Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                <FormField
                  control={profileForm.control}
                  name="userName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Username</FormLabel>
                      <FormControl>
                        <Input className="bg-white/5 border-white/10" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Email</FormLabel>
                      <FormControl>
                        <Input type="email" className="bg-white/5 border-white/10" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="mobileNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Mobile Number</FormLabel>
                      <FormControl>
                        <Input className="bg-white/5 border-white/10" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={updateProfile.isPending} className="w-full mt-2">
                  {updateProfile.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="space-y-8">
          <Card className="glass-card bg-transparent border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Lock className="w-5 h-5 text-secondary" />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Current Password</FormLabel>
                        <FormControl>
                          <Input type="password" className="bg-white/5 border-white/10" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">New Password</FormLabel>
                        <FormControl>
                          <Input type="password" className="bg-white/5 border-white/10" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={changePassword.isPending} variant="secondary" className="w-full mt-2 text-secondary-foreground bg-secondary hover:bg-secondary/90">
                    {changePassword.isPending ? "Updating..." : "Update Password"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card className="glass-card bg-destructive/5 border-destructive/20 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-destructive/50" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl text-destructive">
                <AlertTriangle className="w-5 h-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>Permanently delete your account and all data.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...deleteForm}>
                <form onSubmit={deleteForm.handleSubmit(onDeleteSubmit)} className="space-y-4">
                  <FormField
                    control={deleteForm.control}
                    name="confirmation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Type "DELETE" to confirm</FormLabel>
                        <FormControl>
                          <Input 
                            className="bg-black/20 border-destructive/30 focus-visible:ring-destructive text-white placeholder:text-muted-foreground/50" 
                            placeholder="DELETE"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage className="text-destructive font-medium" />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    disabled={deleteAccount.isPending || deleteForm.watch("confirmation") !== "DELETE"} 
                    variant="destructive" 
                    className="w-full mt-2"
                  >
                    {deleteAccount.isPending ? "Deleting..." : "Permanently Delete Account"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
