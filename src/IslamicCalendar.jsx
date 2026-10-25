import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, CalendarDays, CircleHelp, Clock3, LogIn, LogOut, MapPin, RefreshCw, ShieldCheck } from 'lucide-react'
import { supabase } from './lib/supabaseClient.js'
import {
  deleteCalendarRecord, fetchAdminIslamicData, fetchHijriForMonth, fetchPrayerTimes,
  fetchPublishedIslamicData, formatInputDate, saveDateOverride, saveOccasion,
} from './lib/islamicCalendar.js'

function CalendarFrame({ children, className = '' }) {
  return <main className={`page-main ${className}`}>{children}</main>
}

function CalendarHeader({ title, description }) {
  return <div className="page-heading"><h1>{title}</h1><span className="gold-rule" />{description && <p>{description}</p>}</div>
}

export const pakistanCities = [
  { name: 'Lahore', latitude: 31.5204, longitude: 74.3587 },
  { name: 'Karachi', latitude: 24.8607, longitude: 67.0011 },
  { name: 'Islamabad', latitude: 33.6844, longitude: 73.0479 },
  { name: 'Rawalpindi', latitude: 33.5651, longitude: 73.0169 },
  { name: 'Peshawar', latitude: 34.0151, longitude: 71.5249 },
  { name: 'Quetta', latitude: 30.1798, longitude: 66.975 },
]

const prayerLabels = [
  ['Fajr', 'Fajr'], ['Sunrise', 'Sunrise'], ['Dhuhr', 'Dhuhr'], ['Asr', 'Asr'],
  ['Maghrib', 'Maghrib'], ['Isha', 'Isha'], ['Midnight', 'Islamic midnight'],
]
const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const urduMonths = {
  Muharram: 'محرم', Safar: 'صفر', 'Rabi al-Awwal': 'ربیع الاول', 'Rabi al-Thani': 'ربیع الثانی',
  'Jumada al-Awwal': 'جمادی الاول', 'Jumada al-Thani': 'جمادی الثانی', Rajab: 'رجب',
  'Sha’ban': 'شعبان', Ramadan: 'رمضان', Shawwal: 'شوال', 'Dhul-Qadah': 'ذوالقعدہ', 'Dhul-Hijjah': 'ذوالحجہ',
}
const hijriMonthNames = ['', 'Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani', 'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', 'Sha’ban', 'Ramadan', 'Shawwal', 'Dhul-Qadah', 'Dhul-Hijjah']

function pakistanToday() {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date())
  const values = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]))
  return new Date(Number(values.year), Number(values.month) - 1, Number(values.day))
}

function monthDays(date) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1)
  const start = new Date(first)
  start.setDate(1 - first.getDay())
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start)
    day.setDate(start.getDate() + index)
    return day
  })
}

function statusLabel(status) {
  if (status === 'awaiting_confirmation') return 'Awaiting confirmation'
  return status === 'confirmed' || status === 'verified' ? 'Confirmed' : 'Calculated estimate'
}

function formatPakistanDate(date, options = {}) {
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Karachi', ...options }).format(date)
}

function CalendarStatus({ status }) {
  return <span className={`calendar-status calendar-status-${status}`}><span />{statusLabel(status)}</span>
}

function PrayerTimes({ selectedCity }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    setError('')
    try {
      setData(await fetchPrayerTimes(pakistanToday(), selectedCity))
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [selectedCity])

  const nextPrayer = useMemo(() => {
    if (!data) return ''
    const now = new Date()
    const [currentHour, currentMinute] = formatPakistanDate(now, { hour: '2-digit', minute: '2-digit', hour12: false }).split(':').map(Number)
    const minutesNow = currentHour * 60 + currentMinute
    const upcoming = prayerLabels
      .filter(([key]) => key !== 'Sunrise' && data.timings[key])
      .map(([key, label]) => {
        const [hour, minute] = data.timings[key].replace(/\s*\(.*/, '').split(':').map(Number)
        return { key, label, value: hour * 60 + minute }
      })
      .find((prayer) => prayer.value > minutesNow)
    return upcoming?.label || 'Tomorrow’s Fajr'
  }, [data])

  return <section className="prayer-panel">
    <div className="calendar-section-heading"><div><span className="eyebrow">JAFARI PRAYER CALCULATION</span><h2>Prayer times</h2></div><button className="icon-button" onClick={load} aria-label="Refresh prayer times"><RefreshCw size={15} /></button></div>
    <p className="prayer-meta"><MapPin size={14} /> {selectedCity.name}, Pakistan · Method 0: Jafari · Asia/Karachi · Midnight: Jafari</p>
    {loading && <p className="calendar-loading">Loading prayer times…</p>}
    {!loading && error && <div className="calendar-error"><CircleHelp size={18} /><p>{error}</p><button className="button button-outline" onClick={load}>Retry</button></div>}
    {!loading && !error && data && <><div className="next-prayer"><Clock3 size={17} /><span>Next prayer</span><strong>{nextPrayer}</strong></div><div className="prayer-list">{prayerLabels.map(([key, label]) => data.timings[key] && <div key={key}><span>{label}</span><strong>{data.timings[key].replace(/\s*\(.*/, '')}</strong></div>)}</div><p className="prayer-disclaimer">These are calculated Jafari times from AlAdhan and may differ from local Shia mosque timetables.</p></>}
  </section>
}

export function IslamicCalendar() {
  const today = pakistanToday()
  const [month, setMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selected, setSelected] = useState(today)
  const [days, setDays] = useState({})
  const [selectedHijri, setSelectedHijri] = useState(null)
  const [religiousData, setReligiousData] = useState({ occasions: [], overrides: [] })
  const [city, setCity] = useState(pakistanCities[0])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const grid = useMemo(() => monthDays(month), [month])
  const monthKey = `${month.getFullYear()}-${month.getMonth()}`

  async function loadMonth() {
    setLoading(true)
    setError('')
    try {
      const monthData = await fetchHijriForMonth(month)
      setDays(monthData)
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadMonth() }, [monthKey])
  useEffect(() => {
    fetchPublishedIslamicData().then(setReligiousData).catch(() => setReligiousData({ occasions: [], overrides: [] }))
  }, [])
  useEffect(() => { setSelectedHijri(days[formatInputDate(selected)] || null) }, [days, selected])

  const selectedOverride = religiousData.overrides.find((item) => item.gregorian_date === formatInputDate(selected))
  const todayOverride = religiousData.overrides.find((item) => item.gregorian_date === formatInputDate(today))
  const todayDateData = todayOverride || days[formatInputDate(today)]
  const selectedOccasions = selectedHijri ? religiousData.occasions.filter((item) => item.hijri_month === selectedHijri.hijriMonth && item.hijri_day === selectedHijri.hijriDay) : []
  const selectedDateData = selectedOverride || selectedHijri
  const hijriMonthName = selectedDateData?.hijriMonthName || selectedDateData?.hijri_date?.split(' ')[1] || 'Islamic calendar'
  const hijriMonthUrdu = urduMonths[hijriMonthName] || ''
  const hijriYear = selectedDateData?.hijriYear || selectedDateData?.hijri_year || ''

  return <CalendarFrame className="content-page islamic-calendar-page">
    <CalendarHeader title="Pakistan Shia Islamic Calendar" description="A Pakistan-focused calendar with confirmed community dates where maintained, and clearly labelled calculated estimates for dates awaiting confirmation." />
    <div className="calendar-layout">
      <main>
        <section className="today-card"><div><span className="eyebrow">TODAY IN PAKISTAN</span><h2>{formatPakistanDate(new Date(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h2><p>{todayDateData?.hijri_date || todayDateData?.hijriDate || 'Hijri date loading…'}</p></div><CalendarDays size={34} /></section>
        <section className="month-calendar">
          <div className="calendar-section-heading"><button className="icon-button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} aria-label="Previous month"><ArrowLeft size={16} /></button><div><h2>{month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2><p>Hijri dates are calculated estimates unless a confirmed override is shown.</p><span className="calendar-reference-note">Major occasions are shown as awaiting confirmation until maintained in Supabase.</span></div><button className="icon-button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} aria-label="Next month"><ArrowRight size={16} /></button></div>
          {loading && <p className="calendar-loading">Loading Hijri dates…</p>}
          {error && <div className="calendar-error"><CircleHelp size={18} /><p>{error}</p><button className="button button-outline" onClick={loadMonth}>Retry</button></div>}
          <div className="calendar-weekdays">{weekdays.map((day) => <span key={day}>{day}</span>)}</div>
          <div className="calendar-grid">{grid.map((date) => {
            const dateKey = formatInputDate(date)
            const info = days[dateKey]
            const override = religiousData.overrides.find((item) => item.gregorian_date === dateKey)
            const occasions = info ? religiousData.occasions.filter((item) => item.hijri_month === info.hijriMonth && item.hijri_day === info.hijriDay) : []
            return <button className={`calendar-day${date.getMonth() !== month.getMonth() ? ' outside-month' : ''}${dateKey === formatInputDate(selected) ? ' selected-day' : ''}`} key={dateKey} onClick={() => setSelected(date)}><strong>{date.getDate()}</strong><span>{override?.hijri_date || info?.hijriDay || '–'}</span>{occasions.length > 0 && <i aria-label={`${occasions.length} religious occasion`} />}{override && <em>✓</em>}</button>
          })}</div>
        </section>
        <section className="selected-day-card"><div className="calendar-section-heading"><div><span className="eyebrow">SELECTED DAY</span><h2>{selected.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h2></div>{selectedOverride ? <CalendarStatus status={selectedOverride.confirmation_status} /> : <CalendarStatus status="calculated" />}</div><p className="selected-hijri">{selectedDateData?.hijri_date || selectedDateData?.hijriDate || 'No Hijri date available.'} · {hijriMonthName} {hijriYear} {hijriMonthUrdu && <span dir="rtl">· {hijriMonthUrdu}</span>}</p>{selectedOccasions.length ? <div className="occasion-list">{selectedOccasions.map((occasion) => <article key={occasion.id}><h3>{occasion.name}</h3>{occasion.name_urdu && <p dir="rtl">{occasion.name_urdu}</p>}<span>{occasion.description || 'Religious occasion maintained by an authorized calendar administrator.'}</span><small>Source: {occasion.source}</small></article>)}</div> : <p className="calendar-muted">No verified religious occasion is recorded for this selected date.</p>}</section>
      </main>
      <aside><section className="occasion-directory"><div className="calendar-section-heading"><div><span className="eyebrow">SHIA OCCASIONS</span><h2>Major dates</h2></div><CalendarDays size={21} /></div><p className="calendar-directory-note">These recurring Hijri occasions are reference dates. Their Pakistan Gregorian date requires confirmation.</p><div className="occasion-directory-list">{religiousData.occasions.map((occasion) => <div key={occasion.id}><strong>{occasion.name}</strong><span dir={occasion.name_urdu ? 'rtl' : undefined}>{occasion.hijri_day} {hijriMonthNames[occasion.hijri_month] || `Hijri month ${occasion.hijri_month}`}{occasion.name_urdu ? ` · ${occasion.name_urdu}` : ''}</span><CalendarStatus status={occasion.confirmation_status || 'awaiting_confirmation'} /></div>)}</div></section><div className="city-selector"><label htmlFor="prayer-city">Prayer city</label><select id="prayer-city" value={city.name} onChange={(event) => setCity(pakistanCities.find((item) => item.name === event.target.value) || pakistanCities[0])}>{pakistanCities.map((item) => <option key={item.name}>{item.name}</option>)}</select></div><PrayerTimes selectedCity={city} /><div className="calendar-note"><ShieldCheck size={17} /><p>Confirmed dates are maintained in Supabase by authorized administrators. Calculated dates are never presented as moon-sighting proof.</p></div></aside>
    </div>
  </CalendarFrame>
}

function AdminGate({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  useEffect(() => {
    if (!supabase) return setLoading(false)
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false) }).catch((loadError) => { setError(loadError.message); setLoading(false) })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
    return () => listener.subscription.unsubscribe()
  }, [])
  if (loading) return <CalendarFrame className="content-page"><p>Checking administrator access…</p></CalendarFrame>
  if (!session) return <CalendarFrame className="content-page admin-page"><CalendarHeader title="Calendar Admin" description="Sign in with an authorized Supabase account to maintain verified dates and occasions." /><form className="contact-form admin-login-form" onSubmit={async (event) => { event.preventDefault(); setError(''); const result = await supabase?.auth.signInWithPassword({ email: email.trim(), password }); if (result?.error) setError(result.error.message) }}><label htmlFor="calendar-admin-email">Email</label><input id="calendar-admin-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /><label htmlFor="calendar-admin-password">Password</label><input id="calendar-admin-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />{error && <p className="form-feedback form-error">{error}</p>}<button className="button button-primary form-submit" type="submit">Sign in <LogIn size={15} /></button></form></CalendarFrame>
  return children(session)
}

export function AdminIslamicCalendar() {
  const [data, setData] = useState({ occasions: [], overrides: [] })
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [occasionId, setOccasionId] = useState(null)
  const [overrideId, setOverrideId] = useState(null)
  const [occasion, setOccasion] = useState({ name: '', name_urdu: '', hijri_month: 1, hijri_day: 1, description: '', language: 'both', source: '', published: true })
  const [override, setOverride] = useState({ gregorian_date: '', hijri_date: '', hijri_year: '', hijri_month: 1, hijri_day: 1, city_region: 'Pakistan', confirmation_status: 'confirmed', source: '', reason: '' })
  async function refresh() { try { setData(await fetchAdminIslamicData()) } catch (loadError) { setError(loadError.message) } }
  useEffect(() => { refresh() }, [])
  async function save(type) {
    setError(''); setMessage('')
    try { if (type === 'occasion') { await saveOccasion({ ...occasion, hijri_month: Number(occasion.hijri_month), hijri_day: Number(occasion.hijri_day) }, occasionId); setOccasionId(null) } else { await saveDateOverride({ ...override, hijri_year: Number(override.hijri_year), hijri_month: Number(override.hijri_month), hijri_day: Number(override.hijri_day) }, overrideId); setOverrideId(null) } await refresh(); setMessage('Saved.'); } catch (saveError) { setError(saveError.message) }
  }
  return <AdminGate>{() => <CalendarFrame className="content-page admin-page"><div className="admin-heading"><CalendarHeader title="Islamic Calendar Admin" description="Maintain verified Shia occasions and Pakistan date confirmations. Add a source for every record." /><button className="button button-outline" onClick={() => supabase.auth.signOut()}><LogOut size={15} /> Sign out</button></div>{error && <p className="form-feedback form-error">{error}</p>}{message && <p className="form-feedback form-success">{message}</p>}<div className="calendar-admin-grid"><form className="contact-form" onSubmit={(event) => { event.preventDefault(); save('occasion') }}><h2>{occasionId ? 'Edit occasion' : 'Add occasion'}</h2><label>Name</label><input value={occasion.name} onChange={(event) => setOccasion({ ...occasion, name: event.target.value })} required /><label>Urdu name</label><input dir="rtl" value={occasion.name_urdu} onChange={(event) => setOccasion({ ...occasion, name_urdu: event.target.value })} /><label>Hijri month / day</label><div className="admin-inline-fields"><input type="number" min="1" max="12" value={occasion.hijri_month} onChange={(event) => setOccasion({ ...occasion, hijri_month: event.target.value })} /><input type="number" min="1" max="30" value={occasion.hijri_day} onChange={(event) => setOccasion({ ...occasion, hijri_day: event.target.value })} /></div><label>Description</label><textarea rows="3" value={occasion.description} onChange={(event) => setOccasion({ ...occasion, description: event.target.value })} /><label>Source</label><input value={occasion.source} onChange={(event) => setOccasion({ ...occasion, source: event.target.value })} required /><button className="button button-primary form-submit" type="submit">{occasionId ? 'Update occasion' : 'Save occasion'}</button></form><form className="contact-form" onSubmit={(event) => { event.preventDefault(); save('override') }}><h2>{overrideId ? 'Edit confirmed date' : 'Confirm date'}</h2><label>Gregorian date</label><input type="date" value={override.gregorian_date} onChange={(event) => setOverride({ ...override, gregorian_date: event.target.value })} required /><label>Hijri date (display)</label><input value={override.hijri_date} onChange={(event) => setOverride({ ...override, hijri_date: event.target.value })} placeholder="10 Muharram 1448" required /><label>Hijri year / month / day</label><div className="admin-inline-fields"><input type="number" value={override.hijri_year} onChange={(event) => setOverride({ ...override, hijri_year: event.target.value })} required /><input type="number" min="1" max="12" value={override.hijri_month} onChange={(event) => setOverride({ ...override, hijri_month: event.target.value })} required /><input type="number" min="1" max="30" value={override.hijri_day} onChange={(event) => setOverride({ ...override, hijri_day: event.target.value })} required /></div><label>Status</label><select value={override.confirmation_status} onChange={(event) => setOverride({ ...override, confirmation_status: event.target.value })}><option value="confirmed">Confirmed</option><option value="verified">Verified</option><option value="awaiting_confirmation">Awaiting confirmation</option></select><label>Source</label><input value={override.source} onChange={(event) => setOverride({ ...override, source: event.target.value })} required /><label>Reason</label><textarea rows="2" value={override.reason} onChange={(event) => setOverride({ ...override, reason: event.target.value })} /><button className="button button-primary form-submit" type="submit">{overrideId ? 'Update date' : 'Save date'}</button></form></div><section className="admin-announcement-list"><h2>Maintained occasions</h2>{data.occasions.map((item) => <article className="admin-announcement-row" key={item.id}><div><strong>{item.name}</strong><p>Hijri {item.hijri_month}/{item.hijri_day} · {item.source}</p></div><div className="admin-row-actions"><button onClick={() => { setOccasionId(item.id); setOccasion(item) }}>Edit</button><button className="admin-delete-button" onClick={() => deleteCalendarRecord('islamic_occasions', item.id).then(refresh).catch((deleteError) => setError(deleteError.message))}>Delete</button></div></article>)}<h2>Confirmed dates</h2>{data.overrides.map((item) => <article className="admin-announcement-row" key={item.id}><div><strong>{item.gregorian_date} · {item.hijri_date}</strong><p>{item.confirmation_status} · {item.source}</p></div><div className="admin-row-actions"><button onClick={() => { setOverrideId(item.id); setOverride(item) }}>Edit</button><button className="admin-delete-button" onClick={() => deleteCalendarRecord('islamic_date_overrides', item.id).then(refresh).catch((deleteError) => setError(deleteError.message))}>Delete</button></div></article>)}</section></CalendarFrame>}</AdminGate>
}
