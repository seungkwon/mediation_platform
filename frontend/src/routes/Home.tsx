import { Link } from 'react-router-dom'

import { useCategories } from '@/hooks/useCategories'

export default function Home() {
  const { data: categories, isLoading, isError } = useCategories()

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-4 py-12">
      <section className="flex flex-col items-center gap-4 text-center">
        <span className="rounded-full bg-primary-100 px-4 py-1 text-sm font-medium text-primary-700 dark:bg-primary-900 dark:text-primary-200">
          중계 플랫폼
        </span>
        <h1 className="text-4xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
          필요한 서비스를 요청하고, 최적의 견적을 받아보세요
        </h1>
        <p className="max-w-lg text-neutral-600 dark:text-neutral-300">
          역경매 방식으로 여러 전문가의 견적을 비교하고 선택할 수 있습니다.
        </p>
        <Link
          to="/requests/new"
          className="rounded-lg bg-primary-500 px-5 py-2.5 font-medium text-white transition-colors hover:bg-primary-600 active:bg-primary-700"
        >
          서비스 요청하기
        </Link>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-neutral-50">카테고리</h2>
        {isLoading && <p className="text-neutral-500 dark:text-neutral-400">불러오는 중...</p>}
        {isError && <p className="text-red-500">카테고리를 불러오지 못했습니다. 백엔드 서버 상태를 확인해주세요.</p>}
        {categories && categories.length === 0 && (
          <p className="text-neutral-500 dark:text-neutral-400">등록된 카테고리가 없습니다.</p>
        )}
        {categories && categories.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {categories.map((category) => (
              <span
                key={category.id}
                className="rounded-lg border border-neutral-200 px-4 py-3 text-center text-sm text-neutral-700 dark:border-neutral-800 dark:text-neutral-200"
              >
                {category.name}
              </span>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
