import { supabase, supabaseConfigError } from './supabaseClient.js'

function client() {
  if (!supabase || supabaseConfigError) throw new Error(supabaseConfigError || 'Stories are not configured yet.')
  return supabase
}

const storyFields = 'id, category_id, title_ur, slug, excerpt_ur, content_ur, cover_image_url, status, featured, historical_notes_ur, author_id, created_at, updated_at, published_at'
const categoryFields = 'id, name_ur, slug, description_ur, display_order, created_at'
const sourceFields = 'id, story_id, source_title, author_name, source_type, volume, page, hadith_or_report_number, source_url, citation_note_ur, narration_status, created_at'

function mapCategory(row) {
  return { id: row.id, nameUr: row.name_ur, slug: row.slug, descriptionUr: row.description_ur || '', displayOrder: row.display_order }
}

function mapSource(row) {
  return { id: row.id, storyId: row.story_id, sourceTitle: row.source_title, authorName: row.author_name || '', sourceType: row.source_type || '', volume: row.volume || '', page: row.page || '', reportNumber: row.hadith_or_report_number || '', sourceUrl: row.source_url || '', citationNoteUr: row.citation_note_ur || '', narrationStatus: row.narration_status || '' }
}

function mapStory(row, categories = []) {
  const category = row.category || categories.find((item) => item.id === row.category_id)
  return { id: row.id, categoryId: row.category_id, category: category ? mapCategory(category) : null, titleUr: row.title_ur, slug: row.slug, excerptUr: row.excerpt_ur, contentUr: row.content_ur, coverImageUrl: row.cover_image_url || '', status: row.status, featured: row.featured, historicalNotesUr: row.historical_notes_ur || '', authorId: row.author_id, createdAt: row.created_at, updatedAt: row.updated_at, publishedAt: row.published_at, sources: (row.sources || []).map(mapSource) }
}

export async function fetchStoryCategories() {
  const { data, error } = await client().from('story_categories').select(categoryFields).order('display_order')
  if (error) throw new Error(error.message || 'Categories could not be loaded.')
  return (data || []).map(mapCategory)
}

export async function fetchPublishedStories() {
  const api = client()
  const [{ data, error }, categories] = await Promise.all([
    api.from('stories').select(`${storyFields}, category:story_categories(${categoryFields})`).eq('status', 'published').order('featured', { ascending: false }).order('published_at', { ascending: false }),
    fetchStoryCategories(),
  ])
  if (error) throw new Error(error.message || 'Stories could not be loaded.')
  return (data || []).map((row) => mapStory(row, categories))
}

export async function fetchPublishedStory(slug) {
  const api = client()
  const { data, error } = await api.from('stories').select(`${storyFields}, category:story_categories(${categoryFields}), sources:story_sources(${sourceFields})`).eq('slug', slug).eq('status', 'published').maybeSingle()
  if (error) throw new Error(error.message || 'Story could not be loaded.')
  return data ? mapStory(data) : null
}

export async function fetchAdminStories() {
  const api = client()
  const [{ data, error }, categories] = await Promise.all([
    api.from('stories').select(`${storyFields}, category:story_categories(${categoryFields})`).order('updated_at', { ascending: false }),
    fetchStoryCategories(),
  ])
  if (error) throw new Error(error.message || 'Stories could not be loaded.')
  return (data || []).map((row) => mapStory(row, categories))
}

export async function fetchAdminStory(id) {
  const { data, error } = await client().from('stories').select(`${storyFields}, category:story_categories(${categoryFields}), sources:story_sources(${sourceFields})`).eq('id', id).single()
  if (error) throw new Error(error.message || 'Story could not be loaded.')
  return mapStory(data)
}

export async function uploadStoryCover(file, storyId) {
  if (!file || !file.type.startsWith('image/')) throw new Error('Please choose an image file.')
  if (file.size > 5 * 1024 * 1024) throw new Error('Cover images must be 5 MB or smaller.')
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${storyId}/${crypto.randomUUID()}.${extension}`
  const { error } = await client().storage.from('story-covers').upload(path, file, { cacheControl: '3600', upsert: false })
  if (error) throw new Error(error.message || 'The cover image could not be uploaded.')
  return client().storage.from('story-covers').getPublicUrl(path).data.publicUrl
}

export async function saveStory(story, sources, id = '') {
  const api = client()
  const { data: userData, error: userError } = await api.auth.getUser()
  if (userError || !userData.user) throw new Error('You must be signed in as an administrator.')
  const payload = { ...(story.id ? { id: story.id } : {}), category_id: story.categoryId, title_ur: story.titleUr.trim(), slug: story.slug.trim(), excerpt_ur: story.excerptUr.trim(), content_ur: story.contentUr.trim(), cover_image_url: story.coverImageUrl || null, status: story.status, featured: Boolean(story.featured), historical_notes_ur: story.historicalNotesUr?.trim() || null, author_id: userData.user.id }
  const result = id
    ? await api.from('stories').update(payload).eq('id', id).select(storyFields).single()
    : await api.from('stories').insert(payload).select(storyFields).single()
  if (result.error) throw new Error(result.error.message || 'The story could not be saved.')
  const { error: deleteError } = await api.from('story_sources').delete().eq('story_id', result.data.id)
  if (deleteError) throw new Error(deleteError.message || 'Existing sources could not be replaced.')
  const validSources = sources.filter((source) => source.sourceTitle.trim()).map((source) => ({ story_id: result.data.id, source_title: source.sourceTitle.trim(), author_name: source.authorName.trim() || null, source_type: source.sourceType.trim() || null, volume: source.volume.trim() || null, page: source.page.trim() || null, hadith_or_report_number: source.reportNumber.trim() || null, source_url: source.sourceUrl.trim() || null, citation_note_ur: source.citationNoteUr.trim() || null, narration_status: source.narrationStatus.trim() || null }))
  if (validSources.length) {
    const { error: sourceError } = await api.from('story_sources').insert(validSources)
    if (sourceError) throw new Error(sourceError.message || 'Sources could not be saved.')
  }
  return result.data
}

export async function deleteStory(id) {
  const { error } = await client().from('stories').delete().eq('id', id)
  if (error) throw new Error(error.message || 'The story could not be deleted.')
}
