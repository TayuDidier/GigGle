export const queryKeys = {
  auth: { profile: () => ['auth', 'profile'] },
  jobs: {
    all: () => ['jobs'],
    nearby: (p) => ['jobs', 'nearby', p],
    byId: (id) => ['jobs', id],
    mine: (id) => ['jobs', 'mine', id],
    activeWorker: (id) => ['jobs', 'active-worker', id],
  },
  applications: {
    forJob: (id) => ['applications', 'job', id],
    forWorker: (id) => ['applications', 'worker', id],
  },
  messages: {
    forJob: (id) => ['messages', 'job', id],
    conversation: (jobId, myId, partnerId) => ['messages', 'conv', jobId, myId, partnerId],
  },
  ratings: { forUser: (id) => ['ratings', 'user', id] },
  payments: { forJob: (id) => ['payments', 'job', id] },
  profiles: { byId: (id) => ['profiles', id] },
  workers: { nearby: (p) => ['workers', 'nearby', p] },
  admin: {
    analytics: () => ['admin', 'analytics'],
    users: (p) => ['admin', 'users', p],
    reports: () => ['admin', 'reports'],
  },
}
