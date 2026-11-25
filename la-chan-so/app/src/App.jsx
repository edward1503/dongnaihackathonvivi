// Đường dẫn của app (HashRouter). Giao diện V3: 3 đối tượng, mỗi màn ghi mã khung trong data-name.
// APK dùng các màn bảo vệ Android. Các đường mô phỏng cuộc gọi dành cho trình duyệt.
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import Home from './v3/screens/Home.jsx'
import { Privacy, Profile, RolePick, Setup, Splash, WardPick } from './v3/screens/Common.jsx'
import { CheckRoute, MessageResult, NotEnough, Offline, Result } from './v3/screens/Check.jsx'
import { AddRelative, AskReply, AskSend, AskWait, NoRelatives, Relatives, SimCall } from './v3/screens/People.jsx'
import { AfterCallQuestions, Emergency, Voice } from './v3/screens/Help.jsx'
import { AfterCall, CallAnalysis, IncomingCall, Notification, QuickAsk, StopScreen } from './v3/screens/Call.jsx'
import { LessonCards, Lessons, Quiz, QuizResult } from './v3/screens/Student.jsx'
import { Report, ReportDone } from './v3/screens/Report.jsx'
import { Appeal } from './v3/screens/Appeal.jsx'
import { useApp } from './lib/state.jsx'
import { native } from './lib/native.js'
import { NewType, Review, Share, Stats, TeamCode } from './v3/screens/Volunteer.jsx'
import DemoPanel from './ui/DemoPanel.jsx'

function TeamRoute({ lead = false }) {
  const { team, persona } = useApp()
  if (!team || persona !== 'volunteer') return <Navigate to="/ma-doi" replace />
  if (lead && team.member.role !== 'lead') return <Navigate to="/duyet" replace />
  return <Outlet />
}

function BrowserDemoRoute() {
  return native.available() ? <Navigate to="/" replace /> : <Outlet />
}

export default function App() {
  const { persona, team } = useApp()
  const { pathname } = useLocation()
  if (persona === 'volunteer' && !team && !['/ma-doi', '/vai', '/chao'].includes(pathname)) return <Navigate to="/ma-doi" replace />

  return (
    <>
      {!native.available() && <DemoPanel />}
      <Routes>
        {/* Chung */}
        <Route path="/" element={<Home />} />                              {/* A1, B1, C1; E01a khi Lá chắn đang ngủ */}
        <Route path="/chao" element={<Splash />} />                        {/* 00 */}
        <Route path="/vai" element={<RolePick />} />                       {/* 0 */}
        <Route path="/rieng-tu" element={<Privacy />} />                   {/* 0b */}
        <Route path="/phuong" element={<WardPick />} />                    {/* 0c */}
        <Route path="/ca-nhan" element={<Profile />} />                    {/* 0d */}
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
        <Route path="/bai-hoc" element={<Lessons />} />                    {/* B5 */}
        <Route path="/bai-hoc/:id" element={<LessonCards />} />            {/* B6 */}
        <Route path="/kiem-tra-bai" element={<Quiz />} />                  {/* B7 */}
        <Route path="/kiem-tra-bai/ket-qua" element={<QuizResult />} />    {/* B8 */}
        {/* Đội tình nguyện */}
        <Route path="/ma-doi" element={<TeamCode />} />                    {/* C0 */}
        <Route path="/canh-bao-khu-pho" element={<NewType />} />
        <Route element={<TeamRoute />}>
          <Route path="/thong-ke" element={<Stats />} />
          <Route path="/kieu-moi" element={<NewType />} />
          <Route path="/duyet" element={<Review />} />
        </Route>
        <Route element={<TeamRoute lead />}>
          <Route path="/chia-se" element={<Share />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
