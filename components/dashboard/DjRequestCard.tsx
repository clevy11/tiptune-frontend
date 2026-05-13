'use client'

import { memo } from 'react'
import { GlowButton } from '@/components/GlowButton'
import { CheckCircle2, XCircle, PlayCircle, User, Banknote } from 'lucide-react'
import type { DjSongRequest } from '@/lib/types'
import { RequestStatus } from '@/lib/types'

interface DjRequestCardProps {
  request: DjSongRequest
  onStatusUpdate: (id: number, status: RequestStatus) => void
}

function DjRequestCardInner({ request, onStatusUpdate }: DjRequestCardProps) {
  const tipAmount = Number(request.tipAmount) || 0
  const shoutoutName = request.payerName?.trim() || request.requesterName?.trim()

  return (
    <div className="glass rounded-lg p-4 transition-colors hover:bg-white/5">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{request.songTitle}</p>
          <p className="text-sm text-gray-400 truncate">{request.songArtist}</p>
          {tipAmount > 0 && (
            <div className="mt-3 rounded-lg border border-green-400/40 bg-green-500/10 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2 py-1 text-xs font-semibold uppercase tracking-normal text-white">
                  <User className="h-3.5 w-3.5 text-green-300" />
                  {"Payer's name"}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-green-500/20 px-2 py-1 text-xs font-semibold text-green-200">
                  <Banknote className="h-3 w-3" />
                  {tipAmount.toLocaleString()} RWF
                </span>
              </div>
              {shoutoutName && (
                <p className="mt-2 text-2xl font-bold leading-tight text-white">{shoutoutName}</p>
              )}
              {request.payerPhone && (
                <p className="mt-1 text-xs text-gray-400">{request.payerPhone}</p>
              )}
            </div>
          )}
          {request.message && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{request.message}</p>
          )}
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
          <GlowButton noMotion
            onClick={() => onStatusUpdate(request.id, RequestStatus.ACCEPTED)}
            glowColor="green"
            size="sm"
            variant="outline"
            className="flex-1"
          >
            <CheckCircle2 className="w-4 h-4 mr-1" />
            Accept
          </GlowButton>
          <GlowButton noMotion
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
        <GlowButton noMotion
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
    </div>
  )
}

export const DjRequestCard = memo(DjRequestCardInner)
