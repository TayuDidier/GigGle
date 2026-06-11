import { useState, useMemo, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import '../../lib/leaflet-fix'
import L from 'leaflet'
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet'
import {
  Star, User, MapPin, CheckCircle, ChevronLeft,
  Users, AlertCircle, Search, Map as MapIcon, MessageSquare,
} from 'lucide-react'
import { getJobApplicants, acceptApplicant } from '../../api/applications.api'
import { getJobById } from '../../api/jobs.api'
import { getWorkersNearLocation } from '../../api/profiles.api'
import { queryKeys } from '../../constants/queryKeys'
import { CategoryBadge } from '../../components/jobs/CategoryBadge'
import { JobStatusBadge } from '../../components/jobs/JobStatusBadge'
import { CITIES } from '../../constants/cities'

// ─── helpers ───────────────────────────────────────────────────────────────

function extractCoords(location) {
  if (!location) return null
  try {
    const geo = typeof location === 'string' ? JSON.parse(location) : location
    if (geo?.coordinates) return { lat: geo.coordinates[1], lng: geo.coordinates[0] }
  } catch { }
  return null
}

// Small deterministic jitter so workers at the exact same city-center coordinate
// don't stack. Offset is ≤ ~1.4 km — invisible at city scale, distinct on map.
function jitter(lat, lng, seed) {
  let h = 5381
  for (let i = 0; i < seed.length; i++) h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0
  return [lat + ((h & 0xff) - 128) / 9000, lng + (((h >> 8) & 0xff) - 128) / 9000]
}

function makeCircleIcon(bg, label = '', ring = '#fff') {
  return L.divIcon({
    className: '',
    html: `<div style="width:34px;height:34px;border-radius:50%;background:${bg};
      border:3px solid ${ring};box-shadow:0 2px 8px rgba(0,0,0,0.28);
      display:flex;align-items:center;justify-content:center;
      color:#fff;font-size:12px;font-weight:700;line-height:1">${label}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -20],
  })
}

const ICONS = {
  job:      makeCircleIcon('#ef9900', '📍', '#fff'),
  pending:  makeCircleIcon('#00236f', '', '#fff'),
  accepted: makeCircleIcon('#006c4e', '✓', '#fff'),
  rejected: makeCircleIcon('#9ca3af', '', '#c5c5d3'),
  worker:   makeCircleIcon('#7c3aed', '', '#fff'),
  top:      makeCircleIcon('#b45309', '★', '#fef3c7'),
}

// Fit map bounds to supplied positions
function MapBoundsUpdater({ positions }) {
  const map = useMap()
  const prev = useRef('')
  useEffect(() => {
    const key = positions.map(p => p.join(',')).join('|')
    if (key === prev.current || positions.length === 0) return
    prev.current = key
    if (positions.length === 1) { map.setView(positions[0], 13); return }
    map.fitBounds(positions, { padding: [40, 40], maxZoom: 14 })
  }, [map, positions])
  return null
}

// ─── sub-components ────────────────────────────────────────────────────────

function StarRating({ rating, count }) {
  const stars = Math.round(Number(rating) || 0)
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={13} fill={i <= stars ? '#ef9900' : 'none'} color={i <= stars ? '#ef9900' : '#c5c5d3'} />
      ))}
      {count !== undefined && <span className="text-xs ml-1" style={{ color: '#444651' }}>({count})</span>}
    </span>
  )
}

const STATUS_CFG = {
  pending:  { label: 'Pending',  bg: '#fef3c7', color: '#b45309' },
  accepted: { label: 'Accepted', bg: '#dcfce7', color: '#166534' },
  rejected: { label: 'Rejected', bg: '#f3f4f6', color: '#374151' },
}

function ConfirmSelectDialog({ applicantName, onConfirm, onCancel, isPending }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <h2 className="text-base font-bold mb-2" style={{ color: '#0b1c30' }}>Select this worker?</h2>
        <p className="text-sm mb-5" style={{ color: '#444651' }}>
          You are about to select <strong>{applicantName}</strong> for this job. Other pending applicants will be rejected.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={isPending} className="btn-secondary flex-1">Cancel</button>
          <button onClick={onConfirm} disabled={isPending} className="btn-primary flex-1">
            {isPending
              ? <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Selecting…
                </span>
              : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── main component ────────────────────────────────────────────────────────

export default function ManageApplicants() {
  const { id } = useParams()
  const queryClient = useQueryClient()
  const [confirmApplicant, setConfirmApplicant] = useState(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [mapMode, setMapMode] = useState('applicants')   // 'applicants' | 'discover'
  const [highlightedId, setHighlightedId] = useState(null)
  const cardRefs = useRef({})

  const { data: job, isLoading: loadingJob } = useQuery({
    queryKey: queryKeys.jobs.byId(id),
    queryFn: () => getJobById(id),
  })

  const { data: applicants = [], isLoading: loadingApps } = useQuery({
    queryKey: queryKeys.applications.forJob(id),
    queryFn: () => getJobApplicants(id),
    enabled: !!id,
  })

  // Derive job coords for map center
  const jobCoords = useMemo(() => {
    if (!job) return null
    const c = extractCoords(job.location)
    if (c) return c
    const city = CITIES.find(ci => ci.name === job.city) || CITIES[0]
    return { lat: city.lat, lng: city.lng }
  }, [job])

  // Fetch nearby workers only when employer switches to discover mode
  const { data: nearbyWorkers = [], isFetching: fetchingNearby } = useQuery({
    queryKey: queryKeys.workers.nearby({ lat: jobCoords?.lat, lng: jobCoords?.lng }),
    queryFn: () => getWorkersNearLocation({ lat: jobCoords.lat, lng: jobCoords.lng, radiusKm: 25 }),
    enabled: !!jobCoords && mapMode === 'discover',
    staleTime: 5 * 60_000,
  })

  const acceptMutation = useMutation({
    mutationFn: (applicationId) => acceptApplicant(applicationId),
    onSuccess: () => {
      queryClient.invalidateQueries(queryKeys.jobs.byId(id))
      queryClient.invalidateQueries(queryKeys.applications.forJob(id))
      setConfirmApplicant(null)
      setSuccessMessage('Worker selected! The job is now in progress.')
      setTimeout(() => setSuccessMessage(''), 5000)
    },
    onError: (err) => {
      setConfirmApplicant(null)
      setErrorMsg(err.message || 'Failed to accept applicant.')
    },
  })

  const isLoading = loadingJob || loadingApps
  const alreadySelected = job?.status === 'in_progress' || job?.status === 'completed'

  // Build map positions for bounds fitting
  const mapPositions = useMemo(() => {
    const pts = []
    if (jobCoords) pts.push([jobCoords.lat, jobCoords.lng])
    if (mapMode === 'applicants') {
      applicants.forEach(app => {
        const c = extractCoords(app.worker?.location)
        if (c) pts.push(jitter(c.lat, c.lng, app.worker.id))
        else {
          const city = CITIES.find(ci => ci.name === app.worker?.city)
          if (city) pts.push(jitter(city.lat, city.lng, app.worker?.id || app.id))
        }
      })
    } else {
      nearbyWorkers.forEach(w => {
        if (w.worker_lat && w.worker_lng) pts.push(jitter(w.worker_lat, w.worker_lng, w.id))
      })
    }
    return pts
  }, [jobCoords, mapMode, applicants, nearbyWorkers])

  function scrollToCard(workerId) {
    setHighlightedId(workerId)
    cardRefs.current[workerId]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setTimeout(() => setHighlightedId(null), 2500)
  }

  const showMap = !!jobCoords

  return (
    <div className="px-4 py-6 pb-10 max-w-3xl mx-auto" style={{ background: '#f8f9ff', minHeight: '100%' }}>

      {/* Back */}
      <Link to={`/employer/jobs/${id}`} className="inline-flex items-center gap-1 text-sm font-medium mb-4" style={{ color: '#00236f' }}>
        <ChevronLeft size={16} />
        Job Detail
      </Link>

      {/* Header */}
      <div className="mb-4">
        {job && (
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <CategoryBadge value={job.category} />
            <JobStatusBadge status={job.status} />
          </div>
        )}
        <h1 className="text-xl font-bold" style={{ color: '#0b1c30' }}>
          {job ? job.title : 'Manage Applicants'}
        </h1>
        {!isLoading && (
          <p className="text-sm mt-1" style={{ color: '#444651' }}>
            {applicants.length} applicant{applicants.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Banners */}
      {successMessage && (
        <div className="flex items-center gap-2 mb-4 px-4 py-3 rounded-lg text-sm font-medium" style={{ background: '#dcfce7', color: '#166534' }}>
          <CheckCircle size={16} /> {successMessage}
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-2 mb-4 px-4 py-3 rounded-lg text-sm font-medium" style={{ background: '#fee2e2', color: '#ba1a1a' }}>
          <AlertCircle size={16} /> {errorMsg}
        </div>
      )}
      {alreadySelected && (
        <div className="flex items-center gap-2 mb-4 px-4 py-3 rounded-lg text-sm font-medium" style={{ background: '#dbeafe', color: '#1e40af' }}>
          <CheckCircle size={16} />
          You've already selected a worker for this job.
        </div>
      )}

      {/* ── MAP SECTION ── */}
      {showMap && (
        <div className="mb-5 rounded-2xl overflow-hidden border" style={{ borderColor: '#c5c5d3' }}>

          {/* Mode toggle */}
          <div className="flex border-b" style={{ background: '#fff', borderColor: '#e4e4ef' }}>
            <button
              onClick={() => setMapMode('applicants')}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-colors"
              style={mapMode === 'applicants'
                ? { color: '#00236f', borderBottom: '2px solid #00236f' }
                : { color: '#444651' }}
            >
              <Users size={15} />
              Applicants ({applicants.length})
            </button>
            <button
              onClick={() => setMapMode('discover')}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-colors"
              style={mapMode === 'discover'
                ? { color: '#7c3aed', borderBottom: '2px solid #7c3aed' }
                : { color: '#444651' }}
            >
              <Search size={15} />
              Discover Nearby Workers
              {fetchingNearby && (
                <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
              )}
            </button>
          </div>

          {/* Map */}
          <div style={{ height: 320 }}>
            <MapContainer
              center={[jobCoords.lat, jobCoords.lng]}
              zoom={12}
              style={{ height: '100%', width: '100%' }}
              className="z-0"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <MapBoundsUpdater positions={mapPositions} />

              {/* Job location pin */}
              <Marker position={[jobCoords.lat, jobCoords.lng]} icon={ICONS.job}>
                <Popup>
                  <div className="text-sm">
                    <p className="font-semibold" style={{ color: '#0b1c30' }}>{job?.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#ef9900' }}>
                      {job?.pay && `${Number(job.pay).toLocaleString('fr-CM')} XAF`}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: '#444651' }}>{job?.city}</p>
                  </div>
                </Popup>
              </Marker>

              {/* ── APPLICANTS MODE ── */}
              {mapMode === 'applicants' && applicants.map(app => {
                const worker = app.worker || {}
                const coords = extractCoords(worker.location)
                const city = CITIES.find(c => c.name === worker.city)
                const base = coords
                  ? { lat: coords.lat, lng: coords.lng }
                  : city ? { lat: city.lat, lng: city.lng } : null
                if (!base) return null
                const [jLat, jLng] = jitter(base.lat, base.lng, worker.id || app.id)
                const icon = ICONS[app.status] || ICONS.pending
                const rating = worker.rating_average ? Number(worker.rating_average).toFixed(1) : null
                return (
                  <Marker key={app.id} position={[jLat, jLng]} icon={icon}
                    eventHandlers={{ click: () => scrollToCard(worker.id) }}
                  >
                    <Popup>
                      <div className="text-sm min-w-[150px]">
                        <p className="font-semibold mb-0.5" style={{ color: '#0b1c30' }}>{worker.full_name}</p>
                        {rating && (
                          <p className="text-xs mb-0.5" style={{ color: '#ef9900' }}>★ {rating}</p>
                        )}
                        <p className="text-xs mb-1" style={{ color: '#444651' }}>{worker.city}</p>
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                          style={{ background: STATUS_CFG[app.status]?.bg, color: STATUS_CFG[app.status]?.color }}
                        >
                          {STATUS_CFG[app.status]?.label}
                        </span>
                      </div>
                    </Popup>
                  </Marker>
                )
              })}

              {/* ── DISCOVER MODE ── */}
              {mapMode === 'discover' && nearbyWorkers.map(w => {
                if (!w.worker_lat || !w.worker_lng) return null
                const [jLat, jLng] = jitter(w.worker_lat, w.worker_lng, w.id)
                const isTop = w.rating_average && Number(w.rating_average) >= 4.0
                const icon = isTop ? ICONS.top : ICONS.worker
                return (
                  <Marker key={w.id} position={[jLat, jLng]} icon={icon}
                    eventHandlers={{ click: () => scrollToCard(w.id) }}
                  >
                    <Popup>
                      <div className="text-sm min-w-[160px]">
                        <div className="flex items-center gap-1 mb-0.5">
                          {isTop && <span className="text-xs font-bold" style={{ color: '#b45309' }}>⭐ Top Worker</span>}
                        </div>
                        <p className="font-semibold" style={{ color: '#0b1c30' }}>{w.full_name}</p>
                        {w.rating_average && (
                          <p className="text-xs" style={{ color: '#ef9900' }}>
                            ★ {Number(w.rating_average).toFixed(1)} ({w.rating_count} reviews)
                          </p>
                        )}
                        <p className="text-xs mt-0.5" style={{ color: '#444651' }}>
                          {w.city} · {w.distance_km < 1 ? `${Math.round(w.distance_km * 1000)}m` : `${w.distance_km.toFixed(1)}km`}
                        </p>
                        <Link
                          to={`/profile/${w.id}`}
                          className="inline-block mt-2 text-xs font-semibold px-2 py-1 rounded"
                          style={{ background: '#e5eeff', color: '#00236f' }}
                        >
                          View Profile
                        </Link>
                      </div>
                    </Popup>
                  </Marker>
                )
              })}
            </MapContainer>
          </div>

          {/* Map legend */}
          <div className="px-4 py-2 flex items-center gap-4 flex-wrap text-xs" style={{ background: '#f8f9ff', borderTop: '1px solid #e4e4ef' }}>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-full" style={{ background: '#ef9900' }} />
              <span style={{ color: '#444651' }}>Job location</span>
            </span>
            {mapMode === 'applicants' ? (
              <>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 rounded-full" style={{ background: '#00236f' }} />
                  <span style={{ color: '#444651' }}>Pending</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 rounded-full" style={{ background: '#006c4e' }} />
                  <span style={{ color: '#444651' }}>Accepted</span>
                </span>
              </>
            ) : (
              <>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 rounded-full" style={{ background: '#7c3aed' }} />
                  <span style={{ color: '#444651' }}>Worker</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 rounded-full" style={{ background: '#b45309' }} />
                  <span style={{ color: '#444651' }}>★ Top-rated (≥4.0)</span>
                </span>
              </>
            )}
            <span className="ml-auto text-xs" style={{ color: '#9ca3af' }}>Click a pin to locate</span>
          </div>
        </div>
      )}

      {/* ── APPLICANTS LIST ── */}
      {mapMode === 'applicants' && (
        <>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#00236f', borderTopColor: 'transparent' }} />
            </div>
          ) : applicants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center card">
              <Users size={48} className="mb-4 opacity-30" style={{ color: '#444651' }} />
              <p className="font-semibold mb-1" style={{ color: '#0b1c30' }}>No applications yet</p>
              <p className="text-sm" style={{ color: '#444651' }}>Share your job listing to attract workers.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {applicants.map(app => {
                const worker = app.worker || {}
                const statusCfg = STATUS_CFG[app.status] || STATUS_CFG.pending
                const isHighlighted = highlightedId === worker.id
                return (
                  <div
                    key={app.id}
                    ref={el => cardRefs.current[worker.id] = el}
                    className="bg-white border rounded-xl shadow-sm p-4 transition-all duration-300"
                    style={{
                      borderColor: isHighlighted ? '#00236f' : '#c5c5d3',
                      boxShadow: isHighlighted ? '0 0 0 3px rgba(0,35,111,0.15)' : undefined,
                    }}
                  >
                    <div className="flex gap-3">
                      <div className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center text-xl font-bold shrink-0"
                        style={{ background: '#e5eeff', color: '#00236f' }}>
                        {worker.avatar_url
                          ? <img src={worker.avatar_url} alt="" className="w-full h-full object-cover" />
                          : (worker.full_name || 'W').charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <p className="font-bold truncate" style={{ color: '#0b1c30' }}>{worker.full_name || 'Unknown'}</p>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold shrink-0"
                            style={{ background: statusCfg.bg, color: statusCfg.color }}>
                            {statusCfg.label}
                          </span>
                        </div>
                        {worker.city && (
                          <p className="text-xs flex items-center gap-1 mb-1" style={{ color: '#444651' }}>
                            <MapPin size={11} /> {worker.city}
                          </p>
                        )}
                        {worker.rating_average && <StarRating rating={worker.rating_average} count={worker.rating_count} />}
                        {worker.bio && <p className="text-sm mt-1.5 line-clamp-2" style={{ color: '#444651' }}>{worker.bio}</p>}
                      </div>
                    </div>
                    {app.cover_note && (
                      <div className="mt-3 px-3 py-2 rounded-lg" style={{ background: '#f8f9ff' }}>
                        <p className="text-xs italic" style={{ color: '#444651' }}>"{app.cover_note}"</p>
                      </div>
                    )}
                    <div className="mt-3 pt-3 border-t flex items-center justify-between gap-3 flex-wrap" style={{ borderColor: '#e5eeff' }}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link to={`/profile/${worker.id}`}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg border"
                          style={{ color: '#00236f', borderColor: '#00236f' }}>
                          View Profile
                        </Link>
                        {(app.status === 'pending' || app.status === 'accepted') && (
                          <Link
                            to={`/employer/jobs/${id}/chat/${worker.id}`}
                            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg"
                            style={{ background: '#e5eeff', color: '#00236f' }}
                          >
                            <MessageSquare size={13} /> Chat
                          </Link>
                        )}
                      </div>
                      {app.status === 'pending' && !alreadySelected && (
                        <button
                          onClick={() => setConfirmApplicant({ applicationId: app.id, workerName: worker.full_name || 'this worker' })}
                          className="btn-primary text-sm px-4 py-2"
                        >
                          Select This Worker
                        </button>
                      )}
                      {app.status === 'accepted' && (
                        <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#166534' }}>
                          <CheckCircle size={14} /> Selected
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ── DISCOVER NEARBY WORKERS LIST ── */}
      {mapMode === 'discover' && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold" style={{ color: '#0b1c30' }}>
              Nearby Workers
              <span className="ml-2 text-sm font-normal" style={{ color: '#444651' }}>
                within 25km · sorted by rating
              </span>
            </h2>
          </div>
          {fetchingNearby ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#7c3aed', borderTopColor: 'transparent' }} />
            </div>
          ) : nearbyWorkers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center card">
              <User size={48} className="mb-4 opacity-30" style={{ color: '#444651' }} />
              <p className="font-semibold mb-1" style={{ color: '#0b1c30' }}>No workers found nearby</p>
              <p className="text-sm" style={{ color: '#444651' }}>No registered workers within 25km of this job.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {nearbyWorkers.map((w, idx) => {
                const isTop = w.rating_average && Number(w.rating_average) >= 4.0
                const isHighlighted = highlightedId === w.id
                return (
                  <div
                    key={w.id}
                    ref={el => cardRefs.current[w.id] = el}
                    className="bg-white border rounded-xl shadow-sm p-4 transition-all duration-300"
                    style={{
                      borderColor: isHighlighted ? '#7c3aed' : '#c5c5d3',
                      boxShadow: isHighlighted ? '0 0 0 3px rgba(124,58,237,0.15)' : undefined,
                    }}
                  >
                    <div className="flex gap-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center text-lg font-bold shrink-0"
                        style={{ background: isTop ? '#fef3c7' : '#e5eeff', color: isTop ? '#b45309' : '#00236f' }}>
                        {w.avatar_url
                          ? <img src={w.avatar_url} alt="" className="w-full h-full object-cover" />
                          : (w.full_name || 'W').charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-bold truncate" style={{ color: '#0b1c30' }}>{w.full_name}</p>
                          {isTop && (
                            <span className="shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-bold"
                              style={{ background: '#fef3c7', color: '#b45309' }}>
                              ⭐ Top
                            </span>
                          )}
                          {idx === 0 && (
                            <span className="shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-bold"
                              style={{ background: '#dcfce7', color: '#166534' }}>
                              #1 Nearby
                            </span>
                          )}
                        </div>
                        <p className="text-xs flex items-center gap-1 mb-1" style={{ color: '#444651' }}>
                          <MapPin size={11} />
                          {w.city} ·{' '}
                          {w.distance_km < 1
                            ? `${Math.round(w.distance_km * 1000)}m away`
                            : `${w.distance_km.toFixed(1)}km away`}
                        </p>
                        {w.rating_average
                          ? <StarRating rating={w.rating_average} count={w.rating_count} />
                          : <span className="text-xs" style={{ color: '#9ca3af' }}>No ratings yet</span>}
                        {w.bio && <p className="text-sm mt-1.5 line-clamp-2" style={{ color: '#444651' }}>{w.bio}</p>}
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t" style={{ borderColor: '#e5eeff' }}>
                      <Link to={`/profile/${w.id}`}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg border"
                        style={{ color: '#00236f', borderColor: '#00236f' }}>
                        View Full Profile
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Confirm dialog */}
      {confirmApplicant && (
        <ConfirmSelectDialog
          applicantName={confirmApplicant.workerName}
          isPending={acceptMutation.isPending}
          onConfirm={() => acceptMutation.mutate(confirmApplicant.applicationId)}
          onCancel={() => setConfirmApplicant(null)}
        />
      )}
    </div>
  )
}
