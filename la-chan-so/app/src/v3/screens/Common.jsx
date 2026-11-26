// Chung cho 3 đối tượng: 00 màn chào · 0 chọn vai · 0b quyền riêng tư · 0c chọn phường · 0d cá nhân · A02 thiết lập 3 lớp
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { APP, Art, Bar, Btn, Circle, Group, I, IconBox, Logo, Progress, Row, Screen, Speak, StateView, Switch, Tag } from '../ui.jsx'
import { LAYERS, useLayers } from '../../lib/layers.js'
import { memberRole, saveTeam } from '../../lib/api.js'
import { native } from '../../lib/native.js'
import { FAMILY_ROOM, useApp } from '../../lib/state.jsx'
import bieuTrung from '../art/bieu-trung-dong-nai.webp'

export const WARDS = ['Trấn Biên', 'Biên Hòa', 'Tam Hiệp', 'Long Bình', 'Trảng Dài', 'Hố Nai', 'Long Hưng', 'Tam Phước', 'Phước Tân']
export const ROLES = [
  { mode: 'simple', icon: 'user', title: 'Người lớn tuổi', sub: 'Chữ to, đọc to, hỏi con cháu một chạm' },
  { mode: 'full', icon: 'grad', title: 'Học sinh', sub: 'Kiểm tra tin nhắn, học qua truyện 1 phút' },
  { mode: 'relative', icon: 'users', title: 'Người thân', sub: 'Nhận cảnh báo khi bố mẹ gặp cuộc gọi lạ' },
]

const ROLE_TONE = ['pri', 'safe', 'warn']

// Đổi nhanh giữa 3 nhân vật demo: bà Hoa, Vy, Minh (Minh tự ghép mã gia đình demo, khỏi gõ).
const QUICK = [
  { mode: 'simple', name: 'Bà Hoa', sub: 'Người lớn tuổi', tone: 'pri' },
  { mode: 'full', name: 'Vy', sub: 'Học sinh', tone: 'safe' },
  { mode: 'relative', name: 'Minh', sub: 'Người thân', tone: 'warn' },
]

function QuickSwitch() {
  const nav = useNavigate()
  const { mode, setMode, setFamilyCode, setOnboarded, toast } = useApp()
  const pick = (q) => {
    if (q.mode === mode) return
    if (q.mode === 'relative') setFamilyCode(FAMILY_ROOM)
    saveTeam(null)
    setMode(q.mode)
    setOnboarded(true)
    toast(`Đã chuyển sang ${q.name}`)
    nav('/', { replace: true })
  }
  return (
    <div className="qs" role="group" aria-label="Đổi nhanh vai">
      {QUICK.map((q) => (
        <button key={q.mode} type="button" className={`qs-b tap${q.mode === mode ? ' on' : ''}`} aria-pressed={q.mode === mode} onClick={() => pick(q)}>
          <span className={`qs-av ${q.tone}`}>{q.name.split(' ').pop().charAt(0)}</span>
          <span className="qs-n">{q.name}</span><span className="qs-s">{q.sub}</span>
        </button>
      ))}
    </div>
  )
}

// ---------- 00 Màn chào ----------
export function Splash() {
  const nav = useNavigate()
  useEffect(() => {
    const t = setTimeout(() => nav('/vai', { replace: true }), 2600)
    return () => clearTimeout(t)
  }, [nav])
  return (
    <Screen name="00-man-chao" tone="white" foot={<>
      <Btn onClick={() => nav('/vai', { replace: true })}>Bắt đầu</Btn>
      {/* Biểu trưng Đồng Nai: chỉ đặt nhỏ ở đây để ghi cuộc thi, không dùng làm logo của app */}
      <div className="row g10 jc" style={{ padding: '0 8px' }}>
        <img src={bieuTrung} alt="Biểu trưng Đồng Nai" width={30} height={35} style={{ flex: 'none' }} />
        <div className="t-sm" style={{ textAlign: 'left' }}>Sản phẩm dự thi Hackathon<br />thành phố Đồng Nai 2026</div>
      </div>
    </>}>
      <div className="col ac jc g12 grow center">
        <Art name="chao" z={220} className="pop bounce" />
        <div className="row g10 ac rise" style={{ marginTop: 10 }}><Logo z={40} /><div className="h-xxl">{APP}</div></div>
        <div className="t-body c-ink2 rise" style={{ animationDelay: '.08s' }}>Kiểm tra trước khi chuyển tiền</div>
      </div>
    </Screen>
  )
}

// ---------- 0 Chọn vai ----------
export function RolePick() {
  const nav = useNavigate()
  const { mode, setMode, onboarded } = useApp()
  const pick = (m) => {
    if (m === 'relative') return nav('/ma-gia-dinh')
    if (m !== 'volunteer') saveTeam(null)
    setMode(m)
    nav(m === 'volunteer' ? '/ma-doi' : onboarded ? '/' : '/rieng-tu', { replace: onboarded })
  }
  return (
    <Screen name="0-chon-vai" bar={onboarded ? <Bar title="Đổi vai" /> : null}>
      {!onboarded && <div className="col g6" style={{ paddingTop: 14 }}>
        <Art name="chao" z={96} />
        <div className="h-xl" style={{ marginTop: 8 }}>{APP}</div>
        <div className="t-row c-ink2" style={{ fontWeight: 500 }}>Bạn là ai?</div>
      </div>}
      <div className="col g12">
        {ROLES.map((r, i) => (
          <button key={r.mode} type="button" className={`act tap rise${mode === r.mode && onboarded ? ' on' : ''}`} onClick={() => pick(r.mode)}
            aria-current={mode === r.mode && onboarded ? 'true' : undefined} style={{ animationDelay: `${i * 0.05}s` }}>
            <IconBox icon={r.icon} tone={ROLE_TONE[i]} size="lgx" z={28} />
            <div className="col grow g2"><div className="h-m">{r.title}</div><div className="t-sub">{r.sub}</div></div>
            <I n="next" z={22} className="chev" />
          </button>
        ))}
      </div>
      <div className="sp" />
      <div className="t-sm center">Đổi vai được bất cứ lúc nào trong mục Cá nhân.</div>
    </Screen>
  )
}

// ---------- 0b Quyền riêng tư ----------
export function Privacy() {
  const nav = useNavigate()
  const { onboarded, persona } = useApp()
  const rows = persona === 'relative' ? [
    ['bell', 'Thông báo gia đình', 'Khi mẹ gặp rủi ro', 'ok'],
    ['lock', 'Tóm tắt cuộc gọi', 'Đã che số', 'ok'],
  ] : [
    ['mic', 'Micro', 'Khi bấm nói', 'ok'],
    ['msg', 'Thông báo tin nhắn', 'Lọc trên máy', 'ok'],
    ['phonein', 'Cuộc gọi đến', 'Chỉ tra số', 'ok'],
    ['lock', 'Nội dung cuộc gọi, tin nhắn', 'Không lưu', 'no'],
  ]
  return (
    <Screen name="0b-quyen-rieng-tu" bar={onboarded ? <Bar title="Quyền riêng tư" /> : null}
      foot={!onboarded && <Btn onClick={() => nav('/phuong')}>Đồng ý</Btn>}>
      <div className="row g12" style={{ paddingTop: onboarded ? 0 : 18 }}>
        <IconBox icon="lock" tone="pri" size="lgx" z={28} />
        <div className="col grow"><div className="h-l">Quyền riêng tư</div><div className="t-sub">Lá chắn dùng gì trên máy, giữ gì lại</div></div>
      </div>
      <Group>
        {rows.map(([icon, t, v, k]) => <Row key={t} icon={icon} title={t} right={<Tag kind={k}>{v}</Tag>} />)}
      </Group>
      <div className="card tone-safe col g10">
        {['Tin có mã OTP không bao giờ rời máy.', 'Số điện thoại, số tài khoản được che trước khi gửi AI.', 'Người thân chỉ thấy mức cảnh báo và tóm tắt đã che.'].map((t) => (
          <div key={t} className="why reason c-safe-ink"><I n="check" z={20} c="safe" sw={2.6} /><span>{t}</span></div>
        ))}
      </div>
    </Screen>
  )
}

// ---------- 0c Chọn phường ----------
export function WardPick() {
  const nav = useNavigate()
  const { ward, setWard, onboarded, setOnboarded, mode, persona } = useApp()
  const [sel, setSel] = useState(ward)
  const done = () => {
    setWard(sel)
    if (onboarded) return nav(-1)
    if (mode === 'volunteer') return nav('/ma-doi', { replace: true })
    setOnboarded(true)
    nav('/', { replace: true })
  }
  return (
    <Screen name="0c-chon-phuong" bar={<Bar title="Chọn phường" />} foot={<Btn onClick={done}>{onboarded ? 'Lưu' : 'Tiếp tục'}</Btn>}>
      <div className="row g12">
        <IconBox icon="pin" tone="pri" size="lgx" z={28} />
        <div className="t-sub grow">Lá chắn báo cho {persona === 'elder' ? 'bà' : 'bạn'} các kiểu lừa đảo mới ở phường mình.</div>
      </div>
      <Group>
        {WARDS.map((w) => (
          <button key={w} type="button" className="li" onClick={() => setSel(w)} role="radio" aria-checked={sel === w}>
            <div className="t-row grow">{w}</div><span className={`radio${sel === w ? ' on' : ''}`} />
          </button>
        ))}
      </Group>
    </Screen>
  )
}

const demos = [
  ['ring', 'phonein', 'Số lạ gọi đến', 'Xem thẻ cảnh báo lúc điện thoại đổ chuông.'],
  ['ringKnown', 'phone', 'Số quen gọi đến', 'Xem thẻ cuộc gọi từ một số đã lưu.'],
  ['afterCall', 'mic', 'Bé Nai hỏi thăm', 'Nghe Bé Nai hỏi sau khi cúp máy.'],
  ['stop', 'shield', 'Dừng lại', 'Xem lời nhắc trước khi chuyển tiền.'],
  ['message', 'msg', 'Tin nhắn lạ', 'Xem Lá chắn cảnh báo khi có tin nhắn đáng ngờ.'],
  ['bankWatch', 'cardi', 'Mở ứng dụng ngân hàng', 'Thử lời nhắc khi mở ngân hàng sau cuộc gọi lạ.'],
]

// ---------- 0d Cá nhân ----------
export function Profile() {
  const nav = useNavigate()
  const { mode, persona, familyCode, relatives, ward, points, team, toast } = useApp()
  const { on, asleep } = useLayers()
  const [auto, setAuto] = useState(() => localStorage.getItem('lcs.autoSpeak') !== '0')
  const [voice, setVoice] = useState(() => localStorage.getItem('lcs.voiceAsk') !== '0')
  const role = ROLES.find((r) => r.mode === mode)
  const protectedPhone = persona === 'elder' || persona === 'student'
  const toggle = (key, set) => (v) => { set(v); localStorage.setItem(key, v ? '1' : '0'); if (key === 'lcs.voiceAsk') window.LCSNative?.setVoiceAsk?.(v) }
  return (
    <Screen name="0d-ca-nhan" nav="/ca-nhan"
      bar={<Bar title="Cá nhân" left={null} right={persona === 'student' && Number.isFinite(points) ? <Tag kind="new" icon="award">{points} điểm</Tag> : null} />}>
      <h2 className="t-head">Đổi nhanh vai</h2>
      <QuickSwitch />
      <Group>
        {persona === 'volunteer' && team && <Row icon="user" title={team.member.name} sub={memberRole(team.member)} />}
        {protectedPhone && <Row icon="users" title="Người thân" value={relatives[0]?.name || 'Chưa có'} onClick={() => nav('/nguoi-than')} />}
        {(persona === 'elder' || persona === 'relative') && <Row icon="users" title="Mã gia đình"
          sub={persona === 'relative' ? familyCode : FAMILY_ROOM} onClick={persona === 'relative' ? () => nav('/ma-gia-dinh') : undefined} />}
        {persona !== 'relative' && <Row icon="pin" title="Phường" value={persona === 'volunteer' ? team?.member.ward : ward} onClick={persona === 'volunteer' ? undefined : () => nav('/phuong')} />}
        <Row icon="swap" title="Đổi vai" value={persona === 'volunteer' ? undefined : role?.title} onClick={() => nav('/vai')} />
      </Group>
      {protectedPhone && (
        <Group>
          <Row icon={asleep ? 'shield-off' : 'shield-check'} iconColor={asleep ? 'dang' : 'safe'} title="Lá chắn" onClick={() => nav('/thiet-lap')}
            right={<Tag kind={asleep ? 'off' : 'on'}>{asleep ? 'Đang ngủ' : `${on}/3 lớp`}</Tag>} />
          <Row icon="mic" title="Hỏi bằng giọng nói" right={<Switch on={voice} onChange={toggle('lcs.voiceAsk', setVoice)} label="Hỏi bằng giọng nói" />} />
        </Group>
      )}
      {persona === 'volunteer' && <Btn kind="o" onClick={() => { saveTeam(null); nav('/ma-doi', { replace: true }) }}>Đăng xuất đội</Btn>}
      {protectedPhone && native.available() && <>
        <h2 className="t-head" style={{ marginTop: 4 }}>Thử Lá chắn</h2>
        <Group>{demos.map(([key, icon, title, sub]) => <Row key={key} icon={icon} title={title} sub={sub}
          onClick={() => window.LCSNative.demo ? window.LCSNative.demo(key) : toast('Bạn cập nhật app để thử màn này nhé.')} />)}</Group>
      </>}
      <Group>
        <Row icon="vol" title="Tự đọc to" right={<Switch on={auto} onChange={toggle('lcs.autoSpeak', setAuto)} label="Tự đọc to" />} />
        <Row icon="lock" title="Quyền riêng tư" onClick={() => nav('/rieng-tu')} />
        {window.LCSNative?.openAdvanced && <Row icon="settings" title="Cài đặt nâng cao" onClick={() => window.LCSNative.openAdvanced()} />}
      </Group>
      <div className="t-sm center" style={{ padding: '4px 20px' }}>{APP} · dữ liệu trong bản thử là dữ liệu giả lập</div>
    </Screen>
  )
}

// ---------- A02 Thiết lập 3 lớp bảo vệ (Android mở đúng màn xin quyền qua LCSNative.enableLayer) ----------
// Lời trên màn viết cho bà; học sinh thì đổi "bà" thành "bạn"
const forPersona = (text, elder) => (elder ? text : text.replace(/ bà /g, ' bạn '))

function useVoiceAsk() {
  const [voice, setVoice] = useState(() => localStorage.getItem('lcs.voiceAsk') !== '0')
  const change = (v) => { setVoice(v); localStorage.setItem('lcs.voiceAsk', v ? '1' : '0'); window.LCSNative?.setVoiceAsk?.(v) }
  return [voice, change]
}

export function Setup() {
  const nav = useNavigate()
  const { relatives, persona } = useApp()
  const { state, on, enable } = useLayers()
  const [voice, setVoice] = useVoiceAsk()
  const elder = persona === 'elder'
  const first = relatives.find((r) => r.paired)
  const next = LAYERS.find((l) => !state[l.key])?.key
  if (on === LAYERS.length && !state.asleep) {
    return (
      <Screen name="A02b-thiet-lap-hoan-tat" bar={<Bar title="" left="back" onLeft={() => nav('/', { replace: true })} />}
        foot={<Btn onClick={() => nav('/', { replace: true })}>Về trang chủ</Btn>}>
        <div className="col ac g4 center">
          <Art name="an-toan" z={112} className="pop" />
          <div className="h-l" style={{ marginTop: 8 }}>Lá chắn đã sẵn sàng</div>
          <div className="t-body c-ink2">3/3 lớp đang bảo vệ {elder ? 'bà' : 'bạn'}</div>
        </div>
        <div className="group">
          {LAYERS.map((l) => (
            <div key={l.key} className="li">
              <IconBox icon={l.icon} tone="pri" size="sm" z={20} />
              <div className="t-row grow">{l.title}</div>
              <Tag kind="on">Đã bật</Tag>
            </div>
          ))}
        </div>
        {first ? (
          <div className="card tight col g8">
            <div className="t-lbl">Người thân nhận cảnh báo</div>
            <div className="row g12">
              <div className="avatar">{first.name[0]}</div>
              <div className="col grow g2">
                <div className="row jb g8"><div className="t-row">{first.name} ({first.relation})</div><Tag kind="on">Đã ghép</Tag></div>
                <div className="t-sm">Nhận cảnh báo qua {APP}</div>
              </div>
            </div>
          </div>
        ) : <Group><Row icon="plus" iconColor="pri" title="Thêm người thân nhận cảnh báo" onClick={() => nav('/nguoi-than/them')} /></Group>}
        <div className="card tight row g12">
          <IconBox icon="mic" tone="pri" z={20} />
          <div className="col grow g2">
            <div className="t-row t-b">Hỏi bằng giọng nói</div>
            <div className="t-sm">Sau cuộc gọi đáng ngờ, Lá chắn hỏi {elder ? 'bà' : 'bạn'} bằng lời. Tắt được bất cứ lúc nào.</div>
          </div>
          <Switch on={voice} onChange={setVoice} label="Hỏi bằng giọng nói" />
        </div>
      </Screen>
    )
  }
  return (
    <Screen name="A02a-thiet-lap-dang-lam" bar={<Bar title="Thiết lập lá chắn" right={<Speak text={elder
      ? `Bà ơi, mình bật ba lớp bảo vệ nha. Mỗi lớp bà chỉ cần bật một lần thôi ạ. Giờ bà đã bật được ${on} trên ba lớp rồi.`
      : `Bật ba lớp bảo vệ. Mỗi lớp chỉ cần bật một lần. Bạn đã bật ${on} trên ba lớp.`} />} />}>
      <div className="row g12">
        <IconBox icon="shield" tone="pri" size="lgx" z={32} />
        <div className="col grow"><div className="h-l">Bật 3 lớp bảo vệ</div><div className="t-lbl" style={{ fontWeight: 500 }}>Mỗi lớp chỉ cần bật một lần.</div></div>
      </div>
      <div className="row g12"><div className="grow"><Progress total={3} at={on} /></div><div className="t-sm t-b c-pri none">Đã bật {on}/3</div></div>
      {LAYERS.map((l) => {
        const isOn = state[l.key] && !state.asleep
        const isNext = l.key === next
        return (
          <div key={l.key} className={`card col g6 setup-layer${isOn ? ' tone-safe' : isNext ? ' next' : ' tone-gray'}`}>
            <div className="row g12">
              <IconBox icon={l.icon} tone={isOn ? 'solid-safe' : isNext ? 'pri' : 'white'} z={20} />
              <div className="h-m grow">{l.title}</div>
            </div>
            <div className="row g12">
              <div className={`t-sm grow${isOn ? ' c-safe-ink' : ''}`}>{forPersona(l.sub, elder)}</div>
              {isOn ? <Tag kind="w" icon="check">Đã bật</Tag>
                : <button type="button" className={`btn ${isNext ? 'p' : 'o'} sm setup-on`} onClick={() => enable(l.key)}>Bật</button>}
            </div>
          </div>
        )
      })}
      <Btn kind="o" icon="users" onClick={async () => {
        const text = `Con ơi, cài giúp mẹ ${APP} nhé: ${location.origin}${location.pathname}`
        try { if (navigator.share) await navigator.share({ title: APP, text }); else { await navigator.clipboard.writeText(text); native.speak('Con chép lời nhờ rồi nè bà, bà dán vào Zalo gửi cho con cháu nha') } } catch { /* bấm hủy */ }
      }}>Nhờ người thân cài hộ</Btn>
      <div className="why t-sm"><I n="lock" z={16} style={{ marginTop: 2 }} /><span>Lá chắn không lưu nội dung cuộc gọi, tin nhắn.</span></div>
    </Screen>
  )
}
