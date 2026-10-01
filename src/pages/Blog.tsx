// FILE: src/pages/Blog.tsx
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { usePosts } from '../lib/posts';
import { EmptyState, PageLoader } from '../components/ui';
import { formatDate, PLACEHOLDER_IMAGE } from '../lib/utils';

const Blog: React.FC = () => {
  const { settings } = useStore();
  const { posts, loading } = usePosts();

  useEffect(() => {
    document.title = `Blog - ${settings.storeName}`;
  }, [settings.storeName]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <header className="mb-12 max-w-2xl">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.3em] text-accent">Journal</p>
        <h1 className="font-display text-4xl font-bold sm:text-5xl">Blog</h1>
        <p className="mt-4 text-[15px] leading-relaxed text-ink-500">
          Guides, tips and stories from {settings.storeName}.
        </p>
      </header>

      {loading ? (
        <PageLoader />
      ) : posts.length === 0 ? (
        <EmptyState icon={<BookOpen size={40} />} title="No articles yet" text="New articles will appear here soon." />
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <article key={p.id} className="group overflow-hidden rounded-brand border border-ink-200 bg-white">
              <Link to={`/blog/${p.slug}`} className="block">
                <div className="aspect-[16/9] overflow-hidden bg-ink-100">
                  <img
                    src={p.cover || PLACEHOLDER_IMAGE}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    onError={(e) => ((e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE)}
                  />
                </div>
                <div className="p-5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink-400">{formatDate(p.createdAt)}</p>
                  <h2 className="mt-2 font-display text-xl font-bold leading-snug text-ink-900">{p.title}</h2>
                  {p.excerpt && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-500">{p.excerpt}</p>}
                  <span className="mt-4 inline-block text-[12px] font-bold uppercase tracking-[0.14em] text-accent">Read more</span>
                </div>
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default Blog;