import struct

with open('build/icon2.png', 'rb') as f:
    png_data = f.read()

header = struct.pack('<HHH', 0, 1, 1)
entry = struct.pack('<BBBBHHII', 0, 0, 0, 0, 1, 32, len(png_data), 22)

with open('build/icon2.ico', 'wb') as f:
    f.write(header + entry + png_data)

print('ICO created: build/icon2.ico')
