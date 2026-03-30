import { useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  BarChart3,
  Bell,
  BrainCircuit,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  RefreshCw,
  Settings,
  Sparkles,
  Target,
  User,
} from 'lucide-react';
import ProjectCard from './ProjectCard';
import Login from './Login';
import api from './api';
import './index.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
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

  const rawCvSummary = profile?.cvSummary?.trim();
  const summaryText =
    rawCvSummary && rawCvSummary !== '{}'
      ? rawCvSummary
      : 'CV özeti henüz oluşmadı. CV yükleyerek ya da profilini zenginleştirerek daha iyi öneriler alabilirsin.';

  if (!isLoggedIn) {
    return <Login onLoginSuccess={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-mark">GP</div>
          <div className="sidebar-brand-copy">
            <span>Academic Intelligence</span>
            <strong>GradPath</strong>
          </div>
        </div>

        <div className="sidebar-section-label">Çalışma Alanı</div>

        <nav style={{ flex: 1 }}>
          <div className="nav-item active">
            <LayoutDashboard size={18} />
            Dashboard
          </div>
          <div className="nav-item">
            <User size={18} />
            Profilim
          </div>
          <div className="nav-item">
            <GraduationCap size={18} />
            Projeler
          </div>
          <div className="nav-item">
            <Settings size={18} />
            Ayarlar
          </div>
        </nav>

        <div className="sidebar-profile">
          <div className="sidebar-avatar">{initials}</div>
          <div className="sidebar-profile-copy">
            <strong>{profile?.fullName || 'GradPath Kullanıcısı'}</strong>
            <span>{profile?.email || 'Oturum açık'}</span>
          </div>
        </div>

        <div className="nav-item sidebar-logout" onClick={handleLogout}>
          <LogOut size={18} />
          Çıkış Yap
        </div>
      </aside>

      <main className="main-content">
        <header className="dashboard-header">
          <div>
            <p className="dashboard-date">{todayLabel}</p>
            <h1 className="dashboard-title">Akademik Uyum Panosu</h1>
            <p className="dashboard-subtitle">
              Hoş geldin {firstName}. Sistem profilini ve proje eşleşmelerini tek ekranda topladı.
            </p>
          </div>

          <div className="dashboard-actions">
            <button
              className="ghost-button"
              type="button"
              onClick={() => loadDashboard(true)}
              disabled={refreshing || loading}
            >
              <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
              {refreshing ? 'Yenileniyor' : 'Verileri Yenile'}
            </button>

            <button className="icon-button" type="button" aria-label="Bildirimler">
              <Bell size={18} />
            </button>
          </div>
        </header>

        {error ? <div className="dashboard-alert">{error}</div> : null}

        <section className="hero-grid">
          <div className="card dashboard-hero">
            <div className="hero-badge">
              <Sparkles size={15} />
              Canlı öneri motoru
            </div>

            <h2>Proje seçimini sezgiyle değil, görünür verilerle yönet.</h2>

            <p>
              CGPA, yetenekler ve AI analizini aynı akışta birleştiren paneldesin. Daha iyi
              eşleşmeler için profilini güncel tut, sistem geri kalanını senin için sıralasın.
            </p>

            <div className="hero-chip-row">
              <div className="hero-chip">
                <span>CGPA</span>
                <strong>{cgpa ?? '-'}</strong>
              </div>

              <div className="hero-chip">
                <span>AKTS</span>
                <strong>{totalECTS ?? '-'}</strong>
              </div>

              <div className="hero-chip">
                <span>Durum</span>
                <strong>{isHonorStudent ? 'Onur' : 'Aktif'}</strong>
              </div>

              <div className="hero-chip">
                <span>Öneri</span>
                <strong>{stats.totalProjects}</strong>
              </div>
            </div>
          </div>

          <div className="card profile-panel">
            <div className="profile-panel-top">
              <div className="profile-avatar">{initials}</div>

              <div>
                <div className="profile-panel-name">{profile?.fullName || 'Profil hazırlanıyor'}</div>
                <div className="profile-panel-mail">{profile?.email || 'E-posta bilgisi yok'}</div>
              </div>
            </div>

            <div className="profile-summary">
              <div className="profile-summary-title">
                <FileText size={15} />
                CV Özeti
              </div>
              <p>{summaryText}</p>
            </div>
          </div>
        </section>

        <section className="stats-grid">
          <article className="card stat-card">
            <div className="stat-card-top">
              <span>Toplam Proje</span>
              <Target size={18} />
            </div>
            <strong>{stats.totalProjects}</strong>
            <p>Şu an profilin için sıralanan öneri sayısı</p>
          </article>

          <article className="card stat-card">
            <div className="stat-card-top">
              <span>En Yüksek Skor</span>
              <BarChart3 size={18} />
            </div>
            <strong>%{stats.topScore}</strong>
            <p>Listede görünen en güçlü eşleşme</p>
          </article>

          <article className="card stat-card">
            <div className="stat-card-top">
              <span>Ortalama Uyum</span>
              <BrainCircuit size={18} />
            </div>
            <strong>%{stats.averageScore}</strong>
            <p>Öneri havuzunun genel kalite seviyesi</p>
          </article>

          <article className="card stat-card">
            <div className="stat-card-top">
              <span>Eksik Yetkinlik</span>
              <BadgeCheck size={18} />
            </div>
            <strong>{stats.uniqueMissingSkills}</strong>
            <p>Geliştirirsen daha çok proje açılacak alan</p>
          </article>
        </section>

        <section className="projects-section">
          <div className="section-header">
            <div>
              <h2 className="section-title">Eşleşen Projeler</h2>
              <p className="section-note">
                Backend’den gelen gerçek öneriler burada listeleniyor.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="card loading-card">Veriler yükleniyor...</div>
          ) : recommendations.length > 0 ? (
            recommendations.map((project, index) => (
              <ProjectCard key={`${project.projectId}-${index}`} project={project} />
            ))
          ) : (
            <div className="empty-state">
              Henüz sana uygun proje bulunamadı. Profiline CGPA, yetenek ve CV bilgisi ekleyince bu
              alan güçlenecek.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
