import Link from 'next/link'
import { notFound } from 'next/navigation'
import DOMPurify from 'isomorphic-dompurify'
import { getZivanaPost, getRelatedZivanaPosts } from '@/lib/blog'
import { POST_TYPE_CONFIG } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getZivanaPost(slug)
  if (!post) return {}
  return {
    title: `${post.title} — Zivana Protocol`,
    description: post.excerpt ?? undefined,
  }
}

function formatDate(iso: string | null) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getZivanaPost(slug)

  if (!post) notFound()

  const related = await getRelatedZivanaPosts(post.post_type, post.slug)
  const typeConfig = POST_TYPE_CONFIG[post.post_type] ?? { label: post.post_type, color: '#A78BFA' }

  return (
    <div className="bg-void min-h-screen">

      {/* Header */}
      <section
        className="relative pt-40 pb-16 overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#12092A 0%,#0D0B14 50%,#06020F 100%)' }}
      >
        <div className="absolute rounded-full pointer-events-none"
          style={{ width: 500, height: 500, background: '#6D28D9', filter: 'blur(140px)', opacity: 0.08, top: -180, right: -80 }} />
        <div className="absolute inset-0 grid-overlay pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto px-8 lg:px-14">
          <Link
            href="/blog"
            style={{
              fontFamily: 'Switzer, sans-serif',
              fontSize: 13,
              color: '#8B7EC8',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 32,
            }}
          >
            ← Back to blog
          </Link>

          <span
            style={{
              fontFamily: 'Switzer, sans-serif',
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: typeConfig.color,
              display: 'block',
              marginBottom: 20,
            }}
          >
            {typeConfig.label}
          </span>

          <h1
            style={{
              fontFamily: 'Cabinet Grotesk, sans-serif',
              fontWeight: 600,
              fontSize: 'clamp(32px,5vw,56px)',
              letterSpacing: '-0.025em',
              lineHeight: 1.1,
              color: '#E8E6F0',
              marginBottom: 24,
            }}
          >
            {post.title}
          </h1>

          <div
            className="flex items-center gap-2"
            style={{ fontFamily: 'Switzer, sans-serif', fontSize: 14, color: '#7B6FA8' }}
          >
            {post.author && <span>{post.author}</span>}
            {post.author && post.published_at && <span>·</span>}
            {post.published_at && <span>{formatDate(post.published_at)}</span>}
          </div>
        </div>
      </section>

      {/* Cover image */}
      {post.cover_image_url && (
        <div className="max-w-4xl mx-auto px-8 lg:px-14 -mt-8 relative z-10">
          <div
            style={{
              width: '100%',
              aspectRatio: '16/9',
              borderRadius: 16,
              overflow: 'hidden',
              border: '1px solid #1C1730',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.cover_image_url}
              alt={post.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        </div>
      )}

      {/* Content */}
      <section className="py-20 bg-void">
        <div className="max-w-3xl mx-auto px-8 lg:px-14">
          <div
            className="zivana-prose"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(post.content ?? '', {
                ALLOWED_TAGS: [
                  'p', 'h2', 'h3', 'h4', 'blockquote', 'strong', 'em', 'u', 's',
                  'ul', 'ol', 'li', 'a', 'br', 'hr', 'span', 'div', 'code', 'pre',
                  'img', 'figure', 'figcaption', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
                ],
                ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'src', 'alt', 'title'],
                ALLOW_DATA_ATTR: false,
              }),
            }}
          />

          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-12 pt-8" style={{ borderTop: '1px solid #1C1730' }}>
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontFamily: 'Switzer, sans-serif',
                    fontSize: 12,
                    color: '#8B7EC8',
                    background: '#13101E',
                    border: '1px solid #1C1730',
                    borderRadius: 9999,
                    padding: '6px 14px',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Related posts */}
      {related.length > 0 && (
        <section className="py-24" style={{ background: 'linear-gradient(180deg,#0D0B14,#100D1F)' }}>
          <div className="max-w-6xl mx-auto px-8 lg:px-14">
            <span className="section-label block mb-10">More like this</span>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {related.map((p) => {
                const cfg = POST_TYPE_CONFIG[p.post_type] ?? { label: p.post_type, color: '#A78BFA' }
                return (
                  <Link
                    key={p.slug}
                    href={`/blog/${p.slug}`}
                    className="card-base flex flex-col gap-3 p-6"
                    style={{ textDecoration: 'none' }}
                  >
                    <span
                      style={{
                        fontFamily: 'Switzer, sans-serif',
                        fontSize: 10,
                        fontWeight: 500,
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                        color: cfg.color,
                      }}
                    >
                      {cfg.label}
                    </span>
                    <h3
                      style={{
                        fontFamily: 'Cabinet Grotesk, sans-serif',
                        fontWeight: 600,
                        fontSize: 16,
                        color: '#E8E6F0',
                        lineHeight: 1.35,
                      }}
                    >
                      {p.title}
                    </h3>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}