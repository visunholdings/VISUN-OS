# src/data — lớp kết nối backend thật (chưa được nối vào giao diện)

Thư mục này chứa `apiRepository.ts`, lớp gọi Supabase thật (Postgres + Auth) khớp với schema và hàm RPC ở
`../../../visun-os-backend/supabase/migrations/`. Nó **song song** với `LocalDemoRepository` trong `src/store.tsx`,
không thay thế. `App.tsx` hiện vẫn chỉ dùng `DemoProvider`/`useDemo()` — chưa có màn hình nào gọi `apiRepository.ts`.

## Vì sao chưa nối vào `App.tsx`

`KE_HOACH_BACKEND_VISUN_OS.md` (mục "Ranh giới") nói rõ: nối backend thật không được chỉ thay `localStorage`
bằng một URL rồi coi là xong, vì toàn bộ 14 trang hiện dùng `useDemo()` đồng bộ — không có trạng thái tải, lưu lỗi,
hết phiên hay xung đột chỉnh sửa. Việc chuyển từng trang sang bất đồng bộ đúng cách là khối lượng công việc riêng
(chặng BE1, ước lượng 2–3 tuần), không thể làm an toàn trong một lần sửa nhỏ mà không có project Supabase thật để
kiểm thử trực tiếp trên trình duyệt. Vì vậy phần này dừng ở "đã viết và khớp kiểu dữ liệu với backend", chưa
"đã gắn vào giao diện".

## Đã có

- `supabaseClient.ts`: khởi tạo client từ `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` (xem `.env.example` ở gốc dự án); nếu để trống thì `isBackendConfigured === false`, app không bị ảnh hưởng.
- `types.ts`: kiểu dòng dữ liệu Postgres (snake_case) và hàm chuyển sang kiểu `Task`/`InboxItem` trong `src/domain.ts` — đây là điểm khớp trực tiếp giữa cột backend và field frontend.
- `apiRepository.ts`: đăng nhập bằng email + mật khẩu, lấy/khởi tạo workspace, `listInboxItems`/`createInboxItem`/`convertInbox` (gọi `rpc_inbox_convert`), `listTasks`/`createTask`/`updateTask` (cập nhật lạc quan theo `revision`)/`completeTask` (gọi `rpc_task_complete`), `createProjectFromOpportunity` (gọi `rpc_opportunity_create_project`).

## Bước tiếp theo để thật sự dùng được (BE1)

1. Tạo project Supabase thật, chạy migration (`visun-os-backend/README.md`), điền `.env.local`.
2. Viết `ApiDemoProvider` (cùng hình dạng `DemoContextValue` ở `src/store.tsx` nhưng bất đồng bộ) dùng các hàm trong `apiRepository.ts`, có `loading`/`error`/`conflict` cho từng thao tác.
3. Thêm cờ `VITE_BACKEND_MODE=api` để `App.tsx` chọn `ApiDemoProvider` thay vì `DemoProvider`; mặc định (không đặt biến) vẫn là demo — không đổi hành vi hiện tại.
4. Chuyển màn hình theo đúng thứ tự đã chốt ở mục 5.1 `KE_HOACH_BACKEND_VISUN_OS.md`: đăng nhập → Inbox/Task/Dashboard trước, các trang còn lại sau.
5. Chỉ bỏ nhãn "BẢN THỬ · DỮ LIỆU MINH HỌA" ở những route đã thật sự nối xong cả đọc lẫn ghi và kiểm tra quyền.
