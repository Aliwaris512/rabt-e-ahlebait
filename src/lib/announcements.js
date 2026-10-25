import { supabase, supabaseConfigError } from './supabaseClient.js'

function requireClient() {
  if (supabaseConfigError || !supabase) throw new Error(supabaseConfigError ?? 'The announcement service is not configured.')
  return supabase
}

function mapAnnouncement(entry) {
  return {
    id: entry.id,
    title: entry.title || '',
    content: entry.content,
    imagePath: entry.image_path,
    imageUrl: entry.image_path ? requireClient().storage.from('announcements').getPublicUrl(entry.image_path).data.publicUrl : '',
    eventAt: entry.event_at,
    published: entry.published,
    createdAt: entry.created_at,
    updatedAt: entry.updated_at,
  }
}

export async function fetchPublishedAnnouncements() {
  const client = requireClient()
  const { data, error } = await client
    .from('announcements')
    .select('id, title, content, image_path, event_at, published, created_at, updated_at')
    .eq('published', true)
    .order('event_at', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message || 'Published announcements could not be loaded.')
  return (data ?? []).map(mapAnnouncement)
}

export async function fetchAdminAnnouncements() {
  const client = requireClient()
  const { data, error } = await client
    .from('announcements')
    .select('id, title, content, image_path, event_at, published, created_at, updated_at')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message || 'Announcements could not be loaded.')
  return (data ?? []).map(mapAnnouncement)
}

export async function uploadAnnouncementImage(file) {
  const client = requireClient()
  if (!file || !file.type.startsWith('image/')) throw new Error('Please choose an image file.')
  if (file.size > 5 * 1024 * 1024) throw new Error('Announcement images must be 5 MB or smaller.')
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${crypto.randomUUID()}.${extension}`
  const { error } = await client.storage.from('announcements').upload(path, file, { cacheControl: '3600', upsert: false })
  if (error) throw new Error(error.message || 'The announcement image could not be uploaded.')
  return path
}

export async function removeAnnouncementImage(path) {
  if (!path) return
  const client = requireClient()
  const { error } = await client.storage.from('announcements').remove([path])
  if (error) throw new Error(error.message || 'The announcement image could not be removed.')
}

export async function createAnnouncement({ title, content, imagePath, eventAt, published }) {
  const client = requireClient()
  const { data: userData, error: userError } = await client.auth.getUser()
  if (userError || !userData.user) throw new Error('You must be signed in to create an announcement.')
  const { data, error } = await client.from('announcements').insert({
    title: title.trim() || null,
    content: content.trim(),
    image_path: imagePath || null,
    event_at: eventAt || null,
    published,
    created_by: userData.user.id,
  }).select('id, title, content, image_path, event_at, published, created_at, updated_at').single()
  if (error) throw new Error(error.message || 'The announcement could not be created.')
  return mapAnnouncement(data)
}

export async function updateAnnouncement(id, { title, content, imagePath, eventAt, published }) {
  const client = requireClient()
  const { data, error } = await client.from('announcements').update({
    title: title.trim() || null,
    content: content.trim(),
    image_path: imagePath || null,
    event_at: eventAt || null,
    published,
  }).eq('id', id).select('id, title, content, image_path, event_at, published, created_at, updated_at').single()
  if (error) throw new Error(error.message || 'The announcement could not be updated.')
  return mapAnnouncement(data)
}

export async function deleteAnnouncement(id) {
  const client = requireClient()
  const { data, error } = await client.from('announcements').delete().eq('id', id).select('image_path').single()
  if (error) throw new Error(error.message || 'The announcement could not be deleted.')
  if (data?.image_path) await removeAnnouncementImage(data.image_path)
}
