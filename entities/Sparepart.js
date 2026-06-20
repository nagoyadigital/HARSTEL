{
  "name": "Sparepart",
  "type": "object",
  "properties": {
    "sku": {
      "type": "string",
      "description": "SKU part"
    },
    "name": {
      "type": "string",
      "description": "Nama part"
    },
    "brand": {
      "type": "string",
      "description": "Merk part"
    },
    "category": {
      "type": "string",
      "enum": [
        "Oli",
        "Filter",
        "Rem",
        "Ban",
        "Aki",
        "Lampu",
        "Suspensi",
        "Transmisi",
        "Mesin",
        "Body",
        "Aksesoris",
        "Lainnya"
      ],
      "description": "Kategori"
    },
    "supplier": {
      "type": "string",
      "description": "Supplier"
    },
    "buy_price": {
      "type": "number",
      "description": "Harga beli"
    },
    "sell_price": {
      "type": "number",
      "description": "Harga jual"
    },
    "stock": {
      "type": "number",
      "default": 0,
      "description": "Stok saat ini"
    },
    "min_stock": {
      "type": "number",
      "default": 5,
      "description": "Stok minimum"
    },
    "location": {
      "type": "string",
      "description": "Lokasi rak"
    },
    "barcode": {
      "type": "string",
      "description": "Barcode"
    }
  },
  "required": [
    "sku",
    "name",
    "sell_price"
  ]
}