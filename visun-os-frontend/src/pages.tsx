import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { ArrowLeft, ArrowRight, BellRing, BookOpen, CalendarDays, ChevronRight, CircleAlert, FileText, Inbox as InboxIcon, Plus, Search, Sparkles, Users } from 'lucide-react'
import type { InboxItem } from './domain'
import { isOpenTask, taskStatusLabel } from './domain'
import { CustomerForm, NoteForm, OpportunityForm, TaskForm } from './forms'
import { useDemo } from './store'
import { Card, Empty, Modal, PageHeading, PriorityBadge, SectionHeading, StatusBadge, TaskRow, useToast } from './ui'
import { addDays, dateLabel, dateTimeLabel, normalise, relativeLabel, todayISO, uid } from './utils'
export { AIPage, CalendarPage, OpportunityDetailPage, OpportunitiesPage, ProjectDetailPage, ProjectsPage, SearchPage, SettingsPage } from './pagesMore'

function Back({to,label}:{to:string;label:string}){return <Link className="back-link" to={to}><ArrowLeft size={16}/>{label}</Link>}
function DetailMissing({name,to}:{name:string;to:string}){return <div className="not-found"><h1>Không tìm thấy {name}</h1><Link className="button primary" to={to}>Quay lại danh sách</Link></div>}

export function DashboardPage(){
  const {state,add}=useDemo();const toast=useToast();const navigate=useNavigate();const [quick,setQuick]=useState('')
  const today=todayISO();const open=state.tasks.filter(isOpenTask);const active=open.filter(t=>t.status!=='waiting')
  const overdue=active.filter(t=>t.dueAt&&t.dueAt<today)
  const todayTasks=active.filter(t=>t.dueAt===today)
  const waiting=open.filter(t=>t.status==='waiting'&&t.reviewAt&&t.reviewAt<=today)
  const followups=state.customers.filter(c=>!c.archived&&c.nextContactAt&&c.nextContactAt<=today)
  const milestones=state.projects.filter(p=>!p.archived&&p.status!=='done'&&p.nextMilestoneAt&&p.nextMilestoneAt<=addDays(today,7)).sort((a,b)=>(a.nextMilestoneAt||'').localeCompare(b.nextMilestoneAt||''))
  const appointments=state.events.filter(e=>!e.archived&&!e.cancelled&&e.start.slice(0,10)>=today).sort((a,b)=>a.start.localeCompare(b.start)).slice(0,3)
  const inboxCount=state.inbox.filter(i=>i.status==='new'&&!i.archived).length
  const learningNow=state.learning.filter(item=>!item.archived&&item.status==='active').sort((a,b)=>(a.nextReviewAt||'9999').localeCompare(b.nextReviewAt||'9999')).slice(0,3)
  const quickSave=(event:FormEvent)=>{event.preventDefault();if(!quick.trim())return;add('inbox',{content:quick.trim(),status:'new'});setQuick('');toast('Đã lưu vào Hộp ghi nhanh trên trình duyệt này.')}
  const firstName='anh Hùng'
  return <>
    <div className="dashboard-hero"><div><div className="hero-kicker"><span className="accent-slashes">///</span> BÀN ĐIỀU HÀNH AI TRAINER</div><h1>Chào {firstName},<br/><span>hôm nay mình làm gì?</span></h1><p>{new Intl.DateTimeFormat('vi-VN',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date())} · Việc rõ ràng, cam kết không bị trôi.</p></div><div className="hero-sun" aria-hidden="true"><div className="sun-disc"/><div className="sun-horizon"/></div></div>
    <form className="quick-capture" onSubmit={quickSave}><span className="quick-icon"><Plus size={20}/></span><input value={quick} onChange={e=>setQuick(e.target.value)} placeholder="Ghi nhanh một việc hoặc điều vừa trao đổi..." aria-label="Ghi nhanh"/><button className="button primary" type="submit">Lưu nhanh <ArrowRight size={16}/></button></form>
    <div className="summary-grid">
      <Link to="/tasks?view=today" className="summary-card"><span className="summary-icon blue"><CalendarDays size={20}/></span><span className="summary-num">{todayTasks.length}</span><strong>Việc hôm nay</strong><small>Cần xử lý trong ngày</small><ArrowRight className="summary-arrow" size={17}/></Link>
      <Link to="/tasks?view=overdue" className="summary-card"><span className="summary-icon orange"><CircleAlert size={20}/></span><span className="summary-num">{overdue.length}</span><strong>Đã quá hạn</strong><small>Vẫn cần xử lý</small><ArrowRight className="summary-arrow" size={17}/></Link>
      <Link to="/tasks?view=waiting" className="summary-card"><span className="summary-icon sky"><BellRing size={20}/></span><span className="summary-num">{waiting.length}</span><strong>Cần hỏi lại</strong><small>Đến ngày theo dõi</small><ArrowRight className="summary-arrow" size={17}/></Link>
      <Link to="/inbox" className="summary-card"><span className="summary-icon navy"><InboxIcon size={20}/></span><span className="summary-num">{inboxCount}</span><strong>Hộp ghi nhanh</strong><small>Chưa phân loại</small><ArrowRight className="summary-arrow" size={17}/></Link>
    </div>
    <div className="dashboard-columns"><div className="stack">
      <Card><SectionHeading title="Việc cần xử lý hôm nay" link="/tasks?view=today"/>{todayTasks.length?todayTasks.slice(0,5).map(t=><TaskRow key={t.id} task={t} compact/>):<Empty title="Hôm nay chưa có việc đến hạn" description="Có thể thêm việc bằng ô Ghi nhanh phía trên."/>}</Card>
      <Card><SectionHeading title="Quá hạn cần chú ý" link="/tasks?view=overdue"/>{overdue.length?overdue.slice(0,4).map(t=><TaskRow key={t.id} task={t} compact/>):<Empty title="Không có việc quá hạn"/>}</Card>
      <Card><SectionHeading title="Đang chờ phản hồi" link="/tasks?view=waiting"/>{waiting.length?waiting.slice(0,4).map(t=><TaskRow key={t.id} task={t} compact/>):<Empty title="Chưa có việc cần hỏi lại hôm nay"/>}</Card>
    </div><div className="stack">
      <Card className="side-card"><SectionHeading title="Lịch sắp tới" link="/calendar"/>{appointments.map(e=><div className="side-item" key={e.id}><span className="date-tile"><b>{new Date(e.start).getDate()}</b><small>THG {new Date(e.start).getMonth()+1}</small></span><div><strong>{e.title}</strong><small>{dateTimeLabel(e.start)}</small>{e.customerId&&<Link to={`/customers/${e.customerId}`}>Mở hồ sơ khách <ChevronRight size={13}/></Link>}</div></div>)}</Card>
      <Card className="side-card"><SectionHeading title="Khách cần liên hệ" link="/customers?view=followup"/>{followups.length?followups.slice(0,4).map(c=><Link className="side-item link-item" key={c.id} to={`/customers/${c.id}`}><span className="entity-avatar">{c.name.slice(0,1)}</span><div><strong>{c.name}</strong><small>{c.need}</small><span>{relativeLabel(c.nextContactAt)}</span></div><ChevronRight size={16}/></Link>):<Empty title="Chưa có khách đến ngày liên hệ"/>}</Card>
      <Card className="side-card"><SectionHeading title="Dự án cần chú ý" link="/projects"/>{milestones.slice(0,3).map(p=><Link className="side-item link-item" to={`/projects/${p.id}`} key={p.id}><span className="project-dot"/><div><strong>{p.title}</strong><small>Mốc tiếp theo · {relativeLabel(p.nextMilestoneAt)}</small></div><ChevronRight size={16}/></Link>)}</Card>
      <Card className="side-card"><SectionHeading title="Đang học & nghiên cứu" link="/learning"/>{learningNow.map(item=><Link className="side-item link-item" to={`/learning/${item.id}`} key={item.id}><span className="summary-icon blue"><BookOpen size={16}/></span><div><strong>{item.title}</strong><small>{item.nextAction||'Chưa đặt bước tiếp theo'}</small><span>{item.progress}% · Xem lại {relativeLabel(item.nextReviewAt)}</span></div><ChevronRight size={16}/></Link>)}</Card>
    </div></div>
    <div className="dashboard-footer"><Sparkles size={19}/><div><strong>Thử luồng sau cuộc gọi</strong><span>Ghi một câu vào Hộp ghi nhanh, sau đó dùng AI demo để xem bản nháp thay đổi.</span></div><button className="button outline" onClick={()=>navigate('/ai')}>Mở AI demo <ArrowRight size={16}/></button></div>
  </>
}

export function InboxPage(){
  const {state,add,update,convertInbox}=useDemo();const toast=useToast();const navigate=useNavigate()
  const [text,setText]=useState('');const [filter,setFilter]=useState<'new'|'all'>('new');const [modal,setModal]=useState<{kind:'task'|'note'|'opportunity';item:InboxItem}|null>(null)
  const save=(event:FormEvent)=>{event.preventDefault();if(!text.trim())return;add('inbox',{content:text.trim(),status:'new'});setText('');toast('Đã lưu ý vào dữ liệu minh họa.')}
  const items=state.inbox.filter(i=>!i.archived&&(filter==='all'||i.status==='new')).sort((a,b)=>b.createdAt.localeCompare(a.createdAt))
  return <><PageHeading eyebrow="GHI LẠI TRƯỚC, PHÂN LOẠI SAU" title="Hộp ghi nhanh" description="Ý mới nhập được lưu ngay. Anh có thể biến nó thành công việc, ghi chú, cơ hội hoặc ý tưởng nội dung." action={<span className="count-pill">{state.inbox.filter(i=>i.status==='new').length} chưa xử lý</span>}/>
    <Card className="capture-card"><form onSubmit={save}><textarea value={text} onChange={e=>setText(e.target.value)} rows={3} placeholder="Ví dụ: Gửi đề cương cho Công ty An Phát thứ Sáu..." aria-label="Nội dung ghi nhanh"/><div className="capture-footer"><span>Nhập một câu là đủ. Dữ liệu chỉ lưu trên trình duyệt này.</span><button className="button primary" type="submit"><Plus size={17}/> Lưu ghi nhanh</button></div></form></Card>
    <div className="tabs"><button className={filter==='new'?'active':''} onClick={()=>setFilter('new')}>Chưa xử lý</button><button className={filter==='all'?'active':''} onClick={()=>setFilter('all')}>Tất cả</button></div>
    <Card className="list-card">{items.length?items.map(item=><div className="inbox-row" key={item.id}><span className={`inbox-mark ${item.status==='new'?'is-new':''}`}/><div className="inbox-content"><p>{item.content}</p><small>{dateTimeLabel(item.createdAt)} · {item.status==='new'?'Chưa xử lý':item.status==='processed'?'Đã phân loại':'Đã bỏ qua'}</small>{item.linkedId&&<Link to={item.linkedType==='task'?`/tasks/${item.linkedId}`:item.linkedType==='opportunity'?`/opportunities/${item.linkedId}`:item.linkedType==='content'?`/content/${item.linkedId}`:'/search?q='+encodeURIComponent(item.content.slice(0,15))}>Mở mục đã tạo <ArrowRight size={14}/></Link>}</div>{item.status==='new'&&<div className="inbox-actions"><button className="button small outline" onClick={()=>setModal({kind:'task',item})}>+ Việc</button><button className="button small outline" onClick={()=>setModal({kind:'note',item})}>+ Ghi chú</button><button className="button small outline" onClick={()=>setModal({kind:'opportunity',item})}>+ Cơ hội</button><button className="button small outline" onClick={()=>navigate(`/content?inbox=${item.id}`)}>+ Nội dung</button><button className="button small subtle" onClick={()=>navigate(`/ai?inbox=${item.id}`)}><Sparkles size={15}/> AI demo</button><button className="text-button" onClick={()=>{if(window.confirm('Bỏ qua mục này trong dữ liệu demo?'))update('inbox',item.id,{status:'dismissed'})}}>Bỏ qua</button></div>}</div>):<Empty title="Không có mục nào ở bộ lọc này" description="Ghi nhanh một ý ở ô phía trên để thử."/>}</Card>
    {modal&&<Modal title={modal.kind==='task'?'Tạo việc từ ghi nhanh':modal.kind==='note'?'Tạo ghi chú từ ghi nhanh':'Tạo cơ hội từ ghi nhanh'} onClose={()=>setModal(null)} wide>
      {modal.kind==='task'&&<TaskForm defaults={{title:modal.item.content,sourceInboxId:modal.item.id}} onClose={()=>setModal(null)} onSaved={id=>convertInbox(modal.item.id,'task',id)}/>}
      {modal.kind==='note'&&<NoteForm defaults={{title:'Ghi chú từ Hộp ghi nhanh',content:modal.item.content,sourceInboxId:modal.item.id}} onClose={()=>setModal(null)} onSaved={id=>convertInbox(modal.item.id,'note',id)}/>}
      {modal.kind==='opportunity'&&<OpportunityForm defaults={{title:modal.item.content}} onClose={()=>setModal(null)} onSaved={id=>convertInbox(modal.item.id,'opportunity',id)}/>}
    </Modal>}
  </>
}

export function TasksPage(){
  const {state}=useDemo();const [params,setParams]=useSearchParams();const navigate=useNavigate();const [modal,setModal]=useState(false)
  const view=params.get('view')||'all';const today=todayISO();const weekEnd=addDays(today,7)
  const [customerId,setCustomerId]=useState('');const [projectId,setProjectId]=useState('');const [assigneeId,setAssigneeId]=useState('');const [query,setQuery]=useState('')
  const filtered=state.tasks.filter(t=>!t.archived).filter(t=>{
    if(view==='today'&&!(isOpenTask(t)&&t.status!=='waiting'&&t.dueAt===today))return false
    if(view==='week'&&!(isOpenTask(t)&&t.status!=='waiting'&&t.dueAt&&t.dueAt>=today&&t.dueAt<=weekEnd))return false
    if(view==='overdue'&&!(isOpenTask(t)&&t.status!=='waiting'&&t.dueAt&&t.dueAt<today))return false
    if(view==='waiting'&&!(t.status==='waiting'))return false
    if(view==='done'&&t.status!=='done')return false
    if(customerId&&t.customerId!==customerId)return false
    if(projectId&&t.projectId!==projectId)return false
    if(assigneeId&&t.assigneeId!==assigneeId)return false
    return !query||normalise(t.title+' '+t.description).includes(normalise(query))
  }).sort((a,b)=>(a.status==='done'?1:0)-(b.status==='done'?1:0)||(a.status==='waiting'?a.reviewAt||'':a.dueAt||'9999').localeCompare(b.status==='waiting'?b.reviewAt||'':b.dueAt||'9999'))
  const views=[['all','Tất cả'],['today','Hôm nay'],['week','Tuần này'],['overdue','Quá hạn'],['waiting','Chờ phản hồi'],['done','Đã xong']]
  return <><PageHeading eyebrow="CÔNG VIỆC & CAM KẾT" title="Công việc" description="Một nơi để theo dõi việc cần làm, người phụ trách, ngày hạn và bối cảnh." action={<button className="button primary" onClick={()=>setModal(true)}><Plus size={17}/> Tạo việc</button>}/>
    <div className="tabs scroll-tabs">{views.map(([key,label])=><button key={key} className={view===key?'active':''} onClick={()=>setParams(key==='all'?{}:{view:key})}>{label}</button>)}</div>
    <div className="filter-bar"><div className="filter-search"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Tìm trong công việc" aria-label="Tìm trong công việc"/></div><select aria-label="Lọc khách hàng" value={customerId} onChange={e=>setCustomerId(e.target.value)}><option value="">Mọi khách hàng</option>{state.customers.filter(c=>!c.archived).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select><select aria-label="Lọc dự án" value={projectId} onChange={e=>setProjectId(e.target.value)}><option value="">Mọi dự án</option>{state.projects.filter(p=>!p.archived).map(p=><option key={p.id} value={p.id}>{p.title}</option>)}</select><select aria-label="Lọc người phụ trách" value={assigneeId} onChange={e=>setAssigneeId(e.target.value)}><option value="">Mọi người</option>{state.users.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select></div>
    <div className="result-count">{filtered.length} việc trong bộ lọc</div>
    <Card className="list-card">{filtered.length?filtered.map(t=><TaskRow key={t.id} task={t}/>):<Empty title="Không có việc phù hợp" description="Thử bộ lọc khác hoặc tạo một việc mới." action={<button className="button outline" onClick={()=>setModal(true)}>Tạo việc</button>}/>}</Card>
    {modal&&<Modal title="Tạo công việc" onClose={()=>setModal(false)} wide><TaskForm onClose={()=>setModal(false)} onSaved={id=>navigate(`/tasks/${id}`)}/></Modal>}
  </>
}

export function TaskDetailPage(){
  const {id}=useParams();const {state,archive,toggleTask}=useDemo();const toast=useToast();const navigate=useNavigate();const [editing,setEditing]=useState(false)
  const task=state.tasks.find(t=>t.id===id&&!t.archived);if(!task)return <DetailMissing name="công việc" to="/tasks"/>
  const customer=state.customers.find(c=>c.id===task.customerId);const project=state.projects.find(p=>p.id===task.projectId);const opportunity=state.opportunities.find(o=>o.id===task.opportunityId)
  const note=state.notes.find(n=>n.id===task.sourceNoteId);const inbox=state.inbox.find(i=>i.id===task.sourceInboxId);const assignee=state.users.find(u=>u.id===task.assigneeId)
  return <><Back to="/tasks" label="Tất cả công việc"/><PageHeading eyebrow={task.promisedTo?'CAM KẾT VỚI KHÁCH':'CHI TIẾT CÔNG VIỆC'} title={task.title} description={task.description} action={<div className="button-group"><button className="button outline" onClick={()=>setEditing(true)}>Chỉnh sửa</button><button className="button primary" onClick={()=>{toggleTask(task.id);toast(task.status==='done'?'Đã mở lại việc.':'Đã hoàn thành việc trong dữ liệu demo.')}}>{task.status==='done'?'Mở lại':'Hoàn thành'}</button></div>}/>
    <div className="detail-grid"><Card title="Thông tin xử lý"><div className="detail-fields"><div><span>Trạng thái</span><StatusBadge status={task.status}/></div><div><span>Ưu tiên</span><PriorityBadge priority={task.priority}/></div><div><span>Hạn hoàn thành</span><strong>{dateLabel(task.dueAt)}</strong></div><div><span>Ngày hỏi lại</span><strong>{dateLabel(task.reviewAt)}</strong></div><div><span>Người phụ trách</span><strong>{assignee?.name||'Chưa rõ'}</strong></div><div><span>Thời gian đã xếp</span><strong>{task.scheduledStart?dateTimeLabel(task.scheduledStart):'Chưa xếp lịch'}</strong></div><div><span>Lặp lại</span><strong>{task.recurrence==='daily'?'Hằng ngày':task.recurrence==='weekly'?'Hằng tuần':'Không'}</strong></div>{task.promisedTo&&<div><span>Đã hứa với</span><strong>{task.promisedTo}</strong></div>}</div><div className="detail-actions"><button className="text-button danger" onClick={()=>{if(window.confirm('Lưu trữ việc này trong dữ liệu demo?')){archive('tasks',task.id);navigate('/tasks')}}}>Lưu trữ việc</button></div></Card>
      <div className="stack"><Card title="Bối cảnh liên quan"><div className="linked-list">{customer&&<Link to={`/customers/${customer.id}`}><Users size={18}/><span><small>KHÁCH HÀNG</small>{customer.name}</span><ArrowRight size={16}/></Link>}{opportunity&&<Link to={`/opportunities/${opportunity.id}`}><Sparkles size={18}/><span><small>CƠ HỘI</small>{opportunity.title}</span><ArrowRight size={16}/></Link>}{project&&<Link to={`/projects/${project.id}`}><FileText size={18}/><span><small>DỰ ÁN</small>{project.title}</span><ArrowRight size={16}/></Link>}{!customer&&!opportunity&&!project&&<Empty title="Việc này chưa gắn hồ sơ" description="Có thể thêm khách hoặc dự án khi chỉnh sửa việc."/>}</div></Card>
      {(note||inbox)&&<Card title="Nguồn tạo việc">{note&&<div className="source-note"><span className="eyebrow">GHI CHÚ · {dateLabel(note.createdAt)}</span><strong>{note.title}</strong><p>{note.content}</p>{note.customerId&&<Link className="text-link" to={`/customers/${note.customerId}`}>Mở hồ sơ chứa ghi chú <ArrowRight size={15}/></Link>}</div>}{inbox&&<div className="source-note"><span className="eyebrow">HỘP GHI NHANH</span><p>{inbox.content}</p><Link className="text-link" to="/inbox">Mở Hộp ghi nhanh <ArrowRight size={15}/></Link></div>}</Card>}</div></div>
    {editing&&<Modal title="Chỉnh sửa công việc" onClose={()=>setEditing(false)} wide><TaskForm initial={task} onClose={()=>setEditing(false)}/></Modal>}
  </>
}

export function CustomersPage(){
  const {state}=useDemo();const [params,setParams]=useSearchParams();const navigate=useNavigate();const [modal,setModal]=useState(false);const [query,setQuery]=useState('')
  const type=params.get('type')||'all';const view=params.get('view')||'';const today=todayISO()
  const customers=state.customers.filter(c=>!c.archived).filter(c=>(type==='all'||c.type===type)&&(!view||view!=='followup'||!!c.nextContactAt&&c.nextContactAt<=today)&&(!query||normalise(`${c.name} ${c.contactName} ${c.need}`).includes(normalise(query))))
  return <><PageHeading eyebrow="QUAN HỆ & BỐI CẢNH" title="Khách hàng" description="Thông tin, lịch sử trao đổi và những điều mình đã hứa với từng khách." action={<button className="button primary" onClick={()=>setModal(true)}><Plus size={17}/> Thêm khách</button>}/>
    <div className="tabs"><button className={type==='all'&&!view?'active':''} onClick={()=>setParams({})}>Tất cả</button><button className={type==='B2B'?'active':''} onClick={()=>setParams({type:'B2B'})}>Doanh nghiệp</button><button className={type==='B2C'?'active':''} onClick={()=>setParams({type:'B2C'})}>Cá nhân / SME</button><button className={view==='followup'?'active':''} onClick={()=>setParams({view:'followup'})}>Cần liên hệ</button></div>
    <div className="filter-bar"><div className="filter-search wide"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Tìm khách, người liên hệ hoặc nhu cầu" aria-label="Tìm khách hàng"/></div></div>
    <div className="customer-grid">{customers.map(c=>{const opps=state.opportunities.filter(o=>o.customerId===c.id&&!o.archived);const openTasks=state.tasks.filter(t=>t.customerId===c.id&&isOpenTask(t));return <Link className="customer-card" to={`/customers/${c.id}`} key={c.id}><div className="customer-card-top"><span className="entity-avatar large">{c.name.slice(0,1)}</span><span className="type-pill">{c.type==='B2B'?'Doanh nghiệp':'Cá nhân'}</span></div><h2>{c.name}</h2><p>{c.need}</p><div className="customer-card-meta"><span>{c.contactName||'Chưa có đầu mối'}</span><span>{c.status}</span></div><div className="customer-card-footer"><span><strong>{opps.length}</strong> cơ hội</span><span><strong>{openTasks.length}</strong> việc mở</span><span className={c.nextContactAt&&c.nextContactAt<=today?'urgent':''}>{relativeLabel(c.nextContactAt)}</span><ArrowRight size={17}/></div></Link>})}</div>
    {!customers.length&&<Card><Empty title="Không có khách phù hợp" description="Thử bộ lọc khác hoặc thêm khách minh họa."/></Card>}
    {modal&&<Modal title="Thêm khách hàng" onClose={()=>setModal(false)} wide><CustomerForm onClose={()=>setModal(false)} onSaved={id=>navigate(`/customers/${id}`)}/></Modal>}
  </>
}

export function CustomerDetailPage(){
  const {id}=useParams();const {state,update,archive}=useDemo();const toast=useToast();const navigate=useNavigate()
  const [edit,setEdit]=useState(false);const [note,setNote]=useState(false);const [task,setTask]=useState(false);const [opp,setOpp]=useState(false)
  const [newContact,setNewContact]=useState({name:'',role:''});const [showContact,setShowContact]=useState(false)
  const customer=state.customers.find(c=>c.id===id&&!c.archived);if(!customer)return <DetailMissing name="khách hàng" to="/customers"/>
  const tasks=state.tasks.filter(t=>t.customerId===id&&!t.archived);const opportunities=state.opportunities.filter(o=>o.customerId===id&&!o.archived)
  const projects=state.projects.filter(p=>p.customerId===id&&!p.archived);const notes=state.notes.filter(n=>n.customerId===id&&!n.archived)
  const events=state.events.filter(e=>e.customerId===id&&!e.archived&&!e.cancelled)
  const timeline=[...notes.map(n=>({id:n.id,date:n.createdAt,title:n.title,description:n.content,type:'Ghi chú',href:''})),...tasks.map(t=>({id:t.id,date:t.createdAt,title:t.title,description:taskStatusLabel[t.status],type:'Công việc',href:`/tasks/${t.id}`})),...events.map(e=>({id:e.id,date:e.start,title:e.title,description:dateTimeLabel(e.start),type:'Cuộc hẹn',href:'/calendar'}))].sort((a,b)=>b.date.localeCompare(a.date))
  const addContact=(event:FormEvent)=>{event.preventDefault();if(!newContact.name.trim())return;update('customers',customer.id,{contacts:[...customer.contacts,{id:uid(),name:newContact.name.trim(),role:newContact.role.trim()}]});setNewContact({name:'',role:''});setShowContact(false);toast('Đã thêm người liên hệ vào dữ liệu demo.')}
  return <><Back to="/customers" label="Danh sách khách hàng"/><div className="customer-detail-hero"><div className="entity-avatar xl">{customer.name.slice(0,1)}</div><div><span className="eyebrow">{customer.type==='B2B'?'KHÁCH DOANH NGHIỆP':'KHÁCH CÁ NHÂN / SME'}</span><h1>{customer.name}</h1><p>{customer.need}</p><div className="hero-meta"><span>{customer.status}</span><span>Liên hệ tiếp: {relativeLabel(customer.nextContactAt)}</span><span>{customer.channel}</span></div></div><button className="button outline" onClick={()=>setEdit(true)}>Chỉnh sửa hồ sơ</button></div>
    <div className="detail-grid"><div className="stack"><Card><SectionHeading title="Cam kết & việc còn mở"/><div className="inline-actions"><button className="button small outline" onClick={()=>setTask(true)}><Plus size={15}/> Thêm việc</button><button className="button small outline" onClick={()=>setNote(true)}><Plus size={15}/> Ghi chú</button></div>{tasks.filter(isOpenTask).length?tasks.filter(isOpenTask).map(t=><TaskRow key={t.id} task={t} compact/>):<Empty title="Không có việc còn mở"/>}</Card>
      <Card><SectionHeading title="Dòng thời gian"/>{timeline.length?timeline.map(item=><div className="timeline-item" key={`${item.type}-${item.id}`}><span className="timeline-dot"/><div><small>{item.type} · {dateLabel(item.date)}</small>{item.href?<Link to={item.href}>{item.title}</Link>:<strong>{item.title}</strong>}<p>{item.description}</p></div></div>):<Empty title="Chưa có lịch sử"/>}</Card></div>
      <div className="stack"><Card title="Thông tin liên hệ"><div className="detail-fields"><div><span>Đầu mối chính</span><strong>{customer.contactName||'Chưa ghi'}</strong></div><div><span>Kênh</span><strong>{customer.channel||'Chưa ghi'}</strong></div><div><span>Email</span><strong>{customer.email||'Chưa ghi'}</strong></div><div><span>Điện thoại</span><strong>{customer.phone||'Chưa ghi'}</strong></div></div>{customer.type==='B2B'&&<><div className="subheading-row"><h3>Người liên hệ</h3><button className="text-button" onClick={()=>setShowContact(!showContact)}>+ Thêm</button></div>{customer.contacts.map(contact=><div className="contact-line" key={contact.id}><span className="entity-avatar">{contact.name.slice(0,1)}</span><div><strong>{contact.name}</strong><small>{contact.role}</small></div></div>)}{showContact&&<form className="mini-form" onSubmit={addContact}><input placeholder="Tên người liên hệ" value={newContact.name} onChange={e=>setNewContact({...newContact,name:e.target.value})}/><input placeholder="Vai trò" value={newContact.role} onChange={e=>setNewContact({...newContact,role:e.target.value})}/><button className="button small primary">Lưu người liên hệ</button></form>}</>}
      </Card><Card><SectionHeading title="Cơ hội hợp tác"><button className="text-button" onClick={()=>setOpp(true)}>+ Tạo cơ hội</button></SectionHeading>{opportunities.map(o=><Link className="linked-tile" key={o.id} to={`/opportunities/${o.id}`}><span className="project-dot"/><div><strong>{o.title}</strong><small>{o.stage} · {relativeLabel(o.nextActionAt)}</small></div><ArrowRight size={15}/></Link>)}{!opportunities.length&&<Empty title="Chưa có cơ hội"/>}</Card><Card><SectionHeading title="Dự án liên quan"/>{projects.map(p=><Link className="linked-tile" key={p.id} to={`/projects/${p.id}`}><span className="project-dot"/><div><strong>{p.title}</strong><small>Mốc: {relativeLabel(p.nextMilestoneAt)}</small></div><ArrowRight size={15}/></Link>)}{!projects.length&&<Empty title="Chưa có dự án"/>}</Card><button className="text-button danger archive-link" onClick={()=>{if(window.confirm('Lưu trữ hồ sơ khách này trong dữ liệu demo?')){archive('customers',customer.id);navigate('/customers')}}}>Lưu trữ hồ sơ</button></div></div>
    {edit&&<Modal title="Chỉnh sửa khách hàng" onClose={()=>setEdit(false)} wide><CustomerForm initial={customer} onClose={()=>setEdit(false)}/></Modal>}
    {note&&<Modal title="Ghi chú cuộc trao đổi" onClose={()=>setNote(false)} wide><NoteForm defaults={{customerId:customer.id}} onClose={()=>setNote(false)}/></Modal>}
    {task&&<Modal title="Tạo việc cho khách" onClose={()=>setTask(false)} wide><TaskForm defaults={{customerId:customer.id}} onClose={()=>setTask(false)}/></Modal>}
    {opp&&<Modal title="Tạo cơ hội cho khách" onClose={()=>setOpp(false)} wide><OpportunityForm defaults={{customerId:customer.id}} onClose={()=>setOpp(false)}/></Modal>}
  </>
}
