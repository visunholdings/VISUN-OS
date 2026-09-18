# KẾ HOẠCH BACKEND VISUN OS — KHỚP VỚI FRONTEND HIỆN TẠI

**Trạng thái:** Đã có project Supabase thật (do anh Hùng tạo và sở hữu), đã đẩy đủ migration, và đã thử thành công luồng đăng nhập → ghi nhanh → chuyển thành việc → hoàn thành trên trình duyệt thật qua trang `/live`. Xem mục 0 để biết chính xác phần nào đã chạy thật, phần nào vẫn theo lộ trình.  
**Ngày rà soát code lần 2 (tìm và vá 3 lỗi thật):** 18/09/2026.  
**Phạm vi mặc định:** workspace AI Trainer của anh Hùng; dữ liệu Nutrihealth và Visun Group chỉ đưa vào workspace riêng sau khi có quyết định phạm vi.  
**Nguồn:** `PRD_Web_App_Quan_Ly_Cong_Viec_Khach_Hang.md`, `KE_HOACH_TONG_THE_WEBAPP_AI_TRAINER.md`, `KE_HOACH_FRONTEND_VISUN_OS.md`, `visun-os-frontend/README.md`, `visun-os-frontend/docs/BACKEND_CONTRACT.md` và mã frontend hiện tại.

## 0. Tiến độ triển khai thật tính đến 18/09/2026

Thư mục `visun-os-backend/` đã có code thật và đã đẩy lên project Supabase thật của anh Hùng (`npx supabase db push`), không chỉ chạy trên Postgres nhúng cục bộ:

| Đã có | Vị trí | Đã kiểm thử bằng gì |
|---|---|---|
| Toàn bộ schema ERD (~41 bảng), trigger `updated_at`/`revision`/bảo vệ ownership/`force_created_by`, ràng buộc chống trùng | `supabase/migrations/0001–0006, 0010` | Postgres nhúng (PGlite) — 49 kịch bản (`npm run test:schema`) + chạy thật trên project Supabase |
| RLS đầy đủ theo ma trận quyền owner/member/viewer, kể cả `calendar_events` (bị sót ở lần rà soát đầu, đã vá) | `0006`, `0011` | Vai trò `authenticated` không phải superuser (RLS thật); xác nhận qua curl bằng anon key trên project thật |
| 3 lệnh máy chủ lõi có giao dịch + idempotency + kiểm tra rows-affected: `rpc_inbox_convert`, `rpc_task_complete`, `rpc_opportunity_create_project` | `0007`, `0009`, `0011` | Gọi lại cùng `requestId` không tạo trùng; viewer gọi trên bản ghi không có quyền nhận đúng `forbidden` thay vì "success" giả |
| Trang `/live` — luồng chứng minh đầu tiên chạy trên trình duyệt thật: đăng nhập email OTP, ghi nhanh, chuyển thành việc, hoàn thành, tải lại vẫn còn | `visun-os-frontend/src/pagesLive.tsx`, `src/data/` | Thử tay trên project Supabase thật của anh Hùng; `npm run build`/`lint`/`test:e2e` (34/34) không hồi quy |

**Ba lỗi thật tìm thấy khi rà soát code lần 2 (đã vá ở `0010`/`0011`, không phải khi viết lần đầu):**
1. `inbox_items`/`tasks` thiếu `created_by` khi ghi thẳng qua Data API (không qua RPC) → insert bị từ chối. Vá bằng trigger `force_created_by` ép `created_by = auth.uid()` khi insert, bất kể client gửi gì.
2. `calendar_events` bị bỏ sót khỏi mọi nhóm RLS ở lần viết đầu → có thể lộ dữ liệu lịch chéo workspace nếu dùng trước khi vá. Đã bật RLS đúng ở `0011`.
3. `rpc_task_complete`/`rpc_inbox_convert` không kiểm tra UPDATE có thực sự ảnh hưởng dòng nào (RLS chặn UPDATE là im lặng, không giống INSERT) → có thể trả "success" giả cho người không có quyền. Đã thêm `GET DIAGNOSTICS` kiểm tra rows-affected ở `0011`.

**Chưa có / còn theo đúng lộ trình BE1–BE6 bên dưới:**
- Chưa nối `src/data/apiRepository.ts` vào 14 trang demo chính (`App.tsx`/`store.tsx`) — `/live` là một trang riêng, độc lập, chứng minh backend hoạt động thật; việc chuyển từng trang demo sang dùng backend thật vẫn là khối lượng công việc riêng của BE1–BE2.
- Chưa viết `ai.propose/commit`, `calendar.connect/sync`, `reminder.run`, `research.run`, `export/import` — các lệnh này cần khóa API bên ngoài (model AI, Google, dịch vụ email) nên chưa thể viết và kiểm thử có ý nghĩa ở bước này.
- `opportunities.owner_id`/`projects.owner_id`/`milestones.owner_id`/`data_assets.owner_id` chưa có trigger ép giá trị như `created_by` — cần nhớ xử lý khi BE2 thêm thao tác ghi trực tiếp cho các bảng này.

## 1. Kết quả cần đạt

Biến bản frontend dùng dữ liệu minh họa trong `localStorage` thành app có đăng nhập, dữ liệu chung, quyền truy cập, tác vụ theo lịch và khả năng dùng dữ liệu thật. Giữ các luồng đã có: Hôm nay, Hộp ghi nhanh, Công việc, Khách hàng, Cơ hội, Dự án, Học & nghiên cứu, Kho kiến thức, Dữ liệu dự án, Truyền thông & nội dung, Lịch, AI và Tìm kiếm. Không đưa bộ dữ liệu giả vào môi trường vận hành.

**Luồng chứng minh đầu tiên:** đăng nhập trên điện thoại → ghi nhanh → mở cùng mục trên máy tính → chuyển thành việc → thấy việc trên dashboard → mở lại nguồn. Luồng này phải chạy thật trước khi nối AI, email hoặc Google Calendar.

**Ranh giới:** frontend hiện tại là bản demo. Backend không được chỉ thay `localStorage` bằng một URL rồi coi là xong. Các hàm `add/update/archive/commitProposal` hiện đồng bộ; màn hình chưa có trạng thái tải, lưu lỗi, hết phiên, xung đột chỉnh sửa hoặc phân trang.

## 2. Quyết định kiến trúc cần khóa tại BE0

### 2.1. Một đường truy cập dữ liệu nhất quán

**Khuyến nghị:** PostgreSQL/Auth/Storage quản lý sẵn (đánh giá Supabase trước), kết hợp hai kiểu thao tác có ranh giới rõ:

1. **Đọc và CRUD đơn giản:** frontend gọi Data API bằng phiên người dùng; Row Level Security (RLS) và quyền bảng kiểm soát dữ liệu.
2. **Thao tác nhiều bản ghi, dịch vụ ngoài và tác vụ nền:** gọi chức năng máy chủ. Bao gồm chuyển Inbox, tạo dự án từ cơ hội, hoàn thành việc lặp, chốt đề xuất AI, nhập/xuất, Google Calendar, email, nghiên cứu theo lịch. Chức năng máy chủ kiểm tra lại danh tính và quyền; khóa quản trị chỉ nằm ở máy chủ.

OpenAPI/TypeScript contract mô tả các thao tác đặc biệt và DTO trả về cho màn hình. Không đồng thời xây thêm một bộ REST CRUD thứ hai nếu Data API đã phục vụ các thao tác đó. Nếu BE0 chọn API riêng cho *toàn bộ* dữ liệu, phải bỏ đường Data API trực tiếp và dự toán lại công triển khai. Quyết định này cần ghi vào sơ đồ kiến trúc trước khi tạo schema.

### 2.2. Quy tắc dữ liệu chung

- Mỗi bản ghi có ID ổn định, `workspace_id`, `created_at`, `updated_at`, `created_by`, `archived_at` và `revision` cho chống ghi đè. Backend gán workspace và người tạo từ phiên xác thực.
- Thời điểm sự kiện lưu có múi giờ rõ; hạn việc/ngày hỏi lại là **ngày** theo `Asia/Ho_Chi_Minh`, không tự đổi thành UTC midnight. Phân biệt hạn task, ngày hỏi lại, khối thời gian làm việc và cuộc hẹn.
- Quan hệ ID phải cùng workspace và đối tượng được phép truy cập. Kiểm tra trên server/database, kể cả khi frontend đã lọc lựa chọn.
- Lưu riêng bản ghi nghiệp vụ, tệp, lịch sử thay đổi và nhật ký tác vụ. Lưu trữ mềm có quy tắc khôi phục; không xóa dây chuyền hồ sơ khách chỉ vì người dùng ẩn một mục.
- B2C và B2B dùng cùng nền khách/cơ hội nhưng pipeline, bộ lọc, sản phẩm và báo cáo tách riêng. Giai đoạn hiện được hardcode trong `src/domain.ts`; BE0 chốt giữ bộ giai đoạn ban đầu hay chuyển sang cấu hình workspace.

## 3. Bản đồ khớp frontend → backend

| Frontend hiện tại | Backend cần có | Phần frontend phải đổi khi nối thật |
|---|---|---|
| `DemoState` nạp toàn bộ từ `localStorage`; `useDemo()` cung cấp CRUD đồng bộ | Kho dữ liệu có truy vấn, phân trang và quyền | Tạo `ApiRepository`/query layer bất đồng bộ; trạng thái tải, lưu, lỗi, thử lại, hết phiên; chuyển màn hình theo chặng |
| `User` minh họa; ID `u1`, `createdBy` và workspace gán cố định | `auth.users`, `workspaces`, `memberships` | Đăng nhập, tải hồ sơ/role thật, bỏ ID giả khỏi form và menu |
| Inbox chỉ có một `linkedType/linkedId` | Một mục nguồn có thể sinh nhiều bản ghi đích trong một giao dịch | Danh sách các mục đã tạo từ một Inbox; link tới từng mục, không chỉ mục đầu |
| Task có `dueAt`, `reviewAt`, `scheduledStart/End`, `recurringSeriesId`; lần lặp tiếp theo sinh khi bấm Hoàn thành | Quy tắc task, recurrence series/occurrence, khóa chống trùng kỳ | Hoàn thành/mở lại gọi lệnh server; giữ quy tắc đang dùng hoặc đổi có chủ đích, không tự sinh thêm ở client |
| Khách chứa `contacts[]`; dự án chứa `milestones[]`, `documents[]` | Bảng liên hệ, mốc, tài liệu riêng với FK và quyền | API trả DTO chi tiết tương thích hoặc màn hình dùng query riêng; thêm/sửa từng phần có `revision` |
| `Opportunity.stage` là chuỗi; `customerType` lấy theo khách | Pipeline B2C/B2B và ràng buộc giai đoạn | Form nhận danh sách giai đoạn từ cấu hình nếu backend cho chỉnh pipeline; không làm đổi ý nghĩa bản ghi cũ |
| Lịch là sự kiện mẫu với `start/end/cancelled` | Kết nối Google, sự kiện nguồn, lịch nguồn, sync token và liên kết nội bộ | Màn hình kết nối/chọn lịch/trạng thái đồng bộ; phân biệt lịch Google với khối thời gian task |
| Học, kiến thức, dữ liệu dự án là văn bản/URL | Ba nhóm dữ liệu riêng; tệp trong Storage, metadata và quyền hồ sơ | Upload/download thật, tiến độ và lỗi; giữ nguồn, trạng thái kiểm chứng, liên kết dự án |
| Content có bài gốc, tối đa một lượt/kênh trong `publications[]`, số liệu sửa đè | `content_items`, `content_publications`, nguồn ý tưởng, metric snapshots | Lịch và chi tiết lấy dữ liệu server; hiển thị thời điểm/nguồn số liệu; thêm màn hình hàng chờ agent |
| AI demo chỉ tạo `task`/`note`, không có chat thật | Conversation, proposal có nhiều loại hành động, approval và audit | Chat thật, bản nháp có thể sửa/bỏ, trạng thái chốt và link tới **mọi** mục đã tạo |
| Tìm kiếm và dashboard tính từ mọi mảng trong trình duyệt | Truy vấn theo quyền, phân trang, bộ lọc, thống nhất quy tắc ngày | Màn hình lấy kết quả từ server; giữ tiếng Việt có/không dấu và link về bản ghi gốc |
| Thiết lập chỉ có giờ và ngày trong tuần; email là preview | Cài đặt người nhận, múi giờ, lịch gửi, delivery log | UI kết nối email, xem lần gửi/lỗi, tránh hiện “đã gửi” khi job thất bại |

### 3.1. Quan hệ nguồn cần sửa trước khi tạo schema

PRD yêu cầu một cuộc gọi có thể tạo ghi chú và nhiều việc. Vì vậy `InboxItem.linkedType/linkedId` chỉ là dạng demo. Thiết kế backend dùng `inbox_items` và `inbox_item_targets`; mỗi target có đúng một FK tới task, note, opportunity hoặc content, kèm `conversion_request_id`. Chuyển mục, tạo tất cả bản ghi đích và ghi audit trong **một giao dịch**. Chạy lại cùng `conversion_request_id` trả cùng kết quả, không tạo thêm.

Tương tự, `AIProposalItem` hiện chỉ có `task`/`note`; bản thật phải định nghĩa `create/update`, loại bản ghi, trường trước/sau, nguồn và lỗi cần người dùng sửa. Chỉ thêm loại hành động sau khi màn hình duyệt hiển thị được đầy đủ tác động. Không cho model gọi trực tiếp lệnh ghi production.

### 3.2. Nội dung truyền thông và agent

Giai đoạn đầu giữ **một bài gốc → một lượt đăng mỗi kênh**, đúng giao diện hiện tại. Bảng riêng cho từng lượt đăng giữ ngày dự kiến, URL, ngày đăng và trạng thái. `content_metric_snapshots` lưu các lần nhập hoặc đồng bộ số liệu theo thời điểm/nguồn, tránh sửa đè lịch sử. Nếu sau này đăng lại nhiều lần trên cùng kênh, phải đổi cả API và giao diện, không âm thầm phá ràng buộc ban đầu.

Agent nghiên cứu có `research_sources` (nguồn được phép), `research_settings` (chủ đề/lịch), `research_runs` (lần chạy), `research_proposals` (ý tưởng chờ duyệt). Mỗi đề xuất lưu URL, ngày phát hiện, tóm tắt, nhận định, điểm chưa kiểm chứng và khóa chống trùng. **Chấp nhận đề xuất** mới tạo `ContentItem` có liên kết nguồn; bỏ qua cũng được lưu để agent không đề xuất lại liên tục. Agent không tự đăng bài hay tự biến thông tin khách hàng thành case study.

## 4. Hợp đồng thao tác theo luồng

| Luồng | Input quan trọng | Kết quả và quy tắc server |
|---|---|---|
| `inbox.convert` | Inbox ID, danh sách đích đã sửa, `requestId` | Một transaction; trả tất cả ID đích và trạng thái nguồn; retry trả cùng kết quả |
| `task.complete` | Task ID, `revision`, `requestId` | Cập nhật việc; nếu lặp thì tạo đúng một occurrence kế tiếp theo series/kỳ |
| `opportunity.createProject` | Opportunity ID, dữ liệu dự án, `requestId` | Kiểm tra khách, giai đoạn, quyền, tránh tạo dự án trùng do retry |
| `content.publishRecord` | Content ID, kênh, URL/ngày, số liệu | Kiểm tra quyền/URL, lưu lượt đăng và snapshot; giữ bài gốc cùng nguồn |
| `ai.propose` | Câu hỏi, ngữ cảnh được phép, nguồn | Trả câu trả lời có link nội bộ hoặc bản nháp thay đổi có cấu trúc; không ghi nghiệp vụ |
| `ai.commit` | Proposal ID, bản đã sửa, `requestId` | Kiểm tra lại quyền, bản ghi, ngày, revision; ghi toàn bộ hoặc trả lỗi rõ; lưu người duyệt và audit |
| `research.accept` | Proposal ID, `requestId` | Tạo một ý tưởng có nguồn, đánh dấu đã nhận; retry không nhân đôi |
| `reminder.run` | Workspace/ngày theo timezone, job key | Tính nội dung từ dữ liệu mới nhất; tối đa một bản tổng hợp/người/ngày; có delivery log |
| `calendar.sync` | Connection/calendar/sync cursor | Đồng bộ thêm/sửa/hủy theo ID nguồn; giữ link tới khách/dự án; log lần chạy |
| `export/import` | Phạm vi, định dạng, bản xem trước | Kiểm tra quyền; giữ quan hệ ID, báo mục lỗi/trùng; tệp đi theo quy trình riêng |

Lệnh server trả trạng thái `success`, `validation_error`, `forbidden`, `conflict`, `retryable_error` theo một mẫu thống nhất để frontend hiển thị đúng. Danh sách và chi tiết có phân trang/bộ lọc; không tải toàn bộ workspace vào một lần như demo. Bản ghi có `revision` để hai phiên chỉnh sửa không âm thầm ghi đè.

## 5. Lộ trình đã chỉnh để khớp frontend

| Chặng | Ước lượng tham chiếu* | Bàn giao có thể kiểm tra | Cổng nghiệm thu |
|---|---:|---|---|
| **BE0 — Khóa hợp đồng và dữ liệu** | 1–2 tuần | ERD, từ điển trường, ma trận quyền, DTO/API, danh sách chuyển đổi từng màn hình, pipeline B2C/B2B đã chốt | Đối chiếu đủ các route và thao tác demo; duyệt 6 luồng chính và 10 tình huống lỗi — **✅ đã xong phần tài liệu; ERD/RLS/API đã viết thành migration thật (mục 0)** |
| **BE1 — Auth, schema và cầu nối frontend–API** | 2–3 tuần | Môi trường thử, migration, RLS, login, query layer bất đồng bộ, inbox/task/dashboard đầu tiên | Luồng điện thoại → máy tính ở mục 1 chạy được; refresh không mất dữ liệu; thiếu quyền bị từ chối — **🔶 migration/RLS/RPC đã viết và kiểm thử bằng Postgres nhúng; còn thiếu: project Supabase thật, nối query layer vào giao diện (mục 0)** |
| **BE2 — Lõi khách, cơ hội, dự án** | 2–3 tuần | Contacts, notes, opportunities, projects, milestones, chuyển Inbox nhiều đích, task lặp, tìm kiếm | Cam kết truy được nguồn; chốt cơ hội tạo đúng một dự án khi retry; dashboard và danh sách khớp |
| **BE3 — Kiến thức, tệp và truyền thông** | 2–3 tuần | Learning, knowledge, data assets, storage, content/publications, nhập số liệu, nguồn nội dung | Mở trên hai thiết bị; tệp đúng quyền; bài có lịch/link theo kênh; không mất nguồn |
| **BE4 — Email và Google Calendar đọc** | 2–3 tuần | Cài đặt timezone/người nhận, gửi email, delivery log, Google OAuth, sync cursor, UI kết nối | Không nhắc trùng; sự kiện sửa/hủy cập nhật; ngắt kết nối vẫn giữ task trong app |
| **BE5 — AI có duyệt và agent nghiên cứu** | 3–4 tuần | Chat có dẫn nguồn, proposal/approval/audit, lịch nghiên cứu, hàng chờ duyệt nội dung | Tên/ngày mơ hồ được hỏi lại; bấm chốt hai lần không nhân đôi; agent không tự đăng |
| **BE6 — Nhập/xuất, mở nhóm và vận hành** | 2–3 tuần | Nhập có xem trước, export, quyền nhóm, backup database+tệp, khôi phục thử, giám sát job | Xuất–khôi phục đủ quan hệ và tệp; kiểm tra truy cập trực tiếp; dùng thử bằng dữ liệu được phép |

\*Các tuần là ước lượng lập kế hoạch cho một người full-stack có kinh nghiệm và QA hỗ trợ, có thể gối đầu; tổng cần ước lại sau BE0. **Công chuyển frontend–API đã được tính rõ trong từng chặng**, khác với kế hoạch backend sơ bộ trước. Không xem ước lượng này là báo giá hay cam kết nhà thầu.

### 5.1. Cách chuyển màn hình mà không làm mất bản demo

1. Giữ `LocalDemoRepository` ở chế độ demo để so sánh, nhưng môi trường có dữ liệu thật dùng `ApiRepository` và Auth; không trộn hai nguồn trong một phiên.
2. Chuyển theo thứ tự: login → Inbox/Task/Dashboard → Customer/Opportunity/Project → Learning/Knowledge/Data → Content → Calendar/Settings → AI/Agent.
3. Mỗi chặng có bản đồ DTO, trạng thái tải/rỗng/lỗi, thông báo lưu, xử lý `conflict` và test desktop/mobile. Chỉ bật route thật khi cả đọc lẫn ghi và quyền đã đạt.
4. URL hiện tại (`/tasks/:id`, `/customers/:id`, `/content/:id`...) được giữ; ID trong URL chuyển sang ID server. Link nguồn cũ trong dữ liệu demo chỉ được chuyển qua bảng ánh xạ khi người dùng chọn import.
5. Bỏ nhãn “BẢN THỬ/DỮ LIỆU MINH HỌA” ở môi trường thật sau khi route tương ứng đã nối thật; route còn mô phỏng phải tiếp tục có nhãn rõ.

## 6. Dữ liệu demo, nhập dữ liệu thật và sao lưu

- Không tự đưa 10 khách, 36 việc và các bản ghi giả của `seed.ts` vào production. Nếu anh Hùng đã nhập dữ liệu cần giữ trong trình duyệt, xuất JSON trước, chọn bản ghi, xem trước mapping ID, phát hiện trùng và chỉ import sau khi xác nhận.
- Dữ liệu đầu vào thực tế có thể đến từ Sheets/Excel, Notion, email, Drive hoặc ghi chú. BE0 kiểm kê nguồn, người sở hữu và chất lượng; BE6 xây mẫu CSV/JSON và báo lỗi theo dòng.
- Mỗi lần import có `import_job_id`, thống kê tạo/bỏ qua/lỗi và khả năng đối soát. Môi trường thử phải import và khôi phục trước khi đụng môi trường dùng thật.
- Database và tệp được sao lưu riêng; cần bài diễn tập khôi phục và so số bản ghi, FK, file checksum, quyền. Không coi việc có nút “Xuất JSON demo” là giải pháp backup production.

## 7. An toàn, quyền và vận hành

1. Chủ sở hữu/cộng sự/người xem có ma trận quyền `read/create/update/archive/export/approve` theo workspace; khi cần mới mở quyền theo dự án/hồ sơ. Test cả truy cập URL trực tiếp và gọi API trực tiếp.
2. Mọi chức năng dùng khóa quyền cao kiểm tra lại actor, membership, workspace, input, approval và idempotency trước khi ghi. Không đưa khóa model, Google token, email key vào frontend.
3. AI chỉ nhận những trường cần cho câu hỏi và người hỏi có quyền xem. Ghi model/version, nguồn, proposal, bản người dùng sửa và kết quả chốt; đặt chính sách thời hạn giữ hội thoại/log.
4. Job email, sync lịch, nghiên cứu và export có trạng thái `queued/running/succeeded/failed`, số lần thử, lỗi rút gọn, thời điểm chạy và người/tiến trình kích hoạt. Có cách chạy lại an toàn mà không nhân đôi side effect.
5. Có môi trường thử và thật, migration theo phiên bản, rollback dữ liệu/cấu hình đã diễn tập, log lỗi không chứa bí mật, cảnh báo khi job thất bại.

## 8. Bộ nghiệm thu bắt buộc

- **Luồng lõi:** ghi nhanh trên điện thoại, mở ở máy khác; một Inbox tạo ghi chú + hai việc; mở từng nguồn/đích; retry không tạo trùng.
- **Task:** hôm nay, quá hạn, chờ hỏi lại, hoàn thành/mở lại, lặp ngày/tuần; dashboard, danh sách và email dùng cùng quy tắc ngày.
- **B2C/B2B:** một khách nhiều liên hệ/cơ hội/dự án; pipeline đúng nhóm; người không có quyền không thấy qua tìm kiếm, export hoặc URL trực tiếp.
- **Nội dung:** một ý tưởng từ Inbox/Knowledge/agent giữ nguồn; lịch bốn kênh; link bài đã đăng; số liệu có ngày/nguồn; chấp nhận lại một đề xuất không tạo hai ý tưởng.
- **Lịch/email:** thêm/sửa/hủy sự kiện trên Google; token hết hạn; email retry; timezone Việt Nam; không gửi hai bản tổng hợp cùng ngày.
- **AI:** khách trùng tên, ngày mơ hồ, nguồn không đủ, API lỗi, người sửa bản nháp, bấm chốt hai lần, thiếu quyền, bản ghi đã bị người khác sửa.
- **Dữ liệu:** import có dòng lỗi/trùng, export đủ bản ghi/tệp, khôi phục môi trường thử; dữ liệu seed không lọt production.

## 9. Quyết định cần chốt trước BE0

1. App chỉ chứa hoạt động AI Trainer ở workspace đầu tiên hay cần thêm workspace cho Nutrihealth/Visun Group? **Mặc định: AI Trainer.**
2. Pipeline B2C/B2B và sản phẩm/dịch vụ thực tế nào là bản chính? **Mặc định: giữ nhãn frontend, xác nhận bằng ví dụ thật trước migration.**
3. Dữ liệu khách/việc hiện ở đâu, dữ liệu nào trong browser demo cần giữ? **Mặc định: không import seed.**
4. Tệp gốc nằm trong app hay chỉ liên kết Drive? **Mặc định: lưu link trước, upload riêng cho tệp cần phân quyền trong app.**
5. Google account/lịch cần đọc, địa chỉ và giờ nhận email? **Mặc định: một người dùng, lịch chỉ đọc, timezone Asia/Ho_Chi_Minh.**
6. Nguồn/chủ đề agent được theo dõi và dữ liệu khách nào được phép gửi AI? **Mặc định: chỉ nguồn công khai được chọn, đề xuất chờ duyệt, không gửi hồ sơ khách cho agent nghiên cứu.**

Các quyết định này là đầu vào của BE0, không phải lý do để tạo tài khoản hay kết nối dữ liệu ngay. Kế hoạch dừng ở tài liệu cho tới khi anh Hùng yêu cầu triển khai.

## 10. Tài liệu tham chiếu kỹ thuật cần kiểm tra lại khi bắt đầu

- [Supabase Database và RLS](https://supabase.com/docs/guides/database/overview), [bảo vệ dữ liệu frontend/Edge Functions](https://supabase.com/docs/guides/database/secure-data), [Cron](https://supabase.com/docs/guides/functions/schedule-functions).
- [Google Calendar scopes](https://developers.google.com/workspace/calendar/api/auth) và [incremental sync](https://developers.google.com/workspace/calendar/api/guides/sync).
- [Supabase Backups](https://supabase.com/docs/guides/platform/backups): bản backup database không bao gồm tệp Storage; cần quy trình riêng cho tệp.

Các đặc tính, hạn mức và chi phí dịch vụ có thể thay đổi; xác minh lại từ nguồn chính thức tại BE0 trước khi chốt nhà cung cấp.

## 11. Kế hoạch môi trường, migration và bí mật vận hành

- **Ba môi trường tách biệt:** local (máy phát triển), thử (staging — dữ liệu giả/ẩn danh), thật (production — dữ liệu khách thật). Mỗi môi trường một project Supabase riêng; không dùng chung khóa API giữa môi trường thử và thật.
- **Bí mật (secrets):** `SUPABASE_URL`/`SUPABASE_ANON_KEY` có thể ở phía frontend vì RLS bảo vệ dữ liệu; `SUPABASE_SERVICE_ROLE_KEY`, khóa Google OAuth, khóa nhà cung cấp AI, khóa dịch vụ email **chỉ** nằm trong biến môi trường của server function/hosting — không commit vào repository, không xuất hiện trong log lỗi hay thông báo trả về client.
- **Quản lý migration:** dùng công cụ migration có phiên bản (ví dụ Supabase CLI); mỗi thay đổi schema là một file migration được review trước khi áp dụng; áp dụng tuần tự local → thử → thật; không sửa schema trực tiếp qua giao diện quản trị trên môi trường thật.
- **Seed và dữ liệu thật:** script tạo dữ liệu mẫu (tương đương `seed.ts` hiện tại) chỉ chạy ở local/thử, có cờ chặn chạy nhầm trên môi trường thật.
- **Sao lưu và khôi phục:** sao lưu database tự động hằng ngày; sao lưu Storage (tệp) theo lịch riêng vì bản sao database không bao gồm tệp (mục 10, nguồn Supabase Backups); diễn tập khôi phục trên môi trường thử theo chu kỳ cố định (đề xuất mỗi quý, hoặc mỗi tháng trong 3 tháng đầu vận hành thật) và ghi lại thời gian khôi phục, số bản ghi khớp.
- **Giám sát vận hành:** cảnh báo khi job nền (email, đồng bộ lịch, nghiên cứu, export/import) chuyển trạng thái `failed`; kênh cảnh báo tối thiểu là email tới anh Hùng, có thể nâng cấp sau.
- **Triển khai frontend:** hosting tĩnh (ví dụ Vercel/Netlify) tách biệt khỏi biến môi trường chứa khóa server; build production không được nhúng khóa server vào bundle.

## 12. Việc chi tiết cho BE0 (checklist)

| STT | Việc | Ai làm | Đầu ra | Ước lượng |
|---|---|---|---|---:|
| 1 | Rà ERD và từ điển trường ở `docs/BACKEND_CONTRACT.md` | Dev + anh Hùng | Danh sách bảng/cột được chốt hoặc đánh dấu cần sửa | 0.5–1 ngày |
| 2 | Rà ma trận quyền theo vai trò | Dev + anh Hùng | Mức quyền `member`/`viewer` được xác nhận, đặc biệt export và phê duyệt AI | 0.5 ngày |
| 3 | Rà hợp đồng request/response cho từng lệnh máy chủ | Dev | Bản OpenAPI/TypeScript type nháp khớp danh sách màn hình | 1–2 ngày |
| 4 | Đối chiếu bản đồ chuyển đổi từng màn hình với mã frontend hiện tại (`src/store.tsx`, `src/pages*.tsx`) | Dev | Danh sách route còn thiếu DTO, nếu có | 0.5–1 ngày |
| 5 | Xác nhận pipeline B2C/B2B thật so với `b2cStages`/`b2bStages` trong `domain.ts` | Anh Hùng | Giữ nguyên hoặc danh sách giai đoạn mới; quyết định có cho cấu hình theo workspace hay không | Anh Hùng quyết định |
| 6 | Đánh giá nhà cung cấp theo khung ở mục 13 | Dev | Bảng so sánh có số liệu thật (giá, hạn mức, nơi lưu dữ liệu) | 1 ngày |
| 7 | Dựng project Supabase môi trường thử, chạy migration mẫu cho `customers`/`tasks`, kiểm tra RLS chặn đúng/sai theo ma trận quyền | Dev | Môi trường thử hoạt động, kết quả kiểm tra quyền | 1–2 ngày (có thể tính đầu BE1) |
| 8 | Trả lời 6 quyết định ở mục 9 | Anh Hùng | Câu trả lời bằng văn bản để đưa vào bản chốt PRD/BE0 | Anh Hùng quyết định |

Tổng thời gian kỹ thuật của BE0 (mục 1, 3, 4, 6, 7) khớp với ước lượng 1–2 tuần đã nêu ở mục 5; mục 2, 5, 8 phụ thuộc lịch của anh Hùng và không cộng dồn tuyến tính với việc kỹ thuật.

## 13. Khung chi phí và nhà cung cấp cần xác minh trước khi chốt

Bảng dưới là **khung câu hỏi**, chưa có số liệu vì giá/hạn mức thay đổi theo thời gian; điền số liệu thật ở bước 6 của mục 12 bằng nguồn chính thức tại thời điểm đó.

| Nhà cung cấp | Cần tra cứu | Câu hỏi phải trả lời trước khi chốt |
|---|---|---|
| Supabase (hoặc thay thế Postgres/Auth/Storage quản lý sẵn) | Giá theo tier, hạn mức băng thông/lưu trữ, số ngày giữ bản sao lưu, chính sách tạm dừng project ở gói miễn phí | Gói nào đủ cho quy mô một người dùng rồi mở nhóm nhỏ? Bản sao lưu có tách riêng Storage không? |
| Google Calendar API | Hạn mức gọi API miễn phí, yêu cầu xác minh ứng dụng OAuth nếu vượt số người dùng thử nghiệm | Dùng ở chế độ "người dùng thử nghiệm" (test users) có đủ cho anh Hùng + vài cộng sự hay phải xác minh app công khai? |
| Nhà cung cấp model AI (ví dụ Anthropic/OpenAI) | Giá theo token, giới hạn ngữ cảnh, hỗ trợ đầu ra có cấu trúc (structured output) | Chi phí ước tính mỗi tháng theo tần suất dùng AI dự kiến của anh Hùng là bao nhiêu? |
| Dịch vụ email giao dịch (ví dụ Resend/SendGrid/Postmark) | Hạn mức miễn phí, yêu cầu xác minh tên miền gửi, tỷ lệ vào hộp thư đến | Có cần mua tên miền phụ để gửi email nhắc việc không? |
| Hosting frontend tĩnh (ví dụ Vercel/Netlify) | Hạn mức băng thông/build miễn phí, cách quản lý biến môi trường an toàn | Có cần domain riêng cho bản dùng thật hay tạm dùng domain mặc định của hosting? |

Không chọn nhà cung cấp chỉ vì đang dùng phổ biến; xác nhận lại giá, nơi lưu trữ dữ liệu (đặc biệt nếu có yêu cầu dữ liệu khách nằm ở khu vực cụ thể) và điều khoản dịch vụ tại thời điểm chốt, vì các đặc tính này có thể đã đổi so với lúc lập kế hoạch (18/09/2026).
