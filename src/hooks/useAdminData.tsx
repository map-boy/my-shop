// FILE: src/hooks/useAdminData.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import type { ActivityEntry, AdminUser, Coupon, Customer, Message, Order, Subscriber } from '../lib/types';

interface AdminData {
  orders: Order[];
  customers: Customer[];
  coupons: Coupon[];
  messages: Message[];
  subscribers: Subscriber[];
  admins: AdminUser[];
  activity: ActivityEntry[];
  loading: boolean;
}

const EMPTY: AdminData = {
  orders: [], customers: [], coupons: [], messages: [],
  subscribers: [], admins: [], activity: [], loading: true,
};

const AdminDataContext = createContext<AdminData>(EMPTY);

/**
 * One set of Firestore listeners for the whole dashboard. Every admin screen
 * reads from here, so opening a page never re-queries what is already live.
 */
export const AdminDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAdmin, isSeller, admin } = useAuth();
  const [data, setData] = useState<AdminData>(EMPTY);

  useEffect(() => {
    if (!isAdmin) {
      setData(EMPTY);
      return;
    }

    const patch = (p: Partial<AdminData>) => setData((d) => ({ ...d, ...p }));

    const listen = <T,>(
      path: string,
      field: keyof AdminData,
      sortField: string | null = 'createdAt',
    ) =>
      onSnapshot(
        sortField ? query(collection(db, path), orderBy(sortField, 'desc')) : collection(db, path),
        (snap) => patch({ [field]: snap.docs.map((d) => ({ id: d.id, ...d.data() })) as T[] } as Partial<AdminData>),
        // A missing index or a denied read must not blank the whole dashboard.
        () => patch({ [field]: [] } as Partial<AdminData>),
      );

    // A seller's order feed is filtered in the query itself, not after the
    // fact — the security rules reject an unfiltered read, so asking for
    // everything would simply fail.
    const ordersQuery = isSeller && admin?.email
      ? query(
          collection(db, 'orders'),
          where('sellerIds', 'array-contains', admin.email),
          orderBy('createdAt', 'desc'),
        )
      : query(collection(db, 'orders'), orderBy('createdAt', 'desc'));

    const unsubs = [
      onSnapshot(
        ordersQuery,
        (snap) => patch({ orders: snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Order[] }),
        () => patch({ orders: [] }),
      ),
      listen<Customer>('customers', 'customers'),
      listen<Coupon>('coupons', 'coupons'),
      listen<Message>('messages', 'messages'),
      listen<Subscriber>('subscribers', 'subscribers'),
      listen<AdminUser>('admins', 'admins', null),
      listen<ActivityEntry>('activity', 'activity', 'at'),
    ];

    patch({ loading: false });
    return () => unsubs.forEach((u) => u());
  }, [isAdmin, isSeller, admin?.email]);

  const value = useMemo(() => data, [data]);
  return <AdminDataContext.Provider value={value}>{children}</AdminDataContext.Provider>;
};

export function useAdminData(): AdminData {
  return useContext(AdminDataContext);
}
