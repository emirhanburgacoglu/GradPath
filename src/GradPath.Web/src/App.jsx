import { useEffect, useMemo, useState } from 'react';
import Login from './Login';
import AdvisorDashboardPage from './pages/AdvisorDashboardPage';
import AdvisorSelectionPage from './pages/AdvisorSelectionPage';
import DashboardPage from './pages/DashboardPage';
import PasswordSetupPage from './pages/PasswordSetupPage';
import PosterWorkflowPage from './pages/PosterWorkflowPage';
import ProfilePage from './pages/ProfilePage';
import StudentDirectoryPage from './pages/StudentDirectoryPage';
import StudentProjectPostsPage from './pages/StudentProjectPostsPage';
import api from './api';
import './index.css';

const advisorNavigationItems = [
  { id: 'dashboard', label: 'Talepler' },
  { id: 'students', label: 'Öğrenciler' },
  { id: 'projects', label: 'Projeler' },
  { id: 'profile', label: 'Profil' },
];

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

function resolveApiMessage(error, fallbackMessage) {
  const payload = error?.response?.data;

  if (typeof payload === 'string' && payload.trim()) {
    return payload;
  }

  if (payload?.message) {
    return payload.message;
  }

  if (payload?.Message) {
    return payload.Message;
  }

  return fallbackMessage;
}

function isActiveAdvisorRequest(request) {
  return request?.status === 'Pending' || request?.status === 'Approved';
}

function App() {
  const isPosterWorkflowMode =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('poster') === 'workflow';
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedAdvisorProjectId, setSelectedAdvisorProjectId] = useState(
    () => localStorage.getItem('selectedAdvisorProjectId') || ''
  );
  const [userRoles, setUserRoles] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('roles') || '[]');
    } catch {
      return [];
    }
  });
  const [recommendations, setRecommendations] = useState([]);
  const [advisorRequests, setAdvisorRequests] = useState([]);
  const [profile, setProfile] = useState(null);
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(
    localStorage.getItem('requiresPasswordChange') === 'true'
  );
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const isAdvisor = userRoles?.includes('Advisor') === true;

  useEffect(() => {
    if (isLoggedIn && !requiresPasswordChange) {
      loadDashboard();
    }
  }, [isLoggedIn, isAdvisor, requiresPasswordChange]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('roles');
    localStorage.removeItem('requiresPasswordChange');
    localStorage.removeItem('selectedAdvisorProjectId');
    setIsLoggedIn(false);
    setUserRoles([]);
    setRequiresPasswordChange(false);
    setSelectedAdvisorProjectId('');
    setCurrentView('dashboard');
    setRecommendations([]);
    setAdvisorRequests([]);
    setProfile(null);
    setError('');
  };

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    setRequiresPasswordChange(localStorage.getItem('requiresPasswordChange') === 'true');

    try {
      setUserRoles(JSON.parse(localStorage.getItem('roles') || '[]'));
    } catch {
      setUserRoles([]);
    }
  };

  const loadProfileOnly = async (silent = false) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError('');

    try {
      const profileResult = await api.get(isAdvisor ? '/advisors/me' : '/student/me');
      setProfile(profileResult.data);
    } catch (profileError) {
      setProfile(null);

      if (profileError?.response?.status === 401) {
        handleLogout();
        return;
      }

      setError('Profil verileri şu an alınamıyor.');
    } finally {
      if (silent) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const loadDashboard = async (silent = false) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError('');
    if (isAdvisor) {
      try {
        const [profileResult, requestResult] = await Promise.all([
          api.get('/advisors/me'),
          api.get('/advisor-requests/incoming'),
        ]);
        setProfile(profileResult.data);
        setRecommendations([]);
        setAdvisorRequests(requestResult.data || []);
      } catch (profileError) {
        setProfile(null);
        setAdvisorRequests([]);

        if (profileError?.response?.status === 401) {
          handleLogout();
          return;
        }

        setError('Danisman panel verileri su an alinamiyor.');
      } finally {
        if (silent) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }

      return;
    }

    const [profileResult, recommendationResult, advisorRequestResult] = await Promise.allSettled([
      api.get('/student/me'),
      api.get('/Matching/recommendations'),
      api.get('/advisor-requests/mine'),
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

    if (advisorRequestResult.status === 'fulfilled') {
      const requestItems = advisorRequestResult.value.data || [];
      const activeRequest = requestItems.find(isActiveAdvisorRequest);

      setAdvisorRequests(requestItems);

      if (activeRequest) {
        setSelectedAdvisorProjectId(String(activeRequest.projectId));
        localStorage.setItem('selectedAdvisorProjectId', String(activeRequest.projectId));
      }
    } else {
      setAdvisorRequests([]);
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

  const handleCreateAdvisorRequest = async (payload) => {
    try {
      const response = await api.post('/advisor-requests', payload);
      setSelectedAdvisorProjectId(String(payload.projectId));
      localStorage.setItem('selectedAdvisorProjectId', String(payload.projectId));
      await loadDashboard(true);

      return {

        succeeded: true,
        message: typeof response.data === 'string' ? response.data : 'Danismanlik talebi gonderildi.',
      };
    } catch (requestError) {
      return {
        succeeded: false,
        message: resolveApiMessage(requestError, 'Danismanlik talebi gonderilemedi.'),
      };
    }
  };

  const handleCancelAdvisorRequest = async (requestId) => {
    try {
      const response = await api.post(`/advisor-requests/${requestId}/cancel`, {});
      setSelectedAdvisorProjectId('');
      localStorage.removeItem('selectedAdvisorProjectId');
      setError('');
      setCurrentView('dashboard');
      await loadDashboard(true);

      return {
        succeeded: true,
        message: typeof response.data === 'string' ? response.data : 'Danismanlik talebi iptal edildi.',
      };
    } catch (cancelError) {
      return {
        succeeded: false,
        message: resolveApiMessage(cancelError, 'Danismanlik talebi iptal edilemedi.'),
      };
    }
  };

  const handleAdvisorRequestDecision = async (requestId, action, note) => {
    try {
      const response = await api.post(`/advisor-requests/${requestId}/${action}`, {
        note,
      });
      await loadDashboard(true);

      return {
        succeeded: true,
        message: typeof response.data === 'string' ? response.data : 'Talep guncellendi.',
      };
    } catch (decisionError) {
      return {
        succeeded: false,
        message: resolveApiMessage(decisionError, 'Talep guncellenemedi.'),
      };
    }
  };

  const handleSelectProjectForAdvisor = (projectId) => {
    const activeStudentRequest = advisorRequests.find(isActiveAdvisorRequest);
    const normalizedProjectId = projectId ? Number(projectId) : null;

    if (activeStudentRequest) {
      setSelectedAdvisorProjectId(String(activeStudentRequest.projectId));
      localStorage.setItem('selectedAdvisorProjectId', String(activeStudentRequest.projectId));

      if (normalizedProjectId && activeStudentRequest.projectId !== normalizedProjectId) {
        setError(
          activeStudentRequest.status === 'Approved'
            ? 'Onaylanmis danismanlik surecin varken yeni proje secemezsin. Mevcut surecin acildi.'
            : 'Bekleyen talebin sonuclanmadan yeni proje secemezsin. Istersen mevcut talebi iptal edip yeniden secim yapabilirsin.'
        );
      } else {
        setError('');
      }

      setCurrentView('advisor-selection');
      return;
    }

    setError('');

    if (projectId) {
      setSelectedAdvisorProjectId(String(projectId));
      localStorage.setItem('selectedAdvisorProjectId', String(projectId));
    } else {
      setSelectedAdvisorProjectId('');
      localStorage.removeItem('selectedAdvisorProjectId');
    }

    setCurrentView('advisor-selection');
  };
  const firstName = profile?.fullName?.split(' ')[0] || (isAdvisor ? 'Danışman' : 'Öğrenci');

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
  const activeAdvisorRequest = advisorRequests.find(isActiveAdvisorRequest) || null;

  const rawCvSummary = resolveCvSummary(profile);
  const summaryText =
    rawCvSummary && rawCvSummary !== '{}'
      ? rawCvSummary
      : 'CV özeti henüz oluşmadı. CV yükleyerek ya da profilini zenginleştirerek daha iyi öneriler alabilirsin.';

  if (isPosterWorkflowMode) {
    return <PosterWorkflowPage />;
  }

  if (!isLoggedIn) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  if (requiresPasswordChange) {
    return (
      <PasswordSetupPage
        onLogout={handleLogout}
        onSuccess={() => {
          setRequiresPasswordChange(false);
          localStorage.setItem('requiresPasswordChange', 'false');
          loadDashboard();
        }}
        profile={profile}
      />
    );
  }

  if (isAdvisor) {
    if (currentView === 'students') {
      return (
        <StudentDirectoryPage
          currentView={currentView}
          footerNavItems={advisorNavigationItems}
          initials={initials}
          navItems={advisorNavigationItems}
          onLogout={handleLogout}
          onViewChange={setCurrentView}
          profile={profile}
          profileActionLabel="Talepler"
          profileActionViewId="dashboard"
        />
      );
    }

    return (
      <AdvisorDashboardPage
        currentView={currentView}
        error={error}
        initials={initials}
        loading={loading || refreshing}
        onLogout={handleLogout}
        onRefresh={loadDashboard}
        onRequestDecision={handleAdvisorRequestDecision}
        onViewChange={setCurrentView}
        profile={profile}
        requests={advisorRequests}
      />
    );
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
        onRefresh={() => loadProfileOnly(true)}
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

  if (currentView === 'students') {
    return (
      <StudentDirectoryPage
        currentView={currentView}
        initials={initials}
        onLogout={handleLogout}
        onViewChange={setCurrentView}
        profile={profile}
      />
    );
  }

  if (currentView === 'advisor-selection') {
    return (
      <AdvisorSelectionPage
        advisorRequests={advisorRequests}
        currentView={currentView}
        error={error}
        initials={initials}
        loading={loading}
        onCancelAdvisorRequest={handleCancelAdvisorRequest}
        onCreateAdvisorRequest={handleCreateAdvisorRequest}
        onLogout={handleLogout}
        onRefresh={() => loadDashboard(true)}
        onSelectProject={handleSelectProjectForAdvisor}
        onViewChange={setCurrentView}
        profile={profile}
        recommendations={recommendations}
        refreshing={refreshing}
        selectedProjectId={activeAdvisorRequest ? String(activeAdvisorRequest.projectId) : selectedAdvisorProjectId}
      />
    );
  }

  return (
    <DashboardPage
      activeAdvisorRequest={activeAdvisorRequest}
      advisorRequests={advisorRequests}
      cgpa={cgpa}
      currentView={currentView}
      error={error}
      firstName={firstName}
      initials={initials}
      isHonorStudent={isHonorStudent}
      loading={loading}
      onLogout={handleLogout}
      onRefresh={() => loadDashboard(true)}
      onSelectProjectForAdvisor={handleSelectProjectForAdvisor}
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
