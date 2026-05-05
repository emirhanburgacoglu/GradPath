import { FileText, Sparkles } from 'lucide-react';

function HeroSection({ cgpa, totalECTS, isHonorStudent, stats, initials, profile, summaryText }) {
  return (
    <section className="hero-grid">
      <div className="card dashboard-hero">
        <div className="hero-badge">
          <Sparkles size={15} />
          AI destekli eslesme sistemi
        </div>

        <h2>Akademik proje surecini daha sade, net ve olculebilir bir panelle yonet.</h2>

        <p>
          Profil bilgileri, akademik veriler ve sistem onerileri tek merkezde toplaniyor. Bu ekran
          sana projeleri karsilastirmak ve dogru firsatlari hizla gormek icin temiz bir akis sunar.
        </p>
      </div>

      <div className="hero-chip-row">
        <div className="card hero-chip">
          <span>CGPA</span>
          <strong>{cgpa ?? '-'}</strong>
        </div>

        <div className="card hero-chip">
          <span>AKTS</span>
          <strong>{totalECTS ?? '-'}</strong>
        </div>

        <div className="card hero-chip">
          <span>Durum</span>
          <strong>{isHonorStudent ? 'Onur' : 'Aktif'}</strong>
        </div>

        <div className="card hero-chip">
          <span>Oneriler</span>
          <strong>{stats.totalProjects}</strong>
        </div>
      </div>

      <div className="profile-panel-grid">
        <div className="card profile-panel">
          <div className="profile-panel-top">
            <div className="profile-avatar">{initials}</div>

            <div>
              <div className="profile-panel-name">{profile?.fullName || 'Profil hazirlaniyor'}</div>
              <div className="profile-panel-mail">{profile?.email || 'E-posta bilgisi yok'}</div>
            </div>
          </div>

          <div className="profile-panel-meta-grid">
            <div className="profile-panel-meta">
              <span>Profil durumu</span>
              <strong>{isHonorStudent ? 'Onur ogrencisi' : 'Aktif ogrenci'}</strong>
            </div>

            <div className="profile-panel-meta">
              <span>Eslesme havuzu</span>
              <strong>{stats.averageScore ? `%${stats.averageScore}` : 'Hazirlaniyor'}</strong>
            </div>
          </div>
        </div>

        <div className="card profile-panel">
          <div className="profile-summary">
            <div className="profile-summary-title">
              <FileText size={15} />
              CV Ozeti
            </div>
            <p>{summaryText}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
