export type CustomerType = 'B2C' | 'B2B'
export type TaskStatus = 'todo' | 'doing' | 'waiting' | 'done' | 'cancelled'
export type Priority = 'low' | 'medium' | 'high'
export type Base = { id: string; createdAt: string; updatedAt: string; createdBy: string; workspaceId: string; archived?: boolean }
export type Contact = { id: string; name: string; role: string; email?: string; phone?: string }
export type Customer = Base & { type: CustomerType; name: string; contactName: string; channel: string; need: string; status: string; nextContactAt?: string; email?: string; phone?: string; contacts: Contact[] }
export type Opportunity = Base & { customerId: string; customerType: CustomerType; title: string; product: string; stage: string; nextAction: string; nextActionAt?: string; ownerId: string; value?: number; reason?: string }
export type Milestone = { id: string; title: string; date: string; status: 'todo' | 'done'; ownerId: string }
export type DocumentLink = { id: string; title: string; url: string; addedAt: string }
export type Project = Base & { customerId?: string; opportunityId?: string; title: string; type: string; status: 'planning' | 'active' | 'waiting' | 'done'; objective: string; nextMilestoneAt?: string; ownerId: string; milestones: Milestone[]; documents: DocumentLink[] }
export type Task = Base & { title: string; description: string; status: TaskStatus; priority: Priority; dueAt?: string; reviewAt?: string; scheduledStart?: string; scheduledEnd?: string; customerId?: string; opportunityId?: string; projectId?: string; sourceNoteId?: string; sourceInboxId?: string; assigneeId: string; promisedTo?: string; recurrence?: 'daily' | 'weekly'; recurringSeriesId?: string }
export type Note = Base & { title: string; content: string; type: 'call' | 'meeting' | 'idea' | 'decision' | 'update'; customerId?: string; opportunityId?: string; projectId?: string; sourceInboxId?: string }
export type InboxItem = Base & { content: string; status: 'new' | 'processed' | 'dismissed'; linkedType?: 'task' | 'note' | 'opportunity' | 'content'; linkedId?: string }
export type CalendarEventLink = Base & { title: string; start: string; end: string; allDay?: boolean; cancelled?: boolean; customerId?: string; opportunityId?: string; projectId?: string }
export type LearningItem = Base & { title: string; kind: 'course' | 'research' | 'tool'; status: 'planned' | 'active' | 'paused' | 'done'; objective: string; notes: string; progress: number; nextAction: string; nextReviewAt?: string; sourceUrl?: string; projectId?: string }
export type KnowledgeItem = Base & { title: string; category: 'insight' | 'guide' | 'prompt' | 'template' | 'research'; content: string; sourceUrl?: string; tags: string[]; reviewStatus: 'draft' | 'reviewed'; projectId?: string; customerId?: string; learningId?: string }
export type DataAsset = Base & { title: string; kind: 'dataset' | 'document' | 'table' | 'link'; description: string; content: string; sourceUrl?: string; format: string; reviewStatus: 'draft' | 'reviewed'; projectId?: string; customerId?: string; ownerId: string }
export type ContentStatus = 'idea' | 'selected' | 'draft' | 'review' | 'ready' | 'published'
export type ContentChannel = 'facebook' | 'linkedin' | 'youtube' | 'tiktok'
export type ContentPublication = { channel: ContentChannel; scheduledAt?: string; publishedAt?: string; url?: string; views?: number; interactions?: number; conversations?: number }
export type ContentItem = Base & { title: string; angle: string; audience: 'B2C' | 'B2B'; pillar: 'experience' | 'workflow' | 'guide' | 'research' | 'qa'; status: ContentStatus; sourceType: 'manual' | 'inbox' | 'knowledge' | 'research'; sourceUrl?: string; sourceNote?: string; knowledgeId?: string; inboxId?: string; taskId?: string; draft: string; cta: string; evidence: 'unchecked' | 'checked' | 'permission_needed'; publications: ContentPublication[]; nextAction?: string; dueAt?: string }
export type User = { id: string; name: string; role: 'owner' | 'member' | 'viewer'; initials: string }
export type AIProposalItem = { id: string; kind: 'task' | 'note'; title: string; content: string; dueAt?: string; customerId?: string; sourceNoteId?: string; sourceInboxId?: string; included: boolean }
export type AIProposal = { id: string; sourceLabel: string; items: AIProposalItem[] }
export type DemoState = { version: 3; customers: Customer[]; opportunities: Opportunity[]; projects: Project[]; tasks: Task[]; notes: Note[]; inbox: InboxItem[]; events: CalendarEventLink[]; learning: LearningItem[]; knowledge: KnowledgeItem[]; dataAssets: DataAsset[]; content: ContentItem[]; users: User[]; approvals: string[]; settings: { reminderTime: string; reminderWeekdays: boolean } }
export type Collection = 'customers' | 'opportunities' | 'projects' | 'tasks' | 'notes' | 'inbox' | 'events' | 'learning' | 'knowledge' | 'dataAssets' | 'content'
export type EntityMap = { customers: Customer; opportunities: Opportunity; projects: Project; tasks: Task; notes: Note; inbox: InboxItem; events: CalendarEventLink; learning: LearningItem; knowledge: KnowledgeItem; dataAssets: DataAsset; content: ContentItem }

export const contentStatusLabel: Record<ContentStatus,string> = { idea:'Ý tưởng', selected:'Đã chọn', draft:'Đang viết', review:'Cần rà soát', ready:'Sẵn sàng', published:'Đã đăng' }
export const contentChannelLabel: Record<ContentChannel,string> = { facebook:'Facebook', linkedin:'LinkedIn', youtube:'YouTube', tiktok:'TikTok' }
export const contentPillarLabel: Record<ContentItem['pillar'],string> = { experience:'Trải nghiệm thực tế', workflow:'Workflow AI', guide:'Hướng dẫn áp dụng', research:'Nghiên cứu', qa:'Hỏi đáp CEO/SME' }
export const contentEvidenceLabel: Record<ContentItem['evidence'],string> = { unchecked:'Chưa kiểm chứng', checked:'Đã rà soát', permission_needed:'Cần xin phép' }

export const learningKindLabel: Record<LearningItem['kind'],string> = { course:'Học tập', research:'Nghiên cứu', tool:'Công cụ' }
export const learningStatusLabel: Record<LearningItem['status'],string> = { planned:'Dự định', active:'Đang thực hiện', paused:'Tạm dừng', done:'Hoàn tất' }
export const knowledgeCategoryLabel: Record<KnowledgeItem['category'],string> = { insight:'Bài học', guide:'Quy trình', prompt:'Prompt', template:'Mẫu', research:'Nghiên cứu' }
export const dataKindLabel: Record<DataAsset['kind'],string> = { dataset:'Bộ dữ liệu', document:'Tài liệu', table:'Bảng', link:'Liên kết' }
export const reviewStatusLabel: Record<'draft'|'reviewed',string> = { draft:'Chưa kiểm chứng', reviewed:'Đã rà soát' }

export const taskStatusLabel: Record<TaskStatus,string> = { todo:'Cần làm', doing:'Đang làm', waiting:'Chờ phản hồi', done:'Hoàn thành', cancelled:'Đã hủy' }
export const priorityLabel: Record<Priority,string> = { low:'Thấp', medium:'Vừa', high:'Cao' }
export const projectStatusLabel: Record<Project['status'],string> = { planning:'Chuẩn bị', active:'Đang triển khai', waiting:'Tạm chờ', done:'Hoàn thành' }
export const b2cStages = ['Quan tâm','Đã trao đổi','Đã đề xuất','Đã đăng ký','Chăm sóc tiếp','Chưa phù hợp']
export const b2bStages = ['Tiếp nhận nhu cầu','Khảo sát','Đề xuất','Chờ quyết định','Đã chốt','Triển khai','Tạm dừng','Không phù hợp']
export const isOpenTask = (task: Task) => !task.archived && task.status !== 'done' && task.status !== 'cancelled'
