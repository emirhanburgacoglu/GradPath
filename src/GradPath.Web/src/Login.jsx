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
        } catch (err) {
            setError('Giriş başarısız. E-posta veya şifreyi tekrar kontrol et.');
        }
    };

    return (
        <div className="login-shell">
            <section className="login-hero">
                <div className="login-brand">
                    <div className="login-brand-badge">GP</div>
                    <div className="login-brand-text">
                        <span className="login-brand-kicker">Academic Intelligence</span>
                        <span className="login-brand-name">GradPath</span>
                    </div>
                </div>

                <div className="login-copy">
                    <h1>Doğru projeyi, doğru öğrenciyle buluşturan ekran.</h1>
                    <p>
                        Akademik profilini, teknik becerilerini ve sistemin ürettiği eşleşmeleri
                        tek merkezden gör. GradPath, proje seçim sürecini sadece listelemek yerine
                        yöneten bir deneyime dönüştürür.
                    </p>

                    <div className="login-metrics">
                        <div className="login-metric">
                            <strong>AI Destekli</strong>
                            <span>CV ve transkript verilerinden daha güçlü profil çıkarımı.</span>
                        </div>

                        <div className="login-metric">
                            <strong>Skor Bazlı</strong>
                            <span>Projeler uyum puanı ve eksik yetenek analiziyle sıralanır.</span>
                        </div>

                        <div className="login-metric">
                            <strong>Takım Odaklı</strong>
                            <span>Eksiklerini kapatacak ekip arkadaşı önerilerine hazır altyapı.</span>
                        </div>
                    </div>
                </div>
            </section>

            <section className="login-panel">
                <form className="login-card" onSubmit={handleLogin}>
                    <div className="login-card-top">
                        <div className="login-pill">
                            <Sparkles size={15} />
                            Öğrenci Girişi
                        </div>

                        <h2>Akademik paneline geri dön.</h2>
                        <p>
                            Hesabına giriş yaparak proje eşleşmelerini, profil özetini ve öneri
                            motorunun ürettiği sonuçları görüntüleyebilirsin.
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
                            <label className="field-label">Şifre</label>
                            <input
                                type="password"
                                className="input-field"
                                placeholder="Şifrenizi girin"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <div className="helper-row">
                            <span>
                                <ShieldCheck size={14} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} />
                                JWT ile güvenli oturum
                            </span>
                            <span>
                                <ChartSpline size={14} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} />
                                Canlı eşleşme görünümü
                            </span>
                        </div>

                        <button type="submit" className="btn-primary">
                            Giriş Yap <ArrowRight size={18} style={{ marginLeft: 8, verticalAlign: 'middle' }} />
                        </button>
                    </div>

                    <div className="demo-note">
                        <strong>Demo hesap:</strong> Form zaten test kullanıcı bilgileriyle dolu.
                        İstersen doğrudan giriş yapıp yeni tasarımı dashboard tarafında da kontrol edebilirsin.
                    </div>
                </form>
            </section>
        </div>
    );
};

export default Login;
