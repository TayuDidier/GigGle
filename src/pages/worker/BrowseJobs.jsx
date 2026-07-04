import { useState, useMemo, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import '../../lib/leaflet-fix'
import L from 'leaflet'
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet'
import { Link, useNavigate } from 'react-router-dom'
import { Search, SlidersHorizontal, MapIcon, List, MapPin, ArrowLeft, LocateFixed } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { getJobsWithinRadius } from '../../api/jobs.api'
import { queryKeys } from '../../constants/queryKeys'
import { CATEGORIES } from '../../constants/categories'
import { CITIES } from '../../constants/cities'
import IconBadge from '../../components/ui/IconBadge'

const RADIUS_OPTIONS = [5, 10, 15, 25, 50]

const jobPinIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);
    background:#ef9900;border:3px solid #fff;
    box-shadow:0 2px 6px rgba(0,0,0,0.35)">
  </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -30],
})

function MapBoundsUpdater({ jobs, userCoords }) {
  const map = useMap()
  useEffect(() => {
    const pts = jobs.filter(j => j.job_lat && j.job_lng).map(j => [j.job_lat, j.job_lng])
    if (pts.length === 0) { map.setView([userCoords.lat, userCoords.lng], 12); return }
    pts.push([userCoords.lat, userCoords.lng])
    map.fitBounds(pts, { padding: [40, 40], maxZoom: 14 })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs.map(j => j.id).join(',')])
  return null
}

// Dense card for the 30% sidebar — no description, small text
function SidebarJobCard({ job }) {
  const cat = CATEGORIES.find(c => c.value === job.category)
  return (
    <Link to={`/worker/jobs/${job.id}`}>
      <div
        className="bg-white border rounded-lg p-2.5 transition-all hover:border-[#ef9900] hover:shadow-sm cursor-pointer"
        style={{ borderColor: '#c5c5d3' }}
      >
        <div className="flex items-center justify-between gap-1 mb-1">
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold leading-none"
            style={{ background: '#e5eeff', color: '#00236f' }}
          >
            {cat?.emoji} {cat?.label}
          </span>
          {job.distance_km !== undefined && (
            <span className="text-[10px] shrink-0 flex items-center gap-0.5" style={{ color: '#888' }}>
              <MapPin size={9} />
              {job.distance_km < 1
                ? `${Math.round(job.distance_km * 1000)}m`
                : `${job.distance_km.toFixed(1)}km`}
            </span>
          )}
        </div>
        <p className="text-xs font-semibold line-clamp-2 leading-snug mb-1.5" style={{ color: '#0b1c30' }}>
          {job.title}
        </p>
        <div className="flex items-center justify-between gap-1">
          <span className="text-xs font-bold" style={{ color: '#ef9900' }}>
            {Number(job.pay).toLocaleString('fr-CM')} XAF
          </span>
          <span className="text-[10px] truncate max-w-[60px]" style={{ color: '#888' }}>
            {job.city}
          </span>
        </div>
      </div>
    </Link>
  )
}

function SkeletonSidebarCard() {
  return (
    <div className="bg-white border rounded-lg p-2.5 animate-pulse" style={{ borderColor: '#e4e4ef' }}>
      <div className="h-3.5 w-16 rounded-full bg-gray-200 mb-2" />
      <div className="h-3 w-full bg-gray-200 rounded mb-1" />
      <div className="h-3 w-3/4 bg-gray-200 rounded mb-2" />
      <div className="h-3 w-1/2 bg-gray-200 rounded" />
    </div>
  )
}

export default function BrowseJobs() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [radiusKm, setRadiusKm] = useState(10)
  const [category, setCategory] = useState(null)
  const [view, setView] = useState('list')
  const [searchText, setSearchText] = useState('')
  const [searchCity, setSearchCity] = useState('')
  const [gpsCoords, setGpsCoords] = useState(null)
  const [locating, setLocating] = useState(false)

  useEffect(() => {
    if (profile?.city && !searchCity) setSearchCity(profile.city)
  }, [profile?.city])

  const handleGetLocation = () => {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocating(false)
      },
      () => setLocating(false),
      { timeout: 8000 }
    )
  }

  const userCoords = useMemo(() => {
    if (gpsCoords) return gpsCoords
    const cityObj = CITIES.find(c => c.name === searchCity)
    if (cityObj) return { lat: cityObj.lat, lng: cityObj.lng }
    if (profile?.location) {
      try {
        const geo = typeof profile.location === 'string' ? JSON.parse(profile.location) : profile.location
        return { lat: geo.coordinates[1], lng: geo.coordinates[0] }
      } catch { }
    }
    return { lat: CITIES[0].lat, lng: CITIES[0].lng }
  }, [gpsCoords, searchCity, profile])

  const { data: jobs = [], isLoading, error } = useQuery({
    queryKey: queryKeys.jobs.nearby({ ...userCoords, radiusKm, category }),
    queryFn: () => getJobsWithinRadius({ ...userCoords, radiusKm, category }),
    enabled: !!userCoords,
    staleTime: 60_000,
  })

  const filteredJobs = useMemo(() => {
    if (!searchText.trim()) return jobs
    const lower = searchText.toLowerCase()
    return jobs.filter(j =>
      j.title?.toLowerCase().includes(lower) ||
      j.description?.toLowerCase().includes(lower)
    )
  }, [jobs, searchText])

  return (
    // h-screen + overflow-hidden on desktop bounds the layout so the list panel can
    // scroll internally without causing a page-level scroll
    <div
      className="flex flex-col h-full md:h-screen md:overflow-hidden"
      style={{ background: '#f8f9ff' }}
    >
      {/* ── COMPACT HEADER ── */}
      <div
        className="shrink-0 px-3 pt-2.5 pb-2 border-b"
        style={{ background: '#fff', borderColor: '#e4e4ef' }}
      >
        {/* Row 1: back + title + count + mobile view toggles */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="p-1 rounded-lg transition-colors hover:bg-gray-100"
              style={{ color: '#00236f' }}
            >
              <ArrowLeft size={17} />
            </button>
            <h1 className="text-base font-bold" style={{ color: '#0b1c30' }}>Browse Jobs</h1>
            {!isLoading && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: '#e5eeff', color: '#00236f' }}>
                {filteredJobs.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 md:hidden">
            <button
              onClick={() => setView('list')}
              className="p-1.5 rounded-lg transition-colors"
              style={{ background: view === 'list' ? '#e5eeff' : 'transparent', color: view === 'list' ? '#00236f' : '#888' }}
            >
              <List size={17} />
            </button>
            <button
              onClick={() => setView('map')}
              className="p-1.5 rounded-lg transition-colors"
              style={{ background: view === 'map' ? '#e5eeff' : 'transparent', color: view === 'map' ? '#00236f' : '#888' }}
            >
              <MapIcon size={17} />
            </button>
          </div>
        </div>

        {/* Row 2: search (≤50%) + get-location button */}
        <div className="flex items-center gap-2 mb-1.5">
          <div className="relative w-1/2">
            <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2" style={{ color: '#9ca3af' }} />
            <input
              type="text"
              placeholder="Search job titles…"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              className="w-full pl-6 pr-2 py-1.5 text-xs rounded-lg border outline-none focus:ring-1"
              style={{ borderColor: '#c5c5d3', background: '#f8f9ff' }}
            />
          </div>
          <button
            onClick={handleGetLocation}
            disabled={locating}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors shrink-0"
            style={gpsCoords
              ? { background: '#e5eeff', borderColor: '#00236f', color: '#00236f' }
              : { background: '#fff', borderColor: '#c5c5d3', color: '#444651' }}
          >
            <LocateFixed size={13} className={locating ? 'animate-spin' : ''} />
            {locating ? 'Locating…' : gpsCoords ? 'GPS active' : 'Use my location'}
          </button>
        </div>

        {/* Row 3: city + distance + category (each ≤50%) */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={11} className="shrink-0" style={{ color: '#9ca3af' }} />
          <select
            value={searchCity}
            onChange={e => { setSearchCity(e.target.value); setGpsCoords(null) }}
            className="text-xs font-medium rounded-lg border pl-2 pr-5 py-1.5 max-w-[50%] flex-1"
            style={{ borderColor: '#c5c5d3', color: '#0b1c30', background: '#f8f9ff' }}
          >
            {CITIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
          <select
            value={radiusKm}
            onChange={e => setRadiusKm(Number(e.target.value))}
            className="text-xs font-medium rounded-lg border pl-2 pr-5 py-1.5 max-w-[50%] flex-1"
            style={{ borderColor: '#c5c5d3', color: '#0b1c30', background: '#f8f9ff' }}
          >
            {RADIUS_OPTIONS.map(r => (
              <option key={r} value={r}>{r} km</option>
            ))}
          </select>
          <select
            value={category ?? ''}
            onChange={e => setCategory(e.target.value || null)}
            className="text-xs font-medium rounded-lg border pl-2 pr-5 py-1.5 max-w-[50%] flex-1"
            style={{ borderColor: '#c5c5d3', color: '#0b1c30', background: '#f8f9ff' }}
          >
            <option value="">All categories</option>
            {CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.emoji} {cat.label}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="mx-3 mt-2 shrink-0 px-3 py-2 rounded-lg text-xs font-medium"
          style={{ background: '#fee2e2', color: '#ba1a1a' }}>
          {error.message || 'Failed to load jobs. Please try again.'}
        </div>
      )}

      {/* ── MAIN CONTENT: map 70% | list 30% ── */}
      <div className="flex-1 flex min-h-0">

        {/* MAP PANEL — 70% on desktop, toggled on mobile */}
        <div className={`${view === 'map' ? 'flex' : 'hidden'} md:flex md:w-[70%] flex-col min-h-0 p-3`}>
          <div className="flex-1 relative rounded-xl overflow-hidden border shadow-sm" style={{ borderColor: '#c5c5d3' }}>
            <MapContainer
              center={[userCoords.lat, userCoords.lng]}
              zoom={12}
              style={{ height: '100%', width: '100%', minHeight: 300 }}
              className="z-0"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapBoundsUpdater jobs={filteredJobs} userCoords={userCoords} />
              <CircleMarker
                center={[userCoords.lat, userCoords.lng]}
                radius={10}
                pathOptions={{ color: '#00236f', fillColor: '#00236f', fillOpacity: 0.85, weight: 3 }}
              >
                <Popup>
                  <div className="text-sm font-semibold" style={{ color: '#00236f' }}>📍 Your location</div>
                </Popup>
              </CircleMarker>
              {filteredJobs.map(job => {
                if (!job.job_lat || !job.job_lng) return null
                const cat = CATEGORIES.find(c => c.value === job.category)
                return (
                  <Marker key={job.id} position={[job.job_lat, job.job_lng]} icon={jobPinIcon}>
                    <Popup minWidth={170}>
                      <div className="text-sm">
                        <p className="text-xs mb-0.5" style={{ color: '#444651' }}>
                          {cat?.emoji} {cat?.label}
                          {job.distance_km !== undefined && (
                            <span className="ml-1">·{' '}
                              {job.distance_km < 1
                                ? `${Math.round(job.distance_km * 1000)}m`
                                : `${job.distance_km.toFixed(1)}km`}
                            </span>
                          )}
                        </p>
                        <p className="font-semibold mb-1 leading-snug text-sm" style={{ color: '#0b1c30' }}>{job.title}</p>
                        <p className="font-bold text-sm mb-2" style={{ color: '#ef9900' }}>
                          {Number(job.pay).toLocaleString('fr-CM')} XAF
                        </p>
                        <Link
                          to={`/worker/jobs/${job.id}`}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white inline-block"
                          style={{ background: '#00236f' }}
                        >
                          View Job
                        </Link>
                      </div>
                    </Popup>
                  </Marker>
                )
              })}
            </MapContainer>

            {/* Map legend */}
            <div
              className="absolute bottom-3 left-3 z-10 bg-white rounded-lg shadow px-2.5 py-1.5 text-[10px] space-y-1"
              style={{ border: '1px solid #c5c5d3' }}
            >
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: '#00236f' }} />
                <span style={{ color: '#444651' }}>You</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: '#ef9900' }} />
                <span style={{ color: '#444651' }}>Job</span>
              </div>
            </div>
          </div>
        </div>

        {/* JOB LIST PANEL — 30% on desktop, full-width on mobile */}
        <div
          className={`${view === 'list' ? 'flex' : 'hidden'} md:flex md:w-[30%] flex-col min-h-0 border-l`}
          style={{ borderColor: '#e4e4ef', background: '#f8f9ff' }}
        >
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {isLoading ? (
              <>
                <SkeletonSidebarCard />
                <SkeletonSidebarCard />
                <SkeletonSidebarCard />
                <SkeletonSidebarCard />
              </>
            ) : filteredJobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-3">
                <IconBadge icon={MapPin} tone="navy" size="sm" className="mb-3" />
                <p className="text-xs font-semibold mb-1" style={{ color: '#0b1c30' }}>No jobs found</p>
                <p className="text-[11px] leading-snug" style={{ color: '#888' }}>
                  Try a different city, larger radius, or different category.
                </p>
              </div>
            ) : (
              filteredJobs.map(job => (
                <SidebarJobCard key={job.id} job={job} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
