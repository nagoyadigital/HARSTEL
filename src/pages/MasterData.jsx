import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Trash2, Edit, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import PageHeader from '@/components/shared/PageHeader';
import { toast } from 'sonner';
import { getAllBrands, getModelsForBrand } from '@/lib/vehicle-master-data';

export default function MasterData() {
  const [showForm, setShowForm] = useState(false);
  const [editBrand, setEditBrand] = useState(null);
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: customBrands = [] } = useQuery({
    queryKey: ['vehicleBrands'],
    queryFn: () => base44.entities.VehicleBrand.list('name'),
  });

  // Merge defaults with custom
  const allBrandNames = getAllBrands(customBrands);
  const filteredBrands = allBrandNames.filter(b =>
    b.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Master Data Kendaraan"
        description="Kelola merk dan model kendaraan"
        actions={
          <Button onClick={() => { setEditBrand(null); setShowForm(true); }} className="gap-2">
            <Plus className="w-4 h-4" />Tambah Merk
          </Button>
        }
      />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Cari merk kendaraan..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBrands.map(brandName => {
          const models = getModelsForBrand(brandName, customBrands);
          const isCustom = customBrands.some(b => b.name === brandName);
          return (
            <div key={brandName} className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Car className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">{brandName}</h3>
                    <p className="text-[10px] text-muted-foreground">{models.length} model</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => { setEditBrand({ name: brandName, models, isCustom }); setShowForm(true); }}
                >
                  <Edit className="w-3.5 h-3.5" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {models.slice(0, 8).map(m => (
                  <span key={m} className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{m}</span>
                ))}
                {models.length > 8 && (
                  <span className="text-[10px] text-muted-foreground px-1">+{models.length - 8} lainnya</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showForm && (
        <BrandFormModal
          open={showForm}
          onClose={() => { setShowForm(false); setEditBrand(null); }}
          editData={editBrand}
          customBrands={customBrands}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['vehicleBrands'] });
            setShowForm(false);
            setEditBrand(null);
          }}
        />
      )}
    </div>
  );
}

function BrandFormModal({ open, onClose, editData, customBrands, onSuccess }) {
  const [name, setName] = useState(editData?.name || '');
  const [modelsText, setModelsText] = useState(
    editData ? getModelsForBrand(editData.name, customBrands).join(', ') : ''
  );

  const createMutation = useMutation({
    mutationFn: async () => {
      const models = modelsText.split(',').map(m => m.trim()).filter(Boolean);
      const existing = customBrands.find(b => b.name === name);
      if (existing) {
        return base44.entities.VehicleBrand.update(existing.id, { name, models });
      }
      return base44.entities.VehicleBrand.create({ name, models });
    },
    onSuccess: () => {
      toast.success(editData ? 'Merk diperbarui' : 'Merk baru ditambahkan');
      onSuccess();
    },
    onError: (err) => toast.error(err.message || 'Gagal menyimpan'),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const existing = customBrands.find(b => b.name === name);
      if (existing) return base44.entities.VehicleBrand.delete(existing.id);
    },
    onSuccess: () => { toast.success('Merk dihapus'); onSuccess(); },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editData ? `Edit — ${editData.name}` : 'Tambah Merk Kendaraan'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nama Merk</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Toyota, Honda, dll" disabled={!!editData && !editData.isCustom} />
            {editData && !editData.isCustom && (
              <p className="text-xs text-muted-foreground">Merk default tidak dapat diubah namanya. Tambah model di bawah.</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Model (pisahkan dengan koma)</Label>
            <textarea
              className="w-full min-h-[120px] rounded-lg border border-input bg-background px-3 py-2 text-sm"
              value={modelsText}
              onChange={e => setModelsText(e.target.value)}
              placeholder="Prius, Aqua, Alphard, Voxy, Noah..."
            />
            <p className="text-xs text-muted-foreground">Tambah model baru di sini, model default akan tetap tersimpan.</p>
          </div>
        </div>
        <DialogFooter className="flex justify-between">
          <div>
            {editData?.isCustom && (
              <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate()}>
                <Trash2 className="w-3.5 h-3.5 mr-1" /> Hapus
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Batal</Button>
            <Button onClick={() => createMutation.mutate()} disabled={!name || createMutation.isPending}>
              Simpan
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
