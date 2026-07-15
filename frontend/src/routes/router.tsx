import { createBrowserRouter } from 'react-router-dom'

import { RequireAuth } from '@/components/common/RequireAuth'
import { RootLayout } from '@/components/layout/RootLayout'

import AdminDisputes from './AdminDisputes'
import AdminHome from './AdminHome'
import AdminReports from './AdminReports'
import ChatList from './ChatList'
import ChatRoomPage from './ChatRoomPage'
import Home from './Home'
import Login from './Login'
import MyQuotes from './MyQuotes'
import MyRequests from './MyRequests'
import MyReviews from './MyReviews'
import NotFound from './NotFound'
import OAuthCallback from './OAuthCallback'
import PortfolioEdit from './PortfolioEdit'
import PortfolioNew from './PortfolioNew'
import RequestDetail from './RequestDetail'
import RequestNew from './RequestNew'
import RequestsList from './RequestsList'
import SellerProfilePage from './SellerProfilePage'
import Signup from './Signup'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'login', element: <Login /> },
      { path: 'signup', element: <Signup /> },
      { path: 'oauth/callback/:provider', element: <OAuthCallback /> },
      { path: 'sellers/:id', element: <SellerProfilePage /> },
      {
        path: 'portfolios/new',
        element: (
          <RequireAuth>
            <PortfolioNew />
          </RequireAuth>
        ),
      },
      {
        path: 'portfolios/:id/edit',
        element: (
          <RequireAuth>
            <PortfolioEdit />
          </RequireAuth>
        ),
      },
      { path: 'requests', element: <RequestsList /> },
      {
        path: 'requests/new',
        element: (
          <RequireAuth>
            <RequestNew />
          </RequireAuth>
        ),
      },
      { path: 'requests/:id', element: <RequestDetail /> },
      {
        path: 'my/requests',
        element: (
          <RequireAuth>
            <MyRequests />
          </RequireAuth>
        ),
      },
      {
        path: 'my/quotes',
        element: (
          <RequireAuth>
            <MyQuotes />
          </RequireAuth>
        ),
      },
      {
        path: 'chat',
        element: (
          <RequireAuth>
            <ChatList />
          </RequireAuth>
        ),
      },
      {
        path: 'chat/:roomId',
        element: (
          <RequireAuth>
            <ChatRoomPage />
          </RequireAuth>
        ),
      },
      {
        path: 'my/reviews',
        element: (
          <RequireAuth>
            <MyReviews />
          </RequireAuth>
        ),
      },
      {
        path: 'admin',
        element: (
          <RequireAuth>
            <AdminHome />
          </RequireAuth>
        ),
      },
      {
        path: 'admin/reports',
        element: (
          <RequireAuth>
            <AdminReports />
          </RequireAuth>
        ),
      },
      {
        path: 'admin/disputes',
        element: (
          <RequireAuth>
            <AdminDisputes />
          </RequireAuth>
        ),
      },
      { path: '*', element: <NotFound /> },
    ],
  },
])
