'use client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { Question } from '@/app/questions/questions-manager'
import { qk, questionsApi, type QuestionInput } from './questions'

// A cached row carries a client-stable `clientId` (used as the animation/React key) separate from the
// server `id` (used for mutations). Keeping clientId stable across the optimistic→server reconcile is
// what prevents the row from exit+re-entering (flicker) when a create settles.
export type QItem = Question & { clientId: string }

const tempId = () => `tmp_${crypto.randomUUID()}`
export const isTemp = (id: string) => id.startsWith('tmp_')

const seed = (initial: Question[]): QItem[] => initial.map((q) => ({ ...q, clientId: q.id }))

// QUERY — seeded from the RSC. No GET proxy, so the optimistic cache is the source of truth for the
// session (mutations keep it correct); a full navigation re-seeds from the server via the RSC.
export function useQuestions(initial: Question[]) {
  const data = seed(initial)
  return useQuery({
    queryKey: qk.all,
    queryFn: async () => data,
    initialData: data,
    staleTime: Infinity, // never auto-refetch the placeholder over our optimistic state
  })
}

export function useCreateQuestion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: QuestionInput) => questionsApi.create(input),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: qk.all })
      const previous = qc.getQueryData<QItem[]>(qk.all)
      const clientId = tempId()
      qc.setQueryData<QItem[]>(qk.all, (old = []) => [...old, { ...input, id: clientId, clientId }])
      return { previous, clientId }
    },
    onSuccess: (created, _input, ctx) => {
      if (created?.id && ctx?.clientId) {
        // keep clientId stable; take the server id + fields → no exit/re-enter flicker
        qc.setQueryData<QItem[]>(qk.all, (old = []) =>
          old.map((q) => (q.clientId === ctx.clientId ? { ...created, clientId: ctx.clientId } : q)),
        )
      }
    },
    onError: (err, _input, ctx) => {
      if (ctx?.previous) qc.setQueryData(qk.all, ctx.previous)
      toast.error('Could not save question', { description: (err as Error).message })
    },
  })
}

export function useUpdateQuestion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: QuestionInput }) => questionsApi.update(id, input),
    onMutate: async ({ id, input }) => {
      await qc.cancelQueries({ queryKey: qk.all })
      const previous = qc.getQueryData<QItem[]>(qk.all)
      qc.setQueryData<QItem[]>(qk.all, (old = []) => old.map((q) => (q.id === id ? { ...q, ...input, id } : q)))
      return { previous }
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(qk.all, ctx.previous)
      toast.error('Could not update question', { description: (err as Error).message })
    },
  })
}

export function useDeleteQuestion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => questionsApi.remove(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: qk.all })
      const previous = qc.getQueryData<QItem[]>(qk.all)
      qc.setQueryData<QItem[]>(qk.all, (old = []) => old.filter((q) => q.id !== id))
      return { previous }
    },
    onError: (err, _id, ctx) => {
      if (ctx?.previous) qc.setQueryData(qk.all, ctx.previous)
      toast.error('Could not delete question', { description: (err as Error).message })
    },
    onSuccess: () => toast.success('Question deleted'),
  })
}
