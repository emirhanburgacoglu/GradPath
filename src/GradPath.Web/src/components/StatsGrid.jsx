import { BadgeCheck, BarChart3, BrainCircuit, Target } from 'lucide-react';

function StatsGrid({ stats }) {
  return (
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
  );
}

export default StatsGrid;
