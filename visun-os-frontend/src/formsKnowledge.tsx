import { useState, type FormEvent } from 'react'
import type { DataAsset, KnowledgeItem, LearningItem } from './domain'
import { dataKindLabel, knowledgeCategoryLabel, learningKindLabel, learningStatusLabel, reviewStatusLabel } from './domain'
import { useDemo } from './store'
import { Field, Notice, useToast } from './ui'

const isValidSource = (value: string) => !value || /^https?:\/\/\S+$/i.test(value) || /^\/demo\/[A-Za-z0-9._/-]+$/.test(value)
const FormActions = ({ onClose, editing }: { onClose: () => void; editing: boolean }) => <div className="form-actions"><button type="button" className="button ghost" onClick={onClose}>Hủy</button><button type="submit" className="button primary">{editing ? 'Lưu thay đổi' : 'Tạo mới'}</button></div>

export function LearningForm({ initial, onClose, onSaved }: { initial?: LearningItem; onClose: () => void; onSaved?: (id: string) => void }) {
  const { state, add, update } = useDemo(); const toast = useToast()
  const [title, setTitle] = useState(initial?.title || '')
  const [kind, setKind] = useState<LearningItem['kind']>(initial?.kind || 'course')
  const [status, setStatus] = useState<LearningItem['status']>(initial?.status || 'planned')
  const [objective, setObjective] = useState(initial?.objective || '')
  const [notes, setNotes] = useState(initial?.notes || '')
  const [progress, setProgress] = useState(initial?.progress ?? 0)
  const [nextAction, setNextAction] = useState(initial?.nextAction || '')
  const [nextReviewAt, setNextReviewAt] = useState(initial?.nextReviewAt || '')
  const [sourceUrl, setSourceUrl] = useState(initial?.sourceUrl || '')
  const [projectId, setProjectId] = useState(initial?.projectId || '')
  const [error, setError] = useState('')
  const submit = (event: FormEvent) => {
    event.preventDefault(); setError('')
    if (!title.trim() || !objective.trim()) { setError('Hãy nhập tên và mục tiêu học/nghiên cứu.'); return }
    if (!isValidSource(sourceUrl.trim())) { setError('Nguồn cần là đường dẫn http hoặc https.'); return }
    if (progress < 0 || progress > 100 || Number.isNaN(progress)) { setError('Tiến độ phải từ 0 đến 100%.'); return }
    const patch = { title: title.trim(), kind, status, objective: objective.trim(), notes: notes.trim(), progress: status === 'done' ? 100 : progress, nextAction: nextAction.trim(), nextReviewAt: nextReviewAt || undefined, sourceUrl: sourceUrl.trim() || undefined, projectId: projectId || undefined }
    const id = initial?.id || add('learning', patch).id
    if (initial) update('learning', id, patch)
    toast(initial ? 'Đã cập nhật mục học/nghiên cứu trong dữ liệu demo.' : 'Đã thêm mục học/nghiên cứu vào dữ liệu demo.')
    onSaved?.(id); onClose()
  }
  return <form className="form-grid" onSubmit={submit}>
    {error && <Notice tone="error">{error}</Notice>}
    <Field label="Tên nội dung" required><input value={title} onChange={e => setTitle(e.target.value)} autoFocus /></Field>
    <div className="form-two"><Field label="Loại"><select value={kind} onChange={e => setKind(e.target.value as LearningItem['kind'])}>{Object.entries(learningKindLabel).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></Field><Field label="Trạng thái"><select value={status} onChange={e => setStatus(e.target.value as LearningItem['status'])}>{Object.entries(learningStatusLabel).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></Field></div>
    <Field label="Mục tiêu / câu hỏi cần trả lời" required><textarea rows={3} value={objective} onChange={e => setObjective(e.target.value)} /></Field>
    <div className="form-two"><Field label="Tiến độ (%)"><input type="number" min="0" max="100" value={progress} onChange={e => setProgress(Number(e.target.value))} disabled={status === 'done'} /></Field><Field label="Ngày xem lại"><input type="date" value={nextReviewAt} onChange={e => setNextReviewAt(e.target.value)} /></Field></div>
    <Field label="Bước tiếp theo"><input value={nextAction} onChange={e => setNextAction(e.target.value)} placeholder="Ví dụ: đọc và tóm tắt một nguồn" /></Field>
    <Field label="Ghi chú / điều đã học"><textarea rows={4} value={notes} onChange={e => setNotes(e.target.value)} /></Field>
    <div className="form-two"><Field label="Dự án liên quan"><select value={projectId} onChange={e => setProjectId(e.target.value)}><option value="">Không gắn dự án</option>{state.projects.filter(p => !p.archived).map(p => <option key={p.id} value={p.id}>{p.title}</option>)}</select></Field><Field label="Nguồn học / nghiên cứu"><input value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} placeholder="https://..." /></Field></div>
    <FormActions onClose={onClose} editing={!!initial} />
  </form>
}

export function KnowledgeForm({ initial, defaults, onClose, onSaved }: { initial?: KnowledgeItem; defaults?: Partial<KnowledgeItem>; onClose: () => void; onSaved?: (id: string) => void }) {
  const { state, add, update } = useDemo(); const toast = useToast(); const source = initial || defaults
  const [title, setTitle] = useState(source?.title || '')
  const [category, setCategory] = useState<KnowledgeItem['category']>(source?.category || 'insight')
  const [content, setContent] = useState(source?.content || '')
  const [sourceUrl, setSourceUrl] = useState(source?.sourceUrl || '')
  const [tags, setTags] = useState(source?.tags?.join(', ') || '')
  const [reviewStatus, setReviewStatus] = useState<KnowledgeItem['reviewStatus']>(source?.reviewStatus || 'draft')
  const [projectId, setProjectId] = useState(source?.projectId || '')
  const [customerId, setCustomerId] = useState(source?.customerId || '')
  const [learningId, setLearningId] = useState(source?.learningId || '')
  const [error, setError] = useState('')
  const submit = (event: FormEvent) => {
    event.preventDefault(); setError('')
    if (!title.trim() || !content.trim()) { setError('Hãy nhập tiêu đề và nội dung kiến thức.'); return }
    if (!isValidSource(sourceUrl.trim())) { setError('Nguồn cần là đường dẫn http hoặc https.'); return }
    const patch = { title: title.trim(), category, content: content.trim(), sourceUrl: sourceUrl.trim() || undefined, tags: [...new Set(tags.split(',').map(tag => tag.trim()).filter(Boolean))], reviewStatus, projectId: projectId || undefined, customerId: customerId || undefined, learningId: learningId || undefined }
    const id = initial?.id || add('knowledge', patch).id
    if (initial) update('knowledge', id, patch)
    toast(initial ? 'Đã cập nhật kiến thức trong dữ liệu demo.' : 'Đã lưu kiến thức vào dữ liệu demo.')
    onSaved?.(id); onClose()
  }
  return <form className="form-grid" onSubmit={submit}>
    {error && <Notice tone="error">{error}</Notice>}
    <Field label="Tiêu đề" required><input value={title} onChange={e => setTitle(e.target.value)} autoFocus /></Field>
    <div className="form-two"><Field label="Nhóm kiến thức"><select value={category} onChange={e => setCategory(e.target.value as KnowledgeItem['category'])}>{Object.entries(knowledgeCategoryLabel).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></Field><Field label="Tình trạng rà soát"><select value={reviewStatus} onChange={e => setReviewStatus(e.target.value as KnowledgeItem['reviewStatus'])}>{Object.entries(reviewStatusLabel).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></Field></div>
    <Field label="Nội dung" required hint="Ghi rõ điều đã xác nhận và điều còn là giả định."><textarea rows={7} value={content} onChange={e => setContent(e.target.value)} /></Field>
    <div className="form-two"><Field label="Từ khóa" hint="Ngăn cách bằng dấu phẩy"><input value={tags} onChange={e => setTags(e.target.value)} placeholder="workshop, quy trình, CEO" /></Field><Field label="Đường dẫn nguồn"><input value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} placeholder="https://..." /></Field></div>
    <div className="form-two"><Field label="Dự án liên quan"><select value={projectId} onChange={e => setProjectId(e.target.value)}><option value="">Dùng chung</option>{state.projects.filter(p => !p.archived).map(p => <option key={p.id} value={p.id}>{p.title}</option>)}</select></Field><Field label="Khách liên quan"><select value={customerId} onChange={e => setCustomerId(e.target.value)}><option value="">Không gắn khách</option>{state.customers.filter(c => !c.archived).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field></div>
    <Field label="Học/nghiên cứu liên quan"><select value={learningId} onChange={e => setLearningId(e.target.value)}><option value="">Không gắn</option>{state.learning.filter(item => !item.archived).map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></Field>
    <FormActions onClose={onClose} editing={!!initial} />
  </form>
}

export function DataAssetForm({ initial, defaults, onClose, onSaved }: { initial?: DataAsset; defaults?: Partial<DataAsset>; onClose: () => void; onSaved?: (id: string) => void }) {
  const { state, add, update } = useDemo(); const toast = useToast(); const source = initial || defaults
  const [title, setTitle] = useState(source?.title || '')
  const [kind, setKind] = useState<DataAsset['kind']>(source?.kind || 'document')
  const [description, setDescription] = useState(source?.description || '')
  const [content, setContent] = useState(source?.content || '')
  const [sourceUrl, setSourceUrl] = useState(source?.sourceUrl || '')
  const [format, setFormat] = useState(source?.format || '')
  const [reviewStatus, setReviewStatus] = useState<DataAsset['reviewStatus']>(source?.reviewStatus || 'draft')
  const [projectId, setProjectId] = useState(source?.projectId || '')
  const [customerId, setCustomerId] = useState(source?.customerId || '')
  const [error, setError] = useState('')
  const submit = (event: FormEvent) => {
    event.preventDefault(); setError('')
    if (!title.trim() || !description.trim()) { setError('Hãy nhập tên và mô tả dữ liệu/tài liệu.'); return }
    if (!isValidSource(sourceUrl.trim())) { setError('Liên kết nguồn cần là http hoặc https.'); return }
    const patch = { title: title.trim(), kind, description: description.trim(), content: content.trim(), sourceUrl: sourceUrl.trim() || undefined, format: format.trim(), reviewStatus, projectId: projectId || undefined, customerId: customerId || undefined, ownerId: initial?.ownerId || 'u1' }
    const id = initial?.id || add('dataAssets', patch).id
    if (initial) update('dataAssets', id, patch)
    toast(initial ? 'Đã cập nhật tài sản dữ liệu trong bản demo.' : 'Đã thêm tài sản dữ liệu vào bản demo.')
    onSaved?.(id); onClose()
  }
  return <form className="form-grid" onSubmit={submit}>
    {error && <Notice tone="error">{error}</Notice>}
    <Notice>Dữ liệu chỉ lưu trong trình duyệt này. Liên kết và văn bản được lưu; tệp thật chưa được tải lên.</Notice>
    <Field label="Tên dữ liệu / tài liệu" required><input value={title} onChange={e => setTitle(e.target.value)} autoFocus /></Field>
    <div className="form-two"><Field label="Loại"><select value={kind} onChange={e => setKind(e.target.value as DataAsset['kind'])}>{Object.entries(dataKindLabel).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></Field><Field label="Tình trạng rà soát"><select value={reviewStatus} onChange={e => setReviewStatus(e.target.value as DataAsset['reviewStatus'])}>{Object.entries(reviewStatusLabel).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></Field></div>
    <Field label="Mô tả / mục đích" required><textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} /></Field>
    <Field label="Nội dung / cấu trúc dữ liệu" hint="Chỉ dùng dữ liệu minh họa, không nhập thông tin nhạy cảm vào bản thử."><textarea rows={5} value={content} onChange={e => setContent(e.target.value)} placeholder="Ví dụ: các cột của bảng hoặc đoạn văn bản mẫu" /></Field>
    <div className="form-two"><Field label="Định dạng"><input value={format} onChange={e => setFormat(e.target.value)} placeholder="CSV, Google Sheet, PDF..." /></Field><Field label="Đường dẫn nguồn"><input value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} placeholder="https://..." /></Field></div>
    <div className="form-two"><Field label="Dự án liên quan"><select value={projectId} onChange={e => setProjectId(e.target.value)}><option value="">Dùng chung</option>{state.projects.filter(p => !p.archived).map(p => <option key={p.id} value={p.id}>{p.title}</option>)}</select></Field><Field label="Khách liên quan"><select value={customerId} onChange={e => setCustomerId(e.target.value)}><option value="">Không gắn khách</option>{state.customers.filter(c => !c.archived).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field></div>
    <FormActions onClose={onClose} editing={!!initial} />
  </form>
}
