// FILE: src/pages/BlogPost.tsx
import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { usePosts } from '../lib/posts';
import { EmptyState, PageLoader } from '../components/ui';
import { formatDate } from '../lib/utils';

const URL_RE = /(https?:\/\/[^\s)]+)/g;

const Rich: React.FC<{ text: string }> = ({ text }) => (
  <>
    {text.split(URL_RE).map((part, i) =>
      /^https?:\/\//.test(part) ? (
        <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="font-semibold text-ink-900 underline">
          {part}
        </a>
      ) : (
        <React.Fragment key={i}>{part}</React.Fragment>
      ),
    )}
  </>
);

/** Plain-text body: blank line = new paragraph, "## " = heading, "### " = sub-heading, "- " lines = bullet list. */
const Body: React.FC<{ body: string }> = ({ body }) => {
  const blocks = body.replace(/\r\n/g, '\n').split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className="space-y-5">
      {blocks.map((b, i) => {
        if (b.startsWith('### ')) return <h3 key={i} className="pt-2 font-display text-xl font-bold text-ink-900">{b.slice(4)}</h3>;
        if (b.startsWith('## ')) return <h2 key={i} className="pt-4 font-display text-2xl font-bold text-ink-900">{b.slice(3)}</h2>;
        const lines = b.split('\n');
        if (lines.every((l) => l.trim().startsWith('- '))) {
          return (
            <ul key={i} className="list-disc space-y-2 pl-5 text-[16px] leading-relaxed text-ink-700">
              {lines.map((l, j) => <li key={j}><Rich text={l.trim().slice(2)} /></li>)}
            </ul>
          );
        }
        return (
          <p key={i} className="text-[16px] leading-relaxed text-ink-700">
            {lines.map((l, j) => (
              <React.Fragment key={j}>
                {j > 0 && <br />}
                <Rich text={l} />
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
};

const BlogPost: React.FC = () => {
  const { slug = '' } = useParams();
  const { settings } = useStore();
  const { posts, loading } = usePosts();
  const post = posts.find((p) => p.slug === slug);

  useEffect(() => {
    if (!post) return undefined;
    document.title = `${post.title} - ${settings.storeName}`;
    const el = document.createElement('script');
    el.type = 'application/ld+json';
    el.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      description: post.excerpt || undefined,
      image: post.cover || undefined,
      datePublished: new Date(post.createdAt).toISOString(),
      dateModified: new Date(post.updatedAt || post.createdAt).toISOString(),
      author: { '@type': 'Organization', name: settings.storeName },
      publisher: { '@type': 'Organization', name: settings.storeName },
      mainEntityOfPage: `https://karibu.fit/blog/${post.slug}`,
    });
    document.head.appendChild(el);
    return () => { document.head.removeChild(el); };
  }, [post, settings.storeName]);

  if (loading) return <PageLoader />;

  if (!post) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 sm:px-6">
        <EmptyState
          icon={<BookOpen size={40} />}
          title="Article not found"
          text="It may have been removed or is not published yet."
          action={<Link to="/blog" className="text-sm font-semibold underline">Back to the blog</Link>}
        />
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <Link to="/blog" className="mb-8 inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.14em] text-ink-500 transition hover:text-ink-900">
        <ArrowLeft size={14} /> All articles
      </Link>
      <header>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">{formatDate(post.createdAt)}</p>
        <h1 className="mt-3 font-display text-4xl font-bold leading-tight sm:text-5xl">{post.title}</h1>
        {post.excerpt && <p className="mt-5 text-lg leading-relaxed text-ink-500">{post.excerpt}</p>}
      </header>
      {post.cover && (
        <img src={post.cover} alt="" className="mt-10 w-full rounded-brand object-cover" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
      )}
      <div className="mt-10">
        <Body body={post.body} />
      </div>
      <footer className="mt-14 border-t border-ink-200 pt-6 text-sm text-ink-500">
        <Link to="/shop" className="font-semibold text-ink-900 underline">Browse the shop</Link>
        {' '}or{' '}
        <Link to="/contact" className="font-semibold text-ink-900 underline">contact us</Link>.
      </footer>
    </article>
  );
};

export default BlogPost;