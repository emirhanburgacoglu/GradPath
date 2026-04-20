import { useEffect, useMemo, useState } from 'react';
import Login from './Login';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import StudentProjectPostsPage from './pages/StudentProjectPostsPage';
import api from './api';
import './index.css';

function resolveCvSummary(profile) {
  const directSummary = profile?.cvSummary?.trim();
  if (directSummary && directSummary !== '{}') {
    return directSummary;
  }

  if (!profile?.cvAnalysisJson) {
    return '';
  }

  try {
    const parsed = JSON.parse(profile.cvAnalysisJson);
    return (
      parsed?.NormalizedSummary ||
      parsed?.normalizedSummary ||
      parsed?.RawSummary ||
      parsed?.rawSummary ||
      ''
    ).trim();
  } catch {
    return '';
  }
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [currentView, setCurrentView] = useState('dashboard');
  const [recommendations, setRecommendations] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isLoggedIn) {
      loadDashboard();
    }
  }, [isLoggedIn]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setCurrentView('dashboard');
    setRecommendations([]);
    setProfile(null);
    setError('');
  };

  const loadDashboard = async (silent = false) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError('');

    const [profileResult, recommendationResult] = await Promise.allSettled([
      api.get('/student/me'),
      api.get('/Matching/recommendations'),
    ]);

    if (profileResult.status === 'fulfilled') {
      setProfile(profileResult.value.data);
    } else {
      setProfile(null);
    }

    if (recommendationResult.status === 'fulfilled') {
      setRecommendations(recommendationResult.value.data?.data || []);
    } else {
      if (recommendationResult.reason?.response?.status === 401) {
        handleLogout();
        return;
      }

      setRecommendations([]);
      setError('Öneriler yüklenemedi. Profilini güncelledikten sonra tekrar deneyebilirsin.');
    }

    if (profileResult.status === 'rejected' && recommendationResult.status === 'rejected') {
      setError('Dashboard verileri şu an alınamıyor.');
    }

    if (silent) {
      setRefreshing(false);
    } else {
      setLoading(false);
    }
  };

  const firstName = profile?.fullName?.split(' ')[0] || 'Öğrenci';
  const initials =
    profile?.fullName
      ?.split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'GP';

  const todayLabel = new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const stats = useMemo(() => {
    const totalProjects = recommendations.length;
    const topScore = totalProjects
      ? Math.round(Math.max(...recommendations.map((item) => item.matchScore || 0)))
      : 0;
    const averageScore = totalProjects
      ? Math.round(
          recommendations.reduce((sum, item) => sum + (item.matchScore || 0), 0) / totalProjects
        )
      : 0;
    const uniqueMissingSkills = new Set(
      recommendations.flatMap((item) => item.missingTechnologies || [])
    ).size;

    return {
      totalProjects,
      topScore,
      averageScore,
      uniqueMissingSkills,
    };
  }, [recommendations]);

  const cgpa = profile?.cgpa;
  const totalECTS = profile?.totalECTS;
  const isHonorStudent = profile?.isHonorStudent || Number(cgpa) >= 3;

  const rawCvSummary = resolveCvSummary(profile);
  const summaryText =
    rawCvSummary && rawCvSummary !== '{}'
      ? rawCvSummary
      : 'CV özeti henüz oluşmadı. CV yükleyerek ya da profilini zenginleştirerek daha iyi öneriler alabilirsin.';

  if (!isLoggedIn) {
    return <Login onLoginSuccess={() => setIsLoggedIn(true)} />;
  }

  if (currentView === 'profile') {
    return (
      <ProfilePage
        cgpa={cgpa}
        currentView={currentView}
        error={error}
        initials={initials}
        isHonorStudent={isHonorStudent}
        onLogout={handleLogout}
        onRefresh={() => loadDashboard(true)}
        onViewChange={setCurrentView}
        profile={profile}
        refreshing={refreshing}
        summaryText={summaryText}
        totalECTS={totalECTS}
      />
    );
  }

  if (currentView === 'posts') {
    return (
      <StudentProjectPostsPage
        currentView={currentView}
        initials={initials}
        onLogout={handleLogout}
        onViewChange={setCurrentView}
        profile={profile}
      />
    );
  }

  return (
    <DashboardPage
      cgpa={cgpa}
      currentView={currentView}
      error={error}
      firstName={firstName}
      initials={initials}
      isHonorStudent={isHonorStudent}
      loading={loading}
      onLogout={handleLogout}
      onRefresh={() => loadDashboard(true)}
      onViewChange={setCurrentView}
      profile={profile}
      recommendations={recommendations}
      refreshing={refreshing}
      stats={stats}
      summaryText={summaryText}
      todayLabel={todayLabel}
      totalECTS={totalECTS}
    />
  );
}

export default App;
