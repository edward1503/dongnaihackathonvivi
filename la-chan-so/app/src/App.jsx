import { Navigate, Route, Routes } from 'react-router-dom'
import Home from './screens/Home.jsx'
import { CheckMessage, CheckNumber } from './screens/Check.jsx'
import Result from './screens/Result.jsx'
import MessageResult from './screens/MessageResult.jsx'
import { AskReply, AskSend, AskWait } from './screens/Ask.jsx'
import { ReportCommunity, ReportDone, ReportForm } from './screens/Report.jsx'
import { NoRelatives, NotEnoughInfo, Offline } from './screens/States.jsx'
import { AfterCall, CallAnalysis, IncomingCall, NoRecording, QuickAsk, StopScreen } from './screens/Call.jsx'
import Setup from './screens/Setup.jsx'
import Notification from './screens/Notification.jsx'
import DemoPanel from './ui/DemoPanel.jsx'

// Mỗi đường dẫn ứng với một khung trong thiết kế (mã màn ghi bên cạnh)
export default function App() {
  return (
    <>
    <DemoPanel />
    <Routes>
      <Route path="/" element={<Home />} />                                   {/* A01a, A01b; Lá chắn đang ngủ: E01a */}
      <Route path="/kiem-tra" element={<CheckNumber />} />                    {/* A06a */}
      <Route path="/kiem-tra/tin-nhan" element={<CheckMessage />} />          {/* A06b */}
      <Route path="/ket-qua" element={<Result />} />                          {/* A07a–d */}
      <Route path="/phan-tich" element={<MessageResult />} />                 {/* A05b */}
      <Route path="/hoi-nguoi-than" element={<AskSend />} />                  {/* A08a */}
      <Route path="/hoi-nguoi-than/cho" element={<AskWait />} />              {/* A08b */}
      <Route path="/hoi-nguoi-than/tra-loi" element={<AskReply />} />         {/* A08c */}
      <Route path="/bao-cao" element={<ReportForm />} />                      {/* A09a */}
      <Route path="/bao-cao/cong-dong" element={<ReportCommunity />} />       {/* A09b */}
      <Route path="/bao-cao/xong" element={<ReportDone />} />                 {/* A09c */}
      <Route path="/chua-co-nguoi-than" element={<NoRelatives />} />          {/* E01b */}
      <Route path="/mat-mang" element={<Offline />} />                        {/* E01c */}
      <Route path="/chua-du-thong-tin" element={<NotEnoughInfo />} />         {/* E01d */}
      <Route path="/cuoc-goi" element={<IncomingCall />} />                 {/* A03a, A03b */}
      <Route path="/sau-cuoc-goi" element={<AfterCall />} />               {/* điều phối khi cúp máy */}
      <Route path="/hoi-nhanh" element={<QuickAsk />} />                   {/* A04a */}
      <Route path="/phan-tich-cuoc-goi" element={<CallAnalysis />} />      {/* A04b */}
      <Route path="/khong-ghi-am" element={<NoRecording />} />             {/* A04c */}
      <Route path="/dung-lai" element={<StopScreen />} />                  {/* A10a; ?danggoi=1: A10b */}
      <Route path="/thiet-lap" element={<Setup />} />                      {/* A02a, A02b */}
      <Route path="/thong-bao" element={<Notification />} />               {/* A05a */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  )
}
