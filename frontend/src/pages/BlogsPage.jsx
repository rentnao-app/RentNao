import { Link } from 'react-router-dom';
import StaticPageHeader from '../components/StaticPageHeader';
import { useTranslation } from '../lib/i18n';

function formatBlogDate(iso, locale) {
  try {
    return new Date(iso).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export default function BlogsPage() {
  const { messages, lang } = useTranslation();
  const blogs = messages.blogs;

  return (
    <div className="min-h-screen bg-gray-50">
      <StaticPageHeader backLabel={blogs.back} nav={blogs.nav} />

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-12">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#2A7D4F]">{blogs.eyebrow}</p>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">{blogs.title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-600 sm:text-base">{blogs.intro}</p>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {blogs.posts.map((post) => (
            <Link
              key={post.slug}
              to={`/blogs/${post.slug}`}
              className="group flex h-full flex-col rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-emerald-100 hover:shadow-md"
            >
              <p className="text-xs font-medium text-[#2A7D4F]">{post.category}</p>
              <h2 className="mt-2 text-lg font-semibold text-gray-900 group-hover:text-[#2A7D4F]">
                {post.title}
              </h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-600">{post.excerpt}</p>
              <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                <span>{formatBlogDate(post.date, lang)}</span>
                <span className="font-semibold text-[#2A7D4F] group-hover:underline">{blogs.readMore}</span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
