import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft, ArrowRight, BookOpen, Check, ChevronDown, CircleHelp,
  Compass, Eye, HeartHandshake, House, Instagram, Landmark, Mail, Menu,
  MessageCircle, MessageSquareText, Search, ShieldCheck, Sparkles, Star, Target, Users, X,
} from 'lucide-react'
import { Link, NavLink, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { chapterActivities, universities } from './data/universities.js'
import { fetchApprovedReviews, submitReview } from './lib/reviews.js'

const pages = [
  { label: 'Home', to: '/', icon: House, description: 'Welcome to Rabt-e-Ahlebait' },
  { label: 'Founder', to: '/founder', icon: Users, description: 'Meet the founder of the network' },
  { label: 'Mission & Vision', to: '/mission-vision', icon: Compass, description: 'Our purpose and aspirations' },
  { label: 'Policies', to: '/policies', icon: ShieldCheck, description: 'The principles that guide us' },
  { label: 'Partner Universities', to: '/partner-universities', icon: Landmark, description: 'Explore university listings' },
  { label: 'Contact', to: '/contact', icon: MessageCircle, description: 'Get in touch with our team' },
  { label: 'Reviews & Suggestions', to: '/reviews', icon: MessageSquareText, description: 'Share feedback and suggestions' },
]

const policies = [
  { title: 'Faith & Values', icon: Sparkles, text: 'We are committed to upholding the teachings of Ahl-e-Bait (a.s.) in our thoughts, words and actions.' },
  { title: 'Unity & Respect', icon: Users, text: 'We promote mutual respect, harmony and inclusivity among all students, regardless of background.' },
  { title: 'Academic Excellence', icon: BookOpen, text: 'We encourage knowledge, self-improvement and academic growth in every member.' },
  { title: 'Social Responsibility', icon: HeartHandshake, text: 'We aim to serve society and contribute to meaningful change through community service and awareness.' },
  { title: 'Integrity & Transparency', icon: ShieldCheck, text: 'We follow fair, honest and accountable practices in all our activities.' },
]

const values = [
  { title: 'Faith', text: 'Stronger Imaan', icon: Sparkles },
  { title: 'Knowledge', text: 'Better Tomorrow', icon: BookOpen },
  { title: 'Unity', text: 'Together We Grow', icon: Users },
  { title: 'Action', text: 'For a Greater Cause', icon: HeartHandshake },
]

function Logo() {
  return (
    <Link className="brand-mark" to="/" aria-label="Rabt-e-Ahlebait home">
      <img src="/assets/rabt-e-ahlebait-logo.png" alt="Rabt-e-Ahlebait — Ahle Bait Student Network" width="768" height="768" />
    </Link>
  )
}

function SocialLinks({ compact = false }) {
  const links = [
    { name: 'Instagram', icon: Instagram, href: 'https://www.instagram.com/rabteahlebait?xtok=MXh3d3BwaG03am5mdQ%3D%3D&utm_source=qr' },
    { name: 'TikTok', icon: TikTokIcon, href: 'https://www.tiktok.com/@rabteahlebait?_r=1&_t=ZS-9AmFSVtdf76' },
  ]
  return (
    <div className={`social-links${compact ? ' social-links-compact' : ''}`}>
      {links.map(({ name, icon: Icon, href }) => <a href={href} aria-label={name} key={name} target="_blank" rel="noreferrer"><Icon size={15} /></a>)}
    </div>
  )
}

function TikTokIcon({ size = 15 }) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.09 2.71 1.57 4.24 1.71v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.95-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.07-1.07-2.01-1.27-3.32-3.6-3.23-5.96-.03-.5-.04-1-.01-1.49.17-1.79 1.05-3.51 2.42-4.67 1.56-1.34 3.74-1.98 5.77-1.61.02 1.48-.04 2.96-.04 4.44-1-.32-2.17-.23-3.04.38-.63.41-1.11 1.06-1.3 1.79-.16.39-.11.82-.1 1.23.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.67 2.77-1.62.19-.33.4-.67.41-1.06.1-1.78.06-3.57.07-5.35.01-4.01-.01-8.02.02-12.03z" /></svg>
}

function Sidebar({ open, onClose }) {
  const location = useLocation()
  const [universitiesOpen, setUniversitiesOpen] = useState(location.pathname.startsWith('/partner-universities'))
  const activePartner = location.pathname.startsWith('/partner-universities')
  const chapterLinks = [
    { label: 'UCP', to: '/partner-universities/ucp' },
    { label: 'University of Lahore', to: '/partner-universities/university-of-lahore' },
    { label: 'Punjab University', to: '/partner-universities/punjab-university' },
    { label: 'Other Universities', to: '/partner-universities/other' },
  ]

  return (
    <>
      {open && <button className="drawer-backdrop" aria-label="Close navigation" onClick={onClose} />}
      <aside className={`sidebar${open ? ' sidebar-open' : ''}`} aria-label="Main navigation">
        <div className="sidebar-top"><Logo /><button className="drawer-close" aria-label="Close menu" onClick={onClose}><X size={20} /></button></div>
        <nav className="side-nav">
          {pages.slice(0, 4).map(({ label, to, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/'} onClick={onClose} className={({ isActive }) => `side-link${isActive ? ' active' : ''}`}>
              <Icon size={16} strokeWidth={1.8} /><span>{label}</span>
            </NavLink>
          ))}
          <button className={`side-link side-expand${activePartner ? ' active' : ''}`} aria-expanded={universitiesOpen} onClick={() => setUniversitiesOpen(!universitiesOpen)}>
            <Landmark size={16} strokeWidth={1.8} /><span>Partner Universities</span><ChevronDown className={universitiesOpen ? 'chevron-open' : ''} size={14} />
          </button>
          {universitiesOpen && <div className="side-submenu">
            <NavLink to="/partner-universities" onClick={onClose} className={({ isActive }) => `side-sublink${isActive ? ' active' : ''}`}>All Universities</NavLink>
            {chapterLinks.map((item) => <NavLink key={item.to} to={item.to} onClick={onClose} className={({ isActive }) => `side-sublink${isActive ? ' active' : ''}`}>{item.label}</NavLink>)}
          </div>}
          <NavLink to="/contact" onClick={onClose} className={({ isActive }) => `side-link${isActive ? ' active' : ''}`}>
            <MessageCircle size={16} strokeWidth={1.8} /><span>Contact</span>
          </NavLink>
          <NavLink to="/reviews" onClick={onClose} className={({ isActive }) => `side-link${isActive ? ' active' : ''}`}>
            <MessageSquareText size={16} strokeWidth={1.8} /><span>Reviews & Suggestions</span>
          </NavLink>
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-ornament" aria-hidden="true">عشقِ اہلِ بیت</div>
          <p>Faith <i /> Knowledge <i /> Unity <i /> Action</p>
          <SocialLinks compact />
        </div>
      </aside>
    </>
  )
}

function Topbar({ onMenu }) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const matches = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return []
    return [
      ...pages.filter((page) => `${page.label} ${page.description}`.toLowerCase().includes(normalized)).map((page) => ({ ...page, type: 'Page' })),
      ...universities.filter((university) => university.name.toLowerCase().includes(normalized)).map((university) => ({ label: university.name, to: university.path, description: university.location, type: 'University' })),
    ].slice(0, 6)
  }, [query])

  function chooseResult(path) {
    navigate(path)
    setQuery('')
    setSearchOpen(false)
  }

  return (
    <header className="topbar">
      <button className="mobile-menu-button" aria-label="Open navigation" onClick={onMenu}><Menu size={22} /></button>
      <div className="topbar-quote">FAITH <span>·</span> KNOWLEDGE <span>·</span> UNITY <span>·</span> ACTION</div>
      <nav className="top-links" aria-label="Quick navigation">
        {pages.map((page) =>
          <NavLink key={page.to} to={page.to} end={page.to === '/'}>{page.label}</NavLink>)}
      </nav>
      <div className="search-wrap">
        <button className={`search-toggle${searchOpen ? ' selected' : ''}`} aria-label="Search pages and universities" aria-expanded={searchOpen} onClick={() => { setSearchOpen(!searchOpen); setQuery('') }}>
          {searchOpen ? <X size={17} /> : <Search size={17} />}
        </button>
        {searchOpen && <div className="search-panel">
          <label htmlFor="site-search">Search the network</label>
          <div className="search-input-wrap"><Search size={16} /><input id="site-search" autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Pages, universities..." /></div>
          {query.trim() && <div className="search-results">
            {matches.length ? matches.map((result, index) => <button key={`${result.to}-${result.label}-${index}`} onClick={() => chooseResult(result.to)}><span><small>{result.type}</small>{result.label}</span><ArrowRight size={15} /></button>) : <p>No matching pages or universities.</p>}
          </div>}
        </div>}
      </div>
    </header>
  )
}

function Breadcrumbs({ items }) {
  return <nav className="breadcrumbs" aria-label="Breadcrumb"><Link to="/">Home</Link>{items.map((item, index) => <span key={`${item.label}-${index}`} className="breadcrumb-part"><span className="breadcrumb-separator">›</span>{item.to ? <Link to={item.to}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}</span>)}</nav>
}

function PageHeader({ eyebrow, title, description, breadcrumb = [] }) {
  return <div className="page-heading">
    <Breadcrumbs items={breadcrumb.length ? breadcrumb : [{ label: title }]} />
    {eyebrow && <span className="eyebrow">{eyebrow}</span>}
    <h1>{title}</h1><span className="gold-rule" />
    {description && <p>{description}</p>}
  </div>
}

function PageFrame({ children, className = '' }) {
  return <main className={`page-main ${className}`}>{children}<Footer /></main>
}

function Footer() {
  return <footer className="site-footer"><span>© {new Date().getFullYear()} Rabt-e-Ahlebait</span><span>Faith <i /> Knowledge <i /> Unity <i /> Action</span><Link to="/contact">Connect with us <ArrowRight size={13} /></Link></footer>
}

function Home() {
  return <PageFrame className="home-page">
    <section className="hero">
      <div className="hero-copy">
        <span className="eyebrow">FAITH <b>|</b> KNOWLEDGE <b>|</b> UNITY <b>|</b> ACTION</span>
        <h1>Rabt-e-Ahlebait</h1>
        <p className="hero-subtitle">AHLE BAIT STUDENT NETWORK</p>
        <span className="gold-rule" />
        <p className="hero-description">Uniting students for a stronger faith, deeper knowledge and a greater impact — inspired by the teachings of Ahl-e-Bait (a.s.).</p>
        <div className="hero-actions"><Link className="button button-primary" to="/mission-vision">Explore Our Journey <ArrowRight size={15} /></Link><Link className="button button-outline" to="/contact">Join Our Network</Link></div>
      </div>
      <div className="hero-image">
        <img
          src="/assets/hero-rabt-ahlebait.jpeg"
          alt="Students looking toward the golden shrine dome and red Ya Hussain flag at sunset"
          width="1365"
          height="768"
          loading="eager"
          fetchpriority="high"
        />
      </div>
    </section>
    <section className="values-strip" aria-label="Our values">{values.map(({ title, text, icon: Icon }) => <article className="value-card" key={title}><Icon size={21} strokeWidth={1.7} /><h2>{title}</h2><p>{text}</p></article>)}</section>
    <section className="home-intro">
      <div><span className="eyebrow">A COMMUNITY WITH PURPOSE</span><h2>Rooted in faith.<br /><em>Growing together.</em></h2></div>
      <div className="home-intro-copy"><p>Rabt-e-Ahlebait brings students together to learn, support one another and serve their communities — guided by the values of Ahl-e-Bait (a.s.).</p><Link className="text-link" to="/partner-universities">Explore university listings <ArrowRight size={16} /></Link></div>
    </section>
    <section className="home-campus-banner"><div className="banner-symbol"><Landmark size={24} /></div><div><span className="eyebrow">CAMPUS CONNECTIONS</span><h2>Many campuses. One shared purpose.</h2><p>Find a university listing and discover ways to connect with the student network.</p></div><Link to="/partner-universities" className="button button-light">Meet the campuses <ArrowRight size={15} /></Link></section>
  </PageFrame>
}

function Founder() {
  return <PageFrame className="content-page">
    <PageHeader title="Our Founder" />
    <section className="founder-profile">
      <div className="portrait-frame"><img className="founder-portrait" src="/assets/founder-portrait.jpeg" alt="Portrait of Rabt-e-Ahlebait founder Shazim Haider" width="768" height="1365" /></div>
      <div className="founder-bio"><span className="eyebrow">THE PERSON BEHIND THE VISION</span><h2>Shazim Haider</h2><p className="founder-role">Founder – Rabt-e-Ahlebait</p><p>A dedicated student, visionary and a true follower of the teachings of Ahl-e-Bait (a.s.), the founder of Rabt-e-Ahlebait envisioned a platform where students could unite under the banner of faith, knowledge and service to humanity.</p></div>
    </section>
    <blockquote className="quote-card"><span>“</span><p>The purpose of life is not just to achieve personal success, but to be a cause of goodness for others.</p><cite>— Shazim Haider</cite></blockquote>
    <section className="contributions"><div className="section-heading"><span className="eyebrow">A LASTING FOUNDATION</span><h2>Key Contributions</h2><span className="gold-rule" /></div><div className="contribution-list">{['Established the vision and foundation of Rabt-e-Ahlebait.', 'Inspired students to stay connected with their faith.', 'Laid the groundwork for a united student network.'].map((item) => <p key={item}><span><Check size={13} /></span>{item}</p>)}</div></section>
  </PageFrame>
}

function MissionVision() {
  const cards = [
    { title: 'Our Mission', icon: Target, text: 'To build a strong, united and value-driven student community that nurtures faith, spreads the teachings of Ahl-e-Bait (a.s.), and empowers students to create positive change in society.' },
    { title: 'Our Vision', icon: Eye, text: 'To be a leading student network that inspires generations with faith, knowledge and action — working for a just, compassionate and progressive society in line with the teachings of Ahl-e-Bait (a.s.).' },
  ]
  return <PageFrame className="content-page mission-page">
    <PageHeader title="Our Mission & Vision" description="A shared direction for a community built on faith, knowledge and meaningful action." />
    <section className="mission-grid">{cards.map(({ title, text, icon: Icon }, index) => <article className="mission-card" key={title}><div className="mission-icon"><Icon size={24} /></div><span className="mission-index">0{index + 1}</span><h2>{title}</h2><span className="gold-rule" /><p>{text}</p></article>)}</section>
    <div className="arch-footer"><div className="arch-line" /><p>عشقِ اہلِ بیت <span>—</span> Inspired by timeless values</p><div className="arch-line" /></div>
  </PageFrame>
}

function Policies() {
  return <PageFrame className="content-page">
    <PageHeader title="Our Policies" description="Rabt-e-Ahlebait operates with a clear set of principles and policies to ensure transparency, discipline and positive impact." />
    <section className="policy-list">{policies.map(({ title, text, icon: Icon }, index) => <article className="policy-card" key={title}><div className="policy-icon"><Icon size={21} /></div><span className="policy-number">0{index + 1}</span><div><h2>{title}</h2><p>{text}</p></div><ArrowRight className="policy-arrow" size={17} /></article>)}</section>
  </PageFrame>
}

function UniversityCard({ university }) {
  return <Link className="university-card" to={university.path}>
    <div className="university-emblem" aria-label={`${university.shortName} logo placeholder`}>{university.logo}</div>
    <span className="university-location">{university.location}</span><h2>{university.name}</h2>
    <span className="university-visit">View listing <ArrowRight size={14} /></span>
  </Link>
}

function PartnerUniversities() {
  return <PageFrame className="content-page">
    <PageHeader title="Our Partner Universities" description="Rabt-e-Ahlebait is proud to list universities across Pakistan as places to build a stronger student network and create opportunities for learning, service and community development." />
    <p className="listing-disclaimer"><CircleHelp size={16} /> These are configurable university listings, not a claim of official affiliation or partnership.</p>
    <section className="university-grid">{universities.map((university) => <UniversityCard key={university.name} university={university} />)}</section>
  </PageFrame>
}

function UniversityDetail() {
  const { slug } = useParams()
  const university = universities.find((item) => item.path.split('/').pop() === slug && item.path !== '/partner-universities/other')
  if (!university) return <NotFound />
  return <PageFrame className="content-page detail-page">
    <PageHeader title={university.name} breadcrumb={[{ label: 'Partner Universities', to: '/partner-universities' }, { label: university.shortName }]} />
    <section className="chapter-layout">
      <div className="chapter-photo" style={{ backgroundImage: `url("${university.image}")` }} role="img" aria-label={`University campus at ${university.name}`}><span className="photo-tag"><Landmark size={14} /> {university.location}</span></div>
      <div className="chapter-copy"><span className="eyebrow">CAMPUS CHAPTER</span><p>{university.description} The chapter aims to nurture a welcoming environment where students can grow in faith, knowledge and service.</p>
        <div className="activities-card"><h2>Key Activities</h2>{chapterActivities.map((activity) => <p key={activity}><Check size={15} />{activity}</p>)}</div>
        <a className="button button-primary external-button" href={university.externalUrl} target="_blank" rel="noreferrer">Visit University Page <ArrowRight size={15} /></a>
      </div>
    </section>
  </PageFrame>
}

function OtherUniversities() {
  const otherListings = universities.filter((university) => ![
    '/partner-universities/ucp',
    '/partner-universities/university-of-lahore',
    '/partner-universities/punjab-university',
    '/partner-universities/other',
  ].includes(university.path))
  return <PageFrame className="content-page">
    <PageHeader title="Other Universities" breadcrumb={[{ label: 'Partner Universities', to: '/partner-universities' }, { label: 'Other Universities' }]} description="Explore additional campuses and university listings. Information can be updated as local chapters and contacts are confirmed." />
    <section className="university-grid">{otherListings.map((university) => <UniversityCard key={university.name} university={university} />)}</section>
  </PageFrame>
}

function Contact() {
  const [submitted, setSubmitted] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError('Please complete all fields before submitting.')
      setSubmitted(false)
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.')
      setSubmitted(false)
      return
    }
    setError('')
    setSubmitted(true)
  }

  return <PageFrame className="content-page contact-page">
    <PageHeader title="Get In Touch" description="We'd love to hear from you! Whether you have a question, partnership inquiry or just want to connect — feel free to reach out." />
    <section className="contact-layout">
      <div className="contact-details"><span className="eyebrow">LET'S CONNECT</span><h2>We'd be glad<br />to hear from you.</h2>
        <div className="contact-detail"><span><Mail size={17} /></span><div><small>Email</small><a href="mailto:rabteahlebait@gmail.com">rabteahlebait@gmail.com</a></div></div>
        <div className="contact-detail"><span><MessageCircle size={17} /></span><div><small>Phone</small><a href="tel:+9647820036616">+964 782 003 6616</a></div></div>
        <div className="contact-detail"><span><Landmark size={17} /></span><div><small>Address</small><p>Rabt-e-Ahlebait Headquarters<br />Lahore, Pakistan</p></div></div>
        <div className="contact-social"><small>Follow our journey</small><SocialLinks /></div>
      </div>
      <form className="contact-form" onSubmit={handleSubmit} noValidate>
        <h2>Send us a message</h2><p>Fields marked with * are required.</p>
        <label htmlFor="contact-name">Name <span>*</span></label><input id="contact-name" name="name" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} required placeholder="Your name" />
        <label htmlFor="contact-email">Email <span>*</span></label><input id="contact-email" name="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="you@example.com" />
        <label htmlFor="contact-message">Message <span>*</span></label><textarea id="contact-message" name="message" rows="5" value={message} onChange={(event) => setMessage(event.target.value)} required placeholder="How can we help?" />
        {error && <p className="form-feedback form-error" role="alert">{error}</p>}
        {submitted && <p className="form-feedback form-success" role="status">Thank you, {name.trim()}. Your message is ready for the Rabt-e-Ahlebait team. This frontend demo has not sent or stored it.</p>}
        <button className="button button-primary form-submit" type="submit">Send Message <ArrowRight size={15} /></button>
        {/* A real email delivery service can be connected here when an approved endpoint is available. */}
      </form>
    </section>
  </PageFrame>
}

function Reviews() {
  const pageSize = 6
  const [entries, setEntries] = useState([])
  const [total, setTotal] = useState(0)
  const [average, setAverage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [serviceError, setServiceError] = useState('')
  const [rating, setRating] = useState('5')
  const [name, setName] = useState('')
  const [review, setReview] = useState('')
  const [suggestions, setSuggestions] = useState('')
  const [formMessage, setFormMessage] = useState(null)

  useEffect(() => {
    let cancelled = false
    fetchApprovedReviews(0, pageSize)
      .then((result) => {
        if (cancelled) return
        setEntries(result.reviews)
        setTotal(result.total)
        setAverage(result.average)
      })
      .catch((error) => !cancelled && setServiceError(error.message))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [])

  function handleSubmit(event) {
    event.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setFormMessage(null)
    submitReview({
      name,
      rating,
      review,
      suggestion: suggestions,
    }).then(() => {
      setName('')
      setReview('')
      setSuggestions('')
      setFormMessage({ type: 'success', text: 'Thank you. Your review is now visible publicly.' })
    }).catch((error) => setFormMessage({ type: 'error', text: error.message }))
      .finally(() => setSubmitting(false))
  }

  return <PageFrame className="content-page reviews-page">
    <PageHeader title="Reviews & Suggestions" description="Share feedback about Rabt-e-Ahlebait or suggest how we can improve the student network." />
    <section className="reviews-layout">
      <form className="contact-form review-form" onSubmit={handleSubmit} noValidate>
        <h2>Share your feedback</h2>
        <label htmlFor="feedback-name">Name <span>*</span></label>
        <input id="feedback-name" autoComplete="name" maxLength="100" value={name} onChange={(event) => setName(event.target.value)} required placeholder="Your name" />
        <label htmlFor="feedback-rating">Star rating <span>*</span></label>
        <select id="feedback-rating" value={rating} onChange={(event) => setRating(event.target.value)} required>{[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} {value === 1 ? 'star' : 'stars'}</option>)}</select>
        <label htmlFor="feedback-review">Review <span>*</span></label>
        <textarea id="feedback-review" rows="5" maxLength="2000" required value={review} onChange={(event) => setReview(event.target.value)} placeholder="Write your review..." />
        <label htmlFor="feedback-suggestions">Suggestions <span>(optional)</span></label>
        <textarea id="feedback-suggestions" rows="3" maxLength="2000" value={suggestions} onChange={(event) => setSuggestions(event.target.value)} placeholder="How can we improve?" />
        {formMessage && <p className={`form-feedback form-${formMessage.type}`} role={formMessage.type === 'error' ? 'alert' : 'status'}>{formMessage.text}</p>}
        <button className="button button-primary form-submit" type="submit" disabled={submitting}>{submitting ? 'Submitting…' : 'Submit for review'} <ArrowRight size={15} /></button>
      </form>
      <section className="review-list" aria-labelledby="review-list-title">
        <div className="review-list-heading"><div><span className="eyebrow">COMMUNITY FEEDBACK</span><h2 id="review-list-title">Approved reviews</h2></div><span className="review-count">{total}</span></div>
        {average > 0 && <div className="review-summary"><strong>{average.toFixed(1)}</strong><span className="review-rating" aria-label={`${average.toFixed(1)} out of 5 average rating`}>{[1, 2, 3, 4, 5].map((value) => <Star key={value} size={15} fill={value <= Math.round(average) ? 'currentColor' : 'none'} />)}</span><span>Average from {total} approved {total === 1 ? 'review' : 'reviews'}</span></div>}
        {loading && <div className="reviews-empty"><p>Loading approved reviews…</p></div>}
        {!loading && serviceError && <div className="reviews-empty"><CircleHelp size={24} /><h3>Reviews are unavailable</h3><p>{serviceError}</p></div>}
        {!loading && !serviceError && entries.length === 0 && <div className="reviews-empty"><MessageSquareText size={24} /><h3>No approved reviews yet</h3><p>Approved community feedback will appear here.</p></div>}
        {!loading && !serviceError && entries.length > 0 && <div className="review-items">{entries.map((entry) => <article className="review-item" key={entry.id}>
          <div className="review-item-meta"><span className="review-rating" aria-label={`${entry.rating} out of 5 stars`}>{Array.from({ length: 5 }, (_, index) => <Star key={index} size={13} fill={index < entry.rating ? 'currentColor' : 'none'} />)}<span>{entry.rating}/5</span></span></div>
          <p>{entry.review}</p>
          {entry.suggestions && <p className="review-suggestion"><strong>Suggestion:</strong> {entry.suggestions}</p>}
          <div className="review-item-footer"><strong>{entry.name}</strong><time dateTime={entry.date}>{new Date(entry.date).toLocaleDateString()}</time></div>
        </article>)}</div>}
        {!loading && !serviceError && entries.length < total && <button className="button button-outline load-more" disabled={loadingMore} onClick={() => {
          setLoadingMore(true)
          fetchApprovedReviews(entries.length, pageSize).then((result) => {
            setEntries((current) => [...current, ...result.reviews])
            setTotal(result.total)
            setAverage(result.average)
          }).catch((error) => setServiceError(error.message)).finally(() => setLoadingMore(false))
        }}>{loadingMore ? 'Loading…' : 'Load more reviews'} <ArrowRight size={15} /></button>}
      </section>
    </section>
  </PageFrame>
}

function NotFound() {
  return <PageFrame className="content-page not-found"><span className="eyebrow">404 · PAGE NOT FOUND</span><h1>This page has wandered.</h1><p>The page you're looking for doesn't seem to be here.</p><Link className="button button-primary" to="/">Return home <ArrowLeft size={15} /></Link></PageFrame>
}

const metadata = {
  '/': ['Rabt-e-Ahlebait | Ahle Bait Student Network', 'Uniting students through faith, knowledge, unity and action.'],
  '/founder': ['Our Founder | Rabt-e-Ahlebait', 'Learn about the vision and foundation of Rabt-e-Ahlebait.'],
  '/mission-vision': ['Mission & Vision | Rabt-e-Ahlebait', 'Discover the mission and vision that guide Rabt-e-Ahlebait.'],
  '/policies': ['Our Policies | Rabt-e-Ahlebait', 'The values and principles that guide the Rabt-e-Ahlebait student network.'],
  '/partner-universities': ['University Listings | Rabt-e-Ahlebait', 'Explore configurable university listings across Pakistan.'],
  '/partner-universities/other': ['Other Universities | Rabt-e-Ahlebait', 'Explore additional campus listings.'],
  '/contact': ['Contact | Rabt-e-Ahlebait', 'Get in touch with the Rabt-e-Ahlebait student network.'],
  '/reviews': ['Reviews & Suggestions | Rabt-e-Ahlebait', 'Share a review or suggestion for the Rabt-e-Ahlebait student network.'],
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
    setMenuOpen(false)
    const chapter = universities.find((item) => item.path === location.pathname && item.path !== '/partner-universities/other')
    const [title, description] = metadata[location.pathname] ?? (chapter ? [`${chapter.name} | Rabt-e-Ahlebait`, `Student chapter listing at ${chapter.name}.`] : ['Page Not Found | Rabt-e-Ahlebait', 'The requested page could not be found.'])
    document.title = title
    const meta = document.querySelector('meta[name="description"]')
    if (meta) meta.setAttribute('content', description)
  }, [location.pathname])

  return <div className="app-shell">
    <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
    <div className="content-shell"><Topbar onMenu={() => setMenuOpen(true)} /><Routes>
      <Route path="/" element={<Home />} />
      <Route path="/founder" element={<Founder />} />
      <Route path="/mission-vision" element={<MissionVision />} />
      <Route path="/policies" element={<Policies />} />
      <Route path="/partner-universities" element={<PartnerUniversities />} />
      <Route path="/partner-universities/other" element={<OtherUniversities />} />
      <Route path="/partner-universities/:slug" element={<UniversityDetail />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/reviews" element={<Reviews />} />
      <Route path="*" element={<NotFound />} />
    </Routes></div>
  </div>
}

export default App
