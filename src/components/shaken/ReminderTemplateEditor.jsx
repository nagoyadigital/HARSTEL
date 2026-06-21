import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { MessageCircle, Mail, Smartphone, Info } from 'lucide-react';
import { getTemplates, saveTemplates } from '@/lib/shaken-reminder-engine';

const VARIABLES = [
  { key: '{nama_pelanggan}', desc: 'Nama pelanggan' },
  { key: '{plat_nomor}', desc: 'Nomor plat kendaraan' },
  { key: '{merk}', desc: 'Merk kendaraan' },
  { key: '{model}', desc: 'Model kendaraan' },
  { key: '{tanggal_kadaluarsa}', desc: 'Tanggal kadaluarsa Shaken' },
  { key: '{sisa_hari}', desc: 'Sisa hari sebelum kadaluarsa' },
];

export default function ReminderTemplateEditor({ open, onClose }) {
  const [templates, setTemplates] = useState(getTemplates());

  const handleSave = () => {
    saveTemplates(templates);
    toast.success('Template reminder berhasil disimpan');
    onClose();
  };

  const updateTemplate = (method, value) => {
    setTemplates(prev => ({ ...prev, [method]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Template Pesan Reminder</DialogTitle>
        </DialogHeader>

        {/* Variable Reference */}
        <div className="bg-muted/30 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Info className="w-3.5 h-3.5 text-muted-foreground" />
            <p className="text-xs font-semibold text-muted-foreground">Variable yang tersedia:</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {VARIABLES.map(v => (
              <span key={v.key} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-mono">
                {v.key}
              </span>
            ))}
          </div>
        </div>

        <Tabs defaultValue="whatsapp">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="whatsapp" className="gap-1.5">
              <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
            </TabsTrigger>
            <TabsTrigger value="email" className="gap-1.5">
              <Mail className="w-3.5 h-3.5" /> Email
            </TabsTrigger>
            <TabsTrigger value="sms" className="gap-1.5">
              <Smartphone className="w-3.5 h-3.5" /> SMS
            </TabsTrigger>
          </TabsList>

          <TabsContent value="whatsapp" className="mt-4">
            <div className="space-y-2">
              <Label>Template WhatsApp</Label>
              <Textarea
                value={templates.whatsapp}
                onChange={e => updateTemplate('whatsapp', e.target.value)}
                rows={12}
                className="font-mono text-xs"
              />
            </div>
          </TabsContent>

          <TabsContent value="email" className="mt-4">
            <div className="space-y-2">
              <Label>Template Email</Label>
              <Textarea
                value={templates.email}
                onChange={e => updateTemplate('email', e.target.value)}
                rows={12}
                className="font-mono text-xs"
              />
            </div>
          </TabsContent>

          <TabsContent value="sms" className="mt-4">
            <div className="space-y-2">
              <Label>Template SMS</Label>
              <Textarea
                value={templates.sms}
                onChange={e => updateTemplate('sms', e.target.value)}
                rows={6}
                className="font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground">Maks 160 karakter untuk 1 SMS.</p>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={handleSave}>Simpan Template</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
