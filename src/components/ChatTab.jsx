import { memo, useCallback, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { Button, Input } from '@/components/ui'
import { linkifyText } from '@/utils/linkify.jsx'
import AttachmentPreview from './AttachmentPreview.jsx'
import { PaperClipIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import useChat from '@/hooks/useChat.js'

function ChatTab({ selected = null, userEmail }) {
  const objectId = selected?.id || null
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  useEffect(() => {
    const id = setTimeout(() => setSearchQuery(searchInput), 300)
    return () => clearTimeout(id)
  }, [searchInput])
  const {
    messages,
    hasMore,
    loadMore,
    newMessage,
    setNewMessage,
    sending,
    file,
    setFile,
    filePreview,
    handleSend,
    handleKeyDown,
    fileInputRef,
    scrollRef,
    loadError,
  } = useChat({ objectId, userEmail, search: searchQuery })

  const handleFileChange = useCallback(
    (e) => setFile(e.target.files[0]),
    [setFile],
  )

  const handleMessageChange = useCallback(
    (e) => setNewMessage(e.target.value),
    [setNewMessage],
  )