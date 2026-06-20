{
  "name": "Vehicle",
  "type": "object",
  "properties": {
    "customer_id": {
      "type": "string",
      "description": "ID pelanggan pemilik"
    },
    "customer_name": {
      "type": "string",
      "description": "Nama pelanggan"
    },
    "plate_number": {
      "type": "string",
      "description": "Nomor polisi"
    },
    "brand": {
      "type": "string",
      "description": "Merk kendaraan"
    },
    "model": {
      "type": "string",
      "description": "Model kendaraan"
    },
    "year": {
      "type": "number",
      "description": "Tahun kendaraan"
    },
    "color": {
      "type": "string",
      "description": "Warna"
    },
    "chassis_number": {
      "type": "string",
      "description": "Nomor rangka"
    },
    "engine_number": {
      "type": "string",
      "description": "Nomor mesin"
    },
    "fuel_type": {
      "type": "string",
      "enum": [
        "Bensin",
        "Diesel",
        "Hybrid",
        "Listrik"
      ],
      "description": "Jenis BBM"
    },
    "transmission": {
      "type": "string",
      "enum": [
        "Manual",
        "Automatic",
        "CVT"
      ],
      "description": "Transmisi"
    },
    "last_odometer": {
      "type": "number",
      "description": "Odometer terakhir (km)"
    },
    "purchase_date": {
      "type": "string",
      "format": "date",
      "description": "Tanggal pembelian"
    },
    "shakeng_date": {
      "type": "string",
      "format": "date",
      "description": "Tanggal shakeng terakhir"
    },
    "shakeng_expiry": {
      "type": "string",
      "format": "date",
      "description": "Tanggal kadaluarsa shakeng"
    },
    "shakeng_status": {
      "type": "string",
      "enum": [
        "Valid",
        "Segera Habis",
        "Habis"
      ],
      "description": "Status shakeng"
    },
    "photo_url": {
      "type": "string",
      "description": "Foto kendaraan"
    }
  },
  "required": [
    "plate_number",
    "brand",
    "model",
    "customer_id"
  ]
}