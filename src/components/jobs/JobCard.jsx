import { Link } from 'react-router-dom'
import { MapPin, Clock, Star } from 'lucide-react'
import { CategoryBadge } from './CategoryBadge'
import { JobStatusBadge } from './JobStatusBadge'

export function JobCard({ job, linkTo, compact = false }) {
  const content = (
    <div className="bg-white border border-outline-variant rounded-xl shadow-card hover:shadow-card-hover hover:border-orange transition-all duration-200 p-4 cursor-pointer">
      <div className="flex items-start justify-between gap-2 mb-2">
        <CategoryBadge value={job.category} />
        {job.status && job.status !== 'open' && <JobStatusBadge status={job.status} />}
        {job.distance_km !== undefined && (
          <span className="text-xs flex items-center gap-1 shrink-0" style={{ color: '#444651' }}>
            <MapPin size={12} /> {job.distance_km < 1 ? `${Math.round(job.distance_km * 1000)}m` : `${job.distance_km.toFixed(1)}km`}
          </span>
        )}
      </div>

      <h3 className="font-semibold text-base mb-1 line-clamp-2" style={{ color: '#0b1c30' }}>{job.title}</h3>

      {!compact && (
        <p className="text-sm mb-3 line-clamp-2" style={{ color: '#444651' }}>{job.description}</p>
      )}

      <div className="flex items-center gap-2 text-xs mb-3" style={{ color: '#444651' }}>
        <MapPin size={12} />
        <span>{job.city}{job.address_text ? ` · ${job.address_text}` : ''}</span>
        {job.timeline_days && (
          <><span>·</span><Clock size={12} /><span>{job.timeline_days}d</span></>
        )}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-lg font-bold" style={{ color: '#ef9900' }}>
          {Number(job.pay).toLocaleString('fr-CM')} XAF
        </span>
        {job.employer_name && (
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-surface-container overflow-hidden flex items-center justify-center text-xs font-semibold" style={{ color: '#00236f' }}>
              {job.employer_avatar
                ? <img src={job.employer_avatar} alt="" className="w-full h-full object-cover" />
                : job.employer_name.charAt(0)
              }
            </div>
            <span className="text-xs" style={{ color: '#444651' }}>{job.employer_name.split(' ')[0]}</span>
            {job.employer_rating && (
              <span className="flex items-center gap-0.5 text-xs">
                <Star size={11} fill="#ef9900" color="#ef9900" />
                <span style={{ color: '#0b1c30' }}>{Number(job.employer_rating).toFixed(1)}</span>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )

  if (linkTo) return <Link to={linkTo}>{content}</Link>
  return content
}
