import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ChartSpline, ShieldCheck, Sparkles, UserPlus, X } from 'lucide-react';
import api from './api';
import AppHeader from './components/AppHeader';

const defaultLoginForm = {
  email: 'ayse@test.com',
  password: 'Ayse123!',
};

const defaultRegisterForm = {
  fullName: '',
  email: '',
  password: '',
  departmentId: '',
};

const loginFeaturePoints = [
  'Öğrenci profili, proje seçimi ve danışmanlık sürecini tek akışta toplar.',
  'Eşleşme mantığını daha görünür ve ölçülebilir hale getirir.',
  'Bitirme projesi sürecini tek panel üzerinden takip etmeni sağlar.',
];

const loginPreviewCards = [
  {
    title: 'Profil Yönetimi',
    detail: 'Yetkinlik, belge ve akademik kayıtlar düzenli şekilde ilerler.',
  },
  {
    title: 'Proje Eşleşmesi',
    detail: 'Bitirme projeleri uyum mantığıyla sıralanır ve değerlendirilir.',
  },
  {
    title: 'Danışmanlık Akışı',
    detail: 'Proje seçimi ve danışman süreci tek panelde izlenir.',
  },
];

const loginWorkflowSteps = [
  'Profilini oluştur',
  'Projeni seç',
  'Danışman sürecini takip et',
];

const roleBasedLoginDefaults = {
  student: {
    email: 'ayse@test.com',
    password: 'Ayse123!',
  },
  advisor: {
    email: 'mehmet.hoca@test.com',
    password: 'Advisor123!',
  },
};

function getApiErrorMessage(error, fallbackMessage) {
  const responseData = error?.response?.data;

  if (typeof responseData === 'string' && responseData.trim()) {
    return responseData;
  }

  return responseData?.message || responseData?.title || fallbackMessage;
}

function resolveRequestedRole(authMode) {
  if (authMode === 'login-advisor') {
    return 'Advisor';
  }

  if (authMode === 'login-student') {
    return 'Student';
  }

  return null;
}

const Login = ({ onLoginSuccess }) => {
  const [authMode, setAuthMode] = useState(null);
  const [loginForm, setLoginForm] = useState(defaultLoginForm);
  const [registerForm, setRegisterForm] = useState(defaultRegisterForm);
  const [departments, setDepartments] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadDepartments = async () => {
      setLoadingDepartments(true);

      try {
        const response = await api.get('/student/directory/options');
        if (!isMounted) {
          return;
        }

        setDepartments(response.data?.departments || []);
      } catch {
        if (!isMounted) {
          return;
        }

        setDepartments([]);
      } finally {
        if (isMounted) {
          setLoadingDepartments(false);
        }
      }
    };

    loadDepartments();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!authMode) {
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setAuthMode(null);
        setError('');
        setInfoMessage('');
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [authMode]);

  const currentHeading = useMemo(() => {
    if (authMode === 'register') {
      return {
        title: 'Yeni öğrenci hesabı oluştur.',
      };
    }

    if (authMode === 'login-role') {
      return {
        title: 'Giriş yapmak istediğin hesap türünü seç.',
      };
    }

    if (authMode === 'login-advisor') {
      return {
        title: 'Danışman hesabınla giriş yap.',
      };
    }

    if (authMode === 'login-student') {
      return {
        title: 'Öğrenci hesabınla giriş yap.',
      };
    }

    return {
      title: '',
    };
  }, [authMode]);

  const switchMode = (nextMode) => {
    setAuthMode(nextMode === 'login' ? 'login-role' : nextMode);
    setError('');
    setInfoMessage('');
  };

  const openLoginForRole = (role) => {
    setLoginForm(roleBasedLoginDefaults[role] || defaultLoginForm);
    setAuthMode(role === 'advisor' ? 'login-advisor' : 'login-student');
    setError('');
    setInfoMessage('');
  };

  const closeAuthModal = () => {
    setAuthMode(null);
    setError('');
    setInfoMessage('');
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setInfoMessage('');

    try {
      const requestedRole = resolveRequestedRole(authMode);
      const response = await api.post('/auth/login', {
        ...loginForm,
        requestedRole,
      });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('roles', JSON.stringify(response.data.roles || []));
      localStorage.setItem('requiresPasswordChange', response.data.requiresPasswordChange ? 'true' : 'false');
      onLoginSuccess(response.data);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Giris basarisiz. E-posta veya sifreyi tekrar kontrol et.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setInfoMessage('');

    try {
      const response = await api.post('/auth/register', {
        fullName: registerForm.fullName.trim(),
        email: registerForm.email.trim(),
        password: registerForm.password,
        departmentId: Number(registerForm.departmentId),
      });

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('roles', JSON.stringify(response.data.roles || []));
      localStorage.setItem('requiresPasswordChange', response.data.requiresPasswordChange ? 'true' : 'false');
      onLoginSuccess(response.data);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Kayit olusturulamadi. Bilgileri kontrol edip tekrar dene.'));
    } finally {
      setSubmitting(false);
    }
  };

  const renderAuthCard = () => (
    <div className={`login-card login-card-${authMode} ${authMode === 'login-role' ? 'login-card-compact' : ''}`}>
      <button
        type="button"
        className="login-modal-close"
        aria-label="Pencereyi kapat"
        onClick={closeAuthModal}
      >
        <X size={18} />
      </button>

      <div className="login-card-stage" key={authMode || 'idle'}>
        <div className="login-card-body">
          <div className="login-card-top">
            <div className="login-pill">
              {authMode === 'register' ? <UserPlus size={15} /> : <Sparkles size={15} />}
              {authMode === 'register'
                ? 'Yeni Öğrenci Hesabı'
                : authMode === 'login-role'
                  ? 'Giriş Seçimi'
                  : authMode === 'login-advisor'
                    ? 'Danışman Girişi'
                    : 'Öğrenci Girişi'}
            </div>

            <h2>{currentHeading.title}</h2>
            <p>
              {authMode === 'register'
                ? 'Üniversite e-posta bilginle yeni öğrenci hesabını oluştur ve profiline doğrudan başla.'
                : authMode === 'login-role'
                  ? 'Açılan pencereden öğrenci veya danışman seçimini yap. Sonraki adımda sana uygun giriş formu gösterilecek.'
                  : authMode === 'login-advisor'
                    ? 'Danışman hesapları kurum tarafından tanımlanır. Mevcut bilgilerinizle giriş yaparak panelinizi yönetebilirsiniz.'
                    : 'Öğrenci hesabınızla giriş yaparak proje ve danışmanlık sürecinizi kaldığınız yerden yönetebilirsiniz.'}
            </p>
          </div>

          <div className={`login-form-shell ${authMode === 'login-role' ? 'login-form-shell-compact' : ''}`}>
            {authMode === 'login-role' ? (
              <div className="login-form login-role-grid">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => openLoginForRole('student')}
                >
                  Öğrenci
                </button>

                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => openLoginForRole('advisor')}
                >
                  Danışman
                </button>
              </div>
            ) : authMode === 'login-student' || authMode === 'login-advisor' ? (
              <form className="login-form" onSubmit={handleLogin}>
                {error ? <div className="error-banner">{error}</div> : null}
                {infoMessage ? <div className="info-banner">{infoMessage}</div> : null}

                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => switchMode('login')}
                >
                  Geri dön
                </button>

                <div className="field-group">
                  <label className="field-label">E-posta adresi</label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="ornek@universite.edu.tr"
                    value={loginForm.email}
                    onChange={(event) =>
                      setLoginForm((current) => ({ ...current, email: event.target.value }))
                    }
                  />
                </div>

                <div className="field-group">
                  <label className="field-label">Şifre</label>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="Şifrenizi girin"
                    value={loginForm.password}
                    onChange={(event) =>
                      setLoginForm((current) => ({ ...current, password: event.target.value }))
                    }
                  />
                </div>

                <div className="helper-row">
                  <span>
                    <ShieldCheck size={14} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} />
                    Güvenli oturum
                  </span>
                  <span>
                    <ChartSpline size={14} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} />
                    Canlı panel verisi
                  </span>
                </div>

                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                  <ArrowRight size={18} style={{ marginLeft: 8, verticalAlign: 'middle' }} />
                </button>
              </form>
            ) : (
              <form className="login-form" onSubmit={handleRegister}>
                {error ? <div className="error-banner">{error}</div> : null}
                {infoMessage ? <div className="info-banner">{infoMessage}</div> : null}

                {!loadingDepartments && !departments.length ? (
                  <div className="error-banner">
                    Kayıt için bölüm listesi yüklenemedi. Lütfen daha sonra tekrar dene.
                  </div>
                ) : null}

                <div className="field-group">
                  <label className="field-label">Ad soyad</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Adınızı ve soyadınızı girin"
                    value={registerForm.fullName}
                    onChange={(event) =>
                      setRegisterForm((current) => ({ ...current, fullName: event.target.value }))
                    }
                  />
                </div>

                <div className="field-group">
                  <label className="field-label">E-posta adresi</label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="ornek@universite.edu.tr"
                    value={registerForm.email}
                    onChange={(event) =>
                      setRegisterForm((current) => ({ ...current, email: event.target.value }))
                    }
                  />
                </div>

                <div className="field-group">
                  <label className="field-label">Bölüm</label>
                  <select
                    className="input-field"
                    value={registerForm.departmentId}
                    onChange={(event) =>
                      setRegisterForm((current) => ({ ...current, departmentId: event.target.value }))
                    }
                    disabled={loadingDepartments || !departments.length}
                  >
                    <option value="">
                      {loadingDepartments ? 'Bölümler yükleniyor...' : 'Bölüm seçin'}
                    </option>
                    {departments.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field-group">
                  <label className="field-label">Şifre</label>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="En az 6 karakter"
                    value={registerForm.password}
                    onChange={(event) =>
                      setRegisterForm((current) => ({ ...current, password: event.target.value }))
                    }
                  />
                </div>

                <div className="helper-row helper-row-register">
                  <span>
                    <ShieldCheck size={14} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} />
                    Kayıt sonrası oturum otomatik açılır
                  </span>
                  <span>
                    <ChartSpline size={14} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} />
                    Profilini daha sonra tamamlayabilirsin
                  </span>
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting || loadingDepartments || !departments.length}
                >
                  {submitting ? 'Hesap oluşturuluyor...' : 'Kayıt Ol'}
                  <ArrowRight size={18} style={{ marginLeft: 8, verticalAlign: 'middle' }} />
                </button>
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  );

  return (
    <div className="app-layout login-page">
      <AppHeader
        currentView="dashboard"
        initials="GP"
        isAuthenticated={false}
        authMode={authMode}
        onAuthModeChange={switchMode}
        onViewChange={() => { }}
        profile={null}
      />

      <main className="main-content login-main-content">
        <div className="login-shell">
          <section className="login-hero">
            <div className="login-copy">
              <div className="login-brand">
                <img src="/mcbu-logo.png" alt="MCBÜ Logo" className="login-brand-logo" />
                <div className="login-brand-text">
                  <span className="login-brand-kicker">Manisa Celal Bayar Üniversitesi</span>
                  <span className="login-brand-name">Mühendislik Fakültesi</span>
                </div>
              </div>

              <h1>Bitirme projeleri ve danışmanlık sürecini tek merkezden yönetin.</h1>
              <p>
                MCBÜ Proje Ekosistemi; öğrenci profili, proje ilanları ve uyum analizlerini tek panelde birleştirir.
                Karar alma sürecini daha izlenebilir, ölçülebilir ve şeffaf hale getirir.
              </p>

              <div className="login-feature-list">
                {loginFeaturePoints.map((point) => (
                  <div key={point} className="login-feature-item">
                    <span className="login-feature-dot" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="login-preview-panel">
              <div className="login-preview-header">
                <div>
                  <span className="login-preview-kicker">Çalışma alanı</span>
                  <strong className="login-preview-title">Tek panel, net akış</strong>
                </div>
                <span className="login-preview-badge">Kurumsal görünüm</span>
              </div>

              <div className="login-preview-grid">
                {loginPreviewCards.map((card) => (
                  <article key={card.title} className="login-preview-card">
                    <strong>{card.title}</strong>
                    <span>{card.detail}</span>
                  </article>
                ))}
              </div>

              <div className="login-preview-flow">
                {loginWorkflowSteps.map((step, index) => (
                  <div key={step} className="login-preview-flow-item">
                    <span className="login-preview-flow-index">0{index + 1}</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div className="login-featured-projects">
            <h3 className="featured-projects-title">Sistemde Öne Çıkan Proje Alanları</h3>
            
            <div className="featured-projects-marquee">
              <div className="featured-projects-track">
                {/* 2 sets of cards for seamless infinite scroll */}
                {[1, 2].map((group) => (
                  <div key={group} className="featured-projects-group">
                    <div className="featured-project-card">
                      <span className="project-category">Yapay Zeka</span>
                      <strong>Otonom İHA Yörünge Planlama</strong>
                      <p>Derin öğrenme algoritmaları ile dinamik engellerden kaçınan rota optimizasyonu.</p>
                    </div>
                    <div className="featured-project-card">
                      <span className="project-category">Görüntü İşleme</span>
                      <strong>Medikal Görüntülerden Hastalık Tespiti</strong>
                      <p>Evrişimli sinir ağları kullanarak yüksek doğruluklu otonom medikal analiz.</p>
                    </div>
                    <div className="featured-project-card">
                      <span className="project-category">Siber Güvenlik</span>
                      <strong>Blokzincir Tabanlı Kimlik Yönetimi</strong>
                      <p>Merkeziyetsiz ağlar üzerinde güvenli veri ve erişim kontrol mekanizması.</p>
                    </div>
                    <div className="featured-project-card">
                      <span className="project-category">IoT & Sensörler</span>
                      <strong>Akıllı Tarım Optimizasyonu</strong>
                      <p>Gerçek zamanlı sensör verileriyle otomatik sulama ve gübreleme sistemi.</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="login-stats-bar">
            <div className="stat-item">
              <strong>300+</strong>
              <span>Kayıtlı Öğrenci</span>
            </div>
            <div className="stat-item">
              <strong>85+</strong>
              <span>Proje İlanı</span>
            </div>
            <div className="stat-item">
              <strong>1.200+</strong>
              <span>Yapay Zeka Önerisi</span>
            </div>
            <div className="stat-item">
              <strong>40+</strong>
              <span>Sistemdeki Danışman</span>
            </div>
          </div>
        </div>
      </main>

      <footer className="login-footer">
        <div className="login-footer-content">
          <div className="footer-brand">
            <img src="/mcbu-logo.png" alt="MCBÜ Logo" className="footer-logo" />
            <div className="footer-brand-text">
              <strong>Manisa Celal Bayar Üniversitesi</strong>
              <span>Mühendislik Fakültesi - Bilgisayar Mühendisliği</span>
            </div>
            <p className="footer-description">
              GradPath Proje Ekosistemi, bitirme projeleri ve danışmanlık süreçlerini yapay zeka destekli eşleştirme algoritmalarıyla tek bir merkezden yönetmenizi sağlayan yeni nesil bir akademik platformdur.
            </p>
          </div>
          
          <div className="footer-links-group">
            <div className="footer-column">
              <h4>Hızlı Bağlantılar</h4>
              <ul>
                <li><a href="#duyurular">Fakülte Duyuruları</a></li>
                <li><a href="#takvim">Akademik Takvim</a></li>
                <li><a href="#yonerge">Proje Yönergeleri</a></li>
                <li><a href="#ogrenci">Öğrenci İşleri</a></li>
              </ul>
            </div>
            
            <div className="footer-column">
              <h4>Destek & İletişim</h4>
              <ul>
                <li><a href="#sss">Sıkça Sorulan Sorular</a></li>
                <li><a href="#kilavuz">Sistem Kullanım Kılavuzu</a></li>
                <li><a href="#destek">Teknik Destek</a></li>
                <li><a href="#iletisim">İletişim Formu</a></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="login-footer-bottom">
          <span>&copy; {new Date().getFullYear()} MCBÜ Bilgisayar Mühendisliği. Tüm hakları saklıdır.</span>
          <div className="footer-bottom-links">
            <a href="#gizlilik">Gizlilik Politikası</a>
            <span className="footer-dot"></span>
            <a href="#kosullar">Kullanım Koşulları</a>
          </div>
        </div>
      </footer>

      {authMode ? (
        <div className="login-modal-overlay" onClick={closeAuthModal}>
          <div className="login-modal-dialog" onClick={(event) => event.stopPropagation()}>
            {renderAuthCard()}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Login;
