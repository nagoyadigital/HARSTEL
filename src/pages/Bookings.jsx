import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import { format } from 'date-fns';
import { toast } from 'sonner';

const SERVICE_TYPES = ['Service Berkala','Ganti Oli','Tune Up','Body Repair','AC','Rem','Suspensi','Lainnya'];
const TIME_SLOTS = ['08:00','09:00','10:00','11:00','13:00','14:00','15:00','16:00'];

export default function Bookings() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ customer_name:'', vehicle_info:'', booking_date:'', booking_time:'', service_type:'', notes:'' });
  const queryClient = useQueryClient();

  const { data: bookings = [], isLoading } = useQuery({ queryKey:['bookings'], queryFn:()=>base44.entities.Booking.list('-created_date') });

  const createBooking = useMutation({
    mutationFn: (data) => base44.entities.Booking.create({...data, status:'Pending'}),
    onSuccess: ()=>{queryClient.invalidateQueries({queryKey:['bookings']});setShowForm(false);setForm({customer_name:'',vehicle_info:'',booking_date:'',booking_time:'',service_type:'',notes:''});toast.success('Booking dibuat');},
  });
  const updateStatus = useMutation({
    mutationFn: ({id,status}) => base44.entities.Booking.update(id,{status}),
    onSuccess: ()=>{queryClient.invalidateQueries({queryKey:['bookings']});toast.success('Status diperbarui');},
  });

  const createWOFromBooking = useMutation({
    mutationFn: async (booking) => {
      const woNum = `WO-${Date.now().toString().slice(-8)}`;
      await base44.entities.WorkOrder.create({
        wo_number: woNum,
        customer_name: booking.customer_name,
        vehicle_info: booking.vehicle_info,
        complaint: `Booking ${booking.service_type} - ${booking.notes || ''}`.trim(),
        status: 'Menunggu',
        items: [],
      });
      await base44.entities.Booking.update(booking.id, { status: 'Converted', work_order: woNum });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['workOrders'] });
      toast.success('Work Order berhasil dibuat dari booking');
    },
  });

  const columns = [
    { header:'Pelanggan', render:(row)=><div><p className="font-medium">{row.customer_name}</p><p className="text-xs text-muted-foreground">{row.vehicle_info}</p></div> },
    { header:'Tanggal', render:(row)=>row.booking_date?format(new Date(row.booking_date),'yyyy/MM/dd'):'-' },
    { header:'Jam', key:'booking_time' },
    { header:'Jenis Service', key:'service_type' },
    { header:'Status', render:(row)=><StatusBadge status={row.status}/> },
    { header:'Aksi', render:(row)=>{
      if (row.status === 'Pending') return (
        <div className="flex gap-1">
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={(e)=>{e.stopPropagation();updateStatus.mutate({id:row.id,status:'Approved'})}}>Approve</Button>
          <Button size="sm" variant="outline" className="h-7 text-xs text-destructive" onClick={(e)=>{e.stopPropagation();updateStatus.mutate({id:row.id,status:'Cancelled'})}}>Tolak</Button>
        </div>
      );
      if (row.status === 'Approved') return (
        <Button size="sm" className="h-7 text-xs gap-1" onClick={(e)=>{e.stopPropagation();createWOFromBooking.mutate(row)}}>
          Buat Work Order
        </Button>
      );
      if (row.status === 'Converted') return <span className="text-xs text-emerald-600 font-medium">{row.work_order || 'WO dibuat'}</span>;
      return null;
    }},
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Booking" description="Jadwal booking service"
        actions={<Button onClick={()=>setShowForm(true)} className="gap-2"><Calendar className="w-4 h-4"/>Buat Booking</Button>}/>
      <DataTable columns={columns} data={bookings} isLoading={isLoading} emptyMessage="Belum ada booking"/>

      <Dialog open={showForm} onOpenChange={(o)=>{if(!o)setShowForm(false)}}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Booking Service Baru</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nama Pelanggan *</Label><Input value={form.customer_name} onChange={(e)=>setForm({...form,customer_name:e.target.value})}/></div>
            <div><Label>Kendaraan</Label><Input value={form.vehicle_info} onChange={(e)=>setForm({...form,vehicle_info:e.target.value})} placeholder="B 1234 ABC - Toyota Avanza"/></div>
            <div><Label>Tanggal *</Label><Input type="date" value={form.booking_date} onChange={(e)=>setForm({...form,booking_date:e.target.value})}/></div>
            <div><Label>Jam *</Label><Select value={form.booking_time} onValueChange={(v)=>setForm({...form,booking_time:v})}><SelectTrigger><SelectValue placeholder="Pilih jam"/></SelectTrigger><SelectContent>{TIME_SLOTS.map(t=><SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Jenis Service *</Label><Select value={form.service_type} onValueChange={(v)=>setForm({...form,service_type:v})}><SelectTrigger><SelectValue placeholder="Pilih"/></SelectTrigger><SelectContent>{SERVICE_TYPES.map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Catatan</Label><Textarea value={form.notes} onChange={(e)=>setForm({...form,notes:e.target.value})}/></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={()=>setShowForm(false)}>Batal</Button><Button onClick={()=>createBooking.mutate(form)} disabled={!form.customer_name||!form.booking_date||!form.service_type||createBooking.isPending}>Buat Booking</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}