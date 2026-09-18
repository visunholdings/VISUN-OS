export const todayISO = () => new Date().toLocaleDateString('en-CA')
export const addDays = (date: string, count: number) => {
  const d = new Date(`${date}T12:00:00`)
  d.setDate(d.getDate() + count)
  return d.toLocaleDateString('en-CA')
}
export const dateLabel = (date?: string) => date ? new Intl.DateTimeFormat('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(`${date.slice(0,10)}T12:00:00`)) : 'Chưa đặt ngày'
export const dateTimeLabel = (date?: string) => date ? `${dateLabel(new Date(date).toLocaleDateString('en-CA'))} · ${new Intl.DateTimeFormat('vi-VN',{hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(date))}` : 'Chưa đặt lịch'
export const relativeLabel = (date?: string) => {
  if (!date) return 'Chưa đặt ngày'
  const day = date.slice(0,10)
  const now = todayISO()
  if (day === now) return 'Hôm nay'
  if (day === addDays(now,1)) return 'Ngày mai'
  if (day === addDays(now,-1)) return 'Hôm qua'
  return dateLabel(day)
}
export const normalise = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase().trim()
export const uid = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`
export const isoNow = () => new Date().toISOString()
export const currency = (n?: number) => n ? new Intl.NumberFormat('vi-VN').format(n) + ' ₫' : 'Chưa có căn cứ'
export const startOfWeek = (value: string) => {
  const date = new Date(`${value}T12:00:00`)
  const day = (date.getDay()+6)%7
  date.setDate(date.getDate()-day)
  return date.toLocaleDateString('en-CA')
}
