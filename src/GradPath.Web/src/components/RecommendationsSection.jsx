import ProjectCard from '../ProjectCard';

function RecommendationsSection({ loading, recommendations }) {
  return (
    <section className="projects-section">
      <div className="section-header">
        <div>
          <h2 className="section-title">Proje Onerileri</h2>
          <p className="section-note">
            Sistem tarafindan hesaplanan uyum skorlarina gore listelenen aktif oneriler.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="card loading-card">Veriler yukleniyor...</div>
      ) : recommendations.length > 0 ? (
        recommendations.map((project, index) => (
          <ProjectCard key={`${project.projectId}-${index}`} project={project} />
        ))
      ) : (
        <div className="empty-state">
          Henuz sana uygun proje bulunamadi. Profiline CGPA, yetenek ve CV bilgisi ekledikce bu
          alan daha guclu hale gelir.
        </div>
      )}
    </section>
  );
}

export default RecommendationsSection;
