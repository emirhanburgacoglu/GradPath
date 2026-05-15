import { ArrowRight, SlidersHorizontal, Sparkles } from 'lucide-react';

function HeroSection({
  activeFilterCount,
  categoryOptions,
  departmentOptions,
  filteredCount,
  filters,
  firstName,
  onClearFilters,
  onFilterChange,
  onOpenProfile,
  showProfilePrompt,
  stats,
}) {
  return (
    <section className="hero-grid">
      <div className="card dashboard-hero dashboard-hero-projects">
        <div className="hero-badge">
          <Sparkles size={15} />
          Proje keşif alanı
        </div>

        <h2>Sana uygun projeleri filtrele, karşılaştır ve en doğru fırsata odaklan.</h2>

        <p>
          Hoş geldin {firstName}. Bu ekran artık profil detaylarını değil, proje önerilerini hızlı
          incelemeni ve karar vermeni kolaylaştıran net bir akış sunuyor.
        </p>

        <div className="dashboard-hero-meta">
          <div className="dashboard-hero-meta-item">
            <span>Gösterilen proje</span>
            <strong>{filteredCount}</strong>
          </div>

          <div className="dashboard-hero-meta-item">
            <span>Toplam öneriler</span>
            <strong>{stats.totalProjects}</strong>
          </div>

          <div className="dashboard-hero-meta-item">
            <span>Aktif filtre</span>
            <strong>{activeFilterCount}</strong>
          </div>
        </div>
      </div>

      <div className="card dashboard-filter-panel">
        <div className="dashboard-filter-panel-top">
          <div>
            <div className="dashboard-filter-title">
              <SlidersHorizontal size={16} />
              Proje filtreleri
            </div>
          </div>

          {activeFilterCount ? (
            <button
              type="button"
              className="ghost-button dashboard-filter-clear"
              onClick={onClearFilters}
            >
              Filtreleri temizle
            </button>
          ) : null}
        </div>

        <div className="dashboard-filter-grid dashboard-filter-grid-compact">
          <label className="dashboard-filter-field">
            <span>Bölüm</span>
            <select
              className="input-field"
              value={filters.department}
              onChange={(event) => onFilterChange('department', event.target.value)}
            >
              <option value="all">Tüm bölümler</option>
              {departmentOptions.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>
          </label>

          <label className="dashboard-filter-field">
            <span>Kategori</span>
            <select
              className="input-field"
              value={filters.category}
              onChange={(event) => onFilterChange('category', event.target.value)}
            >
              <option value="all">Tüm kategoriler</option>
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {showProfilePrompt ? (
        <div className="card dashboard-profile-hint">
          <div className="dashboard-profile-hint-copy">
            <span>Profil ipucu</span>
            <strong>Eşleşmeleri güçlendirmek için profilini güncelle</strong>
          </div>

          <button type="button" className="ghost-button" onClick={onOpenProfile}>
            Profile git
            <ArrowRight size={16} />
          </button>
        </div>
      ) : null}
    </section>
  );
}

export default HeroSection;
