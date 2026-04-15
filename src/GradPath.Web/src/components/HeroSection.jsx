import { FileText, Sparkles } from 'lucide-react';

function HeroSection({ cgpa, totalECTS, isHonorStudent, stats, initials, profile, summaryText }) {
  return (
    <section className="hero-grid">
      <div className="card dashboard-hero">
        <div className="hero-badge">
          <Sparkles size={15} />
          Canlı öneri motoru
        </div>

        <h2>Proje seçimini sezgiyle değil, görünür verilerle yönet.</h2>

        <p>
          CGPA, yetenekler ve AI analizini aynı akışta birleştiren paneldesin. Daha iyi eşleşmeler
          için profilini güncel tut, sistem geri kalanını senin için sıralasın.
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
  );
}

export default HeroSection;
