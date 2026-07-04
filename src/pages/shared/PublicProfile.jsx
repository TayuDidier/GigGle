import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Star, MapPin, Flag, ChevronLeft } from 'lucide-react'
import { getPublicProfileById } from '../../api/profiles.api'
import { getRatingsForUser } from '../../api/ratings.api'
import { queryKeys } from '../../constants/queryKeys'
import { useAuth } from '../../contexts/AuthContext'
import { VerifiedBadge } from '../../components/VerifiedBadge'
import { ICON_SIZE } from '../../constants/iconTokens'

function StarDisplay({ value, count }) {
  const filled = Math.round(value || 0)
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} size={16}
          fill={s <= filled ? '#ef9900' : 'none'}
          color={s <= filled ? '#ef9900' : '#c5c5d3'}
        />
      ))}
      {value != null && (
        <span className="text-sm font-semibold ml-1" style={{ color: '#0b1c30' }}>
          {Number(value).toFixed(1)}
        </span>
      )}
      {count != null && (
        <span className="text-sm ml-0.5" style={{ color: '#888' }}>({count})</span>
      )}
    </div>
  )
}

function RatingCard({ rating }) {
  const date = new Date(rating.created_at).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  return (
    <div className="card">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
          style={{ background: '#e5eeff', color: '#00236f' }}>
          {rating.rater?.avatar_url
            ? <img src={rating.rater.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
            : rating.rater?.full_name?.charAt(0) || '?'
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between flex-wrap gap-1">
            <p className="text-sm font-semibold" style={{ color: '#0b1c30' }}>
              {rating.rater?.full_name || 'Anonymous'}
            </p>
            <span className="text-xs" style={{ color: '#aaa' }}>{date}</span>
          </div>
          <div className="flex items-center gap-1 mt-0.5 mb-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} size={13}
                fill={s <= rating.score ? '#ef9900' : 'none'}
                color={s <= rating.score ? '#ef9900' : '#c5c5d3'}
              />
            ))}
          </div>
          {rating.review_text && (
            <p className="text-sm leading-relaxed" style={{ color: '#444651' }}>"{rating.review_text}"</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function PublicProfile() {
  const { id } = useParams()
  const { profile: myProfile } = useAuth()

  const { data: profile, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: queryKeys.profiles.public(id),
    queryFn: () => getPublicProfileById(id),
    enabled: !!id,
  })

  const { data: ratings = [], isLoading: ratingsLoading } = useQuery({
    queryKey: queryKeys.ratings.forUser(id),
    queryFn: () => getRatingsForUser(id),
    enabled: !!id,
  })

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center py-24" style={{ background: '#f8f9ff', minHeight: '100%' }}>
        <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#00236f', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (profileError || !profile) {
    return (
      <div className="max-w-lg mx-auto px-4 py-10" style={{ background: '#f8f9ff', minHeight: '100%' }}>
        <p className="text-sm" style={{ color: '#ba1a1a' }}>{profileError?.message || 'Profile not found.'}</p>
      </div>
    )
  }

  const backTo = myProfile?.role === 'worker' ? '/worker/browse'
    : myProfile?.role === 'admin' ? '/admin/users'
    : '/employer/dashboard'
  const isOwnProfile = myProfile?.id === profile.id

  return (
    <div className="px-4 py-6" style={{ background: '#f8f9ff', minHeight: '100%' }}>
      <div className="max-w-lg mx-auto">
        {/* Back */}
        <Link to={backTo} className="inline-flex items-center gap-1 text-sm font-medium mb-5" style={{ color: '#00236f' }}>
          <ChevronLeft size={16} /> Back
        </Link>

        {/* Profile card */}
        <div className="card mb-4">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold shrink-0 overflow-hidden"
              style={{ background: '#e5eeff', color: '#00236f' }}>
              {profile.avatar_url
                ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                : profile.full_name?.charAt(0)
              }
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold truncate" style={{ color: '#0b1c30' }}>{profile.full_name}</h1>
                <VerifiedBadge status={profile.verification_status} />
              </div>
              <p className="text-sm capitalize mb-1" style={{ color: '#ef9900', fontWeight: 600 }}>
                {profile.role}
              </p>
              {profile.city && (
                <div className="flex items-center gap-1 text-sm mb-2" style={{ color: '#666' }}>
                  <MapPin size={ICON_SIZE.metadata} /> {profile.city}
                </div>
              )}
              {profile.rating_count > 0
                ? <StarDisplay value={profile.rating_average} count={profile.rating_count} />
                : <p className="text-sm" style={{ color: '#aaa' }}>No ratings yet</p>
              }
            </div>
          </div>

          {profile.bio && (
            <p className="text-sm mt-4 leading-relaxed" style={{ color: '#444651' }}>{profile.bio}</p>
          )}

          {!isOwnProfile && (
            <div className="mt-4 pt-4 border-t" style={{ borderColor: '#e4e4ef' }}>
              <Link
                to={`/report/${profile.id}`}
                className="inline-flex items-center gap-1.5 text-sm"
                style={{ color: '#ba1a1a' }}
              >
                <Flag size={14} /> Report this user
              </Link>
            </div>
          )}
        </div>

        {/* Ratings section */}
        <div>
          <h2 className="text-base font-semibold mb-3" style={{ color: '#0b1c30' }}>
            Reviews {ratings.length > 0 && `(${ratings.length})`}
          </h2>

          {ratingsLoading && (
            <div className="flex justify-center py-6">
              <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#00236f', borderTopColor: 'transparent' }} />
            </div>
          )}

          {!ratingsLoading && ratings.length === 0 && (
            <div className="card text-center py-8">
              <p className="text-sm" style={{ color: '#888' }}>No reviews yet.</p>
            </div>
          )}

          <div className="space-y-3">
            {ratings.map((r) => <RatingCard key={r.id} rating={r} />)}
          </div>
        </div>
      </div>
    </div>
  )
}
