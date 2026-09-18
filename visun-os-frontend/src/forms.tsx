import { useState, type FormEvent } from 'react'
import type { Customer, Note, Opportunity, Project, Task } from './domain'
import { b2bStages, b2cStages, projectStatusLabel, taskStatusLabel } from './domain'
import { useDemo } from './store'
import { useToast, Field, Notice } from './ui'
import { normalise } from './utils'

const Buttons=({onCancel,editing=false}:{onCancel:()=>void;editing?:boolean})=><div className="form-actions"><button type="button" className="button ghost" onClick={onCancel}>Hủy</button><button className="button primary" type="submit">{editing?'Lưu thay đổi':'Tạo mới'}</button></div>

export function TaskForm({initial,onClose,defaults,onSaved}:{initial?:Task;onClose:()=>void;defaults?:Partial<Task>;onSaved?:(id:string)=>void}){
  const {state,add,update}=useDemo();const toast=useToast();const source=initial||defaults
  const [title,setTitle]=useState(source?.title||'');const [description,setDescription]=useState(source?.description||'')
  const [status,setStatus]=useState<Task['status']>(source?.status||'todo');const [priority,setPriority]=useState<Task['priority']>(source?.priority||'medium')
  const [dueAt,setDueAt]=useState(source?.dueAt||'');const [reviewAt,setReviewAt]=useState(source?.reviewAt||'')
  const [scheduledStart,setScheduledStart]=useState(source?.scheduledStart||'');const [scheduledEnd,setScheduledEnd]=useState(source?.scheduledEnd||'')
  const [customerId,setCustomerId]=useState(source?.customerId||'');const [opportunityId,setOpportunityId]=useState(source?.opportunityId||'')
  const [projectId,setProjectId]=useState(source?.projectId||'');const [assigneeId,setAssigneeId]=useState(source?.assigneeId||'u1')
  const [promisedTo,setPromisedTo]=useState(source?.promisedTo||'');const [recurrence,setRecurrence]=useState<Task['recurrence']>(source?.recurrence)
  const [error,setError]=useState('')
  const submit=(event:FormEvent)=>{event.preventDefault();setError('')
    if(!title.trim()){setError('Hãy nhập tên việc.');return}
    if(status==='waiting'&&!reviewAt){setError('Việc chờ phản hồi cần ngày hỏi lại.');return}
    if(scheduledStart&&scheduledEnd&&scheduledEnd<scheduledStart){setError('Giờ kết thúc phải sau giờ bắt đầu.');return}
    const patch={title:title.trim(),description:description.trim(),status,priority,dueAt:dueAt||undefined,reviewAt:reviewAt||undefined,
      scheduledStart:scheduledStart||undefined,scheduledEnd:scheduledEnd||undefined,customerId:customerId||undefined,opportunityId:opportunityId||undefined,
      projectId:projectId||undefined,assigneeId,promisedTo:promisedTo.trim()||undefined,recurrence,recurringSeriesId:recurrence?(initial?.recurringSeriesId||`series-${Date.now()}`):undefined}
    if(initial){update('tasks',initial.id,patch);toast('Đã lưu thay đổi vào dữ liệu minh họa.');onSaved?.(initial.id)}
    else {const created=add('tasks',{...patch,sourceNoteId:defaults?.sourceNoteId,sourceInboxId:defaults?.sourceInboxId});toast('Đã tạo việc trong dữ liệu minh họa.');onSaved?.(created.id)}
    onClose()
  }
  return <form className="form-grid" onSubmit={submit}>
    {error&&<Notice tone="error">{error}</Notice>}
    <Field label="Tên việc" required><input value={title} onChange={e=>setTitle(e.target.value)} autoFocus/></Field>
    <Field label="Kết quả cần đạt"><textarea rows={3} value={description} onChange={e=>setDescription(e.target.value)}/></Field>
    <div className="form-two"><Field label="Trạng thái"><select value={status} onChange={e=>setStatus(e.target.value as Task['status'])}>{Object.entries(taskStatusLabel).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></Field><Field label="Ưu tiên"><select value={priority} onChange={e=>setPriority(e.target.value as Task['priority'])}><option value="low">Thấp</option><option value="medium">Vừa</option><option value="high">Cao</option></select></Field></div>
    <div className="form-two"><Field label="Hạn hoàn thành"><input type="date" value={dueAt} onChange={e=>setDueAt(e.target.value)}/></Field><Field label="Ngày hỏi lại / xem lại"><input type="date" value={reviewAt} onChange={e=>setReviewAt(e.target.value)}/></Field></div>
    <div className="form-two"><Field label="Xếp lịch bắt đầu"><input type="datetime-local" value={scheduledStart} onChange={e=>setScheduledStart(e.target.value)}/></Field><Field label="Xếp lịch kết thúc"><input type="datetime-local" value={scheduledEnd} onChange={e=>setScheduledEnd(e.target.value)}/></Field></div>
    <div className="form-two"><Field label="Khách hàng"><select value={customerId} onChange={e=>setCustomerId(e.target.value)}><option value="">Không gắn</option>{state.customers.filter(c=>!c.archived).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></Field><Field label="Cơ hội"><select value={opportunityId} onChange={e=>setOpportunityId(e.target.value)}><option value="">Không gắn</option>{state.opportunities.filter(o=>!o.archived&&(!customerId||o.customerId===customerId)).map(o=><option key={o.id} value={o.id}>{o.title}</option>)}</select></Field></div>
    <div className="form-two"><Field label="Dự án"><select value={projectId} onChange={e=>setProjectId(e.target.value)}><option value="">Không gắn</option>{state.projects.filter(p=>!p.archived&&(!customerId||p.customerId===customerId)).map(p=><option key={p.id} value={p.id}>{p.title}</option>)}</select></Field><Field label="Người phụ trách"><select value={assigneeId} onChange={e=>setAssigneeId(e.target.value)}>{state.users.filter(u=>u.role!=='viewer').map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select></Field></div>
    <div className="form-two"><Field label="Cam kết với ai"><input value={promisedTo} onChange={e=>setPromisedTo(e.target.value)} placeholder="Để trống nếu là việc nội bộ"/></Field><Field label="Lặp lại"><select value={recurrence||''} onChange={e=>setRecurrence((e.target.value||undefined) as Task['recurrence'])}><option value="">Không lặp</option><option value="daily">Hằng ngày</option><option value="weekly">Hằng tuần</option></select></Field></div>
    <Buttons onCancel={onClose} editing={!!initial}/>
  </form>
}

export function CustomerForm({initial,onClose,onSaved}:{initial?:Customer;onClose:()=>void;onSaved?:(id:string)=>void}){
  const {state,add,update}=useDemo();const toast=useToast()
  const [type,setType]=useState<Customer['type']>(initial?.type||'B2B');const [name,setName]=useState(initial?.name||'');const [contactName,setContactName]=useState(initial?.contactName||'')
  const [channel,setChannel]=useState(initial?.channel||'');const [need,setNeed]=useState(initial?.need||'');const [status,setStatus]=useState(initial?.status||'Đang trao đổi')
  const [nextContactAt,setNextContactAt]=useState(initial?.nextContactAt||'');const [email,setEmail]=useState(initial?.email||'');const [phone,setPhone]=useState(initial?.phone||'');const [error,setError]=useState('')
  const duplicate=state.customers.find(c=>c.id!==initial?.id&&!c.archived&&(normalise(c.name)===normalise(name)&&!!name.trim()||!!email&&c.email===email||!!phone&&c.phone===phone))
  const submit=(event:FormEvent)=>{event.preventDefault();setError('');if(!name.trim()){setError('Hãy nhập tên khách.');return}
    if(duplicate&&!window.confirm(`Có thể trùng với ${duplicate.name}. Vẫn tạo/lưu hồ sơ này?`))return
    const patch={type,name:name.trim(),contactName:contactName.trim(),channel:channel.trim(),need:need.trim(),status:status.trim(),nextContactAt:nextContactAt||undefined,email:email||undefined,phone:phone||undefined}
    if(initial){update('customers',initial.id,patch);toast('Đã lưu hồ sơ khách minh họa.');onSaved?.(initial.id)}
    else{const item=add('customers',{...patch,contacts:[]});toast('Đã tạo hồ sơ khách minh họa.');onSaved?.(item.id)}onClose()
  }
  return <form className="form-grid" onSubmit={submit}>{error&&<Notice tone="error">{error}</Notice>}{duplicate&&<Notice tone="warning">Có hồ sơ gần trùng: {duplicate.name}. Hãy kiểm tra trước khi lưu.</Notice>}
    <div className="form-two"><Field label="Loại khách"><select value={type} onChange={e=>setType(e.target.value as Customer['type'])}><option value="B2C">Cá nhân / chủ SME</option><option value="B2B">Doanh nghiệp</option></select></Field><Field label="Tên khách" required><input value={name} onChange={e=>setName(e.target.value)} autoFocus/></Field></div>
    <div className="form-two"><Field label="Người liên hệ chính"><input value={contactName} onChange={e=>setContactName(e.target.value)}/></Field><Field label="Kênh liên hệ"><input value={channel} onChange={e=>setChannel(e.target.value)} placeholder="Facebook, giới thiệu..."/></Field></div>
    <div className="form-two"><Field label="Email"><input type="email" value={email} onChange={e=>setEmail(e.target.value)}/></Field><Field label="Điện thoại"><input value={phone} onChange={e=>setPhone(e.target.value)}/></Field></div>
    <Field label="Nhu cầu AI"><textarea rows={3} value={need} onChange={e=>setNeed(e.target.value)}/></Field>
    <div className="form-two"><Field label="Trạng thái trao đổi"><input value={status} onChange={e=>setStatus(e.target.value)}/></Field><Field label="Ngày liên hệ tiếp"><input type="date" value={nextContactAt} onChange={e=>setNextContactAt(e.target.value)}/></Field></div>
    <Buttons onCancel={onClose} editing={!!initial}/>
  </form>
}

export function OpportunityForm({initial,onClose,defaults,onSaved}:{initial?:Opportunity;onClose:()=>void;defaults?:Partial<Opportunity>;onSaved?:(id:string)=>void}){
  const {state,add,update}=useDemo();const toast=useToast();const source=initial||defaults
  const [customerId,setCustomerId]=useState(source?.customerId||'');const [title,setTitle]=useState(source?.title||'');const [product,setProduct]=useState(source?.product||'')
  const [stage,setStage]=useState(source?.stage||'');const [nextAction,setNextAction]=useState(source?.nextAction||'');const [nextActionAt,setNextActionAt]=useState(source?.nextActionAt||'')
  const [value,setValue]=useState(source?.value?.toString()||'');const [reason,setReason]=useState(source?.reason||'');const [error,setError]=useState('')
  const customer=state.customers.find(c=>c.id===customerId);const stages=customer?.type==='B2C'?b2cStages:b2bStages
  const submit=(event:FormEvent)=>{event.preventDefault();if(!customer||!title.trim()){setError('Chọn khách và nhập tên cơ hội.');return}
    const patch={customerId,customerType:customer.type,title:title.trim(),product:product.trim(),stage:stage||stages[0],nextAction:nextAction.trim(),nextActionAt:nextActionAt||undefined,ownerId:'u1',value:value?Number(value):undefined,reason:reason.trim()||undefined}
    if(initial){update('opportunities',initial.id,patch);toast('Đã lưu cơ hội minh họa.');onSaved?.(initial.id)}
    else{const item=add('opportunities',patch);toast('Đã tạo cơ hội minh họa.');onSaved?.(item.id)}onClose()
  }
  return <form className="form-grid" onSubmit={submit}>{error&&<Notice tone="error">{error}</Notice>}
    <Field label="Khách hàng" required><select value={customerId} onChange={e=>{setCustomerId(e.target.value);setStage('')}}><option value="">Chọn khách</option>{state.customers.filter(c=>!c.archived).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
    <Field label="Tên cơ hội" required><input value={title} onChange={e=>setTitle(e.target.value)} autoFocus/></Field>
    <div className="form-two"><Field label="Sản phẩm / dịch vụ"><input value={product} onChange={e=>setProduct(e.target.value)}/></Field><Field label="Giai đoạn"><select value={stage||stages[0]} onChange={e=>setStage(e.target.value)}>{stages.map(s=><option key={s}>{s}</option>)}</select></Field></div>
    <Field label="Bước tiếp theo"><input value={nextAction} onChange={e=>setNextAction(e.target.value)}/></Field>
    <div className="form-two"><Field label="Ngày xử lý bước tiếp"><input type="date" value={nextActionAt} onChange={e=>setNextActionAt(e.target.value)}/></Field><Field label="Giá trị dự kiến (nếu có căn cứ)"><input type="number" min="0" value={value} onChange={e=>setValue(e.target.value)}/></Field></div>
    <Field label="Lý do tạm dừng / không phù hợp"><textarea rows={2} value={reason} onChange={e=>setReason(e.target.value)}/></Field>
    <Buttons onCancel={onClose} editing={!!initial}/>
  </form>
}

export function ProjectForm({initial,onClose,defaults,onSaved}:{initial?:Project;onClose:()=>void;defaults?:Partial<Project>;onSaved?:(id:string)=>void}){
  const {state,add,update}=useDemo();const toast=useToast();const source=initial||defaults
  const [title,setTitle]=useState(source?.title||'');const [type,setType]=useState(source?.type||'Workshop');const [status,setStatus]=useState<Project['status']>(source?.status||'planning')
  const [customerId,setCustomerId]=useState(source?.customerId||'');const [opportunityId,setOpportunityId]=useState(source?.opportunityId||'')
  const [objective,setObjective]=useState(source?.objective||'');const [nextMilestoneAt,setNextMilestoneAt]=useState(source?.nextMilestoneAt||'');const [error,setError]=useState('')
  const submit=(event:FormEvent)=>{event.preventDefault();if(!title.trim()){setError('Hãy nhập tên dự án.');return}
    const patch={title:title.trim(),type,status,customerId:customerId||undefined,opportunityId:opportunityId||undefined,objective:objective.trim(),nextMilestoneAt:nextMilestoneAt||undefined,ownerId:'u1'}
    if(initial){update('projects',initial.id,patch);toast('Đã lưu dự án minh họa.');onSaved?.(initial.id)}
    else{const item=add('projects',{...patch,milestones:[],documents:[]});toast('Đã tạo dự án minh họa.');onSaved?.(item.id)}onClose()
  }
  return <form className="form-grid" onSubmit={submit}>{error&&<Notice tone="error">{error}</Notice>}
    <Field label="Tên dự án" required><input value={title} onChange={e=>setTitle(e.target.value)} autoFocus/></Field>
    <div className="form-two"><Field label="Loại"><select value={type} onChange={e=>setType(e.target.value)}>{['Workshop','Khóa học','Tư vấn 1-1','Đào tạo in-house','AI Agent/workflow','Việc nội bộ'].map(x=><option key={x}>{x}</option>)}</select></Field><Field label="Trạng thái"><select value={status} onChange={e=>setStatus(e.target.value as Project['status'])}>{Object.entries(projectStatusLabel).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></Field></div>
    <div className="form-two"><Field label="Khách hàng"><select value={customerId} onChange={e=>setCustomerId(e.target.value)}><option value="">Dự án nội bộ</option>{state.customers.filter(c=>!c.archived).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></Field><Field label="Cơ hội nguồn"><select value={opportunityId} onChange={e=>setOpportunityId(e.target.value)}><option value="">Không gắn</option>{state.opportunities.filter(o=>!o.archived&&(!customerId||o.customerId===customerId)).map(o=><option key={o.id} value={o.id}>{o.title}</option>)}</select></Field></div>
    <Field label="Mục tiêu / đầu ra"><textarea rows={3} value={objective} onChange={e=>setObjective(e.target.value)}/></Field>
    <Field label="Mốc tiếp theo"><input type="date" value={nextMilestoneAt} onChange={e=>setNextMilestoneAt(e.target.value)}/></Field>
    <Buttons onCancel={onClose} editing={!!initial}/>
  </form>
}

export function NoteForm({initial,onClose,defaults,onSaved}:{initial?:Note;onClose:()=>void;defaults?:Partial<Note>;onSaved?:(id:string)=>void}){
  const {state,add,update}=useDemo();const toast=useToast();const source=initial||defaults
  const [title,setTitle]=useState(source?.title||'');const [content,setContent]=useState(source?.content||'');const [type,setType]=useState<Note['type']>(source?.type||'call')
  const [customerId,setCustomerId]=useState(source?.customerId||'');const [projectId,setProjectId]=useState(source?.projectId||'');const [error,setError]=useState('')
  const submit=(event:FormEvent)=>{event.preventDefault();if(!title.trim()||!content.trim()){setError('Hãy nhập tiêu đề và nội dung ghi chú.');return}
    const patch={title:title.trim(),content:content.trim(),type,customerId:customerId||undefined,projectId:projectId||undefined}
    if(initial){update('notes',initial.id,patch);toast('Đã lưu ghi chú minh họa.');onSaved?.(initial.id)}
    else{const item=add('notes',{...patch,sourceInboxId:defaults?.sourceInboxId});toast('Đã tạo ghi chú minh họa.');onSaved?.(item.id)}onClose()
  }
  return <form className="form-grid" onSubmit={submit}>{error&&<Notice tone="error">{error}</Notice>}
    <Field label="Tiêu đề" required><input value={title} onChange={e=>setTitle(e.target.value)} autoFocus/></Field>
    <Field label="Nội dung" required><textarea rows={5} value={content} onChange={e=>setContent(e.target.value)}/></Field>
    <div className="form-two"><Field label="Loại ghi chú"><select value={type} onChange={e=>setType(e.target.value as Note['type'])}><option value="call">Cuộc gọi</option><option value="meeting">Cuộc họp</option><option value="idea">Ý tưởng</option><option value="decision">Quyết định</option><option value="update">Cập nhật</option></select></Field><Field label="Khách hàng"><select value={customerId} onChange={e=>setCustomerId(e.target.value)}><option value="">Không gắn</option>{state.customers.filter(c=>!c.archived).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></Field></div>
    <Field label="Dự án"><select value={projectId} onChange={e=>setProjectId(e.target.value)}><option value="">Không gắn</option>{state.projects.filter(p=>!p.archived&&(!customerId||p.customerId===customerId)).map(p=><option key={p.id} value={p.id}>{p.title}</option>)}</select></Field>
    <Buttons onCancel={onClose} editing={!!initial}/>
  </form>
}
