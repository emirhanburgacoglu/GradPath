import ProjectCard from '../ProjectCard';

function RecommendationsSection({ loading, recommendations }) {
  return (
    <section className="projects-section">
      <div className="section-header">
        <div>
          <h2 className="section-title">Eşleşen Projeler</h2>
          <p className="section-note">Backend'den gelen gerçek öneriler burada listeleniyor.</p>
        </div>
      </div>

      {loading ? (
        <div className="card loading-card">Veriler yükleniyor...</div>
      ) : recommendations.length > 0 ? (
        recommendations.map((project, index) => (
          <ProjectCard key={`${project.projectId}-${index}`} project={project} />
        ))
      ) : (
        <div className="empty-state">
          Henüz sana uygun proje bulunamadı. Profiline CGPA, yetenek ve CV bilgisi ekleyince bu
          alan güçlenecek.
        </div>
      )}
    </section>
  );
}

export default RecommendationsSection;
