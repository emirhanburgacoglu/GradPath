import { useState } from 'react';
import { ArrowRight, ChartSpline, ShieldCheck, Sparkles } from 'lucide-react';
import api from './api';

const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('ayse@test.com');
  const [password, setPassword] = useState('Ayse123!');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', response.data.token);
      onLoginSuccess();
    } catch {
      setError('Giris basarisiz. E-posta veya sifreyi tekrar kontrol et.');
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
        <form className="login-card" onSubmit={handleLogin}>
          <div className="login-card-top">
            <div className="login-pill">
              <Sparkles size={15} />
              Ogrenci Paneli
            </div>

            <h2>Kurumsal panele giris yapin.</h2>
            <p>
              Hesabina giris yaparak proje onerilerini, profil ozetini ve yonetim ekranindaki guncel
              durum bilgisini goruntuleyebilirsin.
            </p>
          </div>

          <div className="login-form">
            {error && <div className="error-banner">{error}</div>}

            <div className="field-group">
              <label className="field-label">E-posta adresi</label>
              <input
                type="email"
                className="input-field"
                placeholder="ornek@universite.edu.tr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="field-group">
              <label className="field-label">Sifre</label>
              <input
                type="password"
                className="input-field"
                placeholder="Sifrenizi girin"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

            <button type="submit" className="btn-primary">
              Giris Yap <ArrowRight size={18} style={{ marginLeft: 8, verticalAlign: 'middle' }} />
            </button>
          </div>

          <div className="demo-note">
            <strong>Demo hesap:</strong> Form test kullanici bilgileriyle dolu geliyor. Istersen
            dogrudan giris yapip yeni kurumsal arayuzu tum sayfalarda inceleyebilirsin.
          </div>
        </form>
      </section>
    </div>
  );
};

export default Login;
