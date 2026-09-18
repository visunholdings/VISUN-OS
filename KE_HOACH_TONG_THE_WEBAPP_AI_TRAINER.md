# KẾ HOẠCH TỔNG THỂ — WEBAPP ĐIỀU HÀNH CÔNG VIỆC AI TRAINER

**Trạng thái:** Bản kế hoạch để anh Hùng xem và chốt phạm vi. Chưa triển khai sản phẩm.  
**Ngày lập:** 18/09/2026  
**Nguồn đầu vào:** `PRD_Web_App_Quan_Ly_Cong_Viec_Khach_Hang.md` và 5 ảnh giao diện tham khảo trong cùng thư mục.  
**Đối tượng sử dụng đầu tiên:** anh Hùng; thiết kế dữ liệu để mở rộng cho nhóm nhỏ.  
**Phạm vi kinh doanh mặc định:** hoạt động AI Trainer. Dữ liệu Nutrihealth và Visun Group chỉ đưa vào nếu anh Hùng quyết định mở rộng.

## 1. Quyết định sản phẩm

Xây một webapp dùng tốt trên điện thoại, giúp anh Hùng quản lý **việc cần làm, cam kết với khách hàng, cơ hội hợp tác, dự án triển khai và bối cảnh tạo ra từng việc**. Màn hình mở app phải trả lời được: hôm nay cần xử lý gì, việc gì đang quá hạn, ai đang chờ phản hồi, cuộc hẹn nào sắp diễn ra và dự án nào có mốc gần tới.

AI đóng vai trò trợ lý đọc dữ liệu và chuẩn bị **bản nháp thay đổi**. Quyết định ghi dữ liệu thuộc về người dùng. App vẫn vận hành đầy đủ các luồng thủ công khi dịch vụ AI không sẵn sàng.

### 1.1. Nguyên tắc thiết kế

1. **Hành động trước biểu đồ.** Dashboard ưu tiên danh sách cần xử lý; số liệu chỉ giúp tìm việc.
2. **Ghi nhanh trước, phân loại sau.** Không bắt người dùng điền một biểu mẫu dài sau cuộc gọi.
3. **Mọi việc có bối cảnh.** Task/cam kết mở được khách hàng, cơ hội, dự án hoặc ghi chú nguồn.
4. **B2C và B2B tách luồng.** Dùng chung dữ liệu nền nhưng có pipeline, bộ lọc và cách báo cáo riêng.
5. **Cuộc hẹn, hạn việc và ngày hỏi lại là ba khái niệm khác nhau.** Không đồng nhất mọi ngày tháng vào một trường.
6. **Một nguồn dữ liệu chính.** Google Calendar cung cấp cuộc hẹn; app là nơi quản lý task và cam kết.
7. **Không đo thứ chưa đáng tin.** Tránh xếp hạng, thống kê giờ làm hoặc tỷ lệ hoàn thành khi chưa có quy ước nhập dữ liệu ổn định.

### 1.2. Kết quả sử dụng cần đạt

- Sau cuộc gọi, anh Hùng lưu ý chính và các cam kết ngay trên điện thoại.
- Mỗi sáng, anh nhìn một màn hình và biết các việc cần xử lý hoặc cần hỏi lại.
- Trước cuộc gặp, anh mở hồ sơ và thấy lần trao đổi trước, đề xuất đang mở, lời đã hứa và tài liệu liên quan.
- Khi giao việc cho nhóm, người nhận thấy rõ kết quả cần bàn giao, hạn và bối cảnh.
- Có thể xuất dữ liệu, khôi phục dữ liệu theo quy trình đã kiểm tra, và truy ra ai đã thay đổi mục nào.

## 2. Phạm vi của bản đầy đủ

### 2.1. Có trong sản phẩm mục tiêu

| Nhóm | Phạm vi |
|---|---|
| Công việc cá nhân | Hộp ghi nhanh, task, cam kết, ưu tiên, ngày hạn, ngày hỏi lại, việc định kỳ, lịch tuần, tìm kiếm. |
| Khách hàng | Liên hệ cá nhân và doanh nghiệp, nhu cầu, tương tác, lịch sử, tài liệu, người liên hệ, lần liên hệ tiếp. |
| Kinh doanh AI Trainer | Cơ hội hợp tác, pipeline B2C/B2B, đề xuất, bước tiếp theo, lý do thắng/thua/tạm dừng. |
| Triển khai | Dự án workshop, khóa học, tư vấn, AI Agent và việc nội bộ; mốc, task, ghi chú, tài liệu. |
| Nhắc việc | Thông báo trong app và email tổng hợp hằng ngày theo giờ cài đặt. |
| Google Calendar | Kết nối và đọc cuộc hẹn; gắn sự kiện với khách/cơ hội/dự án; xem lịch tuần. |
| AI | Hỏi đáp có dẫn nguồn nội bộ; tóm tắt hồ sơ; chuyển ghi chú thành bản nháp cập nhật; xem, sửa, chốt và lưu. |
| Nhóm nhỏ | Tài khoản, phân quyền, người phụ trách, giao việc, nhật ký thay đổi và bộ lọc theo người. |
| Vận hành | Nhập/xuất dữ liệu, sao lưu, theo dõi lỗi, quản lý kết nối và thiết lập cá nhân. |

### 2.2. Chưa đưa vào phạm vi mục tiêu hiện tại

- Kế toán, hóa đơn, thanh toán học phí, LMS hoặc chấm bài học viên.
- Tự động gửi email/tin nhắn cho khách hàng từ nội dung do AI tạo.
- Đồng bộ hai chiều với Google Calendar trong lần phát hành đầu; sẽ đánh giá sau khi luồng đọc lịch ổn định.
- Kết nối trực tiếp ChatGPT/Claude bên ngoài qua MCP khi chưa xác định rõ quyền truy cập và hành động được phép.
- Bảng xếp hạng cá nhân hoặc chấm điểm năng suất kiểu ảnh tham khảo.

Các mục trên là **ranh giới sản phẩm**, không phải cam kết không bao giờ làm.

## 3. Người dùng và quyền

| Vai trò | Nhu cầu | Quyền dự kiến |
|---|---|---|
| Chủ sở hữu — anh Hùng | Nhìn toàn bộ công việc, khách, cơ hội, dự án và thay đổi | Quản trị toàn bộ không gian AI Trainer, phê duyệt AI, thiết lập tích hợp, xuất dữ liệu. |
| Cộng sự/điều phối | Nhận và cập nhật việc, chuẩn bị đào tạo, theo dõi dự án | Xem các mục được chia sẻ hoặc giao; cập nhật task và ghi chú trong phạm vi được cấp. |
| Người xem | Theo dõi tiến độ một dự án hoặc báo cáo | Chỉ đọc những mục được chia sẻ. |

Bản chạy cá nhân dùng một tài khoản. Mô hình quyền và trường `owner_id`, `assignee_id`, `workspace_id` phải có ngay trong thiết kế dữ liệu để mở nhóm mà không phải viết lại cấu trúc.

## 4. Luồng công việc chính

### L1 — Ghi nhanh sau cuộc gọi

Anh nhập: “Công ty A cần workshop cho quản lý. Thứ Sáu gửi đề cương. Tuần sau hỏi lịch khảo sát.” Nội dung lưu ngay vào Hộp ghi nhanh. Sau đó anh tự phân loại hoặc mở AI để nhận bản nháp: một ghi chú trao đổi, một cơ hội mới/nối cơ hội cũ và hai task. Anh sửa khách hàng, ngày cụ thể, người phụ trách rồi bấm **Chốt và lưu**. Mỗi mục có liên kết về ghi chú nguồn.

### L2 — Điều hành buổi sáng

Dashboard hiển thị việc hôm nay, quá hạn, chờ phản hồi đến ngày hỏi lại, khách cần liên hệ, cuộc hẹn sắp tới và mốc dự án. Anh mở từng mục, xử lý, dời ngày có lý do hoặc hoàn thành. Mục quá hạn chưa xong vẫn nằm ở danh sách quá hạn.

### L3 — Chuẩn bị gặp khách

Từ lịch hoặc tìm kiếm, anh mở hồ sơ. Đầu hồ sơ có tóm tắt hiện trạng, người liên hệ, nhu cầu, cơ hội đang mở, cam kết chưa xong, lần trao đổi gần nhất và tài liệu cần xem. Bên dưới là dòng thời gian có thể mở từng nguồn.

### L4 — Chốt cơ hội và triển khai

Khi cơ hội được chốt, anh tạo dự án từ cơ hội: mục tiêu, phạm vi, các mốc và checklist mẫu. Lịch sử trao đổi vẫn nằm ở khách/cơ hội; dự án quản lý việc bàn giao. Một khách có thể có nhiều cơ hội và nhiều dự án.

### L5 — Giao việc cho nhóm

Anh giao task kèm kết quả mong đợi, hạn, ưu tiên và bối cảnh. Người nhận cập nhật trạng thái, để lại ghi chú hoặc báo vướng mắc. Người giao nhìn được việc chờ phản hồi mà không phải lục lại chat.

### L6 — Truy cứu cam kết cũ

Anh tìm bằng tên khách hoặc từ khóa trong ghi chú. Kết quả chỉ rõ loại mục, ngày, khách/cơ hội/dự án liên quan và mở về bản ghi gốc. AI trả lời kèm liên kết nguồn nếu được hỏi bằng ngôn ngữ tự nhiên.

## 5. Cấu trúc màn hình

| Màn hình | Thành phần chính | Hành động chính |
|---|---|---|
| Hôm nay | 5 nhóm cần xử lý, lịch hẹn, dự án cần chú ý, số mục Hộp ghi nhanh | Mở việc, hoàn thành, dời ngày, ghi nhanh. |
| Hộp ghi nhanh | Danh sách chưa xử lý và đã xử lý | Nhập nhanh, chuyển thành task/ghi chú/cơ hội, dùng AI phân loại. |
| Công việc | Danh sách, bộ lọc, chế độ theo ngày/khách/dự án/người | Tạo, sửa, giao, hoàn thành, mở lại, đặt ngày hỏi lại. |
| Khách hàng | B2C/B2B, tìm kiếm, hồ sơ và dòng thời gian | Liên hệ tiếp, ghi chú, tạo cơ hội, xem cam kết. |
| Cơ hội | Pipeline B2C/B2B, giá trị dự kiến nếu có, bước tiếp theo | Di chuyển giai đoạn, ghi lý do, tạo dự án khi chốt. |
| Dự án | Danh sách, mốc, việc mở, tài liệu, quyết định | Cập nhật mốc, giao việc, xem tiến độ. |
| Lịch | Tuần/ngày, sự kiện Google và khối thời gian làm việc | Mở sự kiện, liên kết hồ sơ, đặt thời gian xử lý task trong app. |
| AI | Chat gắn với ngữ cảnh màn hình, bản nháp thay đổi | Hỏi, kiểm tra nguồn, sửa bản nháp, chốt/lưu. |
| Tìm kiếm | Kết quả liên mục, lọc theo loại và ngày | Mở bản ghi nguồn. |
| Thiết lập | Tài khoản, giờ nhắc, múi giờ, tích hợp, xuất dữ liệu, nhóm | Cấu hình và kiểm tra kết nối. |

**Điện thoại:** thanh điều hướng ngắn cho Hôm nay, Công việc, Khách hàng, Lịch; nút Ghi nhanh luôn dễ chạm. Các mục còn lại nằm trong menu. Form mở theo từng bước ngắn, tự lưu bản nháp khi phù hợp.  
**Máy tính:** cột điều hướng, vùng danh sách và vùng chi tiết; mở hồ sơ mà vẫn giữ bộ lọc hiện tại.

## 6. Yêu cầu chức năng và quy tắc nghiệp vụ

### F01 — Hộp ghi nhanh

- Lưu văn bản ngay cả khi chưa có ngày hoặc khách liên quan.
- Ghi thời gian tạo, người tạo, trạng thái `chưa xử lý/đã xử lý`, liên kết các mục được tạo từ đó.
- Không xóa nội dung gốc khi chuyển thành task hoặc ghi chú.
- Dashboard hiển thị số mục chưa xử lý; có bộ lọc các mục cũ chưa phân loại.
- **Nghiệm thu:** nhập trên điện thoại, tải lại trang và tìm thấy nội dung; sau khi xử lý, mở được task/ghi chú đã sinh ra.

### F02 — Task và cam kết

- Trường chính: tên việc, mô tả/kết quả cần đạt, trạng thái, ưu tiên, người phụ trách, hạn hoàn thành, ngày cần xem lại/hỏi lại, thời gian dự kiến trên lịch nếu có, khách/cơ hội/dự án liên quan, ghi chú nguồn.
- Trạng thái: `Cần làm`, `Đang làm`, `Chờ phản hồi`, `Hoàn thành`, `Hủy`. Khi chuyển sang `Chờ phản hồi`, yêu cầu ngày hỏi lại hoặc ghi rõ lý do chưa thể đặt ngày.
- Một cam kết với khách là task có thêm `người được hứa/đơn vị`, `nội dung đã hứa` và liên kết tới tương tác nguồn.
- Việc lặp lại có quy tắc riêng; mỗi lần phát sinh là một bản ghi độc lập để lịch sử không bị ghi đè. Không tự tạo vô hạn các lần trong tương lai.
- Việc đã hoàn thành không còn ở danh sách quá hạn. Việc chưa hoàn thành mà quá hạn tiếp tục hiện cho đến khi xử lý.
- **Nghiệm thu:** thay đổi hạn hoặc hoàn thành phản ánh ngay ở dashboard; việc lặp lại không sinh trùng; có thể truy về nguồn.

### F03 — Dashboard và nhắc việc

- Thứ tự ưu tiên: hôm nay → quá hạn → chờ phản hồi đến ngày → khách cần liên hệ → mốc dự án → lịch sắp tới.
- Mỗi nhóm mở đúng danh sách đã lọc. Cho phép ẩn việc đã xong và xem lại khi cần.
- Email tổng hợp chạy theo giờ và múi giờ người dùng chọn; một bản cho một ngày, không gửi trùng khi tác vụ nền chạy lại. Có trạng thái gửi/thất bại để kiểm tra.
- **Nghiệm thu:** đối chiếu dashboard và email với bộ dữ liệu thử; không bỏ sót việc quá hạn, không gửi hai email cho cùng ngày.

### F04 — Khách hàng và tương tác

- Khách B2C: cá nhân, kênh liên hệ, vai trò, nhu cầu, quan tâm sản phẩm nào, lần trao đổi và lần cần liên hệ tiếp.
- Khách B2B: doanh nghiệp, ngành/quy mô nếu có, nhiều người liên hệ, vai trò từng người, nhu cầu, quá trình làm việc.
- Dòng thời gian thống nhất: ghi chú, cuộc gọi/cuộc họp, cuộc hẹn lịch, task, cam kết, cơ hội và dự án. Có đánh dấu thông tin chỉ biết từ lời kể, chưa được xác nhận.
- Phát hiện tên/số điện thoại/email có thể trùng trước khi tạo khách mới; người dùng quyết định gộp.
- **Nghiệm thu:** trước cuộc gọi, từ một hồ sơ thấy được lịch sử, lời hứa chưa xong và bước tiếp theo.

### F05 — Cơ hội hợp tác

- Một khách có thể có nhiều cơ hội. Mỗi cơ hội lưu: loại B2C/B2B, sản phẩm/dịch vụ, nhu cầu, giai đoạn, bước tiếp theo, ngày bước tiếp theo, người phụ trách, mức độ chắc chắn theo đánh giá thủ công, giá trị dự kiến nếu đã có căn cứ, lý do thắng/thua/tạm dừng.
- Pipeline ban đầu là cấu hình để anh Hùng chốt sau khảo sát; không ép B2C và B2B vào một chuỗi trạng thái.
- Khi chuyển sang `Đã chốt`, có hành động tạo dự án liên kết; không tự coi mọi cơ hội chốt là dự án giống nhau.
- **Nghiệm thu:** phân biệt được cơ hội đang trao đổi với dự án đã triển khai; lọc được cơ hội B2B cần theo dõi tuần này.

### F06 — Dự án và mốc triển khai

- Loại: workshop, khóa học, tư vấn 1-1, đào tạo in-house, AI Agent/workflow, việc nội bộ.
- Trường: mục tiêu, phạm vi, trạng thái, người phụ trách, khách/cơ hội nguồn, ngày bắt đầu/kết thúc dự kiến, mốc tiếp theo, tài liệu, quyết định và task.
- Mốc có ngày, người phụ trách, trạng thái, đầu ra cần bàn giao. Có thể dùng checklist mẫu theo loại dự án nhưng người dùng được sửa trước khi áp dụng.
- Tiến độ ban đầu tính từ mốc và task đã hoàn thành; không dùng phần trăm chủ quan khi thiếu quy tắc.
- **Nghiệm thu:** mở dự án thấy mốc tiếp theo, việc mở, người phụ trách và tài liệu liên quan.

### F07 — Ghi chú, tài liệu và tìm kiếm

- Ghi chú phân loại cuộc gọi, họp, ý tưởng, quyết định, cập nhật dự án. Cho phép gắn khách/cơ hội/dự án và tạo task từ đoạn ghi chú.
- Tài liệu có thể là đường dẫn hoặc tệp. Lưu tên, loại, người tải lên, ngày và nơi liên kết; phân quyền giống hồ sơ chứa tài liệu.
- Tìm kiếm theo tên và nội dung task/ghi chú; kết quả chỉ rõ hồ sơ gốc. Tìm tiếng Việt có dấu và không dấu là mục tiêu cần kiểm thử trên dữ liệu thật.
- **Nghiệm thu:** tìm lại một cam kết bằng từ khóa và mở tới ghi chú ban đầu.

### F08 — AI trong app

- **Đọc:** hỏi việc quá hạn, tóm tắt hồ sơ khách, tình trạng cơ hội/dự án. Câu trả lời chỉ dùng dữ liệu người hỏi có quyền xem và dẫn liên kết nguồn.
- **Đề xuất ghi:** từ chat/ghi chú tạo danh sách thay đổi có cấu trúc: tạo/sửa khách, cơ hội, task, ghi chú, ngày hỏi lại hoặc cập nhật dự án. Giao diện hiển thị từng mục và các trường sẽ đổi.
- Người dùng được sửa hoặc bỏ từng đề xuất, rồi bấm `Chốt và lưu`. Hệ thống kiểm tra quyền, trường bắt buộc, ngày, đối tượng liên kết và bản ghi có thể trùng trước khi ghi.
- Một lượt chốt có mã giao dịch để bấm lại hoặc tải lại trang không tạo trùng. Kết quả báo mục thành công/thất bại và cho mở từng mục. Lịch sử lưu ai duyệt, nội dung trước/sau và nguồn đề xuất.
- AI không tự đoán khách hàng khi có nhiều hồ sơ giống tên, không tự suy ra ngày mơ hồ, không tự gửi thông tin cho khách. Nếu thiếu dữ liệu, để trống và yêu cầu người dùng chọn.
- **Nghiệm thu:** bộ tình huống có tên trùng, ngày mơ hồ, AI lỗi, bấm lưu hai lần và thiếu quyền đều cho kết quả đúng; thao tác thủ công vẫn dùng được khi AI lỗi.

### F09 — Google Calendar

- Kết nối Google qua OAuth; chỉ xin quyền đọc sự kiện cần thiết. Cho chọn lịch nào hiển thị.
- Hiển thị cuộc hẹn sắp tới và lịch tuần; gắn sự kiện với khách/cơ hội/dự án bằng liên kết trong app. Không biến mọi cuộc hẹn thành task.
- Lưu ID sự kiện và lịch nguồn để đồng bộ cập nhật/hủy mà không nhân bản. Thể hiện trạng thái kết nối và lần đồng bộ gần nhất.
- **Nghiệm thu:** thêm/sửa/hủy cuộc hẹn trên Google phản ánh trong app theo chính sách đồng bộ đã chốt; liên kết hồ sơ không mất khi dữ liệu lịch được làm mới.

### F10 — Nhóm và phân quyền

- Chủ sở hữu mời người dùng, đặt vai trò, cấp quyền theo không gian/dự án/hồ sơ khi cần.
- Task có người giao và người phụ trách; thay đổi người phụ trách được ghi lịch sử.
- Người dùng chỉ nhận email/thông báo về mục họ có quyền xem.
- **Nghiệm thu:** kiểm tra cả trường hợp được phép và bị từ chối với xem, sửa, tạo, xuất dữ liệu và truy cập đường dẫn trực tiếp.

### F11 — Nhập, xuất và quản trị dữ liệu

- Nhập CSV theo mẫu cho khách, cơ hội, dự án, task; có bước xem trước, báo dòng lỗi và chống tạo trùng.
- Xuất CSV/JSON các dữ liệu cốt lõi cùng quan hệ ID; tải tệp đính kèm theo quy trình riêng.
- Có lịch sao lưu tự động, bản sao ngoài hệ thống và bài kiểm tra khôi phục định kỳ. Phải ghi rõ dữ liệu nào có/không có trong mỗi bản sao.
- **Nghiệm thu:** xuất rồi nhập vào môi trường thử, kiểm tra số lượng và liên kết không đổi; khôi phục được bản thử.

## 7. Mô hình dữ liệu đề xuất

```text
Workspace
  ├─ User / Membership / Role
  ├─ Customer (cá nhân hoặc doanh nghiệp)
  │    ├─ Contact (nhiều người liên hệ cho doanh nghiệp)
  │    ├─ Interaction / Note / Attachment
  │    ├─ Opportunity (nhiều cơ hội)
  │    │    └─ Project (sau khi chốt, nếu có)
  │    └─ Task / Commitment
  ├─ Project ─ Milestone ─ Task
  ├─ Inbox item ─ liên kết các bản ghi đã tạo
  ├─ Calendar connection / Event link
  ├─ AI conversation / AI proposal / Approval
  └─ Audit log / Notification / Export job
```

**Các quy tắc quan hệ:**

- Mọi mục có ID ổn định, `created_at`, `updated_at`, `created_by`, `workspace_id`; mục quan trọng có lịch sử sửa.
- Khách là thực thể lâu dài; cơ hội là một nhu cầu/một khả năng hợp tác; dự án là phần đã bắt đầu triển khai.
- Task có thể đứng độc lập nhưng được khuyến khích gắn đúng một bối cảnh chính và có thể liên kết thêm các đối tượng liên quan.
- Tệp lưu riêng với dữ liệu bảng; bản sao cơ sở dữ liệu không được mặc định coi là đã sao lưu tệp.
- Xóa hồ sơ có liên kết phải qua bước xác nhận và quy tắc lưu trữ; ưu tiên lưu trữ/ẩn thay vì xóa ngay.

## 8. Kiến trúc triển khai đề xuất

| Tầng | Đề xuất | Lý do |
|---|---|---|
| Giao diện | Webapp responsive/PWA, ưu tiên điện thoại | Một sản phẩm dùng trên máy tính và điện thoại, mở nhanh sau cuộc gọi. |
| Ứng dụng | Framework web phổ biến, code được lưu trong repository do anh Hùng sở hữu | Dễ bàn giao, kiểm thử và phát triển logic tùy biến. Chọn framework cụ thể khi chốt đội triển khai. |
| Dữ liệu và đăng nhập | PostgreSQL/Auth/Storage quản lý sẵn, ví dụ Supabase | Phù hợp dữ liệu có nhiều quan hệ; hỗ trợ phân quyền và xuất dữ liệu. |
| Logic máy chủ | API cho AI, lịch, email, nhập/xuất và các thao tác cần ghi nhiều mục | Giữ khóa API ở máy chủ; kiểm tra quyền và chống ghi trùng tại một nơi. |
| AI | Nhà cung cấp model qua API; đầu ra có cấu trúc để dựng bản nháp | Có thể thay model mà không đổi quy trình duyệt. |
| Tích hợp | Google Calendar ở chế độ đọc; dịch vụ gửi email giao dịch | Giới hạn quyền và trách nhiệm của từng hệ thống. |

Các lựa chọn công nghệ là **khuyến nghị kỹ thuật**, chưa phải quyết định mua dịch vụ. Trước khi xây cần kiểm tra chi phí, hạn mức, nơi lưu dữ liệu, quyền truy cập và phương án sao lưu theo nhu cầu thực tế. Supabase nhấn mạnh phải cấu hình Row Level Security cho dữ liệu truy cập từ giao diện và sao lưu tệp Storage riêng với database; Google cung cấp scope đọc sự kiện để tránh xin quyền sửa lịch không cần thiết. Nguồn: [Supabase Database](https://supabase.com/docs/guides/database/overview), [Supabase Security](https://supabase.com/docs/guides/database/secure-data), [Google Calendar Scopes](https://developers.google.com/workspace/calendar/api/auth), [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs).

## 9. Chất lượng, an toàn dữ liệu và vận hành

### 9.1. Yêu cầu cần có trước khi dùng dữ liệu thật

- Đăng nhập an toàn; phiên hết hạn và có cách thu hồi quyền khi thành viên rời nhóm.
- Quyền được kiểm tra ở máy chủ/cơ sở dữ liệu, không chỉ ẩn nút trên giao diện.
- Khóa API, token Google và thông tin kết nối không đặt trong mã giao diện hoặc nhật ký công khai.
- Chỉ gửi cho AI phần dữ liệu cần thiết theo quyền của người dùng; có khả năng ngắt kết nối AI.
- Có nhật ký các thay đổi quan trọng và khả năng tra cứu thay đổi do AI đề xuất.
- Sao lưu database và tệp, kiểm thử khôi phục trên môi trường riêng.
- Có môi trường thử và môi trường dùng thật; dữ liệu thử không lẫn dữ liệu khách thật.

### 9.2. Mục tiêu trải nghiệm để kiểm thử

- Luồng ghi nhanh trên điện thoại hoàn thành trong tối đa vài thao tác; lưu được khi nhập chưa đủ trường.
- Dashboard và hồ sơ thường dùng mở nhanh trên kết nối di động thông thường. Ngưỡng thời gian cụ thể đo sau nguyên mẫu và thiết bị thử thực tế.
- Tiếng Việt hiển thị tốt, ngày theo múi giờ Việt Nam, phân biệt rõ ngày và giờ.
- Trạng thái tải/lỗi/lưu thành công rõ ràng; không để người dùng đoán thao tác đã lưu hay chưa.
- Giao diện có thể thao tác bằng bàn phím trên máy tính và có độ tương phản, kích thước chạm phù hợp.

## 10. Lộ trình thực hiện bản đầy đủ

**Ước lượng để lập kế hoạch, chưa phải cam kết tiến độ hay báo giá.** Giả định có 1 người phát triển full-stack có kinh nghiệm, hỗ trợ thiết kế và QA bán thời gian, anh Hùng tham gia chốt nghiệp vụ và dùng thử hằng tuần. Công việc có thể gối đầu một phần.

| Chặng | Thời lượng tham chiếu | Đầu ra kiểm tra được | Cổng quyết định |
|---|---:|---|---|
| 0. Khảo sát quy trình và dữ liệu | 1–2 tuần | 5–8 hành trình thực tế, pipeline B2C/B2B, mẫu dữ liệu, danh sách trường và quy tắc | Anh Hùng xác nhận app phản ánh đúng cách làm. |
| 1. Thiết kế sản phẩm | 2 tuần | Sơ đồ màn hình, prototype điện thoại/máy tính, luồng ghi nhanh, hồ sơ, cơ hội, AI duyệt | Thử prototype với dữ liệu và tình huống thật. |
| 2. Nền tảng và công việc | 4–6 tuần | Đăng nhập, dữ liệu, dashboard, hộp ghi nhanh, task/cam kết, khách, cơ hội, dự án, ghi chú, tìm kiếm | Chạy trọn các luồng L1–L4 bằng tay. |
| 3. Nhắc việc và lịch | 2–3 tuần | Email tổng hợp, việc định kỳ, Google Calendar đọc, lịch tuần và liên kết hồ sơ | Không bỏ sót/nhắc trùng trên dữ liệu thử. |
| 4. AI có duyệt | 3–4 tuần | Hỏi đáp có nguồn, tóm tắt, bản nháp cập nhật, phê duyệt, nhật ký, chống ghi trùng | Bộ tình huống lỗi và mơ hồ đạt yêu cầu. |
| 5. Nhóm nhỏ và quản trị | 2–4 tuần | Tài khoản nhóm, phân quyền, giao việc, nhập/xuất, sao lưu/khôi phục | Kiểm tra quyền và khôi phục thành công. |
| 6. Dùng thử có kiểm soát | 2–3 tuần | Dữ liệu thật được nhập, danh sách lỗi/điều chỉnh, hướng dẫn sử dụng | Anh Hùng dùng liên tục, không còn lỗi cản luồng chính. |

**Tổng tham chiếu:** khoảng 16–24 tuần cho sản phẩm đầy đủ theo phạm vi trên, tùy độ phức tạp dữ liệu đầu vào, mức hoàn thiện giao diện và việc xác minh tích hợp Google. Đây là suy luận kế hoạch, cần ước lượng lại sau chặng 0–1. Không nên lấy thời gian này làm cam kết của nhà thầu khi chưa có thiết kế và dữ liệu mẫu.

### 10.1. Thứ tự phát hành để dùng sớm nhưng vẫn xây đủ

- **Release A — Nền vận hành:** chặng 0–2. Anh Hùng bắt đầu dùng task, khách, cơ hội và dự án.
- **Release B — Chủ động nhắc việc:** chặng 3. App trở thành màn hình điều hành hằng ngày.
- **Release C — AI hỗ trợ:** chặng 4. AI đọc dữ liệu và chuẩn bị thay đổi có duyệt.
- **Release D — Nhóm và bàn giao:** chặng 5–6. Mở rộng cho cộng sự và hoàn tất vận hành.

Release A–D là **các mốc của một sản phẩm đầy đủ**, không phải bốn ứng dụng độc lập.

## 11. Kế hoạch nhập dữ liệu và chuyển thói quen

1. Kiểm kê nguồn hiện tại: giấy ghi chú, Google Calendar, Google Sheets/Excel, Notion, email, chat và tài liệu Drive. Chỉ liệt kê nguồn; chưa kết nối tự động.
2. Chọn dữ liệu thử gần với công việc thật: tối thiểu 10 khách, 5 cơ hội, 5 dự án, 30 task/cam kết, 10 ghi chú và một số cuộc hẹn.
3. Chuẩn hóa tên khách, số điện thoại/email, chủ sở hữu, trạng thái, ngày và nguồn. Gắn nhãn dữ liệu thiếu hoặc chưa xác nhận.
4. Nhập thử vào môi trường kiểm thử; so số lượng, bản ghi trùng và quan hệ giữa các mục.
5. Chọn ngày bắt đầu dùng app làm nơi theo dõi task mới; tránh hai hệ thống cùng được coi là bản chính quá lâu.
6. Trong 2–3 tuần đầu, ghi lại việc nào anh vẫn phải quay về công cụ cũ để xử lý. Đây là đầu vào ưu tiên sửa sản phẩm.

## 12. Kế hoạch kiểm thử và nghiệm thu

### 12.1. Bộ tình huống bắt buộc

| Nhóm | Tình huống cần thử |
|---|---|
| Ghi nhanh | Nhập thiếu trường, mất kết nối lúc lưu, tải lại trang, xử lý một mục hai lần. |
| Task | Quá hạn, chờ phản hồi, hoàn thành/mở lại, thay đổi người phụ trách, việc lặp lại. |
| Khách/cơ hội | Trùng tên công ty, nhiều người liên hệ, nhiều cơ hội cùng khách, cơ hội thua rồi quay lại. |
| Dự án | Tạo từ cơ hội, mốc thay đổi, task phụ thuộc hồ sơ nguồn. |
| Tìm kiếm | Có dấu/không dấu, cùng từ xuất hiện ở nhiều loại bản ghi, quyền xem khác nhau. |
| Lịch/email | Sự kiện đổi/hủy, ngắt kết nối Google, múi giờ, email gửi lại do lỗi tác vụ nền. |
| AI | Ngày mơ hồ, khách trùng tên, thiếu quyền, nguồn rỗng, API lỗi, bấm lưu hai lần, sửa bản nháp trước khi chốt. |
| Quyền và dữ liệu | Người không có quyền mở URL trực tiếp, xuất dữ liệu, tệp đính kèm, sao lưu và khôi phục. |

### 12.2. Điều kiện hoàn tất bản đầy đủ

- Các luồng L1–L6 chạy được trên điện thoại và máy tính.
- Với bộ dữ liệu thử, dashboard chỉ đúng việc hôm nay, quá hạn, chờ hỏi lại, khách cần liên hệ và mốc dự án.
- Từ một cam kết bất kỳ mở được ghi chú/cuộc trao đổi nguồn và hồ sơ liên quan.
- Google Calendar đọc đúng sự kiện và không tạo task trùng.
- Email tổng hợp gửi đúng lịch cài đặt, không gửi trùng cùng ngày.
- AI tạo bản nháp có thể sửa; bấm `Chốt và lưu` hai lần không tạo dữ liệu trùng; khi AI lỗi, nhập tay vẫn bình thường.
- Người dùng được phân quyền chỉ thấy và sửa đúng dữ liệu được phép.
- Xuất dữ liệu và khôi phục bản thử thành công; có hướng dẫn thao tác và người chịu trách nhiệm vận hành.
- Anh Hùng sử dụng với dữ liệu thật trong giai đoạn thử, xác nhận các vấn đề cản công việc chính đã được xử lý.

## 13. Rủi ro cần quản lý trong kế hoạch

| Rủi ro thực tế | Cách xử lý từ đầu |
|---|---|
| App trở thành nơi nhập liệu nặng | Ưu tiên ghi nhanh; trường bổ sung chỉ xuất hiện khi cần; thử trên điện thoại sau cuộc gọi. |
| Trạng thái B2C/B2B không khớp quy trình bán | Chốt pipeline qua hồ sơ và cơ hội thật trước khi thiết kế form. |
| AI gắn sai khách hoặc sai ngày | Hiển thị bản nháp, cảnh báo trùng/mơ hồ, yêu cầu người dùng chọn; lưu lịch sử phê duyệt. |
| Hai hệ thống chứa task khác nhau | Chọn app là nơi theo dõi task chính; Calendar chỉ quản lý sự kiện trong giai đoạn đầu. |
| Báo cáo đẹp nhưng dữ liệu thiếu | Chỉ hiển thị chỉ số có định nghĩa, nguồn và quy tắc nhập nhất quán. |
| Rò rỉ dữ liệu khách khi mở nhóm | Kiểm tra quyền ở tầng dữ liệu/API, kiểm thử truy cập trực tiếp, giới hạn dữ liệu gửi AI. |
| Sao lưu không đủ tệp | Sao lưu riêng database và tệp; kiểm tra khôi phục định kỳ. |
| Phụ thuộc một nhà phát triển hoặc dịch vụ | Repository và tài khoản dịch vụ do anh Hùng sở hữu; tài liệu dữ liệu, triển khai, sao lưu và bàn giao. |

## 14. Các quyết định anh Hùng cần chốt trước khi bắt đầu chặng 1

1. **Ranh giới dữ liệu:** app chỉ cho AI Trainer, hay ngay từ đầu có cả việc điều hành Visun Group/Nutrihealth? Khuyến nghị: AI Trainer là không gian đầu tiên; có thể mở không gian khác sau.
2. **Nguồn dữ liệu hiện tại:** khách, việc, lịch sử trao đổi và tài liệu đang ở những nơi nào? Quyết định này ảnh hưởng lớn tới thời gian nhập dữ liệu.
3. **Pipeline B2C và B2B:** các bước anh đang dùng thực tế, đặc biệt từ khảo sát đến đề xuất và ký/chốt.
4. **Người dùng nhóm đầu tiên:** ai sẽ vào app, cần xem/sửa gì? Nếu chưa có, vẫn giữ cấu trúc quyền nhưng phát hành cá nhân trước.
5. **Email nhắc việc:** giờ nhận, ngày trong tuần và có nhận mục quá hạn mỗi ngày không.
6. **Tệp khách hàng:** muốn tải tệp trực tiếp vào app hay chủ yếu lưu liên kết Google Drive? Khuyến nghị ban đầu: hỗ trợ cả hai, nhưng quy định rõ tệp nào là bản chính.
7. **Dữ liệu gửi AI:** loại thông tin nào được phép đưa vào lời gọi model; có hồ sơ nào cần loại trừ không.

Các quyết định này **không cản việc xem xét kế hoạch**. Chúng là đầu vào để khóa PRD, thiết kế và ước lượng chính xác.

## 15. Hồ sơ cần bàn giao trước khi cho phép xây dựng

1. PRD phiên bản đã chốt, gồm pipeline B2C/B2B và phạm vi Release A–D.
2. Sơ đồ dữ liệu và từ điển trường, kèm quy tắc task/cam kết/ngày hỏi lại.
3. Prototype màn hình điện thoại và máy tính cho sáu luồng L1–L6.
4. Danh sách tình huống nghiệm thu và bộ dữ liệu thử đã ẩn thông tin nhạy cảm khi cần.
5. Kế hoạch tài khoản, phân quyền, sao lưu, xuất dữ liệu và quyền sở hữu repository/dịch vụ.
6. Ước lượng nhân sự, thời gian, chi phí triển khai và chi phí vận hành sau khi chốt thiết kế.

**Điểm dừng hiện tại:** kế hoạch này chỉ để anh Hùng xem và phản biện. Chưa tạo ứng dụng, chưa kết nối Google/AI, chưa nhập dữ liệu khách và chưa phát hành sản phẩm.
