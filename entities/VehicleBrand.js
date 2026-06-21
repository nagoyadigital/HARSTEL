{
  "name": "VehicleBrand",
  "type": "object",
  "description": "Master data merk dan model kendaraan (admin-managed)",
  "properties": {
    "name": {
      "type": "string",
      "description": "Nama merk kendaraan"
    },
    "models": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Daftar model untuk merk ini"
    }
  },
  "required": ["name", "models"]
}
