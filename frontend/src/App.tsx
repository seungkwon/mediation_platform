function App() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 bg-primary-50 px-6 text-center dark:bg-neutral-900">
      <span className="rounded-full bg-primary-100 px-4 py-1 text-sm font-medium text-primary-700 dark:bg-primary-900 dark:text-primary-200">
        중계 플랫폼
      </span>
      <h1 className="text-4xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
        프론트엔드 스캐폴딩 완료
      </h1>
      <p className="max-w-md text-neutral-600 dark:text-neutral-300">
        Vite + React + TypeScript + Tailwind CSS, Pretendard 폰트, Orange 테마 설정이 적용되었습니다.
      </p>
      <button
        type="button"
        className="rounded-lg bg-primary-500 px-5 py-2.5 font-medium text-white transition-colors hover:bg-primary-600 active:bg-primary-700"
      >
        시작하기
      </button>
    </main>
  )
}

export default App
