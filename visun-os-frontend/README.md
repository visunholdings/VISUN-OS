# VISUN OS — bản frontend thử nghiệm cho AI Trainer

Đây là webapp **chạy được trên máy cá nhân** bằng dữ liệu minh họa. Giao diện theo `VISUNAI-Brand-Guidelines.pdf` và dùng logo gốc trong thư mục dự án cha. Các thao tác lưu vào trình duyệt đang mở; chưa có tài khoản, dữ liệu chung hay tích hợp thật.

## 1. Mở app

Máy cần Node.js tương thích với Vite 8 và npm. Mở Terminal, dán lần lượt:

```bash
cd "/Users/hungtrinh/Desktop/VISUN OS/visun-os-frontend"
npm install
npm run dev -- --host 127.0.0.1
```

Mở địa chỉ Terminal in ra, thông thường **http://127.0.0.1:5173/**. Giữ Terminal đang chạy khi thử. Để dừng, nhấn `Control + C`.

Nếu muốn thử bản build: `npm run build`, sau đó `npm run preview -- --host 127.0.0.1`. Địa chỉ preview mặc định là `http://127.0.0.1:4173/`.

## 2. Mười lăm tình huống nên thử

1. Mở **Hôm nay**: xem việc đến hạn, quá hạn, chờ hỏi lại, khách cần liên hệ, lịch và dự án.
2. Vào **Hộp ghi nhanh**; nhập “Gửi đề cương cho Công ty An Phát thứ Sáu”; tải lại trang; chuyển mục đó thành **Việc** và mở nguồn ghi nhanh từ chi tiết việc.
3. Mở một việc quá hạn, bấm **Hoàn thành**; quay về Hôm nay để xem số lượng giảm. Bấm **Mở lại** để xem số lượng tăng.
4. Chỉnh một việc sang **Chờ phản hồi**; đặt **Ngày hỏi lại / xem lại** và xem bộ lọc Chờ phản hồi.
5. Mở hồ sơ **Công ty An Phát**: có hai người liên hệ, hai cơ hội, ghi chú và cam kết liên quan.
6. Mở một cơ hội B2B, đổi sang **Đã chốt**, bấm **Tạo dự án**; mở dự án và kiểm tra liên kết về khách/cơ hội.
7. Vào **Lịch tuần**, mở cuộc hẹn, gắn khách và bấm **Mở hồ sơ khách**. Lịch này chỉ là minh họa.
8. Vào **AI demo**, chọn tình huống tạo việc từ cuộc gọi, sửa tên một mục, bỏ chọn một mục, bấm **Chốt và lưu**; bấm lại để thấy app từ chối tạo trùng.
9. Tìm `khao sat` và `khảo sát` ở **Tìm kiếm** để thử tiếng Việt không dấu/có dấu.
10. Vào **Thiết lập**, xem trước email, xuất JSON demo nếu cần, rồi **Khôi phục dữ liệu mẫu** để bắt đầu lại.
11. Vào **Học & nghiên cứu**, thêm một đề tài, đặt mục tiêu, tiến độ, bước tiếp theo và dự án liên quan; mở lại sau khi tải trang.
12. Từ chi tiết đề tài, chọn **Lưu thành kiến thức**; sửa nội dung, gắn từ khóa và kiểm tra liên kết ngược từ Kho kiến thức.
13. Vào **Dữ liệu dự án**, chọn một dự án để xem tài sản dữ liệu, tài liệu, ghi chú, kiến thức và việc; thêm bảng mẫu và bấm **Xuất toàn bộ JSON**.
14. Vào **Hộp ghi nhanh**, ghi một câu hỏi của CEO rồi bấm **+ Nội dung**; xem ý tưởng mới được gắn nguồn và xuất hiện trên bảng truyền thông.
15. Vào **Truyền thông & nội dung**, mở một bài, chọn kênh và ngày đăng; lưu link bài đã đăng, nhập kết quả thủ công và chuyển sang **Lịch đăng** để xem.

## 3. Dữ liệu demo và cách khôi phục

Bộ khởi tạo có 10 khách giả, 8 cơ hội, 5 dự án, 36 việc, 16 ghi chú, 12 sự kiện lịch, 6 mục học/nghiên cứu, 8 mục kiến thức, 6 tài sản dữ liệu, 3 nội dung truyền thông và 3 thành viên minh họa. Ngày được tính tương đối từ ngày mở app. Dữ liệu nằm trong `localStorage` với khóa `visun-os-demo-v1` của **từng trình duyệt**; thay trình duyệt hoặc xóa dữ liệu trang web sẽ không còn các thay đổi đã thử. Dữ liệu demo phiên bản cũ được nâng lên phiên bản mới mà giữ các bản ghi đã sửa.

Tại **Thiết lập → Khôi phục dữ liệu mẫu**, xác nhận để đưa app về bộ ban đầu. Nút **Xuất JSON demo** tải trạng thái đang thử về máy. Chỉ dùng dữ liệu giả; app chưa có bảo mật và sao lưu như một sản phẩm vận hành.

## 4. Màn hình và trạng thái tính năng

| Trang | Đường dẫn | Có thể thử |
|---|---|---|
| Hôm nay | `/` | Tổng hợp theo bản ghi và ghi nhanh |
| Hộp ghi nhanh | `/inbox` | Lưu, chuyển thành việc/ghi chú/cơ hội/ý tưởng nội dung, bỏ qua |
| Công việc | `/tasks`, `/tasks/:id` | Tạo, sửa, lọc, hoàn thành, mở lại, lặp ngày/tuần |
| Khách hàng | `/customers`, `/customers/:id` | B2C/B2B, hồ sơ, liên hệ, dòng thời gian, ghi chú |
| Cơ hội | `/opportunities`, `/opportunities/:id` | Pipeline riêng, đổi giai đoạn, tạo dự án |
| Dự án | `/projects`, `/projects/:id` | Mốc, việc, ghi chú, liên kết tài liệu, tiến độ |
| Học & nghiên cứu | `/learning`, `/learning/:id` | Mục tiêu, nguồn, tiến độ, ghi chú, bước tiếp theo, lưu bài học |
| Kho kiến thức | `/knowledge`, `/knowledge/:id` | Bài học, quy trình, prompt, mẫu; từ khóa, nguồn, trạng thái rà soát |
| Dữ liệu dự án | `/data`, `/data/:id` | Tài sản dữ liệu, nội dung văn bản, liên kết, tổng quan mọi dự án, xuất JSON |
| Truyền thông & nội dung | `/content`, `/content/:id` | Kho ý tưởng, bảng tiến độ, lịch đăng đa kênh, bản nháp, nguồn, kiểm chứng, liên kết việc và kết quả tự nhập |
| Lịch | `/calendar` | Tuần, cuộc hẹn mẫu, liên kết khách/dự án |
| AI demo | `/ai` | 5 tình huống mô phỏng, bản nháp có duyệt và lưu một lần |
| Tìm kiếm | `/search` | Tìm trên khách, cơ hội, dự án, việc, ghi chú, học, kiến thức, dữ liệu và nội dung |
| Thiết lập | `/settings` | Xem trước nhắc việc, xuất/reset demo, trạng thái tích hợp |

**Chưa kết nối thật:** Google Calendar, email, model AI, agent nghiên cứu theo lịch, đăng bài, số liệu nền tảng, đăng nhập, quyền truy cập, tải tệp lên server, đồng bộ giữa người dùng/thiết bị. Kho dữ liệu mới lưu văn bản và URL mẫu trong trình duyệt; chưa lưu nội dung tệp hoặc kéo dữ liệu từ Drive. Chọn tệp trong dự án chỉ hiện tên tệp, không lưu tệp. Các nút và thông báo có nhãn “minh họa/mô phỏng” tại nơi cần thiết.

## 5. Kiểm tra kỹ thuật

```bash
npm run build
npm run lint
npm run test:e2e
```

`test:e2e` dùng Playwright Chromium, kiểm tra các luồng chính trên desktop 1440px và mobile 375px. Nếu Chromium chưa có trên máy, chạy `npx playwright install chromium`. Thư mục `qa/` chứa ảnh chụp các màn hình đại diện; `QA_REPORT.md` ghi kết quả nghiệm thu. `docs/BACKEND_CONTRACT.md` mô tả dữ liệu và API cần xây ở giai đoạn tiếp theo.

## 7. Kết nối backend thật (đang làm dở, chưa bật trong giao diện)

Thư mục `../visun-os-backend/` đã có schema Postgres + RLS + 3 lệnh máy chủ lõi, đã kiểm thử bằng Postgres nhúng
(xem `visun-os-backend/README.md`). Trong `src/data/` đã có `apiRepository.ts` gọi đúng các bảng/hàm đó, khớp kiểu
dữ liệu với `src/domain.ts`, nhưng **chưa được gắn vào `App.tsx`** — app vẫn chạy 100% ở chế độ demo như trước.
Sao chép `.env.example` (ở thư mục gốc `visun-os-frontend/`) thành `.env.local` khi đã có project Supabase thật;
để trống thì không có gì thay đổi. Lý do chưa nối và các bước còn lại nằm ở `src/data/README.md`.

## 6. Cấu trúc chính

- `src/domain.ts`: kiểu dữ liệu và trạng thái.
- `src/seed.ts`: dữ liệu giả có liên kết giữa các mục.
- `src/store.tsx`: kho demo và thao tác lưu trong trình duyệt.
- `src/forms.tsx`, `src/pages.tsx`, `src/pagesMore.tsx`: màn hình và form nền.
- `src/formsKnowledge.tsx`, `src/pagesKnowledge.tsx`: học/nghiên cứu, kho kiến thức, dữ liệu dự án.
- `src/pagesContent.tsx`: ý tưởng, bảng tiến độ, lịch đăng, chi tiết nội dung và kết quả tự nhập.
- `src/styles.css`: màu, chữ, layout và responsive theo VISUNAI.
- `tests/workflows.spec.ts`: kiểm tra trình duyệt tự động.

Mã nguồn dùng React, TypeScript, Vite, React Router và CSS thông thường. Logo tại `public/brand/visunai-logo.png` là bản sao của asset gốc để bản build chạy độc lập.
