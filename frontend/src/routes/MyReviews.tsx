import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { createReview } from '@/api/reviews'
import { useMyServiceRequests } from '@/hooks/useServiceRequests'
import { useUserReviews } from '@/hooks/useReviews'
import { extractErrorMessage } from '@/lib/errors'
import { formatDateTime } from '@/lib/format'
import { useAuthStore } from '@/store/authStore'

const reviewSchema = z.object({
  rating: z.string().min(1, '평점을 선택해주세요.'),
  content: z.string().min(1, '리뷰 내용을 입력해주세요.'),
})

type ReviewFormValues = z.infer<typeof reviewSchema>

function ReviewForm({ requestId, onDone }: { requestId: string; onDone: () => void }) {
  const queryClient = useQueryClient()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReviewFormValues>({ resolver: zodResolver(reviewSchema), defaultValues: { rating: '5' } })

  const mutation = useMutation({
    mutationFn: (values: ReviewFormValues) =>
      createReview({ service_request_id: requestId, rating: Number(values.rating), content: values.content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
      onDone()
    },
  })

  return (
    <form
      onSubmit={handleSubmit((values) => mutation.mutate(values))}
      className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
      noValidate
    >
      <div className="flex flex-col gap-1">
        <label htmlFor={`rating-${requestId}`} className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          평점
        </label>
        <select
          id={`rating-${requestId}`}
          {...register('rating')}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        >
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n}점
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={`content-${requestId}`} className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          내용
        </label>
        <textarea
          id={`content-${requestId}`}
          rows={3}
          {...register('content')}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        />
        {errors.content && <p className="text-sm text-red-500">{errors.content.message}</p>}
      </div>
      {mutation.isError && <p className="text-sm text-red-500">{extractErrorMessage(mutation.error)}</p>}
      <button
        type="submit"
        disabled={mutation.isPending}
        className="self-start rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 disabled:opacity-60"
      >
        {mutation.isPending ? '등록 중...' : '리뷰 등록'}
      </button>
    </form>
  )
}

export default function MyReviews() {
  const user = useAuthStore((state) => state.user)
  const reviewsQuery = useUserReviews(user?.id)
  const requestsQuery = useMyServiceRequests()
  const [openFormId, setOpenFormId] = useState<string | null>(null)

  const awardedRequests = requestsQuery.data?.filter((request) => request.status === 'awarded') ?? []

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-12">
      <section className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">리뷰 작성하기</h1>
        {awardedRequests.length === 0 && (
          <p className="text-neutral-500 dark:text-neutral-400">리뷰를 작성할 수 있는 낙찰 완료 요청이 없습니다.</p>
        )}
        <div className="flex flex-col gap-3">
          {awardedRequests.map((request) => (
            <div key={request.id} className="flex flex-col gap-2">
              <div className="flex items-center justify-between rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
                <span className="font-medium text-neutral-900 dark:text-neutral-50">{request.title}</span>
                <button
                  type="button"
                  onClick={() => setOpenFormId((id) => (id === request.id ? null : request.id))}
                  className="text-sm font-medium text-primary-600 dark:text-primary-400"
                >
                  {openFormId === request.id ? '취소' : '리뷰 작성'}
                </button>
              </div>
              {openFormId === request.id && (
                <ReviewForm requestId={request.id} onDone={() => setOpenFormId(null)} />
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">내가 받은 리뷰</h2>
        {reviewsQuery.data?.length === 0 && (
          <p className="text-neutral-500 dark:text-neutral-400">받은 리뷰가 없습니다.</p>
        )}
        <div className="flex flex-col gap-3">
          {reviewsQuery.data?.map((review) => (
            <div
              key={review.id}
              className="flex flex-col gap-1 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-neutral-900 dark:text-neutral-50">{review.reviewer.name}</span>
                <span className="text-sm text-primary-600 dark:text-primary-400">{'★'.repeat(review.rating)}</span>
              </div>
              <p className="text-sm text-neutral-600 dark:text-neutral-300">{review.content}</p>
              <span className="text-xs text-neutral-400">{formatDateTime(review.created_at)}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
