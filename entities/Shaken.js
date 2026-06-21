{
  "name": "Shaken",
  "type": "object",
  "description": "Data 車検 (Shaken/Inspeksi Kendaraan Jepang) per kendaraan",
  "properties": {
    "vehicle_id": {
      "type": "string",
      "description": "ID kendaraan terkait"
    },
    "vehicle_plate": {
      "type": "string",
      "description": "Nomor polisi kendaraan"
    },
    "vehicle_info": {
      "type": "string",
      "description": "Info kendaraan (brand model year)"
    },
    "customer_id": {
      "type": "string",
      "description": "ID pelanggan pemilik"
    },
    "customer_name": {
      "type": "string",
      "description": "Nama pelanggan"
    },
    "shaken_date": {
      "type": "string",
      "format": "date",
      "description": "Tanggal Shaken terakhir dilakukan"
    },
    "shaken_expiry": {
      "type": "string",
      "format": "date",
      "description": "Tanggal kadaluarsa Shaken"
    },
    "status": {
      "type": "string",
      "enum": ["Aktif", "Akan Habis", "Expired"],
      "description": "Status Shaken otomatis"
    },
    "jibaiseki_company": {
      "type": "string",
      "description": "Perusahaan asuransi Jibaiseki (自賠責)"
    },
    "jibaiseki_number": {
      "type": "string",
      "description": "Nomor polis Jibaiseki"
    },
    "jibaiseki_expiry": {
      "type": "string",
      "format": "date",
      "description": "Tanggal kadaluarsa Jibaiseki"
    },
    "jibaiseki_premium": {
      "type": "number",
      "description": "Premi Jibaiseki (JPY)"
    },
    "nini_hoken_company": {
      "type": "string",
      "description": "Perusahaan asuransi Nini Hoken (任意保険)"
    },
    "nini_hoken_number": {
      "type": "string",
      "description": "Nomor polis Nini Hoken"
    },
    "nini_hoken_expiry": {
      "type": "string",
      "format": "date",
      "description": "Tanggal kadaluarsa Nini Hoken"
    },
    "nini_hoken_premium": {
      "type": "number",
      "description": "Premi Nini Hoken (JPY)"
    },
    "annual_tax": {
      "type": "number",
      "description": "Pajak tahunan kendaraan (自動車税) dalam JPY"
    },
    "annual_tax_due_date": {
      "type": "string",
      "format": "date",
      "description": "Tanggal jatuh tempo pajak tahunan"
    },
    "weight_tax": {
      "type": "number",
      "description": "Pajak bobot kendaraan (重量税) dalam JPY"
    },
    "inspection_fee": {
      "type": "number",
      "description": "Biaya inspeksi Shaken (JPY)"
    },
    "maintenance_cost": {
      "type": "number",
      "description": "Estimasi biaya perawatan untuk Shaken (JPY)"
    },
    "total_estimated_cost": {
      "type": "number",
      "description": "Total estimasi biaya Shaken berikutnya (JPY)"
    },
    "notes": {
      "type": "string",
      "description": "Catatan tambahan"
    },
    "reminder_whatsapp": {
      "type": "boolean",
      "description": "Aktifkan reminder WhatsApp"
    },
    "reminder_email": {
      "type": "boolean",
      "description": "Aktifkan reminder Email"
    },
    "reminder_sms": {
      "type": "boolean",
      "description": "Aktifkan reminder SMS"
    },
    "reminder_days": {
      "type": "array",
      "items": { "type": "number" },
      "description": "Reminder dijadwalkan H-berapa hari [90, 60, 30]"
    },
    "last_reminder_sent": {
      "type": "string",
      "format": "date",
      "description": "Tanggal reminder terakhir dikirim"
    }
  },
  "required": ["vehicle_id", "shaken_date", "shaken_expiry"]
}
