import { useEffect, useMemo, useState } from 'react';
import {
  Award,
  Briefcase,
  Building2,
  FolderKanban,
  GraduationCap,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import AppHeader from '../components/AppHeader';
import api from '../api';

function createEmptyFilters() {
  return {
    query: '',
    departmentId: '',
    technologyId: '',
    minCgpa: '',
    honorOnly: false,
  };
}

function getErrorMessage(error, fallback) {
  const responseData = error?.response?.data;

  if (typeof responseData === 'string' && responseData.trim()) {
    return responseData;
  }

  return responseData?.message || responseData?.title || fallback;
}

function getInitials(fullName) {
  return (fullName || '')
    .split(' ')
    .map((part) => part?.[0] || '')
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'GP';
}

function getDateRange(startDateText, endDateText) {
  return [startDateText, endDateText].filter(Boolean).join(' - ');
}

function getProficiencyLabel(level) {
  switch (level) {
    case 3:
      return 'Ileri';
    case 2:
      return 'Orta';
    default:
      return 'Baslangic';
  }
}

function getShortText(value, maxLength = 180) {
  const normalizedValue = String(value || '').trim();

  if (!normalizedValue) {
    return '';
  }

  if (normalizedValue.length <= maxLength) {
    return normalizedValue;
  }

  return `${normalizedValue.slice(0, maxLength).trim()}...`;
}

function buildDirectoryParams(filters) {
  const params = {};

  if (filters.query.trim()) {
    params.query = filters.query.trim();
  }

  if (filters.departmentId) {
    params.departmentId = Number(filters.departmentId);
  }

  if (filters.technologyId) {
    params.technologyId = Number(filters.technologyId);
  }

  if (filters.minCgpa !== '' && filters.minCgpa !== null) {
    params.minCgpa = Number(filters.minCgpa);
  }

  if (filters.honorOnly) {
    params.honorOnly = true;
  }

  return params;
}

function StudentDirectoryPage({
  currentView,
  initials,
  onLogout,
  onViewChange,
  profile,
}) {
  const [directoryOptions, setDirectoryOptions] = useState({
    departments: [],
    technologies: [],
  });
  const [filters, setFilters] = useState(createEmptyFilters());
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [actionError, setActionError] = useState('');
  const [selectedStudentUserId, setSelectedStudentUserId] = useState('');
  const [selectedStudentProfile, setSelectedStudentProfile] = useState(null);
  const [loadingProfileId, setLoadingProfileId] = useState('');

  const stats = useMemo(() => {
    const visibleCgpas = students
      .map((student) => student.cgpa)
      .filter((value) => value !== null && value !== undefined);

    const averageCgpa = visibleCgpas.length
      ? (visibleCgpas.reduce((sum, value) => sum + Number(value), 0) / visibleCgpas.length).toFixed(2)
      : '0.00';

    const uniqueDomainSignals = new Set(
      students.flatMap((student) => student.domainSignals || [])
    ).size;

    return {
      totalStudents: students.length,
      honorStudents: students.filter((student) => student.isHonorStudent).length,
      averageCgpa,
      uniqueDomainSignals,
    };
  }, [students]);

  const closeStudentProfile = () => {
    setSelectedStudentUserId('');
    setSelectedStudentProfile(null);
    setLoadingProfileId('');
  };

  useEffect(() => {
    if (!selectedStudentUserId) {
      return undefined;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        closeStudentProfile();
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [selectedStudentUserId]);

  const loadDirectory = async (silent = false, activeFilters = filters) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setActionError('');

    try {
      const response = await api.get('/student/directory', {
        params: buildDirectoryParams(activeFilters),
      });

      setStudents(response.data || []);
    } catch (error) {
      if (error?.response?.status === 401) {
        onLogout();
        return;
      }

      setStudents([]);
      setActionError(getErrorMessage(error, 'Ogrenci dizini yuklenemedi. Lutfen tekrar dene.'));
    } finally {
      if (silent) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const loadInitialData = async () => {
    setLoading(true);
    setActionError('');

    const [optionsResult, directoryResult] = await Promise.allSettled([
      api.get('/student/directory/options'),
      api.get('/student/directory', {
        params: buildDirectoryParams(createEmptyFilters()),
      }),
    ]);

    if (
      (optionsResult.status === 'rejected' && optionsResult.reason?.response?.status === 401)
      || (directoryResult.status === 'rejected' && directoryResult.reason?.response?.status === 401)
    ) {
      onLogout();
      return;
    }

    if (optionsResult.status === 'fulfilled') {
      setDirectoryOptions({
        departments: optionsResult.value.data?.departments || [],
        technologies: optionsResult.value.data?.technologies || [],
      });
    } else {
      setDirectoryOptions({
        departments: [],
        technologies: [],
      });
    }

    if (directoryResult.status === 'fulfilled') {
      setStudents(directoryResult.value.data || []);
    } else {
      setStudents([]);
    }

    if (optionsResult.status === 'rejected' || directoryResult.status === 'rejected') {
      setActionError('Bazi ogrenci dizini verileri yuklenemedi. Sayfayi yenileyip tekrar deneyebilirsin.');
    }

    setLoading(false);
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const submitFilters = async (event) => {
    event.preventDefault();
    await loadDirectory(true);
  };

  const clearFilters = async () => {
    const emptyFilters = createEmptyFilters();
    setFilters(emptyFilters);
    await loadDirectory(true, emptyFilters);
  };

  const openStudentProfile = async (userId) => {
    setLoadingProfileId(userId);
    setActionError('');

    try {
      const response = await api.get(`/student/${userId}/public-profile`);
      setSelectedStudentUserId(userId);
      setSelectedStudentProfile(response.data || null);
    } catch (error) {
      if (error?.response?.status === 401) {
        onLogout();
        return;
      }

      setActionError(getErrorMessage(error, 'Ogrenci profili yuklenemedi. Lutfen tekrar dene.'));
    } finally {
      setLoadingProfileId('');
    }
  };

  const renderProfileModal = () => {
    if (!selectedStudentUserId) {
      return null;
    }

    return (
      <div className="selection-modal-overlay" onClick={closeStudentProfile}>
        <div
          className="selection-modal student-directory-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Ogrenci profili"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="selection-modal-header">
            <div>
              <div className="selection-modal-kicker">Ogrenci profili</div>
              <h2>{selectedStudentProfile?.fullName || 'Profil yukleniyor'}</h2>
              <p>
                Yetkinlikler, egitim gecmisi, projeler ve deneyimler bu alanda read-only olarak gorunur.
              </p>
            </div>

            <button type="button" className="selection-modal-close" onClick={closeStudentProfile}>
              <X size={18} />
            </button>
          </div>

          {loadingProfileId === selectedStudentUserId ? (
            <div className="empty-state">Profil yukleniyor.</div>
          ) : selectedStudentProfile ? (
            <>
              <section className="selection-modal-section">
                <div className="applicant-public-profile-top">
                  <div className="applicant-public-profile-copy">
                    <strong>{selectedStudentProfile.fullName}</strong>
                    <span>
                      {[
                        selectedStudentProfile.departmentName,
                        selectedStudentProfile.departmentCode,
                      ]
                        .filter(Boolean)
                        .join(' • ') || 'Bolum bilgisi yok'}
                    </span>
                    {selectedStudentProfile.facultyName ? (
                      <span>{selectedStudentProfile.facultyName}</span>
                    ) : null}
                  </div>

                  <div className="applicant-public-profile-metrics">
                    <span className="project-meta-chip">GPA: {selectedStudentProfile.cgpa ?? '-'}</span>
                    <span className="project-meta-chip">AKTS: {selectedStudentProfile.totalECTS ?? '-'}</span>
                    {selectedStudentProfile.isHonorStudent ? (
                      <span className="post-status-pill open">Onur ogrencisi</span>
                    ) : null}
                  </div>
                </div>

                {selectedStudentProfile.cvSummary ? (
                  <div className="applicant-public-profile-summary">
                    <strong>CV ozeti</strong>
                    <p>{selectedStudentProfile.cvSummary}</p>
                  </div>
                ) : null}

                <div className="applicant-public-profile-grid">
                  <article className="applicant-public-profile-card">
                    <div className="applicant-public-profile-card-title">Yetenekler</div>
                    {selectedStudentProfile.skills?.length ? (
                      <div className="project-tags">
                        {selectedStudentProfile.skills.map((skill) => (
                          <span
                            key={`${skill.technologyId}-${skill.proficiencyLevel}`}
                            className="tech-tag matched"
                          >
                            {skill.technologyName} • {getProficiencyLabel(skill.proficiencyLevel)}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="applicant-public-profile-empty">Kayitli yetenek yok.</div>
                    )}
                  </article>

                  <article className="applicant-public-profile-card">
                    <div className="applicant-public-profile-card-title">Ilgi alanlari</div>
                    {selectedStudentProfile.domainSignals?.length ? (
                      <div className="project-tags">
                        {selectedStudentProfile.domainSignals.map((signal) => (
                          <span key={signal.id || signal.name} className="tech-tag">
                            {signal.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="applicant-public-profile-empty">Ilgi alani eklenmemis.</div>
                    )}
                  </article>

                  <article className="applicant-public-profile-card applicant-public-profile-card-full">
                    <div className="applicant-public-profile-card-title">Egitim</div>
                    {selectedStudentProfile.educations?.length ? (
                      <div className="applicant-public-profile-list">
                        {selectedStudentProfile.educations.map((education) => (
                          <div
                            key={education.id || `${education.schoolName}-${education.startDateText}`}
                            className="applicant-public-profile-item"
                          >
                            <strong>{education.schoolName || 'Okul bilgisi yok'}</strong>
                            <span>
                              {[education.department, education.degree].filter(Boolean).join(' • ')}
                            </span>
                            <small>
                              {getDateRange(education.startDateText, education.endDateText) || 'Tarih bilgisi yok'}
                            </small>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="applicant-public-profile-empty">Egitim kaydi yok.</div>
                    )}
                  </article>

                  <article className="applicant-public-profile-card applicant-public-profile-card-full">
                    <div className="applicant-public-profile-card-title">Deneyimler</div>
                    {selectedStudentProfile.experiences?.length ? (
                      <div className="applicant-public-profile-list">
                        {selectedStudentProfile.experiences.map((experience) => (
                          <div
                            key={experience.id || `${experience.companyName}-${experience.position}`}
                            className="applicant-public-profile-item"
                          >
                            <strong>{experience.companyName || 'Deneyim kaydi'}</strong>
                            <span>{experience.position || 'Pozisyon belirtilmemis'}</span>
                            <small>
                              {getDateRange(experience.startDateText, experience.endDateText) || 'Tarih bilgisi yok'}
                            </small>
                            {experience.description ? <p>{experience.description}</p> : null}
                            {experience.technologyNames?.length ? (
                              <div className="project-tags">
                                {experience.technologyNames.map((technologyName) => (
                                  <span key={technologyName} className="tech-tag">
                                    {technologyName}
                                  </span>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="applicant-public-profile-empty">Deneyim kaydi yok.</div>
                    )}
                  </article>

                  <article className="applicant-public-profile-card applicant-public-profile-card-full">
                    <div className="applicant-public-profile-card-title">Projeler</div>
                    {selectedStudentProfile.cvProjects?.length ? (
                      <div className="applicant-public-profile-list">
                        {selectedStudentProfile.cvProjects.map((project) => (
                          <div
                            key={project.id || `${project.name}-${project.role}`}
                            className="applicant-public-profile-item"
                          >
                            <strong>{project.name || 'Proje kaydi'}</strong>
                            <span>
                              {[project.role, project.domain].filter(Boolean).join(' • ') || 'Rol veya domain belirtilmemis'}
                            </span>
                            {project.description ? <p>{project.description}</p> : null}
                            <small>{project.isTeamProject ? 'Takim projesi' : 'Bireysel proje'}</small>
                            {project.technologyNames?.length ? (
                              <div className="project-tags">
                                {project.technologyNames.map((technologyName) => (
                                  <span key={technologyName} className="tech-tag">
                                    {technologyName}
                                  </span>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="applicant-public-profile-empty">Proje kaydi yok.</div>
                    )}
                  </article>
                </div>
              </section>
            </>
          ) : (
            <div className="empty-state">Profil verisi bulunamadi.</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="app-layout">
      <AppHeader
        currentView={currentView}
        initials={initials}
        onLogout={onLogout}
        onViewChange={onViewChange}
        profile={profile}
      />

      <main className="main-content">
        <div className="dashboard-header">
          <div>
            <p className="dashboard-date">Ogrenci Dizini</p>
            <h1 className="dashboard-title">Ogrenciler</h1>
            <p className="dashboard-subtitle">
              Benzer alanlarda calisan ogrencileri filtrele, profillerini incele ve ekip kurma kararini daha bilincli ver.
            </p>
          </div>

          <div className="dashboard-actions">
            <button
              type="button"
              className="ghost-button"
              onClick={() => loadDirectory(true)}
              disabled={refreshing}
            >
              <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
              {refreshing ? 'Yenileniyor' : 'Listeyi Yenile'}
            </button>
          </div>
        </div>

        {actionError ? <div className="dashboard-alert">{actionError}</div> : null}

        <section className="posts-stats-grid">
          <article className="card posts-stat-card">
            <span className="posts-stat-label">Gorunen Ogrenci</span>
            <strong className="posts-stat-value">{stats.totalStudents}</strong>
            <p className="posts-stat-copy">Secili filtrelerle listelenen ogrenci sayisi.</p>
          </article>

          <article className="card posts-stat-card">
            <span className="posts-stat-label">Onur Ogrencisi</span>
            <strong className="posts-stat-value">{stats.honorStudents}</strong>
            <p className="posts-stat-copy">Yuksek akademik performansa sahip ogrenciler.</p>
          </article>

          <article className="card posts-stat-card">
            <span className="posts-stat-label">Ortalama GPA</span>
            <strong className="posts-stat-value">{stats.averageCgpa}</strong>
            <p className="posts-stat-copy">Listelenen ogrencilerin guncel not ortalamasi.</p>
          </article>

          <article className="card posts-stat-card">
            <span className="posts-stat-label">Alan Cesitliligi</span>
            <strong className="posts-stat-value">{stats.uniqueDomainSignals}</strong>
            <p className="posts-stat-copy">Kesisen teknik alan ve odak sayisi.</p>
          </article>
        </section>

        <section className="profile-grid profile-grid-single">
          <article className="card profile-block">
            <div className="profile-card-header">
              <div>
                <div className="profile-section-title">
                  <SlidersHorizontal size={16} />
                  Ogrenci filtreleri
                </div>
                <div className="profile-section-meta">
                  Listeyi bolum, teknoloji, GPA ve arama sorgusuyla daralt.
                </div>
              </div>
            </div>

            <form className="profile-form" onSubmit={submitFilters}>
              <div className="student-directory-filter-grid">
                <label className="profile-form-field student-directory-filter-search">
                  <span className="field-label">Arama</span>
                  <div className="post-search-shell">
                    <Search size={16} />
                    <input
                      className="input-field post-search-input"
                      value={filters.query}
                      onChange={(event) =>
                        setFilters((current) => ({ ...current, query: event.target.value }))
                      }
                      placeholder="Isim, bolum, teknoloji veya alan ara"
                    />
                  </div>
                </label>

                <label className="profile-form-field">
                  <span className="field-label">Bolum</span>
                  <select
                    className="input-field"
                    value={filters.departmentId}
                    onChange={(event) =>
                      setFilters((current) => ({ ...current, departmentId: event.target.value }))
                    }
                  >
                    <option value="">Tum bolumler</option>
                    {directoryOptions.departments.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="profile-form-field">
                  <span className="field-label">Teknoloji</span>
                  <select
                    className="input-field"
                    value={filters.technologyId}
                    onChange={(event) =>
                      setFilters((current) => ({ ...current, technologyId: event.target.value }))
                    }
                  >
                    <option value="">Tum teknolojiler</option>
                    {directoryOptions.technologies.map((technology) => (
                      <option key={technology.id} value={technology.id}>
                        {technology.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="profile-form-field">
                  <span className="field-label">Minimum GPA</span>
                  <input
                    type="number"
                    min="0"
                    max="4"
                    step="0.1"
                    className="input-field"
                    value={filters.minCgpa}
                    onChange={(event) =>
                      setFilters((current) => ({ ...current, minCgpa: event.target.value }))
                    }
                    placeholder="Orn. 3.0"
                  />
                </label>

                <label className="profile-form-field student-directory-filter-checkbox">
                  <span className="field-label">Akademik durum</span>
                  <div className="profile-checkbox-wrap">
                    <input
                      type="checkbox"
                      checked={filters.honorOnly}
                      onChange={(event) =>
                        setFilters((current) => ({ ...current, honorOnly: event.target.checked }))
                      }
                    />
                    <span>Sadece onur ogrencilerini goster</span>
                  </div>
                </label>
              </div>

              <div className="profile-form-actions">
                <button type="submit" className="btn-primary profile-submit-button" disabled={refreshing}>
                  {refreshing ? 'Filtreleniyor...' : 'Filtreleri Uygula'}
                </button>

                <button type="button" className="ghost-button profile-inline-button" onClick={clearFilters}>
                  Filtreleri Temizle
                </button>
              </div>
            </form>
          </article>
        </section>

        {loading ? (
          <article className="card loading-card">Ogrenci dizini yukleniyor.</article>
        ) : students.length ? (
          <section className="student-directory-grid">
            {students.map((student) => {
              const isProfileLoading = loadingProfileId === student.userId;

              return (
                <article key={student.userId} className="card student-directory-card">
                  <div className="student-directory-card-top">
                    <div className="student-directory-card-identity">
                      <div className="student-directory-avatar">{getInitials(student.fullName)}</div>

                      <div className="student-directory-card-copy">
                        <strong>{student.fullName}</strong>
                        <span>
                          {[student.departmentName, student.departmentCode].filter(Boolean).join(' • ') || 'Bolum bilgisi yok'}
                        </span>
                        {student.facultyName ? <small>{student.facultyName}</small> : null}
                      </div>
                    </div>

                    <div className="student-directory-card-metrics">
                      <span className="project-meta-chip">GPA: {student.cgpa ?? '-'}</span>
                      {student.isHonorStudent ? (
                        <span className="post-status-pill open">
                          <Award size={14} />
                          Onur
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="post-meta-row">
                    <span className="project-meta-chip">
                      <Users size={14} />
                      Yetenek: {student.skillCount}
                    </span>
                    <span className="project-meta-chip">
                      <FolderKanban size={14} />
                      Proje: {student.projectCount}
                    </span>
                    <span className="project-meta-chip">
                      <Briefcase size={14} />
                      Deneyim: {student.experienceCount}
                    </span>
                    <span className="project-meta-chip subtle">
                      <GraduationCap size={14} />
                      AKTS: {student.totalECTS ?? '-'}
                    </span>
                  </div>

                  {student.cvSummary ? (
                    <p className="student-directory-card-summary">
                      {getShortText(student.cvSummary, 190)}
                    </p>
                  ) : (
                    <p className="student-directory-card-summary student-directory-card-summary-muted">
                      Bu ogrenci icin henuz paylasilan bir ozet bulunmuyor.
                    </p>
                  )}

                  <div className="post-card-section">
                    <div className="post-card-section-title">One cikan yetenekler</div>
                    <div className="project-tags">
                      {student.skills?.length ? (
                        student.skills.map((skill) => (
                          <span
                            key={`${student.userId}-${skill.technologyId}-${skill.proficiencyLevel}`}
                            className="tech-tag matched"
                          >
                            {skill.technologyName} • {getProficiencyLabel(skill.proficiencyLevel)}
                          </span>
                        ))
                      ) : (
                        <span className="project-empty-tag">Kayitli yetenek yok</span>
                      )}
                    </div>
                  </div>

                  <div className="post-card-section">
                    <div className="post-card-section-title">Ilgi alanlari</div>
                    <div className="project-tags">
                      {student.domainSignals?.length ? (
                        student.domainSignals.map((signal) => (
                          <span key={`${student.userId}-${signal}`} className="tech-tag">
                            {signal}
                          </span>
                        ))
                      ) : (
                        <span className="project-empty-tag">Alan bilgisi yok</span>
                      )}
                    </div>
                  </div>

                  <div className="student-directory-card-actions">
                    <button
                      type="button"
                      className="ghost-button profile-inline-button"
                      onClick={() => openStudentProfile(student.userId)}
                      disabled={isProfileLoading}
                    >
                      <Sparkles size={15} />
                      {isProfileLoading ? 'Profil yukleniyor...' : 'Profili incele'}
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        ) : (
          <article className="card empty-state">
            Secili filtrelerle eslesen ogrenci bulunamadi.
          </article>
        )}
      </main>

      {renderProfileModal()}
    </div>
  );
}

export default StudentDirectoryPage;
