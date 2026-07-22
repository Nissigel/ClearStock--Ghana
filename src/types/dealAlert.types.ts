export interface DealAlert {
  id: string;
  buyerId: string;
  category: string;
  maxPrice: number | null;
  keywords: string | null;
  location: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CreateDealAlertRequest {
  category: string;
  maxPrice?: number | null;
  keywords?: string | null;
  location?: string | null;
}
