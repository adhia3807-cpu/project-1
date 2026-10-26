/**
 * India Localization Utilities & Formatters
 * AI Advertisement Robot - Indian Market Edition
 */

/**
 * Format numbers into Indian currency format (₹ 1,00,000 / ₹ 1,499)
 */
export function formatINR(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === '') return '';
  
  const num = typeof amount === 'string' ? parseFloat(amount.replace(/[^0-9.-]+/g, '')) : amount;
  if (isNaN(num)) return String(amount);

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: num % 1 === 0 ? 0 : 2,
  }).format(num);
}

/**
 * Format large numbers in Indian Lakhs and Crores
 */
export function formatIndianCompactNumber(num: number): string {
  if (num >= 10000000) {
    return `₹${(num / 10000000).toFixed(2).replace(/\.00$/, '')} Crore`;
  }
  if (num >= 100000) {
    return `₹${(num / 100000).toFixed(2).replace(/\.00$/, '')} Lakh`;
  }
  return formatINR(num);
}

/**
 * Format date in Indian format: DD/MM/YYYY
 */
export function formatIndianDate(dateInput: string | Date | number): string {
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'Asia/Kolkata',
    }).format(d);
  } catch (e) {
    return String(dateInput);
  }
}

/**
 * Format time in Indian Standard Time (IST) 12-hour format: e.g. 02:30 PM IST
 */
export function formatIndianTimeIST(dateInput: string | Date | number, includeISTLabel = true): string {
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    
    const timeStr = new Intl.DateTimeFormat('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    }).format(d);

    return includeISTLabel ? `${timeStr} IST` : timeStr;
  } catch (e) {
    return '';
  }
}

/**
 * Format full date & time: DD/MM/YYYY, 02:30 PM IST
 */
export function formatIndianDateTimeIST(dateInput: string | Date | number): string {
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';

    return `${formatIndianDate(d)}, ${formatIndianTimeIST(d, true)}`;
  } catch (e) {
    return '';
  }
}

/**
 * Format Indian Phone number: +91 98765 43210
 */
export function formatIndianPhone(phone: string): string {
  if (!phone) return '';
  const cleaned = phone.replace(/[^0-9+]/g, '');
  
  if (cleaned.startsWith('+91') && cleaned.length === 13) {
    return `+91 ${cleaned.slice(3, 8)} ${cleaned.slice(8)}`;
  }
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  return phone;
}

/**
 * Generate WhatsApp Direct Chat Link (wa.me)
 */
export function getWhatsAppLink(phone: string, prefilledMessage?: string): string {
  if (!phone) return '#';
  const cleanNumber = phone.replace(/[^0-9]/g, '');
  const targetNumber = cleanNumber.startsWith('91') ? cleanNumber : `91${cleanNumber}`;
  const msgParam = prefilledMessage ? `?text=${encodeURIComponent(prefilledMessage)}` : '';
  return `https://wa.me/${targetNumber}${msgParam}`;
}

/**
 * Valid Indian States and Union Territories
 */
export const INDIAN_STATES_AND_UTS = [
  'Andaman and Nicobar Islands',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Lakshadweep',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];

/**
 * Common Indian Language Profiles
 */
export const INDIAN_SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
  { code: 'manglish', name: 'Manglish', native: 'Manglish (English Script)' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  { code: 'mr', name: 'Marathi', native: 'मराठी' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
];
