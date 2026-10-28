import { useEffect, useMemo, useState } from 'react'
import { BookOpen, Calendar, Check, CircleHelp, Clock3, Copy, ExternalLink, FileText, Image, LogIn, LogOut, MessageCircle, Pencil, Plus, RefreshCw, Search, Trash2, Upload, X } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from './lib/supabaseClient.js'
import { deleteStory, fetchAdminStories, fetchAdminStory, fetchPublishedStories, fetchPublishedStory, fetchStoryCategories, saveStory, uploadStoryCover } from './lib/stories.js'

const emptyStory = { categoryId: '', titleUr: '', slug: '', excerptUr: '', contentUr: '', coverImageUrl: '', status: 'draft', featured: false, historicalNotesUr: '' }
const emptySource = { sourceTitle: '', authorName: '', sourceType: '', volume: '', page: '', reportNumber: '', sourceUrl: '', citationNoteUr: '', narrationStatus: '' }

function PageFrame({ children, className = '' }) {
  return <main className={`page-main ${className}`}>{children}</main>
}

function Header({ title, description, eyebrow = 'اسلامی واقعات و سیرت' }) {
  return <header className="page-heading stories-heading" dir="rtl"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><span className="gold-rule" />{description && <p>{description}</p>}</header>
}

function Meta({ story }) {
  const minutes = Math.max(1, Math.ceil(story.contentUr.trim().split(/\s+/).length / 180))
  return <div className="story-meta" dir="rtl"><time dateTime={story.publishedAt || story.createdAt}><Calendar size={14} /> {new Intl.DateTimeFormat('ur-PK', { dateStyle: 'medium' }).format(new Date(story.publishedAt || story.createdAt))}</time><span><Clock3 size={14} /> {minutes} منٹ مطالعہ</span></div>
}

function StoryCover({ story, large = false }) {
  return story.coverImageUrl ? <img className={`story-cover${large ? ' story-cover-large' : ''}`} src={story.coverImageUrl} alt="" /> : <div className={`story-cover story-cover-placeholder${large ? ' story-cover-large' : ''}`} aria-hidden="true"><span>﷽</span><small>رَبِّ زِدْنِي عِلْمًا</small></div>
}

function StoryCard({ story }) {
  return <article className="story-card" dir="rtl"><StoryCover story={story} /><div className="story-card-body"><span className="story-category">{story.category?.nameUr || 'سیرت و تاریخ'}</span><h2><Link to={`/stories/${story.slug}`}>{story.titleUr}</Link></h2><p>{story.excerptUr}</p><Meta story={story} /><Link className="story-read-more" to={`/stories/${story.slug}`}>مکمل واقعہ پڑھیں <ExternalLink size={14} /></Link></div></article>
}

export function Stories() {
  const [stories, setStories] = useState([])
  const [categories, setCategories] = useState([])
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true); setError('')
    try { const [loadedStories, loadedCategories] = await Promise.all([fetchPublishedStories(), fetchStoryCategories()]); setStories(loadedStories); setCategories(loadedCategories) } catch (loadError) { setError(loadError.message) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])
  const filtered = useMemo(() => stories.filter((story) => (!category || story.categoryId === category) && (!query.trim() || `${story.titleUr} ${story.excerptUr}`.includes(query.trim()))), [stories, category, query])
  const featured = filtered.filter((story) => story.featured)
  return <PageFrame className="content-page stories-page">
    <Header title="اسلامی واقعات و سیرتِ اہلِ بیت (ع)" description="اہلِ بیتِ اطہار علیہم السلام کی سیرت، اسلامی تاریخ اور سبق آموز واقعات کو تحقیق، ادب اور احترام کے ساتھ پڑھیں۔" />
    <section className="stories-hero" dir="rtl"><div><span className="eyebrow">علم، بصیرت اور کردار</span><h2>تاریخ سے روشنی، سیرت سے رہنمائی</h2><p>مقدس شخصیات کی تصاویر کے بغیر، معتبر ماخذ اور واضح تاریخی احتیاط کے ساتھ مرتب کیے گئے مضامین۔</p></div><div className="stories-ornament" aria-hidden="true">۞</div></section>
    <div className="stories-toolbar" dir="rtl"><label className="story-search"><Search size={17} /><span className="sr-only">عنوان تلاش کریں</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="اردو عنوان تلاش کریں…" /></label><select aria-label="زمرہ منتخب کریں" value={category} onChange={(event) => setCategory(event.target.value)}><option value="">تمام زمرے</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.nameUr}</option>)}</select></div>
    {loading && <StoryState icon={BookOpen} title="مضامین لوڈ ہو رہے ہیں" text="براہِ کرم چند لمحے انتظار کریں…" />}
    {!loading && error && <StoryState icon={CircleHelp} title="مضامین دستیاب نہیں" text={error} action={<button className="button button-outline" onClick={load}><RefreshCw size={15} /> دوبارہ کوشش کریں</button>} />}
    {!loading && !error && !filtered.length && <StoryState icon={Search} title="کوئی مضمون نہیں ملا" text="دوسرے الفاظ یا کوئی دوسرا زمرہ آزمائیں۔" />}
    {!loading && !error && filtered.length > 0 && <>{featured.length > 0 && <section className="stories-section" dir="rtl"><div className="stories-section-title"><div><span className="eyebrow">منتخب مضامین</span><h2>نمایاں واقعات</h2></div></div><div className="story-grid story-grid-featured">{featured.slice(0, 3).map((story) => <StoryCard key={story.id} story={story} />)}</div></section>}<section className="stories-section" dir="rtl"><div className="stories-section-title"><div><span className="eyebrow">تازہ اشاعتیں</span><h2>حالیہ مضامین</h2></div></div><div className="story-grid">{filtered.map((story) => <StoryCard key={story.id} story={story} />)}</div></section></>}
  </PageFrame>
}

function StoryState({ icon: Icon, title, text, action }) {
  return <div className="stories-state" dir="rtl"><Icon size={28} /><h2>{title}</h2><p>{text}</p>{action}</div>
}

function renderContent(content) {
  return content.split(/\n\s*\n/).map((block, index) => {
    const text = block.trim()
    if (!text) return null
    if (text.startsWith('# ')) return <h2 key={index}>{text.slice(2)}</h2>
    if (text.startsWith('> ')) return <blockquote key={index}>{text.slice(2)}</blockquote>
    return <p key={index}>{text.split('\n').map((line, lineIndex) => <span key={lineIndex}>{line}{lineIndex < text.split('\n').length - 1 && <br />}</span>)}</p>
  })
}

function setStoryMeta(story) {
  const description = story.excerptUr
  document.title = `${story.titleUr} | ربِط اہلِ بیت`
  const values = { description, 'og:title': story.titleUr, 'og:description': description, 'og:type': 'article', 'og:url': window.location.href }
  Object.entries(values).forEach(([name, content]) => {
    const attribute = name.startsWith('og:') ? 'property' : 'name'
    let tag = document.head.querySelector(`meta[${attribute}="${name}"]`)
    if (!tag) { tag = document.createElement('meta'); tag.setAttribute(attribute, name); document.head.appendChild(tag) }
    tag.setAttribute('content', content)
  })
  let canonical = document.head.querySelector('link[rel="canonical"]')
  if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical) }
  canonical.href = window.location.href
}

export function StoryDetail() {
  const { slug } = useParams()
  const [story, setStory] = useState(null)
  const [allStories, setAllStories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => { Promise.all([fetchPublishedStory(slug), fetchPublishedStories()]).then(([loaded, loadedStories]) => { setStory(loaded); setAllStories(loadedStories); if (loaded) setStoryMeta(loaded) }).catch((loadError) => setError(loadError.message)).finally(() => setLoading(false)) }, [slug])
  if (loading) return <PageFrame className="content-page"><StoryState icon={BookOpen} title="مضمون لوڈ ہو رہا ہے" text="براہِ کرم انتظار کریں…" /></PageFrame>
  if (error || !story) return <PageFrame className="content-page"><StoryState icon={CircleHelp} title="مضمون دستیاب نہیں" text={error || 'یہ مضمون موجود نہیں یا شائع نہیں کیا گیا۔'} action={<Link className="button button-outline" to="/stories">تمام مضامین</Link>} /></PageFrame>
  const related = allStories.filter((item) => item.id !== story.id && item.categoryId === story.categoryId).slice(0, 3)
  const shareUrl = window.location.href
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`${story.titleUr} — ${shareUrl}`)}`
  return <PageFrame className="content-page story-detail-page"><article className="story-article" dir="rtl"><Link className="story-back" to="/stories">← تمام مضامین</Link><span className="story-category">{story.category?.nameUr}</span><h1>{story.titleUr}</h1><p className="story-lead">{story.excerptUr}</p><Meta story={story} /><StoryCover story={story} large /><div className="story-content">{renderContent(story.contentUr)}</div>{story.historicalNotesUr && <aside className="historical-notes"><FileText size={18} /><div><h2>تاریخی احتیاط</h2><p>{story.historicalNotesUr}</p></div></aside>}{story.sources.length > 0 && <section className="story-sources"><h2>ماخذ و حوالہ جات</h2>{story.sources.map((source) => <div className="source-item" key={source.id}><strong>{source.sourceTitle}</strong>{source.authorName && <span> — {source.authorName}</span>}<p>{[source.volume && `جلد ${source.volume}`, source.page && `صفحہ ${source.page}`, source.reportNumber && `روایت/حدیث ${source.reportNumber}`].filter(Boolean).join('، ') || source.citationNoteUr || 'حوالہ کی تفصیل ناشر کے ایڈیشن کے مطابق ملاحظہ کی جائے۔'}{source.narrationStatus && ` · ${source.narrationStatus}`}</p>{source.sourceUrl && <a href={source.sourceUrl} target="_blank" rel="noreferrer">آن لائن ماخذ <ExternalLink size={13} /></a>}</div>)}</section>}<div className="story-share"><span>یہ مضمون شیئر کریں</span><a className="whatsapp-button" href={whatsapp} target="_blank" rel="noreferrer"><MessageCircle size={16} /> WhatsApp</a><button className="button button-outline" onClick={() => navigator.clipboard?.writeText(shareUrl)}><Copy size={15} /> لنک کاپی کریں</button></div></article>{related.length > 0 && <section className="stories-section related-stories" dir="rtl"><div className="stories-section-title"><div><span className="eyebrow">مزید مطالعہ</span><h2>متعلقہ مضامین</h2></div></div><div className="story-grid">{related.map((item) => <StoryCard key={item.id} story={item} />)}</div></section>}</PageFrame>
}

function AdminLogin({ onSignedIn }) {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [loading, setLoading] = useState(false)
  async function signIn(event) { event.preventDefault(); setError(''); setLoading(true); const result = await supabase?.auth.signInWithPassword({ email: email.trim(), password }); if (result?.error) setError(result.error.message); else onSignedIn(); setLoading(false) }
  return <PageFrame className="content-page admin-page" dir="rtl"><Header title="مضامین کا انتظام" description="صرف مجاز منتظمین Supabase Auth کے ذریعے داخل ہوں۔" /><form className="contact-form admin-login-form" onSubmit={signIn}><label htmlFor="story-admin-email">ای میل</label><input id="story-admin-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /><label htmlFor="story-admin-password">پاس ورڈ</label><input id="story-admin-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />{error && <p className="form-feedback form-error" role="alert">{error}</p>}<button className="button button-primary form-submit" type="submit" disabled={loading}>{loading ? 'داخل ہو رہے ہیں…' : 'سائن اِن'} <LogIn size={15} /></button></form></PageFrame>
}

function SourceEditor({ sources, setSources }) {
  function update(index, key, value) { setSources(sources.map((source, sourceIndex) => sourceIndex === index ? { ...source, [key]: value } : source)) }
  return <div className="source-editor"><div className="source-editor-heading"><h3>ماخذ و حوالہ جات</h3><button type="button" className="button button-outline" onClick={() => setSources([...sources, { ...emptySource }])}><Plus size={14} /> حوالہ شامل کریں</button></div>{sources.map((source, index) => <div className="source-editor-row" key={index}><input value={source.sourceTitle} onChange={(event) => update(index, 'sourceTitle', event.target.value)} placeholder="کتاب / ماخذ کا نام *" required /><input value={source.authorName} onChange={(event) => update(index, 'authorName', event.target.value)} placeholder="مصنف" /><input value={source.volume} onChange={(event) => update(index, 'volume', event.target.value)} placeholder="جلد" /><input value={source.page} onChange={(event) => update(index, 'page', event.target.value)} placeholder="صفحہ" /><input value={source.narrationStatus} onChange={(event) => update(index, 'narrationStatus', event.target.value)} placeholder="روایت کی حیثیت" /><input value={source.sourceUrl} onChange={(event) => update(index, 'sourceUrl', event.target.value)} placeholder="ماخذ URL (اختیاری)" /><button type="button" className="icon-button" aria-label="حوالہ حذف کریں" onClick={() => setSources(sources.filter((_, sourceIndex) => sourceIndex !== index))}><X size={15} /></button></div>)}</div>
}

function StoryForm({ categories, story, sources, onSaved, onCancel }) {
  const [form, setForm] = useState(story); const [sourceRows, setSourceRows] = useState(sources); const [file, setFile] = useState(null); const [saving, setSaving] = useState(false); const [error, setError] = useState('')
  function update(key, value) { setForm((current) => ({ ...current, [key]: value })) }
  async function submit(event) { event.preventDefault(); setError(''); if (!form.categoryId || !form.titleUr.trim() || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug.trim())) { setError('زمرہ، عنوان اور منفرد انگریزی slug درست طور پر درج کریں۔'); return } setSaving(true); try { const storyId = form.id || crypto.randomUUID(); let imageUrl = form.coverImageUrl; if (file) imageUrl = await uploadStoryCover(file, storyId); await saveStory({ ...form, id: storyId, coverImageUrl: imageUrl }, sourceRows, form.id); onSaved() } catch (saveError) { setError(saveError.message) } finally { setSaving(false) } }
  return <form className="contact-form story-editor" onSubmit={submit} dir="rtl"><div className="editor-grid"><div><label htmlFor="story-title">اردو عنوان *</label><input id="story-title" value={form.titleUr} onChange={(event) => update('titleUr', event.target.value)} maxLength="220" required /></div><div><label htmlFor="story-slug">مستقل slug *</label><input id="story-slug" dir="ltr" value={form.slug} onChange={(event) => update('slug', event.target.value.toLowerCase())} placeholder="waqia-e-karbala" required /></div><div><label htmlFor="story-category">زمرہ *</label><select id="story-category" value={form.categoryId} onChange={(event) => update('categoryId', event.target.value)} required><option value="">زمرہ منتخب کریں</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.nameUr}</option>)}</select></div><div><label htmlFor="story-status">حیثیت</label><select id="story-status" value={form.status} onChange={(event) => update('status', event.target.value)}><option value="draft">مسودہ</option><option value="published">شائع شدہ</option></select></div></div><label htmlFor="story-excerpt">تعارف *</label><textarea id="story-excerpt" rows="3" maxLength="600" value={form.excerptUr} onChange={(event) => update('excerptUr', event.target.value)} required /><label htmlFor="story-content">مکمل مضمون *</label><p className="editor-help">محفوظ فارمیٹنگ: <code># عنوان</code>، <code>&gt; اقتباس</code> اور خالی سطر سے نیا پیراگراف۔ HTML شامل نہ کریں۔</p><textarea id="story-content" className="story-content-editor" rows="18" value={form.contentUr} onChange={(event) => update('contentUr', event.target.value)} required /><label htmlFor="story-notes">تاریخی نوٹس / احتیاط</label><textarea id="story-notes" rows="3" value={form.historicalNotesUr} onChange={(event) => update('historicalNotesUr', event.target.value)} /><label className="checkbox-label"><input type="checkbox" checked={form.featured} onChange={(event) => update('featured', event.target.checked)} /> نمایاں مضمون</label><label htmlFor="story-cover">سرورق تصویر (اختیاری)</label><input id="story-cover" type="file" accept="image/*" onChange={(event) => setFile(event.target.files?.[0] || null)} />{form.coverImageUrl && <img className="admin-cover-preview" src={form.coverImageUrl} alt="" />}<SourceEditor sources={sourceRows} setSources={setSourceRows} />{error && <p className="form-feedback form-error" role="alert">{error}</p>}<div className="editor-actions"><button className="button button-primary" type="submit" disabled={saving}>{saving ? 'محفوظ ہو رہا ہے…' : 'محفوظ کریں'} <Check size={15} /></button><button className="button button-outline" type="button" onClick={onCancel}>منسوخ</button></div></form>
}

export function AdminStories() {
  const [session, setSession] = useState(null); const [checking, setChecking] = useState(true); const [stories, setStories] = useState([]); const [categories, setCategories] = useState([]); const [editing, setEditing] = useState(null); const [sources, setSources] = useState([]); const [error, setError] = useState(''); const [message, setMessage] = useState('')
  async function load() { try { const [loadedStories, loadedCategories] = await Promise.all([fetchAdminStories(), fetchStoryCategories()]); setStories(loadedStories); setCategories(loadedCategories) } catch (loadError) { setError(loadError.message) } }
  useEffect(() => { if (!supabase) { setChecking(false); return undefined }; supabase.auth.getSession().then(({ data }) => { setSession(data.session); setChecking(false) }).catch((loadError) => { setError(loadError.message); setChecking(false) }); const listener = supabase.auth.onAuthStateChange((_event, next) => setSession(next)); return () => listener.data.subscription.unsubscribe() }, [])
  useEffect(() => { if (session) load() }, [session])
  async function edit(id) { try { const loaded = await fetchAdminStory(id); setEditing(loaded); setSources(loaded.sources.length ? loaded.sources : [{ ...emptySource }]) } catch (loadError) { setError(loadError.message) } }
  async function remove(story) { if (!window.confirm('کیا یہ مضمون حذف کرنا ہے؟')) return; try { await deleteStory(story.id); setStories((current) => current.filter((item) => item.id !== story.id)); setMessage('مضمون حذف کر دیا گیا۔') } catch (deleteError) { setError(deleteError.message) } }
  if (checking) return <PageFrame className="content-page"><StoryState icon={BookOpen} title="اختیار چیک ہو رہا ہے" text="براہِ کرم انتظار کریں…" /></PageFrame>
  if (!session) return <AdminLogin onSignedIn={() => supabase.auth.getSession().then(({ data }) => setSession(data.session))} />
  if (editing) return <PageFrame className="content-page admin-page"><div className="admin-heading"><Header title={editing.id ? 'مضمون میں ترمیم' : 'نیا مضمون'} description="اردو مضمون کو محفوظ، پیش منظر اور شائع کریں۔" /><button className="button button-outline" onClick={() => supabase.auth.signOut()}><LogOut size={15} /> سائن آؤٹ</button></div><StoryForm categories={categories} story={editing} sources={sources} onSaved={() => { setEditing(null); setMessage('مضمون محفوظ ہو گیا۔'); load() }} onCancel={() => setEditing(null)} /></PageFrame>
  return <PageFrame className="content-page admin-page" dir="rtl"><div className="admin-heading"><Header title="مضامین کا انتظام" description="مسودے محفوظ کریں، پیش منظر دیکھیں اور صرف تیار شدہ مواد شائع کریں۔" /><button className="button button-outline" onClick={() => supabase.auth.signOut()}><LogOut size={15} /> سائن آؤٹ</button></div>{message && <p className="form-feedback form-success">{message}</p>}{error && <p className="form-feedback form-error" role="alert">{error}</p>}<button className="button button-primary" onClick={() => { setEditing({ ...emptyStory, id: '' }); setSources([{ ...emptySource }]) }}><Plus size={15} /> نیا مضمون</button><div className="admin-story-list">{stories.map((story) => <div className="admin-story-row" key={story.id}><div><span className={`status-pill status-${story.status}`}>{story.status === 'published' ? 'شائع شدہ' : 'مسودہ'}</span><h2>{story.titleUr}</h2><small>{story.category?.nameUr} · {story.updatedAt && new Intl.DateTimeFormat('ur-PK', { dateStyle: 'medium' }).format(new Date(story.updatedAt))}</small></div><div className="admin-row-actions"><button className="icon-button" aria-label="مضمون میں ترمیم" onClick={() => edit(story.id)}><Pencil size={15} /></button><button className="icon-button danger-button" aria-label="مضمون حذف کریں" onClick={() => remove(story)}><Trash2 size={15} /></button></div></div>)}</div></PageFrame>
}
