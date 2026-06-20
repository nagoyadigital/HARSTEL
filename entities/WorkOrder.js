{
  "name": "WorkOrder",
  "type": "object",
  "properties": {
    "wo_number": {
      "type": "string",
      "description": "Nomor WO otomatis"
    },
    "customer_id": {
      "type": "string",
      "description": "ID pelanggan"
    },
    "customer_name": {
      "type": "string",
      "description": "Nama pelanggan"
    },
    "vehicle_id": {
      "type": "string",
      "description": "ID kendaraan"
    },
    "vehicle_info": {
      "type": "string",
      "description": "Info kendaraan (plat - merk model)"
    },
    "mechanic_id": {
      "type": "string",
      "description": "ID mekanik"
    },
    "mechanic_name": {
      "type": "string",
      "description": "Nama mekanik"
    },
    "complaint": {
      "type": "string",
      "description": "Keluhan pelanggan"
    },
    "diagnosis": {
      "type": "string",
      "description": "Diagnosa"
    },
    "status": {
      "type": "string",
      "enum": [
        "Menunggu",
        "Inspeksi",
        "Estimasi",
        "Menunggu Approval",
        "Sedang Dikerjakan",
        "Menunggu Sparepart",
        "Quality Check",
        "Selesai",
        "Sudah Diambil"
      ],
      "default": "Menunggu",
      "description": "Status WO"
    },
    "estimated_cost": {
      "type": "number",
      "default": 0,
      "description": "Estimasi biaya"
    },
    "estimated_duration": {
      "type": "string",
      "description": "Estimasi waktu pengerjaan"
    },
    "service_cost": {
      "type": "number",
      "default": 0,
      "description": "Biaya jasa"
    },
    "parts_cost": {
      "type": "number",
      "default": 0,
      "description": "Biaya sparepart"
    },
    "discount": {
      "type": "number",
      "default": 0,
      "description": "Diskon"
    },
    "tax": {
      "type": "number",
      "default": 0,
      "description": "Pajak"
    },
    "total_cost": {
      "type": "number",
      "default": 0,
      "description": "Total tagihan"
    },
    "technician_notes": {
      "type": "string",
      "description": "Catatan teknisi"
    },
    "photo_before": {
      "type": "string",
      "description": "Foto sebelum service"
    },
    "photo_after": {
      "type": "string",
      "description": "Foto sesudah service"
    },
    "items": {
      "type": "array",
      "description": "Item pekerjaan dan sparepart",
      "items": {
        "type": "object",
        "properties": {
          "type": {
            "type": "string",
            "enum": [
              "service",
              "sparepart"
            ]
          },
          "name": {
            "type": "string"
          },
          "qty": {
            "type": "number"
          },
          "price": {
            "type": "number"
          },
          "total": {
            "type": "number"
          }
        }
      }
    },
    "inspection": {
      "type": "object",
      "description": "Digital inspection checklist",
      "properties": {
        "engine_oil": {
          "type": "string",
          "enum": [
            "Baik",
            "Perlu Perhatian",
            "Harus Diganti"
          ]
        },
        "oil_filter": {
          "type": "string",
          "enum": [
            "Baik",
            "Perlu Perhatian",
            "Harus Diganti"
          ]
        },
        "radiator": {
          "type": "string",
          "enum": [
            "Baik",
            "Perlu Perhatian",
            "Harus Diganti"
          ]
        },
        "fan_belt": {
          "type": "string",
          "enum": [
            "Baik",
            "Perlu Perhatian",
            "Harus Diganti"
          ]
        },
        "battery": {
          "type": "string",
          "enum": [
            "Baik",
            "Perlu Perhatian",
            "Harus Diganti"
          ]
        },
        "alternator": {
          "type": "string",
          "enum": [
            "Baik",
            "Perlu Perhatian",
            "Harus Diganti"
          ]
        },
        "shockbreaker": {
          "type": "string",
          "enum": [
            "Baik",
            "Perlu Perhatian",
            "Harus Diganti"
          ]
        },
        "ball_joint": {
          "type": "string",
          "enum": [
            "Baik",
            "Perlu Perhatian",
            "Harus Diganti"
          ]
        },
        "tie_rod": {
          "type": "string",
          "enum": [
            "Baik",
            "Perlu Perhatian",
            "Harus Diganti"
          ]
        },
        "bearing": {
          "type": "string",
          "enum": [
            "Baik",
            "Perlu Perhatian",
            "Harus Diganti"
          ]
        },
        "brake_pad": {
          "type": "string",
          "enum": [
            "Baik",
            "Perlu Perhatian",
            "Harus Diganti"
          ]
        },
        "disc_brake": {
          "type": "string",
          "enum": [
            "Baik",
            "Perlu Perhatian",
            "Harus Diganti"
          ]
        },
        "brake_fluid": {
          "type": "string",
          "enum": [
            "Baik",
            "Perlu Perhatian",
            "Harus Diganti"
          ]
        },
        "tire_depth": {
          "type": "string",
          "enum": [
            "Baik",
            "Perlu Perhatian",
            "Harus Diganti"
          ]
        },
        "tire_pressure": {
          "type": "string",
          "enum": [
            "Baik",
            "Perlu Perhatian",
            "Harus Diganti"
          ]
        }
      }
    }
  },
  "required": [
    "customer_id",
    "vehicle_id",
    "complaint"
  ]
}