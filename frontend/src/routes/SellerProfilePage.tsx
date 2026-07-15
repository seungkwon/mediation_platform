import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { createMySellerProfile, updateMySellerProfile } from '@/api/sellers'
import { PagePlaceholder } from '@/components/common/PagePlaceholder'
import { SellerProfileForm } from '@/components/seller/SellerProfileForm'
import { usePortfoliosBySeller } from '@/hooks/usePortfolios'
import { useSellerProfile } from '@/hooks/useSellerProfile'
import { extractErrorMessage } from '@/lib/errors'
import { mediaUrl } from '@/lib/media'
import { useAuthStore } from '@/store/authStore'

export default function SellerProfilePage() {
  const { id } = useParams<{ id: string }>()
  const currentUser = useAuthStore((state) => state.user)
  const isOwner = !!currentUser && currentUser.id === id
  const [editing, setEditing] = useState(false)
  const queryClient = useQueryClient()

  const profileQuery = useSellerProfile(id)
  const portfoliosQuery = usePortfoliosBySeller(profileQuery.isSuccess ? id : undefined)

  const createMutation = useMutation({
    mutationFn: createMySellerProfile,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['seller-profile', id] }),
  })
  const updateMutation = useMutation({
    mutationFn: updateMySellerProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-profile', id] })
      setEditing(false)
    },
  })

  if (!id) return null

  if (profileQuery.isLoading) {
    return <PagePlaceholder title="판매자 프로필" description="불러오는 중..." />
  }

  if (profileQuery.isError) {
    if (!isOwner) {
      return <PagePlaceholder title="판매자 프로필" description="등록된 판매자 프로필이 없습니다." />
    }
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">판매자 프로필 등록</h1>
        <p className="text-neutral-500 dark:text-neutral-400">
          판매자 프로필을 등록하면 서비스 요청에 견적을 제출하고 포트폴리오를 작성할 수 있습니다.
        </p>
        <SellerProfileForm
          onSubmit={(payload) => createMutation.mutate(payload)}
          isSubmitting={createMutation.isPending}
          submitLabel="등록"
        />
        {createMutation.isError && <p className="text-sm text-red-500">{extractErrorMessage(createMutation.error)}</p>}
      </div>
    )
  }

  const profile = profileQuery.data
  if (!profile) return null

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-12">
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">{profile.user.name}</h1>
          {isOwner && (
            <button
              type="button"
              onClick={() => setEditing((v) => !v)}
              className="text-sm font-medium text-primary-600 dark:text-primary-400"
            >
              {editing ? '취소' : '프로필 수정'}
            </button>
          )}
        </div>

        {editing ? (
          <>
            <SellerProfileForm
              initial={profile}
              onSubmit={(payload) => updateMutation.mutate(payload)}
              isSubmitting={updateMutation.isPending}
              submitLabel="저장"
            />
            {updateMutation.isError && (
              <p className="text-sm text-red-500">{extractErrorMessage(updateMutation.error)}</p>
            )}
          </>
        ) : (
          <>
            {profile.headline && <p className="text-lg text-neutral-700 dark:text-neutral-200">{profile.headline}</p>}
            <div className="flex flex-wrap gap-3 text-sm text-neutral-500 dark:text-neutral-400">
              {profile.career_years != null && <span>경력 {profile.career_years}년</span>}
              <span>
                평점 {profile.average_rating ?? '-'} ({profile.review_count}건)
              </span>
            </div>
            {profile.bio && <p className="whitespace-pre-line text-neutral-600 dark:text-neutral-300">{profile.bio}</p>}
          </>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">포트폴리오</h2>
          {isOwner && (
            <Link to="/portfolios/new" className="text-sm font-medium text-primary-600 dark:text-primary-400">
              새 글 작성
            </Link>
          )}
        </div>

        {portfoliosQuery.data?.length === 0 && (
          <p className="text-neutral-500 dark:text-neutral-400">등록된 포트폴리오가 없습니다.</p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {portfoliosQuery.data?.map((post) => {
            const card = (
              <>
                {post.thumbnail ? (
                  <img src={mediaUrl(post.thumbnail)} alt="" className="aspect-video w-full object-cover" />
                ) : (
                  <div className="flex aspect-video w-full items-center justify-center bg-neutral-100 text-neutral-400 dark:bg-neutral-800">
                    이미지 없음
                  </div>
                )}
                <div className="p-3">
                  <p className="font-medium text-neutral-900 dark:text-neutral-50">{post.title}</p>
                  {post.status === 'draft' && <span className="text-xs text-neutral-400">초안</span>}
                </div>
              </>
            )
            return isOwner ? (
              <Link
                key={post.id}
                to={`/portfolios/${post.id}/edit`}
                className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800"
              >
                {card}
              </Link>
            ) : (
              <div key={post.id} className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800">
                {card}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
