import type { CalendarEventLink, ContentItem, Customer, DataAsset, DemoState, InboxItem, KnowledgeItem, LearningItem, Note, Opportunity, Project, Task } from './domain'
import { addDays, todayISO } from './utils'

const today = todayISO()
const at = (offset: number, hour = 9, minute = 0) => `${addDays(today,offset)}T${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}:00`
const day = (offset: number) => addDays(today, offset)
const base = (id: string) => ({ id, createdAt: at(-5), updatedAt: at(-1), createdBy: 'u1', workspaceId: 'visun-ai-trainer' })

const customerRows: Array<[string,'B2C'|'B2B',string,string,string,string,number]> = [
  ['Công ty An Phát','B2B','Nguyễn Minh Anh','Giới thiệu','Đào tạo AI cho đội ngũ quản lý','Đang trao đổi',0],
  ['Công ty Bình Minh','B2B','Trần Hải Nam','LinkedIn','Khảo sát workflow chăm sóc khách hàng','Đã đề xuất',2],
  ['Công ty Sao Việt','B2B','Lê Thu Hà','Đối tác','Workshop AI cho phòng kinh doanh','Đang triển khai',5],
  ['Công ty Hưng Thịnh','B2B','Phạm Đức Long','Email','Thiết kế AI Agent nội bộ','Khảo sát',-1],
  ['Công ty Nam Hải','B2B','Vũ Mai Chi','Sự kiện','Đào tạo in-house cho cấp quản lý','Chờ quyết định',3],
  ['Anh Quang Minh','B2C','Quang Minh','Facebook','Tư vấn 1-1 xây workflow cho CEO','Đã trao đổi',1],
  ['Chị Thu Trang','B2C','Thu Trang','Facebook','Khóa AI ứng dụng 8 tuần','Quan tâm',0],
  ['Anh Hoàng Phúc','B2C','Hoàng Phúc','Workshop','Cần workshop bắt đầu với AI','Chăm sóc tiếp',4],
  ['Chị Bảo Ngọc','B2C','Bảo Ngọc','LinkedIn','Tư vấn AI cho doanh nghiệp nhỏ','Đã đề xuất',-2],
  ['Anh Tuấn Kiệt','B2C','Tuấn Kiệt','Giới thiệu','Học cách tổ chức công việc với AI','Quan tâm',6],
]
const customers: Customer[] = customerRows.map(([name,type,contactName,channel,need,status,next],i) => ({
  ...base(`c${i+1}`), type, name, contactName, channel, need, status, nextContactAt: day(next),
  contacts: type === 'B2B' ? [
    {id:`co${i+1}a`,name:contactName,role:i===0?'Giám đốc nhân sự':'Đầu mối dự án'},
    ...(i===0 ? [{id:'co1b',name:'Lê Quốc Bảo',role:'Giám đốc điều hành'}] : []),
  ] : [],
}))

const opportunityRows: Array<[string,string,string,string,string,number]> = [
  ['c1','Chương trình AI cho quản lý','Đào tạo in-house','Đề xuất','Gửi đề cương và thống nhất buổi khảo sát',1],
  ['c1','Tư vấn workflow báo cáo','Tư vấn workflow','Khảo sát','Xác định quy trình ưu tiên',4],
  ['c2','AI cho chăm sóc khách hàng','AI Agent/workflow','Chờ quyết định','Hỏi phản hồi đề xuất',2],
  ['c3','Workshop phòng kinh doanh','Workshop','Triển khai','Chuẩn bị bài tập tình huống',3],
  ['c4','AI Agent nội bộ','AI Agent','Khảo sát','Gặp đội vận hành',-1],
  ['c6','Tư vấn 1-1 cho CEO','Tư vấn 1-1','Đã đề xuất','Gọi trao đổi phạm vi',1],
  ['c7','Khóa AI ứng dụng 8 tuần','Khóa học','Quan tâm','Gửi lịch khai giảng',0],
  ['c9','Tư vấn AI cho SME','Tư vấn 1-1','Chăm sóc tiếp','Liên hệ lại khi phù hợp',6],
]
const opportunities: Opportunity[] = opportunityRows.map(([customerId,title,product,stage,nextAction,next],i) => ({
  ...base(`o${i+1}`), customerId, customerType: customers.find(c=>c.id===customerId)!.type, title, product, stage,
  nextAction, nextActionAt: day(next), ownerId:'u1',
}))

const projectRows: Array<[string,string|undefined,string|undefined,string,Project['status'],string,number]> = [
  ['Workshop AI cho phòng kinh doanh','c3','o4','Workshop','active','Đội kinh doanh dùng AI để chuẩn bị và theo dõi khách hàng',3],
  ['Tư vấn workflow cho anh Quang','c6','o6','Tư vấn 1-1','active','Thiết kế một workflow quản lý công việc cho CEO',5],
  ['Chương trình quản lý AI An Phát','c1','o1','Đào tạo in-house','planning','Đề cương và khảo sát nhu cầu quản lý',1],
  ['Thiết kế sản phẩm khóa 8 tuần',undefined,undefined,'Việc nội bộ','active','Hoàn thiện khung bài và bài tập thực hành',-2],
  ['Bộ tài liệu workshop CEO',undefined,undefined,'Việc nội bộ','waiting','Đóng gói ví dụ thực tế và tài liệu học viên',7],
]
const projects: Project[] = projectRows.map(([title,customerId,opportunityId,type,status,objective,next],i) => ({
  ...base(`p${i+1}`), title,customerId,opportunityId,type,status,objective,ownerId:'u1',nextMilestoneAt:day(next),
  milestones:[
    {id:`m${i+1}a`,title:i===0?'Chốt tình huống đào tạo':'Chốt phạm vi và đầu ra',date:day(next-3),status:i===0?'done':'todo',ownerId:'u1'},
    {id:`m${i+1}b`,title:i===0?'Gửi tài liệu học viên':'Bàn giao bản nháp',date:day(next),status:'todo',ownerId:'u1'},
  ],
  documents:i===0?[{id:'d1',title:'Đề cương workshop (tài liệu minh họa)',url:'/demo/de-cuong-workshop.txt',addedAt:day(-2)}]:[],
}))

const noteRows: Array<[string,string,Note['type'],string|undefined,string|undefined,number]> = [
  ['Trao đổi nhu cầu An Phát','Công ty An Phát muốn chương trình cho quản lý. Đã hứa gửi đề cương thứ Sáu và hỏi lịch khảo sát tuần sau.','call','c1','p3',-1],
  ['Khảo sát đội kinh doanh Sao Việt','Đội cần tình huống cụ thể về chuẩn bị cuộc gọi và chăm sóc sau bán.','meeting','c3','p1',-4],
  ['Quyết định cấu trúc khóa 8 tuần','Mỗi tuần có một đầu ra thực hành để học viên áp dụng vào công việc.','decision',undefined,'p4',-3],
  ['Phản hồi đề xuất Bình Minh','Khách muốn làm rõ phạm vi dữ liệu đầu vào trước khi quyết định.','call','c2',undefined,-2],
  ['Ý tưởng checklist CEO','Một màn hình buổi sáng: việc cần làm, cam kết và quyết định cần chốt.','idea',undefined,'p5',-5],
  ['Cuộc gọi anh Quang','Ưu tiên workflow báo cáo tuần trước các tự động hóa khác.','call','c6','p2',-2],
  ['Cập nhật workshop Sao Việt','Đã xác nhận số người tham dự; cần chốt ví dụ trước buổi học.','update','c3','p1',-1],
  ['Lịch khảo sát Hưng Thịnh','Cần trao đổi thêm với quản lý vận hành và người quản lý dữ liệu.','meeting','c4',undefined,-3],
  ['Khách Nam Hải hỏi về AI Agent','Đã gửi mô tả workshop; chờ phản hồi từ ban giám đốc.','call','c5',undefined,-4],
  ['Chị Trang quan tâm khóa học','Muốn lịch buổi tối và bài tập sát công việc quản lý.','call','c7',undefined,-2],
  ['Follow-up chị Ngọc','Khách chưa sẵn sàng triển khai trong tháng này.','update','c9',undefined,-1],
  ['Rà soát tài liệu','Cần thêm một ví dụ về phản hồi khách hàng B2B.','idea',undefined,'p5',-1],
  ['Chuẩn bị buổi demo','Đi từ vấn đề thật, dữ liệu đầu vào, thao tác và kết quả kiểm tra.','decision',undefined,'p4',-2],
  ['Thảo luận đội nội bộ','Ưu tiên không để trôi các cam kết sau cuộc gọi.','meeting',undefined,'p4',-5],
  ['Góp ý của anh Phúc','Workshop cần ít lý thuyết và nhiều bài tập tại lớp.','call','c8',undefined,-4],
  ['Tài liệu cho anh Kiệt','Gửi danh sách mẫu workflow để anh tham khảo.','update','c10',undefined,-1],
]
const notes: Note[] = noteRows.map(([title,content,type,customerId,projectId,offset],i)=>({
  ...base(`n${i+1}`),title,content,type,customerId,projectId,createdAt:at(offset),updatedAt:at(offset),
}))

const taskTitles = [
  'Gửi đề cương AI cho Công ty An Phát','Hỏi lịch khảo sát với An Phát','Chốt ví dụ workshop Sao Việt','Gửi bài tập trước workshop',
  'Hỏi phản hồi đề xuất Bình Minh','Chuẩn bị câu hỏi khảo sát Hưng Thịnh','Trao đổi phạm vi tư vấn với anh Quang','Gửi lịch khóa học cho chị Trang',
  'Rà soát khung khóa học 8 tuần','Viết ví dụ AI cho CEO SME','Hoàn thiện slide workshop','Kiểm tra tài liệu học viên',
  'Xác nhận người tham gia buổi đào tạo','Gửi biên bản cuộc họp','Cập nhật kế hoạch dự án','Chuẩn bị demo workflow báo cáo',
  'Nhắc lịch anh Hoàng Phúc','Liên hệ lại chị Bảo Ngọc','Làm rõ yêu cầu của Nam Hải','Xem lại đề xuất AI Agent',
  'Lập checklist triển khai workshop','Tổng hợp câu hỏi của học viên','Phản hồi email đối tác','Rà soát hợp đồng đào tạo',
  'Sắp xếp lịch tư vấn tuần sau','Viết bài chia sẻ từ trải nghiệm thực tế','Đọc phản hồi buổi workshop','Chuẩn bị báo cáo tuần',
  'Kiểm tra các cam kết với khách','Rà soát việc hôm nay','Theo dõi cuộc hẹn khảo sát','Gửi tài liệu tham khảo',
  'Cập nhật trạng thái cơ hội','Xác nhận mốc bàn giao','Sửa bản nháp đề cương','Tổng hợp việc quá hạn',
]
const taskCustomer = ['c1','c1','c3','c3','c2','c4','c6','c7',undefined,undefined,'c3','c3','c3','c1',undefined,undefined,'c8','c9','c5','c4',undefined,undefined,'c2','c3',undefined,undefined,'c3',undefined,'c1',undefined,'c4','c10',undefined,'c1','c1',undefined]
const taskProject = ['p3','p3','p1','p1',undefined,undefined,'p2',undefined,'p4','p4','p1','p1','p1','p3','p4','p2',undefined,undefined,undefined,undefined,'p1','p1',undefined,'p1',undefined,'p4','p1','p4',undefined,'p4',undefined,undefined,undefined,'p3','p3','p4']
const tasks: Task[] = taskTitles.map((title,i) => {
  const status: Task['status'] = [4,17,18,23].includes(i)?'waiting':[3,11,21,26].includes(i)?'done':[2,8,9,20].includes(i)?'doing':'todo'
  const offset = i<6?[-2,4,0,1,-1,1][i]:(i%7)-2
  return {
    ...base(`t${i+1}`),title,description:i===0?'Gửi bản đề cương phù hợp nhóm quản lý để khách góp ý.':'Đầu ra rõ ràng, cập nhật bối cảnh sau khi xử lý.',status,
    priority:i%5===0?'high':i%3===0?'low':'medium',dueAt:i===31?undefined:day(offset),reviewAt:status==='waiting'?day(i%2===0?0:2):undefined,
    customerId:taskCustomer[i],projectId:taskProject[i],sourceNoteId:i<2?'n1':undefined,
    assigneeId:i%6===0?'u2':'u1',promisedTo:i<2?'Công ty An Phát':undefined,
    recurrence:i===29?'daily':undefined,recurringSeriesId:i===29?'daily-review':undefined,
  }
})

const inboxRows = [
  'Gửi checklist trước buổi workshop cho đội Sao Việt',
  'Ý tưởng: một mẫu tổng kết cuộc họp bằng AI cho CEO',
  'Hỏi anh Nam về dữ liệu chăm sóc khách hàng tuần sau',
  'Chuẩn bị 3 ví dụ ngắn cho buổi đào tạo in-house',
]
const inbox: InboxItem[] = inboxRows.map((content,i)=>({...base(`i${i+1}`),content,status:'new',createdAt:at(-i)}))

const eventRows: Array<[string,number,number,number,string|undefined,string|undefined,boolean?]> = [
  ['Khảo sát nhu cầu An Phát',0,9,60,'c1','p3'],['Chuẩn bị workshop Sao Việt',0,14,90,'c3','p1'],
  ['Tư vấn anh Quang',1,10,60,'c6','p2'],['Gọi phản hồi Bình Minh',2,9,30,'c2',undefined],
  ['Workshop AI Sao Việt',3,13,210,'c3','p1'],['Rà soát nội dung khóa 8 tuần',4,15,90,undefined,'p4'],
  ['Trao đổi Hưng Thịnh',-1,10,60,'c4',undefined],['Họp chuẩn bị dự án An Phát',5,9,60,'c1','p3'],
  ['Cập nhật tài liệu nội bộ',6,11,45,undefined,'p5'],['Lịch cũ đã hủy',-2,14,60,'c5',undefined,true],
  ['Hội thảo AI cho SME',2,8,480,undefined,undefined],['Theo dõi dự án tư vấn',-3,16,45,'c6','p2'],
]
const events: CalendarEventLink[] = eventRows.map(([title,offset,hour,duration,customerId,projectId,cancelled],i)=>{
  const start=at(offset,hour)
  const endDate=new Date(start);endDate.setMinutes(endDate.getMinutes()+duration)
  return {...base(`e${i+1}`),title,start,end:endDate.toISOString(),customerId,projectId,cancelled,allDay:i===10}
})

const learning: LearningItem[] = [
  {...base('l1'),title:'Thiết kế bài tập AI cho CEO',kind:'course',status:'active',objective:'Mỗi buổi có một đầu ra áp dụng được vào công việc quản lý.',notes:'Đang thử cấu trúc tình huống → thực hành → kiểm tra kết quả.',progress:60,nextAction:'Hoàn thiện bài tập về giao việc và theo dõi cam kết',nextReviewAt:day(2),projectId:'p4'},
  {...base('l2'),title:'Nghiên cứu quy trình AI Agent cho SME',kind:'research',status:'active',objective:'Xác định khi nào nên dùng workflow cố định và khi nào cần agent.',notes:'Ghi riêng giả định, ví dụ và câu hỏi chưa được kiểm chứng.',progress:35,nextAction:'Đối chiếu 3 tình huống vận hành mẫu',nextReviewAt:day(3),projectId:'p5'},
  {...base('l3'),title:'Thử công cụ tạo nội dung video',kind:'tool',status:'planned',objective:'Đánh giá thao tác và chất lượng đầu ra cho nội dung đào tạo.',notes:'Chưa bắt đầu thử nghiệm.',progress:0,nextAction:'Soạn tiêu chí đánh giá trước khi dùng',nextReviewAt:day(7)},
  {...base('l4'),title:'Nghiên cứu cách đo hiệu quả workshop',kind:'research',status:'active',objective:'Thiết kế cách kiểm tra trước và sau buổi học bằng minh chứng công việc.',notes:'Chưa dùng số liệu khách hàng thật trong bản demo.',progress:45,nextAction:'Viết bộ câu hỏi đánh giá đầu ra',nextReviewAt:day(1),projectId:'p1'},
  {...base('l5'),title:'Học cách tổ chức kho kiến thức nội bộ',kind:'course',status:'done',objective:'Phân biệt bài học, quy trình, nguồn và dữ liệu dự án.',notes:'Đã hoàn tất bản khung mẫu; cần thử với dữ liệu vận hành thật ở giai đoạn sau.',progress:100,nextAction:'Áp dụng vào dự án thử',projectId:'p4'},
  {...base('l6'),title:'Nghiên cứu nhu cầu AI của đội kinh doanh',kind:'research',status:'paused',objective:'Tổng hợp câu hỏi thường gặp để thiết kế ví dụ lớp học.',notes:'Tạm chờ phản hồi từ đầu mối dự án.',progress:25,nextAction:'Hỏi thêm bối cảnh sau workshop',nextReviewAt:day(5),projectId:'p1'},
]

const knowledge: KnowledgeItem[] = [
  {...base('k1'),title:'Khung bài tập: từ vấn đề đến quy trình AI',category:'guide',content:'Mô tả công việc hiện tại, đầu vào, người duyệt, đầu ra cần đạt và cách kiểm tra. Đây là khung minh họa để thử giao diện.',tags:['đào tạo','workflow'],reviewStatus:'draft',projectId:'p4',learningId:'l1'},
  {...base('k2'),title:'Bài học sau buổi thử workshop',category:'insight',content:'Người học cần một tình huống sát công việc và thời gian thực hành đủ dài. Nội dung này là dữ liệu giả, chưa phải phản hồi khách thật.',tags:['workshop','đào tạo'],reviewStatus:'draft',projectId:'p1',learningId:'l4'},
  {...base('k3'),title:'Mẫu câu hỏi khảo sát trước đào tạo',category:'template',content:'1. Công việc lặp lại nhiều nhất là gì? 2. Dữ liệu đang nằm ở đâu? 3. Ai sẽ kiểm tra đầu ra AI? 4. Kết quả nào có thể đối chiếu sau buổi học?',tags:['khảo sát','B2B'],reviewStatus:'reviewed',projectId:'p3'},
  {...base('k4'),title:'Prompt chuẩn bị cuộc họp với khách',category:'prompt',content:'Từ ghi chú đã được phép dùng, hãy liệt kê mục tiêu cuộc họp, câu hỏi còn thiếu và nguồn cho từng nhận định. Để trống dữ liệu chưa có.',tags:['prompt','khách hàng'],reviewStatus:'draft',projectId:'p3'},
  {...base('k5'),title:'Ghi nhận nghiên cứu AI Agent',category:'research',content:'Giả thuyết: chỉ thêm agent khi các bước không thể mô tả ổn định bằng workflow. Cần kiểm tra trên từng tình huống và nguồn tài liệu trước khi áp dụng.',tags:['AI Agent','workflow'],reviewStatus:'draft',projectId:'p5',learningId:'l2'},
  {...base('k6'),title:'Checklist bàn giao sau workshop',category:'template',content:'Ghi đầu ra đã hoàn thành, người nhận, việc cần tiếp tục, ngày hỏi lại và đường dẫn tài liệu đã duyệt.',tags:['bàn giao','workshop'],reviewStatus:'reviewed',projectId:'p1'},
  {...base('k7'),title:'Nguyên tắc tổ chức tri thức nội bộ',category:'guide',content:'Tách bài học/insight khỏi dữ liệu khách và giọng viết. Mỗi mục có nguồn, trạng thái rà soát và liên kết dự án để tìm lại.',tags:['kiến thức','quản trị'],reviewStatus:'reviewed',learningId:'l5'},
  {...base('k8'),title:'Câu hỏi mở về đo hiệu quả lớp học',category:'research',content:'Cần xác định minh chứng trước đào tạo, sau đào tạo và người xác nhận. Chưa có số liệu thực nghiệm trong bộ minh họa.',tags:['đo lường','đào tạo'],reviewStatus:'draft',learningId:'l4'},
]

const dataAssets: DataAsset[] = [
  {...base('da1'),title:'Đề cương workshop mẫu',kind:'document',description:'Tệp văn bản minh họa cho dự án workshop Sao Việt.',content:'Chỉ là tài liệu mẫu để thử luồng mở tài liệu.',sourceUrl:'/demo/de-cuong-workshop.txt',format:'TXT',reviewStatus:'reviewed',projectId:'p1',ownerId:'u1'},
  {...base('da2'),title:'Khung dữ liệu khảo sát An Phát',kind:'table',description:'Cấu trúc trường dự kiến, chưa chứa câu trả lời thật.',content:'Vai trò | Quy trình muốn cải thiện | Công cụ hiện dùng | Người duyệt | Đầu ra mong muốn',format:'Bảng mẫu',reviewStatus:'draft',projectId:'p3',ownerId:'u1'},
  {...base('da3'),title:'Danh sách đầu việc khóa 8 tuần',kind:'dataset',description:'Danh mục mẫu để thử liên kết dữ liệu dự án.',content:'Tuần 1: xác định bài toán\nTuần 2: chuẩn hóa đầu vào\nTuần 3: thử workflow',format:'Văn bản',reviewStatus:'draft',projectId:'p4',ownerId:'u1'},
  {...base('da4'),title:'Bộ tiêu chí đánh giá workflow',kind:'document',description:'Tiêu chí mẫu cho dự án tư vấn cá nhân.',content:'Thời gian xử lý | Độ chính xác | Người kiểm tra | Cách quay lại quy trình cũ',format:'Ghi chú',reviewStatus:'draft',projectId:'p2',ownerId:'u1'},
  {...base('da5'),title:'Danh mục nguồn nghiên cứu AI Agent',kind:'link',description:'Nơi ghi đường dẫn nguồn trước khi đưa kết luận vào kho kiến thức.',content:'Chưa gắn nguồn công khai; cần kiểm chứng trước khi dùng.',format:'Danh mục nguồn',reviewStatus:'draft',projectId:'p5',ownerId:'u1'},
  {...base('da6'),title:'Mẫu theo dõi đầu ra workshop',kind:'table',description:'Bảng mẫu tổng hợp đầu ra, chưa có dữ liệu học viên.',content:'Người tham dự | Bài toán | Bản thử đã làm | Người xác nhận | Việc tiếp theo',format:'Bảng mẫu',reviewStatus:'reviewed',projectId:'p1',ownerId:'u1'},
]

const content: ContentItem[] = [
  {...base('ct1'),title:'Một màn hình buổi sáng cho CEO',angle:'Từ việc cần làm đến cam kết và quyết định cần chốt.',audience:'B2C',pillar:'workflow',status:'draft',sourceType:'knowledge',knowledgeId:'k1',sourceNote:'Ý tưởng minh họa; cần bổ sung trải nghiệm thật trước khi đăng.',draft:'CEO thường có nhiều đầu việc rời rạc. Bản nháp này cần thêm một tình huống thực tế được anh Hùng xác nhận.',cta:'Anh/chị đang theo dõi các cam kết sau họp bằng cách nào?',evidence:'unchecked',publications:[{channel:'facebook',scheduledAt:day(2)},{channel:'linkedin',scheduledAt:day(3)}],nextAction:'Bổ sung ví dụ thực tế và kiểm tra nội dung',dueAt:day(1)},
  {...base('ct2'),title:'Bốn câu hỏi trước khi dùng AI Agent',angle:'Bắt đầu từ quy trình và dữ liệu đầu vào của doanh nghiệp.',audience:'B2B',pillar:'research',status:'idea',sourceType:'knowledge',knowledgeId:'k5',sourceNote:'Đề xuất từ mục nghiên cứu mẫu, chưa phải kết luận đã kiểm chứng.',draft:'',cta:'',evidence:'unchecked',publications:[{channel:'linkedin'}],nextAction:'Đọc lại nguồn nghiên cứu và chọn tình huống minh họa'},
  {...base('ct3'),title:'Sau workshop, học viên mang về điều gì?',angle:'Các đầu ra công việc có thể kiểm tra sau buổi học.',audience:'B2B',pillar:'experience',status:'selected',sourceType:'knowledge',knowledgeId:'k6',sourceNote:'Dữ liệu mẫu; không dùng làm case study thật.',draft:'',cta:'',evidence:'permission_needed',publications:[{channel:'facebook',scheduledAt:day(5)}],nextAction:'Chọn ví dụ được phép chia sẻ',dueAt:day(3)},
]

export const makeSeed = (): DemoState => ({
  version:3,customers,opportunities,projects,tasks,notes,inbox,events,learning,knowledge,dataAssets,content,
  users:[{id:'u1',name:'Anh Hùng',role:'owner',initials:'H'},{id:'u2',name:'Mai Anh',role:'member',initials:'MA'},{id:'u3',name:'Quốc Bảo',role:'viewer',initials:'QB'}],
  approvals:[],settings:{reminderTime:'07:30',reminderWeekdays:true},
})
