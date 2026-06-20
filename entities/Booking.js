{
  "name": "Booking",
  "type": "object",
  "properties": {
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
      "description": "Info kendaraan"
    },
    "booking_date": {
      "type": "string",
      "format": "date",
      "description": "Tanggal booking"
    },
    "booking_time": {
      "type": "string",
      "description": "Jam booking"
    },
    "service_type": {
      "type": "string",
      "description": "Jenis service"
    },
    "status": {
      "type": "string",
      "enum": [
        "Pending",
        "Approved",
        "Reschedule",
        "Cancelled",
        "Completed"
      ],
      "default": "Pending"
    },
    "notes": {
      "type": "string",
      "description": "Catatan"
    }
  },
  "required": [
    "customer_name",
    "booking_date",
    "service_type"
  ]
}