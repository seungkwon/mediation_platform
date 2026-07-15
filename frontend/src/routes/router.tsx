import { createBrowserRouter } from 'react-router-dom'

import { RequireAuth } from '@/components/common/RequireAuth'
import { RootLayout } from '@/components/layout/RootLayout'

import AdminDisputes from './AdminDisputes'
import AdminHome from './AdminHome'
import AdminReports from './AdminReports'
import ChatList from './ChatList'
import ChatRoomPage from './ChatRoomPage'
import FaqDetail from './FaqDetail'
import FaqEdit from './FaqEdit'
import FaqList from './FaqList'
import FaqNew from './FaqNew'
import Home from './Home'
import Login from './Login'
import MyQuotes from './MyQuotes'
import MyRequests from './MyRequests'
import MyReviews from './MyReviews'
import NoticeDetail from './NoticeDetail'
import NoticeEdit from './NoticeEdit'
import NoticeList from './NoticeList'
import NoticeNew from './NoticeNew'
import NotFound from './NotFound'
import OAuthCallback from './OAuthCallback'
import OAuthCompleteSignup from './OAuthCompleteSignup'
import OAuthLinkConfirm from './OAuthLinkConfirm'
import PortfolioDetail from './PortfolioDetail'
import PortfolioEdit from './PortfolioEdit'
import PortfolioNew from './PortfolioNew'
import QnaDetail from './QnaDetail'
import QnaEdit from './QnaEdit'
import QnaList from './QnaList'
import QnaNew from './QnaNew'
import RequestDetail from './RequestDetail'
import RequestNew from './RequestNew'
import RequestsList from './RequestsList'
import ResourceDetail from './ResourceDetail'
import ResourceEdit from './ResourceEdit'
import ResourceList from './ResourceList'
import ResourceNew from './ResourceNew'
import SellerProfilePage from './SellerProfilePage'
import SellersList from './SellersList'
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
      { path: 'oauth/link', element: <OAuthLinkConfirm /> },
      { path: 'oauth/complete-signup', element: <OAuthCompleteSignup /> },
      { path: 'sellers', element: <SellersList /> },
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
      { path: 'portfolios/:id', element: <PortfolioDetail /> },
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
      {
        path: 'notices',
        element: (
          <RequireAuth>
            <NoticeList />
          </RequireAuth>
        ),
      },
      {
        path: 'notices/new',
        element: (
          <RequireAuth>
            <NoticeNew />
          </RequireAuth>
        ),
      },
      {
        path: 'notices/:id/edit',
        element: (
          <RequireAuth>
            <NoticeEdit />
          </RequireAuth>
        ),
      },
      {
        path: 'notices/:id',
        element: (
          <RequireAuth>
            <NoticeDetail />
          </RequireAuth>
        ),
      },
      {
        path: 'qna',
        element: (
          <RequireAuth>
            <QnaList />
          </RequireAuth>
        ),
      },
      {
        path: 'qna/new',
        element: (
          <RequireAuth>
            <QnaNew />
          </RequireAuth>
        ),
      },
      {
        path: 'qna/:id/edit',
        element: (
          <RequireAuth>
            <QnaEdit />
          </RequireAuth>
        ),
      },
      {
        path: 'qna/:id',
        element: (
          <RequireAuth>
            <QnaDetail />
          </RequireAuth>
        ),
      },
      {
        path: 'faq',
        element: (
          <RequireAuth>
            <FaqList />
          </RequireAuth>
        ),
      },
      {
        path: 'faq/new',
        element: (
          <RequireAuth>
            <FaqNew />
          </RequireAuth>
        ),
      },
      {
        path: 'faq/:id/edit',
        element: (
          <RequireAuth>
            <FaqEdit />
          </RequireAuth>
        ),
      },
      {
        path: 'faq/:id',
        element: (
          <RequireAuth>
            <FaqDetail />
          </RequireAuth>
        ),
      },
      {
        path: 'resources',
        element: (
          <RequireAuth>
            <ResourceList />
          </RequireAuth>
        ),
      },
      {
        path: 'resources/new',
        element: (
          <RequireAuth>
            <ResourceNew />
          </RequireAuth>
        ),
      },
      {
        path: 'resources/:id/edit',
        element: (
          <RequireAuth>
            <ResourceEdit />
          </RequireAuth>
        ),
      },
      {
        path: 'resources/:id',
        element: (
          <RequireAuth>
            <ResourceDetail />
          </RequireAuth>
        ),
      },
      { path: '*', element: <NotFound /> },
    ],
  },
])
