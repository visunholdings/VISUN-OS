# VISUN OS — MCP server cho Claude

Bọc lại đúng 5 thao tác đã có và đã kiểm thử trên `visun-os-backend/` (ghi nhanh, chuyển thành việc, xem/hoàn thành công việc), để Claude Desktop đọc/ghi dữ liệu VISUN OS thật bằng ngôn ngữ tự nhiên. Chạy hoàn toàn cục bộ trên máy anh Hùng (transport `stdio`, không mở cổng ra internet), dùng phiên đăng nhập thật của anh Hùng — **không dùng service_role key**, nên toàn bộ Row Level Security ở `visun-os-backend/supabase/migrations/0006_triggers_and_rls.sql` vẫn được áp dụng như một client bình thường.

**Chỉ Claude, chưa có ChatGPT** — MCP là giao thức của Claude; ChatGPT dùng cơ chế "Actions"/OpenAPI khác, sẽ làm riêng sau nếu cần.

## Cài đặt lần đầu

### 1. Cho phép link đăng nhập quay về máy này

Vào Supabase Dashboard của project → **Authentication → URL Configuration → Redirect URLs** → thêm:

```
http://localhost:51739
```

(Đây là cổng cố định `login.mjs` dùng để nhận lại link đăng nhập, khai báo ở `lib/config.mjs`.)

### 2. Đăng nhập một lần

```bash
cd "/Users/hungtrinh/Desktop/VISUN OS/visun-os-mcp"
npm install
node login.mjs ban@vidu.com
```

Mở email vừa nhận, bấm vào link đăng nhập **đúng một lần, càng sớm càng tốt** (giống hệt lưu ý ở trang `/live` — một số phần mềm quét email có thể làm link hết hạn trước khi anh bấm; nếu vậy chạy lại lệnh trên). Đăng nhập xong, phiên được lưu tại `~/.visun-os-mcp/session.json` (chỉ máy này đọc được).

**Yêu cầu:** tài khoản đăng nhập phải đã từng mở trang `/live` ít nhất một lần trước đó (để workspace được tạo qua `create_workspace()`); MCP server chỉ đọc workspace có sẵn, không tự tạo mới.

### 3. Khởi động lại Claude Desktop

File cấu hình `~/Library/Application Support/Claude/claude_desktop_config.json` đã được thêm mục `mcpServers.visun-os` trỏ tới `server.mjs`. Thoát hẳn Claude Desktop (Cmd+Q) rồi mở lại để nó nạp server mới.

### 4. Thử

Hỏi Claude, ví dụ:
- "Trong VISUN OS, việc nào của tôi đang chưa hoàn thành?"
- "Ghi nhanh vào VISUN OS: gọi cho Công ty B chiều mai"
- "Chuyển mục đó thành việc, hạn thứ Sáu"
- "Đánh dấu hoàn thành việc [tên việc]"

## 5 công cụ (tools)

| Tool | Tương đương | Việc làm |
|---|---|---|
| `list_inbox_items` | `apiRepository.listInboxItems` | Xem Hộp ghi nhanh |
| `create_inbox_item` | `apiRepository.createInboxItem` | Ghi nhanh một câu |
| `convert_inbox_to_task` | `rpc_inbox_convert` | Chuyển một mục ghi nhanh thành việc |
| `list_tasks` | `apiRepository.listTasks` | Xem danh sách việc, lọc theo trạng thái |
| `complete_task` | `rpc_task_complete` | Hoàn thành việc (kèm `revision` chống ghi đè) |

Không có tool xóa hay sửa tùy ý — đúng phạm vi đã kiểm thử ở trang `/live`, tránh để AI thao tác ngoài những gì đã xác nhận an toàn.

## Khi phiên hết hạn

`server.mjs` tự làm mới token khi cần (`autoRefreshToken`) và lưu lại token mới sau mỗi lần làm mới. Nếu vẫn báo "Chưa đăng nhập hoặc phiên đã hết hạn" (thường sau nhiều tuần không dùng, refresh token cũng hết hạn), chạy lại `node login.mjs ban@vidu.com`.

## Giới hạn

- Chạy cục bộ trên máy anh Hùng; muốn dùng trên máy khác phải cài lại và đăng nhập lại trên máy đó.
- Chưa có tool cho Khách hàng/Cơ hội/Dự án — các trang đó chưa nối backend thật (xem `KE_HOACH_BACKEND_VISUN_OS.md` mục 0), nên chưa có gì đáng tin cậy để bọc thành tool.
