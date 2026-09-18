# Hợp đồng dữ liệu cho chặng backend — VISUN OS

Tài liệu này mô tả hợp đồng dữ liệu cần khóa tại BE0. Kế hoạch triển khai và bản đồ từng màn hình nằm ở `../../KE_HOACH_BACKEND_VISUN_OS.md`. Frontend hiện tại là nguồn để đối chiếu DTO, không phải schema database dùng thật. Không dùng file JSON demo hoặc `localStorage` làm cơ sở dữ liệu vận hành.

## Mô hình chính

`Customer`, `Contact`, `Opportunity`, `Project`, `Milestone`, `DocumentLink`, `Task`, `Note`, `InboxItem`, `CalendarEventLink`, `LearningItem`, `KnowledgeItem`, `DataAsset`, `ContentItem`, `ContentPublication`, `User`, `Membership`, `AIProposal`, `InboxItemTarget`, `ResearchRun`, `ResearchProposal`. Mỗi bản ghi nghiệp vụ có `id`, `workspaceId`, `createdAt`, `updatedAt`, `createdBy`, `archived`. Liên kết dùng ID, không dùng tên khách.

- `Customer.type`: B2C/B2B; B2B có nhiều `Contact`.
- `Opportunity`: `customerId`, `customerType`, `stage`, `nextAction`, `nextActionAt`, `ownerId`; `value` chỉ có khi người dùng nhập.
- `Project`: `customerId?`, `opportunityId?`, mốc, tài liệu và công việc liên quan. Tiến độ demo = số việc hoàn thành / tổng số việc gắn dự án.
- `Task`: tách `dueAt` (hạn), `reviewAt` (ngày hỏi lại), `scheduledStart/End` (khối thời gian); có `customerId`, `opportunityId`, `projectId`, `sourceNoteId`, `sourceInboxId`, `assigneeId`, `promisedTo`.
- `InboxItem`: giữ nội dung gốc; bản demo chỉ có một `linkedType`/`linkedId`. Backend dùng `InboxItemTarget` để một nguồn trỏ tới nhiều task/note/opportunity/content, tạo cùng một giao dịch và trả toàn bộ ID đích.
- `CalendarEventLink`: tách ID sự kiện nguồn với các ID liên kết nội bộ khi có tích hợp Google.
- `AIProposal`: `proposalId`, nguồn, danh sách hành động `create/update`, trường trước/sau và trạng thái duyệt. Demo mới có task/note; mở rộng loại hành động cùng màn hình duyệt, không cho model ghi thẳng.
- `LearningItem`: loại học/nghiên cứu/công cụ, mục tiêu, trạng thái, tiến độ, ghi chép, nguồn, bước và ngày xem lại, `projectId?`.
- `KnowledgeItem`: bài học/quy trình/prompt/mẫu/nghiên cứu; nội dung, từ khóa, URL nguồn, tình trạng rà soát, `learningId?`, `projectId?`, `customerId?`. Kiến thức dùng lại phải tách khỏi hồ sơ khách và dữ liệu vận hành.
- `DataAsset`: metadata của bảng, bộ dữ liệu, tài liệu hoặc liên kết; văn bản mẫu, định dạng, URL nguồn, tình trạng rà soát, `projectId?`, `customerId?`. Nội dung tệp thật cần kho lưu trữ riêng ở backend.
- `ContentItem`: ý tưởng/bài gốc, đối tượng B2C hoặc B2B, trụ cột, giai đoạn, bản nháp, CTA, nguồn và tình trạng chứng cứ; liên kết `inboxId?`, `knowledgeId?`, `taskId?`.
- `ContentPublication`: giai đoạn đầu một lượt cho mỗi kênh của bài gốc, ngày dự kiến, ngày đã đăng và URL. `ContentMetricSnapshot` lưu số liệu theo thời điểm và nguồn (nhập tay/đồng bộ), không ghi đè lịch sử.
- Nghiên cứu theo lịch cần thêm cấu hình nguồn/chủ đề, nhật ký lần chạy, mục đề xuất và trạng thái duyệt. Đề xuất từ agent không tự trở thành nội dung đã kiểm chứng.

## ERD chi tiết và từ điển trường (bổ sung để viết migration)

Khóa cột nền dùng chung trước, sau đó liệt kê cột riêng từng bảng theo nhóm nghiệp vụ. Kiểu dữ liệu tham chiếu PostgreSQL/Supabase; tên bảng/cột có thể đổi khi rà cùng anh Hùng ở BE0, miễn giữ đúng quan hệ và ràng buộc chống trùng nêu dưới đây. Đây là **bản thiết kế để viết migration**, chưa phải migration đã chạy.

### Cột nền cho mọi bảng nghiệp vụ chính

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | `uuid` PK | `default gen_random_uuid()` |
| `workspace_id` | `uuid` → `workspaces.id` | Server gán từ phiên xác thực, không nhận từ client |
| `created_at` | `timestamptz` | `default now()` |
| `updated_at` | `timestamptz` | Trigger cập nhật, không để client tự set |
| `created_by` | `uuid` → `auth.users.id` | |
| `archived_at` | `timestamptz`, null | Lưu trữ mềm; `null` = đang hoạt động |
| `revision` | `integer default 1` | Tăng mỗi lần `update`; dùng để chống ghi đè (mục "Ràng buộc giao dịch và kiểm toán") |

Bảng nối, log và hàng đợi không cần đủ bộ cột nền — ghi rõ ngoại lệ ở từng dòng.

### A. Nền tảng & danh tính

| Bảng | Cột riêng | Ghi chú |
|---|---|---|
| `workspaces` | `name`, `created_at` | Bảng gốc, không có `workspace_id` |
| `memberships` | `workspace_id`, `user_id→auth.users`, `role`(`owner`\|`member`\|`viewer`), `invited_by`, `invited_at`, `accepted_at`, `revoked_at` | Không dùng `archived_at`/`revision`; rời nhóm = set `revoked_at` |
| `resource_shares` | `workspace_id`, `resource_type`, `resource_id`, `user_id`, `permission`(`view`\|`edit`), `granted_by`, `granted_at` | Phân quyền theo dự án/hồ sơ khi cần (F10); để trống ở bản một người dùng |

### B. Công việc cá nhân

| Bảng | Cột riêng | Ghi chú |
|---|---|---|
| `inbox_items` | `content text`, `status`(`new`\|`processed`\|`dismissed`) | |
| `inbox_item_targets` | `inbox_item_id→inbox_items`, `target_type`(`task`\|`note`\|`opportunity`\|`content`), `target_id uuid`, `conversion_request_id uuid`, `created_at` | Không cần đủ cột nền; `unique(inbox_item_id, target_type, target_id)`; `conversion_request_id` phục vụ idempotency của `inbox.convert` |
| `tasks` | `title`, `description`, `status`(`todo`\|`doing`\|`waiting`\|`done`\|`cancelled`), `priority`(`low`\|`medium`\|`high`), `due_at date`, `review_at date`, `scheduled_start timestamptz`, `scheduled_end timestamptz`, `customer_id?`, `opportunity_id?`, `project_id?`, `source_note_id?`, `source_inbox_id?`, `assignee_id→auth.users`, `promised_to text?`, `recurring_series_id→task_recurrence_series?` | `due_at`/`review_at` là **date** theo `Asia/Ho_Chi_Minh`, không lưu UTC midnight |
| `task_recurrence_series` | `workspace_id`, `recurrence`(`daily`\|`weekly`), `anchor_date`, `template jsonb`, `active bool`, `created_by` | Occurrence là các dòng `tasks` trỏ `recurring_series_id`; `task.complete` sinh tối đa một occurrence kế tiếp |
| `notes` | `title`, `content`, `type`(`call`\|`meeting`\|`idea`\|`decision`\|`update`), `customer_id?`, `opportunity_id?`, `project_id?`, `source_inbox_id?` | |

### C. Khách hàng & cơ hội

| Bảng | Cột riêng | Ghi chú |
|---|---|---|
| `customers` | `type`(`B2C`\|`B2B`), `name`, `contact_name`, `channel`, `need text`, `status text`, `next_contact_at date`, `email?`, `phone?` | |
| `contacts` | `customer_id→customers`, `name`, `role`, `email?`, `phone?` | B2B nhiều dòng cho một `customer_id` |
| `opportunities` | `customer_id→customers`, `customer_type`, `title`, `product`, `stage text`, `next_action text`, `next_action_at date`, `owner_id→auth.users`, `value numeric?`, `reason text?` | `stage` ràng buộc theo `pipeline_stages` nếu chọn cấu hình được; nếu giữ hardcode như `domain.ts` thì dùng `check` constraint theo `b2cStages`/`b2bStages` |
| `pipeline_stages` *(tùy chọn)* | `workspace_id`, `customer_type`, `stage_key`, `label`, `sort_order`, `is_won bool`, `is_lost bool` | Chỉ tạo nếu BE0 chọn "chuyển sang cấu hình workspace" ở mục quy tắc dữ liệu chung |

### D. Dự án & triển khai

| Bảng | Cột riêng | Ghi chú |
|---|---|---|
| `projects` | `customer_id?`, `opportunity_id?`, `title`, `type text`, `status`(`planning`\|`active`\|`waiting`\|`done`), `objective text`, `next_milestone_at date`, `owner_id` | |
| `milestones` | `project_id→projects`, `title`, `date date`, `status`(`todo`\|`done`), `owner_id` | Không cần `archived_at`; xóa milestone dùng xác nhận riêng |
| `project_documents` | `project_id→projects`, `title`, `url`, `added_at`, `created_by` | Bản đầu chỉ lưu link; tệp thật xem bảng `documents` |
| `documents` | `owner_type`(`project`\|`customer`\|`knowledge`\|`data_asset`\|`opportunity`), `owner_id uuid`, `filename`, `storage_path`, `mime_type`, `size_bytes`, `uploaded_by` | Metadata trỏ Supabase Storage; quyền đọc = quyền của `owner_type/owner_id` |

### E. Học tập, kiến thức, dữ liệu

| Bảng | Cột riêng | Ghi chú |
|---|---|---|
| `learning_items` | `title`, `kind`(`course`\|`research`\|`tool`), `status`(`planned`\|`active`\|`paused`\|`done`), `objective`, `notes`, `progress int`(0–100), `next_action`, `next_review_at date`, `source_url?`, `project_id?` | |
| `knowledge_items` | `title`, `category`(`insight`\|`guide`\|`prompt`\|`template`\|`research`), `content`, `source_url?`, `tags text[]`, `review_status`(`draft`\|`reviewed`), `project_id?`, `customer_id?`, `learning_id?` | |
| `data_assets` | `title`, `kind`(`dataset`\|`document`\|`table`\|`link`), `description`, `content`, `source_url?`, `format text`, `review_status`(`draft`\|`reviewed`), `project_id?`, `customer_id?`, `owner_id` | Nội dung tệp thật cũng qua bảng `documents` |

### F. Truyền thông & nội dung

| Bảng | Cột riêng | Ghi chú |
|---|---|---|
| `content_items` | `title`, `angle`, `audience`(`B2C`\|`B2B`), `pillar`(`experience`\|`workflow`\|`guide`\|`research`\|`qa`), `status`(`idea`\|`selected`\|`draft`\|`review`\|`ready`\|`published`), `source_type`(`manual`\|`inbox`\|`knowledge`\|`research`), `source_url?`, `source_note?`, `knowledge_id?`, `inbox_id?`, `task_id?`, `draft text`, `cta text`, `evidence`(`unchecked`\|`checked`\|`permission_needed`), `next_action?`, `due_at date?` | |
| `content_publications` | `content_id→content_items`, `channel`(`facebook`\|`linkedin`\|`youtube`\|`tiktok`), `scheduled_at?`, `published_at?`, `url?` | `unique(content_id, channel)` ở bản đầu — một lượt/kênh |
| `content_metric_snapshots` | `content_publication_id→content_publications`, `captured_at timestamptz`, `source`(`manual`\|`sync`), `views int?`, `interactions int?`, `conversations int?`, `created_by` | Không sửa đè; mỗi lần nhập/đồng bộ là một dòng mới |
| `research_sources` | `label`, `url`, `type`, `allowed bool default false` | Chỉ nguồn `allowed = true` được agent quét |
| `research_settings` | `topics text[]`, `schedule_cron text`, `timezone`, `enabled bool` | |
| `research_runs` | `started_at`, `finished_at`, `status`(`queued`\|`running`\|`succeeded`\|`failed`), `sources_checked int`, `proposals_created int`, `error text` | |
| `research_proposals` | `research_run_id→research_runs`, `url`, `discovered_at`, `summary`, `assessment`, `evidence_status`, `dedupe_key text`, `status`(`pending`\|`accepted`\|`dismissed`), `accepted_content_id?`, `decided_by?`, `decided_at?` | `unique(workspace_id, dedupe_key)` chống đề xuất lặp lại |

### G. Lịch

| Bảng | Cột riêng | Ghi chú |
|---|---|---|
| `calendar_connections` | `user_id→auth.users`, `provider`('google'), `account_email`, `scope text`, `access_token_encrypted`, `refresh_token_encrypted`, `status`(`connected`\|`expired`\|`revoked`), `last_synced_at`, `sync_cursor text` | Token mã hóa, chỉ đọc/ghi từ server function |
| `calendar_selected_calendars` | `connection_id→calendar_connections`, `calendar_id`, `calendar_name`, `visible bool` | |
| `calendar_events` | `connection_id→calendar_connections`, `external_event_id`, `calendar_id`, `title`, `start timestamptz`, `end timestamptz`, `all_day bool`, `cancelled bool`, `customer_id?`, `opportunity_id?`, `project_id?` | `unique(connection_id, external_event_id)` chống nhân bản khi sync lại |

### H. AI và phê duyệt

| Bảng | Cột riêng | Ghi chú |
|---|---|---|
| `ai_conversations` | `user_id`, `title`, `screen_context text` | |
| `ai_messages` | `conversation_id→ai_conversations`, `role`(`user`\|`assistant`\|`system`), `content text` | Không có `archived_at`/`revision` |
| `ai_proposals` | `conversation_id?`, `source_label text`, `status`(`pending`\|`committed`\|`discarded`), `model text`, `model_version text` | |
| `ai_proposal_items` | `proposal_id→ai_proposals`, `action`(`create`\|`update`), `record_type text`, `record_id uuid?`, `before jsonb`, `after jsonb`, `included bool`, `validation_error text?` | |
| `ai_commit_log` | `proposal_id→ai_proposals`, `operation_id uuid unique`, `approver_id`, `committed_at`, `result jsonb` | Khóa idempotency của `ai.commit` |

### I. Vận hành, nhật ký, hàng đợi

| Bảng | Cột riêng | Ghi chú |
|---|---|---|
| `audit_logs` | `actor_id`, `action text`, `entity_type text`, `entity_id uuid`, `before jsonb`, `after jsonb`, `source`(`user`\|`ai`\|`system`\|`import`), `operation_id uuid` | Không sửa/xóa; chỉ thêm |
| `notifications` | `user_id`, `type text`, `payload jsonb`, `read_at?` | |
| `reminder_settings` | `user_id`, `reminder_time time`, `timezone text`, `weekdays_only bool` | |
| `reminder_deliveries` | `user_id`, `for_date date`, `status`(`queued`\|`sent`\|`failed`), `sent_at?`, `error?`, `job_run_id` | `unique(workspace_id, user_id, for_date)` chống gửi trùng |
| `export_jobs` | `requested_by`, `scope jsonb`, `format`(`csv`\|`json`), `status`(`queued`\|`running`\|`succeeded`\|`failed`), `file_url?` | |
| `import_jobs` | `requested_by`, `source_type text`, `status`, `stats jsonb`(created/skipped/errors), `error_report_url?` | |
| `idempotency_keys` | `scope text`(tên lệnh), `request_key text`, `request_hash text`, `response_snapshot jsonb` | `unique(workspace_id, scope, request_key)`; dùng chung cho mọi lệnh cần chống trùng |

## Chiến lược truy cập và lệnh máy chủ

**Quyết định khuyến nghị tại BE0:** frontend dùng phiên người dùng để đọc/CRUD đơn giản qua Data API có RLS; các thao tác nhiều bản ghi, AI, email, Calendar, import/export và nghiên cứu theo lịch gọi chức năng máy chủ. Không xây song song một bộ REST CRUD thứ hai. Nếu chọn API riêng cho mọi truy cập, BE0 phải thay rõ quyết định này trước khi xây.

| Nhóm | Thao tác/hợp đồng | Quy tắc |
|---|---|---|
| Đọc và CRUD đơn giản | `list/get/create/update/archive` cho customers, tasks, opportunities, projects, notes, learning, knowledge, data assets, content | DTO có quan hệ màn hình cần, lọc/phân trang, `revision`, chỉ thấy workspace và bản ghi có quyền |
| Phiên làm việc | `me`, `memberships`, `workspaces` | ID/role lấy từ Auth và membership; không dùng `u1`/workspace hardcode |
| Dashboard và tìm kiếm | Query hoặc server function theo quyền | Cùng quy tắc ngày với danh sách/email, tiếng Việt có/không dấu, phân trang |
| Ghi nhanh → nhiều bản ghi | `inbox.convert(inboxId, targets, requestId)` | Một transaction tạo mọi đích, đánh dấu Inbox và trả toàn bộ ID; retry không nhân đôi |
| Task lặp | `task.complete(taskId, revision, requestId)` | Cập nhật task và tạo tối đa một lần tiếp theo của series/kỳ |
| Cơ hội → dự án | `opportunity.createProject(opportunityId, requestId)` | Kiểm tra giai đoạn/khách/quyền, tránh tạo trùng do retry |
| Nội dung | `content.publishRecord(contentId, channel, payload)` | Một bài gốc, một lượt/kênh ở bản đầu, URL/ngày và snapshot số liệu |
| AI | `ai.propose`, `ai.commit(proposalId, editedActions, requestId)` | Draft trước; người dùng sửa/duyệt; server kiểm tra lại và ghi một lần |
| Agent nghiên cứu | `research.run`, `research.accept(proposalId, requestId)` | Nguồn/chủ đề được phép, log lần chạy, chống trùng; chỉ đề xuất chờ duyệt |
| Nhắc việc | `reminder.preview`, `reminder.run` | Theo timezone/người nhận; log gửi/thất bại, không gửi trùng/người/ngày |
| Google Calendar | `calendar.connect`, `calendar.sync`, `calendar.link` | Chỉ đọc ở bản đầu; lưu calendar/event ID và sync cursor, giữ link hồ sơ |
| Tệp và dữ liệu | `document.uploadIntent`, `export`, `importPreview`, `importCommit` | Quyền hồ sơ, giới hạn tệp, kiểm tra mapping/trùng, backup tệp riêng |

Mỗi lệnh trả lỗi có loại rõ (`validation_error`, `forbidden`, `conflict`, `retryable_error`) để frontend hiện trạng thái lưu phù hợp. Các lệnh này là **thiết kế**, chưa tồn tại. `src/store.tsx` hiện đồng bộ; phải có lớp truy cập bất đồng bộ và chuyển màn hình theo từng chặng. Giữ demo mode tách biệt môi trường dữ liệu thật.

## Ràng buộc giao dịch và kiểm toán

1. Mọi request ghi nhận `workspaceId` từ phiên xác thực, không tin giá trị do client gửi.
2. `create`, `convert`, `create-project`, `commit` có khóa idempotency để retry không sinh trùng.
3. Việc liên kết nguồn/đích và thay đổi trạng thái phải ở cùng transaction.
4. Các thay đổi quan trọng ghi `actorId`, thời điểm, trước/sau, nguồn thao tác và `operationId` vào audit log.
5. Quyền owner/member/viewer phải được kiểm tra tại server trên từng thao tác; giao diện nhóm hiện chỉ mô phỏng.
6. Event từ Google, job gửi email và AI tool call cần trạng thái pending/succeeded/failed cùng cơ chế retry và đối soát.
7. Trước khi import dữ liệu thật cần chính sách lưu trữ, sao lưu, xóa dữ liệu và phân quyền cho nhân sự.

## Ma trận quyền theo vai trò (bản nháp cho BE0)

Áp dụng theo `workspace_id`; `resource_shares` mở rộng quyền theo từng hồ sơ/dự án khi cần (ví dụ cộng sự chỉ thấy một dự án). Ký hiệu: **Đ** đọc, **T** tạo, **S** sửa, **L** lưu trữ/ẩn, **X** xuất, **P** phê duyệt AI.

| Nhóm dữ liệu | Chủ sở hữu (owner) | Cộng sự (member) — mặc định | Người xem (viewer) |
|---|---|---|---|
| Inbox, Task, Note (không gắn hồ sơ chia sẻ riêng) | Đ T S L X P | Đ T S cho mục do mình tạo hoặc được giao; L việc của mình | Đ theo mục được chia sẻ |
| Customer, Contact, Opportunity | Đ T S L X | Đ theo hồ sơ được chia sẻ/giao; T ghi chú, task trong hồ sơ đó; không X toàn workspace | Đ theo hồ sơ được chia sẻ |
| Project, Milestone, Project document | Đ T S L X | Đ/S dự án được giao; T task/milestone trong dự án đó | Đ dự án được chia sẻ |
| Learning, Knowledge, Data asset | Đ T S L X | Đ T S mục do mình phụ trách; Đ phần còn lại nếu không đánh dấu riêng tư | Đ nếu được chia sẻ |
| Content, Content publication | Đ T S L X P (duyệt agent) | Đ T S bài được giao; không tự đăng thay quyền duyệt cuối | Đ nếu được chia sẻ |
| Calendar connection, sync settings | Đ T S L (kết nối/ngắt) | Đ lịch của mình nếu có kết nối riêng; không đụng kết nối của người khác | Đ sự kiện được liên kết |
| AI conversation/proposal/commit | Đ T S P | Đ T proposal của chính mình; **P** (phê duyệt) chỉ khi owner cấp quyền tường minh | Đ nếu được chia sẻ, không P |
| Membership, workspace settings, tích hợp (Google/AI/email keys) | Đ T S L toàn quyền | Không truy cập | Không truy cập |
| Export/Import toàn workspace | Đ T X | Chỉ export phạm vi được giao nếu owner bật quyền này | Không |
| Audit log | Đ toàn bộ | Đ log liên quan tới mục mình có quyền xem | Không |

Ghi chú bắt buộc kiểm thử: người `member`/`viewer` gọi API/URL trực tiếp tới bản ghi ngoài phạm vi phải bị từ chối ở tầng server/RLS, không chỉ ẩn ở giao diện (mục "An toàn, quyền và vận hành" của kế hoạch backend). Ma trận này là **đề xuất mặc định**; anh Hùng xác nhận hoặc chỉnh mức quyền của `member` trước khi khóa RLS ở BE1.

## Hợp đồng request/response cho lệnh máy chủ chính

Mẫu chung cho mọi lệnh: request luôn có `workspaceId` lấy từ phiên (không nhận từ body), response luôn có `status` ∈ `success | validation_error | forbidden | conflict | retryable_error` cộng `message` ngắn cho giao diện. Dưới đây là phần **riêng** của từng lệnh, dựa trên bảng ở mục "Chiến lược truy cập và lệnh máy chủ".

**`inbox.convert`** — Request: `inboxItemId`, `targets: [{ type: 'task'|'note'|'opportunity'|'content', payload }]`, `requestId`. Response `success`: `{ inboxItemId, status: 'processed', createdTargets: [{ type, id }] }`. Một transaction; gọi lại cùng `requestId` trả nguyên `createdTargets` cũ, không tạo thêm dòng trong `inbox_item_targets`.

**`task.complete`** — Request: `taskId`, `revision`, `requestId`. Response `success`: `{ task: {...}, nextOccurrence?: { id, dueAt } }`; `conflict` nếu `revision` không khớp bản mới nhất. Nếu `recurring_series_id` có, tạo đúng một occurrence kế tiếp; không tạo nếu series đã tắt (`active = false`).

**`opportunity.createProject`** — Request: `opportunityId`, `projectDraft: { title, type, objective, milestones? }`, `requestId`. Response `success`: `{ projectId }`; `validation_error` nếu cơ hội chưa ở giai đoạn chốt hoặc thiếu khách. Gọi lại cùng `requestId` khi đã có project cho cơ hội đó trả về project cũ, không tạo dự án thứ hai.

**`content.publishRecord`** — Request: `contentId`, `channel`, `payload: { publishedAt, url, metrics? }`. Response `success`: `{ publication: {...}, metricSnapshotId? }`; `conflict` nếu kênh đó đã có bản ghi (bản đầu chỉ một lượt/kênh). Metric luôn thêm dòng mới ở `content_metric_snapshots`, không `UPDATE` số liệu cũ.

**`ai.propose`** — Request: `conversationId?`, `question`, `screenContext`. Response: `{ answer?, citations: [{ recordType, recordId, note }], proposalId?, proposalItems?: [...] }`; không ghi nghiệp vụ ở bước này. Chỉ dùng dữ liệu mà `actor` có quyền đọc; nếu ngày/khách mơ hồ, trả `needsClarification: true` kèm câu hỏi thay vì đoán.

**`ai.commit`** — Request: `proposalId`, `editedItems: [{ itemId, action, payload, included }]`, `requestId`. Response `success`: `{ committedItems: [{ itemId, recordType, recordId }], failedItems: [{ itemId, error }] }`. Kiểm tra lại quyền/`revision`/trùng cho từng item; ghi `ai_commit_log` theo `operation_id = requestId`; gọi lại cùng `requestId` trả kết quả cũ.

**`research.run`** — Request: kích hoạt thủ công hoặc theo `research_settings.schedule_cron`. Response: `{ researchRunId, status: 'queued' }`. Chỉ quét `research_sources` có `allowed = true`.

**`research.accept`** — Request: `proposalId`, `requestId`. Response `success`: `{ contentItemId }`; gọi lại cùng `requestId` trả cùng `contentItemId`, không tạo `content_items` thứ hai.

**`reminder.preview` / `reminder.run`** — `.preview` Request: `userId`, `forDate` (xem trước, không gửi). `.run` Request: `jobRunId` (từ cron), xử lý toàn workspace theo `reminder_settings.timezone`. Response: `{ delivered: [{ userId, forDate, status }] }`. `unique(workspace_id, user_id, for_date)` ở `reminder_deliveries` chặn gửi trùng khi job chạy lại.

**`calendar.connect` / `calendar.sync` / `calendar.link`** — `.connect` Request: OAuth code → Response `{ connectionId, accountEmail }`. `.sync` Request: `connectionId` → Response `{ upserted, cancelled, nextSyncCursor }`; dùng `sync_cursor` kiểu incremental sync của Google, không quét lại toàn bộ mỗi lần. `.link` Request: `eventId`, `customerId?/opportunityId?/projectId?` → Response `{ eventId, linked: true }`.

**`document.uploadIntent`** — Request: `ownerType`, `ownerId`, `filename`, `mimeType`, `sizeBytes`. Response: `{ documentId, uploadUrl, expiresAt }` (URL ký để client upload thẳng lên Storage, server chỉ cấp quyền và ghi metadata).

**`export` / `importPreview` / `importCommit`** — `export` Request: `scope`, `format` → Response: `{ exportJobId, status }`, tải file khi `succeeded`. `importPreview` Request: file tạm → Response: `{ importJobId, previewRows: [...], potentialDuplicates: [...] }`. `importCommit` Request: `importJobId`, `resolvedRows` → Response: `{ created, skipped, errors: [{ row, reason }] }`.

Bảng này là **thiết kế hợp đồng** để viết OpenAPI/TypeScript type thật ở đầu BE0; tên trường có thể đổi khi rà cùng anh Hùng nhưng phải giữ đúng quy tắc idempotency, quyền và `revision` đã nêu.
