// U5: A09a biểu mẫu báo cáo · A09b hỏi "Báo cho cộng đồng?" một chạm · A09c đã gửi
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import Icon from '../ui/Icon.jsx'
import { AppBar, Phone } from '../ui/Phone.jsx'
import { api } from '../lib/api.js'
import { native } from '../lib/native.js'
import { useApp } from '../lib/state.jsx'

const css = `
.pick{height:40px;border-radius:20px;padding:0 6px;flex:1 1 auto;justify-content:center;white-space:nowrap}
.tile{width:96px;height:72px;border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;flex:none;color:var(--ink-2)}
.tile.add{border:1.5px dashed var(--outline)}
`

const KINDS = [
  { key: 'call', label: 'Cuộc gọi', icon: 'phone', field: 'Số điện thoại', noun: 'số này' },
  { key: 'message', label: 'Tin nhắn', icon: 'message', field: 'Số điện thoại gửi tin', noun: 'số này' },
  { key: 'link', label: 'Đường dẫn', icon: 'link', field: 'Đường dẫn', noun: 'đường dẫn này' },
  { key: 'account', label: 'Tài khoản', icon: 'card', field: 'Số tài khoản', noun: 'tài khoản này' },
]
const kindOf = (k) => KINDS.find((x) => x.key === k) || KINDS[0]

function useSubmit() {
  const nav = useNavigate()
  const { setReport, setPoints, toast, reporter } = useApp()
  const [busy, setBusy] = useState(false)
  const submit = async (draft) => {
    if (!String(draft.target || '').trim()) {
      toast('Bạn điền số, đường dẫn hoặc tài khoản cần báo nhé')
      return
    }
    setBusy(true)
    try {
      const response = await api.report({
        kind: draft.kind, target: draft.target, story: draft.story || null,
        hasAudio: Boolean(draft.hasAudio), lostMoney: Boolean(draft.lostMoney),
        reporter,
      })
      setPoints(response.totalPoints)
      setReport({ draft, response })
      nav('/bao-cao/xong', { replace: true })
    } catch (e) {
      toast(e.offline ? 'Không có mạng. Báo cáo chưa gửi được, bạn thử lại nhé' : e.message)
    } finally {
      setBusy(false)
    }
  }
  return [submit, busy]
}

export function ReportForm() {
  const { report } = useApp()
  const seed = report?.draft || {}
  const [kind, setKind] = useState(seed.kind && kindOf(seed.kind).key === seed.kind ? seed.kind : 'call')
  const [target, setTarget] = useState(seed.target || '')
  const [story, setStory] = useState(seed.story || '')
  const [hasAudio, setHasAudio] = useState(false)
  const [lostMoney, setLostMoney] = useState(false)
  const [submit, busy] = useSubmit()
  const { toast } = useApp()
  const k = kindOf(kind)
  const autofilled = Boolean(seed.target) && target === seed.target
  // Bản ghi âm do Android (N2) lưu sau cuộc gọi; chỉ gửi khi người dùng tự chọn đính kèm
  const recording = kind === 'call' ? (seed.recording || (native.available() ? null : { duration: '4:12' })) : null

  const dictate = async () => {
    const heard = await native.listen()
    if (heard) setStory((s) => (s ? s + ' ' : '') + heard)
    else toast('Máy này chưa nghe được giọng nói. Bạn gõ nhé')
  }

  return (
    <Phone name="A09a-bao-cao-form">
      <style>{css}</style>
      <AppBar title="Báo cáo lừa đảo" />
      <div className="content" style={{ paddingTop: 4 }}>
        <div className="row gap-12">
          <div className="steps grow"><div className="step on" /><div className="step on" /><div className="step" /></div>
          <div className="t-cap muted">Bước 2/3</div>
        </div>

        <div className="col gap-8">
          <div className="t-label bold">Loại</div>
          <div className="row gap-6">
            {KINDS.map((x) => (
              <button type="button" key={x.key} className={`chip pick tap ${x.key === kind ? 'solid-brand' : 'outline'}`} onClick={() => setKind(x.key)}>
                {x.key === kind && <Icon name={x.icon} size={14} />}{x.label}
              </button>
            ))}
          </div>
        </div>

        <div className="col gap-8">
          <div className="t-label bold">{k.field}</div>
          <div className="input">
            <input className="field" value={target} onChange={(e) => setTarget(e.target.value)} aria-label={k.field}
              inputMode={kind === 'link' ? 'url' : 'tel'} placeholder={kind === 'link' ? 'Dán đường dẫn' : 'Nhập số'} />
            {autofilled && <span className="chip ai"><Icon name="sparkles" size={14} />Tự điền</span>}
          </div>
        </div>

        <div className="col gap-8">
          <div className="t-label bold">Chuyện gì đã xảy ra?</div>
          <div className="input area" style={{ minHeight: 112 }}>
            <textarea className="field grow" style={{ minHeight: 88 }} value={story} onChange={(e) => setStory(e.target.value)}
              placeholder="Kể ngắn: họ xưng là ai, đòi gì" aria-label="Chuyện gì đã xảy ra?" />
            <button type="button" className="icon-box brand round tap" style={{ alignSelf: 'flex-end' }} aria-label="Kể bằng giọng nói" onClick={dictate}>
              <Icon name="mic" size={20} />
            </button>
          </div>
        </div>

        <div className="col gap-8">
          <div className="t-label bold">Bằng chứng</div>
          <div className="row gap-8">
            <button type="button" className="tile bg-soft tap" onClick={() => toast('Gửi ảnh bằng chứng: giai đoạn sau')}><Icon name="image" size={20} /><div className="t-cap">Ảnh chụp</div></button>
            <button type="button" className="tile add tap" onClick={() => toast('Gửi ảnh bằng chứng: giai đoạn sau')}><Icon name="plus" size={20} /><div className="t-cap">Thêm</div></button>
          </div>
          {recording && (
            <button type="button" className="card soft row gap-12 tap" style={{ padding: 12, borderColor: 'var(--outline-2)' }} onClick={() => setHasAudio(!hasAudio)} aria-pressed={hasAudio}>
              <div className={`${hasAudio ? 'bg-brand c-white' : 'bg-white'} none`} style={{ width: 22, height: 22, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', border: hasAudio ? 'none' : '1.5px solid var(--outline)' }}>
                {hasAudio && <Icon name="check" size={14} />}
              </div>
              <div className="col grow gap-2">
                <div className="t-label semi">Đính kèm bản ghi âm {recording.duration}</div>
                <div className="t-cap muted">Bản ghi này sẽ được gửi cho đội duyệt.</div>
              </div>
            </button>
          )}
        </div>

        <div className="col gap-8">
          <div className="t-label bold">Bạn đã mất tiền chưa?</div>
          <div className="seg">
            <button type="button" className={`seg-item${!lostMoney ? ' active' : ''}`} style={{ height: 40 }} onClick={() => setLostMoney(false)}>Chưa</button>
            <button type="button" className={`seg-item${lostMoney ? ' active' : ''}`} style={{ height: 40 }} onClick={() => setLostMoney(true)}>Rồi</button>
          </div>
        </div>

        <button type="button" className="btn primary block mt-auto" disabled={busy} onClick={() => submit({ kind, target, story, hasAudio, lostMoney })}>
          {busy ? 'Đang gửi…' : 'Gửi báo cáo'}
        </button>
      </div>
    </Phone>
  )
}

export function ReportCommunity() {
  const nav = useNavigate()
  const { report } = useApp()
  const [submit, busy] = useSubmit()
  const draft = report?.draft
  if (!draft) return <Navigate to="/bao-cao" replace />
  const k = kindOf(draft.kind)

  return (
    <Phone name="A09b-bao-cong-dong" className="bg-white">
      <div className="content">
        <div className="card soft" style={{ height: 80 }} />
        <div className="card soft" style={{ height: 120 }} />
        <div className="card soft" style={{ height: 100 }} />
      </div>
      <button type="button" className="scrim" aria-label="Đóng" onClick={() => nav(-1)} />
      <div className="sheet" style={{ paddingBottom: 12 }}>
        <div className="grab" />
        <div className="icon-box lgx brand"><Icon name="megaphone" size={28} /></div>
        <div className="col gap-8">
          <div className="t-h1">Báo {k.noun} cho cộng đồng?</div>
          <div className="t-body muted">AI sẽ kiểm tra trước. Ca nào chưa chắc thì đội tình nguyện duyệt. Tên bạn không hiển thị.</div>
        </div>
        <div className="card soft row gap-12" style={{ padding: '12px 16px' }}>
          <Icon name={k.icon} size={20} className="muted" />
          <div className="t-body semi grow" style={{ overflowWrap: 'anywhere' }}>{draft.target}</div>
          <span className="chip danger"><Icon name="alert-oct" size={14} />Nghi lừa đảo</span>
        </div>
        <div className="col gap-4">
          <button type="button" className="btn primary block" disabled={busy} onClick={() => submit(draft)}>{busy ? 'Đang gửi…' : 'Gửi báo cáo'}</button>
          <button type="button" className="btn ghost block" onClick={() => nav('/')}>Để sau</button>
        </div>
      </div>
    </Phone>
  )
}

const STATUS = {
  ai_confirmed: { chip: 'safe', icon: 'check', text: 'Đã xác nhận · đang cảnh báo cộng đồng' },
  confirmed: { chip: 'safe', icon: 'check', text: 'Đã xác nhận · đang cảnh báo cộng đồng' },
  needs_review: { chip: 'warn', icon: 'clock', text: 'Chưa chắc · đội tình nguyện sẽ duyệt' },
  ai_rejected: { chip: '', icon: 'info', text: 'Chưa đủ căn cứ để cảnh báo' },
}

export function ReportDone() {
  const nav = useNavigate()
  const { report, toast } = useApp()
  const res = report?.response
  if (!res) return <Navigate to="/" replace />
  const r = res.report
  const pct = Math.round((r.ai.confidence || 0) * 100)
  const st = STATUS[r.status] || STATUS.needs_review
  const noun = kindOf(report.draft.kind).noun

  return (
    <Phone name="A09c-bao-cao-xong">
      <div className="content" style={{ gap: 14 }}>
        <div className="col acenter gap-4" style={{ paddingTop: 12 }}>
          <div className="icon-box xl solid-safe"><Icon name="check" size={48} /></div>
          <div className="t-h1 center mt-8">Cảm ơn bạn!</div>
          <div className="t-body muted center">{res.reporterCount > 1 ? `Bạn là người thứ ${res.reporterCount} báo ${noun}.` : `Bạn là người đầu tiên báo ${noun}.`}</div>
        </div>

        <div className="card ai col gap-10">
          <div className="ai-tag"><Icon name="sparkles" size={14} />AI đã phân loại</div>
          <div className="t-label bold c-ai-ink">{r.ai.scamLabel}</div>
          <div className="col gap-6">
            <div className="row between"><div className="t-cap c-ai-ink">Độ tin cậy</div><div className="t-cap bold c-ai-ink">{pct}%</div></div>
            <div className="progress" style={{ background: '#fff' }}><div className="progress-bar ai" style={{ width: `${pct}%` }} /></div>
          </div>
          <span className={`chip ${st.chip}`} style={{ alignSelf: 'flex-start' }}><Icon name={st.icon} size={14} />{st.text}</span>
        </div>

        <div className="card warn row gap-8" style={{ padding: 12 }}>
          <div className="icon-box warn round" style={{ background: '#fff' }}><Icon name="award" size={20} /></div>
          <div className="t-label bold c-warn-ink grow">+{res.points} điểm đóng góp</div>
          <div className="t-cap c-warn-ink">Tổng: {res.totalPoints} điểm</div>
        </div>

        <button type="button" className="card row gap-8 tap" style={{ padding: '12px 8px 12px 12px' }} onClick={() => toast('Bản 24 giờ: Lá chắn gom bằng chứng thành hồ sơ, chưa nối kênh tiếp nhận của Công an')}>
          <div className="icon-box brand"><Icon name="shield" size={20} /></div>
          <div className="col grow gap-2">
            <div className="t-label bold">Gửi tin báo cho Công an phường</div>
            <div className="t-cap muted">Lá chắn gom sẵn bằng chứng<br />thành hồ sơ</div>
          </div>
          <Icon name="chev-right" size={20} className="faint" />
        </button>

        <button type="button" className="card danger row gap-8 tap" style={{ padding: '12px 8px 12px 12px' }} onClick={() => toast('Gọi ngay ngân hàng để phong tỏa, rồi báo Công an')}>
          <div className="icon-box solid-danger"><Icon name="alert" size={20} /></div>
          <div className="t-label semi c-danger-ink grow">Đã lỡ chuyển tiền?<br />Xem việc cần làm ngay</div>
          <Icon name="chev-right" size={20} className="c-danger" />
        </button>

        <button type="button" className="btn primary block mt-auto" onClick={() => nav('/')}>Về trang chủ</button>
      </div>
    </Phone>
  )
}
