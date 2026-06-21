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
    toast.success('請求書設定が保存されました');
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
          <DialogTitle>請求書設定</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Invoice Settings */}
          <div>
            <h4 className="text-sm font-semibold mb-3">顧客向け請求書 (Customer Invoice)</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox id="c-final" checked={settings.customer.showFinalPrice} onCheckedChange={v => updateCustomer('showFinalPrice', v)} />
                <Label htmlFor="c-final" className="text-sm cursor-pointer">最終価格を表示</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="c-tax-detail" checked={settings.customer.hideTaxDetail} onCheckedChange={v => updateCustomer('hideTaxDetail', v)} />
                <Label htmlFor="c-tax-detail" className="text-sm cursor-pointer">税金の詳細を非表示</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="c-tax-info" checked={settings.customer.hideTaxInfo} onCheckedChange={v => updateCustomer('hideTaxInfo', v)} />
                <Label htmlFor="c-tax-info" className="text-sm cursor-pointer">税金情報を非表示</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="c-tax-pct" checked={settings.customer.hideTaxPercentage} onCheckedChange={v => updateCustomer('hideTaxPercentage', v)} />
                <Label htmlFor="c-tax-pct" className="text-sm cursor-pointer">税率パーセンテージを非表示</Label>
              </div>
            </div>
          </div>

          <Separator />

          {/* Internal Invoice Settings */}
          <div>
            <h4 className="text-sm font-semibold mb-3">社内用請求書 (Internal Invoice)</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox id="i-tax" checked={settings.internal.showTax} onCheckedChange={v => updateInternal('showTax', v)} />
                <Label htmlFor="i-tax" className="text-sm cursor-pointer">税金を表示</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="i-base" checked={settings.internal.showBasePrice} onCheckedChange={v => updateInternal('showBasePrice', v)} />
                <Label htmlFor="i-base" className="text-sm cursor-pointer">基本価格を表示</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="i-final" checked={settings.internal.showFinalPrice} onCheckedChange={v => updateInternal('showFinalPrice', v)} />
                <Label htmlFor="i-final" className="text-sm cursor-pointer">最終価格を表示</Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>キャンセル</Button>
          <Button onClick={handleSave}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
