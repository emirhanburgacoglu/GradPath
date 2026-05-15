import ProjectCard from '../ProjectCard';

function RecommendationsSection({
  activeFilterCount,
  currentPage,
  loading,
  onClearFilters,
  onPageChange,
  recommendations,
  totalPages,
  totalResults,
  totalRecommendations,
}) {
  const visibleStart = totalResults ? (currentPage - 1) * 6 + 1 : 0;
  const visibleEnd = totalResults ? visibleStart + recommendations.length - 1 : 0;
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <section className="projects-section">
      <div className="section-header">
        <div>
          <h2 className="section-title">Önerilen Projeler</h2>
        </div>

        <div className="section-summary-pill">
          {totalResults}/{totalRecommendations} sonuç
        </div>
      </div>

      {loading ? (
        <div className="card loading-card">Veriler yükleniyor...</div>
      ) : recommendations.length > 0 ? (
        <>
          <div className="project-list">
            {recommendations.map((project, index) => (
              <ProjectCard key={`${project.projectId}-${index}`} project={project} />
            ))}
          </div>

          {totalPages > 1 ? (
            <div className="projects-pagination">
              <div className="projects-pagination-summary">
                {visibleStart}-{visibleEnd} arası gösteriliyor
              </div>

              <div className="projects-pagination-controls">
                <button
                  type="button"
                  className="ghost-button projects-pagination-button"
                  onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Önceki
                </button>

                <div className="projects-pagination-pages">
                  {pageNumbers.map((pageNumber) => (
                    <button
                      key={pageNumber}
                      type="button"
                      className={`projects-page-chip ${currentPage === pageNumber ? 'active' : ''}`}
                      onClick={() => onPageChange(pageNumber)}
                    >
                      {pageNumber}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  className="ghost-button projects-pagination-button"
                  onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Sonraki
                </button>
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <div className="empty-state empty-state-rich">
          <strong>Bu filtrelerle eşleşen proje bulunamadı.</strong>
          <p>Daha geniş bir liste görmek için filtreleri temizleyebilir ya da aramanı sadeleştirebilirsin.</p>
          {activeFilterCount ? (
            <button type="button" className="ghost-button" onClick={onClearFilters}>
              Filtreleri temizle
            </button>
          ) : null}
        </div>
      )}
    </section>
  );
}

export default RecommendationsSection;
