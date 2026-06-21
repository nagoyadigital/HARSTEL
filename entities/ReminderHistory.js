{
  "name": "ReminderHistory",
  "type": "object",
  "description": "Riwayat pengiriman reminder Shaken ke pelanggan",
  "properties": {
    "vehicle_id": {
      "type": "string",
      "description": "ID kendaraan"
    },
    "vehicle_plate": {
      "type": "string",
      "description": "Nomor plat kendaraan"
    },
    "vehicle_info": {
      "type": "string",
      "description": "Info kendaraan (brand model)"
    },
    "customer_id": {
      "type": "string",
      "description": "ID pelanggan"
    },
    "customer_name": {
      "type": "string",
      "description": "Nama pelanggan"
    },
    "method": {
      "type": "string",
      "enum": ["whatsapp", "email", "sms"],
      "description": "Metode pengiriman"
    },
    "message": {
      "type": "string",
      "description": "Isi pesan yang dikirim"
    },
    "status": {
      "type": "string",
      "enum": ["sent", "failed"],
      "description": "Status pengiriman"
    },
    "sent_by": {
      "type": "string",
      "description": "Nama user yang mengirim (atau 'System (Auto)')"
    },
    "sent_at": {
      "type": "string",
      "format": "date-time",
      "description": "Tanggal dan waktu pengiriman"
    },
    "trigger": {
      "type": "string",
      "enum": ["auto", "manual"],
      "description": "Trigger pengiriman (otomatis atau manual)"
    },
    "schedule_day": {
      "type": "number",
      "description": "H-berapa reminder dijadwalkan (null jika manual)"
    }
  },
  "required": ["vehicle_id", "method", "status", "sent_at"]
}
