import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from './api.js'
import { useApp } from './state.jsx'

// Màn kết quả theo loại và mức (KE-HOACH-MANG-2-3.md mục 4.2)
export function routeFor(r) {
  if (r.kind === 'message') return r.reason ? '/chua-du-thong-tin' : '/phan-tich'
  return '/ket-qua'
}

export function useRunCheck() {
  const { setResult, addRecent, toast } = useApp()
  const nav = useNavigate()
  const [busy, setBusy] = useState(false)

  const run = async (value, kind) => {
    const v = String(value || '').trim()
    if (!v) {
      toast(kind === 'message' ? 'Bạn dán tin nhắn trước nhé' : 'Bạn nhập số, đường dẫn hoặc dán tin nhắn trước nhé')
      return
    }
    setBusy(true)
    try {
      const r = kind === 'message' ? await api.analyzeMessage(v) : await api.check(v, kind)
      setResult(r)
      addRecent(r, v)
      nav(routeFor(r))
    } catch (e) {
      if (e.offline) nav('/mat-mang', { state: { value: v, kind } })
      else toast(e.message)
    } finally {
      setBusy(false)
    }
  }
  return [run, busy]
}
