import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { native } from '../../lib/native.js'
import { useApp } from '../../lib/state.jsx'
import { Art, Bar, Btn, I, IconBox, Progress, Screen, StateView, Tag } from '../ui.jsx'
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

// Tên màn theo đối tượng: bà báo cuộc gọi vừa nhận, học sinh báo cáo lừa đảo
const reportTitle = (persona) => (persona === 'elder' ? 'Báo cuộc vừa nhận' : 'Báo cáo lừa đảo')
const LEVEL_LOOK = { danger: ['dang', 'Nguy hiểm'], suspicious: ['warn', 'Nghi ngờ'], safe: ['safe', 'An toàn'], unknown: ['gray', 'Chưa rõ'] }
const fmtDuration = (sec) => (Number.isFinite(sec) && sec > 0 ? `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}` : '')

export function Report() {
  const { persona } = useApp()
  if (native.available()) return <ReceivedEvents />
  return (
    <Screen name="B4-bao-cao" bar={<Bar title={reportTitle(persona)} />}>
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
  const [confirm, setConfirm] = useState(false)
  const [issue, setIssue] = useState('')
  const elder = persona === 'elder'
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
    } catch (e) { setIssue(e.message); setConfirm(false) }
    finally { setSending(false) }
  }
  const canSend = event && event.reportStatus !== 'withdrawn'
  // Gửi báo cáo mới thì hỏi lại một lần (A09b); rút báo cáo thì làm ngay
  const sheet = confirm && event && (
    <>
      <div className="scrim" onClick={() => !sending && setConfirm(false)} />
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="report-confirm">
        <div className="grab" />
        <IconBox icon="megaphone" tone="pri" size="lgx" z={28} />
        <div className="col g8">
          <div id="report-confirm" className="h-l">Báo {event.type === 'call_log' ? 'số này' : 'tin này'} cho cộng đồng?</div>
          <div className="t-body c-ink2">Lá chắn dùng báo cáo để cảnh báo người khác về {event.type === 'call_log' ? 'số này' : 'người gửi này'}. {elder ? 'Bà' : 'Bạn'} rút lại được bất cứ lúc nào.</div>
        </div>
        <div className="card tone-gray tight row g12">
          <I n={event.type === 'call_log' ? 'phone' : 'msg'} z={20} c="ink2" />
          <div className="t-row grow">{event.display || event.target}</div>
          {event.hasRecording && <Tag kind="on">Có ghi âm</Tag>}
        </div>
        <div className="col g4">
          <Btn busy={sending} onClick={submit}>Gửi báo cáo</Btn>
          <button type="button" className="btn ghost" disabled={sending} onClick={() => setConfirm(false)}>Để sau</button>
        </div>
      </div>
    </>
  )
  return (
    <Screen name="A09a-bao-cao-form" bar={<Bar title={reportTitle(persona)} />} overlay={sheet}
      foot={canSend && <Btn kind={withdraw ? 'o' : 'p'} busy={sending && !confirm} onClick={() => (withdraw ? submit() : setConfirm(true))}>{withdraw ? 'Rút báo cáo' : 'Gửi báo cáo'}</Btn>}>
      <div className="row g12">
        <div className="grow"><Progress total={2} at={event ? 2 : 1} /></div>
        <div className="t-sm none">Bước {event ? 2 : 1}/2</div>
      </div>
      <div className="col g4">
        <div className="t-head">Cuộc gọi hoặc tin nhắn đã nhận</div>
        <div className="t-sm">{elder ? 'Bà chọn cuộc gọi hoặc tin nhắn mình đã nhận trong 7 ngày qua nha.' : 'Chọn cuộc gọi hoặc tin nhắn máy mình đã nhận trong 7 ngày qua.'}</div>
      </div>
      {error && <div className="card tone-dang col g8"><p role="alert" className="t-sub c-dang-ink">{error}</p><Btn kind="o" icon="refresh" onClick={reload}>Tải lại</Btn></div>}
      {!events && !error && <p role="status" className="t-sub">Đang xem nhật ký trên máy…</p>}
      {events?.length === 0 && <StateView icon="phonein" title="Chưa có cuộc gọi hoặc tin nhắn để báo" />}
      {events?.length > 0 && <div className="col g8">{events.map((item) => {
        const call = item.type === 'call_log'
        const on = selected === item.eventId
        const time = new Date(eventTime(item.at)).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
        const status = reportStatuses[item.reportStatus] || (item.reportId ? 'Đã báo' : '')
        return (
          <button key={item.eventId} type="button" className={`opt ev-pick${on ? ' sel' : ''}`} aria-pressed={on} disabled={sending}
            onClick={() => { select(item.eventId); setStory(''); setIssue('') }}>
            <IconBox icon={call ? 'phone-in' : 'message'} tone={on ? 'white' : 'pri'} size="sm" z={20} />
            <span className="col grow g2">
              <span className="t-row c-ink">{item.display || item.target}</span>
              <span className="t-sm">{call ? 'Cuộc gọi đến' : 'Tin nhắn đến'} · {time}</span>
              {(status || item.hasRecording) && <span className="row g6" style={{ flexWrap: 'wrap', marginTop: 2 }}>
                {item.hasRecording && <Tag kind="on">Có ghi âm</Tag>}
                {status && <Tag kind="line">{status}</Tag>}
              </span>}
            </span>
            <span className={`radio${on ? ' on' : ''}`} />
          </button>
        )
      })}</div>}
      {event && !withdraw && <>
        <label className="col g8"><span className="t-head">Chuyện gì đã xảy ra?</span>
          <textarea className="field" value={story} disabled={sending} onChange={(e) => setStory(e.target.value)}
            placeholder={elder ? 'Bà kể thêm nếu muốn, ví dụ: người gọi xưng công an, đòi chuyển tiền' : 'Kể thêm nếu muốn, ví dụ: hứa việc nhẹ lương cao, đòi nạp tiền trước'} /></label>
        {event.hasRecording && (
          <div className="card tone-gray tight row g12">
            <IconBox icon="file-audio" tone="pri" size="sm" z={20} />
            <div className="col grow g2">
              <div className="t-row">Có bản ghi âm{fmtDuration(event.durationSec) ? ` ${fmtDuration(event.durationSec)}` : ''}</div>
              <div className="t-sm">Lá chắn phân tích bản ghi để xác nhận, không lưu lại âm thanh.</div>
            </div>
          </div>
        )}
      </>}
      {issue && <p role="alert" className="t-sub c-dang">{issue}</p>}
    </Screen>
  )
}

export function ReportDone() {
  const nav = useNavigate()
  const { report, setReport, setPoints, persona } = useApp()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  if (!native.available() || !report?.response) return <Navigate to="/bao-cao" replace />
  const { response, display, withdrawn } = report
  const item = response.report
  const progress = response.case
  const elder = persona === 'elder'
  const [tone, word] = LEVEL_LOOK[progress?.level] || LEVEL_LOOK.unknown
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
    <Screen name={withdrawn ? 'A09c-da-rut' : 'A09c-bao-cao-xong'} bar={<Bar title="" onLeft={() => nav('/bao-cao', { replace: true })} />}
      foot={<Btn onClick={() => nav('/', { replace: true })}>Về trang chủ</Btn>}>
      <div className="col ac g4 center">
        <Art name={withdrawn ? 'an-toan' : 'mung'} z={112} className="pop" />
        <div className="h-l" style={{ marginTop: 8 }}>{withdrawn ? 'Đã rút báo cáo' : elder ? 'Cảm ơn bà ạ!' : 'Cảm ơn bạn!'}</div>
        <div className="t-body c-ink2">{response.message}</div>
      </div>
      {response.alertMessage && <p role="status" className="card tone-pri t-sub c-pri-ink">{response.alertMessage}</p>}
      <div className={`card tone-${tone} col g10`}>
        <div className="row jb g8">
          <span className="t-over c-ink2">Báo cáo của {elder ? 'bà' : 'bạn'}</span>
          {reportStatuses[item?.status] && <Tag kind="line">{reportStatuses[item.status]}</Tag>}
        </div>
        <div className="row g12">
          <IconBox icon="flag" tone="white" size="sm" z={20} />
          <div className="t-row grow">{display}</div>
        </div>
        {progress && <div className="col g2">
          <div className="t-head">Mức cộng đồng · {levels[progress.level] || word}</div>
          <div className="t-sm c-ink">{progress.count} máy đã báo · {voteProgress(progress.votes)}</div>
        </div>}
      </div>
      {Number.isFinite(response.totalPoints) && (
        <div className="card tone-warn tight row g10">
          <IconBox icon="award" tone="white warn" round z={20} />
          <div className="t-head c-warn-ink grow">{response.points > 0 ? `+${response.points} điểm đóng góp` : 'Điểm học tập'}</div>
          <div className="t-sm c-warn-ink">Tổng: {response.totalPoints} điểm</div>
        </div>
      )}
      {!withdrawn && item?.id && item.status !== 'withdrawn' && <Btn kind="o" busy={busy} onClick={withdraw}>Rút báo cáo</Btn>}
      {error && <p role="alert" className="t-sub c-dang">{error}</p>}
    </Screen>
  )
}
