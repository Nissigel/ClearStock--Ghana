export type SellerType =
  | 'Importer'
  | 'Wholesaler'
  | 'Retail Shop'
  | 'Manufacturer'
  | 'Trader'
  | 'Individual Seller';

export const SELLER_TYPES: SellerType[] = [
  'Importer',
  'Wholesaler',
  'Retail Shop',
  'Manufacturer',
  'Trader',
  'Individual Seller',
];

export const SELLER_TYPE_DESCRIPTIONS: Record<SellerType, string> = {
  Importer: 'I import goods from outside Ghana',
  Wholesaler: 'I buy and sell goods in bulk',
  'Retail Shop': 'I run a physical retail store',
  Manufacturer: 'I produce or manufacture goods',
  Trader: 'I trade goods across markets',
  'Individual Seller': 'I am an individual selling personal stock',
};