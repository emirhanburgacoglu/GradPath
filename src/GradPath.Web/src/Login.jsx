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
  'Ogrenci profili, proje secimi ve danismanlik surecini tek akista toplar.',
  'Eslesme mantigini daha gorunur ve olculebilir hale getirir.',
  'Bitirme projesi surecini tek panel uzerinden takip etmeni saglar.',
];

const loginPreviewCards = [
  {
    title: 'Profil Yonetimi',
    detail: 'Yetkinlik, belge ve akademik kayitlar duzenli sekilde ilerler.',
  },
  {
    title: 'Proje Eslesmesi',
    detail: 'Bitirme projeleri uyum mantigiyla siralanir ve degerlendirilir.',
  },
  {
    title: 'Danismanlik Akisi',
    detail: 'Proje secimi ve danisman sureci tek panelde izlenir.',
  },
];

const loginWorkflowSteps = [
  'Profilini olustur',
  'Projeni sec',
  'Danisman surecini takip et',
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
        title: 'Yeni ogrenci hesabi olustur.',
      };
    }

    if (authMode === 'login-role') {
      return {
        title: 'Giris yapmak istedigin hesap turunu sec.',
      };
    }

    if (authMode === 'login-advisor') {
      return {
        title: 'Danisman hesabinla giris yap.',
      };
    }

    if (authMode === 'login-student') {
      return {
        title: 'Ogrenci hesabinla giris yap.',
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
                ? 'Yeni Ogrenci Hesabi'
                : authMode === 'login-role'
                  ? 'Giris Secimi'
                  : authMode === 'login-advisor'
                    ? 'Danisman Girisi'
                    : 'Ogrenci Girisi'}
            </div>

            <h2>{currentHeading.title}</h2>
            <p>
              {authMode === 'register'
                ? 'Universite e-posta bilginle yeni ogrenci hesabini olustur ve profiline dogrudan basla.'
                : authMode === 'login-role'
                  ? 'Acilan pencereden ogrenci veya danisman secimini yap. Sonraki adimda sana uygun giris formu gosterilecek.'
                  : authMode === 'login-advisor'
                    ? 'Danisman hesaplari kurum tarafindan tanimlanir. Mevcut bilgilerinizle giris yaparak panelinizi yonetebilirsiniz.'
                    : 'Ogrenci hesabinizla giris yaparak proje ve danismanlik surecinizi kaldiginiz yerden yonetebilirsiniz.'}
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
                  Ogrenci
                </button>

                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => openLoginForRole('advisor')}
                >
                  Danisman
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
                  Geri don
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
                  <label className="field-label">Sifre</label>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="Sifrenizi girin"
                    value={loginForm.password}
                    onChange={(event) =>
                      setLoginForm((current) => ({ ...current, password: event.target.value }))
                    }
                  />
                </div>

                <div className="helper-row">
                  <span>
                    <ShieldCheck size={14} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} />
                    Guvenli oturum
                  </span>
                  <span>
                    <ChartSpline size={14} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} />
                    Canli panel verisi
                  </span>
                </div>

                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Giris yapiliyor...' : 'Giris Yap'}
                  <ArrowRight size={18} style={{ marginLeft: 8, verticalAlign: 'middle' }} />
                </button>
              </form>
            ) : (
              <form className="login-form" onSubmit={handleRegister}>
                {error ? <div className="error-banner">{error}</div> : null}
                {infoMessage ? <div className="info-banner">{infoMessage}</div> : null}

                {!loadingDepartments && !departments.length ? (
                  <div className="error-banner">
                    Kayit icin bolum listesi yuklenemedi. Lutfen daha sonra tekrar dene.
                  </div>
                ) : null}

                <div className="field-group">
                  <label className="field-label">Ad soyad</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Adinizi ve soyadinizi girin"
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
                  <label className="field-label">Bolum</label>
                  <select
                    className="input-field"
                    value={registerForm.departmentId}
                    onChange={(event) =>
                      setRegisterForm((current) => ({ ...current, departmentId: event.target.value }))
                    }
                    disabled={loadingDepartments || !departments.length}
                  >
                    <option value="">
                      {loadingDepartments ? 'Bolumler yukleniyor...' : 'Bolum secin'}
                    </option>
                    {departments.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field-group">
                  <label className="field-label">Sifre</label>
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
                    Kayit sonrasi oturum otomatik acilir
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
                  {submitting ? 'Hesap olusturuluyor...' : 'Kayit Ol'}
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
                <div className="login-brand-badge">GP</div>
                <div className="login-brand-text">
                  <span className="login-brand-kicker">Project Intelligence Platform</span>
                  <span className="login-brand-name">GradPath</span>
                </div>
              </div>

              <h1>Akademik proje surecini tek merkezden yonetin.</h1>
              <p>
                GradPath; ogrenci profili, proje ilanlari ve uyum analizlerini tek panelde birlestirir.
                Karar alma surecini daha izlenebilir, daha olculebilir ve daha profesyonel hale getirir.
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
                  <span className="login-preview-kicker">Calisma alani</span>
                  <strong className="login-preview-title">Tek panel, net akis</strong>
                </div>
                <span className="login-preview-badge">Kurumsal gorunum</span>
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
        </div>
      </main>

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
