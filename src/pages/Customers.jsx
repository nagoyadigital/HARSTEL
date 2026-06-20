import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Phone, Mail, MapPin, Car, UserCheck, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import ShakengBadge from '@/components/shared/ShakengBadge';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function Customers() {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', address: '', notes: '' });
  const [editId, setEditId] = useState(null);
  const queryClient = useQueryClient();

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list('-created_date'),
  });
  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => base44.entities.Vehicle.list('-created_date'),
  });
  const { data: allCustomers = [] } = useQuery({
    queryKey: ['allCustomers'],
    queryFn: () => base44.entities.Customer.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Customer.create({ ...data, join_date: format(new Date(), 'yyyy-MM-dd'), total_visits: 0, total_spending: 0 }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['customers'] }); resetForm(); toast.success('Pelanggan berhasil ditambahkan'); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Customer.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['customers'] }); resetForm(); toast.success('Pelanggan berhasil diperbarui'); },
  });

  const resetForm = () => {
    setFormData({ name: '', phone: '', email: '', address: '', notes: '' });
    setEditId(null);
    setShowForm(false);
  };

  const handleEdit = (customer) => {
    setFormData({ name: customer.name, phone: customer.phone, email: customer.email || '', address: customer.address || '', notes: customer.notes || '' });
    setEditId(customer.id);
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.phone) return;
    if (editId) {
      updateMutation.mutate({ id: editId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filtered = customers.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      header: 'Pelanggan',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
            {row.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-medium">{row.name}</p>
            <p className="text-xs text-muted-foreground">{row.email}</p>
          </div>
        </div>
      )
    },
    { header: 'Telepon', render: (row) => <span className="flex items-center gap-1.5 text-muted-foreground"><Phone className="w-3.5 h-3.5" />{row.phone}</span> },
    { header: 'Alamat', render: (row) => row.address ? <span className="flex items-center gap-1.5 text-muted-foreground"><MapPin className="w-3.5 h-3.5" />{row.address}</span> : '-' },
    { header: 'Kunjungan', render: (row) => <span className="font-medium">{row.total_visits || 0}</span> },
    { header: 'Total Pengeluaran', render: (row) => <span className="font-medium">¥ {(row.total_spending || 0).toLocaleString('ja-JP')}</span> },
    { header: 'Bergabung', render: (row) => row.join_date ? format(new Date(row.join_date), 'dd MMM yyyy') : '-' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pelanggan"
        description={`${customers.length} total pelanggan`}
        actions={
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="w-4 h-4" />Tambah Pelanggan
          </Button>
        }
      />

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Cari pelanggan..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <DataTable columns={columns} data={filtered} isLoading={isLoading} onRowClick={handleEdit} />

      <Dialog open={showForm} onOpenChange={(open) => { if (!open) resetForm(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Pelanggan' : 'Tambah Pelanggan Baru'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-2"><Label className="text-primary font-semibold">Data Pelanggan</Label></div>
            <div><Label>Nama *</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Nama pelanggan" /></div>
            <div><Label>Nomor HP *</Label><Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="08xxxxxxxxxx" /></div>
            <div><Label>Email</Label><Input value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="email@contoh.com" /></div>
            <div className="col-span-2"><Label>Alamat</Label><Textarea value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Alamat lengkap" /></div>
            <div className="col-span-2"><Label>Catatan</Label><Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Catatan khusus" /></div>
            
            {/* Vehicle Section */}
            {editId && (() => {
              const customerVehicles = vehicles.filter(v => v.customer_id === editId);
              return (
                <div className="col-span-2 border-t border-border pt-4 mt-2">
                  <div className="flex items-center gap-2 mb-3">
                    <Car className="w-4 h-4 text-primary" />
                    <Label className="text-primary font-semibold">Kendaraan Pelanggan</Label>
                  </div>
                  {customerVehicles.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">Belum ada kendaraan. Tambahkan di menu Kendaraan.</p>
                  ) : (
                    <div className="space-y-2">
                      {customerVehicles.map(v => (
                        <div key={v.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Car className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-semibold">{v.plate_number}</p>
                              <p className="text-xs text-muted-foreground">{v.brand} {v.model} ({v.year})</p>
                              {v.shakeng_expiry && (
                                <ShakengBadge status={v.shakeng_status || (() => { const e=new Date(v.shakeng_expiry); const d=Math.ceil((e-new Date())/(86400000)); return d<0?'Habis':d<=30?'Segera Habis':'Valid'; })()} />
                              )}
                            </div>
                          </div>
                          <Select value={v.customer_id} onValueChange={async (newCustId) => {
                            const nc = allCustomers.find(c => c.id === newCustId);
                            if (nc && nc.id !== v.customer_id) {
                              await base44.entities.Vehicle.update(v.id, { customer_id: newCustId, customer_name: nc.name });
                              queryClient.invalidateQueries({ queryKey: ['vehicles'] });
                              toast.success(`Kepemilikan dialihkan ke ${nc.name}`);
                            }
                          }}>
                            <SelectTrigger className="w-40 h-8 text-xs">
                              <SelectValue placeholder="Transfer" />
                            </SelectTrigger>
                            <SelectContent>
                              {allCustomers.filter(c => c.id !== editId).map(c => (
                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>Batal</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {editId ? 'Simpan' : 'Tambah'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}