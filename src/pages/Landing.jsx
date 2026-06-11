import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Star, MapPin, MessageCircle, Smartphone,
  ChevronRight, Briefcase, Users, Menu, X,
  ArrowRight, CheckCircle
} from 'lucide-react'
import { CATEGORIES } from '../constants/categories'

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-outline-variant">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-1">
            <span className="text-2xl font-bold" style={{ color: '#00236f' }}>GigGle</span>
            <span className="text-xl" style={{ color: '#ef9900' }}>✦</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/login" className="btn-ghost text-sm">Login</Link>
            <Link to="/register" className="btn-primary text-sm">Get Started</Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-surface-low transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={22} color="#00236f" /> : <Menu size={22} color="#00236f" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="md:hidden border-t border-outline-variant bg-white px-4 py-4 flex flex-col gap-3">
          <Link to="/login" className="btn-ghost w-full text-sm" onClick={() => setMenuOpen(false)}>Login</Link>
          <Link to="/register" className="btn-primary w-full text-sm" onClick={() => setMenuOpen(false)}>Get Started</Link>
        </div>
      )}
    </nav>
  )
}

function SampleJobCard() {
  return (
    <div className="bg-white border border-outline-variant rounded-xl shadow-card-hover p-5 w-72">
      <div className="flex items-start justify-between mb-3">
        <span className="badge-green text-xs">🧹 Cleaning</span>
        <span className="text-xs text-on-surface-variant">2.4 km away</span>
      </div>
      <h3 className="font-semibold text-on-surface text-base mb-1">House Cleaning — 3BR Apartment</h3>
      <p className="text-sm text-on-surface-variant mb-3">Bonanjo, Douala · Sat 8 AM – 1 PM</p>
      <div className="flex items-center justify-between">
        <span className="text-lg font-bold" style={{ color: '#ef9900' }}>15,000 XAF</span>
        <div className="flex items-center gap-1">
          <Star size={14} fill="#ef9900" color="#ef9900" />
          <span className="text-sm font-medium text-on-surface">4.9</span>
          <span className="text-xs text-on-surface-variant">(47)</span>
        </div>
      </div>
      <button className="btn-primary w-full mt-4 text-sm">Apply Now</button>
    </div>
  )
}

function HeroSection() {
  return (
    <section className="bg-white overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="flex flex-col md:flex-row items-center gap-12">
          {/* Left: text */}
          <div className="flex-1 text-center md:text-left">
            {/* Gradient label */}
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-6"
              style={{ background: '#e5eeff', color: '#00236f' }}>
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: '#006c4e' }}></span>
              Cameroon's #1 Gig Marketplace
            </span>

            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6" style={{ color: '#0b1c30' }}>
              Find{' '}
              <span style={{ color: '#00236f' }}>Trusted Help.</span>
              <br />
              Get Hired Today.
            </h1>

            <p className="text-base md:text-lg leading-relaxed mb-8 max-w-xl" style={{ color: '#444651' }}>
              Cameroon's gig marketplace connecting reliable workers with people who need help — powered by verified ratings, location matching, and mobile money.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start mb-8">
              <Link to="/register" className="btn-primary gap-2 text-base">
                Find Work <ArrowRight size={18} />
              </Link>
              <Link to="/register" className="btn-secondary text-base">
                Post a Job
              </Link>
            </div>

            {/* Trust stats */}
            <div className="flex flex-wrap gap-4 justify-center md:justify-start text-sm" style={{ color: '#444651' }}>
              <span className="flex items-center gap-1">
                <CheckCircle size={15} style={{ color: '#006c4e' }} />
                <strong style={{ color: '#0b1c30' }}>500+</strong> Workers
              </span>
              <span className="text-outline hidden sm:inline">·</span>
              <span className="flex items-center gap-1">
                <CheckCircle size={15} style={{ color: '#006c4e' }} />
                <strong style={{ color: '#0b1c30' }}>200+</strong> Jobs Posted
              </span>
              <span className="text-outline hidden sm:inline">·</span>
              <span className="flex items-center gap-1">
                <Star size={15} fill="#ef9900" color="#ef9900" />
                <strong style={{ color: '#0b1c30' }}>4.8★</strong> Avg Rating
              </span>
            </div>
          </div>

          {/* Right: decorative card */}
          <div className="flex-shrink-0 hidden md:flex items-center justify-center">
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-full h-full rounded-xl"
                style={{ background: 'linear-gradient(135deg, #e5eeff 0%, #97f5cc 100%)', transform: 'rotate(-3deg)' }} />
              <div className="relative z-10">
                <SampleJobCard />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function HowItWorksSection() {
  const workerSteps = [
    { n: '1', icon: '👤', title: 'Create Your Profile', desc: 'Set up your profile, add your skills, and share your location to get started.' },
    { n: '2', icon: '🔍', title: 'Browse Nearby Jobs', desc: 'Filter jobs by category, distance, and pay. Find opportunities right in your area.' },
    { n: '3', icon: '💰', title: 'Get Hired & Paid', desc: 'Apply, get hired, do great work, and receive payment via MTN MoMo or Orange Money.' },
  ]
  const employerSteps = [
    { n: '1', icon: '📝', title: 'Post Your Job', desc: 'Describe the task, set your location and budget, and go live in minutes.' },
    { n: '2', icon: '⭐', title: 'Review & Choose', desc: 'Browse worker profiles with verified ratings and pick the best match for your needs.' },
    { n: '3', icon: '✅', title: 'Hire & Confirm', desc: 'Select your worker, coordinate via chat, and confirm payment when the job is done.' },
  ]

  return (
    <section className="py-16 md:py-24" style={{ background: '#f8f9ff' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-3" style={{ color: '#00236f' }}>How GigGle Works</h2>
          <p className="text-base" style={{ color: '#444651' }}>Simple steps to get started — whether you're looking for work or looking to hire.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* For Workers */}
          <div className="bg-white border border-outline-variant rounded-xl shadow-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: '#e5eeff' }}>
                <Briefcase size={20} color="#00236f" />
              </div>
              <h3 className="text-lg font-semibold" style={{ color: '#0b1c30' }}>For Workers</h3>
            </div>
            <div className="space-y-5">
              {workerSteps.map((step) => (
                <div key={step.n} className="flex gap-4">
                  <div className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-base font-bold"
                    style={{ background: '#ef9900', color: '#fff' }}>
                    {step.n}
                  </div>
                  <div>
                    <p className="font-semibold text-sm mb-1" style={{ color: '#0b1c30' }}>{step.icon} {step.title}</p>
                    <p className="text-sm" style={{ color: '#444651' }}>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link to="/register" className="btn-primary w-full mt-6 text-sm">Start as Worker</Link>
          </div>

          {/* For Employers */}
          <div className="bg-white border border-outline-variant rounded-xl shadow-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: '#e5eeff' }}>
                <Users size={20} color="#00236f" />
              </div>
              <h3 className="text-lg font-semibold" style={{ color: '#0b1c30' }}>For Employers</h3>
            </div>
            <div className="space-y-5">
              {employerSteps.map((step) => (
                <div key={step.n} className="flex gap-4">
                  <div className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-base font-bold"
                    style={{ background: '#00236f', color: '#fff' }}>
                    {step.n}
                  </div>
                  <div>
                    <p className="font-semibold text-sm mb-1" style={{ color: '#0b1c30' }}>{step.icon} {step.title}</p>
                    <p className="text-sm" style={{ color: '#444651' }}>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link to="/register" className="btn-secondary w-full mt-6 text-sm">Post a Job</Link>
          </div>
        </div>
      </div>
    </section>
  )
}

function CategoriesSection() {
  const displayCategories = CATEGORIES.filter(c => c.value !== 'other')

  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold mb-3" style={{ color: '#0b1c30' }}>Browse by Category</h2>
          <p className="text-base" style={{ color: '#444651' }}>Find work or hire help across all kinds of tasks.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {displayCategories.map((cat) => (
            <Link
              key={cat.value}
              to="/register"
              className="flex flex-col items-center gap-2 p-4 bg-white border border-outline-variant rounded-xl shadow-card
                         hover:border-orange hover:shadow-card-hover transition-all duration-200 group"
            >
              <span className="text-2xl">{cat.emoji}</span>
              <span className="text-sm font-medium text-center" style={{ color: '#0b1c30' }}>{cat.label}</span>
            </Link>
          ))}
          {/* Other chip */}
          <Link
            to="/register"
            className="flex flex-col items-center gap-2 p-4 bg-white border border-outline-variant rounded-xl shadow-card
                       hover:border-orange hover:shadow-card-hover transition-all duration-200"
          >
            <span className="text-2xl">💼</span>
            <span className="text-sm font-medium text-center" style={{ color: '#0b1c30' }}>Other</span>
          </Link>
        </div>
      </div>
    </section>
  )
}

function WhyGigGleSection() {
  const features = [
    {
      icon: <Star size={22} color="#00236f" />,
      iconBg: '#e5eeff',
      title: 'Verified Reputation',
      desc: 'Every worker builds a permanent rating record. Know who you\'re hiring before you commit.',
    },
    {
      icon: <MapPin size={22} color="#006c4e" />,
      iconBg: '#97f5cc',
      title: 'Jobs Near You',
      desc: 'Radius-based filtering shows only jobs within your chosen distance. No irrelevant listings.',
    },
    {
      icon: <MessageCircle size={22} color="#ef9900" />,
      iconBg: '#fff3cd',
      title: 'Real-Time Messaging',
      desc: 'Once matched, communicate directly in a private job-scoped chat. No WhatsApp needed.',
    },
    {
      icon: <Smartphone size={22} color="#006c4e" />,
      iconBg: '#97f5cc',
      title: 'Mobile Money Payments',
      desc: 'Coordinate MTN MoMo and Orange Money payments with a reference code trail. No bank account needed.',
    },
  ]

  return (
    <section className="py-16 md:py-24" style={{ background: '#f8f9ff' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-3" style={{ color: '#0b1c30' }}>Why GigGle?</h2>
          <p className="text-base" style={{ color: '#444651' }}>Built for Cameroon's realities — fast, trusted, and mobile-first.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {features.map((f, i) => (
            <div key={i} className="bg-white border border-outline-variant rounded-xl shadow-card p-6 flex gap-5 hover:shadow-card-hover transition-shadow">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: f.iconBg }}>
                {f.icon}
              </div>
              <div>
                <h3 className="font-semibold text-base mb-2" style={{ color: '#0b1c30' }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#444651' }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CTASection() {
  return (
    <section className="py-16 md:py-24" style={{ background: '#00236f' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Ready to get started?</h2>
        <p className="text-base mb-10" style={{ color: '#b6c4ff' }}>
          Join Cameroon's growing gig economy platform.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/register"
            className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-lg font-semibold min-h-[48px] transition-all duration-150 active:scale-95"
            style={{ background: '#ef9900', color: '#fff' }}>
            Register as Worker <ArrowRight size={18} />
          </Link>
          <Link to="/register"
            className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-lg font-semibold min-h-[48px] transition-all duration-150 active:scale-95 border-2"
            style={{ borderColor: '#fff', color: '#fff' }}>
            Post a Job
          </Link>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer style={{ background: '#0b1c30' }} className="text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Column 1: Logo + tagline */}
          <div>
            <div className="flex items-center gap-1 mb-3">
              <span className="text-xl font-bold text-white">GigGle</span>
              <span style={{ color: '#ef9900' }}>✦</span>
            </div>
            <p className="text-sm" style={{ color: '#b6c4ff' }}>
              Cameroon's trusted gig labor marketplace. Find work or hire help — quickly, safely, locally.
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm">Quick Links</h4>
            <ul className="space-y-2">
              {['Home', 'How it Works', 'Login', 'Register'].map((link) => (
                <li key={link}>
                  <Link
                    to={link === 'Home' ? '/' : link === 'Login' ? '/login' : link === 'Register' ? '/register' : '/'}
                    className="text-sm hover:text-white transition-colors"
                    style={{ color: '#b6c4ff' }}
                  >
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Contact */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm">Contact</h4>
            <p className="text-sm mb-2" style={{ color: '#b6c4ff' }}>
              <a href="mailto:hello@gigle.cm" className="hover:text-white transition-colors">
                hello@gigle.cm
              </a>
            </p>
            <p className="text-sm" style={{ color: '#b6c4ff' }}>Douala, Cameroon</p>
          </div>
        </div>

        <div className="border-t pt-6" style={{ borderColor: '#1e3a8a' }}>
          <p className="text-sm text-center" style={{ color: '#b6c4ff' }}>
            © 2026 GigGle · Made in Cameroon 🇨🇲
          </p>
        </div>
      </div>
    </footer>
  )
}

export default function Landing() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <HowItWorksSection />
      <CategoriesSection />
      <WhyGigGleSection />
      <CTASection />
      <Footer />
    </div>
  )
}
