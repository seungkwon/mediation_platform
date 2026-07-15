import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useParams } from 'react-router-dom'
import { z } from 'zod'

import { openQuote, selectQuote, submitQuote } from '@/api/quotes'
import { cancelServiceRequest } from '@/api/serviceRequests'
import { PagePlaceholder } from '@/components/common/PagePlaceholder'
import { StatusBadge } from '@/components/common/StatusBadge'
import { TextField } from '@/components/common/TextField'
import { useQuotesForRequest } from '@/hooks/useQuotes'
import { useServiceRequest } from '@/hooks/useServiceRequests'
import { extractErrorMessage } from '@/lib/errors'
import { formatCurrency, formatDateTime } from '@/lib/format'
import { mediaUrl } from '@/lib/media'
import { useAuthStore } from '@/store/authStore'

const quoteSchema = z.object({
  price: z.string().min(1, '가격을 입력해주세요.'),
  delivery_days: z.string().min(1, '작업 기간을 입력해주세요.'),
  description: z.string().min(1, '제안 내용을 입력해주세요.'),
})

type QuoteFormValues = z.infer<typeof quoteSchema>

export default function RequestDetail() {
  const { id } = useParams<{ id: string }>()
  const user = useAuthStore((state) => state.user)
  const queryClient = useQueryClient()

  const requestQuery = useServiceRequest(id)
  const quotesQuery = useQuotesForRequest(id)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<QuoteFormValues>({ resolver: zodResolver(quoteSchema) })

  const quoteMutation = useMutation({
    mutationFn: (values: QuoteFormValues) =>
      submitQuote(id!, {
        price: Number(values.price),
        delivery_days: Number(values.delivery_days),
        description: values.description,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes', id] })
      queryClient.invalidateQueries({ queryKey: ['service-request', id] })
    },
  })

  const openMutation = useMutation({
    mutationFn: (quoteId: string) => openQuote(quoteId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['quotes', id] }),
  })

  const selectMutation = useMutation({
    mutationFn: (quoteId: string) => selectQuote(quoteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes', id] })
      queryClient.invalidateQueries({ queryKey: ['service-request', id] })
    },
  })

  const cancelMutation = useMutation({
    mutationFn: () => cancelServiceRequest(id!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['service-request', id] }),
  })

  if (!id) return null
  if (requestQuery.isLoading) {
    return <PagePlaceholder title="서비스 요청 상세" description="불러오는 중..." />
  }
  if (requestQuery.isError || !requestQuery.data) {
    return <PagePlaceholder title="서비스 요청 상세" description="요청을 찾을 수 없습니다." />
  }

  const request = requestQuery.data
  const isBuyer = user?.id === request.buyer.id
  const isOpen = request.status === 'open'
  const myQuote = quotesQuery.data?.find((quote) => quote.seller.id === user?.id)
  const canSubmitQuote = !isBuyer && isOpen && !!user?.has_seller_profile

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-12">
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <StatusBadge status={request.status} />
          {isBuyer && isOpen && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('이 요청을 취소하시겠습니까?')) cancelMutation.mutate()
              }}
              className="text-sm font-medium text-red-500"
            >
              요청 취소
            </button>
          )}
        </div>
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">{request.title}</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          작성자 {request.buyer.name} · 마감 {formatDateTime(request.bid_deadline)}
        </p>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {request.budget_min != null || request.budget_max != null
            ? `예산 ${request.budget_min?.toLocaleString() ?? '?'} ~ ${request.budget_max?.toLocaleString() ?? '?'}원`
            : '예산 미정'}
        </p>
        <p className="whitespace-pre-line text-neutral-700 dark:text-neutral-200">{request.description}</p>

        {request.images.length > 0 && (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {request.images.map((image) => (
              <img
                key={image.id}
                src={mediaUrl(image.file_path)}
                alt=""
                className="aspect-square w-full rounded-lg object-cover"
              />
            ))}
          </div>
        )}
        {request.attachments.length > 0 && (
          <ul className="flex flex-col gap-1 text-sm text-primary-600 dark:text-primary-400">
            {request.attachments.map((attachment) => (
              <li key={attachment.id}>
                <a href={mediaUrl(attachment.file_path)} target="_blank" rel="noreferrer">
                  {attachment.original_filename}
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      {canSubmitQuote && (
        <section className="flex flex-col gap-4 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
            {myQuote ? '견적 수정' : '견적 제출'}
          </h2>
          <form
            onSubmit={handleSubmit((values) => quoteMutation.mutate(values))}
            className="flex flex-col gap-4"
            noValidate
          >
            <div className="grid grid-cols-2 gap-4">
              <TextField
                label="견적 가격 (원)"
                id="price"
                type="number"
                min={1}
                error={errors.price}
                {...register('price')}
              />
              <TextField
                label="작업 기간 (일)"
                id="delivery_days"
                type="number"
                min={1}
                error={errors.delivery_days}
                {...register('delivery_days')}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="quote-description" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                제안 내용
              </label>
              <textarea
                id="quote-description"
                rows={5}
                {...register('description')}
                className="rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
              />
              {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
            </div>
            {quoteMutation.isError && <p className="text-sm text-red-500">{extractErrorMessage(quoteMutation.error)}</p>}
            <button
              type="submit"
              disabled={quoteMutation.isPending}
              className="rounded-lg bg-primary-500 px-4 py-2.5 font-medium text-white transition-colors hover:bg-primary-600 disabled:opacity-60"
            >
              {quoteMutation.isPending ? '제출 중...' : myQuote ? '견적 수정' : '견적 제출'}
            </button>
          </form>
        </section>
      )}

      {!isBuyer && !user?.has_seller_profile && isOpen && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          견적을 제출하려면 판매자 프로필을 먼저 등록해야 합니다.
        </p>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">견적 목록</h2>
        {quotesQuery.isLoading && <p className="text-neutral-500 dark:text-neutral-400">불러오는 중...</p>}
        {quotesQuery.data?.length === 0 && (
          <p className="text-neutral-500 dark:text-neutral-400">아직 제출된 견적이 없습니다.</p>
        )}
        <div className="flex flex-col gap-3">
          {quotesQuery.data?.map((quote) => (
            <div
              key={quote.id}
              className="flex flex-col gap-2 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-neutral-900 dark:text-neutral-50">{quote.seller.name}</span>
                <StatusBadge status={quote.status} />
              </div>
              {quote.price != null ? (
                <>
                  <p className="text-sm text-neutral-700 dark:text-neutral-200">
                    {formatCurrency(quote.price)} · {quote.delivery_days}일
                  </p>
                  <p className="whitespace-pre-line text-sm text-neutral-600 dark:text-neutral-300">
                    {quote.description}
                  </p>
                </>
              ) : (
                <p className="text-sm text-neutral-400">비공개 (오픈 전)</p>
              )}
              {isBuyer && isOpen && quote.status === 'submitted' && (
                <button
                  type="button"
                  onClick={() => openMutation.mutate(quote.id)}
                  disabled={openMutation.isPending}
                  className="self-start text-sm font-medium text-primary-600 dark:text-primary-400"
                >
                  오픈하기
                </button>
              )}
              {isBuyer && isOpen && quote.status === 'opened' && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('이 견적을 최종 선택하시겠습니까?')) selectMutation.mutate(quote.id)
                  }}
                  disabled={selectMutation.isPending}
                  className="self-start rounded-lg bg-primary-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-600"
                >
                  이 견적 선택
                </button>
              )}
            </div>
          ))}
        </div>
        {(openMutation.isError || selectMutation.isError) && (
          <p className="text-sm text-red-500">{extractErrorMessage(openMutation.error ?? selectMutation.error)}</p>
        )}
      </section>
    </div>
  )
}
