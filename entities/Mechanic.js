{
  "name": "Mechanic",
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Nama mekanik"
    },
    "position": {
      "type": "string",
      "description": "Jabatan"
    },
    "phone": {
      "type": "string",
      "description": "Nomor HP"
    },
    "skills": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Keahlian"
    },
    "certifications": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Sertifikasi"
    },
    "status": {
      "type": "string",
      "enum": [
        "Aktif",
        "Tidak Aktif",
        "Cuti"
      ],
      "default": "Aktif"
    },
    "total_jobs": {
      "type": "number",
      "default": 0
    },
    "rating": {
      "type": "number",
      "default": 0
    },
    "photo_url": {
      "type": "string",
      "description": "Foto mekanik"
    }
  },
  "required": [
    "name",
    "position"
  ]
}