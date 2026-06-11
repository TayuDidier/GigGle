import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { ChevronLeft, AlertCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { createJob } from '../../api/jobs.api'
import { CATEGORIES } from '../../constants/categories'
import { CITIES } from '../../constants/cities'

const schema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(150),
  category: z.enum(
    ['cleaning', 'tutoring', 'repairs', 'caregiving', 'delivery', 'event_labor', 'digital_services', 'gardening', 'moving', 'cooking', 'other'],
    { errorMap: () => ({ message: 'Select a category' }) }
  ),
  description: z.string().min(20, 'Description must be at least 20 characters').max(2000),
  pay: z.number({ invalid_type_error: 'Pay is required' }).positive('Must be positive').int('Must be a whole number'),
  address_text: z.string().min(3, 'Enter a street address').max(200),
  city: z.string().min(1, 'Select a city'),
  timeline_days: z.preprocess(
    v => (v === '' || v === undefined || v === null ? undefined : Number(v)),
    z.number().int().positive().max(180).optional()
  ),
})

export default function PostJob() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [errorMsg, setErrorMsg] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      category: undefined,
      description: '',
      pay: '',
      address_text: '',
      city: '',
      timeline_days: '',
    },
  })

  const watchedCategory = watch('category')
  const watchedDescription = watch('description')
  const watchedPay = watch('pay')
  const watchedCity = watch('city')

  const createJobMutation = useMutation({
    mutationFn: (values) => {
      const city = CITIES.find(c => c.name === values.city) || CITIES[0]
      return createJob({
        employer_id: profile.id,
        title: values.title,
        category: values.category,
        description: values.description,
        pay: values.pay,
        address_text: values.address_text,
        city: values.city,
        lat: city.lat,
        lng: city.lng,
        timeline_days: values.timeline_days || null,
      })
    },
    onSuccess: (newJob) => {
      navigate(`/employer/jobs/${newJob.id}`)
    },
    onError: (err) => {
      setErrorMsg(err.message || 'Failed to create job. Please try again.')
    },
  })

  const onSubmit = (values) => {
    setErrorMsg('')
    createJobMutation.mutate(values)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6" style={{ background: '#f8f9ff', minHeight: '100%' }}>
      {/* Header */}
      <div className="mb-6">
        <Link to="/employer/dashboard" className="inline-flex items-center gap-1 text-sm font-medium mb-2" style={{ color: '#00236f' }}>
          <ChevronLeft size={16} />
          Back
        </Link>
        <h1 className="text-2xl font-bold" style={{ color: '#0b1c30' }}>Post a New Job</h1>
        <p className="text-sm mt-1" style={{ color: '#444651' }}>Fill in the details to attract the right worker.</p>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 mb-4 px-4 py-3 rounded-lg text-sm font-medium" style={{ background: '#fee2e2', color: '#ba1a1a' }}>
          <AlertCircle size={16} />
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Title */}
        <div className="card">
          <label className="label">Job Title *</label>
          <input
            {...register('title')}
            className="input-field"
            placeholder="e.g. House cleaner needed for 3-bedroom apartment"
          />
          {errors.title && <p className="text-xs mt-1" style={{ color: '#ba1a1a' }}>{errors.title.message}</p>}
        </div>

        {/* Category */}
        <div className="card">
          <label className="label">Category *</label>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-1">
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setValue('category', cat.value, { shouldValidate: true })}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-center transition-all ${
                  watchedCategory === cat.value ? 'border-primary bg-surface-container' : 'border-outline-variant bg-white hover:border-primary/50'
                }`}
                style={watchedCategory === cat.value ? { borderColor: '#00236f', background: '#e5eeff' } : { borderColor: '#c5c5d3' }}
              >
                <span className="text-2xl">{cat.emoji}</span>
                <span className="text-xs font-medium leading-tight" style={{ color: watchedCategory === cat.value ? '#00236f' : '#444651' }}>
                  {cat.label}
                </span>
              </button>
            ))}
          </div>
          {errors.category && <p className="text-xs mt-2" style={{ color: '#ba1a1a' }}>{errors.category.message}</p>}
        </div>

        {/* Description */}
        <div className="card">
          <label className="label">Description *</label>
          <textarea
            {...register('description')}
            rows={5}
            className="input-field resize-none"
            placeholder="Describe the job in detail: what needs to be done, when, any requirements…"
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
              className="input-field pr-14"
              placeholder="e.g. 10000"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold" style={{ color: '#444651' }}>XAF</span>
          </div>
          {errors.pay && <p className="text-xs mt-1" style={{ color: '#ba1a1a' }}>{errors.pay.message}</p>}
          <p className="text-xs mt-1" style={{ color: '#444651' }}>
            MTN MoMo / Orange Money payment confirmed after job completion.
          </p>

          {/* Pay preview */}
          {watchedPay > 0 && !isNaN(watchedPay) && (
            <div className="mt-3 px-4 py-3 rounded-lg" style={{ background: '#e5eeff' }}>
              <p className="text-xs mb-1" style={{ color: '#444651' }}>Preview:</p>
              <p className="text-xl font-bold" style={{ color: '#ef9900' }}>
                {Number(watchedPay).toLocaleString('fr-CM')} XAF
              </p>
            </div>
          )}
        </div>

        {/* Location */}
        <div className="card">
          <label className="label">City *</label>
          <select {...register('city')} className="input-field">
            <option value="">Select a city</option>
            {CITIES.map(c => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
          {errors.city && <p className="text-xs mt-1" style={{ color: '#ba1a1a' }}>{errors.city.message}</p>}

          <label className="label mt-4">Street Address *</label>
          <input
            {...register('address_text')}
            className="input-field"
            placeholder="e.g. Rue de la Paix, Akwa"
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
            className="input-field"
            placeholder="e.g. 1, 7, 30"
          />
          {errors.timeline_days && <p className="text-xs mt-1" style={{ color: '#ba1a1a' }}>{errors.timeline_days.message}</p>}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={createJobMutation.isPending}
          className="btn-primary w-full"
        >
          {createJobMutation.isPending ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Posting…
            </span>
          ) : 'Post Job'}
        </button>
      </form>
    </div>
  )
}
