import { CyberLayout } from "@/components/CyberLayout";
import { useSettings, useUpdateSettings } from "@/hooks/use-settings";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBotSettingsSchema, type InsertBotSettings } from "@shared/schema";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useEffect } from "react";
import { Save, Loader2, GitCommit } from "lucide-react";
import { motion } from "framer-motion";

export default function Settings() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();

  const form = useForm<InsertBotSettings>({
    resolver: zodResolver(insertBotSettingsSchema),
    defaultValues: {
      ownerNumber: "",
      botName: "Boss",
      autoRead: false,
      autoStatusRead: false,
      publicMode: true,
    },
  });

  // Reset form when settings are loaded
  useEffect(() => {
    if (settings) {
      form.reset(settings);
    }
  }, [settings, form]);

  function onSubmit(data: InsertBotSettings) {
    updateSettings.mutate(data);
  }

  if (isLoading) {
    return (
      <CyberLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <div className="text-primary font-mono flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 animate-spin" />
            <span className="animate-pulse">DECRYPTING CONFIGURATION...</span>
          </div>
        </div>
      </CyberLayout>
    );
  }

  return (
    <CyberLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl mb-2">Bot Settings</h2>
          <p className="text-muted-foreground font-mono text-sm border-l-2 border-primary pl-4">
            Manage your bot identity and behavior. Changes apply immediately to active runtime.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            {/* General Settings Section */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="cyber-card p-6"
            >
              <div className="flex items-center gap-2 mb-6 text-xl text-secondary">
                <GitCommit className="w-5 h-5" />
                <h3>Core Identity</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="botName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-primary font-mono uppercase text-xs">Unit Designation (Bot Name)</FormLabel>
                      <FormControl>
                        <Input className="cyber-input" placeholder="Boss" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage className="text-red-500 font-mono text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ownerNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-primary font-mono uppercase text-xs">Admin Contact (Owner Number)</FormLabel>
                      <FormControl>
                        <Input className="cyber-input" placeholder="628123456789" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormDescription className="text-xs text-muted-foreground/60">
                        Include country code without symbols (e.g. 6281...)
                      </FormDescription>
                      <FormMessage className="text-red-500 font-mono text-xs" />
                    </FormItem>
                  )}
                />
              </div>
            </motion.div>

            {/* Behavior Settings Section */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="cyber-card p-6"
            >
              <div className="flex items-center gap-2 mb-6 text-xl text-secondary">
                <GitCommit className="w-5 h-5" />
                <h3>Behavior Protocols</h3>
              </div>

              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="publicMode"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-primary/20 bg-black/40 p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base text-white">Public Access Mode</FormLabel>
                        <FormDescription className="font-mono text-xs">
                          Allow non-admin users to interact with bot commands.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value || false}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-primary"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="autoRead"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-primary/20 bg-black/40 p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base text-white">Auto-Read Messages</FormLabel>
                        <FormDescription className="font-mono text-xs">
                          Automatically mark all incoming messages as read (Blue Tick).
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value || false}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-primary"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="autoStatusRead"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-primary/20 bg-black/40 p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base text-white">Status Interceptor</FormLabel>
                        <FormDescription className="font-mono text-xs">
                          Automatically view/read contacts' status updates.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value || false}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-primary"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </motion.div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={updateSettings.isPending}
                className="cyber-button flex items-center gap-2"
              >
                {updateSettings.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                Commit Changes
              </button>
            </div>
          </form>
        </Form>
      </div>
    </CyberLayout>
  );
}
