'use client';

import React from 'react';

// Map of country codes to emoji flags
const countryToFlag = (countryCode: string): string => {
  const code = countryCode.toUpperCase();
  // Convert country code to regional indicator symbols
  const codePoints = [...code].map(
    (char) => 127397 + char.charCodeAt(0)
  );
  return String.fromCodePoint(...codePoints);
};

// Common country names and their codes
const COUNTRY_CODES: Record<string, string> = {
  'us': 'US', 'usa': 'US', 'united states': 'US',
  'uk': 'GB', 'gb': 'GB', 'united kingdom': 'GB', 'england': 'GB',
  'ca': 'CA', 'canada': 'CA',
  'de': 'DE', 'germany': 'DE',
  'fr': 'FR', 'france': 'FR',
  'jp': 'JP', 'japan': 'JP',
  'kr': 'KR', 'korea': 'KR', 'south korea': 'KR',
  'cn': 'CN', 'china': 'CN',
  'br': 'BR', 'brazil': 'BR',
  'au': 'AU', 'australia': 'AU',
  'in': 'IN', 'india': 'IN',
  'mx': 'MX', 'mexico': 'MX',
  'es': 'ES', 'spain': 'ES',
  'it': 'IT', 'italy': 'IT',
  'ru': 'RU', 'russia': 'RU',
  'nl': 'NL', 'netherlands': 'NL',
  'se': 'SE', 'sweden': 'SE',
  'no': 'NO', 'norway': 'NO',
  'dk': 'DK', 'denmark': 'DK',
  'fi': 'FI', 'finland': 'FI',
  'pl': 'PL', 'poland': 'PL',
  'pt': 'PT', 'portugal': 'PT',
  'ar': 'AR', 'argentina': 'AR',
  'cl': 'CL', 'chile': 'CL',
  'co': 'CO', 'colombia': 'CO',
  'za': 'ZA', 'south africa': 'ZA',
  'nz': 'NZ', 'new zealand': 'NZ',
  'sg': 'SG', 'singapore': 'SG',
  'my': 'MY', 'malaysia': 'MY',
  'id': 'ID', 'indonesia': 'ID',
  'th': 'TH', 'thailand': 'TH',
  'vn': 'VN', 'vietnam': 'VN',
  'ph': 'PH', 'philippines': 'PH',
  'tw': 'TW', 'taiwan': 'TW',
  'hk': 'HK', 'hong kong': 'HK',
  'ae': 'AE', 'uae': 'AE', 'united arab emirates': 'AE',
  'sa': 'SA', 'saudi arabia': 'SA',
  'il': 'IL', 'israel': 'IL',
  'tr': 'TR', 'turkey': 'TR',
  'eg': 'EG', 'egypt': 'EG',
  'ng': 'NG', 'nigeria': 'NG',
  'ke': 'KE', 'kenya': 'KE',
  'ie': 'IE', 'ireland': 'IE',
  'ch': 'CH', 'switzerland': 'CH',
  'at': 'AT', 'austria': 'AT',
  'be': 'BE', 'belgium': 'BE',
  'cz': 'CZ', 'czech republic': 'CZ', 'czechia': 'CZ',
  'gr': 'GR', 'greece': 'GR',
  'hu': 'HU', 'hungary': 'HU',
  'ro': 'RO', 'romania': 'RO',
  'ua': 'UA', 'ukraine': 'UA',
};

interface CountryFlagProps {
  country: string | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  className?: string; // Add className
}

export default function CountryFlag({ country, size = 'md', showName = false, className = '' }: CountryFlagProps) {
  if (!country) return null;

  // Normalize country input
  const normalizedCountry = country.toLowerCase().trim();
  const countryCode = COUNTRY_CODES[normalizedCountry] ||
    (normalizedCountry.length === 2 ? normalizedCountry.toUpperCase() : null);

  if (!countryCode) return null;

  const flag = countryToFlag(countryCode);

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl'
  };

  return (
    <span
      className={`inline-flex items-center gap-1 ${sizeClasses[size]} ${className}`}
      title={country}
    >
      <span role="img" aria-label={`${country} flag`}>{flag}</span>
      {showName && <span className="text-gray-400 text-xs">{countryCode}</span>}
    </span>
  );
}
