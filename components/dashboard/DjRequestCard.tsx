'use client'

import { memo } from 'react'
import { motion } from 'framer-motion'
import { GlowButton } from '@/components/GlowButton'
import { CheckCircle2, XCircle, PlayCircle } from 'lucide-react'
import type { DjSongRequest } from '@/lib/types'
import { RequestStatus } from '@/lib/types'

interface DjRequestCardProps {
  request: DjSongRequest
  onStatusUpdate: (id: number, status: RequestStatus) => void
}

function DjRequestCardInner({ request, onStatusUpdate }: DjRequestCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-lg p-4"
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{request.songTitle}</p>
          <p className="text-sm text-gray-400 truncate">{request.songArtist}</p>
          {request.message && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{request.message}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">Requested by {request.requesterName}</p>
        </div>
        <span
          className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium ${
            request.status === RequestStatus.ACCEPTED
              ? 'bg-green-500/20 text-green-400 border border-green-500/50'
              : request.status === RequestStatus.DECLINED
              ? 'bg-red-500/20 text-red-400 border border-red-500/50'
              : request.status === RequestStatus.PLAYED
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
              : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
          }`}
        >
          {request.status}
        </span>
      </div>
      {request.status === RequestStatus.PENDING && (
        <div className="flex gap-2 mt-3">
          <GlowButton
            onClick={() => onStatusUpdate(request.id, RequestStatus.ACCEPTED)}
            glowColor="green"
            size="sm"
            variant="outline"
            className="flex-1"
          >
            <CheckCircle2 className="w-4 h-4 mr-1" />
            Accept
          </GlowButton>
          <GlowButton
            onClick={() => onStatusUpdate(request.id, RequestStatus.DECLINED)}
            glowColor="red"
            size="sm"
            variant="outline"
            className="flex-1"
          >
            <XCircle className="w-4 h-4 mr-1" />
            Decline
          </GlowButton>
        </div>
      )}
      {request.status === RequestStatus.ACCEPTED && (
        <GlowButton
          onClick={() => onStatusUpdate(request.id, RequestStatus.PLAYED)}
          glowColor="blue"
          size="sm"
          variant="outline"
          className="w-full mt-3"
        >
          <PlayCircle className="w-4 h-4 mr-1" />
          Mark as Played
        </GlowButton>
      )}
    </motion.div>
  )
}

export const DjRequestCard = memo(DjRequestCardInner)
