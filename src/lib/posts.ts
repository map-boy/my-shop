// FILE: src/lib/posts.ts
import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { db } from './firebase';

export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  cover: string;
  published: boolean;
  createdAt: number;
  updatedAt: number;
}

/**
 * Blog posts. Shoppers only ever query published posts (the security rules
 * refuse anything else); the dashboard asks for every post, drafts included.
 */
export function usePosts(all = false) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = all
      ? query(collection(db, 'posts'), orderBy('createdAt', 'desc'))
      : query(collection(db, 'posts'), where('published', '==', true));
    return onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Post);
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setPosts(list);
        setLoading(false);
      },
      () => {
        setPosts([]);
        setLoading(false);
      },
    );
  }, [all]);

  return { posts, loading };
}