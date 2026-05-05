import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ChartSpline, ShieldCheck, Sparkles, UserPlus } from 'lucide-react';
import api from './api';

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

function getApiErrorMessage(error, fallbackMessage) {
  const responseData = error?.response?.data;

  if (typeof responseData === 'string' && responseData.trim()) {
    return responseData;
  }

  return responseData?.message || responseData?.title || fallbackMessage;
}

const Login = ({ onLoginSuccess }) => {
  const [authMode, setAuthMode] = useState('login');
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

  const currentHeading = useMemo(() => {
    if (authMode === 'register') {
      return {
        title: 'Yeni ogrenci hesabi olustur.',
      };
    }

    return {
      title: 'Kurumsal panele giris yapin.',
    };
  }, [authMode]);

  const switchMode = (nextMode) => {
    setAuthMode(nextMode);
    setError('');
    setInfoMessage('');
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setInfoMessage('');

    try {
      const response = await api.post('/auth/login', loginForm);
      localStorage.setItem('token', response.data.token);
      onLoginSuccess();
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
      onLoginSuccess();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Kayit olusturulamadi. Bilgileri kontrol edip tekrar dene.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-shell">
      <section className="login-hero">
        <div className="login-brand">
          <div className="login-brand-badge">GP</div>
          <div className="login-brand-text">
            <span className="login-brand-kicker">Project Intelligence Platform</span>
            <span className="login-brand-name">GradPath</span>
          </div>
        </div>

        <div className="login-copy">
          <h1>Akademik proje surecini tek merkezden yonetin.</h1>
          <p>
            GradPath; ogrenci profili, proje ilanlari ve uyum analizlerini tek panelde birlestirir.
            Karar alma surecini daha izlenebilir, daha olculebilir ve daha profesyonel hale getirir.
          </p>

          <div className="login-metrics">
            <div className="login-metric">
              <strong>Kurumsal gorunum</strong>
              <span>Panel, kart ve veri alanlari daha net bir yonetim duzeni sunar.</span>
            </div>

            <div className="login-metric">
              <strong>Veri temelli eslesme</strong>
              <span>Projeler uyum skoru ve eksik yetkinlik bilgileriyle siralanir.</span>
            </div>

            <div className="login-metric">
              <strong>Surec takibi</strong>
              <span>Profil, ilan ve basvuru akislarini ayni panel uzerinden yonetirsin.</span>
            </div>
          </div>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <div className="login-card-body">
            <div className="login-card-top">
              <div className="login-mode-switch" role="tablist" aria-label="Kimlik dogrulama modu">
                <button
                  type="button"
                  className={`login-mode-button ${authMode === 'login' ? 'active' : ''}`}
                  onClick={() => switchMode('login')}
                >
                  Giris Yap
                </button>
                <button
                  type="button"
                  className={`login-mode-button ${authMode === 'register' ? 'active' : ''}`}
                  onClick={() => switchMode('register')}
                >
                  Kayit Ol
                </button>
              </div>

              <div className="login-pill">
                {authMode === 'register' ? <UserPlus size={15} /> : <Sparkles size={15} />}
                {authMode === 'register' ? 'Yeni Ogrenci Hesabi' : 'Ogrenci Paneli'}
              </div>

              <h2>{currentHeading.title}</h2>
            </div>

            <div className="login-form-shell">
              {authMode === 'login' ? (
                <form className="login-form" onSubmit={handleLogin}>
                  {error ? <div className="error-banner">{error}</div> : null}
                  {infoMessage ? <div className="info-banner">{infoMessage}</div> : null}

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

          <div className="demo-note">
            {authMode === 'login' ? (
              <>
                <strong>Demo hesap:</strong> Form test kullanici bilgileriyle dolu geliyor. Istersen
                dogrudan giris yapip yeni kurumsal arayuzu tum sayfalarda inceleyebilirsin.
              </>
            ) : (
              <>
                <strong>Kayit notu:</strong> Hesap olusturuldugunda sana otomatik bir ogrenci profili
                acilir. Giris yaptiktan sonra profil, yetkinlik ve proje alanlarini duzenleyebilirsin.
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Login;
