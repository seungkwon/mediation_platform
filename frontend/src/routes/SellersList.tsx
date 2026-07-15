import { useState } from 'react'
import { Link } from 'react-router-dom'

import { useCategories } from '@/hooks/useCategories'
import { useSellers } from '@/hooks/useSellerProfile'

export default function SellersList() {
  const [categoryId, setCategoryId] = useState('')
  const { data: categories } = useCategories()
  const sellersQuery = useSellers(categoryId ? { category_id: categoryId } : undefined)

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">판매자 찾기</h1>

      <select
        value={categoryId}
        onChange={(event) => setCategoryId(event.target.value)}
        className="w-full max-w-xs rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
      >
        <option value="">전체 카테고리</option>
        {categories?.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>

      {sellersQuery.isLoading && <p className="text-neutral-500 dark:text-neutral-400">불러오는 중...</p>}
      {sellersQuery.data?.length === 0 && (
        <p className="text-neutral-500 dark:text-neutral-400">등록된 판매자가 없습니다.</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sellersQuery.data?.map((seller) => (
          <Link
            key={seller.id}
            to={`/sellers/${seller.user.id}`}
            className="flex flex-col gap-2 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
          >
            <p className="font-medium text-neutral-900 dark:text-neutral-50">{seller.user.name}</p>
            {seller.headline && <p className="text-sm text-neutral-600 dark:text-neutral-300">{seller.headline}</p>}
            <div className="flex flex-wrap gap-3 text-xs text-neutral-400">
              {seller.career_years != null && <span>경력 {seller.career_years}년</span>}
              <span>
                평점 {seller.average_rating ?? '-'} ({seller.review_count}건)
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
