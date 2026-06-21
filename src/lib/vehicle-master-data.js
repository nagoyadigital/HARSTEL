/**
 * Vehicle Master Data for Japanese Market
 * Default brands and models - can be extended by admin via VehicleBrand entity
 */

export const DEFAULT_BRANDS_MODELS = {
  Toyota: ['Prius', 'Aqua', 'Alphard', 'Vellfire', 'Voxy', 'Noah', 'Harrier', 'RAV4', 'Land Cruiser', 'Hiace', 'Crown', 'Camry', 'Corolla', 'Yaris', 'Yaris Cross', 'Sienta', 'Roomy', 'C-HR', 'GR86', 'Supra', 'Century', 'bZ4X', 'Hilux', 'Probox'],
  Lexus: ['IS', 'ES', 'GS', 'LS', 'NX', 'RX', 'UX', 'LX', 'LC', 'RC', 'LBX', 'RZ'],
  Honda: ['Fit', 'Freed', 'N-BOX', 'N-WGN', 'N-ONE', 'Stepwgn', 'Vezel', 'CR-V', 'ZR-V', 'Civic', 'Accord', 'Odyssey', 'S660', 'WR-V'],
  Nissan: ['Note', 'Serena', 'X-Trail', 'Kicks', 'Elgrand', 'Sakura', 'Dayz', 'Roox', 'Skyline', 'Fairlady Z', 'GT-R', 'Leaf', 'Ariya', 'NV350 Caravan'],
  Mazda: ['CX-5', 'CX-8', 'CX-30', 'CX-60', 'Mazda3', 'Mazda2', 'MX-5', 'MX-30', 'Roadster'],
  Subaru: ['Forester', 'Outback', 'Impreza', 'Crosstrek', 'Levorg', 'WRX', 'BRZ', 'Rex', 'Solterra'],
  Suzuki: ['Swift', 'Hustler', 'Jimny', 'Spacia', 'Alto', 'Wagon R', 'Every', 'Carry', 'Solio', 'Xbee', 'Escudo'],
  Daihatsu: ['Tanto', 'Move', 'Mira', 'Rocky', 'Taft', 'Canbus', 'Hijet', 'Atrai', 'Copen', 'Thor'],
  Mitsubishi: ['Outlander', 'Eclipse Cross', 'Delica D:5', 'RVR', 'eK X', 'eK Wagon', 'Triton', 'Pajero'],
  Isuzu: ['Elf', 'Forward', 'Giga', 'D-Max', 'MU-X'],
  Hino: ['Dutro', 'Ranger', 'Profia'],
  'UD Trucks': ['Condor', 'Quon', 'Kazet'],
  'Mercedes-Benz': ['A-Class', 'B-Class', 'C-Class', 'E-Class', 'S-Class', 'GLA', 'GLB', 'GLC', 'GLE', 'GLS', 'G-Class', 'CLA', 'AMG GT'],
  BMW: ['1 Series', '2 Series', '3 Series', '4 Series', '5 Series', '7 Series', 'X1', 'X3', 'X5', 'X7', 'iX', 'i4', 'M3', 'M4'],
  Audi: ['A3', 'A4', 'A5', 'A6', 'A8', 'Q3', 'Q5', 'Q7', 'Q8', 'e-tron', 'RS3', 'RS5', 'TT'],
  Volkswagen: ['Golf', 'Polo', 'T-Cross', 'T-Roc', 'Tiguan', 'Passat', 'ID.4', 'ID.Buzz'],
  Porsche: ['911', 'Cayenne', 'Macan', 'Panamera', 'Taycan', 'Boxster', 'Cayman'],
  Tesla: ['Model 3', 'Model Y', 'Model S', 'Model X', 'Cybertruck'],
  Ford: ['Mustang', 'Bronco', 'Explorer', 'Ranger', 'F-150'],
  Chevrolet: ['Corvette', 'Camaro', 'Tahoe', 'Suburban'],
  Hyundai: ['IONIQ 5', 'IONIQ 6', 'Tucson', 'Kona', 'NEXO'],
  Kia: ['EV6', 'EV9', 'Sportage', 'Sorento', 'Stinger'],
  BYD: ['ATTO 3', 'Dolphin', 'Seal', 'TANG'],
  Volvo: ['XC40', 'XC60', 'XC90', 'V60', 'S60', 'EX30', 'EX90'],
  Jaguar: ['F-Pace', 'E-Pace', 'I-Pace', 'F-Type', 'XF'],
  'Land Rover': ['Range Rover', 'Range Rover Sport', 'Defender', 'Discovery', 'Evoque'],
  MINI: ['Cooper', 'Clubman', 'Countryman', 'Convertible'],
  Fiat: ['500', '500X', 'Panda', 'Tipo'],
  Alfa_Romeo: ['Giulia', 'Stelvio', 'Tonale'],
  Peugeot: ['208', '308', '3008', '5008', 'Rifter'],
  Citroen: ['C3', 'C4', 'C5 X', 'Berlingo'],
  Renault: ['Kangoo', 'Arkana', 'Megane E-Tech'],
  Jeep: ['Wrangler', 'Grand Cherokee', 'Compass', 'Renegade'],
};

// Vehicle categories for Japanese market
export const VEHICLE_CATEGORIES = [
  { value: '普通車', label: '普通車 (Regular Vehicle)' },
  { value: '軽自動車', label: '軽自動車 (Kei Car)' },
  { value: '商用車', label: '商用車 (Commercial Vehicle)' },
  { value: '貨物車', label: '貨物車 (Cargo Vehicle)' },
  { value: '特種車', label: '特種車 (Special Vehicle)' },
  { value: '二輪車', label: '二輪車 (Motorcycle)' },
];

// Fuel types for Japanese market
export const FUEL_TYPES = [
  { value: 'レギュラー', label: 'レギュラー (Regular)' },
  { value: 'ハイオク', label: 'ハイオク (Premium)' },
  { value: '軽油', label: '軽油 (Diesel)' },
  { value: 'Hybrid', label: 'ハイブリッド (Hybrid)' },
  { value: 'PHEV', label: 'PHEV (Plug-in Hybrid)' },
  { value: 'EV', label: 'EV (電気自動車)' },
  { value: 'LPG', label: 'LPG (液化石油ガス)' },
];

// Transmission types
export const TRANSMISSION_TYPES = [
  { value: 'AT', label: 'AT (オートマ)' },
  { value: 'CVT', label: 'CVT' },
  { value: 'MT', label: 'MT (マニュアル)' },
  { value: 'DCT', label: 'DCT (デュアルクラッチ)' },
];

// Japanese plate number regions
export const PLATE_REGIONS = [
  '札幌', '函館', '旭川', '室蘭', '釧路', '帯広', '北見',
  '青森', '八戸', '岩手', '宮城', '仙台', '秋田', '山形', '庄内', '福島', '会津', 'いわき',
  '水戸', 'つくば', '宇都宮', '那須', '群馬', '高崎', '大宮', '所沢', '春日部', '熊谷', '川越', '越谷', '川口',
  '千葉', '成田', '習志野', '市川', '船橋', '野田', '柏', '松戸',
  '品川', '練馬', '足立', '多摩', '八王子', '杉並', '世田谷', '板橋', '江東',
  '横浜', '川崎', '相模', '湘南',
  '新潟', '長岡', '富山', '石川', '金沢', '福井',
  '山梨', '長野', '松本', '諏訪',
  '岐阜', '飛騨', '静岡', '浜松', '沼津', '名古屋', '豊橋', '三河', '岡崎', '一宮', '豊田', '春日井',
  '三重', '滋賀', '京都', '大阪', 'なにわ', '堺', '和泉',
  '神戸', '姫路', '奈良', '和歌山',
  '鳥取', '島根', '岡山', '倉敷', '広島', '福山', '山口', '下関',
  '徳島', '香川', '愛媛', '高知',
  '福岡', '北九州', '久留米', '筑豊', '佐賀', '長崎', '佐世保', '熊本', '大分', '宮崎', '鹿児島', '沖縄',
];

/**
 * Get all brands (default + user-added from DB)
 */
export function getAllBrands(customBrands = []) {
  const defaultList = Object.keys(DEFAULT_BRANDS_MODELS);
  const customNames = customBrands.map(b => b.name).filter(n => !defaultList.includes(n));
  return [...defaultList, ...customNames].sort();
}

/**
 * Get models for a specific brand (default + user-added)
 */
export function getModelsForBrand(brand, customBrands = []) {
  const defaultModels = DEFAULT_BRANDS_MODELS[brand] || [];
  const custom = customBrands.find(b => b.name === brand);
  const customModels = custom?.models || [];
  const merged = [...new Set([...defaultModels, ...customModels])];
  return merged.sort();
}
