import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Star, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import { toast } from 'sonner';

export default function Mechanics() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name:'', position:'', phone:'', skills:'', certifications:'', status:'Aktif' });
  const [editId, setEditId] = useState(null);
  const queryClient = useQueryClient();

  const { data: mechanics = [], isLoading } = useQuery({ queryKey:['mechanics'], queryFn:()=>base44.entities.Mechanic.list() });
  const { data: workOrders = [] } = useQuery({ queryKey:['workOrders'], queryFn:()=>base44.entities.WorkOrder.list() });

  const getActiveJobs = (mechId) => workOrders.filter(wo=>wo.mechanic_id===mechId && !['Selesai','Sudah Diambil'].includes(wo.status)).length;

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Mechanic.create({...data, skills: data.skills ? data.skills.split(',').map(s=>s.trim()):[], certifications: data.certifications ? data.certifications.split(',').map(s=>s.trim()):[] }),
    onSuccess: ()=>{queryClient.invalidateQueries({queryKey:['mechanics']});resetForm();toast.success('Mekanik ditambahkan');},
  });
  const updateMutation = useMutation({
    mutationFn: ({id,data}) => base44.entities.Mechanic.update(id, {...data, skills: typeof data.skills==='string'?data.skills.split(',').map(s=>s.trim()):data.skills, certifications: typeof data.certifications==='string'?data.certifications.split(',').map(s=>s.trim()):data.certifications }),
    onSuccess: ()=>{queryClient.invalidateQueries({queryKey:['mechanics']});resetForm();toast.success('Mekanik diperbarui');},
  });

  const resetForm = ()=>{setForm({name:'',position:'',phone:'',skills:'',certifications:'',status:'Aktif'});setEditId(null);setShowForm(false)};
  const handleEdit = (m)=>{setForm({name:m.name,position:m.position||'',phone:m.phone||'',skills:Array.isArray(m.skills)?m.skills.join(', '):(m.skills||''),certifications:Array.isArray(m.certifications)?m.certifications.join(', '):(m.certifications||''),status:m.status||'Aktif'});setEditId(m.id);setShowForm(true)};
  const handleSubmit = ()=>{if(!form.name||!form.position)return;if(editId)updateMutation.mutate({id:editId,data:form});else createMutation.mutate(form)};

  return (
    <div className="space-y-6">
      <PageHeader title="Mekanik" description={`${mechanics.length} total mekanik`}
        actions={<Button onClick={()=>setShowForm(true)} className="gap-2"><Plus className="w-4 h-4"/>Tambah Mekanik</Button>}/>
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{Array(3).fill(0).map((_,i)=><div key={i} className="h-48 bg-card rounded-xl border animate-pulse"/>)}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mechanics.map(m=>(
            <div key={m.id} onClick={()=>handleEdit(m)} className="bg-card rounded-xl border border-border p-5 hover:shadow-lg transition-all cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">{m.name?.[0]?.toUpperCase()}</div>
                  <div><p className="font-semibold">{m.name}</p><p className="text-sm text-muted-foreground">{m.position}</p></div>
                </div>
                <StatusBadge status={m.status}/>
              </div>
              <div className="flex items-center gap-4 text-sm mb-3">
                <span className="flex items-center gap-1 text-muted-foreground"><Wrench className="w-3.5 h-3.5"/>{getActiveJobs(m.id)} job aktif</span>
                <span className="flex items-center gap-1 text-muted-foreground"><Star className="w-3.5 h-3.5 text-amber-500"/>{m.rating||0}/5</span>
              </div>
              {m.skills?.length>0 && <div className="flex flex-wrap gap-1.5">{(Array.isArray(m.skills)?m.skills:[]).slice(0,4).map(s=><Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}</div>}
            </div>
          ))}
        </div>
      )}
      <Dialog open={showForm} onOpenChange={(o)=>{if(!o)resetForm()}}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editId?'Edit Mekanik':'Tambah Mekanik'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nama *</Label><Input value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})}/></div>
            <div><Label>Jabatan *</Label><Input value={form.position} onChange={(e)=>setForm({...form,position:e.target.value})} placeholder="Mekanik Senior"/></div>
            <div><Label>Telepon</Label><Input value={form.phone} onChange={(e)=>setForm({...form,phone:e.target.value})}/></div>
            <div><Label>Keahlian (pisahkan koma)</Label><Input value={form.skills} onChange={(e)=>setForm({...form,skills:e.target.value})} placeholder="Mesin, Rem, Suspensi"/></div>
            <div><Label>Sertifikasi (pisahkan koma)</Label><Input value={form.certifications} onChange={(e)=>setForm({...form,certifications:e.target.value})}/></div>
            <div><Label>Status</Label><Select value={form.status} onValueChange={(v)=>setForm({...form,status:v})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{['Aktif','Tidak Aktif','Cuti'].map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={resetForm}>Batal</Button><Button onClick={handleSubmit} disabled={createMutation.isPending||updateMutation.isPending}>{editId?'Simpan':'Tambah'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}