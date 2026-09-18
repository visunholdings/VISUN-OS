# PRD — Web app quản lý công việc và khách hàng cho anh Hùng

**Phiên bản:** 0.1 — bản để xem và góp ý  
**Người dùng ban đầu:** anh Hùng  
**Hướng mở rộng:** chia sẻ cho một nhóm nhỏ khi quy trình cá nhân đã ổn định

## 1. Mục tiêu sản phẩm

App giúp anh **không quên việc, không để trôi cam kết với khách hàng và tìm lại được thông tin khi cần**. Anh có thể ghi nhanh trong lúc làm việc, theo dõi mọi task trên một dashboard, mở hồ sơ khách hàng để xem lịch sử trao đổi, và dùng chat AI để đề xuất cập nhật dữ liệu sau khi anh chốt.

**Thước đo cốt lõi:** một việc quan trọng phải có người phụ trách, thời điểm cần xử lý hoặc xem lại, trạng thái và bối cảnh tạo ra việc đó.

## 2. Công việc app cần phục vụ

- Quản lý việc cá nhân: điều hành, chuẩn bị đào tạo, làm nội dung, nghiên cứu và làm việc với đối tác.
- Theo dõi khách hàng **cá nhân/chủ kinh doanh** cần học hoặc tư vấn ứng dụng AI.
- Theo dõi khách hàng **doanh nghiệp** cần đào tạo in-house, tư vấn workflow hoặc triển khai AI Agent.
- Theo dõi từng dự án đào tạo, tư vấn hoặc sản phẩm AI đang thực hiện.
- Lưu ghi chú, quyết định, tài liệu và các cam kết phát sinh từ cuộc gọi, cuộc họp hoặc chat.

Hai nhóm khách hàng dùng chung cấu trúc hồ sơ, nhưng có **nhãn và trạng thái theo dõi riêng** để dashboard không trộn lẫn hai luồng công việc.

## 3. Cấu trúc sản phẩm

| Màn hình | Nội dung chính |
|---|---|
| **Dashboard** | Việc hôm nay, quá hạn, đang chờ, lịch sắp tới, khách cần liên hệ lại và dự án cần chú ý. |
| **Công việc** | Danh sách task với bộ lọc, tạo nhanh, cập nhật trạng thái và mở bối cảnh liên quan. |
| **Khách hàng** | Hồ sơ, nhu cầu, lịch sử trao đổi, lần liên hệ tiếp theo, dự án và task liên quan. |
| **Dự án** | Mục tiêu, trạng thái, mốc tiếp theo, ghi chú, tài liệu và danh sách task. |
| **Chat AI** | Khung chat mở được từ mọi màn hình để hỏi dữ liệu, ghi nhanh và chuẩn bị bản nháp cập nhật. |

Giao diện phải dùng tốt trên điện thoại vì nhiều thông tin sẽ được ghi ngay sau khi gặp hoặc gọi khách hàng.

## 4. Yêu cầu chức năng cho bản đầu

### F01 — Ghi nhanh

Anh có thể nhập một câu ngắn mà chưa cần chọn đủ trường, ví dụ: “Gửi đề cương cho công ty A vào thứ Sáu.”

- Nội dung được lưu ngay vào **Hộp ghi nhanh**.
- Anh có thể tự chuyển nội dung thành task hoặc để AI đề xuất cách phân loại.
- Mục chưa xử lý luôn hiện số lượng trên dashboard để không bị chìm.

**Đạt yêu cầu khi:** một ý vừa nhập có thể tìm lại ngay, kể cả khi chưa được phân loại.

### F02 — Quản lý công việc

Một task gồm: tên việc, trạng thái, mức ưu tiên, hạn hoàn thành **hoặc ngày cần xem lại**, người phụ trách, khách hàng/dự án liên quan và ghi chú nguồn.

Các trạng thái ban đầu: **Cần làm · Đang làm · Chờ phản hồi · Hoàn thành**.

- Tạo, sửa, hoàn thành và mở lại task.
- Lọc theo hôm nay, tuần này, quá hạn, đang chờ, khách hàng và dự án.
- Việc chưa hoàn thành mà đã qua hạn tiếp tục xuất hiện ở mục quá hạn.
- Với trạng thái “Chờ phản hồi”, anh đặt được ngày cần hỏi lại.

**Đạt yêu cầu khi:** từ dashboard, anh mở được việc quá hạn và biết ngay phải làm gì tiếp, với ai và vì sao việc đó được tạo.

### F03 — Dashboard và nhắc việc

Dashboard ưu tiên **hành động**, không chỉ hiển thị biểu đồ:

1. Việc phải xử lý hôm nay.
2. Việc quá hạn.
3. Việc đang chờ phản hồi đến ngày cần hỏi lại.
4. Khách hàng đến ngày cần liên hệ.
5. Dự án có mốc sắp tới.

Mỗi con số hoặc thẻ trên dashboard mở ra đúng danh sách chi tiết. App có thông báo trong giao diện và **bản tổng hợp nhắc việc hằng ngày qua email** theo giờ anh chọn, để việc vẫn được nhắc khi anh chưa mở app.

**Đạt yêu cầu khi:** anh mở dashboard buổi sáng và xác định được các việc cần ưu tiên mà không phải tìm qua từng hồ sơ.

### F04 — Hồ sơ khách hàng

Mỗi hồ sơ lưu: tên cá nhân/doanh nghiệp, loại khách, người liên hệ, kênh liên hệ, nhu cầu AI, trạng thái trao đổi, lần trao đổi gần nhất, lần cần liên hệ tiếp và ghi chú.

Hồ sơ hiển thị theo dòng thời gian: **ghi chú → cuộc hẹn → task → dự án**. Một khách hàng có thể có nhiều dự án hoặc nhu cầu khác nhau.

**Đạt yêu cầu khi:** trước một cuộc gọi, anh mở hồ sơ và thấy được đã trao đổi gì, đã hứa gì và bước tiếp theo là gì.

### F05 — Hồ sơ dự án

Dự án có thể là khóa đào tạo, workshop, tư vấn riêng, triển khai AI Agent hoặc việc nội bộ. Mỗi dự án lưu: tên, loại, khách hàng liên quan nếu có, mục tiêu, trạng thái, mốc tiếp theo, ghi chú, tài liệu và task.

**Đạt yêu cầu khi:** anh nhìn một hồ sơ dự án và biết tiến độ hiện tại, việc còn mở và tài liệu liên quan.

### F06 — Ghi chú, tài liệu và tìm kiếm

Anh có thể tạo ghi chú từ một cuộc họp, cuộc gọi hoặc ý tưởng; gắn nó với khách hàng/dự án và liên kết tới task phát sinh. Hỗ trợ lưu đường dẫn tài liệu và tệp đính kèm cần thiết.

Tìm kiếm chung theo tên khách, tên dự án, nội dung task và ghi chú. Kết quả cho biết thông tin nằm ở hồ sơ nào.

**Đạt yêu cầu khi:** một cam kết cũ có thể được tìm lại bằng từ khóa và mở tới ghi chú nguồn.

### F07 — Chat AI trong app

Chat AI phục vụ hai loại yêu cầu:

- **Hỏi và tổng hợp:** “Khách A đang ở bước nào?”, “Tuần này có việc gì quá hạn?”, “Tóm tắt dự án đào tạo của công ty B.”
- **Đề xuất cập nhật:** từ lời anh nói hoặc ghi chú, AI chuẩn bị task, ghi chú khách hàng, ngày theo dõi hoặc cập nhật dự án.

Trước khi ghi dữ liệu, app hiển thị **bản nháp thay đổi**: sẽ tạo/sửa mục nào, gắn với khách hàng nào, hạn nào. Anh có thể sửa, bỏ bớt rồi bấm **Chốt và lưu**. Sau đó app báo rõ mục nào đã được lưu và cho mở trực tiếp. Nếu AI chưa xác định được khách hàng hoặc ngày, nó để trống và hỏi anh; không tự đoán.

Chat lưu lịch sử để anh xem lại. Khi trả lời về dữ liệu công việc, AI dẫn tới task hoặc ghi chú nguồn. Nếu dịch vụ AI tạm thời không hoạt động, anh vẫn tạo và quản lý việc bằng tay.

### F08 — Google Calendar

Anh kết nối tài khoản Google và xem các cuộc hẹn sắp tới trong dashboard và hồ sơ liên quan. Bản đầu ưu tiên **đọc lịch**; task trong app vẫn là nơi theo dõi việc cần làm. App cho phép gắn một cuộc hẹn với khách hàng hoặc dự án.

**Đạt yêu cầu khi:** trước cuộc hẹn, anh mở được hồ sơ khách hàng và các việc cần chuẩn bị từ lịch hiển thị trong app.

## 5. Dữ liệu tối thiểu cần lưu

Cơ sở dữ liệu có các nhóm liên kết với nhau: **Khách hàng, Dự án, Task, Ghi chú/Tài liệu, Cuộc chat và Lịch sử cập nhật**. Mỗi mục có thời điểm tạo và cập nhật. Dữ liệu có thể xuất ra định dạng phổ biến để sao lưu hoặc chuyển hệ thống.

Bản đầu chỉ anh có tài khoản. Cấu trúc dữ liệu vẫn cần trường người sở hữu/người phụ trách để sau này chia sẻ cho team mà không phải làm lại toàn bộ.

## 6. Luồng sử dụng quan trọng nhất

> Anh vừa trao đổi với một doanh nghiệp về đào tạo AI. Anh mở chat và nói: “Công ty A muốn chương trình cho quản lý. Thứ Sáu mình gửi đề cương. Tuần sau hỏi lịch khảo sát.”

1. AI tìm hồ sơ Công ty A hoặc đề xuất tạo hồ sơ mới.
2. AI hiện bản nháp gồm ghi chú cuộc trao đổi và hai task có hạn theo dõi.
3. Anh xem, sửa và bấm **Chốt và lưu**.
4. Task xuất hiện trên dashboard đúng ngày.
5. Khi mở task, anh thấy lại ghi chú và hồ sơ Công ty A.

## 7. Điều kiện nghiệm thu bản đầu

Dùng dữ liệu thử gần với công việc thật: khoảng **10 khách hàng, 5 dự án và 30 task**. Bản đầu đạt yêu cầu khi anh có thể:

- Ghi một việc mới và thấy nó trong hệ thống ngay.
- Xác định việc hôm nay, quá hạn và đang chờ từ dashboard.
- Mở một khách hàng và tìm được lịch sử trao đổi cùng các cam kết chưa hoàn thành.
- Chat để tạo **bản nháp**, chỉnh sửa, chốt và thấy dữ liệu được cập nhật đúng một lần.
- Tìm lại một thông tin cũ từ ghi chú hoặc task.
- Xuất được dữ liệu để sao lưu.

## 8. Thứ tự phát triển

**Bản đầu:** cơ sở dữ liệu, bốn màn hình chính, ghi nhanh, task, khách hàng, dự án, ghi chú, tìm kiếm, nhắc việc, chat AI có bước chốt và kết nối Google Calendar ở chế độ đọc lịch.

**Sau khi anh dùng ổn:** cho phép tạo hoặc sửa lịch từ app, kết nối app với ChatGPT/Claude bên ngoài qua MCP, rồi thêm tài khoản và phân quyền cho team.

## 9. Ba điểm để anh góp ý trước khi thiết kế giao diện

1. Anh muốn nhận **email nhắc việc hằng ngày** vào giờ nào?
2. Hiện thông tin khách hàng và task của anh chủ yếu nằm ở đâu để chuẩn bị nhập vào app?
3. Với khách doanh nghiệp, anh muốn theo dõi trạng thái đơn giản theo **nhu cầu → đề xuất → triển khai → hoàn thành**, hay có bước riêng nào trong cách anh bán và triển khai đào tạo?

Các lựa chọn này chưa cản việc thiết kế bản đầu; chúng giúp bản app sát thói quen làm việc của anh hơn.
