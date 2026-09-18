import { createContext, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import type { AIProposal, Collection, DemoState, EntityMap, InboxItem, Note, Task } from './domain'
import { makeSeed } from './seed'
import { addDays, isoNow, uid } from './utils'

const STORAGE_KEY = 'visun-os-demo-v1'
const legacyCollections: Collection[] = ['customers','opportunities','projects','tasks','notes','inbox','events']
const validV2Collections: Collection[] = [...legacyCollections,'learning','knowledge','dataAssets']
const validCollections: Collection[] = [...validV2Collections,'content']

function validLegacyState(value: unknown): value is Record<string,unknown> {
  if (!value || typeof value !== 'object') return false
  const data = value as Record<string,unknown>
  return data.version === 1 && legacyCollections.every(key=>Array.isArray(data[key])) && Array.isArray(data.users) && Array.isArray(data.approvals) && !!data.settings
}

function validState(value: unknown): value is DemoState {
  if (!value || typeof value !== 'object') return false
  const data = value as Record<string,unknown>
  return data.version === 3 && validCollections.every(key=>Array.isArray(data[key])) && Array.isArray(data.users) && Array.isArray(data.approvals) && !!data.settings
}

function validV2State(value: unknown): value is Record<string,unknown> {
  if (!value || typeof value !== 'object') return false
  const data = value as Record<string,unknown>
  return data.version === 2 && validV2Collections.every(key=>Array.isArray(data[key])) && Array.isArray(data.users) && Array.isArray(data.approvals) && !!data.settings
}

class LocalDemoRepository {
  load(): { state: DemoState; error: string } {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return {state:makeSeed(),error:''}
      const parsed: unknown = JSON.parse(raw)
      if (validState(parsed)) return {state:parsed,error:''}
      if (validV2State(parsed)) {
        const migrated={...parsed,version:3,content:makeSeed().content} as DemoState
        return {state:migrated,error:this.save(migrated)}
      }
      if (validLegacyState(parsed)) {
        const seed=makeSeed()
        const migrated={...parsed,version:3,learning:seed.learning,knowledge:seed.knowledge,dataAssets:seed.dataAssets,content:seed.content} as DemoState
        return {state:migrated,error:this.save(migrated)}
      }
      return {state:makeSeed(),error:'Dữ liệu demo cũ không còn tương thích. Đã nạp lại bộ minh họa.'}
    } catch {
      return {state:makeSeed(),error:'Không đọc được dữ liệu đã lưu. Đã nạp bộ minh họa; hãy kiểm tra cài đặt trình duyệt.'}
    }
  }
  save(state: DemoState): string {
    try { localStorage.setItem(STORAGE_KEY,JSON.stringify(state)); return '' }
    catch { return 'Trình duyệt không cho lưu dữ liệu demo. Thay đổi chỉ còn đến khi tải lại trang.' }
  }
  reset(): DemoState { const next=makeSeed();this.save(next);return next }
  clearAll(): DemoState {
    const next: DemoState = {
      version:3,customers:[],opportunities:[],projects:[],tasks:[],notes:[],inbox:[],events:[],
      learning:[],knowledge:[],dataAssets:[],content:[],
      users:[{id:'u1',name:'Anh Hùng',role:'owner',initials:'H'}],
      approvals:[],settings:{reminderTime:'07:30',reminderWeekdays:true},
    }
    this.save(next)
    return next
  }
  export(state: DemoState): void {
    const blob = new Blob([JSON.stringify(state,null,2)],{type:'application/json'})
    const url=URL.createObjectURL(blob)
    const anchor=document.createElement('a');anchor.href=url;anchor.download='visun-os-du-lieu-minh-hoa.json';anchor.click()
    window.setTimeout(()=>URL.revokeObjectURL(url),1000)
  }
}
export const demoRepository = new LocalDemoRepository()

type DemoContextValue = {
  state: DemoState
  storageError: string
  add: <K extends Collection>(collection: K, item: Omit<EntityMap[K], 'id'|'createdAt'|'updatedAt'|'createdBy'|'workspaceId'> & Partial<Pick<EntityMap[K],'id'>>) => EntityMap[K]
  update: <K extends Collection>(collection: K, id: string, patch: Partial<EntityMap[K]>) => void
  archive: (collection: Collection, id: string) => void
  reset: () => void
  clearAll: () => void
  exportDemo: () => void
  setSettings: (patch: Partial<DemoState['settings']>) => void
  commitProposal: (proposal: AIProposal) => { ok: boolean; ids: string[]; message: string }
  convertInbox: (inboxId: string, kind: 'task'|'note'|'opportunity'|'content', linkedId: string) => void
  toggleTask: (id: string) => void
}
const DemoContext=createContext<DemoContextValue|null>(null)

export function DemoProvider({children}:{children:ReactNode}) {
  const initial=useMemo(()=>demoRepository.load(),[])
  const [state,setState]=useState<DemoState>(initial.state)
  const [storageError,setStorageError]=useState(initial.error)
  const stateRef=useRef(initial.state)
  const persist=(change:(current:DemoState)=>DemoState)=>{
    const next=change(stateRef.current)
    stateRef.current=next
    setState(next)
    setStorageError(demoRepository.save(next))
  }

  const add: DemoContextValue['add'] = (collection,item) => {
    const now=isoNow()
    const entity={...item,id:item.id||uid(),createdAt:now,updatedAt:now,createdBy:'u1',workspaceId:'visun-ai-trainer'} as EntityMap[typeof collection]
    persist(current=>({...current,[collection]:[entity,...current[collection]]}))
    return entity as never
  }
  const update: DemoContextValue['update'] = (collection,id,patch) => {
    persist(current=>{
      const list=current[collection] as Array<{id:string}>
      if (!list.some(item=>item.id===id)) return current
      const next=list.map(item=>item.id===id?{...item,...patch,id,updatedAt:isoNow()}:item)
      return {...current,[collection]:next}
    })
  }
  const archive: DemoContextValue['archive'] = (collection,id) => update(collection,id,{archived:true} as never)
  const reset=()=>{const next=demoRepository.reset();stateRef.current=next;setState(next);setStorageError('')}
  const clearAll=()=>{const next=demoRepository.clearAll();stateRef.current=next;setState(next);setStorageError('')}
  const exportDemo=()=>demoRepository.export(stateRef.current)
  const setSettings=(patch:Partial<DemoState['settings']>)=>persist(current=>({...current,settings:{...current.settings,...patch}}))
  const convertInbox=(inboxId:string,kind:'task'|'note'|'opportunity'|'content',linkedId:string)=>{
    persist(current=>({...current,inbox:current.inbox.map(item=>item.id===inboxId?{...item,status:'processed' as InboxItem['status'],linkedType:kind,linkedId,updatedAt:isoNow()}:item)}))
  }
  const toggleTask=(id:string)=>{
    const current=stateRef.current
    const task=current.tasks.find(item=>item.id===id)
    if(!task)return
    if(task.status==='done') {update('tasks',id,{status:'todo'});return}
    const tasks=current.tasks.map(item=>item.id===id?{...item,status:'done' as const,updatedAt:isoNow()}:item)
    if(task.recurrence&&task.dueAt){
      const nextDate=addDays(task.dueAt,task.recurrence==='daily'?1:7)
      if(!tasks.some(item=>item.recurringSeriesId===task.recurringSeriesId&&item.dueAt===nextDate)){
        const {id: _oldId,createdAt: _createdAt,updatedAt: _updatedAt,createdBy: _createdBy,workspaceId: _workspaceId,...rest}=task
        void _oldId;void _createdAt;void _updatedAt;void _createdBy;void _workspaceId
        const now=isoNow()
        tasks.unshift({...rest,id:uid(),createdAt:now,updatedAt:now,createdBy:'u1',workspaceId:'visun-ai-trainer',status:'todo',dueAt:nextDate,reviewAt:undefined})
      }
    }
    persist(previous=>({...previous,tasks}))
  }
  const commitProposal=(proposal:AIProposal)=>{
    const current=stateRef.current
    if (current.approvals.includes(proposal.id)) return {ok:false,ids:[],message:'Bản nháp này đã được chốt trước đó; không tạo thêm mục trùng.'}
    const included=proposal.items.filter(item=>item.included)
    if (!included.length) return {ok:false,ids:[],message:'Hãy giữ ít nhất một mục trước khi chốt.'}
    for (const item of included) {
      if (!item.title.trim()) return {ok:false,ids:[],message:'Một mục trong bản nháp chưa có tên.'}
      if (item.customerId && !current.customers.some(c=>c.id===item.customerId&&!c.archived)) return {ok:false,ids:[],message:'Khách hàng trong bản nháp không còn tồn tại.'}
      if (item.dueAt && !/^\d{4}-\d{2}-\d{2}$/.test(item.dueAt)) return {ok:false,ids:[],message:'Ngày hạn chưa hợp lệ.'}
    }
    const now=isoNow(); const ids:string[]=[]; const tasks=[...current.tasks];const notes=[...current.notes]
    included.forEach(item=>{
      const id=uid();ids.push(id)
      const base={id,createdAt:now,updatedAt:now,createdBy:'u1',workspaceId:'visun-ai-trainer'}
      if(item.kind==='task') tasks.unshift({...base,title:item.title.trim(),description:item.content.trim(),status:'todo',priority:'medium',dueAt:item.dueAt||undefined,customerId:item.customerId||undefined,sourceNoteId:item.sourceNoteId,sourceInboxId:item.sourceInboxId,assigneeId:'u1'} as Task)
      else notes.unshift({...base,title:item.title.trim(),content:item.content.trim(),type:'update',customerId:item.customerId||undefined,sourceInboxId:item.sourceInboxId} as Note)
    })
    const linkedInboxIds=new Set(included.map(item=>item.sourceInboxId).filter(Boolean))
    const inbox=current.inbox.map(item=>linkedInboxIds.has(item.id)?{...item,status:'processed' as const,linkedType:included[0].kind,linkedId:ids[0],updatedAt:now}:item)
    persist(previous=>({...previous,tasks,notes,inbox,approvals:[...previous.approvals,proposal.id]}))
    return {ok:true,ids,message:`Đã lưu ${ids.length} mục vào dữ liệu minh họa trên trình duyệt này.`}
  }
  const value={state,storageError,add,update,archive,reset,clearAll,exportDemo,setSettings,commitProposal,convertInbox,toggleTask}
  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>
}
export const useDemo=()=>{const context=useContext(DemoContext);if(!context)throw new Error('DemoProvider missing');return context}
