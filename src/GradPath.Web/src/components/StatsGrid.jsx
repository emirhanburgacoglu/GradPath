import { BarChart3, BrainCircuit, Layers3, Target } from 'lucide-react';

function StatsGrid({ activeFilterCount, stats, totalProjects }) {
  return (
    <section className="stats-grid">
      <article className="card stat-card">
        <div className="stat-card-top">
          <span>Gösterilen Projeler</span>
          <Target size={18} />
        </div>
        <strong>
          {stats.totalProjects}/{totalProjects}
        </strong>
      </article>

      <article className="card stat-card">
        <div className="stat-card-top">
          <span>En Yüksek Uyum</span>
          <BarChart3 size={18} />
        </div>
        <strong>%{stats.topScore}</strong>
      </article>

      <article className="card stat-card">
        <div className="stat-card-top">
          <span>Ortalama Uyum</span>
          <BrainCircuit size={18} />
        </div>
        <strong>%{stats.averageScore}</strong>
      </article>

      <article className="card stat-card">
        <div className="stat-card-top">
          <span>Kategori Kapsamı</span>
          <Layers3 size={18} />
        </div>
        <strong>{stats.categoryCount}</strong>
      </article>
    </section>
  );
}

export default StatsGrid;
