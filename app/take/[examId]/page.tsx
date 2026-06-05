import { requireRole } from '@/lib/auth'
import TakeExam from './take-exam'

export default async function Page({ params }: { params: Promise<{ examId: string }> }) {
  await requireRole('student')
  const { examId } = await params
  return <TakeExam examId={examId} />
}
