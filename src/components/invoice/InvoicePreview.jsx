import React, { useRef, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Download, X, Wrench } from 'lucide-react';
import { COMPANY_INFO, generateInvoiceNumber, calculateInvoiceTotals, getInvoiceSettings } from '@/lib/invoice-utils';
import { formatDateJP } from '@/lib/date-utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export default function InvoicePreview({ workOrder, open, onClose }) {
  const printRef = useRef(null);
  const [invoiceNumber] = useState(generateInvoiceNumber());
  const settings = getInvoiceSettings();

  // Fetch vehicle details
  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => base44.entities.Vehicle.list(),
  });
  const vehicle = vehicles.find(v => v.id === workOrder.vehicle_id);

  // Fetch customer details
  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list(),
  });
  const customer = customers.find(c => c.id === workOrder.customer_id);

  const items = workOrder.items || [];
  const totals = calculateInvoiceTotals(items, settings.taxRate || 0.10);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html><head><title>請求書 - ${invoiceNumber}</title>
      <style>
        @page { size: A4 portrait; margin: 15mm; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Yu Gothic', 'Meiryo', 'Hiragino Sans', sans-serif; font-size: 10px; color: #1a1a1a; line-height: 1.5; }
        .invoice-container { width: 100%; max-width: 210mm; padding: 10mm; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
        .company-info { font-size: 9px; color: #555; }
        .company-name { font-size: 16px; font-weight: 700; color: #c41e3a; margin-bottom: 4px; }
        .invoice-title { text-align: center; margin: 15px 0 20px; }
        .invoice-title h1 { font-size: 22px; font-weight: 700; letter-spacing: 8px; }
        .invoice-title p { font-size: 11px; color: #666; margin-top: 2px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px; }
        .info-box { border: 1px solid #ddd; border-radius: 4px; padding: 10px; }
        .info-box h3 { font-size: 10px; font-weight: 600; color: #c41e3a; margin-bottom: 6px; border-bottom: 1px solid #eee; padding-bottom: 4px; }
        .info-row { display: flex; justify-content: space-between; font-size: 9.5px; padding: 2px 0; }
        .info-row .label { color: #666; }
        .info-row .value { font-weight: 500; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th { background: #1a1a1a; color: white; padding: 8px 6px; font-size: 9px; text-align: left; font-weight: 600; }
        td { padding: 7px 6px; border-bottom: 1px solid #eee; font-size: 9.5px; }
        tr:nth-child(even) { background: #fafafa; }
        .text-right { text-align: right; }
        .total-section { margin-top: 10px; border-top: 2px solid #1a1a1a; padding-top: 10px; }
        .total-row { display: flex; justify-content: flex-end; gap: 30px; padding: 4px 0; font-size: 10px; }
        .total-row.grand { font-size: 14px; font-weight: 700; color: #c41e3a; border-top: 1px solid #ddd; padding-top: 8px; margin-top: 4px; }
        .notes-section { margin-top: 20px; border: 1px solid #ddd; border-radius: 4px; padding: 10px; }
        .notes-section h3 { font-size: 10px; font-weight: 600; margin-bottom: 6px; color: #c41e3a; }
        .notes-section p { font-size: 9px; color: #555; white-space: pre-line; }
        .footer { margin-top: 25px; text-align: center; font-size: 8px; color: #999; border-top: 1px solid #eee; padding-top: 10px; }
        .logo-icon { width: 36px; height: 36px; background: #c41e3a; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-bottom: 6px; }
        .logo-icon svg { width: 20px; height: 20px; fill: white; }
      </style></head><body>
      ${content.innerHTML}
      </body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 300);
  };

  const handleSavePDF = () => {
    // Uses browser's Print to PDF functionality
    handlePrint();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto p-0">
        {/* Toolbar */}
        <div className="sticky top-0 z-10 bg-card border-b border-border p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-sm">Preview Invoice</h2>
            <span className="text-xs text-muted-foreground font-mono">{invoiceNumber}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={handlePrint}>
              <Printer className="w-3.5 h-3.5" /> Print
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={handleSavePDF}>
              <Download className="w-3.5 h-3.5" /> PDF
            </Button>
            <Button size="sm" variant="ghost" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Invoice Content (A4 Preview) */}
        <div className="p-6 bg-muted/20">
          <div ref={printRef} className="bg-white text-black mx-auto shadow-lg" style={{ width: '210mm', minHeight: '297mm', padding: '15mm', fontSize: '10px', fontFamily: "'Yu Gothic', 'Meiryo', sans-serif" }}>
            <div className="invoice-container">

              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <div style={{ width: '36px', height: '36px', background: '#c41e3a', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '6px' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                    </svg>
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: '#c41e3a' }}>{COMPANY_INFO.name}</div>
                  <div style={{ fontSize: '9px', color: '#555', marginTop: '4px' }}>
                    <p>{COMPANY_INFO.postal}</p>
                    <p>{COMPANY_INFO.address}</p>
                    <p>TEL: {COMPANY_INFO.tel} / FAX: {COMPANY_INFO.fax}</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '9px', color: '#555' }}>
                  <p><strong>Invoice No:</strong> {invoiceNumber}</p>
                  <p><strong>発行日:</strong> {formatDateJP(new Date())}</p>
                  <p><strong>ステータス:</strong> {workOrder.status}</p>
                </div>
              </div>

              {/* Title */}
              <div style={{ textAlign: 'center', margin: '15px 0 25px' }}>
                <h1 style={{ fontSize: '22px', fontWeight: '700', letterSpacing: '8px' }}>請求書</h1>
                <p style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>INVOICE</p>
              </div>

              {/* Customer & Vehicle Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                {/* Customer */}
                <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '10px' }}>
                  <h3 style={{ fontSize: '10px', fontWeight: '600', color: '#c41e3a', marginBottom: '6px', borderBottom: '1px solid #eee', paddingBottom: '4px' }}>顧客情報</h3>
                  <div style={{ fontSize: '9.5px' }}>
                    <p><strong>{workOrder.customer_name || customer?.name || '-'}</strong></p>
                    {customer?.phone && <p>TEL: {customer.phone}</p>}
                    {customer?.address && <p>{customer.address}</p>}
                  </div>
                </div>

                {/* Vehicle */}
                <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '10px' }}>
                  <h3 style={{ fontSize: '10px', fontWeight: '600', color: '#c41e3a', marginBottom: '6px', borderBottom: '1px solid #eee', paddingBottom: '4px' }}>車両情報</h3>
                  <div style={{ fontSize: '9.5px' }}>
                    <p><strong>{vehicle?.plate_number || workOrder.vehicle_info || '-'}</strong></p>
                    <p>{vehicle?.brand} {vehicle?.model} ({vehicle?.year || '-'})</p>
                    {vehicle?.last_odometer && <p>走行距離: {vehicle.last_odometer.toLocaleString()} km</p>}
                    {vehicle?.chassis_number && <p>車台番号: {vehicle.chassis_number}</p>}
                    {vehicle?.engine_number && <p>エンジン: {vehicle.engine_number}</p>}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', margin: '15px 0' }}>
                <thead>
                  <tr>
                    <th style={{ background: '#1a1a1a', color: 'white', padding: '8px 6px', fontSize: '9px', textAlign: 'left', fontWeight: '600' }}>No</th>
                    <th style={{ background: '#1a1a1a', color: 'white', padding: '8px 6px', fontSize: '9px', textAlign: 'left', fontWeight: '600' }}>項目名</th>
                    <th style={{ background: '#1a1a1a', color: 'white', padding: '8px 6px', fontSize: '9px', textAlign: 'left', fontWeight: '600' }}>区分</th>
                    <th style={{ background: '#1a1a1a', color: 'white', padding: '8px 6px', fontSize: '9px', textAlign: 'right', fontWeight: '600' }}>数量</th>
                    <th style={{ background: '#1a1a1a', color: 'white', padding: '8px 6px', fontSize: '9px', textAlign: 'right', fontWeight: '600' }}>単価 (¥)</th>
                    <th style={{ background: '#1a1a1a', color: 'white', padding: '8px 6px', fontSize: '9px', textAlign: 'right', fontWeight: '600' }}>金額 (¥)</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length > 0 ? items.map((item, idx) => (
                    <tr key={idx} style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td style={{ padding: '7px 6px', borderBottom: '1px solid #eee', fontSize: '9.5px' }}>{idx + 1}</td>
                      <td style={{ padding: '7px 6px', borderBottom: '1px solid #eee', fontSize: '9.5px', fontWeight: '500' }}>{item.name}</td>
                      <td style={{ padding: '7px 6px', borderBottom: '1px solid #eee', fontSize: '9.5px' }}>{item.type === 'service' ? '作業' : '部品'}</td>
                      <td style={{ padding: '7px 6px', borderBottom: '1px solid #eee', fontSize: '9.5px', textAlign: 'right' }}>{item.qty}</td>
                      <td style={{ padding: '7px 6px', borderBottom: '1px solid #eee', fontSize: '9.5px', textAlign: 'right' }}>{(item.price || 0).toLocaleString('ja-JP')}</td>
                      <td style={{ padding: '7px 6px', borderBottom: '1px solid #eee', fontSize: '9.5px', textAlign: 'right', fontWeight: '600' }}>{(item.total || 0).toLocaleString('ja-JP')}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="6" style={{ padding: '15px 6px', textAlign: 'center', color: '#999', fontSize: '9px' }}>明細なし</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Totals - Customer view: NO tax breakdown */}
              <div style={{ marginTop: '10px', borderTop: '2px solid #1a1a1a', paddingTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '14px', fontWeight: '700', color: '#c41e3a', paddingTop: '8px' }}>
                  <span style={{ marginRight: '30px' }}>ご請求金額</span>
                  <span>¥ {totals.customerTotal.toLocaleString('ja-JP')}</span>
                </div>
              </div>

              {/* Complaint / Work Description */}
              {workOrder.complaint && (
                <div style={{ marginTop: '20px', border: '1px solid #ddd', borderRadius: '4px', padding: '10px' }}>
                  <h3 style={{ fontSize: '10px', fontWeight: '600', color: '#c41e3a', marginBottom: '6px' }}>ご依頼内容</h3>
                  <p style={{ fontSize: '9px', color: '#555', whiteSpace: 'pre-line' }}>{workOrder.complaint}</p>
                </div>
              )}

              {/* Diagnosis & Mechanic Notes */}
              {(workOrder.diagnosis || workOrder.technician_notes) && (
                <div style={{ marginTop: '10px', border: '1px solid #ddd', borderRadius: '4px', padding: '10px' }}>
                  <h3 style={{ fontSize: '10px', fontWeight: '600', color: '#c41e3a', marginBottom: '6px' }}>整備士コメント・診断結果</h3>
                  {workOrder.diagnosis && <p style={{ fontSize: '9px', color: '#555', whiteSpace: 'pre-line', marginBottom: '6px' }}><strong>診断:</strong> {workOrder.diagnosis}</p>}
                  {workOrder.technician_notes && <p style={{ fontSize: '9px', color: '#555', whiteSpace: 'pre-line' }}><strong>備考:</strong> {workOrder.technician_notes}</p>}
                </div>
              )}

              {/* Shaken Info (if vehicle has shaken data) */}
              {vehicle?.shakeng_expiry && (
                <div style={{ marginTop: '10px', border: '1px solid #ddd', borderRadius: '4px', padding: '10px' }}>
                  <h3 style={{ fontSize: '10px', fontWeight: '600', color: '#c41e3a', marginBottom: '6px' }}>車検情報</h3>
                  <p style={{ fontSize: '9px', color: '#555' }}>
                    車検有効期限: {formatDateJP(vehicle.shakeng_expiry)}
                    {vehicle.shakeng_date && ` / 前回車検日: ${formatDateJP(vehicle.shakeng_date)}`}
                  </p>
                </div>
              )}

              {/* Footer */}
              <div style={{ marginTop: '30px', textAlign: 'center', fontSize: '8px', color: '#999', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                <p>{COMPANY_INFO.name} | {COMPANY_INFO.postal} {COMPANY_INFO.address}</p>
                <p>TEL: {COMPANY_INFO.tel} | FAX: {COMPANY_INFO.fax}</p>
                <p style={{ marginTop: '4px' }}>この請求書は発行日から30日間有効です。</p>
              </div>

            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
