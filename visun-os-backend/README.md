# VISUN OS — backend (Supabase: Postgres + Auth + Storage)

**Trạng thái:** Schema, RLS và 3 lệnh máy chủ lõi đã viết và **đã kiểm thử thật** bằng Postgres nhúng (xem mục "Đã kiểm thử" bên dưới). **Chưa tạo project Supabase thật, chưa có tài khoản/dự án trên cloud, chưa phát sinh chi phí.** Việc tạo project thật và trỏ domain là bước anh Hùng thực hiện khi quyết định triển khai, vì tài khoản dịch vụ phải do anh Hùng sở hữu (mục 13, `KE_HOACH_BACKEND_VISUN_OS.md`).

Thư mục này hiện thực hóa ERD và hợp đồng API đã chốt ở `../visun-os-frontend/docs/BACKEND_CONTRACT.md`.

## Cấu trúc

```
visun-os-backend/
  supabase/migrations/   # Schema, trigger, RLS, hàm RPC — chạy tuần tự theo tên file
  test/pglite-harness.mjs  # Bộ kiểm thử schema/RLS/RPC bằng Postgres nhúng, không cần Docker
  package.json
```

## Đã triển khai trong migration

| File | Nội dung |
|---|---|
| `0001_foundations.sql` | extensions, `workspaces`, `memberships`, `resource_shares`, hàm quyền dùng chung, `create_workspace()` bootstrap, trigger `set_updated_at`/`bump_revision`/`protect_ownership_columns` |
| `0002_customers_opportunities.sql` | `pipeline_stages`, `customers`, `contacts`, `opportunities` + trigger chặn giai đoạn không hợp lệ |
| `0003_projects_tasks_notes_inbox.sql` | `projects`, `milestones`, `project_documents`, `documents`, `task_recurrence_series`, `tasks`, `notes`, `inbox_items`, `inbox_item_targets` |
| `0004_learning_knowledge_content.sql` | `learning_items`, `knowledge_items`, `data_assets`, `content_items`, `content_publications`, `content_metric_snapshots`, `research_*` |
| `0005_calendar_ai_ops.sql` | `calendar_*`, `ai_*`, `audit_logs`, `notifications`, `reminder_*`, `export_jobs`, `import_jobs`, `idempotency_keys` |
| `0006_triggers_and_rls.sql` | Áp trigger cho toàn bộ bảng nghiệp vụ; bật RLS + policy owner/member/viewer theo ma trận quyền đã chốt |
| `0007_server_operations.sql` | Hàm RPC transaction-an toàn: `rpc_inbox_convert`, `rpc_task_complete`, `rpc_opportunity_create_project` — có idempotency qua `idempotency_keys` |

**Chưa viết trong lần này** (scaffold sau, cần khóa API bên ngoài mới triển khai được): `ai.propose/commit` gọi model thật, `calendar.connect/sync` gọi Google, `reminder.run` gửi email thật, `research.run` agent quét nguồn, `export/import`. Hợp đồng request/response của các lệnh này đã có sẵn ở `BACKEND_CONTRACT.md`; khi có khóa API, viết tiếp dưới dạng Supabase Edge Function (Deno) gọi vào các bảng đã có sẵn, hoặc hàm RPC nếu logic không cần gọi dịch vụ ngoài.

## Đã kiểm thử (không cần Docker/Supabase CLI)

Máy triển khai không có Docker nên không thể chạy `supabase start` (cần container Postgres/Auth/Storage đầy đủ). Thay vào đó, `test/pglite-harness.mjs` dùng **PGlite** — bản Postgres thật biên dịch sang WebAssembly, chạy trực tiếp trong Node, không cần Docker — để áp toàn bộ migration lên một database thật và chạy 38 kịch bản kiểm tra, bao gồm:

- Bootstrap workspace qua `create_workspace()`, gán đúng role `owner`.
- RLS thật (không phải superuser bỏ qua): viewer không tạo được task nhưng đọc được; người ngoài workspace không đọc được gì; member không sửa được bản ghi của người khác nhưng sửa được của mình.
- Trigger `bump_revision`/`protect_ownership_columns` hoạt động đúng khi client cố ý gửi sai `workspace_id`/`created_by`.
- `rpc_inbox_convert`: một inbox tạo nhiều bản ghi đích (task + note) trong một lần gọi; gọi lại đúng `requestId` trả kết quả cũ, không tạo trùng; viewer bị RLS chặn khi cố gọi.
- `rpc_task_complete`: trả `conflict` khi `revision` sai; sinh đúng một occurrence kế tiếp cho việc lặp; gọi lại cùng `requestId` không sinh thêm occurrence.
- `rpc_opportunity_create_project`: chặn khi cơ hội chưa ở giai đoạn `is_won`; tạo đúng một dự án; gọi lại cùng `requestId` trả đúng `projectId` cũ, không tạo dự án thứ hai.
- Tìm kiếm tiếng Việt có dấu/không dấu qua `unaccent` + `pg_trgm`.

Chạy lại:

```bash
cd visun-os-backend
npm install
npm run test:schema
```

**Giới hạn của bộ kiểm thử này:** PGlite chưa đóng gói extension `pgcrypto`/`unaccent` như Postgres thật, nên harness tự thay bằng bản tương đương chỉ để chạy test (xem comment `patchForPglite` trong file harness) — **các file migration thật không bị sửa**. Trước khi dùng dữ liệu thật, vẫn cần chạy lại đúng migration này trên Supabase CLI/project thật (`supabase db push`) để xác nhận `pgcrypto`/`unaccent` hoạt động với extension chuẩn.

## Cách chạy thật khi anh Hùng quyết định triển khai

1. Cài Docker Desktop và [Supabase CLI](https://supabase.com/docs/guides/cli).
2. `supabase init` trong thư mục này (nếu chưa có `supabase/config.toml`), rồi `supabase start` để chạy Postgres/Auth/Storage cục bộ.
3. `supabase db reset` để áp toàn bộ migration trong `supabase/migrations/` lên database cục bộ.
4. Tạo project Supabase thật trên [supabase.com](https://supabase.com) bằng tài khoản của anh Hùng, `supabase link --project-ref <ref>`, rồi `supabase db push` để áp migration lên project thật.
5. Bật extension `pgcrypto`, `pg_trgm`, `unaccent` trong Database → Extensions nếu CLI chưa tự bật.
6. Lấy `SUPABASE_URL` và `anon key` từ Project Settings → API, điền vào `.env` của frontend (xem `visun-os-frontend/README.md` phần kết nối backend).
7. Tạo workspace đầu tiên bằng cách gọi `select create_workspace('AI Trainer');` sau khi đăng nhập bằng tài khoản đầu tiên (qua Supabase Auth), hoặc qua một script khởi tạo nếu làm UI mời riêng sau.
8. Không tự ý nhập dữ liệu demo (`seed.ts` của frontend) vào project thật — theo đúng ranh giới đã chốt ở mục 6, `KE_HOACH_BACKEND_VISUN_OS.md`.

## Việc còn lại theo lộ trình BE (xem `KE_HOACH_BACKEND_VISUN_OS.md`)

- BE1: nối `ApiRepository` phía frontend với project Supabase thật (đã có scaffold code ở `visun-os-frontend/src/data/`, xem README frontend), bật đăng nhập thật.
- BE2: viết RPC/Edge Function còn lại cho contacts/milestones/documents CRUD chi tiết nếu cần thao tác ngoài `list/get/create/update/archive` chuẩn của Data API.
- BE3–BE6: Storage cho tệp thật, Google Calendar, email, AI, import/export theo đúng hợp đồng đã có trong `BACKEND_CONTRACT.md`.
