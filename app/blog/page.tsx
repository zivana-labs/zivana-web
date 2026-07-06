import Link from 'next/link'
import { getZivanaPosts } from '@/lib/blog'
import { POST_TYPE_CONFIG } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Blog — Zivana Protocol',
  description: 'Research, announcements, and updates from Zivana Protocol.',
}

function formatDate(iso: string | null) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default async function BlogPage() {
  const posts = await getZivanaPosts()

  return (
    <div className="bg-void min-h-screen">

      {/* Hero — same orb + grid pattern used on /contribute */}
      <section
        className="relative pt-40 pb-24 overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#12092A 0%,#0D0B14 50%,#06020F 100%)' }}
      >
        <div className="absolute rounded-full pointer-events-none"
          style={{ width: 600, height: 600, background: '#6D28D9', filter: 'blur(140px)', opacity: 0.08, top: -200, right: -100 }} />
        <div className="absolute rounded-full pointer-events-none"
          style={{ width: 400, height: 400, background: '#4C1D95', filter: 'blur(120px)', opacity: 0.07, bottom: -100, left: '5%' }} />
        <div className="absolute inset-0 grid-overlay pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto px-8 lg:px-14 text-center">
          <span className="section-label block mb-6">Zivana Blog</span>
          <h1
            style={{
              fontFamily: 'Cabinet Grotesk, sans-serif',
              fontWeight: 600,
              fontSize: 'clamp(40px,6vw,72px)',
              letterSpacing: '-0.03em',
              lineHeight: 1.05,
              color: '#E8E6F0',
            }}
          >
            Research, updates,<br />
            <span className="text-gradient">and protocol notes.</span>
          </h1>
        </div>
      </section>

      {/* Post grid */}
      <section className="py-24 bg-void">
        <div className="max-w-6xl mx-auto px-8 lg:px-14">
          {posts.length === 0 ? (
            <p
              className="text-center"
              style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 15, color: '#7B6FA8' }}
            >
              No posts published yet. Check back soon.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => {
                const typeConfig = POST_TYPE_CONFIG[post.post_type] ?? {
                  label: post.post_type,
                  color: '#A78BFA',
                }
                return (
                  <Link
                    key={post.slug}
                    href={`/blog/${post.slug}`}
                    className="card-base flex flex-col overflow-hidden"
                    style={{ textDecoration: 'none' }}
                  >
                    {/* Cover image with fallback */}
                    <div
                      className="w-full"
                      style={{
                        height: 180,
                        background: post.cover_image_url
                          ? `url(${post.cover_image_url}) center/cover no-repeat`
                          : 'linear-gradient(135deg,#1C1730,#13101E)',
                        position: 'relative',
                      }}
                    >
                      {!post.cover_image_url && (
                        <div
                          className="absolute inset-0 flex items-center justify-center"
                          style={{ opacity: 0.25 }}
                        >
                          <svg width="40" height="40" viewBox="0 0 100 88" fill="none">
                            <path d="M0 84 A50 50 0 0 1 100 84" stroke="#4C1D95" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
                            <path d="M19 63 A31 31 0 0 1 81 63" stroke="#A78BFA" strokeWidth="5" strokeLinecap="round" />
                            <circle cx="50" cy="16" r="7" fill="#A78BFA" />
                          </svg>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-3 p-6">
                      <span
                        className="self-start"
                        style={{
                          fontFamily: 'Switzer, sans-serif',
                          fontSize: 10,
                          fontWeight: 500,
                          letterSpacing: '0.15em',
                          textTransform: 'uppercase',
                          color: typeConfig.color,
                        }}
                      >
                        {typeConfig.label}
                      </span>

                      <h2
                        style={{
                          fontFamily: 'Cabinet Grotesk, sans-serif',
                          fontWeight: 600,
                          fontSize: 19,
                          color: '#E8E6F0',
                          lineHeight: 1.3,
                        }}
                      >
                        {post.title}
                      </h2>

                      {post.excerpt && (
                        <p
                          style={{
                            fontFamily: 'Switzer, sans-serif',
                            fontWeight: 300,
                            fontSize: 13,
                            color: '#7B6FA8',
                            lineHeight: 1.65,
                          }}
                        >
                          {post.excerpt}
                        </p>
                      )}

                      <div
                        className="flex items-center gap-2 mt-2"
                        style={{ fontFamily: 'Switzer, sans-serif', fontSize: 12, color: '#8B7EC8' }}
                      >
                        {post.author && <span>{post.author}</span>}
                        {post.author && post.published_at && <span>·</span>}
                        {post.published_at && <span>{formatDate(post.published_at)}</span>}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}