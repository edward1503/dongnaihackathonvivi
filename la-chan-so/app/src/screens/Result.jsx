// U2: A07a Nguy hiểm · A07b Nghi ngờ · A07c An toàn · A07d Chưa có dữ liệu (một bố cục, đổi theo `level`)
import { Navigate, useNavigate } from 'react-router-dom'
import Icon from '../ui/Icon.jsx'
import { AppBar, Phone } from '../ui/Phone.jsx'
import { LevelBanner, ObjectCard, SelfCheckCard, TodoCard, WhyCard } from '../ui/result.jsx'
import { KIND } from '../lib/format.js'
import { openLearn } from '../lib/links.js'
import { useApp } from '../lib/state.jsx'
import '../ui/result.css'

const FRAME = { danger: 'A07a-ket-qua-nguy-hiem', suspicious: 'A07b-ket-qua-nghi-ngo', safe: 'A07c-ket-qua-an-toan', unknown: 'A07d-ket-qua-chua-co-du-lieu' }

export default function Result() {
  const nav = useNavigate()
  const { result, toast, setReport } = useApp()
  if (!result) return <Navigate to="/kiem-tra" replace />

  const noun = (KIND[result.kind] || KIND.phone).noun
  const startReport = () => {
    setReport({ draft: { kind: result.kind === 'phone' ? 'call' : result.kind, target: result.display, fromResult: result } })
    nav('/bao-cao')
  }
  const reportLabel = result.level === 'unknown' ? 'Vẫn nghi ngờ? Báo cáo' : `Báo cáo ${noun}`

  return (
    <Phone name={FRAME[result.level] || FRAME.unknown}>
      <AppBar title="Kết quả kiểm tra" onBack={() => nav('/kiem-tra')} />
      <div className="content" style={{ paddingTop: 4, gap: 12 }}>
        <ObjectCard result={result} />
        <LevelBanner result={result} />
        {result.level === 'unknown' ? <SelfCheckCard onAllChecked={() => toast('Vẫn nên hỏi người thân trước khi chuyển tiền')} /> : <WhyCard result={result} />}
        <TodoCard result={result} onStory={() => openLearn(result.scamType, toast)} />

        <div className="col gap-8 mt-auto">
          {result.level === 'safe' ? (
            <button type="button" className="btn outline block" onClick={() => nav('/kiem-tra')}><Icon name="search" size={20} />Kiểm tra số khác</button>
          ) : (
            <>
              <button type="button" className="btn primary block" onClick={() => nav('/hoi-nguoi-than')}><Icon name="users" size={20} />Hỏi người thân</button>
              <button type="button" className="btn outline block" onClick={startReport}><Icon name="flag" size={20} />{reportLabel}</button>
            </>
          )}
        </div>
      </div>
    </Phone>
  )
}
