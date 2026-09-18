# Báo cáo kiểm tra frontend VISUN OS

**Ngày kiểm tra:** 18/09/2026. **Môi trường:** macOS, Node.js v26.1.0, Chromium qua Playwright, trình duyệt tiếng Việt và múi giờ Asia/Ho_Chi_Minh.

## Kết quả

| Hạng mục | Kết quả |
|---|---|
| Build TypeScript và Vite | Đạt — `npm run build` kết thúc mã 0 |
| 15 luồng E2E trên desktop 1440px và mobile 375px | Đạt — 30/30 kiểm tra |
| 20 URL mở trực tiếp, kể cả URL chi tiết | Đạt — không có lỗi JavaScript trong trình duyệt |
| Responsive 20 URL × 375/768/1280/1440px | Đạt — 80/80 lượt không tràn ngang toàn trang |
| Bản build preview | Đạt — cả 20 URL trả HTTP 200; tệp tài liệu mẫu trả 200; không có lỗi trang |
| Brand | Đã đối chiếu trực quan: logo gốc trên nền trắng, thu đúng 2/3 còn 140px desktop và 116px mobile; xanh `#206DC1`, cam `#F97E03`, navy `#0A2540`, Montserrat cho tiêu đề, Inter cho nội dung; nhãn demo hiện ở desktop/mobile |
| Lint | Mã 0; 3 cảnh báo phát triển Fast Refresh do hook/kho demo xuất từ cùng file với component, không ảnh hưởng bản build |

## Luồng đã tự động kiểm tra

1. Mở tất cả trang, nhãn demo, logo thu 2/3 và không tràn ngang.
2. Nâng bộ demo phiên bản cũ mà giữ bản ghi đã sửa.
3. Tạo nghiên cứu, chỉnh tiến độ, lưu bài học liên kết vào kho kiến thức.
4. Gắn tài sản dữ liệu vào dự án, lọc, xuất JSON gồm đủ các nhóm và tìm lại.
5. Sửa tài liệu mẫu, xem ghi chú/việc trong dữ liệu một dự án và mở kho kiến thức qua menu mobile.
6. Ghi nhanh → tải lại → chuyển thành việc → kiểm tra nguồn.
7. Hoàn thành/mở lại việc quá hạn → số dashboard thay đổi đúng.
8. Việc chờ phản hồi bắt buộc có ngày hỏi lại.
9. Hồ sơ B2B An Phát có đúng liên hệ, cơ hội và cam kết.
10. Thêm người liên hệ và ghi chú vào đúng hồ sơ khách; tải lại vẫn còn.
11. Chuyển cơ hội sang Đã chốt → tạo dự án có liên kết ngược.
12. Gắn khách cho sự kiện lịch mẫu → mở hồ sơ.
13. Thêm mốc dự án; việc lặp chỉ sinh kỳ sau một lần.
14. Sửa, loại, chốt bản nháp AI demo; chốt lại không sinh trùng.
15. Tìm tiếng Việt không dấu, khôi phục dữ liệu mẫu.

## Ảnh chụp để duyệt giao diện

- `qa/dashboard-375.png`, `qa/dashboard-768.png`, `qa/dashboard-1280.png`, `qa/dashboard-1440.png`
- `qa/customer-375.png`, `qa/customer-1440.png`
- `qa/ai-375.png`, `qa/ai-1440.png`
- `qa/project-375.png`, `qa/project-1440.png`
- `qa/learning-375.png`, `qa/learning-1440.png`
- `qa/knowledge-375.png`, `qa/knowledge-1440.png`
- `qa/data-375.png`, `qa/data-1440.png`
- `qa/data-project-375.png`, `qa/data-project-1440.png`

## Giới hạn của bản thử

- Dữ liệu giả chỉ lưu ở trình duyệt hiện tại. Chưa có backend, tài khoản thật, phân quyền thật, sao lưu, chia sẻ nhiều thiết bị.
- Lịch và AI chỉ mô phỏng; email chỉ là bản xem trước, không gửi. Kho dữ liệu lưu văn bản và URL trong trình duyệt; tệp được chọn chỉ hiện tên, không tải lên server.
- Chưa thực hiện kiểm tra với người dùng thật, thiết bị thật ngoài Chromium hoặc đo hiệu năng production trên hosting. Những việc này thuộc vòng duyệt tiếp theo trước khi phát hành.

Không ghi nhận lỗi chức năng nghiêm trọng còn mở trong phạm vi frontend demo sau bộ kiểm tra trên.
