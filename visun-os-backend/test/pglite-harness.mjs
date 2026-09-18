// Bộ kiểm thử schema + RLS bằng Postgres nhúng (PGlite), không cần Docker/Supabase CLI.
// CHỈ dùng để kiểm tra cục bộ các file migration trong supabase/migrations; không phải một phần của backend thật.
// Mô phỏng vai trò "authenticated" của Supabase (không phải superuser) để RLS được kiểm tra đúng nghĩa,
// vì nếu chạy bằng vai trò superuser mặc định, Postgres sẽ bỏ qua toàn bộ Row Level Security.
import { PGlite } from '@electric-sql/pglite'
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm'
import { readFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'

const __dirname = dirname(fileURLToPath(import.meta.url))
const migrationsDir = join(__dirname, '../supabase/migrations')

// PGlite (Postgres nhúng qua WASM) chưa đóng gói extension "pgcrypto"/"unaccent" như Postgres/Supabase thật.
// Hai đoạn thay thế dưới đây CHỈ áp dụng khi chạy bằng harness này để kiểm tra logic migration cục bộ;
// file migration thật trong supabase/migrations không bị sửa và vẫn dùng đúng extension chuẩn khi chạy trên Supabase.
const UNACCENT_MAP_FROM = 'àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ'
const UNACCENT_MAP_TO = 'a'.repeat(17) + 'e'.repeat(11) + 'i'.repeat(5) + 'o'.repeat(17) + 'u'.repeat(11) + 'y'.repeat(5) + 'd'
if (UNACCENT_MAP_FROM.length !== UNACCENT_MAP_TO.length) throw new Error('Bảng ánh xạ unaccent test-only bị lệch độ dài')

function patchForPglite(sql, filename) {
  if (filename !== '0001_foundations.sql') return sql
  return sql
    .replace('create extension if not exists pgcrypto with schema extensions;', '-- (harness) PGlite có sẵn gen_random_uuid(), bỏ qua pgcrypto khi test cục bộ.')
    .replace(
      'create extension if not exists unaccent with schema extensions;',
      `-- (harness) PGlite chưa đóng gói extension "unaccent"; định nghĩa hàm xấp xỉ CHỈ để test cục bộ, đặt trong schema extensions giống Supabase thật.
       create or replace function extensions.unaccent(dictionary text, value text) returns text language sql immutable as $unaccent$
         select translate($2, '${UNACCENT_MAP_FROM}', '${UNACCENT_MAP_TO}')
       $unaccent$;`
    )
}

let passed = 0
let failed = 0
function check(label, cond) {
  if (cond) { passed += 1; console.log(`  OK   ${label}`) }
  else { failed += 1; console.log(`  FAIL ${label}`) }
}

async function asAdmin(db) {
  await db.exec(`reset role`)
}
async function asUser(db, userId) {
  await db.query(`select set_config('app.current_user_id', $1, false)`, [userId])
  await db.exec(`set role authenticated`)
}

async function main() {
  const db = new PGlite({ extensions: { pg_trgm } })

  console.log('== Thiết lập vai trò và schema auth giả lập (chỉ để test, không thuộc migration thật) ==')
  await db.exec(`
    do $$ begin
      if not exists (select from pg_roles where rolname = 'authenticated') then
        create role authenticated nosuperuser nobypassrls;
      end if;
      if not exists (select from pg_roles where rolname = 'anon') then
        create role anon nosuperuser nobypassrls;
      end if;
    end $$;
  `)
  await db.exec(`
    create schema auth;
    create table auth.users (
      id uuid primary key default gen_random_uuid(),
      email text
    );
    create or replace function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('app.current_user_id', true), '')::uuid
    $$;
  `)

  console.log('== Áp dụng migrations trong supabase/migrations ==')
  const files = readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort()
  for (const file of files) {
    const sql = patchForPglite(readFileSync(join(migrationsDir, file), 'utf8'), file)
    try {
      await db.exec(sql)
      console.log(`  OK   ${file}`)
    } catch (err) {
      console.error(`  FAIL ${file}:`, err.message)
      process.exit(1)
    }
  }

  console.log('== Cấp quyền bảng cho vai trò authenticated (mô phỏng Supabase, chưa có cơ chế GRANT tự động) ==')
  await db.exec(`
    grant usage on schema public to authenticated, anon;
    grant usage on schema auth to authenticated, anon;
    grant select, insert, update, delete on all tables in schema public to authenticated;
  `)

  console.log('\n== Kịch bản kiểm thử ==')
  const owner = randomUUID()
  const member = randomUUID()
  const viewer = randomUUID()
  const outsider = randomUUID()
  for (const [id, email] of [[owner, 'owner@test'], [member, 'member@test'], [viewer, 'viewer@test'], [outsider, 'outsider@test']]) {
    await db.query(`insert into auth.users (id, email) values ($1, $2)`, [id, email])
  }

  await asUser(db, owner)
  const wsRes = await db.query(`select public.create_workspace('AI Trainer test') as id`)
  const workspaceId = wsRes.rows[0].id
  check('Workspace được tạo qua create_workspace() (giải quyết vòng trứng-gà của RLS)', !!workspaceId)

  const memRes = await db.query(`select role from public.memberships where workspace_id = $1 and user_id = $2`, [workspaceId, owner])
  check('Owner có membership role=owner ngay sau bootstrap', memRes.rows[0]?.role === 'owner')

  await asAdmin(db)
  await db.query(`insert into public.memberships (workspace_id, user_id, role, accepted_at) values ($1,$2,'member',now())`, [workspaceId, member])
  await db.query(`insert into public.memberships (workspace_id, user_id, role, accepted_at) values ($1,$2,'viewer',now())`, [workspaceId, viewer])
  await db.query(
    `insert into public.pipeline_stages (workspace_id, customer_type, stage_key, label, sort_order, is_won) values
     ($1,'B2B','Khảo sát','Khảo sát',1,false), ($1,'B2B','Đã chốt','Đã chốt',5,true)`,
    [workspaceId]
  )

  await asUser(db, owner)
  const custRes = await db.query(
    `insert into public.customers (workspace_id, type, name, created_by) values ($1,'B2B','Công ty An Phát',$2) returning id`,
    [workspaceId, owner]
  )
  const customerId = custRes.rows[0].id
  check('Owner tạo được customer', !!customerId)

  // --- Ghi trực tiếp qua Data API (giống frontend), KHÔNG gửi created_by — đúng lỗi thật đã gặp khi thử /live ---
  const inboxNoCreatedByRes = await db.query(
    `insert into public.inbox_items (workspace_id, content) values ($1,'Ghi nhanh không kèm created_by') returning created_by`,
    [workspaceId]
  )
  check('Trigger force_created_by tự gán created_by = auth.uid() khi client không gửi', inboxNoCreatedByRes.rows[0].created_by === owner)

  const outsiderIdSent = randomUUID()
  const inboxSpoofRes = await db.query(
    `insert into public.inbox_items (workspace_id, content, created_by) values ($1,'Thử giả mạo người tạo',$2) returning created_by`,
    [workspaceId, outsiderIdSent]
  )
  check('Trigger force_created_by ghi đè created_by client cố giả mạo bằng auth.uid() thật', inboxSpoofRes.rows[0].created_by === owner)

  // --- Member tạo task cho chính mình ---
  const taskRes = await asUser(db, member).then(() =>
    db.query(
      `insert into public.tasks (workspace_id, title, assignee_id, created_by) values ($1,'Gửi đề cương',$2,$2) returning id, revision`,
      [workspaceId, member]
    )
  )
  const taskId = taskRes.rows[0].id
  check('Member tạo được task trong workspace của mình', !!taskId)
  check('Task mới có revision = 1', taskRes.rows[0].revision === 1)

  // --- Viewer không được tạo task ---
  await asUser(db, viewer)
  let viewerInsertBlocked = false
  try {
    await db.query(`insert into public.tasks (workspace_id, title, assignee_id, created_by) values ($1,'Việc của viewer',$2,$2)`, [workspaceId, viewer])
  } catch { viewerInsertBlocked = true }
  check('Viewer KHÔNG tạo được task (RLS insert chặn đúng)', viewerInsertBlocked)

  const viewerReadRes = await db.query(`select id from public.tasks where workspace_id = $1`, [workspaceId])
  check('Viewer vẫn đọc được danh sách task trong workspace', viewerReadRes.rows.length >= 1)

  // --- Người ngoài workspace không thấy gì ---
  await asUser(db, outsider)
  const outsiderReadRes = await db.query(`select id from public.tasks where workspace_id = $1`, [workspaceId])
  check('Người ngoài workspace KHÔNG đọc được task nào (RLS select chặn đúng)', outsiderReadRes.rows.length === 0)

  // --- Member không sửa được task do người khác tạo ---
  await asUser(db, owner)
  const task2Res = await db.query(
    `insert into public.tasks (workspace_id, title, assignee_id, created_by) values ($1,'Việc của owner',$2,$2) returning id`,
    [workspaceId, owner]
  )
  const task2Id = task2Res.rows[0].id

  await asUser(db, member)
  const memberUpdateOthers = await db.query(`update public.tasks set title = 'Sửa trộm' where id = $1 returning id`, [task2Id])
  check('Member KHÔNG sửa được task của owner (0 dòng ảnh hưởng do RLS update)', memberUpdateOthers.rows.length === 0)

  // --- Member sửa task của chính mình: revision tăng, ownership được bảo vệ ---
  const before = await db.query(`select revision from public.tasks where id = $1`, [taskId])
  const memberUpdateOwn = await db.query(`update public.tasks set title = 'Gửi đề cương (đã sửa)' where id = $1 returning revision`, [taskId])
  check('Member sửa được task của chính mình', memberUpdateOwn.rows.length === 1)
  check('Trigger bump_revision tăng revision đúng 1 sau update', memberUpdateOwn.rows[0].revision === before.rows[0].revision + 1)

  const fakeWorkspace = randomUUID()
  await db.query(`update public.tasks set workspace_id = $1, created_by = $2 where id = $3`, [fakeWorkspace, outsider, taskId])
  const afterProtect = await db.query(`select workspace_id, created_by from public.tasks where id = $1`, [taskId])
  check('Trigger protect_ownership_columns giữ nguyên workspace_id dù client cố đổi', afterProtect.rows[0].workspace_id === workspaceId)
  check('Trigger protect_ownership_columns giữ nguyên created_by dù client cố đổi', afterProtect.rows[0].created_by === member)

  // --- Pipeline stage validation ---
  await asUser(db, owner)
  let invalidStageBlocked = false
  try {
    await db.query(
      `insert into public.opportunities (workspace_id, customer_id, customer_type, title, stage, owner_id, created_by)
       values ($1,$2,'B2B','Workshop AI','Giai đoạn chưa cấu hình',$3,$3)`,
      [workspaceId, customerId, owner]
    )
  } catch { invalidStageBlocked = true }
  check('Trigger validate_opportunity_stage chặn giai đoạn chưa cấu hình trong pipeline_stages', invalidStageBlocked)

  const oppRes = await db.query(
    `insert into public.opportunities (workspace_id, customer_id, customer_type, title, stage, owner_id, created_by)
     values ($1,$2,'B2B','Workshop AI','Khảo sát',$3,$3) returning id`,
    [workspaceId, customerId, owner]
  )
  check('Tạo opportunity với giai đoạn hợp lệ thành công', !!oppRes.rows[0].id)

  // --- inbox_item_targets: chặn target không tồn tại, chống ghi trùng ---
  const inboxRes = await db.query(
    `insert into public.inbox_items (workspace_id, content, created_by) values ($1,'Gửi đề cương cho An Phát thứ Sáu',$2) returning id`,
    [workspaceId, owner]
  )
  const inboxId = inboxRes.rows[0].id
  const conversionRequestId = randomUUID()

  let invalidTargetBlocked = false
  try {
    await db.query(
      `insert into public.inbox_item_targets (workspace_id, inbox_item_id, target_type, target_id, conversion_request_id)
       values ($1,$2,'task',$3,$4)`,
      [workspaceId, inboxId, randomUUID(), conversionRequestId]
    )
  } catch { invalidTargetBlocked = true }
  check('Trigger validate_inbox_target chặn target không tồn tại trong workspace', invalidTargetBlocked)

  const targetRes = await db.query(
    `insert into public.inbox_item_targets (workspace_id, inbox_item_id, target_type, target_id, conversion_request_id)
     values ($1,$2,'task',$3,$4) returning id`,
    [workspaceId, inboxId, taskId, conversionRequestId]
  )
  check('inbox_item_targets trỏ đúng task đã tồn tại thành công', !!targetRes.rows[0].id)

  let duplicateTargetBlocked = false
  try {
    await db.query(
      `insert into public.inbox_item_targets (workspace_id, inbox_item_id, target_type, target_id, conversion_request_id)
       values ($1,$2,'task',$3,$4)`,
      [workspaceId, inboxId, taskId, conversionRequestId]
    )
  } catch { duplicateTargetBlocked = true }
  check('Ràng buộc unique chặn ghi trùng cùng một target cho một inbox item (retry an toàn)', duplicateTargetBlocked)

  // --- reminder_deliveries: chống gửi trùng/ngày, tự đọc lịch sử của chính mình dù bảng owner-only ---
  await asAdmin(db)
  await db.query(
    `insert into public.reminder_deliveries (workspace_id, user_id, for_date, status) values ($1,$2, current_date, 'sent')`,
    [workspaceId, member]
  )
  let duplicateReminderBlocked = false
  try {
    await db.query(
      `insert into public.reminder_deliveries (workspace_id, user_id, for_date, status) values ($1,$2, current_date, 'sent')`,
      [workspaceId, member]
    )
  } catch { duplicateReminderBlocked = true }
  check('Ràng buộc unique chặn gửi 2 bản email nhắc việc cùng ngày cho 1 người', duplicateReminderBlocked)

  await asUser(db, member)
  const selfReminderRead = await db.query(`select id from public.reminder_deliveries where user_id = $1`, [member])
  check('Member tự đọc được lịch sử gửi nhắc việc của chính mình dù bảng chỉ owner mới có quyền chung', selfReminderRead.rows.length === 1)

  // --- content_publications: một lượt/kênh ---
  await asUser(db, owner)
  const contentRes = await db.query(
    `insert into public.content_items (workspace_id, title, audience, pillar, created_by) values ($1,'Bài viết demo','B2B','guide',$2) returning id`,
    [workspaceId, owner]
  )
  const contentId = contentRes.rows[0].id
  await db.query(`insert into public.content_publications (workspace_id, content_id, channel) values ($1,$2,'facebook')`, [workspaceId, contentId])
  let duplicateChannelBlocked = false
  try {
    await db.query(`insert into public.content_publications (workspace_id, content_id, channel) values ($1,$2,'facebook')`, [workspaceId, contentId])
  } catch { duplicateChannelBlocked = true }
  check('Ràng buộc unique(content_id, channel) chặn hai lượt đăng trên cùng một kênh', duplicateChannelBlocked)

  // ============================================================
  // Lệnh máy chủ (RPC): inbox.convert, task.complete, opportunity.createProject
  // ============================================================

  // --- rpc_inbox_convert: một inbox tạo nhiều đích trong một giao dịch, retry không nhân đôi ---
  await asUser(db, owner)
  const inbox2Res = await db.query(
    `insert into public.inbox_items (workspace_id, content, created_by) values ($1,'Công ty B cần workshop, thứ Sáu gửi đề cương',$2) returning id`,
    [workspaceId, owner]
  )
  const inbox2Id = inbox2Res.rows[0].id
  const convertRequestId = randomUUID()
  const convertTargets = JSON.stringify([
    { type: 'task', payload: { title: 'Gửi đề cương cho Công ty B', dueAt: '2026-09-25' } },
    { type: 'note', payload: { title: 'Ghi chú cuộc gọi Công ty B', content: 'Cần workshop cho quản lý cấp trung', noteType: 'call' } }
  ])
  const convertRes1 = await db.query(
    `select public.rpc_inbox_convert($1,$2,$3::jsonb,$4) as result`,
    [workspaceId, inbox2Id, convertTargets, convertRequestId]
  )
  const convertBody1 = convertRes1.rows[0].result
  check('rpc_inbox_convert trả status success', convertBody1.status === 'success')
  check('rpc_inbox_convert tạo đúng 2 bản ghi đích (task + note) trong 1 lần gọi', convertBody1.createdTargets?.length === 2)

  const inboxAfter = await db.query(`select status from public.inbox_items where id = $1`, [inbox2Id])
  check('Inbox item chuyển sang processed sau khi convert', inboxAfter.rows[0].status === 'processed')

  const taskCountBefore = await db.query(`select count(*)::int as n from public.tasks where source_inbox_id = $1`, [inbox2Id])
  const convertRes2 = await db.query(
    `select public.rpc_inbox_convert($1,$2,$3::jsonb,$4) as result`,
    [workspaceId, inbox2Id, convertTargets, convertRequestId]
  )
  const convertBody2 = convertRes2.rows[0].result
  const taskCountAfter = await db.query(`select count(*)::int as n from public.tasks where source_inbox_id = $1`, [inbox2Id])
  check('Gọi lại rpc_inbox_convert cùng requestId trả đúng 2 ID cũ (idempotent)', JSON.stringify(convertBody2) === JSON.stringify(convertBody1))
  check('Gọi lại rpc_inbox_convert cùng requestId KHÔNG tạo thêm task (không nhân đôi)', taskCountAfter.rows[0].n === taskCountBefore.rows[0].n)

  // Viewer không được phép convert (RLS chặn insert vào tasks bên trong hàm).
  await asUser(db, viewer)
  let viewerConvertBlocked = false
  try {
    await db.query(
      `select public.rpc_inbox_convert($1,$2,$3::jsonb,$4) as result`,
      [workspaceId, inbox2Id, JSON.stringify([{ type: 'task', payload: { title: 'Việc của viewer' } }]), randomUUID()]
    )
  } catch { viewerConvertBlocked = true }
  check('Viewer KHÔNG gọi được rpc_inbox_convert để tạo task (RLS chặn bên trong hàm)', viewerConvertBlocked)

  // --- rpc_task_complete: kiểm tra revision (conflict), sinh đúng 1 occurrence kế tiếp, idempotent khi gọi lại ---
  await asAdmin(db)
  const seriesRes = await db.query(
    `insert into public.task_recurrence_series (workspace_id, recurrence, anchor_date, created_by) values ($1,'weekly','2026-09-18',$2) returning id`,
    [workspaceId, owner]
  )
  const seriesId = seriesRes.rows[0].id

  await asUser(db, member)
  const recTaskRes = await db.query(
    `insert into public.tasks (workspace_id, title, due_at, assignee_id, recurring_series_id, created_by)
     values ($1,'Họp giao ban tuần','2026-09-18',$2,$3,$2) returning id, revision`,
    [workspaceId, member, seriesId]
  )
  const recTaskId = recTaskRes.rows[0].id

  let staleConflict = null
  const staleRes = await db.query(
    `select public.rpc_task_complete($1,$2,$3,$4) as result`,
    [workspaceId, recTaskId, 99, randomUUID()]
  )
  staleConflict = staleRes.rows[0].result
  check('rpc_task_complete trả conflict khi revision không khớp', staleConflict.status === 'conflict')

  const completeRequestId = randomUUID()
  const completeRes1 = await db.query(
    `select public.rpc_task_complete($1,$2,$3,$4) as result`,
    [workspaceId, recTaskId, recTaskRes.rows[0].revision, completeRequestId]
  )
  const completeBody1 = completeRes1.rows[0].result
  check('rpc_task_complete trả success với revision đúng', completeBody1.status === 'success')
  check('rpc_task_complete sinh occurrence kế tiếp cách 7 ngày', completeBody1.nextOccurrence?.dueAt === '2026-09-25')

  const seriesCountBefore = await db.query(`select count(*)::int as n from public.tasks where recurring_series_id = $1`, [seriesId])
  const completeRes2 = await db.query(
    `select public.rpc_task_complete($1,$2,$3,$4) as result`,
    [workspaceId, recTaskId, recTaskRes.rows[0].revision, completeRequestId]
  )
  const seriesCountAfter = await db.query(`select count(*)::int as n from public.tasks where recurring_series_id = $1`, [seriesId])
  check('Gọi lại rpc_task_complete cùng requestId trả đúng kết quả cũ (idempotent)', JSON.stringify(completeRes2.rows[0].result) === JSON.stringify(completeBody1))
  check('Gọi lại rpc_task_complete cùng requestId KHÔNG sinh thêm occurrence', seriesCountAfter.rows[0].n === seriesCountBefore.rows[0].n)

  // --- rpc_opportunity_create_project: chặn khi cơ hội chưa chốt, tạo đúng 1 dự án kể cả khi retry ---
  await asUser(db, owner)
  const notWonRes = await db.query(
    `select public.rpc_opportunity_create_project($1,$2,'{}'::jsonb,$3) as result`,
    [workspaceId, oppRes.rows[0].id, randomUUID()]
  )
  check('rpc_opportunity_create_project chặn khi cơ hội chưa ở giai đoạn is_won', notWonRes.rows[0].result.status === 'validation_error')

  await db.query(`update public.opportunities set stage = 'Đã chốt' where id = $1`, [oppRes.rows[0].id])
  const createProjectRequestId = randomUUID()
  const projectRes1 = await db.query(
    `select public.rpc_opportunity_create_project($1,$2,'{"title":"Workshop AI cho An Phát"}'::jsonb,$3) as result`,
    [workspaceId, oppRes.rows[0].id, createProjectRequestId]
  )
  check('rpc_opportunity_create_project tạo dự án thành công khi đã chốt', projectRes1.rows[0].result.status === 'success')
  const projectId1 = projectRes1.rows[0].result.projectId

  const projectCountBefore = await db.query(`select count(*)::int as n from public.projects where opportunity_id = $1`, [oppRes.rows[0].id])
  const projectRes2 = await db.query(
    `select public.rpc_opportunity_create_project($1,$2,'{"title":"Workshop AI cho An Phát"}'::jsonb,$3) as result`,
    [workspaceId, oppRes.rows[0].id, createProjectRequestId]
  )
  const projectCountAfter = await db.query(`select count(*)::int as n from public.projects where opportunity_id = $1`, [oppRes.rows[0].id])
  check('Gọi lại rpc_opportunity_create_project cùng requestId trả đúng projectId cũ', projectRes2.rows[0].result.projectId === projectId1)
  check('Gọi lại rpc_opportunity_create_project cùng requestId KHÔNG tạo dự án thứ hai', projectCountAfter.rows[0].n === projectCountBefore.rows[0].n)

  // --- Chưa đăng nhập (auth.uid() null, mô phỏng vai trò anon) phải bị từ chối rõ ràng ngay trong hàm ---
  await db.query(`select set_config('app.current_user_id', '', false)`)
  await db.exec(`set role authenticated`)
  const anonInboxRes = await db.query(
    `select public.rpc_inbox_convert($1,$2,'[]'::jsonb,$3) as result`,
    [workspaceId, inbox2Id, randomUUID()]
  )
  check('rpc_inbox_convert trả forbidden khi chưa đăng nhập (auth.uid() null)', anonInboxRes.rows[0].result.status === 'forbidden')

  const anonTaskRes = await db.query(
    `select public.rpc_task_complete($1,$2,1,$3) as result`,
    [workspaceId, recTaskId, randomUUID()]
  )
  check('rpc_task_complete trả forbidden khi chưa đăng nhập', anonTaskRes.rows[0].result.status === 'forbidden')

  const anonProjectRes = await db.query(
    `select public.rpc_opportunity_create_project($1,$2,'{}'::jsonb,$3) as result`,
    [workspaceId, oppRes.rows[0].id, randomUUID()]
  )
  check('rpc_opportunity_create_project trả forbidden khi chưa đăng nhập', anonProjectRes.rows[0].result.status === 'forbidden')

  // --- Đã đăng nhập nhưng KHÔNG có quyền sửa bản ghi cụ thể -> RLS âm thầm chặn UPDATE (0 dòng), hàm phải
  // phát hiện và trả forbidden thay vì "success" giả (lỗi thật tìm thấy khi rà soát code, vá ở 0011). ---
  await asUser(db, viewer)
  const viewerCompleteRes = await db.query(
    `select public.rpc_task_complete($1,$2,$3,$4) as result`,
    [workspaceId, task2Id, 1, randomUUID()]
  )
  check(
    'rpc_task_complete trả forbidden (không phải success giả) khi viewer gọi trên task không có quyền sửa',
    viewerCompleteRes.rows[0].result.status === 'forbidden'
  )

  await asAdmin(db)
  const inbox3Res = await db.query(
    `insert into public.inbox_items (workspace_id, content, created_by) values ($1,'Mục viewer không có quyền sửa',$2) returning id`,
    [workspaceId, owner]
  )
  const inbox3Id = inbox3Res.rows[0].id

  await asUser(db, viewer)
  const viewerConvertRes = await db.query(
    `select public.rpc_inbox_convert($1,$2,'[]'::jsonb,$3) as result`,
    [workspaceId, inbox3Id, randomUUID()]
  )
  check(
    'rpc_inbox_convert trả forbidden (không phải success giả) khi viewer gọi trên inbox item không có quyền sửa',
    viewerConvertRes.rows[0].result.status === 'forbidden'
  )

  // --- calendar_events phải có RLS: bảng này bị bỏ sót ở 0006, vá ở 0011 ---
  await asUser(db, owner)
  const connRes = await db.query(
    `insert into public.calendar_connections (workspace_id, user_id) values ($1,$2) returning id`,
    [workspaceId, owner]
  )
  const connectionId = connRes.rows[0].id
  const ownerEventRes = await db.query(
    `insert into public.calendar_events (workspace_id, connection_id, external_event_id, calendar_id, start, "end")
     values ($1,$2,'ext-1','primary', now(), now() + interval '1 hour') returning id`,
    [workspaceId, connectionId]
  )
  check('Owner tạo được calendar_events cho connection của mình', !!ownerEventRes.rows[0].id)

  await asUser(db, member)
  let memberCalendarWriteBlocked = false
  try {
    await db.query(
      `insert into public.calendar_events (workspace_id, connection_id, external_event_id, calendar_id, start, "end")
       values ($1,$2,'ext-2','primary', now(), now() + interval '1 hour')`,
      [workspaceId, connectionId]
    )
  } catch { memberCalendarWriteBlocked = true }
  check('Member KHÔNG ghi được calendar_events của connection người khác (RLS chặn đúng)', memberCalendarWriteBlocked)
  const memberCalendarReadRes = await db.query(`select id from public.calendar_events where workspace_id = $1`, [workspaceId])
  check('Member vẫn đọc được calendar_events trong workspace của mình', memberCalendarReadRes.rows.length >= 1)

  await asUser(db, outsider)
  const outsiderCalendarReadRes = await db.query(`select id from public.calendar_events where workspace_id = $1`, [workspaceId])
  check('Người ngoài workspace KHÔNG đọc được calendar_events (lỗi rò rỉ đã vá ở 0011)', outsiderCalendarReadRes.rows.length === 0)

  // Quay lại một người dùng thật (owner) trước khi đọc dữ liệu — các câu lệnh trên cố tình bỏ auth.uid() để test forbidden.
  await asUser(db, owner)

  // --- Tìm kiếm tiếng Việt có dấu / không dấu (index unaccent + trgm) ---
  const searchAccented = await db.query(
    `select id from public.tasks where f_unaccent(lower(title)) ilike f_unaccent(lower('%đề cương%'))`
  )
  const searchUnaccented = await db.query(
    `select id from public.tasks where f_unaccent(lower(title)) ilike f_unaccent(lower('%de cuong%'))`
  )
  check('Tìm "đề cương" (có dấu) ra kết quả', searchAccented.rows.length >= 1)
  check('Tìm "de cuong" (không dấu) vẫn ra đúng kết quả', searchUnaccented.rows.length >= 1)

  console.log(`\n== Kết quả: ${passed} đạt, ${failed} lỗi trên tổng ${passed + failed} kiểm tra ==`)
  await db.close()
  if (failed > 0) process.exit(1)
}

main().catch(err => { console.error('Lỗi không mong đợi:', err); process.exit(1) })
