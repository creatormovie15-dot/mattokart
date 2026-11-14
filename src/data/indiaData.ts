import { DeliveryType, Product, ShippingScope, ShippingZone } from '../types';

export interface IndianStateInfo {
  name: string;
  code: string; // GST State Code
  pinPrefixes: string[];
  majorDistricts: { name: string; samplePin: string }[];
}

export const INDIAN_STATES_UTS: IndianStateInfo[] = [
  {
    name: 'Uttar Pradesh',
    code: '09',
    pinPrefixes: ['20', '21', '22', '23', '24', '25', '26', '27', '28'],
    majorDistricts: [
      { name: 'Saharanpur', samplePin: '247001' },
      { name: 'Lucknow', samplePin: '226001' },
      { name: 'Noida (Gautam Buddha Nagar)', samplePin: '201301' },
      { name: 'Ghaziabad', samplePin: '201001' },
      { name: 'Meerut', samplePin: '250001' },
      { name: 'Muzaffarnagar', samplePin: '251001' },
      { name: 'Kanpur', samplePin: '208001' },
      { name: 'Agra', samplePin: '282001' },
      { name: 'Varanasi', samplePin: '221001' },
      { name: 'Prayagraj', samplePin: '211001' },
      { name: 'Moradabad', samplePin: '244001' },
    ],
  },
  {
    name: 'Delhi (NCT)',
    code: '07',
    pinPrefixes: ['11'],
    majorDistricts: [
      { name: 'New Delhi', samplePin: '110001' },
      { name: 'Central Delhi (Chandni Chowk)', samplePin: '110006' },
      { name: 'South Delhi', samplePin: '110017' },
      { name: 'East Delhi', samplePin: '110092' },
      { name: 'West Delhi', samplePin: '110027' },
    ],
  },
  {
    name: 'Maharashtra',
    code: '27',
    pinPrefixes: ['40', '41', '42', '43', '44'],
    majorDistricts: [
      { name: 'Mumbai', samplePin: '400001' },
      { name: 'Pune', samplePin: '411001' },
      { name: 'Nagpur', samplePin: '440001' },
      { name: 'Nashik', samplePin: '422001' },
      { name: 'Thane', samplePin: '400601' },
      { name: 'Chhatrapati Sambhajinagar', samplePin: '431001' },
    ],
  },
  {
    name: 'Karnataka',
    code: '29',
    pinPrefixes: ['56', '57', '58', '59'],
    majorDistricts: [
      { name: 'Bengaluru Urban', samplePin: '560001' },
      { name: 'Mysuru', samplePin: '570001' },
      { name: 'Hubballi-Dharwad', samplePin: '580001' },
      { name: 'Mangaluru', samplePin: '575001' },
    ],
  },
  {
    name: 'Gujarat',
    code: '24',
    pinPrefixes: ['36', '37', '38', '39'],
    majorDistricts: [
      { name: 'Ahmedabad', samplePin: '380001' },
      { name: 'Surat', samplePin: '395001' },
      { name: 'Vadodara', samplePin: '390001' },
      { name: 'Rajkot', samplePin: '360001' },
    ],
  },
  {
    name: 'Rajasthan',
    code: '08',
    pinPrefixes: ['30', '31', '32', '33', '34'],
    majorDistricts: [
      { name: 'Jaipur', samplePin: '302001' },
      { name: 'Jodhpur', samplePin: '342001' },
      { name: 'Udaipur', samplePin: '313001' },
      { name: 'Kota', samplePin: '324001' },
    ],
  },
  {
    name: 'Tamil Nadu',
    code: '33',
    pinPrefixes: ['60', '61', '62', '63', '64'],
    majorDistricts: [
      { name: 'Chennai', samplePin: '600001' },
      { name: 'Coimbatore', samplePin: '641001' },
      { name: 'Madurai', samplePin: '625001' },
      { name: 'Tiruppur', samplePin: '641601' },
    ],
  },
  {
    name: 'West Bengal',
    code: '19',
    pinPrefixes: ['70', '71', '72', '73', '74'],
    majorDistricts: [
      { name: 'Kolkata', samplePin: '700001' },
      { name: 'Howrah', samplePin: '711101' },
      { name: 'Siliguri (Darjeeling)', samplePin: '734001' },
    ],
  },
  {
    name: 'Telangana',
    code: '36',
    pinPrefixes: ['50'],
    majorDistricts: [
      { name: 'Hyderabad', samplePin: '500001' },
      { name: 'Warangal', samplePin: '506001' },
    ],
  },
  {
    name: 'Haryana',
    code: '06',
    pinPrefixes: ['12', '13'],
    majorDistricts: [
      { name: 'Gurugram', samplePin: '122001' },
      { name: 'Faridabad', samplePin: '121001' },
      { name: 'Ambala', samplePin: '134003' },
      { name: 'Panipat', samplePin: '132103' },
      { name: 'Yamunanagar', samplePin: '135001' },
    ],
  },
  {
    name: 'Punjab',
    code: '03',
    pinPrefixes: ['14', '15', '16'],
    majorDistricts: [
      { name: 'Ludhiana', samplePin: '141001' },
      { name: 'Amritsar', samplePin: '143001' },
      { name: 'Jalandhar', samplePin: '144001' },
      { name: 'Patiala', samplePin: '147001' },
    ],
  },
  {
    name: 'Uttarakhand',
    code: '05',
    pinPrefixes: ['24', '26'],
    majorDistricts: [
      { name: 'Dehradun', samplePin: '248001' },
      { name: 'Haridwar', samplePin: '249401' },
      { name: 'Roorkee', samplePin: '247667' },
      { name: 'Haldwani', samplePin: '263139' },
    ],
  },
  {
    name: 'Madhya Pradesh',
    code: '23',
    pinPrefixes: ['45', '46', '47', '48'],
    majorDistricts: [
      { name: 'Indore', samplePin: '452001' },
      { name: 'Bhopal', samplePin: '462001' },
      { name: 'Jabalpur', samplePin: '482001' },
      { name: 'Gwalior', samplePin: '474001' },
    ],
  },
  {
    name: 'Bihar',
    code: '10',
    pinPrefixes: ['80', '81', '82', '83', '84', '85'],
    majorDistricts: [
      { name: 'Patna', samplePin: '800001' },
      { name: 'Gaya', samplePin: '823001' },
      { name: 'Muzaffarpur', samplePin: '842001' },
    ],
  },
  {
    name: 'Kerala',
    code: '32',
    pinPrefixes: ['67', '68', '69'],
    majorDistricts: [
      { name: 'Kochi (Ernakulam)', samplePin: '682001' },
      { name: 'Thiruvananthapuram', samplePin: '695001' },
      { name: 'Kozhikode', samplePin: '673001' },
    ],
  },
  {
    name: 'Andhra Pradesh',
    code: '37',
    pinPrefixes: ['51', '52', '53'],
    majorDistricts: [
      { name: 'Visakhapatnam', samplePin: '530001' },
      { name: 'Vijayawada', samplePin: '520001' },
    ],
  },
  {
    name: 'Odisha',
    code: '21',
    pinPrefixes: ['75', '76', '77'],
    majorDistricts: [
      { name: 'Bhubaneswar', samplePin: '751001' },
      { name: 'Cuttack', samplePin: '753001' },
    ],
  },
  {
    name: 'Assam',
    code: '18',
    pinPrefixes: ['78'],
    majorDistricts: [
      { name: 'Guwahati (Kamrup)', samplePin: '781001' },
      { name: 'Dibrugarh', samplePin: '786001' },
    ],
  },
  {
    name: 'Jharkhand',
    code: '20',
    pinPrefixes: ['81', '82', '83'],
    majorDistricts: [
      { name: 'Ranchi', samplePin: '834001' },
      { name: 'Jamshedpur', samplePin: '831001' },
    ],
  },
  {
    name: 'Chhattisgarh',
    code: '22',
    pinPrefixes: ['49'],
    majorDistricts: [
      { name: 'Raipur', samplePin: '492001' },
      { name: 'Bilaspur', samplePin: '495001' },
    ],
  },
  {
    name: 'Himachal Pradesh',
    code: '02',
    pinPrefixes: ['17'],
    majorDistricts: [
      { name: 'Shimla', samplePin: '171001' },
      { name: 'Solan', samplePin: '173212' },
    ],
  },
  {
    name: 'Jammu & Kashmir (UT)',
    code: '01',
    pinPrefixes: ['18', '19'],
    majorDistricts: [
      { name: 'Jammu', samplePin: '180001' },
      { name: 'Srinagar', samplePin: '190001' },
    ],
  },
  {
    name: 'Chandigarh (UT)',
    code: '04',
    pinPrefixes: ['160'],
    majorDistricts: [{ name: 'Chandigarh', samplePin: '160001' }],
  },
  {
    name: 'Goa',
    code: '30',
    pinPrefixes: ['403'],
    majorDistricts: [{ name: 'Panaji (North Goa)', samplePin: '403001' }],
  },
  {
    name: 'Tripura',
    code: '16',
    pinPrefixes: ['799'],
    majorDistricts: [{ name: 'Agartala', samplePin: '799001' }],
  },
  {
    name: 'Meghalaya',
    code: '17',
    pinPrefixes: ['793', '794'],
    majorDistricts: [{ name: 'Shillong', samplePin: '793001' }],
  },
  {
    name: 'Manipur',
    code: '14',
    pinPrefixes: ['795'],
    majorDistricts: [{ name: 'Imphal', samplePin: '795001' }],
  },
  {
    name: 'Nagaland',
    code: '13',
    pinPrefixes: ['797'],
    majorDistricts: [{ name: 'Kohima', samplePin: '797001' }],
  },
  {
    name: 'Arunachal Pradesh',
    code: '12',
    pinPrefixes: ['790', '791', '792'],
    majorDistricts: [{ name: 'Itanagar', samplePin: '791111' }],
  },
  {
    name: 'Mizoram',
    code: '15',
    pinPrefixes: ['796'],
    majorDistricts: [{ name: 'Aizawl', samplePin: '796001' }],
  },
  {
    name: 'Sikkim',
    code: '11',
    pinPrefixes: ['737'],
    majorDistricts: [{ name: 'Gangtok', samplePin: '737101' }],
  },
  {
    name: 'Puducherry (UT)',
    code: '34',
    pinPrefixes: ['605'],
    majorDistricts: [{ name: 'Puducherry', samplePin: '605001' }],
  },
  {
    name: 'Ladakh (UT)',
    code: '38',
    pinPrefixes: ['194'],
    majorDistricts: [{ name: 'Leh', samplePin: '194101' }],
  },
  {
    name: 'Andaman & Nicobar Islands (UT)',
    code: '35',
    pinPrefixes: ['744'],
    majorDistricts: [{ name: 'Sri Vijaya Puram (Port Blair)', samplePin: '744101' }],
  },
  {
    name: 'Dadra & Nagar Haveli and Daman & Diu (UT)',
    code: '26',
    pinPrefixes: ['396'],
    majorDistricts: [{ name: 'Silvassa', samplePin: '396230' }],
  },
  {
    name: 'Lakshadweep (UT)',
    code: '31',
    pinPrefixes: ['68255'],
    majorDistricts: [{ name: 'Kavaratti', samplePin: '682555' }],
  },
];

// Infer Indian State/City approximately from first 2–3 digits of a 6-digit PIN
export function resolveIndianPinMetadata(pin: string): {
  valid: boolean;
  state: string;
  cityLabel: string;
  zoneDigit: string;
} {
  const clean = (pin || '').replace(/\D/g, '');
  if (!/^[1-9]\d{5}$/.test(clean)) {
    return { valid: false, state: 'India', cityLabel: 'Invalid PIN', zoneDigit: '' };
  }

  if (clean.startsWith('247')) {
    return { valid: true, state: 'Uttar Pradesh', cityLabel: 'Saharanpur Region', zoneDigit: clean[0] };
  }
  if (clean.startsWith('248')) {
    return { valid: true, state: 'Uttarakhand', cityLabel: 'Dehradun Region', zoneDigit: clean[0] };
  }
  if (clean.startsWith('160')) {
    return { valid: true, state: 'Chandigarh (UT)', cityLabel: 'Chandigarh Tri-City', zoneDigit: clean[0] };
  }
  if (clean.startsWith('403')) {
    return { valid: true, state: 'Goa', cityLabel: 'Goa', zoneDigit: clean[0] };
  }

  const prefix2 = clean.slice(0, 2);
  const matchedState = INDIAN_STATES_UTS.find((st) => st.pinPrefixes.includes(prefix2));
  if (matchedState) {
    return {
      valid: true,
      state: matchedState.name,
      cityLabel: `${matchedState.majorDistricts[0]?.name || matchedState.name} Zone`,
      zoneDigit: clean[0],
    };
  }

  return { valid: true, state: 'India', cityLabel: `PIN ${clean}`, zoneDigit: clean[0] };
}

// Prohibited & Restricted Goods check under Indian laws
const PROHIBITED_KEYWORDS = [
  'firearm',
  'pistol',
  'revolver',
  'ammunition',
  'gunpowder',
  'explosive',
  'dynamite',
  'narcotic',
  'cocaine',
  'heroin',
  'ganja',
  'marijuana',
  'cannabis',
  'charas',
  'opium',
  'ivory',
  'tiger skin',
  'pangolin',
  'counterfeit currency',
  'fake passport',
  'fake aadhaar',
  'prescription steroid',
  'banned pesticide',
];

export function checkProhibitedProduct(
  title: string,
  description: string
): { blocked: boolean; matchedTerm?: string; message?: string } {
  const combined = `${title} ${description}`.toLowerCase();
  for (const term of PROHIBITED_KEYWORDS) {
    if (combined.includes(term)) {
      return {
        blocked: true,
        matchedTerm: term,
        message: `Blocked under MattoKart Lawful Trade Policy: "${term}" falls under prohibited/restricted goods under Indian laws.`,
      };
    }
  }
  return { blocked: false };
}

// Honest Pan-India Shipping Availability & Fee Engine (No false promises)
export interface ShippingAvailabilityQuote {
  serviceable: boolean;
  zone: ShippingZone;
  reasonIfUnserviceable?: string;
  availableMethods: {
    type: DeliveryType;
    label: string;
    courierName: string;
    fee: number;
    estimatedWindow: string;
    estimatedDates: string;
    note: string;
  }[];
  recommendedScope: ShippingScope;
}

function formatDateRange(minDays: number, maxDays: number): string {
  const now = new Date();
  const d1 = new Date(now.getTime() + minDays * 86400000);
  const d2 = new Date(now.getTime() + maxDays * 86400000);
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  return `${fmt(d1)} – ${fmt(d2)}`;
}

export function inferProductShippingScope(product: Product): ShippingScope {
  if (product.shippingScope) return product.shippingScope;
  // Bulk construction materials (cement bags, TMT steel, bricks, sand) default to local/regional surface fleet
  if (product.categoryId === 'construction') {
    return 'state_regional';
  }
  return 'pan_india';
}

export function calculateProductShippingQuote(
  product: Product,
  buyerPin: string,
  quantity = 1
): ShippingAvailabilityQuote {
  const pinMeta = resolveIndianPinMetadata(buyerPin);
  if (!pinMeta.valid) {
    return {
      serviceable: false,
      zone: 'interstate',
      reasonIfUnserviceable: 'Please enter a valid 6-digit Indian PIN code.',
      availableMethods: [],
      recommendedScope: inferProductShippingScope(product),
    };
  }

  const sellerPin = (product.sellerPinCode || '247001').replace(/\D/g, '');
  const sellerState = (product.sellerState || 'Uttar Pradesh').toLowerCase();
  const buyerState = pinMeta.state.toLowerCase();
  const scope = inferProductShippingScope(product);

  const isLocalPin =
    buyerPin.slice(0, 3) === sellerPin.slice(0, 3) ||
    (sellerPin.startsWith('247') && buyerPin.startsWith('247'));
  const isSameStateOrNcr =
    buyerState === sellerState ||
    buyerPin[0] === sellerPin[0] ||
    (sellerState.includes('uttar pradesh') && (buyerState.includes('delhi') || buyerState.includes('uttarakhand') || buyerState.includes('haryana')));

  const zone: ShippingZone = isLocalPin
    ? 'local'
    : isSameStateOrNcr
    ? 'intercity'
    : 'interstate';

  // Honest restriction check: heavy construction / local_only goods cannot ship cross-country by parcel courier
  if (scope === 'local_only' && zone !== 'local') {
    return {
      serviceable: false,
      zone,
      reasonIfUnserviceable: `This product is Local Delivery Only around ${product.sellerCity || 'Saharanpur'} (${sellerPin}). Cannot ship to PIN ${buyerPin}.`,
      availableMethods: [],
      recommendedScope: scope,
    };
  }

  if (scope === 'state_regional' && zone === 'interstate') {
    return {
      serviceable: false,
      zone,
      reasonIfUnserviceable: `Heavy bulk item restricted to ${product.sellerState || 'Uttar Pradesh'} & neighboring NCR/regional transport. Courier unavailable to ${pinMeta.state} (${buyerPin}).`,
      availableMethods: [],
      recommendedScope: scope,
    };
  }

  const unitWeight =
    product.estimatedWeightKg ??
    (product.categoryId === 'construction'
      ? 25
      : product.categoryId === 'furniture'
      ? 14
      : product.categoryId === 'electronics'
      ? 3.5
      : 0.8);
  const totalWeightKg = Math.max(0.5, unitWeight * quantity);
  const subtotal = (product.price || 0) * quantity;

  const methods: ShippingAvailabilityQuote['availableMethods'] = [];

  if (zone === 'local') {
    methods.push({
      type: 'seller_delivery',
      label: 'Seller Direct Delivery',
      courierName: `${product.sellerShopName} Fleet`,
      fee: 0,
      estimatedWindow: '24–48 Hours',
      estimatedDates: formatDateRange(1, 2),
      note: 'Free direct doorstep delivery within seller city/district',
    });

    if (sellerPin.startsWith('247') && buyerPin.startsWith('247')) {
      methods.push({
        type: 'mattokart_delivery',
        label: 'MattoKart Local Express',
        courierName: 'MattoKart Verified Partner',
        fee: subtotal >= 1500 ? 0 : 49,
        estimatedWindow: 'Same / Next Day',
        estimatedDates: formatDateRange(1, 1),
        note: subtotal >= 1500 ? 'Free Express on orders ₹1,500+' : 'Tracked local dispatch',
      });
    }
  } else if (zone === 'intercity') {
    const intercityFee =
      scope === 'state_regional'
        ? Math.min(450, Math.round(90 + totalWeightKg * 6))
        : subtotal >= 999 && totalWeightKg <= 3
        ? 0
        : Math.round(60 + Math.max(0, totalWeightKg - 1) * 18);

    methods.push({
      type: 'interstate_courier',
      label: 'Regional Intercity Courier / Transport',
      courierName: scope === 'state_regional' ? 'MattoKart Regional Cargo' : 'Delhivery / BlueDart Surface',
      fee: intercityFee,
      estimatedWindow: '2–4 Days',
      estimatedDates: formatDateRange(2, 4),
      note: `Shipped from ${product.sellerCity || 'Saharanpur'} (${product.sellerState || 'UP'}) to ${pinMeta.cityLabel}`,
    });

    methods.push({
      type: 'seller_delivery',
      label: 'Seller Arranged Dispatch',
      courierName: `${product.sellerShopName} Transport`,
      fee: scope === 'state_regional' ? 150 : 0,
      estimatedWindow: '3–5 Days',
      estimatedDates: formatDateRange(3, 5),
      note: 'Direct transport arranged by merchant upon order confirmation',
    });
  } else {
    // Interstate Pan-India Courier
    const weightSurcharge = Math.round(Math.max(0, totalWeightKg - 1) * 28);
    const courierFee = subtotal >= 1499 && totalWeightKg <= 2 ? 0 : Math.min(950, 79 + weightSurcharge);

    methods.push({
      type: 'interstate_courier',
      label: 'Pan-India National Courier',
      courierName: 'Delhivery / India Post / DTDC Air-Surface',
      fee: courierFee,
      estimatedWindow: '4–7 Business Days',
      estimatedDates: formatDateRange(4, 7),
      note:
        courierFee === 0
          ? `Free Pan-India shipping from ${product.sellerCity || 'Origin'} to ${pinMeta.state}`
          : `Calculated by weight (~${totalWeightKg.toFixed(1)} kg) & interstate zone`,
    });
  }

  return {
    serviceable: true,
    zone,
    availableMethods: methods,
    recommendedScope: scope,
  };
}

export function calculateCartShippingOptions(
  cartItems: { product: Product; quantity: number }[],
  buyerPin: string
): {
  serviceable: boolean;
  blockedItems: { productName: string; reason: string }[];
  zone: ShippingZone;
  totalWeightKg: number;
  estimatedDates: string;
  options: {
    type: DeliveryType;
    title: string;
    subtitle: string;
    courierName: string;
    fee: number;
    eta: string;
  }[];
} {
  const pinMeta = resolveIndianPinMetadata(buyerPin);
  if (!pinMeta.valid || cartItems.length === 0) {
    return {
      serviceable: false,
      blockedItems: [{ productName: 'Cart', reason: 'Enter a valid 6-digit Indian PIN code.' }],
      zone: 'interstate',
      totalWeightKg: 0,
      estimatedDates: '',
      options: [],
    };
  }

  const blockedItems: { productName: string; reason: string }[] = [];
  let maxZone: ShippingZone = 'local';
  let totalWeightKg = 0;
  let subtotal = 0;

  for (const item of cartItems) {
    const q = calculateProductShippingQuote(item.product, buyerPin, item.quantity);
    if (!q.serviceable) {
      blockedItems.push({
        productName: item.product.name,
        reason: q.reasonIfUnserviceable || 'Not deliverable to this PIN code',
      });
    }
    if (q.zone === 'interstate') maxZone = 'interstate';
    else if (q.zone === 'intercity' && maxZone === 'local') maxZone = 'intercity';

    const w =
      item.product.estimatedWeightKg ??
      (item.product.categoryId === 'construction' ? 25 : item.product.categoryId === 'furniture' ? 14 : 1.2);
    totalWeightKg += w * item.quantity;
    subtotal += item.product.price * item.quantity;
  }

  if (blockedItems.length > 0) {
    return {
      serviceable: false,
      blockedItems,
      zone: maxZone,
      totalWeightKg,
      estimatedDates: '',
      options: [],
    };
  }

  const options: {
    type: DeliveryType;
    title: string;
    subtitle: string;
    courierName: string;
    fee: number;
    eta: string;
  }[] = [];

  if (maxZone === 'local') {
    options.push({
      type: 'seller_delivery',
      title: 'Seller Direct Local Delivery',
      subtitle: 'Dispatched directly by the verified merchant to your doorstep.',
      courierName: 'Seller Local Fleet',
      fee: 0,
      eta: `24–48 Hours (${formatDateRange(1, 2)})`,
    });
    if (buyerPin.startsWith('247')) {
      options.push({
        type: 'mattokart_delivery',
        title: 'MattoKart Express Local Rider',
        subtitle: 'Assigned to a verified MattoKart fleet partner with live updates.',
        courierName: 'MattoKart Fleet',
        fee: subtotal >= 1500 ? 0 : 49,
        eta: `Same / Next Day (${formatDateRange(1, 1)})`,
      });
    }
  } else if (maxZone === 'intercity') {
    const fee = subtotal >= 1499 && totalWeightKg <= 4 ? 0 : Math.min(490, Math.round(69 + Math.max(0, totalWeightKg - 1) * 16));
    options.push({
      type: 'interstate_courier',
      title: 'Intercity Surface / Express Courier',
      subtitle: `Fast intercity transit to ${pinMeta.cityLabel}, ${pinMeta.state} (~${totalWeightKg.toFixed(1)} kg).`,
      courierName: 'Delhivery / BlueDart Intercity',
      fee,
      eta: `2–4 Days (${formatDateRange(2, 4)})`,
    });
    options.push({
      type: 'seller_delivery',
      title: 'Seller Arranged Dispatch',
      subtitle: 'Merchant dispatches directly via local carrier / tempo.',
      courierName: 'Seller Managed Shipping',
      fee: totalWeightKg > 15 ? 180 : 40,
      eta: `3–5 Days (${formatDateRange(3, 5)})`,
    });
  } else {
    const fee = subtotal >= 1999 && totalWeightKg <= 2.5 ? 0 : Math.min(990, Math.round(89 + Math.max(0, totalWeightKg - 1) * 26));
    options.push({
      type: 'interstate_courier',
      title: 'Pan-India National Courier (Standard)',
      subtitle: `Tracked interstate shipping across India to ${pinMeta.state} (~${totalWeightKg.toFixed(1)} kg).`,
      courierName: 'Delhivery / DTDC / India Post',
      fee,
      eta: `4–7 Business Days (${formatDateRange(4, 7)})`,
    });
  }

  return {
    serviceable: true,
    blockedItems: [],
    zone: maxZone,
    totalWeightKg,
    estimatedDates: maxZone === 'local' ? formatDateRange(1, 2) : maxZone === 'intercity' ? formatDateRange(2, 4) : formatDateRange(4, 7),
    options,
  };
}

export function isHeavyOrBulkyProduct(product: Product): boolean {
  if (product.deliveryMode === 'seller_transport') return true;
  if (product.categoryId === 'construction') return true;
  const w = product.estimatedWeightKg ?? 0;
  if (w >= 15) return true;
  return false;
}

export interface CartStockIssue {
  productId: string;
  productName: string;
  issue: string;
  availableStock: number;
  minOrderQuantity: number;
}

export function validateCartStock(
  cartItems: { product: Product; quantity: number }[]
): CartStockIssue[] {
  const issues: CartStockIssue[] = [];
  for (const item of cartItems) {
    const p = item.product;
    const minQty = p.minOrderQuantity || 1;
    if (!p.inStock || (p.stockCount ?? 0) <= 0) {
      issues.push({
        productId: p.id,
        productName: p.name,
        issue: 'Currently out of stock. Please remove to proceed.',
        availableStock: 0,
        minOrderQuantity: minQty,
      });
    } else if (item.quantity > p.stockCount) {
      issues.push({
        productId: p.id,
        productName: p.name,
        issue: `Only ${p.stockCount} ${p.unit}(s) available in seller inventory.`,
        availableStock: p.stockCount,
        minOrderQuantity: minQty,
      });
    } else if (item.quantity < minQty) {
      issues.push({
        productId: p.id,
        productName: p.name,
        issue: `Minimum order quantity is ${minQty} ${p.unit}(s).`,
        availableStock: p.stockCount,
        minOrderQuantity: minQty,
      });
    }
  }
  return issues;
}

export interface SellerShippingMethodOption {
  type: DeliveryType;
  label: string;
  courierName: string;
  fee: number;
  eta: string;
  estimatedDates: string;
  isHeavyTransport: boolean;
  codSupported: boolean;
  codFee: number;
  note: string;
}

export interface SellerCheckoutQuote {
  sellerId: string;
  sellerShopName: string;
  sellerName: string;
  sellerCity: string;
  sellerState: string;
  sellerPinCode: string;
  items: { product: Product; quantity: number }[];
  subtotal: number;
  totalWeightKg: number;
  containsHeavyGoods: boolean;
  zone: ShippingZone;
  serviceable: boolean;
  unserviceableReason?: string;
  availableMethods: SellerShippingMethodOption[];
  selectedMethod: SellerShippingMethodOption | null;
  codSupported: boolean;
  codFee: number;
}

export interface MultiVendorCheckoutQuote {
  validPin: boolean;
  pinMeta: ReturnType<typeof resolveIndianPinMetadata>;
  stockIssues: CartStockIssue[];
  sellerQuotes: SellerCheckoutQuote[];
  serviceable: boolean;
  blockedReasons: { sellerShopName: string; productName?: string; reason: string }[];
  codEligible: boolean;
  codUnavailableReason?: string;
  subtotal: number;
  totalShippingFee: number;
  totalCodFee: number;
  grandTotalWithCod: number;
  grandTotalPrepaid: number;
  overallEta: string;
}

export function calculateMultiVendorCheckoutQuote(
  cartItems: { product: Product; quantity: number }[],
  buyerPin: string,
  selectedSellerModes: Record<string, DeliveryType> = {}
): MultiVendorCheckoutQuote {
  const cleanPin = (buyerPin || '').replace(/\D/g, '');
  const pinMeta = resolveIndianPinMetadata(cleanPin);
  const stockIssues = validateCartStock(cartItems);
  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  if (cartItems.length === 0) {
    return {
      validPin: pinMeta.valid,
      pinMeta,
      stockIssues: [],
      sellerQuotes: [],
      serviceable: false,
      blockedReasons: [{ sellerShopName: 'Cart', reason: 'Your shopping cart is empty.' }],
      codEligible: false,
      codUnavailableReason: 'Add items to cart first.',
      subtotal: 0,
      totalShippingFee: 0,
      totalCodFee: 0,
      grandTotalWithCod: 0,
      grandTotalPrepaid: 0,
      overallEta: '',
    };
  }

  // Group cart items by seller
  const grouped = new Map<string, { product: Product; quantity: number }[]>();
  for (const item of cartItems) {
    const sid = item.product.sellerId || 'seller-1';
    const existing = grouped.get(sid) || [];
    existing.push(item);
    grouped.set(sid, existing);
  }

  const sellerQuotes: SellerCheckoutQuote[] = [];
  const blockedReasons: { sellerShopName: string; productName?: string; reason: string }[] = [];
  let codEligible = true;
  let codUnavailableReason: string | undefined;

  for (const [sellerId, items] of grouped.entries()) {
    const first = items[0].product;
    const sellerShopName = first.sellerShopName || 'Verified MattoKart Seller';
    const sellerName = first.sellerName || sellerShopName;
    const sellerCity = first.sellerCity || 'Saharanpur';
    const sellerState = first.sellerState || 'Uttar Pradesh';
    const sellerPinCode = (first.sellerPinCode || '247001').replace(/\D/g, '');
    const sellerSubtotal = items.reduce((s, it) => s + it.product.price * it.quantity, 0);

    const sellerWeightKg = items.reduce((s, it) => {
      const w =
        it.product.estimatedWeightKg ??
        (it.product.categoryId === 'construction' ? 25 : it.product.categoryId === 'furniture' ? 14 : 1.0);
      return s + w * it.quantity;
    }, 0);

    const containsHeavyGoods = items.some((it) => isHeavyOrBulkyProduct(it.product));
    const sellerCodAllowed = items.every((it) => it.product.codAvailable !== false);
    if (!sellerCodAllowed) {
      codEligible = false;
      codUnavailableReason = `COD is disabled by ${sellerShopName} for one or more specialized/heavy items.`;
    }

    if (!pinMeta.valid) {
      blockedReasons.push({
        sellerShopName,
        reason: 'Enter a valid 6-digit Indian PIN code to check delivery availability.',
      });
      sellerQuotes.push({
        sellerId,
        sellerShopName,
        sellerName,
        sellerCity,
        sellerState,
        sellerPinCode,
        items,
        subtotal: sellerSubtotal,
        totalWeightKg: sellerWeightKg,
        containsHeavyGoods,
        zone: 'interstate',
        serviceable: false,
        unserviceableReason: 'Invalid 6-digit PIN code.',
        availableMethods: [],
        selectedMethod: null,
        codSupported: sellerCodAllowed,
        codFee: 0,
      });
      continue;
    }

    const isLocalPin =
      cleanPin.slice(0, 3) === sellerPinCode.slice(0, 3) ||
      (sellerPinCode.startsWith('247') && cleanPin.startsWith('247'));
    const buyerStateLower = pinMeta.state.toLowerCase();
    const sellerStateLower = sellerState.toLowerCase();
    const isSameStateOrNcr =
      buyerStateLower === sellerStateLower ||
      cleanPin[0] === sellerPinCode[0] ||
      (sellerStateLower.includes('uttar pradesh') &&
        (buyerStateLower.includes('delhi') ||
          buyerStateLower.includes('uttarakhand') ||
          buyerStateLower.includes('haryana')));

    const zone: ShippingZone = isLocalPin ? 'local' : isSameStateOrNcr ? 'intercity' : 'interstate';

    // Check strict shipping restrictions per item
    let unserviceableReason: string | undefined;
    for (const it of items) {
      const scope = inferProductShippingScope(it.product);
      const localEnabled = it.product.localDeliveryAvailable !== false;

      if (scope === 'local_only' && zone !== 'local') {
        unserviceableReason = `"${it.product.name}" is Local Delivery Only around ${sellerCity} (${sellerPinCode}). Cannot ship to PIN ${cleanPin}.`;
        blockedReasons.push({ sellerShopName, productName: it.product.name, reason: unserviceableReason });
        break;
      }
      if (!localEnabled && zone === 'local') {
        unserviceableReason = `Local self-delivery is disabled for "${it.product.name}".`;
        blockedReasons.push({ sellerShopName, productName: it.product.name, reason: unserviceableReason });
        break;
      }
      if (scope === 'state_regional' && zone === 'interstate') {
        unserviceableReason = `"${it.product.name}" is Heavy / Regional Transport goods limited to ${sellerState} & nearby NCR. Please use Bulk Enquiry for interstate freight.`;
        blockedReasons.push({ sellerShopName, productName: it.product.name, reason: unserviceableReason });
        break;
      }
      if (it.product.deliveryMode === 'seller_transport' && zone === 'interstate' && scope !== 'pan_india') {
        unserviceableReason = `"${it.product.name}" uses Seller-Managed Heavy Transport only within ${sellerState} / local district.`;
        blockedReasons.push({ sellerShopName, productName: it.product.name, reason: unserviceableReason });
        break;
      }
    }

    if (unserviceableReason) {
      sellerQuotes.push({
        sellerId,
        sellerShopName,
        sellerName,
        sellerCity,
        sellerState,
        sellerPinCode,
        items,
        subtotal: sellerSubtotal,
        totalWeightKg: sellerWeightKg,
        containsHeavyGoods,
        zone,
        serviceable: false,
        unserviceableReason,
        availableMethods: [],
        selectedMethod: null,
        codSupported: false,
        codFee: 0,
      });
      continue;
    }

    const methods: SellerShippingMethodOption[] = [];
    const customSellerFee = items.reduce(
      (maxFee, it) => (typeof it.product.sellerDeliveryFee === 'number' ? Math.max(maxFee, it.product.sellerDeliveryFee) : maxFee),
      -1
    );
    const allCourierCompatible = items.every((it) => it.product.deliveryMode !== 'seller_transport') && !containsHeavyGoods;
    const anySellerTransport = items.some(
      (it) => it.product.deliveryMode === 'seller_transport' || it.product.deliveryMode === 'both' || isHeavyOrBulkyProduct(it.product)
    );

    if (zone === 'local') {
      // Option 1: Seller Direct / Heavy Transport
      const localFee = customSellerFee >= 0 ? customSellerFee : containsHeavyGoods && sellerSubtotal < 3000 ? 150 : 0;
      methods.push({
        type: containsHeavyGoods ? 'seller_transport' : 'seller_delivery',
        label: containsHeavyGoods ? 'Seller Heavy Transport / Tempo' : 'Seller Direct Doorstep Delivery',
        courierName: `${sellerShopName} Fleet`,
        fee: localFee,
        eta: containsHeavyGoods ? 'Same Day – 48 Hrs' : '24–48 Hours',
        estimatedDates: formatDateRange(1, 2),
        isHeavyTransport: containsHeavyGoods,
        codSupported: sellerCodAllowed,
        codFee: 0,
        note: localFee === 0 ? `Free doorstep dispatch by ${sellerShopName}` : `Direct merchant vehicle dispatch (~${sellerWeightKg.toFixed(1)} kg)`,
      });

      // Option 2: MattoKart Local Express (for lightweight goods in 247xxx Saharanpur hub)
      if (!containsHeavyGoods && sellerPinCode.startsWith('247') && cleanPin.startsWith('247')) {
        const mkFee = sellerSubtotal >= 1500 ? 0 : 49;
        methods.push({
          type: 'mattokart_delivery',
          label: 'MattoKart Express Local Rider',
          courierName: 'MattoKart Verified Fleet',
          fee: mkFee,
          eta: 'Same / Next Day',
          estimatedDates: formatDateRange(1, 1),
          isHeavyTransport: false,
          codSupported: sellerCodAllowed,
          codFee: 0,
          note: mkFee === 0 ? 'Free Express on orders ₹1,500+ from this shop' : 'Tracked Saharanpur rider delivery',
        });
      }
    } else if (zone === 'intercity') {
      if (allCourierCompatible) {
        const fee =
          sellerSubtotal >= 1499 && sellerWeightKg <= 4
            ? 0
            : Math.min(490, Math.round(69 + Math.max(0, sellerWeightKg - 1) * 16));
        const codHandling = sellerCodAllowed ? (sellerSubtotal >= 1999 ? 0 : 25) : 0;
        methods.push({
          type: 'interstate_courier',
          label: 'Standard Intercity Courier',
          courierName: 'Courier Aggregator (Surface / Air)',
          fee,
          eta: '2–4 Days',
          estimatedDates: formatDateRange(2, 4),
          isHeavyTransport: false,
          codSupported: sellerCodAllowed,
          codFee: codHandling,
          note: `Weight: ~${sellerWeightKg.toFixed(1)} kg · Shipped from ${sellerCity} to ${pinMeta.cityLabel}`,
        });
      }

      if (anySellerTransport || !allCourierCompatible || items.some((it) => it.product.localDeliveryAvailable !== false)) {
        const transportFee =
          customSellerFee >= 0
            ? customSellerFee
            : containsHeavyGoods
            ? Math.min(850, Math.round(180 + sellerWeightKg * 5))
            : 60;
        methods.push({
          type: 'seller_transport',
          label: containsHeavyGoods ? 'Seller-Managed Heavy Transport / Truck' : 'Seller-Arranged Intercity Dispatch',
          courierName: `${sellerShopName} Transport`,
          fee: transportFee,
          eta: '3–5 Days',
          estimatedDates: formatDateRange(3, 5),
          isHeavyTransport: true,
          codSupported: sellerCodAllowed,
          codFee: 0,
          note: 'Merchant arranges carrier/tempo & enters LR/tracking details upon dispatch',
        });
      }
    } else {
      // Interstate Pan-India
      if (allCourierCompatible || items.every((it) => inferProductShippingScope(it.product) === 'pan_india' && it.product.deliveryMode !== 'seller_transport')) {
        const weightSurcharge = Math.round(Math.max(0, sellerWeightKg - 1) * 26);
        const courierFee = sellerSubtotal >= 1999 && sellerWeightKg <= 2.5 ? 0 : Math.min(990, 89 + weightSurcharge);
        const codHandling = sellerCodAllowed ? (sellerSubtotal >= 2499 ? 0 : 35) : 0;
        methods.push({
          type: 'interstate_courier',
          label: 'Pan-India Standard Courier',
          courierName: 'National Surface / Air Courier',
          fee: courierFee,
          eta: '4–7 Business Days',
          estimatedDates: formatDateRange(4, 7),
          isHeavyTransport: false,
          codSupported: sellerCodAllowed,
          codFee: codHandling,
          note:
            courierFee === 0
              ? `Free Pan-India shipping from ${sellerCity} to ${pinMeta.state}`
              : `Weight ~${sellerWeightKg.toFixed(1)} kg · Interstate rate`,
        });
      } else {
        const heavyInterstateFee =
          customSellerFee >= 0 ? customSellerFee : Math.min(1800, Math.round(250 + sellerWeightKg * 12));
        methods.push({
          type: 'seller_transport',
          label: 'Seller-Managed Freight / Part-Load Transport',
          courierName: `${sellerShopName} Logistics`,
          fee: heavyInterstateFee,
          eta: '5–9 Business Days',
          estimatedDates: formatDateRange(5, 9),
          isHeavyTransport: true,
          codSupported: sellerCodAllowed,
          codFee: 0,
          note: 'Oversized / heavy item dispatched via merchant transport partner',
        });
      }
    }

    const requestedType = selectedSellerModes[sellerId];
    const selectedMethod = methods.find((m) => m.type === requestedType) || methods[0] || null;
    if (selectedMethod && !selectedMethod.codSupported) {
      codEligible = false;
      codUnavailableReason = codUnavailableReason || `COD unavailable for ${sellerShopName}.`;
    }

    sellerQuotes.push({
      sellerId,
      sellerShopName,
      sellerName,
      sellerCity,
      sellerState,
      sellerPinCode,
      items,
      subtotal: sellerSubtotal,
      totalWeightKg: sellerWeightKg,
      containsHeavyGoods,
      zone,
      serviceable: methods.length > 0,
      availableMethods: methods,
      selectedMethod,
      codSupported: selectedMethod ? selectedMethod.codSupported : false,
      codFee: selectedMethod ? selectedMethod.codFee : 0,
    });
  }

  const allServiceable = pinMeta.valid && blockedReasons.length === 0 && sellerQuotes.every((sq) => sq.serviceable);
  const totalShippingFee = sellerQuotes.reduce((s, sq) => s + (sq.selectedMethod?.fee || 0), 0);
  const totalCodFee = codEligible ? sellerQuotes.reduce((s, sq) => s + sq.codFee, 0) : 0;

  let overallEta = '2–5 Days';
  if (sellerQuotes.some((sq) => sq.zone === 'interstate')) {
    overallEta = sellerQuotes.some((sq) => sq.selectedMethod?.isHeavyTransport)
      ? `5–9 Business Days (${formatDateRange(5, 9)})`
      : `4–7 Business Days (${formatDateRange(4, 7)})`;
  } else if (sellerQuotes.some((sq) => sq.zone === 'intercity')) {
    overallEta = `2–4 Days (${formatDateRange(2, 4)})`;
  } else if (sellerQuotes.length > 0) {
    overallEta = `24–48 Hours (${formatDateRange(1, 2)})`;
  }

  return {
    validPin: pinMeta.valid,
    pinMeta,
    stockIssues,
    sellerQuotes,
    serviceable: allServiceable && stockIssues.length === 0,
    blockedReasons,
    codEligible,
    codUnavailableReason,
    subtotal,
    totalShippingFee,
    totalCodFee,
    grandTotalWithCod: subtotal + totalShippingFee + totalCodFee,
    grandTotalPrepaid: subtotal + totalShippingFee,
    overallEta,
  };
}

