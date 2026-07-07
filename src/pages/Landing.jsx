import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldCheck, MapPin, MessageSquare, Smartphone,
  ChevronRight, Briefcase, Users, Menu, X,
  ArrowRight, TrendingUp, Star, Zap, User,
} from 'lucide-react'
import { CATEGORIES } from '../constants/categories'

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  const navLinks = [
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Categories', href: '#categories' },
    { label: 'Why GigGle', href: '#why-giggle' },
  ]

  return (
    <nav
      className="sticky top-0 z-50 border-b"
      style={{
        background: 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(16px)',
        borderColor: '#e4e4ef',
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #00236f, #002f8a)' }}>
              <Zap size={15} fill="#ef9900" color="#ef9900" />
            </div>
            <span className="text-lg font-bold" style={{ color: '#00236f' }}>GigGle</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <div className="flex items-center gap-6">
              {navLinks.map(({ label, href }) => (
                <a
                  key={href}
                  href={href}
                  className="text-sm font-medium transition-colors hover:text-primary"
                  style={{ color: '#444651' }}
                >
                  {label}
                </a>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Link to="/login" className="btn-ghost text-sm px-4 py-2 min-h-0 h-9">Login</Link>
              <Link to="/register" className="btn-primary text-sm px-4 py-2 min-h-0 h-9">
                Get Started <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          <button
            className="md:hidden p-2 rounded-xl hover:bg-surface-low transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={20} color="#00236f" /> : <Menu size={20} color="#00236f" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t bg-white px-4 py-4 flex flex-col gap-2"
          style={{ borderColor: '#e4e4ef' }}>
          <Link to="/login" onClick={() => setMenuOpen(false)} className="btn-ghost w-full text-sm">Login</Link>
          <Link to="/register" onClick={() => setMenuOpen(false)} className="btn-primary w-full text-sm">Get Started</Link>
        </div>
      )}
    </nav>
  )
}

function SampleJobCard() {
  return (
    <div className="bg-white rounded-2xl shadow-elevated p-5 w-72 border border-outline-variant/60">
      <div className="flex items-start justify-between mb-3">
        <span className="badge-green text-xs">🧹 Cleaning</span>
        <span className="text-xs flex items-center gap-1" style={{ color: '#888' }}>
          <MapPin size={10} /> 2.4 km
        </span>
      </div>
      <h3 className="font-semibold text-base mb-1 leading-snug" style={{ color: '#0b1c30' }}>
        House Cleaning — 3BR Apartment
      </h3>
      <p className="text-sm mb-4" style={{ color: '#888' }}>Bonanjo, Douala · Sat 8 AM – 1 PM</p>
      <div className="flex items-center justify-between mb-4">
        <span className="text-lg font-bold" style={{ color: '#ef9900' }}>15,000 XAF</span>
        <div className="flex items-center gap-1">
          <Star size={13} fill="#ef9900" color="#ef9900" />
          <span className="text-sm font-semibold" style={{ color: '#0b1c30' }}>4.9</span>
          <span className="text-xs" style={{ color: '#888' }}>(47)</span>
        </div>
      </div>
      <div className="h-9 rounded-xl flex items-center justify-center text-sm font-semibold text-white"
        style={{ background: 'linear-gradient(135deg, #ef9900, #c47d00)' }}>
        Apply Now
      </div>
    </div>
  )
}

function HeroSection() {
  return (
    <section className="overflow-hidden bg-white relative">
      {/* Subtle mesh background */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(0,35,111,0.06) 0%, transparent 65%)',
        }}
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="flex flex-col md:flex-row items-center gap-14">

          {/* Left: copy */}
          <div className="flex-1 text-center md:text-left animate-fade-up">
            {/* Animated badge */}
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6"
              style={{ background: '#e5eeff', color: '#00236f' }}>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-70"
                  style={{ background: '#006c4e' }} />
                <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: '#006c4e' }} />
              </span>
              Cameroon's #1 Gig Marketplace
            </span>

            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-5" style={{ color: '#0b1c30' }}>
              Find{' '}
              <span style={{
                background: 'linear-gradient(135deg, #00236f, #0040c4)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                Trusted Help.
              </span>
              <br />
              Get Hired Today.
            </h1>

            <p className="text-base md:text-lg leading-relaxed mb-8 max-w-xl" style={{ color: '#444651' }}>
              Cameroon's gig marketplace connecting reliable workers with people who need help powered by verified ratings, location matching, and mobile money.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start mb-10">
              <Link to="/register" className="btn-primary text-base group">
                Find Work
                <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
              <Link to="/register" className="btn-secondary text-base">
                Post a Job
              </Link>
            </div>

            {/* Trust stats */}
            <div className="flex flex-wrap gap-5 justify-center md:justify-start">
              {[
                { icon: <Users size={14} />, stat: '500+', label: 'Workers' },
                { icon: <Briefcase size={14} />, stat: '200+', label: 'Jobs Posted' },
                { icon: <Star size={14} fill="#ef9900" color="#ef9900" />, stat: '4.8★', label: 'Avg Rating' },
              ].map(({ icon, stat, label }) => (
                <div key={label} className="flex items-center gap-2 text-sm" style={{ color: '#444651' }}>
                  <span style={{ color: '#006c4e' }}>{icon}</span>
                  <strong style={{ color: '#0b1c30' }}>{stat}</strong>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: floating card */}
          <div className="hidden md:flex items-center justify-center flex-shrink-0">
            <div className="relative">
              <div
                className="absolute -inset-4 rounded-3xl"
                style={{
                  background: 'linear-gradient(135deg, #e5eeff 0%, #97f5cc 100%)',
                  transform: 'rotate(-3deg)',
                  filter: 'blur(1px)',
                }}
              />
              <div className="relative z-10 drop-shadow-xl">
                <SampleJobCard />
              </div>
              {/* Floating badge */}
              <div
                className="absolute -top-3 -right-3 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-elevated"
                style={{ background: 'linear-gradient(135deg, #006c4e, #008a60)' }}
              >
                <TrendingUp size={12} />
                Live Jobs
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
    { n: '1', icon: <User size={18} color="#00236f" />, title: 'Create Your Profile', desc: 'Set up your profile, add your skills, and share your location to get started.' },
    { n: '2', icon: <MapPin size={18} color="#00236f" />, title: 'Browse Nearby Jobs', desc: 'Filter jobs by category, distance, and pay. Find opportunities right in your area.' },
    { n: '3', icon: <Smartphone size={18} color="#00236f" />, title: 'Get Hired & Paid', desc: 'Apply, get hired, do great work, and receive payment via MTN MoMo or Orange Money.' },
  ]
  const employerSteps = [
    { n: '1', icon: <Briefcase size={18} color="#00236f" />, title: 'Post Your Job', desc: 'Describe the task, set your location and budget, and go live in minutes.' },
    { n: '2', icon: <ShieldCheck size={18} color="#00236f" />, title: 'Review & Choose', desc: 'Browse worker profiles with verified ratings and pick the best match for your needs.' },
    { n: '3', icon: <TrendingUp size={18} color="#00236f" />, title: 'Hire & Confirm', desc: 'Select your worker, coordinate via chat, and confirm payment when the job is done.' },
  ]

  const Card = ({ steps, title, icon, ctaLabel, ctaVariant }) => (
    <div className="bg-white border border-outline-variant rounded-2xl shadow-card overflow-hidden">
      <div className="px-6 pt-6 pb-5 border-b border-outline-variant/50 flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ background: '#e5eeff' }}>
          {icon}
        </div>
        <h3 className="text-base font-semibold" style={{ color: '#0b1c30' }}>{title}</h3>
      </div>
      <div className="px-6 py-5 space-y-5">
        {steps.map((step) => (
          <div key={step.n} className="flex gap-4">
            <div
              className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shadow-sm"
              style={{ background: '#e5eeff', color: '#00236f' }}
            >
              {step.n}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {step.icon}
                <p className="font-semibold text-sm" style={{ color: '#0b1c30' }}>{step.title}</p>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: '#444651' }}>{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="px-6 pb-6">
        <Link
          to="/register"
          className={ctaVariant === 'primary' ? 'btn-primary w-full text-sm' : 'btn-secondary w-full text-sm'}
        >
          {ctaLabel}
        </Link>
      </div>
    </div>
  )

  return (
    <section id="how-it-works" className="py-16 md:py-24 mesh-bg scroll-mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: '#006c4e' }}>
            How it works
          </p>
          <h2 className="text-2xl md:text-3xl font-bold mb-3" style={{ color: '#0b1c30' }}>Get started in 3 simple steps</h2>
          <p className="text-base max-w-xl mx-auto" style={{ color: '#444651' }}>
            Whether you're looking for work or looking to hire, we've made it simple.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <Card steps={workerSteps} title="For Workers" icon={<Briefcase size={20} color="#00236f" />} ctaLabel="Start as Worker" ctaVariant="primary" />
          <Card steps={employerSteps} title="For Employers" icon={<Users size={20} color="#00236f" />} ctaLabel="Post a Job" ctaVariant="secondary" />
        </div>
      </div>
    </section>
  )
}

function CategoriesSection() {
  const displayCategories = CATEGORIES.filter(c => c.value !== 'other')
  const catColors = [
    '#e5eeff', '#97f5cc', '#fff3cd', '#fce4ec', '#f3e5f5',
    '#e0f7fa', '#fff8e1', '#f1f8e9', '#e8f5e9', '#fce4ec',
  ]

  return (
    <section id="categories" className="py-16 md:py-20 bg-white scroll-mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: '#ef9900' }}>
            Categories
          </p>
          <h2 className="text-2xl md:text-3xl font-bold mb-3" style={{ color: '#0b1c30' }}>Browse by Category</h2>
          <p className="text-base" style={{ color: '#444651' }}>Find work or hire help across all kinds of tasks.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {displayCategories.map((cat, i) => (
            <Link
              key={cat.value}
              to="/register"
              className="flex flex-col items-center gap-2.5 p-4 bg-white border border-outline-variant rounded-2xl
                         hover:shadow-card-hover hover:-translate-y-1 hover:border-primary/30
                         transition-all duration-200 ease-in-out group"
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-transform duration-200 group-hover:scale-110"
                style={{ background: catColors[i % catColors.length] }}>
                {cat.emoji}
              </div>
              <span className="text-xs font-semibold text-center leading-tight" style={{ color: '#0b1c30' }}>
                {cat.label}
              </span>
            </Link>
          ))}
          <Link
            to="/register"
            className="flex flex-col items-center gap-2.5 p-4 bg-white border border-outline-variant rounded-2xl
                       hover:shadow-card-hover hover:-translate-y-1 hover:border-primary/30
                       transition-all duration-200 ease-in-out group"
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-transform duration-200 group-hover:scale-110"
              style={{ background: '#f4f4f4' }}>
              💼
            </div>
            <span className="text-xs font-semibold text-center" style={{ color: '#0b1c30' }}>Other</span>
          </Link>
        </div>
      </div>
    </section>
  )
}

function WhyGigGleSection() {
  const features = [
    {
      icon: <ShieldCheck size={22} color="#00236f" />,
      bg: '#e5eeff',
      title: 'Verified Reputation',
      desc: 'Every worker builds a permanent rating record. Know who you\'re hiring before you commit.',
    },
    {
      icon: <MapPin size={22} color="#006c4e" />,
      bg: '#97f5cc',
      title: 'Jobs Near You',
      desc: 'Radius-based filtering shows only jobs within your chosen distance. No irrelevant listings.',
    },
    {
      icon: <MessageSquare size={22} color="#ef9900" />,
      bg: '#fff3cd',
      title: 'Real-Time Messaging',
      desc: 'Once matched, communicate directly in a private job-scoped chat. No WhatsApp needed.',
    },
    {
      icon: <Smartphone size={22} color="#006c4e" />,
      bg: '#97f5cc',
      title: 'Mobile Money Payments',
      desc: 'Coordinate MTN MoMo and Orange Money payments with a reference code trail. No bank needed.',
    },
  ]

  return (
    <section id="why-giggle" className="py-16 md:py-24 bg-white scroll-mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: '#00236f' }}>
            Why GigGle
          </p>
          <h2 className="text-2xl md:text-3xl font-bold mb-3" style={{ color: '#0b1c30' }}>Built for Cameroon's realities</h2>
          <p className="text-base" style={{ color: '#444651' }}>Fast, trusted, and mobile-first.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          {features.map((f, i) => (
            <div
              key={i}
              className="group flex gap-5 p-6 rounded-2xl border border-outline-variant
                         hover:shadow-card-hover hover:-translate-y-0.5
                         transition-all duration-200 ease-in-out bg-white"
            >
              <div
                className="flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
                style={{ background: f.bg }}
              >
                {f.icon}
              </div>
              <div>
                <h3 className="font-semibold text-base mb-1.5" style={{ color: '#0b1c30' }}>{f.title}</h3>
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
    <section
      className="py-16 md:py-24 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #001852 0%, #00236f 50%, #002f8a 100%)' }}
    >
      {/* Decorative blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-10"
          style={{ background: '#ef9900', filter: 'blur(60px)' }} />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full opacity-10"
          style={{ background: '#97f5cc', filter: 'blur(60px)' }} />
      </div>

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6"
          style={{ background: 'rgba(239,153,0,0.2)', color: '#ef9900' }}>
          <Zap size={12} fill="#ef9900" color="#ef9900" />
          Join the platform
        </div>
        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Ready to get started?</h2>
        <p className="text-base mb-10" style={{ color: 'rgba(182,196,255,0.9)' }}>
          Join Cameroon's growing gig economy platform.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/register" className="btn-primary text-base group">
            Register as Worker
            <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
          <Link
            to="/register"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold min-h-[48px] border-2 text-base transition-all duration-200 hover:bg-white/10 active:scale-[0.97]"
            style={{ borderColor: 'rgba(255,255,255,0.5)', color: '#fff' }}
          >
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
          
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(239,153,0,0.2)' }}>
                <Zap size={13} fill="#ef9900" color="#ef9900" />
              </div>
              <span className="text-base font-bold text-white">GigGle</span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: '#b6c4ff' }}>
              Cameroon's trusted gig labor marketplace. Find work or hire help <span style={{ color: '#ef9900' }}> quickly, safely, locally.</span>
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4 text-sm">Quick Links</h4>
            <ul className="space-y-2">
              {[
                { label: 'Home', to: '/' },
                { label: 'Login', to: '/login' },
                { label: 'Register', to: '/register' },
              ].map(({ label, to }) => (
                <li key={label}>
                  <Link to={to}
                    className="text-sm hover:text-white transition-colors duration-150 flex items-center gap-1.5 group"
                    style={{ color: '#b6c4ff' }}>
                    <ChevronRight size={12} className="opacity-0 -ml-3.5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-150" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4 text-sm">Contact</h4>
            <p className="text-sm mb-2" style={{ color: '#b6c4ff' }}>
              <a href="mailto:tayudidier03@gmail.com" className="hover:text-white transition-colors">
                tayudidier03@gmail.com
              </a>
            </p>
            <p className="text-sm" style={{ color: '#b6c4ff' }}>Douala, Cameroon 🇨🇲</p>
          </div>
        </div>

        <div className="border-t pt-6" style={{ borderColor: 'rgba(30,58,138,0.8)' }}>
          <p className="text-xs text-center" style={{ color: 'rgba(182,196,255,0.6)' }}>
            © 2026 GigGle · Made with ♥ in Cameroon
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
