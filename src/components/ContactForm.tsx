
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const formSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
  subject: z.string().min(5, "Subjek minimal 5 karakter"),
  message: z.string().min(10, "Pesan minimal 10 karakter"),
});

type FormValues = z.infer<typeof formSchema>;

const ContactForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    
    try {
      // Gunakan edge function untuk mengirim pesan
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-contact-form`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Terjadi kesalahan saat mengirim pesan');
      }
      
      // Reset form dan tampilkan notifikasi sukses
      form.reset();
      toast({
        title: "Pesan terkirim!",
        description: "Terima kasih telah menghubungi kami. Kami akan segera membalas pesan Anda.",
      });
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Gagal mengirim pesan",
        description: "Terjadi kesalahan saat mengirim pesan. Silakan coba lagi nanti.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Alternatif metode pengiriman menggunakan help_reports jika edge function gagal
  const onSubmitFallback = async (data: FormValues) => {
    setIsSubmitting(true);
    
    try {
      // Kirim ke help_reports yang sudah memiliki RLS policy yang berfungsi
      const { error } = await supabase
        .from('help_reports')
        .insert([{
          name: data.name,
          email: data.email,
          subject: data.subject,
          message: data.message,
          status: 'pending',
          user_id: (await supabase.auth.getUser()).data.user?.id || null
        }]);

      if (error) {
        throw error;
      }
      
      form.reset();
      toast({
        title: "Pesan terkirim!",
        description: "Terima kasih telah menghubungi kami. Kami akan segera membalas pesan Anda.",
      });
    } catch (error) {
      console.error("Error in fallback method:", error);
      toast({
        title: "Gagal mengirim pesan",
        description: "Terjadi kesalahan saat mengirim pesan. Silakan coba lagi nanti.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nama Lengkap</FormLabel>
                <FormControl>
                  <Input placeholder="Masukkan nama lengkap Anda" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="email@example.com" type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="subject"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subjek</FormLabel>
              <FormControl>
                <Input placeholder="Subjek pesan Anda" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pesan</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Tuliskan pesan Anda di sini" 
                  className="min-h-32" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex gap-4">
          <Button type="submit" className="flex-1" disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Mengirim...
              </span>
            ) : (
              <span className="flex items-center">
                <Send className="h-4 w-4 mr-2" />
                Kirim Pesan
              </span>
            )}
          </Button>
          {form.formState.isValid && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => form.handleSubmit(onSubmitFallback)()}
              disabled={isSubmitting}
              className="flex-1"
            >
              Kirim (Metode Alternatif)
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
};

export default ContactForm;
