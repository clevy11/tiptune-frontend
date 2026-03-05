'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { djApi } from '@/lib/api'
import { GlassCard } from '@/components/GlassCard'
import { GlowButton } from '@/components/GlowButton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Link2, Plus, Trash2 } from 'lucide-react'
import type { ProfileLinkResponse, ProfileLinkRequest } from '@/lib/types'
import { ProfileLinkType } from '@/lib/types'

const LINK_TYPE_OPTIONS: { value: ProfileLinkType; label: string }[] = [
  { value: ProfileLinkType.INSTAGRAM, label: 'Instagram' },
  { value: ProfileLinkType.MIXCLOUD, label: 'Mixcloud' },
  { value: ProfileLinkType.WEBSITE, label: 'Website' },
  { value: ProfileLinkType.CUSTOM, label: 'Custom' },
]

export function DjProfileLinksEditor() {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<ProfileLinkRequest | null>(null)
  const [newLink, setNewLink] = useState<ProfileLinkRequest>({
    linkType: ProfileLinkType.INSTAGRAM,
    url: '',
    displayOrder: 0,
  })

  const { data: links = [], isLoading } = useQuery({
    queryKey: ['dj-profile-links'],
    queryFn: () => djApi.getProfileLinks(),
  })

  const updateMutation = useMutation({
    mutationFn: (payload: ProfileLinkRequest[]) => djApi.updateProfileLinks(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dj-profile-links'] })
      setEditing(null)
      setNewLink({ linkType: ProfileLinkType.INSTAGRAM, url: '', displayOrder: 0 })
    },
  })

  const handleAdd = () => {
    const url = newLink.url?.trim()
    if (!url) return
    const payload: ProfileLinkRequest[] = [
      ...links.map((l) => ({ id: l.id, linkType: l.linkType, label: l.label, url: l.url, displayOrder: l.displayOrder })),
      { linkType: newLink.linkType, label: newLink.linkType === ProfileLinkType.CUSTOM ? newLink.label : undefined, url, displayOrder: links.length },
    ]
    updateMutation.mutate(payload)
  }

  const handleRemove = (id: number) => {
    const payload = links.filter((l) => l.id !== id).map((l) => ({ id: l.id, linkType: l.linkType, label: l.label, url: l.url, displayOrder: l.displayOrder }))
    updateMutation.mutate(payload)
  }

  const handleSaveEdit = () => {
    if (!editing || !editing.url?.trim()) return
    const payload = links.map((l) =>
      l.id === editing.id
        ? { id: l.id, linkType: editing.linkType, label: editing.linkType === ProfileLinkType.CUSTOM ? editing.label : undefined, url: editing.url.trim(), displayOrder: l.displayOrder }
        : { id: l.id, linkType: l.linkType, label: l.label, url: l.url, displayOrder: l.displayOrder }
    )
    updateMutation.mutate(payload)
  }

  const displayLabel = (link: ProfileLinkResponse) => {
    if (link.linkType === ProfileLinkType.CUSTOM && link.label) return link.label
    return LINK_TYPE_OPTIONS.find((o) => o.value === link.linkType)?.label ?? link.linkType
  }

  return (
    <GlassCard noEnterAnimation glow="blue" className="p-4">
      <h3 className="font-semibold text-white flex items-center gap-2 mb-3">
        <Link2 className="w-4 h-4 text-blue-400" />
        Profile links
      </h3>
      <p className="text-xs text-gray-400 mb-3">These appear on your event page so visitors can follow you (e.g. Instagram, Mixcloud, website).</p>
      {isLoading ? (
        <p className="text-sm text-gray-400">Loading...</p>
      ) : (
        <div className="space-y-3">
          {links.map((link) => (
            <div key={link.id} className="flex items-center gap-2 rounded-lg bg-white/5 p-2">
              {editing?.id === link.id ? (
                <>
                  <select
                    value={editing.linkType}
                    onChange={(e) => setEditing({ ...editing, linkType: e.target.value as ProfileLinkType })}
                    className="flex h-9 rounded border border-white/20 bg-white/10 px-2 text-sm text-white"
                  >
                    {LINK_TYPE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  {editing.linkType === ProfileLinkType.CUSTOM && (
                    <Input
                      placeholder="Label"
                      value={editing.label ?? ''}
                      onChange={(e) => setEditing({ ...editing, label: e.target.value })}
                      className="flex-1 min-w-0 bg-white/10 text-sm"
                    />
                  )}
                  <Input
                    placeholder="URL"
                    value={editing.url}
                    onChange={(e) => setEditing({ ...editing, url: e.target.value })}
                    className="flex-1 min-w-0 bg-white/10 text-sm"
                  />
                  <Button size="sm" onClick={handleSaveEdit} disabled={updateMutation.isPending || !editing.url?.trim()}>
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <span className="text-sm font-medium text-gray-200 truncate flex-1 min-w-0">{displayLabel(link)}</span>
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 truncate max-w-[120px]" title={link.url}>
                    {link.url.replace(/^https?:\/\//, '').slice(0, 20)}…
                  </a>
                  <Button size="sm" variant="ghost" className="shrink-0 text-gray-400" onClick={() => setEditing({ id: link.id, linkType: link.linkType, label: link.label, url: link.url, displayOrder: link.displayOrder })}>
                    Edit
                  </Button>
                  <Button size="sm" variant="ghost" className="shrink-0 text-red-400" onClick={() => handleRemove(link.id)} disabled={updateMutation.isPending}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-2 rounded-lg bg-white/5 p-2">
            <select
              value={newLink.linkType}
              onChange={(e) => setNewLink({ ...newLink, linkType: e.target.value as ProfileLinkType })}
              className="flex h-9 rounded border border-white/20 bg-white/10 px-2 text-sm text-white"
            >
              {LINK_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            {newLink.linkType === ProfileLinkType.CUSTOM && (
              <Input
                placeholder="Label (e.g. Mixtape)"
                value={newLink.label ?? ''}
                onChange={(e) => setNewLink({ ...newLink, label: e.target.value })}
                className="flex-1 min-w-[100px] bg-white/10 text-sm"
              />
            )}
            <Input
              placeholder="URL"
              value={newLink.url}
              onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
              className="flex-1 min-w-[120px] bg-white/10 text-sm"
            />
            <GlowButton noMotion size="sm" glowColor="blue" onClick={handleAdd} disabled={updateMutation.isPending || !newLink.url?.trim()}>
              <Plus className="w-4 h-4 mr-1" />
              Add
            </GlowButton>
          </div>
        </div>
      )}
    </GlassCard>
  )
}
