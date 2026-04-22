import { BadgeCheck, BarChart3, BrainCircuit, Target } from 'lucide-react';

function StatsGrid({ stats }) {
  return (
    <section className="stats-grid">
      <article className="card stat-card">
        <div className="stat-card-top">
          <span>Oneri Havuzu</span>
          <Target size={18} />
        </div>
        <strong>{stats.totalProjects}</strong>
        <p>Profiline gore siralanan guncel proje onerilerinin toplami.</p>
      </article>

      <article className="card stat-card">
        <div className="stat-card-top">
          <span>En Yakin Eslesme</span>
          <BarChart3 size={18} />
        </div>
        <strong>%{stats.topScore}</strong>
        <p>Listede yer alan en guclu proje uyumunun ozet skoru.</p>
      </article>

      <article className="card stat-card">
        <div className="stat-card-top">
          <span>Ortalama Uyum</span>
          <BrainCircuit size={18} />
        </div>
        <strong>%{stats.averageScore}</strong>
        <p>Oneri havuzunun genel uyum seviyesini gosteren ortalama.</p>
      </article>

      <article className="card stat-card">
        <div className="stat-card-top">
          <span>Gelisim Alani</span>
          <BadgeCheck size={18} />
        </div>
        <strong>{stats.uniqueMissingSkills}</strong>
        <p>Guclendirildiginde daha fazla projeyi acabilecek eksik yetkinlikler.</p>
      </article>
    </section>
  );
}

export default StatsGrid;
