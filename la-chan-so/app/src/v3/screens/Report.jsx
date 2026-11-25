import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { native } from '../../lib/native.js'
import { useApp } from '../../lib/state.jsx'
import { Bar, Btn, Circle, Group, Screen, StateView, Tag } from '../ui.jsx'
import { levels, reportStatuses, voteProgress } from '../review.js'

function eventTime(at) {
  if (typeof at === 'number') return at < 1e12 ? at * 1000 : at
  return Date.parse(at)
}

function useRecentEvents() {
  const [events, setEvents] = useState(null)
  const [error, setError] = useState('')
  const [revision, refresh] = useState(0)
  useEffect(() => {
    let active = true
    let pending = false
    async function load() {
      if (pending || document.hidden) return
      pending = true
      try {
        const list = await native.recentEvents()
        const now = Date.now()
        const recent = list.filter((event) => {
          const age = now - eventTime(event.at)
          return event.eventId && ['call_log', 'sms_received'].includes(event.type) && age >= 0 && age < 7 * 86400000
        }).sort((a, b) => eventTime(b.at) - eventTime(a.at))
        if (active) { setEvents(recent); setError('') }
      } catch (e) {
        if (active) setError(e.message)
      } finally { pending = false }
    }
    load()
    document.addEventListener('visibilitychange', load)
    return () => { active = false; document.removeEventListener('visibilitychange', load) }
  }, [revision])
  return { events, error, reload: () => refresh((n) => n + 1) }
}

export function Report() {
  if (native.available()) return <ReceivedEvents />
  return (
    <Screen name="B4-bao-cao" bar={<Bar title="Báo cáo" />}>
      <StateView art="nghi" title="Mở Lá chắn số trên điện thoại"
        text="Báo cáo cần app Lá chắn số trên chính điện thoại đã nhận cuộc gọi hoặc tin nhắn." />
    </Screen>
  )
}

function ReceivedEvents() {
  const nav = useNavigate()
  const { setReport, setPoints, persona } = useApp()
  const { events, error, reload } = useRecentEvents()
  const [selected, select] = useState('')
  const [story, setStory] = useState('')
  const [sending, setSending] = useState(false)
  const [issue, setIssue] = useState('')
  const event = events?.find((item) => item.eventId === selected)
  const withdraw = Boolean(event?.reportId)
  async function submit() {
    if (!event || sending) return
    setSending(true)
    setIssue('')
    try {
      const response = withdraw ? await native.withdrawReport(event.reportId) : await native.reportEvent(event.eventId, story.trim())
      setPoints(response.totalPoints)
      setReport({ response, display: event.display || event.target, withdrawn: withdraw })
      nav('/bao-cao/xong', { replace: true })
    } catch (e) { setIssue(e.message) }
    finally { setSending(false) }
  }
  return (
    <Screen name="B4-bao-cao" bar={<Bar title="Báo cáo" />}
      foot={event && event.reportStatus !== 'withdrawn' && <Btn kind={withdraw ? 'o' : 'p'} busy={sending} onClick={submit}>{withdraw ? 'Rút báo cáo' : 'Gửi báo cáo'}</Btn>}>
      <h1 className="h-l">Cuộc gọi và tin nhắn vừa nhận</h1>
      <p className="t-sub">{persona === 'elder' ? 'Bà chọn cuộc gọi hoặc tin nhắn mình đã nhận trong 7 ngày qua nha.' : 'Chọn cuộc gọi hoặc tin nhắn máy mình đã nhận trong 7 ngày qua.'}</p>
      {error && <><p role="alert" className="t-sub c-dang">{error}</p><Btn kind="o" onClick={reload}>Tải lại</Btn></>}
      {!events && !error && <p role="status">Đang xem nhật ký trên máy…</p>}
      {events?.length === 0 && <StateView icon="phonein" title="Chưa có cuộc gọi hoặc tin nhắn để báo" />}
      <Group>{events?.map((item) => {
        const call = item.type === 'call_log'
        const time = new Date(eventTime(item.at)).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
        return (
          <button key={item.eventId} type="button" className="li" aria-pressed={selected === item.eventId} disabled={sending}
            onClick={() => { select(item.eventId); setStory(''); setIssue('') }}>
            <Circle z={42} icon={call ? 'phonein' : 'msg'} iz={20} />
            <span className="col grow g4">
              <span className="t-row">{item.display || item.target}</span>
              <span className="t-sm">{call ? 'Cuộc gọi đến' : 'Tin nhắn đến'} · {time}</span>
              {item.hasRecording && <span><Tag kind="on">Có ghi âm</Tag></span>}
              <span className="t-sm">{reportStatuses[item.reportStatus] || (item.reportId ? 'Đã báo' : 'Chưa báo')}</span>
            </span>
            <span className={`radio${selected === item.eventId ? ' on' : ''}`} />
          </button>
        )
      })}</Group>
      {event && !withdraw && <label className="col g8"><span className="t-lbl">Kể thêm nếu muốn</span>
        <textarea className="field" value={story} disabled={sending} onChange={(e) => setStory(e.target.value)} /></label>}
      {issue && <p role="alert" className="t-sub c-dang">{issue}</p>}
    </Screen>
  )
}

export function ReportDone() {
  const nav = useNavigate()
  const { report, setReport, setPoints } = useApp()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  if (!native.available() || !report?.response) return <Navigate to="/bao-cao" replace />
  const { response, display, withdrawn } = report
  const item = response.report
  const progress = response.case
  async function withdraw() {
    setBusy(true)
    setError('')
    try {
      const next = await native.withdrawReport(item.id)
      setPoints(next.totalPoints)
      setReport({ display, response: next, withdrawn: true })
    } catch (e) { setError(e.message) }
    finally { setBusy(false) }
  }
  return (
    <Screen name="B4b-da-gui" bar={<Bar title="Báo cáo" onLeft={() => nav('/bao-cao', { replace: true })} />}
      foot={<Btn onClick={() => nav('/', { replace: true })}>Về trang chủ</Btn>}>
      <StateView art={withdrawn ? 'an-toan' : 'mung'} title={withdrawn ? 'Đã rút báo cáo' : 'Đã gửi báo cáo'} text={response.message}>
        {response.alertMessage && <p role="status" className="t-sub">{response.alertMessage}</p>}
        <div className="t-row">{display}</div>
        {reportStatuses[item?.status] && <Tag kind="ok">{reportStatuses[item.status]}</Tag>}
        {progress && <div className="col g4">
          <span className="t-row">{levels[progress.level]}</span>
          <span className="t-sub">{progress.count} máy đã báo</span>
          <span className="t-sm">{voteProgress(progress.votes)}</span>
        </div>}
        {Number.isFinite(response.totalPoints) && <span className="t-sub">Tổng điểm học tập · {response.totalPoints}</span>}
        {response.points > 0 && <Tag icon="award">+{response.points} điểm</Tag>}
        {!withdrawn && item?.id && item.status !== 'withdrawn' && <Btn kind="o" busy={busy} onClick={withdraw}>Rút báo cáo</Btn>}
        {error && <p role="alert" className="t-sub c-dang">{error}</p>}
      </StateView>
    </Screen>
  )
}
