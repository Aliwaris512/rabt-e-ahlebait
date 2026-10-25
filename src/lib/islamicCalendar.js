import { supabase, supabaseConfigError } from './supabaseClient.js'

const API_BASE = 'https://api.aladhan.com/v1'
const CACHE_PREFIX = 'rabt-islamic-calendar-'

const referenceOccasions = [
  ['Wiladat of the Holy Prophet (PBUH)', 'ولادت رسول اکرم (ص)', 3, 17],
  ['Wiladat of Imam Jafar al-Sadiq (AS)', 'ولادت امام جعفر صادق (ع)', 3, 17],
  ['Wiladat of Lady Fatima Zahra (SA)', 'ولادت حضرت فاطمہ زہرا (س)', 6, 20],
  ['Wiladat of Imam Ali (AS)', 'ولادت امام علی (ع)', 7, 13],
  ['Wiladat of Imam Hussain (AS)', 'ولادت امام حسین (ع)', 8, 3],
  ['Wiladat of Hazrat Abbas (AS)', 'ولادت حضرت عباس (ع)', 8, 4],
  ['Wiladat of Imam Zain-ul-Abideen (AS)', 'ولادت امام زین العابدین (ع)', 8, 5],
  ['Wiladat of Imam Mahdi (AS)', 'ولادت امام مہدی (ع)', 8, 15],
  ['Laylat al-Qadr (19 Ramadan)', 'شب قدر (۱۹ رمضان)', 9, 19],
  ['Laylat al-Qadr (21 Ramadan)', 'شب قدر (۲۱ رمضان)', 9, 21],
  ['Laylat al-Qadr (23 Ramadan)', 'شب قدر (۲۳ رمضان)', 9, 23],
  ['Eid al-Fitr', 'عید الفطر', 10, 1],
  ['Ashura', 'عاشورا', 1, 10],
  ['Arbaeen', 'اربعین', 2, 20],
  ['Eid al-Ghadir', 'عید غدیر', 12, 18],
]

function referenceOccasionRows() {
  return referenceOccasions.map(([name, nameUrdu, hijriMonth, hijriDay], index) => ({
    id: `reference-${index}`,
    name,
    name_urdu: nameUrdu,
    hijri_month: hijriMonth,
    hijri_day: hijriDay,
    description: 'Major Shia Islamic occasion. The Gregorian date is an estimate until confirmed for Pakistan by an authorized administrator.',
    language: 'both',
    source: 'Built-in Shia occasion reference',
    confirmation_status: 'awaiting_confirmation',
  }))
}

function isMissingTableError(error) {
  return error?.code === '42P01' || error?.code === 'PGRST205'
}

function requireClient() {
  if (supabaseConfigError || !supabase) throw new Error(supabaseConfigError ?? 'The Islamic calendar service is not configured.')
  return supabase
}

async function alAdhan(path, params) {
  const query = new URLSearchParams(params)
  const suffix = query.toString() ? `?${query}` : ''
  const response = await fetch(`${API_BASE}/${path}${suffix}`)
  if (!response.ok) throw new Error(`Islamic calendar service returned ${response.status}.`)
  const payload = await response.json()
  if (payload.code !== 200 || !payload.data) throw new Error(payload.status || 'Islamic calendar data could not be loaded.')
  return payload.data
}

function cached(key) {
  try {
    const item = JSON.parse(localStorage.getItem(`${CACHE_PREFIX}${key}`) || 'null')
    return item && item.expiresAt > Date.now() ? item.value : null
  } catch {
    return null
  }
}

function cache(key, value, ttl = 12 * 60 * 60 * 1000) {
  try {
    localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify({ value, expiresAt: Date.now() + ttl }))
  } catch {
    // Caching is optional; the live request remains authoritative.
  }
  return value
}

export function formatApiDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${day}-${month}-${year}`
}

export function formatInputDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function parseApiDate(value) {
  const [day, month, year] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export async function fetchHijriForDate(date) {
  const key = `hijri-${formatInputDate(date)}`
  const saved = cached(key)
  if (saved) return saved
  const data = await alAdhan(`gToH/${formatApiDate(date)}`, {})
  return cache(key, {
    gregorianDate: formatInputDate(date),
    hijriDay: Number(data.hijri.day),
    hijriMonth: Number(data.hijri.month.number),
    hijriMonthName: data.hijri.month.en,
    hijriMonthNameArabic: data.hijri.month.ar,
    hijriYear: Number(data.hijri.year),
    hijriDate: data.hijri.date,
    status: 'calculated',
  })
}

export async function fetchHijriForMonth(date) {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const key = `hijri-month-${year}-${month}`
  const saved = cached(key)
  if (saved) return saved
  const data = await alAdhan(`calendar/${year}/${month}`, {
    latitude: '31.5204',
    longitude: '74.3587',
    method: '0',
    timezone: 'Asia/Karachi',
  })
  const result = Object.fromEntries(data.map((entry) => {
    const hijri = entry.date.hijri
    const gregorian = entry.date.gregorian.date.split('-').reverse().join('-')
    return [gregorian, {
      gregorianDate: gregorian,
      hijriDay: Number(hijri.day),
      hijriMonth: Number(hijri.month.number),
      hijriMonthName: hijri.month.en,
      hijriMonthNameArabic: hijri.month.ar,
      hijriYear: Number(hijri.year),
      hijriDate: hijri.date,
      status: 'calculated',
    }]
  }))
  return cache(key, result)
}

export async function fetchPrayerTimes(date, city) {
  const key = `prayers-${formatInputDate(date)}-${city.name}`
  const saved = cached(key, 60 * 60 * 1000)
  if (saved) return saved
  const data = await alAdhan(`timings/${formatApiDate(date)}`, {
    latitude: city.latitude,
    longitude: city.longitude,
    method: '0',
    timezonestring: 'Asia/Karachi',
    midnight: 'JAFARI',
  })
  return cache(key, {
    date: formatInputDate(date),
    timezone: 'Asia/Karachi',
    method: 'Jafari (0)',
    midnightMode: 'Jafari',
    city: city.name,
    timings: data.timings,
  }, 60 * 60 * 1000)
}

export async function fetchPublishedIslamicData() {
  const client = requireClient()
  const [occasions, overrides] = await Promise.all([
    client.from('islamic_occasions').select('id, name, name_urdu, hijri_month, hijri_day, description, language, source').eq('published', true).order('hijri_month').order('hijri_day'),
    client.from('islamic_date_overrides').select('id, gregorian_date, hijri_date, hijri_year, hijri_month, hijri_day, city_region, confirmation_status, source, reason, updated_at').order('gregorian_date'),
  ])
  if (overrides.error && !isMissingTableError(overrides.error)) throw new Error(overrides.error.message || 'Confirmed Islamic dates could not be loaded.')
  const storedOccasions = occasions.error ? [] : (occasions.data ?? [])
  const storedKeys = new Set(storedOccasions.map((item) => `${item.hijri_month}-${item.hijri_day}`))
  const fallbackOccasions = referenceOccasionRows().filter((item) => !storedKeys.has(`${item.hijri_month}-${item.hijri_day}`))
  return { occasions: [...storedOccasions, ...fallbackOccasions], overrides: overrides.data ?? [] }
}

export async function fetchAdminIslamicData() {
  const client = requireClient()
  const [occasions, overrides] = await Promise.all([
    client.from('islamic_occasions').select('*').order('hijri_month').order('hijri_day'),
    client.from('islamic_date_overrides').select('*').order('gregorian_date', { ascending: false }),
  ])
  if (occasions.error) throw new Error(occasions.error.message || 'Islamic occasions could not be loaded.')
  if (overrides.error) throw new Error(overrides.error.message || 'Islamic date overrides could not be loaded.')
  return { occasions: occasions.data ?? [], overrides: overrides.data ?? [] }
}

export async function saveOccasion(payload, id = null) {
  const client = requireClient()
  const { data: userData } = await client.auth.getUser()
  if (!userData.user) throw new Error('You must be signed in as an administrator.')
  const values = { ...payload, created_by: userData.user.id }
  const query = id
    ? client.from('islamic_occasions').update(values).eq('id', id)
    : client.from('islamic_occasions').insert(values)
  const { error } = await query
  if (error) throw new Error(error.message || 'The occasion could not be saved.')
}

export async function saveDateOverride(payload, id = null) {
  const client = requireClient()
  const { data: userData } = await client.auth.getUser()
  if (!userData.user) throw new Error('You must be signed in as an administrator.')
  const values = { ...payload, updated_by: userData.user.id }
  const query = id
    ? client.from('islamic_date_overrides').update(values).eq('id', id)
    : client.from('islamic_date_overrides').insert(values)
  const { error } = await query
  if (error) throw new Error(error.message || 'The confirmed date could not be saved.')
}

export async function deleteCalendarRecord(table, id) {
  const client = requireClient()
  const { error } = await client.from(table).delete().eq('id', id)
  if (error) throw new Error(error.message || 'The calendar record could not be deleted.')
}
