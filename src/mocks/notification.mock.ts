import type { Notification } from '@/types/notification.types';

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-001',
    userId: 'user-001',
    category: 'PURCHASE_REQUEST',
    title: 'Purchase Request Accepted',
    body: 'Your request for Tecno Spark 10 Pro has been accepted by Yaw Darko.',
    status: 'UNREAD',
    referenceType: 'purchase_request',
    referenceId: 'request-002',
    createdAt: '2026-06-23T14:00:00Z',
  },
  {
    id: 'notif-002',
    userId: 'user-001',
    category: 'TRANSACTION',
    title: 'Item Ready for Collection',
    body: 'Tecno Spark 10 Pro is ready for collection. Visit Accra Tech Hub to pick up your order.',
    status: 'UNREAD',
    referenceType: 'transaction',
    referenceId: 'txn-001',
    createdAt: '2026-06-24T08:00:00Z',
  },
  {
    id: 'notif-003',
    userId: 'user-001',
    category: 'MESSAGING',
    title: 'New Message',
    body: 'Kofi Boateng sent you a message about Indomie Instant Noodles.',
    status: 'UNREAD',
    referenceType: 'conversation',
    referenceId: 'conv-001',
    createdAt: '2026-06-24T10:30:00Z',
  },
  {
    id: 'notif-004',
    userId: 'user-001',
    category: 'PURCHASE_REQUEST',
    title: 'Purchase Request Declined',
    body: 'Your request for Olein Cooking Oil has been declined.',
    status: 'READ',
    referenceType: 'purchase_request',
    referenceId: 'request-004',
    createdAt: '2026-06-21T12:00:00Z',
  },
  {
    id: 'notif-005',
    userId: 'user-001',
    category: 'TRANSACTION',
    title: 'Transaction Completed',
    body: 'Your transaction for Nivea Body Lotion has been completed successfully.',
    status: 'READ',
    referenceType: 'transaction',
    referenceId: 'txn-002',
    createdAt: '2026-06-22T11:00:00Z',
  },
  {
    id: 'notif-006',
    userId: 'user-001',
    category: 'LISTING',
    title: 'Listing Price Updated',
    body: 'The price for Indomie Instant Noodles has been reduced to ₵45.00.',
    status: 'READ',
    referenceType: 'listing',
    referenceId: 'listing-001',
    createdAt: '2026-06-18T00:00:00Z',
  },
];

export const MOCK_UNREAD_COUNT = MOCK_NOTIFICATIONS.filter(
  (n) => n.status === 'UNREAD'
).length;