// Đường dẫn của app (HashRouter). Giao diện V3: 3 đối tượng, mỗi màn ghi mã khung trong data-name.
// APK dùng các màn bảo vệ Android. Các đường mô phỏng cuộc gọi dành cho trình duyệt.
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { FamilyDetail, FamilyHome, FamilyInbox, FamilyPair } from './v3/screens/Family.jsx'
import Home from './v3/screens/Home.jsx'
import { Privacy, Profile, RolePick, Setup, Splash, WardPick } from './v3/screens/Common.jsx'
import { CheckRoute, MessageResult, NotEnough, Offline, Result } from './v3/screens/Check.jsx'
import { AddRelative, AskReply, AskSend, AskWait, NoRelatives, Relatives, SimCall } from './v3/screens/People.jsx'
import { AfterCallQuestions, Emergency, Voice } from './v3/screens/Help.jsx'
import { AfterCall, CallAnalysis, IncomingCall, Notification, QuickAsk, StopScreen } from './v3/screens/Call.jsx'
import { LessonCards, Lessons, Quiz, QuizResult } from './v3/screens/Student.jsx'
import { LeaderboardPage } from './v3/screens/Leaderboard.jsx'
import { Report, ReportDone } from './v3/screens/Report.jsx'
import { Appeal } from './v3/screens/Appeal.jsx'
import { useApp } from './lib/state.jsx'
import { native } from './lib/native.js'
import { NewType } from './v3/screens/Volunteer.jsx'
import { API_BASE } from './lib/api.js'
import DemoPanel from './ui/DemoPanel.jsx'

// Đội tình nguyện duyệt trên trang web /web (bảng thống kê, hàng chờ, khiếu nại), không duyệt trong app.
// Quyền duyệt do máy chủ kiểm bằng phiên đội; app chỉ chỉ đường sang web.
function TeamOnWeb() {
  const { setMode } = useApp()
  const url = (API_BASE || location.origin) + '/web'
  return (
    <div className="shell"><div className="phone" data-name="C0w-doi-dung-web"><div className="col g16" style={{ padding: 24, marginTop: 48 }}>
      <h1 className="h-l">Đội tình nguyện làm việc trên trang web</h1>
      <div className="t-body c-ink2">Xét hồ sơ, xử lý báo nhầm và phát cảnh báo khu phố trên trang web của đội, có bảng thống kê đầy đủ. Đăng nhập bằng mã đội được cấp.</div>
      <div className="t-body" style={{ wordBreak: 'break-all' }}><b>{url}</b></div>
      <button type="button" className="btn" onClick={() => { setMode('simple'); location.hash = '#/vai' }}>Chọn vai khác</button>
    </div></div></div>
  )
}

function BrowserDemoRoute() {
  return native.available() ? <Navigate to="/" replace /> : <Outlet />
}

export default function App() {
  const { persona, team, familyCode } = useApp()
  const { pathname } = useLocation()
  if (persona === 'volunteer' && !['/vai', '/chao'].includes(pathname)) return <TeamOnWeb />

  const relative = persona === 'relative'
  if (relative && !familyCode && !['/ma-gia-dinh', '/vai'].includes(pathname)) return <Navigate to="/ma-gia-dinh" replace />
  const sharedRoutes = <>
    <Route path="/chao" element={<Splash />} />
    <Route path="/vai" element={<RolePick />} />
    <Route path="/rieng-tu" element={<Privacy />} />
    <Route path="/ca-nhan" element={<Profile />} />
    <Route path="/ma-gia-dinh" element={<FamilyPair />} />
    <Route path="/bai-hoc" element={<Lessons />} />
    <Route path="/bai-hoc/:id" element={<LessonCards />} />
    <Route path="/kiem-tra-bai" element={<Quiz />} />
    <Route path="/kiem-tra-bai/ket-qua" element={<QuizResult />} />
    <Route path="/thi-dua" element={<LeaderboardPage />} />
  </>
  if (relative && familyCode) return <FamilyInbox code={familyCode}>
    <Routes>
      {sharedRoutes}
      <Route path="/" element={<FamilyHome />} />
      <Route path="/canh-bao/:id" element={<FamilyDetail key={pathname} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </FamilyInbox>

  return (
    <>
      {!native.available() && <DemoPanel />}
      <Routes>
        {sharedRoutes}
        <Route path="/" element={<Home />} />                              {/* A1, B1, C1; E01a khi Lá chắn đang ngủ */}
        <Route path="/phuong" element={<WardPick />} />                    {/* 0c */}
        <Route path="/thiet-lap" element={<Setup />} />                    {/* A02a, A02b */}
        {/* Kiểm tra */}
        <Route path="/kiem-tra" element={<CheckRoute />} />                     {/* A2, A2t, B2 */}
        <Route path="/mat-mang" element={<Offline />} />                   {/* A2b */}
        <Route path="/ket-qua" element={<Result />} />                     {/* A3: 4 mức */}
        <Route path="/phan-tich" element={<MessageResult />} />            {/* B3 */}
        <Route path="/chua-du-thong-tin" element={<NotEnough />} />        {/* E01d */}
        <Route path="/bao-nham" element={<Appeal />} />
        <Route path="/doc-so" element={<Voice />} />                       {/* A7, A7b */}
        {/* Người thân */}
        <Route path="/nguoi-than" element={<Relatives />} />               {/* A4 */}
        <Route path="/nguoi-than/them" element={<AddRelative />} />        {/* A4c */}
        <Route path="/chua-co-nguoi-than" element={<NoRelatives />} />     {/* A4a */}
        <Route path="/hoi-nguoi-than" element={<AskSend />} />             {/* A4 hỏi */}
        <Route path="/hoi-nguoi-than/cho" element={<AskWait />} />         {/* A4b */}
        <Route path="/hoi-nguoi-than/tra-loi" element={<AskReply />} />    {/* lời trả lời của Minh */}
        <Route path="/goi" element={<SimCall />} />                        {/* A8 mô phỏng */}
        {/* Khi đang bị lừa, cuộc gọi */}
        <Route path="/khan-cap" element={<Emergency />} />                 {/* A5 */}
        <Route path="/ke-lai" element={<AfterCallQuestions />} />          {/* A6 */}
        <Route path="/khong-ghi-am" element={<AfterCallQuestions />} />    {/* A04c = A6 */}
        <Route element={<BrowserDemoRoute />}>
          <Route path="/cuoc-goi" element={<IncomingCall />} />              {/* A03a, A03b */}
          <Route path="/sau-cuoc-goi" element={<AfterCall />} />
          <Route path="/hoi-nhanh" element={<QuickAsk />} />                 {/* A04a */}
          <Route path="/phan-tich-cuoc-goi" element={<CallAnalysis />} />    {/* A04b */}
          <Route path="/dung-lai" element={<StopScreen />} />                {/* A10a; ?danggoi=1: A10b */}
          <Route path="/thong-bao" element={<Notification />} />             {/* A05a */}
        </Route>
        {/* Học sinh */}
        <Route path="/bao-cao" element={<Report />} />                     {/* B4, B4a */}
        <Route path="/bao-cao/xong" element={<ReportDone />} />            {/* B4b */}
        {/* Cảnh báo khu phố cho mọi người; việc của đội tình nguyện nằm trên trang web /web */}
        <Route path="/canh-bao-khu-pho" element={<NewType />} />
        {['/ma-doi', '/thong-ke', '/kieu-moi', '/duyet', '/chia-se'].map((p) => <Route key={p} path={p} element={<TeamOnWeb />} />)}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
