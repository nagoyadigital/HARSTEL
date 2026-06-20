import React from 'react';
import { cn } from '@/lib/utils';

const statusColors = {
  'Menunggu': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Inspeksi': 'bg-blue-100 text-blue-800 border-blue-200',
  'Estimasi': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'Menunggu Approval': 'bg-orange-100 text-orange-800 border-orange-200',
  'Sedang Dikerjakan': 'bg-cyan-100 text-cyan-800 border-cyan-200',
  'Menunggu Sparepart': 'bg-purple-100 text-purple-800 border-purple-200',
  'Quality Check': 'bg-pink-100 text-pink-800 border-pink-200',
  'Selesai': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Sudah Diambil': 'bg-gray-100 text-gray-800 border-gray-200',
  'Pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Approved': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Reschedule': 'bg-orange-100 text-orange-800 border-orange-200',
  'Cancelled': 'bg-red-100 text-red-800 border-red-200',
  'Completed': 'bg-gray-100 text-gray-800 border-gray-200',
  'Aktif': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Tidak Aktif': 'bg-gray-100 text-gray-800 border-gray-200',
  'Cuti': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Baik': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Perlu Perhatian': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Harus Diganti': 'bg-red-100 text-red-800 border-red-200',
};

export default function StatusBadge({ status }) {
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border",
      statusColors[status] || 'bg-muted text-muted-foreground border-border'
    )}>
      {status}
    </span>
  );
}