// Chung cho 3 đối tượng: 00 màn chào · 0 chọn vai · 0b quyền riêng tư · 0c chọn phường · 0d cá nhân · A02 thiết lập 3 lớp
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { APP, Art, Bar, Btn, Circle, Group, I, Logo, Progress, Row, Screen, Speak, StateView, Switch, Tag } from '../ui.jsx'
import { LAYERS, useLayers } from '../../lib/layers.js'
import { native } from '../../lib/native.js'
import { useApp } from '../../lib/state.jsx'
import bieuTrung from '../art/bieu-trung-dong-nai.webp'

export const WARDS = ['Trấn Biên', 'Biên Hòa', 'Tam Hiệp', 'Long Bình', 'Trảng Dài', 'Hố Nai', 'Long Hưng', 'Tam Phước', 'Phước Tân']
export const ROLES = [
  { mode: 'simple', icon: 'user', title: 'Người lớn tuổi', sub: 'Chữ to, đọc to, hỏi con cháu một chạm' },
  { mode: 'full', icon: 'grad', title: 'Học sinh', sub: 'Kiểm tra tin nhắn, học qua truyện 1 phút' },
  { mode: 'volunteer', icon: 'mega', title: 'Đội tình nguyện', sub: 'Duyệt báo cáo, cảnh báo khu phố' },
]

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
    setMode(m)
    nav(onboarded ? (m === 'volunteer' ? '/ma-doi' : '/') : '/rieng-tu', { replace: onboarded })
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
          <button key={r.mode} type="button" className="li tap rise" onClick={() => pick(r.mode)}
            style={{ background: '#fff', minHeight: 84, border: mode === r.mode && onboarded ? '2px solid var(--pri)' : '1px solid var(--line)', animationDelay: `${i * 0.05}s` }}>
            <Circle z={52} icon={r.icon} />
            <div className="col grow g2"><div className="t-row">{r.title}</div><div className="t-sub">{r.sub}</div></div>
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
  const { onboarded } = useApp()
  const rows = [
    ['mic', 'Micro', 'Khi bấm nói', 'ok'],
    ['msg', 'Thông báo tin nhắn', 'Lọc trên máy', 'ok'],
    ['phonein', 'Cuộc gọi đến', 'Chỉ tra số', 'ok'],
    ['lock', 'Nội dung cuộc gọi, tin nhắn', 'Không lưu', 'no'],
  ]
  return (
    <Screen name="0b-quyen-rieng-tu" bar={onboarded ? <Bar title="Quyền riêng tư" /> : null}
      foot={!onboarded && <Btn onClick={() => nav('/phuong')}>Đồng ý</Btn>}>
      <div className="col g10" style={{ paddingTop: onboarded ? 0 : 18 }}>
        <Circle z={64} icon="lock" iz={30} />
        <div className="h-l">Quyền riêng tư</div>
      </div>
      <Group>
        {rows.map(([icon, t, v, k]) => <Row key={t} icon={icon} title={t} right={<Tag kind={k}>{v}</Tag>} />)}
      </Group>
      <div className="card col g10">
        {['Tin có mã OTP không bao giờ rời máy.', 'Số điện thoại, số tài khoản được che trước khi gửi AI.', 'Người thân chỉ thấy mức cảnh báo và tóm tắt đã che.'].map((t) => (
          <div key={t} className="why"><I n="check" z={22} c="safe" sw={2.6} /><span>{t}</span></div>
        ))}
      </div>
    </Screen>
  )
}

// ---------- 0c Chọn phường ----------
export function WardPick() {
  const nav = useNavigate()
  const { ward, setWard, onboarded, setOnboarded, mode } = useApp()
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
      <div className="t-sub" style={{ padding: '0 4px' }}>Lá chắn báo cho bạn các kiểu lừa đảo mới ở phường mình.</div>
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

// ---------- 0d Cá nhân ----------
export function Profile() {
  const nav = useNavigate()
  const { persona, relatives, ward, points } = useApp()
  const { on, asleep } = useLayers()
  const [auto, setAuto] = useState(() => localStorage.getItem('lcs.autoSpeak') !== '0')
  const [voice, setVoice] = useState(() => localStorage.getItem('lcs.voiceAsk') !== '0')
  const role = ROLES.find((r) => r.mode === { elder: 'simple', student: 'full', volunteer: 'volunteer' }[persona])
  const toggle = (key, set) => (v) => { set(v); localStorage.setItem(key, v ? '1' : '0'); if (key === 'lcs.voiceAsk') window.LCSNative?.setVoiceAsk?.(v) }
  return (
    <Screen name="0d-ca-nhan" nav="/ca-nhan">
      <div className="row jb" style={{ paddingTop: 10 }}>
        <div className="h-xl">Cá nhân</div>
        {persona === 'student' && <Tag kind="new" icon="award">{points} điểm</Tag>}
      </div>
      <Group>
        <Row icon="users" title="Người thân" value={relatives[0]?.name || 'Chưa có'} onClick={() => nav('/nguoi-than')} />
        <Row icon="pin" title="Phường" value={ward} onClick={() => nav('/phuong')} />
        <Row icon="swap" title="Vai trò" value={role?.title} onClick={() => nav('/vai')} />
      </Group>
      {persona !== 'volunteer' && (
        <Group>
          <Row icon={asleep ? 'shieldoff' : 'shieldok'} iconColor={asleep ? 'dang' : 'safe'} title="Lá chắn" onClick={() => nav('/thiet-lap')}
            right={<Tag kind={asleep ? 'off' : 'on'}>{asleep ? 'Đang ngủ' : `${on}/3 lớp`}</Tag>} />
          <Row icon="mic" title="Hỏi bằng giọng nói" right={<Switch on={voice} onChange={toggle('lcs.voiceAsk', setVoice)} label="Hỏi bằng giọng nói" />} />
        </Group>
      )}
      <Group>
        <Row icon="vol" title="Tự đọc to" right={<Switch on={auto} onChange={toggle('lcs.autoSpeak', setAuto)} label="Tự đọc to" />} />
        <Row icon="lock" title="Quyền riêng tư" onClick={() => nav('/rieng-tu')} />
      </Group>
      <div className="t-sm center" style={{ padding: '4px 20px' }}>{APP} · dữ liệu trong bản thử là dữ liệu giả lập</div>
    </Screen>
  )
}

// ---------- A02 Thiết lập 3 lớp bảo vệ (Android mở đúng màn xin quyền qua LCSNative.enableLayer) ----------
export function Setup() {
  const nav = useNavigate()
  const { relatives } = useApp()
  const { state, on, enable } = useLayers()
  const first = relatives.find((r) => r.paired)
  const next = LAYERS.find((l) => !state[l.key])?.key
  if (on === LAYERS.length && !state.asleep) {
    return (
      <Screen name="A02b-thiet-lap-hoan-tat" bar={<Bar title="" left="back" onLeft={() => nav('/', { replace: true })} />}
        foot={<Btn onClick={() => nav('/', { replace: true })}>Về trang chủ</Btn>}>
        <div className="col ac g8 center">
          <Art name="an-toan" z={170} className="pop" />
          <div className="h-l">Lá chắn đã sẵn sàng</div>
          <div className="t-body c-ink2">3/3 lớp đang bảo vệ bạn</div>
        </div>
        <Group>
          {LAYERS.map((l) => <Row key={l.key} lead={<Circle z={44} icon={l.icon} iz={22} />} title={l.title} right={<Tag kind="on">Đã bật</Tag>} />)}
        </Group>
        {first
          ? <Group><Row lead={<div className="avatar">{first.name[0]}</div>} title={`${first.name} (${first.relation})`} sub="Nhận cảnh báo qua ứng dụng nhắn tin" right={<Tag kind="on">Đã ghép</Tag>} /></Group>
          : <Group><Row icon="plus" iconColor="pri" title="Thêm người thân nhận cảnh báo" onClick={() => nav('/nguoi-than/them')} /></Group>}
      </Screen>
    )
  }
  return (
    <Screen name="A02a-thiet-lap-dang-lam" bar={<Bar title="Thiết lập lá chắn" right={<Speak text={`Bật ba lớp bảo vệ. Mỗi lớp chỉ cần bật một lần. Đã bật ${on} trên 3.`} />} />}>
      <div className="row g12">
        <Circle z={64} icon="shield" iz={32} />
        <div className="col grow"><div className="h-m">Bật 3 lớp bảo vệ</div><div className="t-sub">Mỗi lớp chỉ cần bật một lần.</div></div>
      </div>
      <div className="row g12"><div className="grow"><Progress total={3} at={on} /></div><div className="t-b c-pri" style={{ fontSize: 15 }}>Đã bật {on}/3</div></div>
      {LAYERS.map((l) => {
        const isOn = state[l.key] && !state.asleep
        const isNext = l.key === next
        return (
          <div key={l.key} className="card col g10" style={{ border: isNext ? '2px solid var(--pri)' : '1px solid var(--line)', background: isOn ? 'var(--safe-t)' : '#fff' }}>
            <div className="row g12">
              <Circle z={48} icon={l.icon} iz={24} bg={isOn ? 'safe' : 'pri-t'} c={isOn ? 'w' : 'pri'} />
              <div className="t-row grow" style={{ fontSize: 20 }}>{l.title}</div>
            </div>
            <div className="row g12">
              <div className="t-sub grow">{l.sub}</div>
              {isOn ? <Tag kind="on" icon="check">Đã bật</Tag> : <button type="button" className={`btn ${isNext ? 'p' : 'o'} sm`} style={{ height: 52 }} onClick={() => enable(l.key)}>Bật</button>}
            </div>
          </div>
        )
      })}
      <Btn kind="o" icon="users" onClick={async () => {
        const text = `Con ơi, cài giúp mẹ ${APP} nhé: ${location.origin}${location.pathname}`
        try { if (navigator.share) await navigator.share({ title: APP, text }); else { await navigator.clipboard.writeText(text); native.speak('Đã chép lời nhờ, bà dán vào Zalo gửi cho con nhé') } } catch { /* bấm hủy */ }
      }}>Nhờ người thân cài hộ</Btn>
      <div className="why t-sub"><I n="lock" z={18} /><span>Lá chắn không lưu nội dung cuộc gọi, tin nhắn.</span></div>
    </Screen>
  )
}
