import { createNextriumClient } from '@/lib/supabase/nextrium'
import type { Post, PostType } from '@/lib/types/post'

/**
 * All published Zivana-tagged posts, newest first.
 * Used by /blog (list page).
 */
export async function getZivanaPosts(): Promise<Post[]> {
  const supabase = createNextriumClient()
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('brand', 'zivana')
    .eq('is_published', true)
    .order('published_at', { ascending: false })

  if (error || !data) return []
  return data as Post[]
}

/**
 * A single published Zivana-tagged post by slug.
 * Used by /blog/[slug] (detail page).
 */
export async function getZivanaPost(slug: string): Promise<Post | null> {
  const supabase = createNextriumClient()
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('brand', 'zivana')
    .eq('is_published', true)
    .eq('slug', slug)
    .single()

  if (error || !data) return null
  return data as Post
}

/**
 * Up to 3 other published Zivana-tagged posts of the same type,
 * excluding the current post. Used in the "related posts" section
 * on /blog/[slug].
 */
export async function getRelatedZivanaPosts(
  postType: PostType,
  excludeSlug: string
): Promise<Post[]> {
  const supabase = createNextriumClient()
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('brand', 'zivana')
    .eq('is_published', true)
    .eq('post_type', postType)
    .neq('slug', excludeSlug)
    .order('published_at', { ascending: false })
    .limit(3)

  if (error || !data) return []
  return data as Post[]
}