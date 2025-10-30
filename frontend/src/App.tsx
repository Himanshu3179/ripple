import type { ReactElement } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/layout/Layout';
import HomePage from './pages/home/HomePage';
import PostPage from './pages/post/PostPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import StorePage from './pages/store/StorePage';
import CommunitiesPage from './pages/community/CommunitiesPage';
import CommunityDetailPage from './pages/community/CommunityDetailPage';
import MissionsPage from './pages/missions/MissionsPage';
import AnalyticsPage from './pages/analytics/AnalyticsPage';
import SchedulePage from './pages/schedule/SchedulePage';
import ReferralPage from './pages/referrals/ReferralPage';
import AdminPage from './pages/admin/AdminPage';
import StoryverseListPage from './pages/storyverse/StoryverseListPage';
import StoryverseDetailPage from './pages/storyverse/StoryverseDetailPage';

const App = (): ReactElement => {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/posts/:postId" element={<PostPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/store" element={<StorePage />} />
        <Route path="/communities" element={<CommunitiesPage />} />
        <Route path="/communities/:identifier" element={<CommunityDetailPage />} />
        <Route path="/missions" element={<MissionsPage />} />
        <Route path="/referrals" element={<ReferralPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/schedule" element={<SchedulePage />} />
        <Route path="/storyverse" element={<StoryverseListPage />} />
        <Route path="/storyverse/:storyId" element={<StoryverseDetailPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
};

export default App;
