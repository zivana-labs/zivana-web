/**
 * Shape of a row in NexTrium's `posts` table, as read by zivana-web.
 *
 * This table lives in NexTrium's Supabase project, not Zivana's own
 * `zivana-contrib` project. Zivana only ever reads from it, filtered to
 * `brand = 'zivana'`, via lib/supabase/nextrium.ts.
 *
 * This type intentionally lists only the columns zivana-web actually
 * consumes. If NexTrium's table has additional columns Zivana doesn't use,
 * they are simply not declared here.
 */
export type PostType =
  | 'editorial'
  | 'announcement'
  | 'product_update'
  | 'event_recap'
  | 'research'
  | 'recruitment'

export interface Post {
  slug: string
  title: string
  excerpt: string | null
  content: string // HTML string from WYSIWYG editor
  post_type: PostType
  author: string | null
  tags: string[] | null
  is_published: boolean
  published_at: string | null // ISO timestamp
  cover_image_url: string | null
  brand: 'nextrium' | 'zivana'
  created_at: string
  updated_at: string
}