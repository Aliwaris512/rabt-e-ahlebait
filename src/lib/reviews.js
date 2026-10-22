import { supabase, supabaseConfigError } from './supabaseClient.js'

const PAGE_SIZE = 6

function requireClient() {
  if (supabaseConfigError || !supabase) throw new Error(supabaseConfigError ?? 'The review service is not configured.')
  return supabase
}

function validateSubmission(payload) {
  const name = payload.name.trim()
  const review = payload.review.trim()
  const suggestion = payload.suggestion.trim()
  const rating = Number(payload.rating)

  if (name.length < 2 || name.length > 80) throw new Error('Name must be between 2 and 80 characters.')
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new Error('Rating must be an integer from 1 to 5.')
  if (review.length < 5 || review.length > 2000) throw new Error('Review must be between 5 and 2,000 characters.')
  if (suggestion.length > 2000) throw new Error('Suggestion must be 2,000 characters or fewer.')

  return { name, rating, review, suggestion: suggestion || null }
}

export async function submitReview(payload) {
  const client = requireClient()
  const review = validateSubmission(payload)
  const { error } = await client.from('reviews').insert({ ...review, status: 'approved' })
  if (error) throw new Error(error.message || 'The review could not be submitted.')
  return { accepted: true }
}

export async function fetchApprovedReviews(offset = 0, limit = PAGE_SIZE) {
  const client = requireClient()
  const start = Math.max(0, offset)
  const end = start + Math.min(PAGE_SIZE, Math.max(1, limit)) - 1
  const { data, error, count } = await client
    .from('reviews')
    .select('id, name, rating, review, suggestion, created_at', { count: 'exact' })
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .range(start, end)

  if (error) throw new Error(error.message || 'Approved reviews could not be loaded.')

  const { data: ratings, error: ratingError } = await client
    .from('reviews')
    .select('rating')
    .eq('status', 'approved')

  if (ratingError) throw new Error(ratingError.message || 'Review statistics could not be loaded.')

  const total = count ?? 0
  const average = ratings?.length
    ? ratings.reduce((sum, entry) => sum + Number(entry.rating), 0) / ratings.length
    : 0

  return {
    reviews: (data ?? []).map((entry) => ({
      id: entry.id,
      name: entry.name,
      rating: entry.rating,
      review: entry.review,
      suggestions: entry.suggestion || '',
      date: entry.created_at,
    })),
    total,
    average,
  }
}
