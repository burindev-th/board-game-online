// Admin ยังไม่ได้ย้ายมาใช้ธีม — บังคับโหมดสว่างไว้ก่อน ลบไฟล์นี้เมื่อย้าย admin
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="theme-light min-h-screen bg-bg text-fg">{children}</div>;
}
