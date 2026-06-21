import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { getInvoiceSettings, saveInvoiceSettings } from '@/lib/invoice-utils';

export default function InvoiceSettings({ open, onClose }) {
  const [settings, setSettings] = useState(getInvoiceSettings());

  const handleSave = () => {
    saveInvoiceSettings(settings);
    toast.success('Pengaturan invoice berhasil disimpan');
    onClose();
  };

  const updateCustomer = (key, value) => {
    setSettings(prev => ({ ...prev, customer: { ...prev.customer, [key]: value } }));
  };

  const updateInternal = (key, value) => {
    setSettings(prev => ({ ...prev, internal: { ...prev.internal, [key]: value } }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Pengaturan Invoice</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Invoice Settings */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Invoice Pelanggan</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox id="c-final" checked={settings.customer.showFinalPrice} onCheckedChange={v => updateCustomer('showFinalPrice', v)} />
                <Label htmlFor="c-final" className="text-sm cursor-pointer">Tampilkan Harga Final</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="c-tax-detail" checked={settings.customer.hideTaxDetail} onCheckedChange={v => updateCustomer('hideTaxDetail', v)} />
                <Label htmlFor="c-tax-detail" className="text-sm cursor-pointer">Sembunyikan Detail Pajak</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="c-tax-info" checked={settings.customer.hideTaxInfo} onCheckedChange={v => updateCustomer('hideTaxInfo', v)} />
                <Label htmlFor="c-tax-info" className="text-sm cursor-pointer">Sembunyikan Informasi Pajak</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="c-tax-pct" checked={settings.customer.hideTaxPercentage} onCheckedChange={v => updateCustomer('hideTaxPercentage', v)} />
                <Label htmlFor="c-tax-pct" className="text-sm cursor-pointer">Sembunyikan Persentase Pajak</Label>
              </div>
            </div>
          </div>

          <Separator />

          {/* Internal Invoice Settings */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Invoice Internal</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox id="i-tax" checked={settings.internal.showTax} onCheckedChange={v => updateInternal('showTax', v)} />
                <Label htmlFor="i-tax" className="text-sm cursor-pointer">Tampilkan Pajak</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="i-base" checked={settings.internal.showBasePrice} onCheckedChange={v => updateInternal('showBasePrice', v)} />
                <Label htmlFor="i-base" className="text-sm cursor-pointer">Tampilkan Harga Dasar</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="i-final" checked={settings.internal.showFinalPrice} onCheckedChange={v => updateInternal('showFinalPrice', v)} />
                <Label htmlFor="i-final" className="text-sm cursor-pointer">Tampilkan Harga Final</Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={handleSave}>Simpan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
