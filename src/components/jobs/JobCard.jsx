import { Link } from 'react-router-dom'
import { MapPin, Clock, Star, ArrowRight } from 'lucide-react'
import { CategoryBadge } from './CategoryBadge'
import { JobStatusBadge } from './JobStatusBadge'

export function JobCard({ job, linkTo, compact = false }) {
  const content = (
    <div
      className="group bg-white border border-outline-variant rounded-2xl shadow-card p-4
                 hover:shadow-card-hover hover:-translate-y-0.5 hover:border-primary/25
                 transition-all duration-200 ease-in-out cursor-pointer overflow-hidden"
    >
      {/* Top row: category + status/distance */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <CategoryBadge value={job.category} />
        <div className="flex items-center gap-2 shrink-0">
          {job.status && job.status !== 'open' && <JobStatusBadge status={job.status} />}
          {job.distance_km !== undefined && (
            <span className="text-xs flex items-center gap-1 font-medium" style={{ color: '#888' }}>
              <MapPin size={11} />
              {job.distance_km < 1
                ? `${Math.round(job.distance_km * 1000)}m`
                : `${job.distance_km.toFixed(1)}km`}
            </span>
          )}
        </div>
      </div>

      {/* Title */}
      <h3 className="font-semibold text-base mb-1.5 line-clamp-2 leading-snug" style={{ color: '#0b1c30' }}>
        {job.title}
      </h3>

      {/* Description */}
      {!compact && job.description && (
        <p className="text-sm mb-3 line-clamp-2 leading-relaxed" style={{ color: '#444651' }}>
          {job.description}
        </p>
      )}

      {/* Location + timeline */}
      <div className="flex items-center gap-2 text-xs mb-3" style={{ color: '#888' }}>
        <MapPin size={11} />
        <span className="truncate">{job.city}{job.address_text ? ` · ${job.address_text}` : ''}</span>
        {job.timeline_days && (
          <>
            <span className="shrink-0">·</span>
            <Clock size={11} className="shrink-0" />
            <span className="shrink-0">{job.timeline_days}d</span>
          </>
        )}
      </div>

      {/* Footer: pay + employer */}
      <div className="flex items-center justify-between pt-2.5 border-t" style={{ borderColor: '#f0f0f8' }}>
        <span className="text-base font-bold" style={{ color: '#ef9900' }}>
          {Number(job.pay).toLocaleString('fr-CM')} XAF
        </span>

        <div className="flex items-center gap-2">
          {job.employer_name && (
            <div className="flex items-center gap-1.5">
              <div
                className="w-6 h-6 rounded-full bg-surface-container overflow-hidden flex items-center justify-center text-[10px] font-bold shrink-0"
                style={{ color: '#00236f' }}
              >
                {job.employer_avatar
                  ? <img src={job.employer_avatar} alt="" className="w-full h-full object-cover" />
                  : job.employer_name.charAt(0)
                }
              </div>
              <span className="text-xs font-medium" style={{ color: '#444651' }}>
                {job.employer_name.split(' ')[0]}
              </span>
              {job.employer_rating && (
                <span className="flex items-center gap-0.5 text-xs">
                  <Star size={10} fill="#ef9900" color="#ef9900" />
                  <span style={{ color: '#0b1c30', fontWeight: 600 }}>
                    {Number(job.employer_rating).toFixed(1)}
                  </span>
                </span>
              )}
            </div>
          )}
          <ArrowRight
            size={14}
            className="opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-200"
            style={{ color: '#00236f' }}
          />
        </div>
      </div>
    </div>
  )

  if (linkTo) return <Link to={linkTo}>{content}</Link>
  return content
}
