import { useEffect, useMemo, useState } from 'react';
import {
  Award,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import AppHeader from '../components/AppHeader';
import AppFooter from '../components/AppFooter';
import api, { resolvePhotoUrl } from '../api';

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
      return 'İleri';
    case 2:
      return 'Orta';
    default:
      return 'Başlangıç';
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
  footerNavItems,
  initials,
  navItems,
  onLogout,
  onViewChange,
  profile,
  profileActionLabel,
  profileActionViewId,
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

  const activeFilterChips = useMemo(() => {
    const chips = [];
    const selectedDepartment = directoryOptions.departments.find(
      (department) => String(department.id) === String(filters.departmentId)
    );
    const selectedTechnology = directoryOptions.technologies.find(
      (technology) => String(technology.id) === String(filters.technologyId)
    );

    if (filters.query.trim()) {
      chips.push({ key: 'query', label: `Arama: ${filters.query.trim()}` });
    }

    if (selectedDepartment) {
      chips.push({ key: 'department', label: `Bölüm: ${selectedDepartment.name}` });
    }

    if (selectedTechnology) {
      chips.push({ key: 'technology', label: `Teknoloji: ${selectedTechnology.name}` });
    }

    if (filters.minCgpa) {
      chips.push({ key: 'cgpa', label: `Min GPA: ${filters.minCgpa}` });
    }

    if (filters.honorOnly) {
      chips.push({ key: 'honor', label: 'Sadece onur öğrencileri' });
    }

    return chips;
  }, [directoryOptions.departments, directoryOptions.technologies, filters]);

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
      setActionError(getErrorMessage(error, 'Öğrenci dizini yüklenemedi. Lütfen tekrar dene.'));
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
      setActionError('Bazı öğrenci dizini verileri yüklenemedi. Sayfayı yenileyip tekrar deneyebilirsin.');
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

      setActionError(getErrorMessage(error, 'Öğrenci profili yüklenemedi. Lütfen tekrar dene.'));
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
          aria-label="Öğrenci profili"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="selection-modal-header">
            <div>
              <div className="selection-modal-kicker">Öğrenci profili</div>
              <h2>{selectedStudentProfile?.fullName || 'Profil yükleniyor'}</h2>
              <p>
                Yetkinlikler, eğitim geçmişi, projeler ve deneyimler bu alanda read-only olarak görünür.
              </p>
            </div>

            <button type="button" className="selection-modal-close" onClick={closeStudentProfile}>
              <X size={18} />
            </button>
          </div>

          {loadingProfileId === selectedStudentUserId ? (
            <div className="empty-state">Profil yükleniyor.</div>
          ) : selectedStudentProfile ? (
            <>
              <section className="selection-modal-section">
                <div className="applicant-public-profile-top">
                  <div className="applicant-public-profile-avatar">
                    {selectedStudentProfile.profilePhotoUrl ? (
                      <img
                        src={resolvePhotoUrl(selectedStudentProfile.profilePhotoUrl)}
                        alt={selectedStudentProfile.fullName || 'Öğrenci profil fotoğrafı'}
                        className="applicant-public-profile-avatar-image"
                      />
                    ) : (
                      getInitials(selectedStudentProfile.fullName)
                    )}
                  </div>

                  <div className="applicant-public-profile-copy">
                    <strong>{selectedStudentProfile.fullName}</strong>
                    <span>
                      {[
                        selectedStudentProfile.departmentName,
                        selectedStudentProfile.departmentCode,
                      ]
                        .filter(Boolean)
                        .join(' - ') || 'Bölüm bilgisi yok'}
                    </span>
                    {selectedStudentProfile.facultyName ? (
                      <span>{selectedStudentProfile.facultyName}</span>
                    ) : null}
                  </div>

                  <div className="applicant-public-profile-metrics">
                    <span className="project-meta-chip">GPA: {selectedStudentProfile.cgpa ?? '-'}</span>
                    <span className="project-meta-chip">AKTS: {selectedStudentProfile.totalECTS ?? '-'}</span>
                    {selectedStudentProfile.isHonorStudent ? (
                      <span className="post-status-pill open">Onur öğrencisi</span>
                    ) : null}
                  </div>
                </div>

                {selectedStudentProfile.cvSummary ? (
                  <div className="applicant-public-profile-summary">
                    <strong>CV özeti</strong>
                    <p>{selectedStudentProfile.cvSummary}</p>
                  </div>
                ) : null}

                <div className="applicant-public-profile-grid">
                  <article className="applicant-public-profile-card applicant-public-profile-card-accent">
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
                      <div className="applicant-public-profile-empty">Kayıtlı yetenek yok.</div>
                    )}
                  </article>

                  <article className="applicant-public-profile-card applicant-public-profile-card-accent">
                    <div className="applicant-public-profile-card-title">İlgi alanları</div>
                    {selectedStudentProfile.domainSignals?.length ? (
                      <div className="project-tags">
                        {selectedStudentProfile.domainSignals.map((signal) => (
                          <span key={signal.id || signal.name} className="tech-tag">
                            {signal.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="applicant-public-profile-empty">İlgi alanı eklenmemiş.</div>
                    )}
                  </article>

                  <article className="applicant-public-profile-card applicant-public-profile-card-full">
                    <div className="applicant-public-profile-card-title">Eğitim</div>
                    {selectedStudentProfile.educations?.length ? (
                      <div className="applicant-public-profile-list">
                        {selectedStudentProfile.educations.map((education) => (
                          <div
                            key={education.id || `${education.schoolName}-${education.startDateText}`}
                            className="applicant-public-profile-item"
                          >
                            <strong>{education.schoolName || 'Okul bilgisi yok'}</strong>
                            <span>
                              {[education.department, education.degree].filter(Boolean).join(' - ')}
                            </span>
                            <small>
                              {getDateRange(education.startDateText, education.endDateText) || 'Tarih bilgisi yok'}
                            </small>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="applicant-public-profile-empty">Eğitim kaydi yok.</div>
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
                            <strong>{experience.companyName || 'Deneyim kaydı'}</strong>
                            <span>{experience.position || 'Pozisyon belirtilmemiş'}</span>
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
                      <div className="applicant-public-profile-empty">Deneyim kaydı yok.</div>
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
                            <strong>{project.name || 'Proje kaydı'}</strong>
                            <span>
                              {[project.role, project.domain].filter(Boolean).join(' - ') || 'Rol veya alan belirtilmemiş'}
                            </span>
                            {project.description ? <p>{project.description}</p> : null}
                            <small>{project.isTeamProject ? 'Takım projesi' : 'Bireysel proje'}</small>
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
                      <div className="applicant-public-profile-empty">Proje kaydı yok.</div>
                    )}
                  </article>
                </div>
              </section>
            </>
          ) : (
            <div className="empty-state">Profil verisi bulunamadı.</div>
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
        navItems={navItems}
        onLogout={onLogout}
        onViewChange={onViewChange}
        profile={profile}
        profileActionLabel={profileActionLabel}
        profileActionViewId={profileActionViewId}
      />


      <main className="main-content student-directory-page">
        <section className="posts-page-header">
          <div className="posts-page-header-copy">
            <div style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800, color: 'rgba(31, 60, 136, 0.5)', fontSize: '0.75rem', marginBottom: '8px' }}>Öğrenci Dizini</div>
            <h1>Öğrenciler</h1>
            <p>Benzer alanlarda çalışan öğrencileri filtrele, profillerini incele ve ekip kurma kararını daha bilinçli ver.</p>
          </div>

          <div className="posts-page-header-actions">
            <button
              className="ghost-button"
              type="button"
              onClick={() => loadDirectory(true)}
              disabled={refreshing}
            >
              <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
              {refreshing ? 'Yenileniyor' : 'Listeyi Yenile'}
            </button>
          </div>
        </section>

        {actionError ? <div className="dashboard-alert">{actionError}</div> : null}

        <section className="posts-tabbar">
          <div className="posts-view-grid" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
            <div className="posts-view-card" style={{ padding: '16px 20px' }}>
              <div className="posts-view-card-top" style={{ marginBottom: '4px' }}>
                <span className="posts-view-icon">
                  <Users size={15} />
                </span>
                <div className="posts-view-card-copy">
                  <strong style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-soft)' }}>Görünen Öğrenci</strong>
                </div>
                <span className="posts-view-count" style={{ background: '#ffffff', fontSize: '0.65rem', minHeight: '24px', padding: '0 10px' }}>Toplam</span>
              </div>
              <strong style={{ display: 'block', fontSize: '1.4rem', color: '#0f2347' }}>{stats.totalStudents}</strong>
            </div>

            <div className="posts-view-card" style={{ padding: '16px 20px' }}>
              <div className="posts-view-card-top" style={{ marginBottom: '4px' }}>
                <span className="posts-view-icon">
                  <Award size={15} />
                </span>
                <div className="posts-view-card-copy">
                  <strong style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-soft)' }}>Onur Öğrencisi</strong>
                </div>
                <span className="posts-view-count" style={{ background: '#ffffff', fontSize: '0.65rem', minHeight: '24px', padding: '0 10px' }}>Seçili</span>
              </div>
              <strong style={{ display: 'block', fontSize: '1.4rem', color: '#0f2347' }}>{stats.honorStudents}</strong>
            </div>

            <div className="posts-view-card" style={{ padding: '16px 20px' }}>
              <div className="posts-view-card-top" style={{ marginBottom: '4px' }}>
                <span className="posts-view-icon">
                  <Sparkles size={15} />
                </span>
                <div className="posts-view-card-copy">
                  <strong style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-soft)' }}>Ortalama GPA</strong>
                </div>
                <span className="posts-view-count" style={{ background: '#ffffff', fontSize: '0.65rem', minHeight: '24px', padding: '0 10px' }}>Genel</span>
              </div>
              <strong style={{ display: 'block', fontSize: '1.4rem', color: '#0f2347' }}>{stats.averageCgpa}</strong>
            </div>

            <div className="posts-view-card" style={{ padding: '16px 20px' }}>
              <div className="posts-view-card-top" style={{ marginBottom: '4px' }}>
                <span className="posts-view-icon">
                  <SlidersHorizontal size={15} />
                </span>
                <div className="posts-view-card-copy">
                  <strong style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-soft)' }}>Alan Çeşitliliği</strong>
                </div>
                <span className="posts-view-count" style={{ background: '#ffffff', fontSize: '0.65rem', minHeight: '24px', padding: '0 10px' }}>Odak</span>
              </div>
              <strong style={{ display: 'block', fontSize: '1.4rem', color: '#0f2347' }}>{stats.uniqueDomainSignals}</strong>
            </div>
          </div>
        </section>
        <section className="profile-grid profile-grid-single">
          <article className="card profile-block">
            <div className="profile-card-header">
              <div>
                <div className="profile-section-title">
                  <SlidersHorizontal size={16} />
                  Öğrenci filtreleri
                </div>
              </div>
            </div>

            <form className="profile-form" onSubmit={submitFilters}>
              <div className="student-directory-filter-shell">
                <div className="student-directory-filter-primary">
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
                        placeholder="İsim, bölüm, teknoloji veya alan ara"
                      />
                    </div>
                  </label>

                  <div className="student-directory-filter-actions">
                    <button type="submit" className="btn-primary profile-submit-button" disabled={refreshing}>
                      {refreshing ? 'Filtreleniyor...' : 'Sonuçları Göster'}
                    </button>

                    <button type="button" className="ghost-button profile-inline-button" onClick={clearFilters}>
                      Filtreleri Temizle
                    </button>
                  </div>
                </div>

                <div className="student-directory-filter-grid">
                  <label className="profile-form-field">
                    <span className="field-label">Bölüm</span>
                    <select
                      className="input-field"
                      value={filters.departmentId}
                      onChange={(event) =>
                        setFilters((current) => ({ ...current, departmentId: event.target.value }))
                      }
                    >
                      <option value="">Tüm bölümler</option>
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
                      <option value="">Tüm teknolojiler</option>
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
                      placeholder="Örn. 3.0"
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
                      <span>Sadece onur öğrencilerini göster</span>
                    </div>
                  </label>
                </div>
              </div>

              {activeFilterChips.length ? (
                <div className="student-directory-active-filters">
                  {activeFilterChips.map((chip) => (
                    <span key={chip.key} className="student-directory-active-filter-chip">
                      {chip.label}
                    </span>
                  ))}
                </div>
              ) : null}
            </form>
          </article>
        </section>

        {loading ? (
          <article className="card loading-card">Öğrenci dizini yükleniyor.</article>
        ) : students.length ? (
          <section className="student-directory-grid">
            {students.map((student) => {
              const isProfileLoading = loadingProfileId === student.userId;

              return (
                <article key={student.userId} className="card student-directory-card">
                  <div className="student-directory-card-top">
                    <div className="student-directory-card-identity">
                      <div className="student-directory-avatar">
                        {student.profilePhotoUrl ? (
                          <img
                            src={resolvePhotoUrl(student.profilePhotoUrl)}
                            alt={student.fullName || 'Öğrenci profil fotoğrafı'}
                            className="student-directory-avatar-image"
                          />
                        ) : (
                          getInitials(student.fullName)
                        )}
                      </div>

                      <div className="student-directory-card-copy">
                        <strong>{student.fullName}</strong>
                        <span>
                          {[student.departmentName, student.departmentCode].filter(Boolean).join(' - ') || 'Bölüm bilgisi yok'}
                        </span>
                        {student.facultyName ? <small>{student.facultyName}</small> : null}
                      </div>
                    </div>

                    <div className="student-directory-card-aside">
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
                  </div>

                  <div className="student-directory-metrics-row">
                    <span><strong>{student.skillCount}</strong> Yetenek</span>
                    <span className="metric-dot">•</span>
                    <span><strong>{student.projectCount}</strong> Proje</span>
                    <span className="metric-dot">•</span>
                    <span><strong>{student.experienceCount}</strong> Deneyim</span>
                    <span className="metric-dot">•</span>
                    <span><strong>{student.totalECTS ?? '-'}</strong> AKTS</span>
                  </div>

                  {student.cvSummary ? (
                    <p className="student-directory-card-summary">
                      {getShortText(student.cvSummary, 140)}
                    </p>
                  ) : null}

                  <div className="student-directory-card-skills">
                    {student.skills?.length ? (
                      student.skills.slice(0, 4).map((skill) => (
                        <span key={`${student.userId}-${skill.technologyId}`} className="tech-tag matched">
                          {skill.technologyName}
                        </span>
                      ))
                    ) : (
                      <span className="project-empty-tag">Kayıtlı yetenek yok</span>
                    )}
                    {student.skills?.length > 4 && (
                      <span className="tech-tag-more">+{student.skills.length - 4}</span>
                    )}
                  </div>

                  <div className="student-directory-card-footer">
                    <button
                      type="button"
                      className="btn-primary student-directory-profile-btn"
                      onClick={() => openStudentProfile(student.userId)}
                      disabled={isProfileLoading}
                    >
                      <Sparkles size={16} />
                      {isProfileLoading ? 'Profil yükleniyor...' : 'Profili İncele'}
                    </button>
                  </div>

                </article>
              );
            })}
          </section>
        ) : (
          <article className="card empty-state">
            Seçili filtrelerle eşleşen öğrenci bulunamadı.
          </article>
        )}
      </main>

      <AppFooter currentView={currentView} navItems={footerNavItems} onViewChange={onViewChange} />
      {renderProfileModal()}
    </div>
  );
}

export default StudentDirectoryPage;

