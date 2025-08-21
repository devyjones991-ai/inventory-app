import React, { useState, useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'

import usePersistedForm from '../hooks/usePersistedForm'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { supabase } from '../supabaseClient'
import { handleSupabaseError } from '../utils/handleSupabaseError'
import HardwareCard from './HardwareCard'
import ChatTab from './ChatTab'
import TasksTab from './TasksTab'
import { PlusIcon, ChatBubbleOvalLeftIcon } from '@heroicons/react/24/outline'
import { linkifyText } from '../utils/linkify'
import { toast } from 'react-hot-toast'
import ConfirmModal from './ConfirmModal'
import Spinner from './Spinner'
import ErrorMessage from './ErrorMessage'
import { useHardware } from '../hooks/useHardware'
import { useChatMessages } from '../hooks/useChatMessages'
import { useObjects } from '../hooks/useObjects'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { apiBaseUrl, isApiConfigured } from '../apiConfig'

const TAB_KEY = (objectId) => `tab_${objectId}`
const HW_MODAL_KEY = (objectId) => `hwModal_${objectId}`
const HW_FORM_KEY = (objectId) => `hwForm_${objectId}`
const PAGE_SIZE = 20

function InventoryTabs({ selected, onUpdateSelected, onTabChange = () => {} }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  // --- вкладки и описание ---
  const [tab, setTab] = useState('desc')
  const [description, setDescription] = useState('')
  const [isEditingDesc, setIsEditingDesc] = useState(false)

  const showDesc = useCallback(() => setTab('desc'), [])
  const showHW = useCallback(() => setTab('hw'), [])
  const showTasks = useCallback(() => setTab('tasks'), [])
  const showChat = useCallback(() => setTab('chat'), [])

  // --- оборудование ---
  const [hardware, setHardware] = useState([])
  const [isHWModalOpen, setIsHWModalOpen] = useState(false)
  const [editingHW, setEditingHW] = useState(null)
  const defaultHWForm = {
    name: '',
    location: '',
    purchase_status: 'не оплачен',
    install_status: 'не установлен',
  }
  const hardwareSchema = z.object({
    name: z.string().min(1, 'Введите название'),
    location: z.string().optional(),
    purchase_status: z.enum(['не оплачен', 'оплачен'], {