import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'

import { fetchMe } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'

import { Footer } from './Footer'
import { Header } from './Header'

export function RootLayout() {
  const accessToken = useAuthStore((state) => state.accessToken)
  const setUser = useAuthStore((state) => state.setUser)

  useEffect(() => {
    if (!accessToken) return
    fetchMe()
      .then(setUser)
      .catch(() => {})
  }, [accessToken, setUser])

  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col">
        <Outlet />
      </main>
      <Footer />
    </>
  )
}
