// S5: nhận sự kiện của một phòng. Thử WebSocket trước; mở không được thì hỏi định kỳ 2 giây.
// Hai đường trả cùng một dạng sự kiện {id, type, room, at, from, data}.
import { api, wsUrl } from './api.js'

export function connectRoom(room, who, onEvent) {
  let since = 0
  let ws = null
  let timer = null
  let stopped = false
  let polling = false

  const handle = (ev) => {
    if (!ev || ev.error || !ev.id || ev.id <= since) return
    since = ev.id
    onEvent(ev)
  }

  const poll = async () => {
    if (stopped) return
    try {
      const { events } = await api.events(room, since)
      events.forEach(handle)
    } catch {
      /* mất mạng: thử lại lượt sau */
    }
    timer = setTimeout(poll, 2000)
  }

  const startPolling = () => {
    if (polling || stopped) return
    polling = true
    poll()
  }

  const open = () => {
    if (stopped || polling) return
    let opened = false
    try {
      ws = new WebSocket(wsUrl(`/ws?room=${encodeURIComponent(room)}&who=${encodeURIComponent(who)}&since=${since}`))
    } catch {
      startPolling()
      return
    }
    ws.onopen = () => { opened = true }
    ws.onmessage = (e) => {
      try { handle(JSON.parse(e.data)) } catch { /* bỏ qua tin hỏng */ }
    }
    ws.onclose = () => {
      if (stopped) return
      if (!opened) startPolling()
      else timer = setTimeout(open, 1000)
    }
  }

  open()
  return () => {
    stopped = true
    clearTimeout(timer)
    if (ws) ws.close()
  }
}
