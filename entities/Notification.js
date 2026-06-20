{
  "name": "Notification",
  "type": "object",
  "properties": {
    "title": {
      "type": "string",
      "description": "Judul notifikasi"
    },
    "message": {
      "type": "string",
      "description": "Pesan notifikasi"
    },
    "type": {
      "type": "string",
      "enum": [
        "shakeng",
        "workorder",
        "system",
        "stock"
      ],
      "description": "Tipe notifikasi"
    },
    "read": {
      "type": "boolean",
      "default": false,
      "description": "Dibaca atau belum"
    },
    "related_id": {
      "type": "string",
      "description": "ID terkait (vehicle_id / wo_id)"
    },
    "date": {
      "type": "string",
      "format": "date",
      "description": "Tanggal notifikasi"
    }
  },
  "required": [
    "title",
    "message",
    "type"
  ]
}