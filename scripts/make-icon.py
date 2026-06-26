import struct, zlib

def create_png(width, height, color):
    def make_chunk(chunk_type, data):
        chunk = chunk_type + data
        crc = struct.pack('>I', zlib.crc32(chunk) & 0xFFFFFFFF)
        return struct.pack('>I', len(data)) + chunk + crc
    sig = b'\x89PNG\r\n\x1a\n'
    ihdr = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)
    raw = b''
    for y in range(height):
        raw += b'\x00'
        for x in range(width):
            cx, cy = width // 2, height // 2
            r = min(width, height) // 2 - 20
            dx, dy = x - cx, y - cy
            if dx * dx + dy * dy <= r * r:
                raw += bytes(color)
            else:
                raw += b'\x1a\x1a\x1a'
    compressed = zlib.compress(raw)
    return sig + make_chunk(b'IHDR', ihdr) + make_chunk(b'IDAT', compressed) + make_chunk(b'IEND', b'')

png_data = create_png(256, 256, (196, 30, 58))
with open('public/icon.png', 'wb') as f:
    f.write(png_data)
print('Icon created')
