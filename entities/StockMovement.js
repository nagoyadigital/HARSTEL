{
  "name": "StockMovement",
  "type": "object",
  "properties": {
    "sparepart_id": {
      "type": "string",
      "description": "ID sparepart"
    },
    "sparepart_name": {
      "type": "string",
      "description": "Nama sparepart"
    },
    "type": {
      "type": "string",
      "enum": [
        "Masuk",
        "Keluar",
        "Adjustment"
      ],
      "description": "Jenis pergerakan"
    },
    "quantity": {
      "type": "number",
      "description": "Jumlah"
    },
    "reference": {
      "type": "string",
      "description": "Referensi (WO/PO number)"
    },
    "notes": {
      "type": "string",
      "description": "Catatan"
    },
    "date": {
      "type": "string",
      "format": "date",
      "description": "Tanggal"
    }
  },
  "required": [
    "sparepart_id",
    "type",
    "quantity"
  ]
}