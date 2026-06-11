import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useEffect, useState } from 'react'
import { ChevronLeft, AlertCircle, Lock } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { getJobById, updateJob } from '../../api/jobs.api'
import { queryKeys } from '../../constants/queryKeys'
import { CategoryBadge } from '../../components/jobs/CategoryBadge'

const schema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(150),
  description: z.string().min(20, 'Description must be at least 20 characters').max(2000),
  pay: z.number({ invalid_type_error: 'Pay is required' }).positive('Must be positive').int('Must be a whole number'),
  address_text: z.string().min(3, 'Enter a street address').max(200),
  timeline_days: z.preprocess(
    v => (v === '' || v === undefined || v === null ? undefined : Number(v)),
    z.number().int().positive().max(180).optional()
  ),
})

export default function EditJob() {
  const { id } = useParams()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [errorMsg, setErrorMsg] = useState('')

  const { data: job, isLoading } = useQuery({
    queryKey: queryKeys.jobs.byId(id),
    queryFn: () => getJobById(id),
  })

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      pay: '',
      address_text: '',
      timeline_days: '',
    },
  })

  // Pre-populate form when job loads
  useEffect(() => {
    if (job) {
      reset({
        title: job.title || '',
        description: job.description || '',
        pay: job.pay || '',
        address_text: job.address_text || '',
        timeline_days: job.timeline_days || '',
      })
    }
  }, [job, reset])

  const watchedDescription = watch('description')
  const watchedPay = watch('pay')

  const updateMutation = useMutation({
    mutationFn: (values) => updateJob(id, {
      title: values.title,
      description: values.description,
      pay: values.pay,
      address_text: values.address_text,
      timeline_days: values.timeline_days || null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(queryKeys.jobs.byId(id))
      queryClient.invalidateQueries(queryKeys.jobs.mine(profile?.id))
      navigate(`/employer/jobs/${id}`)
    },
    onError: (err) => {
      setErrorMsg(err.message || 'Failed to update job. Please try again.')
    },
  })

  const onSubmit = (values) => {
    setErrorMsg('')
    updateMutation.mutate(values)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#00236f', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="p-4">
        <div className="px-4 py-3 rounded-lg text-sm font-medium" style={{ background: '#fee2e2', color: '#ba1a1a' }}>
          Job not found.
        </div>
      </div>
    )
  }

  const isEditable = job.status === 'open'

  return (
    <div className="max-w-2xl mx-auto px-4 py-6" style={{ background: '#f8f9ff', minHeight: '100%' }}>
      {/* Header */}
      <div className="mb-6">
        <Link to={`/employer/jobs/${id}`} className="inline-flex items-center gap-1 text-sm font-medium mb-2" style={{ color: '#00236f' }}>
          <ChevronLeft size={16} />
          Back
        </Link>
        <h1 className="text-2xl font-bold" style={{ color: '#0b1c30' }}>Edit Job</h1>
      </div>

      {/* Lock warning */}
      <div className="flex items-start gap-2 mb-5 px-4 py-3 rounded-lg text-sm" style={{ background: '#fef3c7', color: '#b45309' }}>
        <Lock size={16} className="shrink-0 mt-0.5" />
        <span>
          You can only edit jobs that are still <strong>Open</strong>. Once a worker is selected, editing is locked.
        </span>
      </div>

      {!isEditable && (
        <div className="flex items-center gap-2 mb-4 px-4 py-3 rounded-lg text-sm font-medium" style={{ background: '#fee2e2', color: '#ba1a1a' }}>
          <AlertCircle size={16} />
          This job cannot be edited — it is {job.status}.
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 mb-4 px-4 py-3 rounded-lg text-sm font-medium" style={{ background: '#fee2e2', color: '#ba1a1a' }}>
          <AlertCircle size={16} />
          {errorMsg}
        </div>
      )}

      {/* Locked fields (read-only display) */}
      <div className="card mb-5">
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-1.5" style={{ color: '#444651' }}>
          <Lock size={14} /> Locked Fields (cannot be changed after posting)
        </h2>
        <div className="flex flex-wrap gap-3">
          <div>
            <p className="text-xs mb-1" style={{ color: '#444651' }}>Category</p>
            <CategoryBadge value={job.category} size="md" />
          </div>
          <div>
            <p className="text-xs mb-1" style={{ color: '#444651' }}>City</p>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium" style={{ background: '#f3f4f6', color: '#374151' }}>
              {job.city}
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Title */}
        <div className="card">
          <label className="label">Job Title *</label>
          <input
            {...register('title')}
            disabled={!isEditable}
            className="input-field disabled:opacity-60 disabled:cursor-not-allowed"
          />
          {errors.title && <p className="text-xs mt-1" style={{ color: '#ba1a1a' }}>{errors.title.message}</p>}
        </div>

        {/* Description */}
        <div className="card">
          <label className="label">Description *</label>
          <textarea
            {...register('description')}
            disabled={!isEditable}
            rows={5}
            className="input-field resize-none disabled:opacity-60 disabled:cursor-not-allowed"
          />
          <div className="flex justify-between mt-1">
            {errors.description
              ? <p className="text-xs" style={{ color: '#ba1a1a' }}>{errors.description.message}</p>
              : <span />
            }
            <p className="text-xs" style={{ color: '#444651' }}>{(watchedDescription || '').length}/2000</p>
          </div>
        </div>

        {/* Pay */}
        <div className="card">
          <label className="label">Pay (XAF) *</label>
          <div className="relative">
            <input
              {...register('pay', { valueAsNumber: true })}
              type="number"
              min="1"
              step="1"
              disabled={!isEditable}
              className="input-field pr-14 disabled:opacity-60 disabled:cursor-not-allowed"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold" style={{ color: '#444651' }}>XAF</span>
          </div>
          {errors.pay && <p className="text-xs mt-1" style={{ color: '#ba1a1a' }}>{errors.pay.message}</p>}
          {watchedPay > 0 && !isNaN(watchedPay) && (
            <div className="mt-3 px-4 py-2 rounded-lg" style={{ background: '#e5eeff' }}>
              <p className="text-lg font-bold" style={{ color: '#ef9900' }}>
                {Number(watchedPay).toLocaleString('fr-CM')} XAF
              </p>
            </div>
          )}
        </div>

        {/* Address */}
        <div className="card">
          <label className="label">Street Address *</label>
          <input
            {...register('address_text')}
            disabled={!isEditable}
            className="input-field disabled:opacity-60 disabled:cursor-not-allowed"
          />
          {errors.address_text && <p className="text-xs mt-1" style={{ color: '#ba1a1a' }}>{errors.address_text.message}</p>}
        </div>

        {/* Timeline */}
        <div className="card">
          <label className="label">Timeline (days) <span style={{ color: '#444651', fontWeight: 400 }}>— optional</span></label>
          <input
            {...register('timeline_days')}
            type="number"
            min="1"
            max="180"
            disabled={!isEditable}
            className="input-field disabled:opacity-60 disabled:cursor-not-allowed"
            placeholder="e.g. 1, 7, 30"
          />
          {errors.timeline_days && <p className="text-xs mt-1" style={{ color: '#ba1a1a' }}>{errors.timeline_days.message}</p>}
        </div>

        {/* Submit */}
        {isEditable && (
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="btn-primary w-full"
          >
            {updateMutation.isPending ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving…
              </span>
            ) : 'Save Changes'}
          </button>
        )}
      </form>
    </div>
  )
}
