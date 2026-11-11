// Sponsor tier data + validation. Pure functions, no DOM, so they're unit-testable.

export const BENEFIT_LABELS = {
  website: "Logo on Event Website",
  banners: "Logo on Event Banners",
  shirt: "Logo on Official Event T-Shirt",
  social: "Social Media Recognition",
  signage: "On-Site Signage at Event",
  vendor: "Complimentary Vendor Space or Competition Entry",
  announcements: "Event Announcements",
};

const YES = true;
const NO = null;

export const TIERS = [
  {
    id: "presenting", name: "Presenting", price: 7500,
    benefits: { website: YES, banners: YES, shirt: "Large", social: YES, signage: "Premium", vendor: "Prominent location", announcements: YES },
  },
  {
    id: "championship", name: "Championship", price: 5000,
    note: "First two contracted partners choose Main Stage or CWC Beverage Garden.",
    benefits: { website: YES, banners: YES, shirt: "Medium", social: YES, signage: "Large", vendor: YES, announcements: YES },
  },
  {
    id: "diamond", name: "Diamond", price: 3000,
    note: "First three contracted partners choose Kids Zone, Wing Passport or Covered Dining.",
    benefits: { website: YES, banners: YES, shirt: "Small", social: YES, signage: "Medium", vendor: YES, announcements: YES },
  },
  {
    id: "platinum", name: "Platinum", price: 1500,
    benefits: { website: YES, banners: YES, shirt: NO, social: YES, signage: "Medium", vendor: YES, announcements: YES },
  },
  {
    id: "gold", name: "Gold", price: 1000,
    benefits: { website: YES, banners: YES, shirt: NO, social: YES, signage: "Small", vendor: YES, announcements: YES },
  },
  {
    id: "silver", name: "Silver", price: 500,
    benefits: { website: YES, banners: YES, shirt: NO, social: YES, signage: "Small", vendor: NO, announcements: YES },
  },
  {
    id: "community", name: "Community", price: 250,
    benefits: { website: YES, banners: YES, shirt: NO, social: YES, signage: NO, vendor: NO, announcements: YES },
  },
];

export const FOUNDING_PARTNER = {
  id: "founding",
  name: "Founding Presenting Partner",
  price: 20000,
  installments: 4,
  highlights: [
    "Presenting Sponsor recognition for all four events",
    "Prominent logo placement on all event materials",
    "Logo on official event t-shirts, banners and website",
    "Priority vendor locations at each event",
    "Year-round recognition across our social media platforms",
    "Direct support for skatepark projects and community programs",
  ],
};

export const getTier = (id) =>
  id === FOUNDING_PARTNER.id ? FOUNDING_PARTNER : TIERS.find((t) => t.id === id);

export const formatUSD = (amount) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);

export function installmentSchedule(tier) {
  const count = tier.installments ?? 1;
  return Array.from({ length: count }, () => tier.price / count);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateSponsor({ tierId, business, contact, email, phone }) {
  const errors = {};
  if (!getTier(tierId)) errors.tierId = "Choose a sponsorship level.";
  if (!business?.trim()) errors.business = "Enter your business name.";
  if (!contact?.trim()) errors.contact = "Enter a contact name.";
  if (!EMAIL_RE.test(email?.trim() ?? "")) errors.email = "Enter a valid email address.";
  if (phone?.trim() && phone.replace(/\D/g, "").length < 10) errors.phone = "Enter a 10-digit phone number.";
  return errors;
}

function luhnValid(digits) {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

export function validateCard({ number, expiry, cvc, name }, now = new Date()) {
  const errors = {};
  const digits = (number ?? "").replace(/\s/g, "");
  if (!/^\d{13,19}$/.test(digits) || !luhnValid(digits)) errors.number = "Enter a valid card number.";

  const m = /^(\d{2})\/(\d{2})$/.exec(expiry ?? "");
  if (!m || Number(m[1]) < 1 || Number(m[1]) > 12) {
    errors.expiry = "Use MM/YY.";
  } else {
    const endOfMonth = new Date(2000 + Number(m[2]), Number(m[1]), 0, 23, 59, 59);
    if (endOfMonth < now) errors.expiry = "This card has expired.";
  }

  if (!/^\d{3,4}$/.test(cvc ?? "")) errors.cvc = "Enter the 3 or 4 digit code.";
  if (!name?.trim()) errors.name = "Enter the name on the card.";
  return errors;
}
