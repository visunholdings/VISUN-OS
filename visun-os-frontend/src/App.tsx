import { useState, type FormEvent } from 'react'
import { BrowserRouter, Link, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router'
import { Bell, BookOpen, Bot, BriefcaseBusiness, CalendarDays, ChevronDown, ClipboardList, Database, FolderKanban, Home, Inbox, Lightbulb, Megaphone, Menu, Plus, Search, Settings, Users, X } from 'lucide-react'
import { DemoProvider, useDemo } from './store'
import { ToastProvider, Notice } from './ui'
import { AIPage, CalendarPage, CustomerDetailPage, CustomersPage, DashboardPage, InboxPage, OpportunityDetailPage, OpportunitiesPage, ProjectDetailPage, ProjectsPage, SearchPage, SettingsPage, TaskDetailPage, TasksPage } from './pages'
import { DataDetailPage, DataPage, KnowledgeDetailPage, KnowledgePage, LearningDetailPage, LearningPage } from './pagesKnowledge'
import { ContentDetailPage, ContentPage } from './pagesContent'
import { LiveBackendPage } from './pagesLive'
import './styles.css'

const navItems=[
  {to:'/',label:'Hôm nay',icon:Home,end:true},
  {to:'/inbox',label:'Hộp ghi nhanh',icon:Inbox},
  {to:'/tasks',label:'Công việc',icon:ClipboardList},
  {to:'/customers',label:'Khách hàng',icon:Users},
  {to:'/opportunities',label:'Cơ hội',icon:BriefcaseBusiness},
  {to:'/projects',label:'Dự án',icon:FolderKanban},
  {to:'/learning',label:'Học & nghiên cứu',icon:BookOpen},
  {to:'/knowledge',label:'Kho kiến thức',icon:Lightbulb},
  {to:'/data',label:'Dữ liệu dự án',icon:Database},
  {to:'/content',label:'Truyền thông & nội dung',icon:Megaphone},
  {to:'/calendar',label:'Lịch',icon:CalendarDays},
  {to:'/ai',label:'AI demo',icon:Bot},
]
function Shell(){
  const {state,storageError}=useDemo();const navigate=useNavigate();const location=useLocation()
  const [search,setSearch]=useState('');const [mobileMenu,setMobileMenu]=useState(false)
  const inboxCount=state.inbox.filter(item=>item.status==='new'&&!item.archived).length
  const submitSearch=(event:FormEvent)=>{event.preventDefault();navigate(`/search?q=${encodeURIComponent(search)}`);setMobileMenu(false)}
  const nav=(mobile=false)=><>{navItems.map(({to,label,icon:Icon,end})=><NavLink key={to} to={to} end={end} className={({isActive})=>`nav-link ${isActive?'active':''}`} onClick={()=>mobile&&setMobileMenu(false)}><Icon size={19}/><span>{label}</span>{to==='/inbox'&&inboxCount>0&&<em>{inboxCount}</em>}</NavLink>)}</>
  return <div className="app-shell">
    <aside className="sidebar"><div className="brand-block"><Link to="/" aria-label="VISUNAI - về Hôm nay"><img src="/brand/visunai-logo.png" alt="VISUNAI"/></Link><span>VISUN OS <small>AI TRAINER WORKSPACE</small></span></div><div className="sidebar-label">KHÔNG GIAN LÀM VIỆC</div><nav aria-label="Điều hướng chính">{nav()}</nav><div className="sidebar-bottom"><NavLink to="/settings" className={({isActive})=>`nav-link ${isActive?'active':''}`}><Settings size={19}/><span>Thiết lập</span></NavLink><div className="user-chip"><span className="avatar">H</span><span><strong>Anh Hùng</strong><small>Chủ sở hữu · Bản thử</small></span><ChevronDown size={15}/></div></div></aside>
    <div className="main-frame"><header className="topbar"><div className="mobile-brand"><img src="/brand/visunai-logo.png" alt="VISUNAI"/><span>VISUN OS</span></div><form className="search-form" onSubmit={submitSearch}><Search size={18}/><input value={search} onChange={event=>setSearch(event.target.value)} placeholder="Tìm việc, khách, kiến thức, dữ liệu..." aria-label="Tìm kiếm chung"/><kbd>↵</kbd></form><div className="top-actions"><span className="demo-pill">BẢN THỬ <i/> DỮ LIỆU MINH HỌA</span><Link className="top-icon" to="/settings" aria-label="Xem thiết lập nhắc việc"><Bell size={19}/></Link><span className="avatar top-avatar">H</span></div></header>
      {storageError&&<div className="storage-warning"><Notice tone="warning">{storageError}</Notice></div>}
      <main key={location.pathname} className="main-content"><Routes>
        <Route path="/" element={<DashboardPage/>}/><Route path="/inbox" element={<InboxPage/>}/>
        <Route path="/tasks" element={<TasksPage/>}/><Route path="/tasks/:id" element={<TaskDetailPage/>}/>
        <Route path="/customers" element={<CustomersPage/>}/><Route path="/customers/:id" element={<CustomerDetailPage/>}/>
        <Route path="/opportunities" element={<OpportunitiesPage/>}/><Route path="/opportunities/:id" element={<OpportunityDetailPage/>}/>
        <Route path="/projects" element={<ProjectsPage/>}/><Route path="/projects/:id" element={<ProjectDetailPage/>}/>
        <Route path="/learning" element={<LearningPage/>}/><Route path="/learning/:id" element={<LearningDetailPage/>}/>
        <Route path="/knowledge" element={<KnowledgePage/>}/><Route path="/knowledge/:id" element={<KnowledgeDetailPage/>}/>
        <Route path="/data" element={<DataPage/>}/><Route path="/data/:id" element={<DataDetailPage/>}/>
        <Route path="/content" element={<ContentPage/>}/><Route path="/content/:id" element={<ContentDetailPage/>}/>
        <Route path="/calendar" element={<CalendarPage/>}/><Route path="/ai" element={<AIPage/>}/>
        <Route path="/search" element={<SearchPage/>}/><Route path="/settings" element={<SettingsPage/>}/>
        <Route path="/live" element={<LiveBackendPage/>}/>
        <Route path="*" element={<div className="not-found"><h1>Không tìm thấy trang</h1><Link className="button primary" to="/">Về Hôm nay</Link></div>}/>
      </Routes></main>
    </div>
    <div className="mobile-bottom"><NavLink to="/" end><Home size={20}/><span>Hôm nay</span></NavLink><NavLink to="/tasks"><ClipboardList size={20}/><span>Việc</span></NavLink><NavLink to="/inbox" className="mobile-add" aria-label="Ghi nhanh"><Plus size={23}/><span>Ghi nhanh</span></NavLink><NavLink to="/customers"><Users size={20}/><span>Khách</span></NavLink><button onClick={()=>setMobileMenu(true)} aria-label="Mở thêm trang"><Menu size={20}/><span>Thêm</span></button></div>
    {mobileMenu&&<div className="mobile-menu-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget)setMobileMenu(false)}}><div className="mobile-menu"><div className="mobile-menu-head"><strong>VISUN OS</strong><button className="icon-button" onClick={()=>setMobileMenu(false)} aria-label="Đóng menu"><X size={20}/></button></div>{nav(true)}<NavLink to="/settings" className="nav-link" onClick={()=>setMobileMenu(false)}><Settings size={19}/>Thiết lập</NavLink></div></div>}
  </div>
}
export default function App(){return <BrowserRouter><DemoProvider><ToastProvider><Shell/></ToastProvider></DemoProvider></BrowserRouter>}
