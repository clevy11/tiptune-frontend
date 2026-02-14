'use client'

import { motion } from 'framer-motion'
import { Music, X, CheckCircle2, XCircle } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNotificationStore } from '@/store/notificationStore'
import { songRequestApi } from '@/lib/api'
import type { Notification } from '@/lib/types'
import { RequestStatus } from '@/lib/types'
import { cn } from '@/lib/utils'
import { GlowButton } from '@/components/GlowButton'

interface NotificationItemProps {
  notification: Notification
  index: number
}

export function NotificationItem({ notification, index }: NotificationItemProps) {
  const { markAsRead, removeNotification } = useNotificationStore()
  const queryClient = useQueryClient()
  const isRead = notification.isRead
  const songRequest = notification.songRequest
  const isPending = songRequest && songRequest.status === RequestStatus.PENDING
  const eventId = songRequest?.event?.id

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: RequestStatus }) =>
      songRequestApi.updateStatus(id, status),
    onSuccess: (_, { id }) => {
      removeNotification(notification.id)
      queryClient.invalidateQueries({ queryKey: ['dj-requests'] })
      if (eventId) {
        queryClient.invalidateQueries({ queryKey: ['dj-requests', eventId] })
      }
    },
  })

  const handleAccept = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!songRequest) return
    updateStatusMutation.mutate({ id: songRequest.id, status: RequestStatus.ACCEPTED })
  }

  const handleDecline = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!songRequest) return
    updateStatusMutation.mutate({ id: songRequest.id, status: RequestStatus.DECLINED })
  }

  const handleClick = () => {
    if (!isRead) {
      markAsRead(notification.id)
    }
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    removeNotification(notification.id)
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -50, scale: 0.9 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      onClick={handleClick}
      className={cn(
        'group relative glass rounded-xl p-4 cursor-pointer transition-all duration-300',
        'hover:bg-white/10 hover:scale-[1.02]',
        !isRead && 'border-l-4 border-l-purple-500 bg-purple-500/10',
        isRead && 'opacity-70'
      )}
    >
      {!isRead && (
        <div className="absolute inset-0 rounded-xl glow-purple opacity-30 blur-sm pointer-events-none" />
      )}

      <div className="relative flex items-start gap-3">
        <motion.div
          animate={!isRead ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
          className={cn(
            'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
            !isRead
              ? 'bg-gradient-to-br from-purple-500 to-pink-500 glow-purple'
              : 'bg-gray-600/50'
          )}
        >
          <Music className="w-5 h-5 text-white" />
        </motion.div>

        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-medium', !isRead ? 'text-white' : 'text-gray-400')}>
            {notification.message}
          </p>
          {songRequest && (
            <>
              <div className="mt-2 flex items-center gap-2 text-xs text-gray-400 flex-wrap">
                <span className="font-medium">{songRequest.song.title}</span>
                <span>•</span>
                <span>{songRequest.song.artist}</span>
              </div>
              {songRequest.user?.name && (
                <p className="text-xs text-gray-500 mt-1">From: {songRequest.user.name}</p>
              )}
              {songRequest.event?.name && (
                <p className="text-xs text-gray-500">Event: {songRequest.event.name}</p>
              )}
              <div className="mt-2 flex items-center gap-2">
                <span
                  className={cn(
                    'px-2 py-0.5 rounded text-xs font-medium',
                    songRequest.status === RequestStatus.PENDING && 'bg-yellow-500/20 text-yellow-400'
                  )}
                >
                  {songRequest.status}
                </span>
              </div>
            </>
          )}
          <p className="text-xs text-gray-500 mt-1">
            {new Date(notification.createdAt).toLocaleTimeString()}
          </p>

          {/* Accept / Decline — only for pending song requests; remove only when action taken */}
          {isPending && songRequest && (
            <div className="flex gap-2 mt-3 flex-wrap">
              <GlowButton
                size="sm"
                glowColor="green"
                variant="outline"
                onClick={handleAccept}
                disabled={updateStatusMutation.isPending}
                className="min-h-[44px] touch-manipulation flex-1 min-w-[100px]"
              >
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Accept
              </GlowButton>
              <GlowButton
                size="sm"
                glowColor="red"
                variant="outline"
                onClick={handleDecline}
                disabled={updateStatusMutation.isPending}
                className="min-h-[44px] touch-manipulation flex-1 min-w-[100px]"
              >
                <XCircle className="w-4 h-4 mr-1" />
                Decline
              </GlowButton>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleRemove}
            className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors"
            aria-label="Remove notification"
          >
            <X className="w-4 h-4 text-gray-400 hover:text-red-400" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}
