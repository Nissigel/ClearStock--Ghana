import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createPurchaseRequest,
  getBuyerPurchaseRequests,
  getPurchaseRequestById,
  cancelPurchaseRequest,
  getSellerPurchaseRequests,
  reviewPurchaseRequest,
} from '@/api/transaction.api';
import type { CreatePurchaseRequestRequest } from '@/types/transaction.types';

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
  return useQuery({
    queryKey: [PURCHASE_REQUESTS_KEY, id],
    queryFn: () => getPurchaseRequestById(id),
    enabled: !!id,
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
  return useMutation({
    mutationFn: ({
      id,
      action,
    }: {
      id: string;
      action: 'ACCEPT' | 'DECLINE';
    }) => reviewPurchaseRequest(id, { action }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [PURCHASE_REQUESTS_KEY],
      });
    },
  });
};