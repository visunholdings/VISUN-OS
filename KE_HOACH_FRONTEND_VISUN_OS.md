# KẾ HOẠCH TRIỂN KHAI FRONTEND TRƯỚC — VISUN OS CHO AI TRAINER

**Trạng thái:** Kế hoạch có thể giao cho người phát triển để dựng bản chạy thử. **Chưa thực hiện.**  
**Ngày lập:** 18/09/2026  
**Nguồn:** `PRD_Web_App_Quan_Ly_Cong_Viec_Khach_Hang.md`, `KE_HOACH_TONG_THE_WEBAPP_AI_TRAINER.md`, `VISUNAI-Brand-Guidelines.pdf`, `VISUNAI-Logo.png` và 5 ảnh app tham khảo.  
**Mục tiêu bàn giao của chặng frontend:** một webapp chạy trên máy cá nhân, mở được bằng trình duyệt, đầy đủ màn hình và các luồng thao tác chính bằng dữ liệu mẫu; chưa kết nối dữ liệu khách thật, Google Calendar, email hay AI API.

## 1. Kết quả mong muốn và ranh giới

### 1.1. “Frontend chạy được” nghĩa là gì

Người dùng có thể mở app trên máy tính và điện thoại, đi qua các màn hình, nhập/sửa/hoàn thành công việc, mở hồ sơ khách, chuyển giai đoạn cơ hội, xem dự án/lịch, tìm kiếm, xem bản nháp AI mô phỏng và bấm chốt để dữ liệu mẫu đổi đúng. Sau khi tải lại trang, dữ liệu demo vẫn còn trên **chính trình duyệt đó**. Có nút khôi phục bộ dữ liệu mẫu.

Các mục được lưu vào bộ nhớ trình duyệt chỉ phục vụ thử giao diện. App phải gắn nhãn dễ thấy **“Bản thử · dữ liệu minh họa”** ở thanh trên và ở những chức năng tích hợp đang mô phỏng. Không nhập dữ liệu khách hàng thật vào bản thử này.

### 1.2. Có trong chặng frontend

- Design system theo brand guideline và logo được cung cấp.
- Giao diện responsive cho desktop, tablet, điện thoại.
- Tất cả màn hình sản phẩm mục tiêu, dữ liệu mẫu có liên kết, trạng thái rỗng/đang tải/lỗi mô phỏng.
- Các thao tác tạo, sửa, hoàn thành, lọc, tìm và điều hướng hoạt động với dữ liệu demo trong trình duyệt.
- Lịch tuần dùng sự kiện mẫu; mô phỏng liên kết sự kiện với khách/dự án.
- Chat AI demo dùng kịch bản có sẵn, tạo bản nháp có thể sửa rồi chốt vào dữ liệu demo; nói rõ đây là mô phỏng.
- Màn hình cài đặt và quyền nhóm ở mức giao diện demo.
- Tài liệu chạy thử, dữ liệu mẫu, hướng dẫn đánh giá và bộ kiểm tra giao diện.

### 1.3. Chưa chạy thật trong chặng này

- Chưa có server, cơ sở dữ liệu dùng chung, đăng nhập thật hoặc phân quyền bảo mật thật.
- Chưa đọc/ghi Google Calendar, chưa gửi email, chưa gọi model AI.
- Chưa tải tệp lên kho lưu trữ; giao diện tài liệu dùng đường dẫn mẫu và có thể chọn tệp để xem tên, nhưng không tuyên bố đã lưu tệp.
- Chưa có đồng bộ giữa nhiều thiết bị hoặc nhiều người dùng. Không dùng `localStorage` demo làm dữ liệu vận hành.

**Lý do giữ ranh giới:** frontend có thể được kiểm tra toàn diện mà không phải xử lý quyền, dữ liệu khách và chi phí tích hợp trước khi anh Hùng chốt trải nghiệm.

## 2. Quyết định giao diện từ brand guideline

### 2.1. Bảng token bắt buộc

| Vai trò | Giá trị từ guideline | Cách dùng trên app |
|---|---|---|
| Xanh chính — Trust Blue | `#206DC1` | Nút chính, liên kết, tab đang chọn, chỉ báo điều hướng. |
| Cam chính — Sunrise Orange | `#F97E03` | Điểm nhấn, hành động cần chú ý, nét nhận diện; không tô cam cả vùng dữ liệu lớn. |
| Navy sâu | `#0A2540` | Tiêu đề lớn, thanh đầu trang nếu cần nền tối, vùng thương hiệu. |
| Xanh đậm | `#0E4C8F` | Hover/active của nút xanh. |
| Xanh nhạt | `#88B2DC` | Nền dịu, điểm phụ trợ. |
| Vàng nắng | `#FAA402` | Điểm nhấn phụ; gradient mặt trời `#FAA402 → #F97E03` chỉ cho biểu tượng/nhấn. |
| Mực | `#12233A` | Chữ nội dung. |
| Xám | `#5C6B7A` | Chữ phụ, metadata. |
| Khói | `#E2E6E8` | Viền, đường phân cách. |
| Giấy | `#F6F8FB` | Nền khối và vùng làm việc. |

**Tỷ lệ thị giác:** guideline gợi ý 60% trắng/giấy, 30% xanh, 10% cam. Đây là hướng cân bằng tổng thể; trên màn hình chứa nhiều dữ liệu, ưu tiên khả năng đọc và dùng cam có chủ đích. Trạng thái công việc luôn có nhãn chữ và/hoặc biểu tượng; không truyền ý nghĩa chỉ bằng màu.

**Chữ:** Montserrat cho tiêu đề (H1 800, H2 700, H3 600); Inter cho nội dung (400–600), caption 600. Cỡ chữ màn hình sẽ kiểm tra ở desktop/điện thoại; không ép body xuống đúng 10–11pt của tài liệu in nếu khó đọc. Dùng line-height quanh 1.6 cho đoạn văn, ngắn hơn ở nhãn/bảng khi cần.

**Hình khối:** nhiều khoảng trắng, card nền trắng trên nền Giấy, viền Khói mảnh; biểu tượng mặt trời, đường chân trời cong và ba gạch chéo được dùng tiết chế ở màn hình chào, trạng thái rỗng hoặc điểm nhấn. Không sao chép màu tím/xanh lá, gamification hay bố cục chật từ app tham khảo vào VISUN OS.

### 2.2. Kế hoạch dùng logo

`VISUNAI-Logo.png` là file PNG **RGB 1516 × 1038, có nền trắng gần trắng, không có kênh trong suốt**. Bản frontend dùng chính file này, giữ nguyên tỷ lệ và màu, đặt trên **vùng trắng** ở thanh điều hướng desktop và đầu trang mobile. Khi xuất hiện cùng tiêu đề “VISUN OS”, logo VISUNAI là nhận diện thương hiệu; “VISUN OS” chỉ là tên sản phẩm, không vẽ thành một logo mới.

- Đảm bảo **phần hình logo nhìn thấy** rộng tối thiểu 120px trên màn hình số; kiểm tra phần hình thực tế, không chỉ chiều rộng khung ảnh vì PNG có khoảng trắng lớn.
- Giữ vùng an toàn quanh phần hình tối thiểu tương đương chiều cao chữ “V” trong wordmark.
- Dùng `object-fit: contain`; không kéo giãn, đổi màu, đổ bóng, xoay, cắt vào phần hình hoặc đặt trên nền rối.
- Không đặt PNG hiện tại lên nền Navy/Xanh vì phần nền trắng của ảnh sẽ thành một hộp trắng.
- Guideline có phiên bản logo đảo màu và icon app, nhưng **chưa có file độc lập** trong thư mục. Vì vậy bản thử dùng giao diện sáng; favicon/icon app và logo trên nền tối là hạng mục cần asset được duyệt trước khi phát hành rộng.

### 2.3. Ngôn ngữ trên giao diện

- Nhãn chính bằng tiếng Việt ngắn, rõ việc: “Ghi nhanh”, “Cần hỏi lại”, “Cam kết chưa xong”, “Mở hồ sơ”, “Chốt và lưu”.
- Thông báo chỉ nói điều app thật sự đã làm. Ví dụ bản demo: “Đã lưu vào dữ liệu minh họa trên trình duyệt này”, không nói “Đã gửi email” hoặc “Đã đồng bộ Google”.
- AI mô phỏng luôn có nhãn “Bản mô phỏng” và chú thích khi không nhận diện được tên khách hoặc ngày.
- Tone bình tĩnh, thực chiến, không dùng khẩu hiệu AI phóng đại trong luồng làm việc.

## 3. Công nghệ và cách chạy khi được kích hoạt

### 3.1. Phương án đề xuất

- **Vite + React + TypeScript** để dựng webapp client, có script chạy local và build bản tĩnh. Vite hiện có template `react-ts` và lệnh `npm run dev` theo tài liệu chính thức: [Vite Getting Started](https://vite.dev/guide/).
- **React Router** để mỗi màn hình/hồ sơ có URL mở lại được, kể cả khi tải lại trang: [React Router Routing](https://reactrouter.com/start/declarative/routing).
- **CSS variables + CSS Modules** cho token và thành phần. Điều này giữ màu/font nhất quán, tránh hard-code rải rác; chưa cần thêm framework UI nặng.
- **Repository interface** tách giao diện khỏi nơi lưu dữ liệu. Bản demo dùng `localStorage`; khi làm backend, thay adapter mà không viết lại các màn hình.
- **Playwright** cho một số luồng kiểm tra qua trình duyệt desktop/mobile; kết hợp kiểm tra thủ công trực quan: [Playwright docs](https://playwright.dev/docs/writing-tests).

Không cần tài khoản cloud hoặc API key để chạy bản frontend demo. Chọn phiên bản package ổn định và khóa bằng lockfile khi bắt đầu triển khai; không ghi cứng số phiên bản ở bản kế hoạch này.

### 3.2. Lệnh dự kiến cho người triển khai — chưa thực hiện

```bash
# Yêu cầu Node.js tương thích với Vite tại thời điểm bắt đầu triển khai.
cd "/Users/hungtrinh/Desktop/VISUN OS"
npm create vite@latest visun-os-frontend -- --template react-ts
cd visun-os-frontend
npm install
npm install react-router
npm run dev

# Sau khi hoàn thiện:
npm run build
npm run preview
```

Theo tài liệu Vite đã kiểm tra ngày 18/09/2026, phiên bản hiện tại yêu cầu Node.js 20.19+ hoặc 22.12+; người triển khai phải kiểm tra lại yêu cầu này trước khi chạy. URL local do Vite in ra trong terminal, thường là `http://localhost:5173`. [Vite Getting Started](https://vite.dev/guide/).

### 3.3. Cấu trúc dự án dự kiến

```text
visun-os-frontend/
  public/brand/visunai-logo.png
  src/
    app/              # Router, shell, provider
    pages/            # Trang theo URL
    features/         # inbox, tasks, customers, opportunities, projects,
                      # calendar, ai, search, settings
    components/       # Button, Card, Badge, Drawer, FormField, EmptyState...
    design/           # tokens.css, typography.css, layout.css
    domain/           # TypeScript types, quy tắc ngày/trạng thái
    data/             # seed demo, repository interface, local adapter
    utils/            # format ngày, tìm kiếm, kiểm tra dữ liệu
  tests/              # Luồng trình duyệt quan trọng
  README.md           # Chạy, reset demo, giới hạn bản thử
```

`README.md` phải có ba việc dành cho anh Hùng: **mở app**, **thử luồng mẫu**, **khôi phục dữ liệu minh họa**. Người triển khai chịu trách nhiệm các lệnh kỹ thuật.

## 4. Sơ đồ trang và điều hướng

| URL dự kiến | Trang | Mục tiêu thử |
|---|---|---|
| `/` | Hôm nay | Xác định việc cần làm, quá hạn, chờ hỏi lại, khách cần liên hệ, lịch và mốc dự án. |
| `/inbox` | Hộp ghi nhanh | Nhập một câu, lưu ngay, chuyển thành việc/ghi chú/cơ hội. |
| `/tasks` và `/tasks/:id` | Công việc | Lọc, tạo/sửa, hoàn thành/mở lại, xem nguồn và người phụ trách. |
| `/customers` và `/customers/:id` | Khách hàng | Tách B2C/B2B, tìm, xem dòng thời gian và cam kết. |
| `/opportunities` và `/opportunities/:id` | Cơ hội | Xem pipeline riêng, chuyển giai đoạn, bước tiếp theo, tạo dự án demo. |
| `/projects` và `/projects/:id` | Dự án | Xem mốc, task, tài liệu và kết quả cần bàn giao. |
| `/calendar` | Lịch | Tuần/ngày, cuộc hẹn mẫu, mở hồ sơ liên quan. |
| `/ai` | AI demo | Hỏi theo kịch bản, xem bản nháp, sửa, chốt vào dữ liệu demo. |
| `/search` | Tìm kiếm chung | Tìm theo tên/nội dung và mở bản ghi gốc. |
| `/settings` | Thiết lập | Giờ nhắc, giao diện tài khoản/nhóm, trạng thái tích hợp demo, reset dữ liệu. |

**Desktop:** thanh điều hướng bên trái, thanh tìm kiếm trên cùng, vùng nội dung và panel chi tiết khi có đủ chỗ.  
**Mobile:** thanh dưới gồm Hôm nay, Việc, Khách, Lịch; nút Ghi nhanh nổi bật; menu mở thêm Cơ hội, Dự án, AI, Thiết lập.  
**Quy tắc điều hướng:** từ task/cam kết mở được ghi chú nguồn và hồ sơ khách; từ cuộc hẹn mở được hồ sơ đã liên kết; quay lại giữ bộ lọc trước đó.

## 5. Bộ dữ liệu mẫu và cơ chế thử

### 5.1. Dữ liệu khởi tạo

Tạo dữ liệu **giả hoàn toàn**, gần với nghiệp vụ AI Trainer nhưng không dùng tên/số điện thoại/email khách thật:

| Loại | Số lượng mục tiêu | Tình huống cần có |
|---|---:|---|
| Khách hàng | 10 | 5 B2C, 5 B2B; có một doanh nghiệp nhiều người liên hệ. |
| Cơ hội | 6–8 | Workshop, khóa 8 tuần, tư vấn 1-1, đào tạo in-house, AI Agent; các giai đoạn khác nhau. |
| Dự án | 5 | Một workshop sắp diễn ra, một tư vấn đang làm, một dự án trễ mốc, một nội bộ. |
| Task/cam kết | 30–40 | Hôm nay, quá hạn, chờ phản hồi, không có hạn, hoàn thành, một việc định kỳ. |
| Ghi chú/tương tác | 15–20 | Cuộc gọi sinh ra hai task, quyết định dự án, ý tưởng chưa phân loại. |
| Sự kiện lịch | 10–12 | Cuộc hẹn sắp tới, sự kiện cả ngày, một sự kiện hủy, một sự kiện liên kết khách. |
| Thành viên demo | 3 | Chủ sở hữu, cộng sự, người xem; chỉ mô phỏng giao diện quyền. |

Dữ liệu có ngày tương đối so với ngày mở app (`hôm nay`, `ngày mai`, `quá hạn 2 ngày`) để bản thử không “hết hạn” sau vài tuần. Một số mục có ngày cố định để thử định dạng và điều hướng lịch.

### 5.2. Lưu và reset

- `seedVersion` kiểm soát bộ demo. Lần đầu mở app nạp dữ liệu mẫu.
- Thao tác CRUD lưu vào `localStorage` trong trình duyệt đang dùng. Không lưu token/API key.
- `Khôi phục dữ liệu minh họa` phải có xác nhận vì sẽ xóa những thay đổi demo trong trình duyệt đó.
- Cho xuất một file JSON demo để người thử gửi feedback có bối cảnh, nhưng cảnh báo không dùng dữ liệu thật.
- Khi dữ liệu không hợp lệ hoặc schema demo đổi, app báo rõ và cho khôi phục; không hiện trang trắng.

## 6. Thiết kế thao tác từng trang

### 6.1. Hôm nay

**Bố cục:** lời chào ngắn, ngày, ô Ghi nhanh; các khối `Việc hôm nay`, `Quá hạn`, `Chờ hỏi lại`, `Khách cần liên hệ`, `Cuộc hẹn`, `Dự án cần chú ý`. Trên desktop có tóm tắt số lượng; trên mobile là danh sách ưu tiên. Bộ lọc B2C/B2B chỉ áp dụng ở vùng khách/cơ hội, không làm mất việc cá nhân.

**Thao tác:** bấm số lượng mở danh sách đã lọc; tick hoàn thành; mở task; chuyển ngày có lý do; mở khách/dự án. Dữ liệu dashboard tính từ bản ghi, không nhập số thủ công.

### 6.2. Hộp ghi nhanh

**Bố cục:** một ô nhập lớn, phím tắt gửi trên desktop, danh sách chưa xử lý trước. **Thao tác:** lưu một câu không yêu cầu thêm trường; mở chi tiết; chuyển thành task/ghi chú/cơ hội; bỏ qua có xác nhận; mở AI mô phỏng với nguyên văn đầu vào. Nội dung gốc vẫn còn và liên kết tới mục đã tạo.

### 6.3. Công việc và cam kết

**Bố cục:** tab Hôm nay, Tuần này, Quá hạn, Chờ phản hồi, Tất cả; thanh lọc khách/dự án/người. Card hoặc hàng danh sách hiện tiêu đề, trạng thái, hạn hoặc ngày hỏi lại, người phụ trách, nguồn. **Form:** trường tên việc, kết quả cần đạt, trạng thái, ưu tiên, hạn, ngày hỏi lại, thời gian xếp lịch, khách/cơ hội/dự án, người được hứa và ghi chú nguồn.

**Thao tác:** tạo, sửa, hoàn thành, mở lại, đổi trạng thái, gắn bối cảnh. Khi chuyển `Chờ phản hồi`, form hiện ngày hỏi lại. Việc lặp lại có UI chọn tần suất, hiển thị các lần đã phát sinh; bản demo sinh lần tiếp theo theo quy tắc giới hạn, không tạo vô hạn.

### 6.4. Khách hàng

**Danh sách:** tab Cá nhân/Doanh nghiệp; lọc cần liên hệ, có cơ hội đang mở, có cam kết quá hạn. **Hồ sơ:** thông tin chính, các người liên hệ (B2B), nhu cầu, bước tiếp theo, cam kết còn mở, cơ hội, dự án, dòng thời gian. **Thao tác:** tạo/sửa, thêm ghi chú, tạo cơ hội, tạo task, đổi ngày liên hệ. Khi tạo tên/email/số điện thoại gần trùng, demo hiện cảnh báo để người dùng quyết định.

### 6.5. Cơ hội

**Bố cục:** hai pipeline riêng B2C/B2B, có chế độ danh sách dễ dùng trên mobile. Mỗi thẻ có khách, sản phẩm/dịch vụ, giai đoạn, bước tiếp theo và ngày. **Thao tác:** tạo/sửa, đổi giai đoạn, ghi lý do tạm dừng/thua, tạo dự án từ cơ hội đã chốt. Giá trị dự kiến không tự điền nếu chưa có dữ liệu.

### 6.6. Dự án

**Bố cục:** tên, loại, khách/cơ hội nguồn, trạng thái, mục tiêu, mốc tiếp theo; tab Việc, Mốc, Ghi chú, Tài liệu. **Thao tác:** cập nhật mốc, tạo task từ dự án, mở tài liệu mẫu, thêm liên kết. Tiến độ hiển thị từ số mốc/việc có trạng thái rõ, có chú thích cách tính.

### 6.7. Lịch

**Bố cục:** lịch tuần tương tự ý tưởng ảnh mẫu, có chuyển ngày/tuần; trên mobile chuyển thành lịch ngày + danh sách. Sự kiện và khối thời gian task có hình thức khác nhau. **Thao tác:** mở cuộc hẹn mẫu, gắn khách/cơ hội/dự án, đi tới hồ sơ; thay đổi liên kết chỉ cập nhật demo, không cập nhật Google Calendar. Nhãn `Lịch minh họa · chưa kết nối Google` luôn xuất hiện.

### 6.8. AI demo

**Bố cục:** chat bên phải hoặc toàn màn hình mobile; bên cạnh/bên dưới là `Bản nháp thay đổi`. Có 3–5 câu gợi ý để thử: tóm tắt khách, việc quá hạn, biến ghi chú thành task, chuẩn bị trước cuộc hẹn, cập nhật dự án. **Thao tác:** chọn kịch bản, tạo đề xuất từ dữ liệu demo, sửa trường, bỏ từng đề xuất, chốt/lưu một lần và mở mục đã tạo.

Đầu vào ngoài kịch bản không được giả vờ đã hiểu bằng AI. App báo `Bản demo chỉ hỗ trợ các tình huống mẫu` và cho chọn một kịch bản. Tất cả câu trả lời về dữ liệu demo có liên kết nguồn; nếu không có nguồn thì nói không tìm thấy.

### 6.9. Tìm kiếm và thiết lập

**Tìm kiếm:** gõ tên khách, dự án, cơ hội, từ trong task/ghi chú; hiển thị loại mục, tiêu đề, ngày, nơi liên quan. Kiểm thử tiếng Việt có và không dấu. **Thiết lập:** xem trước email nhắc việc (không gửi), chọn giờ nhận giả lập, trạng thái `Google chưa kết nối`, `AI đang mô phỏng`, quản lý thành viên demo, xuất/reset dữ liệu.

## 7. Thành phần giao diện phải có trước khi dựng trang

1. Token màu, chữ, kích cỡ, khoảng cách, bo góc và bóng theo brand.
2. App shell: thanh điều hướng desktop/mobile, logo, tìm kiếm, nhãn demo.
3. Button, IconButton, Link, Input, Select, DatePicker, Modal/Drawer, Toast/Alert.
4. Card, EmptyState, Skeleton, ErrorState, StatusBadge, PriorityBadge.
5. TaskRow, CustomerHeader, TimelineItem, OpportunityCard, ProjectMilestone, CalendarEvent, AIProposalCard.
6. Form validation: trường bắt buộc, ngày không hợp lý, tên trùng, thông báo lưu thành công/thất bại.

Mỗi thành phần cần trạng thái thường, hover, focus, disabled, lỗi và thao tác bàn phím. Không sử dụng icon lạ làm thay logo hoặc biểu tượng thương hiệu.

## 8. Hợp đồng dữ liệu để không phải làm lại frontend khi nối backend

### 8.1. Kiểu dữ liệu chủ chốt

`Customer`, `Contact`, `Opportunity`, `Project`, `Milestone`, `Task`, `InboxItem`, `Interaction`, `Note`, `DocumentLink`, `CalendarEventLink`, `AIProposal`, `User` và `AuditPreview` phải được khai báo riêng. Mỗi mục có ID ổn định, thời điểm tạo/cập nhật, người tạo và liên kết ID; không dùng tên khách làm khóa liên kết.

**Task:** tách `dueAt`, `reviewAt`, `scheduledStart/End`; `sourceNoteId`; `customerId/opportunityId/projectId`; `assigneeId`; `promisedTo` khi là cam kết. **Cơ hội:** tách `customerType`, `stage`, `nextAction`, `nextActionAt`. **AIProposal:** danh sách hành động `create/update`, loại bản ghi, trường trước/sau, nguồn, lỗi cần người dùng sửa.

### 8.2. Repository interface

Màn hình gọi `repository` thay vì truy cập thẳng `localStorage`. Các thao tác cần có: `list`, `get`, `create`, `update`, `archive`, `search`, `resetDemo`, `exportDemo`; dashboard dùng hàm tính từ dữ liệu. Bản demo cung cấp `LocalDemoRepository`. Khi backend được triển khai, tạo `ApiRepository` cùng hợp đồng và thay ở điểm cấu hình.

**Đặc biệt:** thao tác `Chốt và lưu` của AI demo nhận một `proposalId`/`operationId`, lưu các mục có liên kết và từ chối chốt trùng. Đây là bản mô phỏng quy tắc idempotency; backend vẫn phải tự kiểm tra lại khi nối thật.

## 9. Trình tự triển khai khi anh Hùng cho phép

**Ước lượng tham chiếu:** 5–8 tuần với một frontend developer có kinh nghiệm và hỗ trợ thiết kế/QA bán thời gian. Thời lượng cần ước lại sau khi chốt mức độ chi tiết từng màn hình. Các chặng là công việc **tương lai**, chưa bắt đầu.

| Chặng | Thời lượng | Việc cụ thể | Bàn giao để duyệt |
|---|---:|---|---|
| FE0 — Khóa phạm vi thử | 2–3 ngày | Chốt tên app, 10 URL, danh sách thao tác thật/mô phỏng, bộ dữ liệu mẫu và các quyết định còn mở | Checklist phạm vi frontend và tình huống thử. |
| FE1 — Brand & shell | 4–6 ngày | Dựng dự án, import logo, token, font, component nền, điều hướng responsive, trang demo style | Xem desktop/mobile; kiểm tra đúng màu/font/logo. |
| FE2 — Dữ liệu và luồng lõi | 8–12 ngày | Repository demo, seed, dashboard, inbox, task, khách, cơ hội, dự án, ghi chú, tìm kiếm | Chạy L1–L4 hoàn toàn bằng dữ liệu demo; reload vẫn còn dữ liệu. |
| FE3 — Lịch, AI và thiết lập | 6–9 ngày | Lịch tuần/ngày, sự kiện mẫu, AI proposal demo, email preview, cài đặt/nhóm mô phỏng | Chạy L5–L6 và kịch bản AI có duyệt; không có nút chết. |
| FE4 — Hoàn thiện & QA | 5–8 ngày | Sửa responsive, trạng thái rỗng/lỗi, bàn phím, kiểm tra luồng chính, build, README, hướng dẫn dùng thử | Bản build chạy được và báo cáo nghiệm thu frontend. |

### 9.1. Điểm kiểm tra sau từng chặng

- **FE1:** anh Hùng duyệt cảm giác thương hiệu trên 3 màn hình đại diện: Hôm nay, hồ sơ khách, AI. Nếu chưa đúng brand, sửa trước khi nhân rộng.
- **FE2:** anh Hùng thử một ngày làm việc: ghi nhanh → task → khách/cơ hội → dự án → dashboard.
- **FE3:** anh Hùng thử trước và sau cuộc gặp: lịch → hồ sơ → ghi chú → bản nháp AI → chốt vào demo.
- **FE4:** chỉ bàn giao khi build thành công, mở lại URL trực tiếp hoạt động và bộ tình huống nghiệm thu đạt.

## 10. Bộ tình huống nghiệm thu frontend

### 10.1. Luồng chức năng

1. Mở app lần đầu: nhìn thấy nhãn bản thử, logo rõ, dữ liệu mẫu đã có; nhấp mọi menu tới đúng trang.
2. Ghi “Gửi đề cương cho Công ty An Phát thứ Sáu” vào Hộp ghi nhanh; tải lại trang vẫn còn; chuyển thành task; mở được bản ghi nguồn.
3. Hoàn thành một task quá hạn; số việc quá hạn trên dashboard giảm đúng; mở lại task thì số tăng đúng.
4. Chuyển task sang `Chờ phản hồi`, đặt ngày hỏi lại; task xuất hiện ở danh sách đúng ngày.
5. Mở khách B2B có hai người liên hệ và hai cơ hội; lịch sử và cam kết không bị trộn với khách khác.
6. Chuyển cơ hội sang `Đã chốt`, tạo dự án; dự án trỏ ngược về cơ hội và khách.
7. Mở cuộc hẹn mẫu trên lịch, gắn với khách; bấm mở hồ sơ từ sự kiện; nhãn lịch minh họa vẫn rõ.
8. Dùng một kịch bản AI mẫu; bản nháp có thể sửa/loại bỏ; chốt một lần; bấm lại không tạo bản ghi trùng.
9. Tìm một ghi chú bằng từ khóa tiếng Việt có dấu/không dấu; kết quả mở đúng mục nguồn.
10. Reset dữ liệu demo; xác nhận; dữ liệu mẫu trở về trạng thái đầu.

### 10.2. Brand, thiết bị và chất lượng

- Kiểm tra tại các chiều rộng tham chiếu: 375px, 768px, 1280px và 1440px; không tràn ngang hoặc che nút hành động.
- Logo hiển thị đúng tỷ lệ/màu, trên nền trắng, đủ kích thước và vùng trống; kiểm tra riêng mobile header.
- Màu chính, font, tiêu đề, CTA, trạng thái rỗng và modal đúng token đã chốt; mọi trạng thái quan trọng có nhãn chữ.
- Điều hướng bàn phím: thấy focus, mở/đóng modal, lưu/hủy form; các nút có tên dễ hiểu cho trình đọc màn hình.
- Dữ liệu demo được đánh dấu ở dashboard, lịch, AI và thiết lập; không có thông báo giả rằng email/Google/AI đã chạy thật.
- Tải lại từng URL chi tiết không ra trang trắng; refresh khi đang ở hồ sơ vẫn mở đúng hồ sơ.
- `npm run build` thành công; không có lỗi nghiêm trọng trong console; bộ kiểm tra luồng chính qua trình duyệt đạt.

## 11. Bàn giao cuối chặng frontend

1. Thư mục `visun-os-frontend/` có mã nguồn, lockfile, logo được sao chép từ asset gốc và dữ liệu mẫu.
2. Bản chạy local cùng lệnh `npm install`, `npm run dev`, `npm run build`, `npm run preview` đã được kiểm tra khi triển khai.
3. `README.md` tiếng Việt: mở app, 10 tình huống nên thử, reset demo, giới hạn dữ liệu trong trình duyệt.
4. Danh sách màn hình và ảnh chụp desktop/mobile để duyệt brand.
5. Báo cáo kiểm tra: chức năng, responsive, logo, font, lỗi còn lại, tính năng đang mô phỏng.
6. Bản hợp đồng dữ liệu và danh sách API backend cần xây ở chặng sau; không giấu logic nghiệp vụ trong component giao diện.

## 12. Các quyết định cần anh Hùng chốt trước khi dựng

1. Tên hiển thị sản phẩm: dùng **VISUN OS** hay tên khác dưới thương hiệu VISUNAI? Kế hoạch tạm dùng VISUN OS.
2. App demo chỉ chứa nghiệp vụ **AI Trainer**, hay thêm nhiệm vụ điều hành Nutrihealth/Visun Group? Kế hoạch tạm chỉ AI Trainer.
3. Pipeline B2C/B2B trong bản thử có dùng chuỗi trạng thái đề xuất ở kế hoạch tổng thể, hay anh có chuỗi đang dùng thực tế? Nếu chưa chốt, dữ liệu demo dùng trạng thái tạm và đánh dấu có thể cấu hình.
4. Có file logo đảo màu/icon app chất lượng gốc không? Nếu chưa có, bản thử dùng logo full color trên nền trắng và chưa làm dark mode/favicon mang nhận diện.
5. Người xem bản thử có cần mở từ máy khác qua một URL riêng không? Kế hoạch mặc định chỉ chạy local; việc chia sẻ URL là một bước riêng sau khi anh duyệt bản local.

**Điểm dừng hiện tại:** tài liệu này chỉ là kế hoạch. Chưa tạo thư mục `visun-os-frontend`, chưa cài package, chưa dựng giao diện, chưa chạy server, chưa kết nối dịch vụ và chưa triển khai lên internet.
