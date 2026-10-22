// app/admin/ingest/page.tsx
import { requireAdmin } from '@/lib/requireAdmin'
import { IngestForm } from './IngestForm'

export const dynamic = 'force-dynamic'

export default async function AdminIngestPage() {
  await requireAdmin()
  return <IngestForm />
}
