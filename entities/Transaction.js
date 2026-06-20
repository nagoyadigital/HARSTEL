{
  "name": "Transaction",
  "type": "object",
  "properties": {
    "transaction_number": {
      "type": "string",
      "description": "Nomor transaksi"
    },
    "type": {
      "type": "string",
      "enum": [
        "Pemasukan",
        "Pengeluaran"
      ],
      "description": "Jenis transaksi"
    },
    "category": {
      "type": "string",
      "enum": [
        "Jasa Service",
        "Penjualan Sparepart",
        "Pembelian Sparepart",
        "Gaji",
        "Operasional",
        "Lainnya"
      ],
      "description": "Kategori"
    },
    "description": {
      "type": "string",
      "description": "Keterangan"
    },
    "amount": {
      "type": "number",
      "description": "Jumlah"
    },
    "payment_method": {
      "type": "string",
      "enum": [
        "Tunai",
        "Kartu Kredit",
        "QRIS",
        "Transfer Bank"
      ],
      "description": "Metode pembayaran"
    },
    "work_order_id": {
      "type": "string",
      "description": "ID Work Order terkait"
    },
    "customer_id": {
      "type": "string",
      "description": "ID pelanggan"
    },
    "customer_name": {
      "type": "string",
      "description": "Nama pelanggan"
    },
    "date": {
      "type": "string",
      "format": "date",
      "description": "Tanggal transaksi"
    }
  },
  "required": [
    "type",
    "category",
    "amount",
    "date"
  ]
}