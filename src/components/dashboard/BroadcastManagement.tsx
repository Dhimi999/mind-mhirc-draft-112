
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from "@/components/ui/badge";
import { Megaphone, Clock, Send, Users, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";

type Broadcast = Tables<'broadcasts'>;

const BroadcastManagement = () => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [recipient, setRecipient] = useState('all');
  const [priority, setPriority] = useState('regular');
  const [activeTab, setActiveTab] = useState('compose');
  const [isSending, setIsSending] = useState(false);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch broadcasts from Supabase
  useEffect(() => {
    const fetchBroadcasts = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('broadcasts')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        setBroadcasts(data || []);
      } catch (err) {
        console.error('Error fetching broadcasts:', err);
        setError('Gagal memuat siaran. Silakan coba lagi nanti.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBroadcasts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !message.trim()) {
      toast.error('Judul dan pesan tidak boleh kosong');
      return;
    }
    
    setIsSending(true);
    
    try {
      // Save to Supabase
      const { data, error } = await supabase
        .from('broadcasts')
        .insert([
          { 
            title, 
            content: message, 
            recipients: [recipient], 
            priority, 
            created_by: user?.id || null 
          }
        ])
        .select();
      
      if (error) throw error;
      
      // Add the new broadcast to state
      if (data && data.length > 0) {
        setBroadcasts([data[0], ...broadcasts]);
      }
      
      // Reset form
      setTitle('');
      setMessage('');
      setRecipient('all');
      setPriority('regular');
      
      // Switch to history tab
      setActiveTab('history');
      
      toast.success('Siaran berhasil dikirim');
    } catch (err) {
      console.error('Error sending broadcast:', err);
      toast.error('Gagal mengirim siaran. Silakan coba lagi.');
    } finally {
      setIsSending(false);
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="outline" className="bg-red-50 text-red-500 border-red-200">Penting</Badge>;
      case 'regular':
        return <Badge variant="outline" className="bg-blue-50 text-blue-500 border-blue-200">Reguler</Badge>;
      default:
        return <Badge variant="outline">Reguler</Badge>;
    }
  };

  const getRecipientBadge = (recipients: string[]) => {
    if (recipients.includes('all')) {
      return <Badge variant="outline" className="bg-purple-50 text-purple-500 border-purple-200">Semua Pengguna</Badge>;
    } else if (recipients.includes('users')) {
      return <Badge variant="outline" className="bg-green-50 text-green-500 border-green-200">Pengguna Reguler</Badge>;
    } else if (recipients.includes('professionals')) {
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-500 border-yellow-200">Profesional</Badge>;
    } else {
      return <Badge variant="outline">Kustom</Badge>;
    }
  };

  // Loading state
  const renderLoadingState = () => (
    <div className="space-y-4">
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-gray-200 rounded w-1/4"></div>
        <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  );

  // Error state
  const renderErrorState = () => (
    <div className="bg-card shadow-soft rounded-xl p-6 text-center">
      <p className="text-red-500 mb-4">{error}</p>
      <Button onClick={() => setActiveTab('compose')} variant="outline">
        Kembali ke Buat Siaran
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold mb-6">Manajemen Siaran</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="compose">Buat Siaran</TabsTrigger>
          <TabsTrigger value="history">Riwayat Siaran</TabsTrigger>
        </TabsList>
        
        <TabsContent value="compose" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Buat Siaran Baru</CardTitle>
              <CardDescription>
                Kirim pesan ke semua pengguna atau grup tertentu.
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Judul</Label>
                    <Input 
                      id="title" 
                      value={title} 
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Masukkan judul siaran" 
                      required 
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="recipient">Penerima</Label>
                    <Select value={recipient} onValueChange={setRecipient}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih penerima" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Pengguna</SelectItem>
                        <SelectItem value="users">Pengguna Reguler</SelectItem>
                        <SelectItem value="professionals">Profesional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="priority">Prioritas</Label>
                    <Select value={priority} onValueChange={setPriority}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih prioritas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="regular">Reguler</SelectItem>
                        <SelectItem value="high">Penting</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="message">Pesan</Label>
                    <Textarea 
                      id="message" 
                      value={message} 
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tulis pesan siaran Anda di sini" 
                      className="min-h-32" 
                      required 
                    />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button type="submit" disabled={isSending}>
                    {isSending ? (
                      <>
                        <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                        Mengirim...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Kirim Siaran
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Riwayat Siaran</CardTitle>
              <CardDescription>
                Lihat siaran yang telah dibuat sebelumnya.
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {loading ? (
                renderLoadingState()
              ) : error ? (
                renderErrorState()
              ) : broadcasts.length === 0 ? (
                <p className="text-center text-muted-foreground">Belum ada siaran yang dibuat.</p>
              ) : (
                <div className="space-y-6">
                  {broadcasts.map((broadcast) => (
                    <div key={broadcast.id} className="rounded-lg border p-4 space-y-4">
                      <div className="flex flex-wrap justify-between gap-2">
                        <div className="space-y-1">
                          <h3 className="font-medium">{broadcast.title}</h3>
                          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <Clock className="mr-1 h-4 w-4" />
                              <span>{formatDate(broadcast.created_at)}</span>
                            </div>
                            <div className="flex items-center">
                              <User className="mr-1 h-4 w-4" />
                              <span>Administrator</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2">
                          {getPriorityBadge(broadcast.priority)}
                          {getRecipientBadge(broadcast.recipients || [])}
                        </div>
                      </div>
                      
                      <p className="text-muted-foreground text-sm">{broadcast.content}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>
                            {broadcast.recipients?.includes('all') 
                              ? 'Dikirim ke semua pengguna' 
                              : broadcast.recipients?.includes('users')
                                ? 'Dikirim ke pengguna reguler'
                                : 'Dikirim ke profesional'}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-green-50 text-green-500 border-green-200">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Terkirim
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BroadcastManagement;
