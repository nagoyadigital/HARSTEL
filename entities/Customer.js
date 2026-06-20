{
  "name": "Customer",
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Nama pelanggan"
    },
    "phone": {
      "type": "string",
      "description": "Nomor HP"
    },
    "email": {
      "type": "string",
      "description": "Email pelanggan"
    },
    "address": {
      "type": "string",
      "description": "Alamat"
    },
    "join_date": {
      "type": "string",
      "format": "date",
      "description": "Tanggal bergabung"
    },
    "notes": {
      "type": "string",
      "description": "Catatan khusus"
    },
    "total_visits": {
      "type": "number",
      "default": 0,
      "description": "Total kunjungan"
    },
    "total_spending": {
      "type": "number",
      "default": 0,
      "description": "Total pengeluaran"
    }
  },
  "required": [
    "name",
    "phone"
  ]
}