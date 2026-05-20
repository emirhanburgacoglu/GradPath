import { useState } from 'react';
import AppHeader from '../components/AppHeader';
import api from '../api';

function getApiErrorMessage(error, fallbackMessage) {
  const responseData = error?.response?.data;

  if (typeof responseData === 'string' && responseData.trim()) {
    return responseData;
  }

  return responseData?.message || responseData?.title || fallbackMessage;
}

function PasswordSetupPage({ onLogout, onSuccess, profile }) {
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (form.newPassword.trim().length < 6) {
      setError('Yeni sifre en az 6 karakter olmali.');
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError('Yeni sifre ve tekrar sifresi ayni olmali.');
      return;
    }

    setSubmitting(true);

    try {
      await api.post('/auth/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });

      localStorage.setItem('requiresPasswordChange', 'false');
      onSuccess?.();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Sifre guncellenemedi.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-layout login-page">
      <AppHeader
        currentView="dashboard"
        initials={profile?.fullName
          ?.split(' ')
          .map((item) => item[0])
          .slice(0, 2)
          .join('')
          .toUpperCase() || 'GP'}
        onLogout={onLogout}
        onViewChange={() => {}}
        profile={profile}
      />

      <main className="main-content login-main-content">
        <div className="login-shell">
          <section className="login-hero">
            <div className="login-copy">
              <div className="login-brand">
                <div className="login-brand-badge">GP</div>
                <div className="login-brand-text">
                  <span className="login-brand-kicker">Ilk giris guvenligi</span>
                  <span className="login-brand-name">Sifre guncelleme</span>
                </div>
              </div>

              <h1>Ilk giriste sifreni yenilemen gerekiyor.</h1>
              <p>
                Danisman hesaplari sistem tarafinda olusturuldugu icin guvenlik amaciyla ilk
                giriste kendi sifreni belirlemen gerekiyor.
              </p>
            </div>

            <div className="login-preview-panel">
              <form className="login-form" onSubmit={handleSubmit}>
                {error ? <div className="error-banner">{error}</div> : null}

                <div className="field-group">
                  <label className="field-label">Mevcut sifre</label>
                  <input
                    type="password"
                    className="input-field"
                    value={form.currentPassword}
                    onChange={(event) => setForm((current) => ({ ...current, currentPassword: event.target.value }))}
                  />
                </div>

                <div className="field-group">
                  <label className="field-label">Yeni sifre</label>
                  <input
                    type="password"
                    className="input-field"
                    value={form.newPassword}
                    onChange={(event) => setForm((current) => ({ ...current, newPassword: event.target.value }))}
                  />
                </div>

                <div className="field-group">
                  <label className="field-label">Yeni sifre tekrar</label>
                  <input
                    type="password"
                    className="input-field"
                    value={form.confirmPassword}
                    onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                  />
                </div>

                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Guncelleniyor...' : 'Sifreyi kaydet'}
                </button>
              </form>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default PasswordSetupPage;
