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
      "description": "ナンバープレート (例: 名古屋 500 あ 1234)"
    },
    "brand": {
      "type": "string",
      "description": "メーカー (Merk kendaraan)"
    },
    "model": {
      "type": "string",
      "description": "車種 (Model kendaraan)"
    },
    "year": {
      "type": "number",
      "description": "年式 (Tahun kendaraan)"
    },
    "color": {
      "type": "string",
      "description": "色 (Warna)"
    },
    "vehicle_category": {
      "type": "string",
      "enum": ["普通車", "軽自動車", "商用車", "貨物車", "特種車", "二輪車"],
      "description": "車両区分 (Kategori kendaraan)"
    },
    "chassis_number": {
      "type": "string",
      "description": "車台番号 (Nomor rangka)"
    },
    "engine_number": {
      "type": "string",
      "description": "エンジン型式 (Nomor/tipe mesin)"
    },
    "fuel_type": {
      "type": "string",
      "enum": ["レギュラー", "ハイオク", "軽油", "Hybrid", "PHEV", "EV", "LPG"],
      "description": "燃料 (Jenis BBM)"
    },
    "transmission": {
      "type": "string",
      "enum": ["AT", "CVT", "MT", "DCT"],
      "description": "ミッション (Transmisi)"
    },
    "last_odometer": {
      "type": "number",
      "description": "走行距離 (Odometer terakhir km)"
    },
    "purchase_date": {
      "type": "string",
      "format": "date",
      "description": "購入日 (Tanggal pembelian)"
    },
    "shakeng_date": {
      "type": "string",
      "format": "date",
      "description": "車検日 (Tanggal shaken terakhir)"
    },
    "shakeng_expiry": {
      "type": "string",
      "format": "date",
      "description": "車検有効期限 (Tanggal kadaluarsa shaken)"
    },
    "shakeng_status": {
      "type": "string",
      "enum": ["Valid", "Segera Habis", "Habis"],
      "description": "車検状態 (Status shaken)"
    },
    "photo_url": {
      "type": "string",
      "description": "車両写真 (Foto kendaraan)"
    }
  },
  "required": ["plate_number", "brand", "model", "customer_id"]
}
