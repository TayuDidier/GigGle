import { useEffect, useRef, useState, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getMessageHistory, sendMessage, subscribeToJobMessages, uploadChatImage } from '../api/messages.api'
import { queryKeys } from '../constants/queryKeys'

export function useMessages(jobId, senderId, partnerId = null) {
  const queryClient = useQueryClient()
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')
  const unsubRef = useRef(null)

  // Use conversation-scoped key when partnerId is known, else fall back to job-level
  const queryKey = partnerId
    ? queryKeys.messages.conversation(jobId, senderId, partnerId)
    : queryKeys.messages.forJob(jobId)

  const { data: messages = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => getMessageHistory(jobId, senderId, partnerId),
    enabled: !!jobId,
  })

  useEffect(() => {
    if (!jobId) return
    unsubRef.current = subscribeToJobMessages(jobId, () => {
      // Realtime event triggers a refetch — RLS + partnerId filter keeps privacy intact
      queryClient.invalidateQueries({ queryKey })
    })
    return () => { unsubRef.current?.() }
  }, [jobId, queryKey, queryClient])

  const send = useCallback(async (content) => {
    if (!content?.trim() || !jobId || !senderId) return
    setSending(true)
    setSendError('')
    try {
      const newMsg = await sendMessage({
        jobId,
        senderId,
        recipientId: partnerId,
        content: content.trim(),
      })
      queryClient.setQueryData(queryKey, (prev = []) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev
        return [...prev, newMsg]
      })
    } catch (err) {
      setSendError(err.message || 'Failed to send message.')
    } finally {
      setSending(false)
    }
  }, [jobId, senderId, partnerId, queryKey, queryClient])

  const sendImage = useCallback(async (file, caption = '') => {
    if (!file || !jobId || !senderId) return
    setSending(true)
    setSendError('')
    try {
      const imageUrl = await uploadChatImage(file)
      const newMsg = await sendMessage({
        jobId,
        senderId,
        recipientId: partnerId,
        content: caption.trim() || null,
        imageUrl,
      })
      queryClient.setQueryData(queryKey, (prev = []) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev
        return [...prev, newMsg]
      })
    } catch (err) {
      setSendError(err.message || 'Failed to send image.')
    } finally {
      setSending(false)
    }
  }, [jobId, senderId, partnerId, queryKey, queryClient])

  return { messages, isLoading, send, sendImage, sending, sendError }
}
