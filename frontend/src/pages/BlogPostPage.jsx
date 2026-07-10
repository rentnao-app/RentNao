import { Link, useParams } from 'react-router-dom';
import StaticPageHeader from '../components/StaticPageHeader';
import NotFoundPage from './NotFoundPage';
import { useTranslation } from '../lib/i18n';

function formatBlogDate(iso, locale) {
  try {
    return new Date(iso).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export default function BlogPostPage() {
  const { slug } = useParams();
  const { messages, lang } = useTranslation();
  const blogs = messages.blogs;
  const post = blogs.posts.find((item) => item.slug === slug);

  if (!post) return <NotFoundPage />;

  return (
    <div className="min-h-screen bg-gray-50">
      <StaticPageHeader backLabel={blogs.back} nav={blogs.nav} />

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-12">
        <Link to="/blogs" className="text-sm font-medium text-[#2A7D4F] transition hover:underline">
          ← {blogs.allPosts}
        </Link>

        <p className="mt-6 text-xs font-medium text-[#2A7D4F]">{post.category}</p>
        <h1 className="mt-2 text-3xl font-bold leading-tight text-gray-900">{post.title}</h1>
        <p className="mt-3 text-sm text-gray-500">
          {formatBlogDate(post.date, lang)} · {post.readTime}
        </p>

        <article className="mt-8 max-w-none text-gray-700">
          {post.body.map((paragraph) => (
            <p key={paragraph} className="mb-4 text-sm leading-relaxed sm:text-base">
              {paragraph}
            </p>
          ))}
        </article>
      </main>
    </div>
  );
}
