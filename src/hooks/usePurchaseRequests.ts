import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createPurchaseRequest,
  getBuyerPurchaseRequests,
  getPurchaseRequestById,
  cancelPurchaseRequest,
  getSellerPurchaseRequests,
  acceptPurchaseRequest,
  declinePurchaseRequest,
} from '@/api/transaction.api';
import type {
  CreatePurchaseRequestRequest,
  PurchaseRequest,
  Transaction,
} from '@/types/transaction.types';

export const PURCHASE_REQUESTS_KEY = 'purchaseRequests';

export const useBuyerPurchaseRequests = () => {
  return useQuery({
    queryKey: [PURCHASE_REQUESTS_KEY, 'buyer'],
    queryFn: getBuyerPurchaseRequests,
  });
};

export const useSellerPurchaseRequests = () => {
  return useQuery({
    queryKey: [PURCHASE_REQUESTS_KEY, 'seller'],
    queryFn: getSellerPurchaseRequests,
  });
};

export const usePurchaseRequestById = (id: string) => {
  const isValidId = /^\d+$/.test(id ?? '');
  return useQuery({
    queryKey: [PURCHASE_REQUESTS_KEY, id],
    queryFn: () => getPurchaseRequestById(id),
    enabled: isValidId,
  });
};

export const useCreatePurchaseRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePurchaseRequestRequest) =>
      createPurchaseRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [PURCHASE_REQUESTS_KEY],
      });
    },
  });
};

export const useCancelPurchaseRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelPurchaseRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [PURCHASE_REQUESTS_KEY],
      });
    },
  });
};

export const useReviewPurchaseRequest = () => {
  const queryClient = useQueryClient();
  return useMutation<
    PurchaseRequest | Transaction,
    unknown,
    { id: string; action: 'ACCEPT' | 'DECLINE' }
  >({
    mutationFn: ({ id, action }) =>
      action === 'ACCEPT' ? acceptPurchaseRequest(id) : declinePurchaseRequest(id),
    onSuccess: () => {
      // Refresh every view that reflects requests/transactions. The seller
      // dashboard and requests screen now share the [PURCHASE_REQUESTS_KEY]
      // cache, so invalidating that prefix covers both.
      [
        [PURCHASE_REQUESTS_KEY],
        ['seller-transactions'],
        ['buyer-transactions'],
        ['seller-listings'],
      ].forEach((queryKey) =>
        queryClient.invalidateQueries({ queryKey })
      );
    },
  });
};