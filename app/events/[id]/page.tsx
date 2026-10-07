'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { eventApi, songRequestApi } from '@/lib/api'
import { QRDownload } from '@/components/export/QRDownload'
import { sanitizeEventNameForFile, formatInRwanda } from '@/lib/utils'
import { websocketService } from '@/lib/websocket'
import { getCurrentUserId } from '@/lib/auth'
import type { SongRequest } from '@/lib/types'
import { RequestStatus } from '@/lib/types'
import Link from 'next/link'

export default function EventDetailPage() {
  const params = useParams()
  const eventId = parseInt(params.id as string)
  const queryClient = useQueryClient()

  const { data: event, isLoading, isError, error } = useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      try {
        return await eventApi.getById(eventId)
      } catch (err) {
        console.error('Failed to fetch event:', err)
        throw err
      }
    },
    retry: 1,
  })

  const { data: requests } = useQuery<SongRequest[]>({
    queryKey: ['requests', eventId],
    queryFn: async () => {
      try {
        return await songRequestApi.getByEvent(eventId)
      } catch (err) {
        console.error('Failed to fetch requests:', err)
        return []
      }
    },
    enabled: !!event && !isError,
  })

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!event) return

    websocketService.connect()
    const handleNewRequest = (request: SongRequest) => {
      queryClient.setQueryData(['requests', eventId], (old: SongRequest[] = []) => {
        const exists = old.some((r) => r.id === request.id)
        if (exists) {
          return old.map((r) => (r.id === request.id ? request : r))
        }
        return [request, ...old]
      })
    }

    // Wait a bit for connection to be established
    const timeoutId = setTimeout(() => {
      websocketService.subscribeToEventRequests(eventId, handleNewRequest)
    }, 500)

    return () => {
      clearTimeout(timeoutId)
      websocketService.unsubscribeFromEventRequests(eventId, handleNewRequest)
    }
  }, [event, eventId, queryClient])

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: RequestStatus }) =>
      songRequestApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests', eventId] })
    },
  })

  const handleStatusUpdate = (id: number, status: RequestStatus) => {
    updateStatusMutation.mutate({ id, status })
  }

  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const qrUrlRef = useRef<string | null>(null)
  const currentUserId = getCurrentUserId()
  const isOwner = !!event && !!currentUserId && event.createdBy.id === currentUserId
  useEffect(() => {
    if (!event || !currentUserId || event.createdBy.id !== currentUserId) return
    eventApi.getQRCodeImage(eventId, typeof window !== 'undefined' ? window.location.origin : '').then((u) => {
      qrUrlRef.current = u
      setQrCodeUrl(u)
    }).catch(() => setQrCodeUrl(null))
    return () => {
      if (qrUrlRef.current) {
        URL.revokeObjectURL(qrUrlRef.current)
        qrUrlRef.current = null
      }
    }
  }, [event, currentUserId, eventId])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <div className="text-xl text-gray-300">Loading event...</div>
      </div>
    )
  }

  if (isError || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <div className="max-w-md w-full p-6">
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-8 text-center">
            <h2 className="text-2xl font-bold mb-4 text-red-400">Event Not Found</h2>
            <p className="text-gray-300 mb-6">
              {error instanceof Error ? error.message : 'The event you\'re looking for doesn\'t exist.'}
            </p>
            <Link href="/events">
              <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                Back to Events
              </button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{event.name}</h1>
              {event.description && (
                <p className="text-gray-600 mb-4 text-sm sm:text-base">{event.description}</p>
              )}
              <div className="text-xs sm:text-sm text-gray-500">
                <p>
                  {formatInRwanda(event.startTime)} -{' '}
                  {formatInRwanda(event.endTime)}
                </p>
                <p className="mt-1">By: {event.createdBy.name}</p>
              </div>
            </div>
            <div className="flex flex-col sm:items-end gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 w-fit">
                {event.status}
              </span>
              {isOwner && qrCodeUrl && (
                <div className="flex flex-col items-start sm:items-end gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrCodeUrl} alt="Event QR Code" className="w-24 h-24 sm:w-28 sm:h-28 rounded-lg bg-white border border-gray-200" />
                  <QRDownload
                    qrDataUrl={qrCodeUrl}
                    filenameBase={`${sanitizeEventNameForFile(event.name)}-qr-code`}
                    pdfTitle="Event QR Code"
                    pdfSubtitle={event.name}
                  />
                </div>
              )}
              {isOwner && !qrCodeUrl && (
                <a
                  href={eventApi.getQRCode(eventId, typeof window !== 'undefined' ? window.location.origin : '')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-800 text-sm min-h-[44px] flex items-center"
                >
                  View QR Code
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Song Requests</h2>
          {requests && requests.length > 0 ? (
            <div className="space-y-4">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-lg">
                        {request.song.title} - {request.song.artist}
                      </p>
                      {request.song.album && (
                        <p className="text-sm text-gray-500">
                          Album: {request.song.album}
                        </p>
                      )}
                      {request.message && (
                        <p className="text-sm text-gray-600 mt-1">
                          {request.message}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        Requested by: {request.user.name} •{' '}
                        {formatInRwanda(request.createdAt)}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {request.status === 'PENDING' && 'Waiting for the DJ to read the room'}
                        {request.status === 'ACCEPTED' && 'Added to the setlist'}
                        {request.status === 'PLAYED' && 'Got the crowd moving'}
                        {request.status === 'DECLINED' && 'Removed from the queue'}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${request.status === 'ACCEPTED'
                          ? 'bg-green-100 text-green-800'
                          : request.status === 'DECLINED'
                            ? 'bg-red-100 text-red-800'
                            : request.status === 'PLAYED'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                        }`}
                    >
                      {request.status}
                    </span>
                  </div>
                  {isOwner && (
                    <div className="flex gap-2 mt-3">
                      {request.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() =>
                              handleStatusUpdate(request.id, RequestStatus.ACCEPTED)
                            }
                            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() =>
                              handleStatusUpdate(request.id, RequestStatus.DECLINED)
                            }
                            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                          >
                            Decline
                          </button>
                        </>
                      )}
                      {request.status === 'ACCEPTED' && (
                        <button
                          onClick={() =>
                            handleStatusUpdate(request.id, RequestStatus.PLAYED)
                          }
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                        >
                          Mark as Played
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No song requests yet</p>
              <Link
                href={`/event/${event.accessToken}`}
                className="mt-4 inline-block text-indigo-600 hover:text-indigo-800"
              >
                Request a song
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
