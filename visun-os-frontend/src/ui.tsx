import { useEffect, useState, createContext, useContext, type ReactNode } from 'react'
import { Link } from 'react-router'
import { AlertCircle, ArrowRight, CalendarDays, Check, CheckCircle2, Circle, Clock3, FileText, Info, X } from 'lucide-react'
import type { Priority, Task, TaskStatus } from './domain'
import { priorityLabel, taskStatusLabel } from './domain'
import { useDemo } from './store'
import { relativeLabel } from './utils'

const ToastContext=createContext<(message:string)=>void>(()=>{})
export function ToastProvider({children}:{children:ReactNode}){
  const [message,setMessage]=useState('')
  useEffect(()=>{if(!message)return;const timer=setTimeout(()=>setMessage(''),4500);return()=>clearTimeout(timer)},[message])
  return <ToastContext.Provider value={setMessage}>{children}{message&&<div className="toast" role="status"><CheckCircle2 size={18}/>{message}<button aria-label="Đóng thông báo" onClick={()=>setMessage('')}><X size={16}/></button></div>}</ToastContext.Provider>
}
export const useToast=()=>useContext(ToastContext)

export function PageHeading({eyebrow,title,description,action}:{eyebrow?:string;title:string;description?:string;action?:ReactNode}){
  return <div className="page-heading"><div>{eyebrow&&<div className="eyebrow">{eyebrow}</div>}<h1>{title}</h1>{description&&<p>{description}</p>}</div>{action&&<div className="page-action">{action}</div>}</div>
}
export function SectionHeading({title,link,children}:{title:string;link?:string;children?:ReactNode}){
  return <div className="section-heading"><h2>{title}</h2><div>{children}{link&&<Link className="text-link" to={link}>Xem tất cả <ArrowRight size={15}/></Link>}</div></div>
}
export function Card({children,className='',title,action}:{children:ReactNode;className?:string;title?:string;action?:ReactNode}){
  return <section className={`card ${className}`}>{title&&<div className="card-head"><h2>{title}</h2>{action}</div>}{children}</section>
}
export function Empty({title,description,action}:{title:string;description?:string;action?:ReactNode}){
  return <div className="empty"><div className="empty-icon"><FileText size={22}/></div><strong>{title}</strong>{description&&<p>{description}</p>}{action}</div>
}
export function Notice({children,tone='info'}:{children:ReactNode;tone?:'info'|'warning'|'error'}){
  const Icon=tone==='warning'||tone==='error'?AlertCircle:Info
  return <div className={`notice notice-${tone}`}><Icon size={18}/><span>{children}</span></div>
}
export function StatusBadge({status}:{status:TaskStatus}){return <span className={`badge status-${status}`}>{taskStatusLabel[status]}</span>}
export function PriorityBadge({priority}:{priority:Priority}){return <span className={`badge priority-${priority}`}>{priorityLabel[priority]}</span>}
export function Modal({title,children,onClose,wide=false}:{title:string;children:ReactNode;onClose:()=>void;wide?:boolean}){
  useEffect(()=>{const handler=(event:KeyboardEvent)=>{if(event.key==='Escape')onClose()};document.addEventListener('keydown',handler);return()=>document.removeEventListener('keydown',handler)},[onClose])
  return <div className="modal-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget)onClose()}}><section className={`modal ${wide?'modal-wide':''}`} role="dialog" aria-modal="true" aria-label={title}><div className="modal-header"><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="Đóng"><X size={20}/></button></div><div className="modal-body">{children}</div></section></div>
}
export function Field({label,children,hint,required}:{label:string;children:ReactNode;hint?:string;required?:boolean}){return <label className="field"><span>{label}{required&&<b aria-hidden="true"> *</b>}</span>{children}{hint&&<small>{hint}</small>}</label>}
export function TaskRow({task,compact=false}:{task:Task;compact?:boolean}){
  const {state,toggleTask}=useDemo()
  const customer=state.customers.find(item=>item.id===task.customerId)
  const project=state.projects.find(item=>item.id===task.projectId)
  return <div className={`task-row ${compact?'task-row-compact':''}`}>
    <button className={`task-check ${task.status==='done'?'is-done':''}`} onClick={()=>toggleTask(task.id)} aria-label={task.status==='done'?`Mở lại ${task.title}`:`Hoàn thành ${task.title}`}>{task.status==='done'?<Check size={17}/>:<Circle size={20}/>}</button>
    <div className="task-row-main"><Link to={`/tasks/${task.id}`} className="task-title">{task.title}</Link><div className="task-meta">{customer&&<Link to={`/customers/${customer.id}`}>{customer.name}</Link>}{project&&<Link to={`/projects/${project.id}`}>{project.title}</Link>}{task.promisedTo&&<span>Cam kết với {task.promisedTo}</span>}</div></div>
    {!compact&&<div className="task-row-badges"><PriorityBadge priority={task.priority}/><StatusBadge status={task.status}/></div>}
    <span className={`date-chip ${task.status!=='waiting'&&task.dueAt&&task.dueAt<new Date().toLocaleDateString('en-CA')&&task.status!=='done'?'is-overdue':''}`}><CalendarDays size={14}/>{relativeLabel(task.status==='waiting'?task.reviewAt:task.dueAt)}</span>
    <Link className="row-arrow" to={`/tasks/${task.id}`} aria-label={`Mở ${task.title}`}><ArrowRight size={17}/></Link>
  </div>
}
export function MiniMeta({icon='clock',children}:{icon?:'clock'|'calendar';children:ReactNode}){const Icon=icon==='clock'?Clock3:CalendarDays;return <span className="mini-meta"><Icon size={14}/>{children}</span>}
