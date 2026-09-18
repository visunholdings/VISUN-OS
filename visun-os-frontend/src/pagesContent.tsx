import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { ArrowLeft, ArrowRight, CalendarDays, ChevronLeft, ChevronRight, ClipboardList, ExternalLink, Lightbulb, Megaphone, Plus, Search } from 'lucide-react'
import type { ContentChannel, ContentItem, ContentPublication, ContentStatus } from './domain'
import { contentChannelLabel, contentEvidenceLabel, contentPillarLabel, contentStatusLabel } from './domain'
import { useDemo } from './store'
import { Card, Empty, Field, Modal, Notice, PageHeading, useToast } from './ui'
import { addDays, dateLabel, normalise, todayISO } from './utils'

const channels: ContentChannel[] = ['facebook','linkedin','youtube','tiktok']
const stages: ContentStatus[] = ['idea','selected','draft','review','ready','published']
const safeUrl = (value?: string) => { try { const url=new URL(value||''); return ['http:','https:'].includes(url.protocol)?url.href:undefined } catch { return undefined } }
const monthTitle = (month:string) => new Intl.DateTimeFormat('vi-VN',{month:'long',year:'numeric'}).format(new Date(`${month}-01T12:00:00`))
const moveMonth = (month:string, step:number) => { const d=new Date(`${month}-01T12:00:00`); d.setMonth(d.getMonth()+step); return d.toLocaleDateString('en-CA').slice(0,7) }

function ContentForm({initial,defaultInboxId,onClose,onSaved}:{initial?:ContentItem;defaultInboxId?:string;onClose:()=>void;onSaved?:(id:string)=>void}) {
  const {state,add,update,convertInbox}=useDemo(); const toast=useToast()
  const sourceInbox=state.inbox.find(item=>item.id===defaultInboxId&&item.status==='new')
  const [title,setTitle]=useState(initial?.title||sourceInbox?.content.slice(0,110)||'')
  const [angle,setAngle]=useState(initial?.angle||'')
  const [audience,setAudience]=useState<ContentItem['audience']>(initial?.audience||'B2C')
  const [pillar,setPillar]=useState<ContentItem['pillar']>(initial?.pillar||'experience')
  const [status,setStatus]=useState<ContentStatus>(initial?.status||'idea')
  const [sourceType,setSourceType]=useState<ContentItem['sourceType']>(initial?.sourceType||(sourceInbox?'inbox':'manual'))
  const [knowledgeId,setKnowledgeId]=useState(initial?.knowledgeId||'')
  const [inboxId,setInboxId]=useState(initial?.inboxId||sourceInbox?.id||'')
  const [sourceUrl,setSourceUrl]=useState(initial?.sourceUrl||'')
  const [sourceNote,setSourceNote]=useState(initial?.sourceNote||'')
  const [draft,setDraft]=useState(initial?.draft||'')
  const [cta,setCta]=useState(initial?.cta||'')
  const [evidence,setEvidence]=useState<ContentItem['evidence']>(initial?.evidence||'unchecked')
  const [nextAction,setNextAction]=useState(initial?.nextAction||'')
  const [dueAt,setDueAt]=useState(initial?.dueAt||'')
  const [selectedChannels,setSelectedChannels]=useState<ContentChannel[]>(initial?.publications.map(p=>p.channel)||['facebook'])
  const [schedule,setSchedule]=useState('')
  const availableInbox=state.inbox.filter(item=>!item.archived&&(item.status==='new'||item.id===initial?.inboxId))
  const toggleChannel=(channel:ContentChannel)=>setSelectedChannels(current=>current.includes(channel)?current.filter(x=>x!==channel):[...current,channel])
  const save=(event:FormEvent)=>{
    event.preventDefault()
    if (!title.trim()) return toast('Hãy nhập tên ý tưởng hoặc nội dung.')
    if (sourceUrl.trim()&&!safeUrl(sourceUrl.trim())) return toast('Đường dẫn nguồn cần bắt đầu bằng http hoặc https.')
    if (sourceType==='knowledge'&&!knowledgeId) return toast('Hãy chọn mục kiến thức làm nguồn.')
    if (sourceType==='inbox'&&!inboxId) return toast('Hãy chọn một mục trong Hộp ghi nhanh.')
    const previous=initial?.publications||[]
    const publications=selectedChannels.map(channel=>previous.find(p=>p.channel===channel)||{channel,scheduledAt:schedule||undefined})
    if(previous.some(pub=>pub.url&&!selectedChannels.includes(pub.channel)))return toast('Không thể bỏ kênh đã có link bài đăng. Hãy giữ kênh để không mất số liệu.')
    if(status==='published'&&!publications.some(pub=>pub.url))return toast('Hãy lưu link bài đăng ở phần Kênh & kết quả trước khi đánh dấu Đã đăng.')
    const patch={title:title.trim(),angle:angle.trim(),audience,pillar,status,sourceType,sourceUrl:sourceUrl.trim()||undefined,sourceNote:sourceNote.trim()||undefined,knowledgeId:sourceType==='knowledge'?knowledgeId:undefined,inboxId:sourceType==='inbox'?inboxId:undefined,draft:draft.trim(),cta:cta.trim(),evidence,publications,nextAction:nextAction.trim()||undefined,dueAt:dueAt||undefined}
    if(initial){update('content',initial.id,patch);toast('Đã lưu nội dung trên trình duyệt này.');onClose();return}
    const item=add('content',patch)
    if(sourceType==='inbox'&&inboxId)convertInbox(inboxId,'content',item.id)
    toast('Đã thêm nội dung vào bảng truyền thông.');onClose();onSaved?.(item.id)
  }
  return <form className="content-form" onSubmit={save}>
    <Field label="Tên ý tưởng / nội dung" required><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Ví dụ: CEO theo dõi cam kết sau họp ra sao?" required/></Field>
    <Field label="Góc triển khai"><textarea rows={2} value={angle} onChange={e=>setAngle(e.target.value)} placeholder="Vấn đề thật và góc nhìn của anh..."/></Field>
    <div className="form-two"><Field label="Đối tượng"><select value={audience} onChange={e=>setAudience(e.target.value as ContentItem['audience'])}><option value="B2C">CEO / chủ SME</option><option value="B2B">Doanh nghiệp / đội ngũ</option></select></Field><Field label="Trụ cột nội dung"><select value={pillar} onChange={e=>setPillar(e.target.value as ContentItem['pillar'])}>{Object.entries(contentPillarLabel).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></Field></div>
    <div className="form-two"><Field label="Tiến độ"><select value={status} onChange={e=>setStatus(e.target.value as ContentStatus)}>{stages.map(stage=><option key={stage} value={stage}>{contentStatusLabel[stage]}</option>)}</select></Field><Field label="Tình trạng chứng cứ"><select value={evidence} onChange={e=>setEvidence(e.target.value as ContentItem['evidence'])}>{Object.entries(contentEvidenceLabel).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></Field></div>
    <div className="content-form-divider">NGUỒN Ý TƯỞNG</div>
    <div className="form-two"><Field label="Nguồn"><select value={sourceType} onChange={e=>setSourceType(e.target.value as ContentItem['sourceType'])}><option value="manual">Tự ghi nhận</option><option value="inbox">Hộp ghi nhanh</option><option value="knowledge">Kho kiến thức</option><option value="research">Nghiên cứu bên ngoài</option></select></Field>{sourceType==='inbox'?<Field label="Mục ghi nhanh"><select value={inboxId} onChange={e=>{const id=e.target.value;setInboxId(id);const source=state.inbox.find(x=>x.id===id);if(source&&!title)setTitle(source.content.slice(0,110))}}><option value="">Chọn mục...</option>{availableInbox.map(item=><option key={item.id} value={item.id}>{item.content.slice(0,100)}</option>)}</select></Field>:sourceType==='knowledge'?<Field label="Mục kiến thức"><select value={knowledgeId} onChange={e=>{const id=e.target.value;setKnowledgeId(id);const source=state.knowledge.find(x=>x.id===id);if(source&&!title)setTitle(source.title)}}><option value="">Chọn mục...</option>{state.knowledge.filter(item=>!item.archived).map(item=><option key={item.id} value={item.id}>{item.title}</option>)}</select></Field>:<Field label="Đường dẫn nguồn"><input type="url" value={sourceUrl} onChange={e=>setSourceUrl(e.target.value)} placeholder="https://..."/></Field>}</div>
    <Field label="Ghi chú nguồn / điều cần kiểm tra"><textarea rows={2} value={sourceNote} onChange={e=>setSourceNote(e.target.value)} placeholder="Nguồn nào, thông tin nào chỉ là giả định, đã được phép chia sẻ chưa?"/></Field>
    <div className="content-form-divider">SẢN XUẤT & ĐĂNG BÀI</div>
    <Field label="Bản nháp"><textarea rows={5} value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Vấn đề → trải nghiệm → insight → cách áp dụng → CTA"/></Field>
    <Field label="CTA nhỏ"><input value={cta} onChange={e=>setCta(e.target.value)} placeholder="Ví dụ: Anh/chị đang xử lý việc này thế nào?"/></Field>
    <fieldset className="content-channel-field"><legend>Kênh dự kiến</legend><div>{channels.map(channel=><label key={channel}><input type="checkbox" checked={selectedChannels.includes(channel)} onChange={()=>toggleChannel(channel)}/>{contentChannelLabel[channel]}</label>)}</div></fieldset>
    {!initial&&<Field label="Ngày dự kiến đăng (có thể để trống)"><input type="date" value={schedule} onChange={e=>setSchedule(e.target.value)}/></Field>}
    <div className="form-two"><Field label="Việc tiếp theo"><input value={nextAction} onChange={e=>setNextAction(e.target.value)} placeholder="Ví dụ: Xác minh ví dụ thực tế"/></Field><Field label="Hạn xử lý"><input type="date" value={dueAt} onChange={e=>setDueAt(e.target.value)}/></Field></div>
    <div className="form-actions"><button type="button" className="button outline" onClick={onClose}>Hủy</button><button type="submit" className="button primary">{initial?'Lưu thay đổi':'Thêm nội dung'}</button></div>
  </form>
}

function ContentCalendar({items}:{items:ContentItem[]}) {
  const [month,setMonth]=useState(todayISO().slice(0,7))
  const first=`${month}-01`; const firstWeekday=(new Date(`${first}T12:00:00`).getDay()+6)%7
  const days=Array.from({length:42},(_,index)=>addDays(first,index-firstWeekday))
  const entries=items.flatMap(item=>item.publications.filter(pub=>pub.scheduledAt||pub.publishedAt).map(pub=>({item,pub,date:(pub.publishedAt||pub.scheduledAt||'').slice(0,10)})))
  return <Card className="content-calendar-card"><div className="content-calendar-head"><h2>{monthTitle(month)}</h2><div className="button-group"><button className="button small outline" onClick={()=>setMonth(moveMonth(month,-1))} aria-label="Tháng trước"><ChevronLeft size={17}/></button><button className="button small outline" onClick={()=>setMonth(todayISO().slice(0,7))}>Tháng này</button><button className="button small outline" onClick={()=>setMonth(moveMonth(month,1))} aria-label="Tháng sau"><ChevronRight size={17}/></button></div></div><div className="content-calendar-grid">{['T2','T3','T4','T5','T6','T7','CN'].map(day=><strong className="content-calendar-weekday" key={day}>{day}</strong>)}{days.map(day=><div key={day} className={`content-calendar-day ${day.startsWith(month)?'':'outside'} ${day===todayISO()?'today':''}`}><span>{Number(day.slice(-2))}</span>{entries.filter(entry=>entry.date===day).map(({item,pub})=><Link key={`${item.id}-${pub.channel}`} to={`/content/${item.id}`} className={`content-calendar-entry ${pub.url?'posted':''}`} title={`${item.title} · ${contentChannelLabel[pub.channel]}`}><small>{contentChannelLabel[pub.channel]}</small>{item.title}</Link>)}</div>)}</div></Card>
}

export function ContentPage(){
  const {state}=useDemo();const navigate=useNavigate();const [searchParams]=useSearchParams();const inboxParam=searchParams.get('inbox')||undefined;const [modal,setModal]=useState(Boolean(inboxParam));const [view,setView]=useState<'board'|'calendar'>('board');const [query,setQuery]=useState('');const [audience,setAudience]=useState('all')
  const items=state.content.filter(item=>!item.archived).filter(item=>(audience==='all'||item.audience===audience)&&(!query||normalise(`${item.title} ${item.angle} ${item.draft} ${item.sourceNote||''}`).includes(normalise(query))))
  const scheduled=state.content.filter(item=>!item.archived).flatMap(item=>item.publications).filter(pub=>pub.scheduledAt&&!pub.url).length
  const published=state.content.filter(item=>!item.archived).flatMap(item=>item.publications).filter(pub=>pub.url).length
  return <><PageHeading eyebrow="XÂY UY TÍN TỪ CÔNG VIỆC THẬT" title="Truyền thông & nội dung" description="Giữ ý tưởng, làm bài, lên lịch và ghi nhận phản hồi trong một nơi." action={<button className="button primary" onClick={()=>setModal(true)}><Plus size={17}/> Thêm ý tưởng</button>}/>
    <div className="hub-stats"><Card><span className="hub-stat-icon blue"><Lightbulb size={19}/></span><strong>{state.content.filter(item=>!item.archived).length}</strong><small>Ý tưởng & bài viết</small></Card><Card><span className="hub-stat-icon orange"><CalendarDays size={19}/></span><strong>{scheduled}</strong><small>Lượt dự kiến đăng</small></Card><Card><span className="hub-stat-icon navy"><Megaphone size={19}/></span><strong>{published}</strong><small>Lượt đã ghi nhận đăng</small></Card></div>
    <Notice>Hiện anh nhập ý tưởng thủ công hoặc gắn từ Hộp ghi nhanh/Kho kiến thức. Nghiên cứu tự động theo lịch và đăng bài tự động chưa được kết nối trong bản thử.</Notice>
    <div className="content-toolbar"><div className="content-view-switch"><button className={view==='board'?'active':''} onClick={()=>setView('board')}>Bảng tiến độ</button><button className={view==='calendar'?'active':''} onClick={()=>setView('calendar')}>Lịch đăng</button></div><div className="content-filters"><div className="filter-search"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Tìm ý tưởng, bản nháp..." aria-label="Tìm nội dung"/></div><select aria-label="Lọc đối tượng" value={audience} onChange={e=>setAudience(e.target.value)}><option value="all">Mọi đối tượng</option><option value="B2C">CEO / chủ SME</option><option value="B2B">Doanh nghiệp</option></select></div></div>
    {view==='board'?<div className="content-board">{stages.map(stage=><section className="content-column" key={stage}><div className="content-column-head"><h2>{contentStatusLabel[stage]}</h2><span>{items.filter(item=>item.status===stage).length}</span></div><div className="content-column-body">{items.filter(item=>item.status===stage).map(item=><Link className="content-card" to={`/content/${item.id}`} key={item.id}><div className="content-card-top"><span className={`content-audience ${item.audience.toLowerCase()}`}>{item.audience}</span><span>{contentPillarLabel[item.pillar]}</span></div><strong>{item.title}</strong><p>{item.angle||item.sourceNote||'Chưa ghi góc triển khai.'}</p><div className="content-card-foot"><span>{item.publications.map(p=>contentChannelLabel[p.channel]).join(' · ')||'Chưa chọn kênh'}</span><span>{item.dueAt?dateLabel(item.dueAt):''} <ArrowRight size={15}/></span></div></Link>)}{!items.some(item=>item.status===stage)&&<p className="content-column-empty">Chưa có nội dung</p>}</div></section>)}</div>:<ContentCalendar items={items}/>}
    {modal&&<Modal title="Thêm ý tưởng truyền thông" onClose={()=>{setModal(false);if(inboxParam)navigate('/content')}} wide><ContentForm defaultInboxId={inboxParam} onClose={()=>{setModal(false);if(inboxParam)navigate('/content')}} onSaved={id=>navigate(`/content/${id}`)}/></Modal>}
  </>
}

function PublicationRow({item,pub}:{item:ContentItem;pub:ContentPublication}){
  const {update}=useDemo();const toast=useToast();const [date,setDate]=useState(pub.scheduledAt||'');const [url,setUrl]=useState(pub.url||'');const [views,setViews]=useState(pub.views?.toString()||'');const [interactions,setInteractions]=useState(pub.interactions?.toString()||'');const [conversations,setConversations]=useState(pub.conversations?.toString()||'')
  const save=(event:FormEvent)=>{event.preventDefault();if(url.trim()&&!safeUrl(url.trim()))return toast('Đường dẫn bài đăng cần bắt đầu bằng http hoặc https.');const changed={...pub,scheduledAt:date||undefined,url:url.trim()||undefined,publishedAt:url.trim()?(pub.publishedAt||todayISO()):undefined,views:views===''?undefined:Number(views),interactions:interactions===''?undefined:Number(interactions),conversations:conversations===''?undefined:Number(conversations)};const publications=item.publications.map(p=>p.channel===pub.channel?changed:p);const hasPublished=publications.some(p=>p.url);update('content',item.id,{publications,status:hasPublished?'published':item.status==='published'?'ready':item.status});toast('Đã lưu lịch đăng và số liệu tự nhập.')}
  return <form className="content-publication" onSubmit={save}><div className="content-publication-title"><strong>{contentChannelLabel[pub.channel]}</strong><span className={pub.url?'is-published':''}>{pub.url?'Đã ghi nhận đăng':'Chưa đăng'}</span></div><div className="form-two"><Field label="Ngày dự kiến"><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></Field><Field label="Link bài đã đăng"><input type="url" value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://..."/></Field></div><div className="content-metric-grid"><Field label="Lượt xem"><input type="number" min="0" value={views} onChange={e=>setViews(e.target.value)}/></Field><Field label="Tương tác"><input type="number" min="0" value={interactions} onChange={e=>setInteractions(e.target.value)}/></Field><Field label="Cuộc trò chuyện"><input type="number" min="0" value={conversations} onChange={e=>setConversations(e.target.value)}/></Field></div><div className="content-publication-actions">{safeUrl(pub.url)&&<a href={safeUrl(pub.url)} target="_blank" rel="noopener noreferrer" className="text-link">Mở bài đăng <ExternalLink size={14}/></a>}<button className="button small outline" type="submit">Lưu kênh này</button></div></form>
}

export function ContentDetailPage(){
  const {id}=useParams();const {state,update,archive,add}=useDemo();const navigate=useNavigate();const toast=useToast();const [editing,setEditing]=useState(false)
  const item=state.content.find(entry=>entry.id===id&&!entry.archived)
  if(!item)return <div className="not-found"><h1>Không tìm thấy nội dung</h1><Link className="button primary" to="/content">Về bảng nội dung</Link></div>
  const knowledge=state.knowledge.find(k=>k.id===item.knowledgeId&&!k.archived);const inbox=state.inbox.find(i=>i.id===item.inboxId&&!i.archived);const task=state.tasks.find(t=>t.id===item.taskId&&!t.archived)
  const nextStage=item.status==='ready'?undefined:stages[stages.indexOf(item.status)+1]
  const createTask=()=>{if(task)return;const created=add('tasks',{title:`Nội dung: ${item.title}`,description:`${item.nextAction||item.angle||'Hoàn thiện nội dung truyền thông.'}\nMở nội dung: /content/${item.id}`,status:'todo',priority:'medium',dueAt:item.dueAt,assigneeId:'u1'});update('content',item.id,{taskId:created.id});toast('Đã tạo công việc từ nội dung.')}
  return <><Link className="back-link" to="/content"><ArrowLeft size={16}/> Truyền thông & nội dung</Link><PageHeading eyebrow={`${item.audience} · ${contentPillarLabel[item.pillar]}`} title={item.title} description={item.angle||'Thêm góc triển khai để định hướng bài viết.'} action={<div className="button-group"><button className="button outline" onClick={()=>setEditing(true)}>Chỉnh sửa</button>{nextStage&&<button className="button primary" onClick={()=>{update('content',item.id,{status:nextStage});toast(`Đã chuyển sang ${contentStatusLabel[nextStage]}.`)}}>Chuyển: {contentStatusLabel[nextStage]}</button>}</div>}/>
    <div className="detail-grid"><div className="stack"><Card title="Bản nháp & lời mời trao đổi"><div className="content-detail-label">BẢN NHÁP</div><p className="hub-prose">{item.draft||'Chưa có bản nháp. Chọn Chỉnh sửa để bắt đầu viết.'}</p><div className="content-detail-label">CTA</div><p className="hub-prose">{item.cta||'Chưa đặt CTA.'}</p></Card><Card title="Kênh & kết quả ghi nhận">{item.publications.length?item.publications.map(pub=><PublicationRow key={pub.channel} item={item} pub={pub}/>):<Empty title="Chưa chọn kênh" description="Chỉnh sửa nội dung để chọn kênh dự kiến."/>}<p className="content-footnote">Số liệu được nhập thủ công để tham khảo, chưa đồng bộ với nền tảng.</p></Card></div>
    <div className="stack"><Card title="Tiến độ & việc tiếp theo"><div className="detail-fields"><div><span>Giai đoạn</span><strong>{contentStatusLabel[item.status]}</strong></div><div><span>Hạn xử lý</span><strong>{dateLabel(item.dueAt)}</strong></div><div><span>Chứng cứ</span><strong>{contentEvidenceLabel[item.evidence]}</strong></div><div><span>Đối tượng</span><strong>{item.audience==='B2C'?'CEO / chủ SME':'Doanh nghiệp / đội ngũ'}</strong></div></div><div className="hub-next detail"><small>BƯỚC TIẾP THEO</small><span>{item.nextAction||'Chưa đặt bước tiếp theo.'}</span></div>{task?<Link className="button outline content-task-link" to={`/tasks/${task.id}`}><ClipboardList size={16}/> Mở việc liên quan</Link>:<button className="button outline content-task-link" onClick={createTask}><Plus size={16}/> Tạo công việc</button>}</Card>
    <Card title="Nguồn ý tưởng"><div className="content-source-kind">{item.sourceType==='manual'?'Tự ghi nhận':item.sourceType==='inbox'?'Hộp ghi nhanh':item.sourceType==='knowledge'?'Kho kiến thức':'Nghiên cứu bên ngoài'}</div>{knowledge&&<Link className="content-source-link" to={`/knowledge/${knowledge.id}`}><Lightbulb size={16}/>{knowledge.title}<ArrowRight size={15}/></Link>}{inbox&&<Link className="content-source-link" to="/inbox"><Lightbulb size={16}/>{inbox.content}<ArrowRight size={15}/></Link>}{safeUrl(item.sourceUrl)&&<a className="content-source-link" href={safeUrl(item.sourceUrl)} target="_blank" rel="noopener noreferrer"><ExternalLink size={16}/> Mở nguồn bên ngoài</a>}<p className="hub-prose">{item.sourceNote||'Chưa có ghi chú nguồn.'}</p></Card><Notice tone={item.evidence==='checked'?'info':'warning'}>{item.evidence==='permission_needed'?'Cần xin phép hoặc ẩn danh thông tin khách hàng trước khi đăng.':item.evidence==='unchecked'?'Kiểm tra nguồn, ví dụ và số liệu trước khi xuất bản.':'Đã đánh dấu rà soát trong dữ liệu demo; hãy xác nhận lại khi dùng thật.'}</Notice><button className="text-button danger archive-link" onClick={()=>{if(window.confirm('Lưu trữ nội dung này trong dữ liệu demo?')){archive('content',item.id);navigate('/content')}}}>Lưu trữ nội dung</button></div></div>
    {editing&&<Modal title="Chỉnh sửa nội dung" onClose={()=>setEditing(false)} wide><ContentForm initial={item} onClose={()=>setEditing(false)}/></Modal>}
  </>
}
