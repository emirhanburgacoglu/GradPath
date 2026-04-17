import { useEffect, useState } from 'react';

import {
  Award,
  FileBadge2,
  FileText,
  GraduationCap,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Sparkles,
  Trash2,
  Upload,
  Wrench,
  X,
} from 'lucide-react';
import AppHeader from '../components/AppHeader';
import api from '../api';

function safeParseAnalysis(profile) {
  if (!profile?.cvAnalysisJson) {
    return null;
  }

  try {
    const parsed = JSON.parse(profile.cvAnalysisJson);
    const rawSkillsByCategory = parsed?.SkillsByCategory || parsed?.skillsByCategory || [];
    const rawProjects = parsed?.Projects || parsed?.projects || [];
    const rawExperiences = parsed?.Experiences || parsed?.experiences || [];
    const rawEducation = parsed?.Education || parsed?.education || [];
    const rawDomainSignals = parsed?.DomainSignals || parsed?.domainSignals || [];

    return {
      SkillsByCategory: rawSkillsByCategory.map((category) => ({
        CategoryName: category?.CategoryName || category?.categoryName || 'Diger',
        Skills: category?.Skills || category?.skills || [],
      })),
      Projects: rawProjects.map((project) => ({
        Name: project?.Name || project?.name || project?.ProjectName || project?.projectName || '',
        Role: project?.Role || project?.role || '',
        Description: project?.Description || project?.description || '',
        Technologies: project?.Technologies || project?.technologies || [],
      })),
      Experiences: rawExperiences.map((experience) => ({
        CompanyName: experience?.CompanyName || experience?.companyName || '',
        Position: experience?.Position || experience?.position || '',
        StartDateText: experience?.StartDateText || experience?.startDateText || '',
        EndDateText: experience?.EndDateText || experience?.endDateText || '',
        Description: experience?.Description || experience?.description || '',
      })),
      Education: rawEducation.map((item) => ({
        SchoolName: item?.SchoolName || item?.schoolName || '',
        Department: item?.Department || item?.department || '',
        Degree: item?.Degree || item?.degree || '',
        StartDateText: item?.StartDateText || item?.startDateText || '',
        EndDateText: item?.EndDateText || item?.endDateText || '',
      })),
      DomainSignals: rawDomainSignals
        .map((signal) =>
          typeof signal === 'string'
            ? { Name: signal }
            : {
                Name:
                  signal?.Name ||
                  signal?.name ||
                  signal?.DomainName ||
                  signal?.domainName ||
                  '',
              }
        )
        .filter((signal) => signal.Name),
      RawSummary: parsed?.RawSummary || parsed?.rawSummary || '',
      NormalizedSummary: parsed?.NormalizedSummary || parsed?.normalizedSummary || '',
    };
  } catch {
    return null;
  }
}

function createEmptyEducationForm() {
  return {
    schoolName: '',
    department: '',
    degree: '',
    startDateText: '',
    endDateText: '',
  };
}

function createEmptyExperienceForm() {
  return {
    companyName: '',
    position: '',
    startDateText: '',
    endDateText: '',
    description: '',
    technologiesText: '',
  };
}

function createEmptyProjectForm() {
  return {
    name: '',
    description: '',
    role: '',
    domain: '',
    isTeamProject: false,
    technologiesText: '',
  };
}

function createEmptyDomainSignalForm() {
  return {
    name: '',
  };
}

function getDateRange(startDateText, endDateText) {
  return [startDateText, endDateText].filter(Boolean).join(' - ');
}

function splitCommaSeparatedValues(value) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function getErrorMessage(error, fallback) {
  const responseData = error?.response?.data;
  if (typeof responseData === 'string' && responseData.trim()) {
    return responseData;
  }

  return responseData?.message || fallback;
}

function ProfilePage({
  cgpa,
  currentView,
  error,
  initials,
  isHonorStudent,
  onLogout,
  onRefresh,
  onViewChange,
  profile,
  refreshing,
  summaryText,
  totalECTS,
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const [cvFile, setCvFile] = useState(null);
  const [transcriptFile, setTranscriptFile] = useState(null);
  const [uploadingCv, setUploadingCv] = useState(false);
  const [uploadingTranscript, setUploadingTranscript] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [educationItems, setEducationItems] = useState([]);
  const [experienceItems, setExperienceItems] = useState([]);
  const [projectItems, setProjectItems] = useState([]);
  const [domainSignalItems, setDomainSignalItems] = useState([]);
  const [loadingNormalizedData, setLoadingNormalizedData] = useState(false);
  const [hasLoadedNormalizedData, setHasLoadedNormalizedData] = useState(false);
  const [savingSection, setSavingSection] = useState('');
  const [deletingKey, setDeletingKey] = useState('');

  const [educationForm, setEducationForm] = useState(createEmptyEducationForm());
  const [editingEducationId, setEditingEducationId] = useState(null);
  const [experienceForm, setExperienceForm] = useState(createEmptyExperienceForm());
  const [editingExperienceId, setEditingExperienceId] = useState(null);
  const [projectForm, setProjectForm] = useState(createEmptyProjectForm());
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [domainSignalForm, setDomainSignalForm] = useState(createEmptyDomainSignalForm());
  const [editingDomainSignalId, setEditingDomainSignalId] = useState(null);

  const analysis = safeParseAnalysis(profile);
  const skillsByCategory = analysis?.SkillsByCategory || [];

  const overviewEducation = hasLoadedNormalizedData
    ? educationItems.map((item) => ({
        SchoolName: item.schoolName,
        Department: item.department,
        Degree: item.degree,
        StartDateText: item.startDateText,
        EndDateText: item.endDateText,
      }))
    : analysis?.Education || [];

  const overviewDomainSignals = hasLoadedNormalizedData
    ? domainSignalItems.map((item) => item.name).filter(Boolean)
    : (analysis?.DomainSignals || []).map((item) => item.Name).filter(Boolean);

  const tabs = [
    { id: 'overview', label: 'Genel Bakis' },
    { id: 'skills', label: 'Yetkinlikler' },
    { id: 'education', label: 'Egitim' },
    { id: 'experiences', label: 'Deneyimler' },
    { id: 'projects', label: 'Projeler' },
    { id: 'signals', label: 'Alanlar' },
    { id: 'documents', label: 'Belgeler' },
  ];

  const clearFeedback = () => {
    setActionMessage('');
    setActionError('');
  };

  const resetEducationEditor = () => {
    setEditingEducationId(null);
    setEducationForm(createEmptyEducationForm());
  };

  const resetExperienceEditor = () => {
    setEditingExperienceId(null);
    setExperienceForm(createEmptyExperienceForm());
  };

  const resetProjectEditor = () => {
    setEditingProjectId(null);
    setProjectForm(createEmptyProjectForm());
  };

  const resetDomainSignalEditor = () => {
    setEditingDomainSignalId(null);
    setDomainSignalForm(createEmptyDomainSignalForm());
  };

  const loadNormalizedProfileData = async () => {
    if (!profile) {
      setEducationItems([]);
      setExperienceItems([]);
      setProjectItems([]);
      setDomainSignalItems([]);
      setHasLoadedNormalizedData(false);
      return;
    }

    setLoadingNormalizedData(true);

    try {
      const results = await Promise.allSettled([
        api.get('/student/educations'),
        api.get('/student/experiences'),
        api.get('/student/cv-projects'),
        api.get('/student/domain-signals'),
      ]);

      const anySuccess = results.some((result) => result.status === 'fulfilled');

      setEducationItems(
        results[0].status === 'fulfilled' ? results[0].value.data || [] : []
      );
      setExperienceItems(
        results[1].status === 'fulfilled' ? results[1].value.data || [] : []
      );
      setProjectItems(
        results[2].status === 'fulfilled' ? results[2].value.data || [] : []
      );
      setDomainSignalItems(
        results[3].status === 'fulfilled' ? results[3].value.data || [] : []
      );
      setHasLoadedNormalizedData(anySuccess);
    } finally {
      setLoadingNormalizedData(false);
    }
  };

  useEffect(() => {
    loadNormalizedProfileData();
  }, [profile]);

  const handleRefreshClick = async () => {
    clearFeedback();
    await onRefresh();
    await loadNormalizedProfileData();
  };

  const handleUpload = async (type) => {
    const isCv = type === 'cv';
    const file = isCv ? cvFile : transcriptFile;

    if (!file) {
      setUploadMessage(isCv ? 'Once bir CV dosyasi sec.' : 'Once bir transcript dosyasi sec.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    if (isCv) {
      setUploadingCv(true);
    } else {
      setUploadingTranscript(true);
    }

    setUploadMessage('');
    clearFeedback();

    try {
      await api.post(isCv ? '/student/upload-cv' : '/student/upload-transcript', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploadMessage(
        isCv
          ? 'CV basariyla yuklendi. Profil verileri yenileniyor.'
          : 'Transcript basariyla yuklendi. Profil verileri yenileniyor.'
      );

      if (isCv) {
        setCvFile(null);
      } else {
        setTranscriptFile(null);
      }

      await onRefresh();
      await loadNormalizedProfileData();
    } catch (uploadError) {
      const fallback = isCv
        ? 'CV yuklenemedi. Dosya formatini ve oturumu kontrol et.'
        : 'Transcript yuklenemedi. Dosya formatini ve oturumu kontrol et.';

      setUploadMessage(getErrorMessage(uploadError, fallback));
    } finally {
      if (isCv) {
        setUploadingCv(false);
      } else {
        setUploadingTranscript(false);
      }
    }
  };

  const beginEducationCreate = () => {
    clearFeedback();
    resetEducationEditor();
  };

  const beginEducationEdit = (item) => {
    clearFeedback();
    setEditingEducationId(item.id);
    setEducationForm({
      schoolName: item.schoolName || '',
      department: item.department || '',
      degree: item.degree || '',
      startDateText: item.startDateText || '',
      endDateText: item.endDateText || '',
    });
  };

  const submitEducation = async (event) => {
    event.preventDefault();
    clearFeedback();
    setSavingSection('education');

    const payload = {
      schoolName: educationForm.schoolName,
      department: educationForm.department,
      degree: educationForm.degree,
      startDateText: educationForm.startDateText,
      endDateText: educationForm.endDateText,
    };

    try {
      if (editingEducationId) {
        await api.put(`/student/educations/${editingEducationId}`, payload);
        setActionMessage('Egitim kaydi guncellendi.');
      } else {
        await api.post('/student/educations', payload);
        setActionMessage('Egitim kaydi eklendi.');
      }

      resetEducationEditor();
      await loadNormalizedProfileData();
    } catch (submitError) {
      setActionError(getErrorMessage(submitError, 'Egitim kaydi kaydedilemedi.'));
    } finally {
      setSavingSection('');
    }
  };

  const removeEducation = async (educationId) => {
    if (!window.confirm('Bu egitim kaydini silmek istiyor musun?')) {
      return;
    }

    clearFeedback();
    setDeletingKey(`education-${educationId}`);

    try {
      await api.delete(`/student/educations/${educationId}`);
      if (editingEducationId === educationId) {
        resetEducationEditor();
      }

      setActionMessage('Egitim kaydi silindi.');
      await loadNormalizedProfileData();
    } catch (removeError) {
      setActionError(getErrorMessage(removeError, 'Egitim kaydi silinemedi.'));
    } finally {
      setDeletingKey('');
    }
  };

  const beginExperienceCreate = () => {
    clearFeedback();
    resetExperienceEditor();
  };

  const beginExperienceEdit = (item) => {
    clearFeedback();
    setEditingExperienceId(item.id);
    setExperienceForm({
      companyName: item.companyName || '',
      position: item.position || '',
      startDateText: item.startDateText || '',
      endDateText: item.endDateText || '',
      description: item.description || '',
      technologiesText: (item.technologyNames || []).join(', '),
    });
  };

  const submitExperience = async (event) => {
    event.preventDefault();
    clearFeedback();
    setSavingSection('experience');

    const payload = {
      companyName: experienceForm.companyName,
      position: experienceForm.position,
      startDateText: experienceForm.startDateText,
      endDateText: experienceForm.endDateText,
      description: experienceForm.description,
      technologyIds: [],
      technologyNames: splitCommaSeparatedValues(experienceForm.technologiesText),
    };

    try {
      if (editingExperienceId) {
        await api.put(`/student/experiences/${editingExperienceId}`, payload);
        setActionMessage('Deneyim kaydi guncellendi.');
      } else {
        await api.post('/student/experiences', payload);
        setActionMessage('Deneyim kaydi eklendi.');
      }

      resetExperienceEditor();
      await loadNormalizedProfileData();
    } catch (submitError) {
      setActionError(getErrorMessage(submitError, 'Deneyim kaydi kaydedilemedi.'));
    } finally {
      setSavingSection('');
    }
  };

  const removeExperience = async (experienceId) => {
    if (!window.confirm('Bu deneyim kaydini silmek istiyor musun?')) {
      return;
    }

    clearFeedback();
    setDeletingKey(`experience-${experienceId}`);

    try {
      await api.delete(`/student/experiences/${experienceId}`);
      if (editingExperienceId === experienceId) {
        resetExperienceEditor();
      }

      setActionMessage('Deneyim kaydi silindi.');
      await loadNormalizedProfileData();
    } catch (removeError) {
      setActionError(getErrorMessage(removeError, 'Deneyim kaydi silinemedi.'));
    } finally {
      setDeletingKey('');
    }
  };

  const beginProjectCreate = () => {
    clearFeedback();
    resetProjectEditor();
  };

  const beginProjectEdit = (item) => {
    clearFeedback();
    setEditingProjectId(item.id);
    setProjectForm({
      name: item.name || '',
      description: item.description || '',
      role: item.role || '',
      domain: item.domain || '',
      isTeamProject: Boolean(item.isTeamProject),
      technologiesText: (item.technologyNames || []).join(', '),
    });
  };

  const submitProject = async (event) => {
    event.preventDefault();
    clearFeedback();
    setSavingSection('project');

    const payload = {
      name: projectForm.name,
      description: projectForm.description,
      role: projectForm.role,
      domain: projectForm.domain,
      isTeamProject: projectForm.isTeamProject,
      technologyIds: [],
      technologyNames: splitCommaSeparatedValues(projectForm.technologiesText),
    };

    try {
      if (editingProjectId) {
        await api.put(`/student/cv-projects/${editingProjectId}`, payload);
        setActionMessage('Proje kaydi guncellendi.');
      } else {
        await api.post('/student/cv-projects', payload);
        setActionMessage('Proje kaydi eklendi.');
      }

      resetProjectEditor();
      await loadNormalizedProfileData();
    } catch (submitError) {
      setActionError(getErrorMessage(submitError, 'Proje kaydi kaydedilemedi.'));
    } finally {
      setSavingSection('');
    }
  };

  const removeProject = async (projectId) => {
    if (!window.confirm('Bu proje kaydini silmek istiyor musun?')) {
      return;
    }

    clearFeedback();
    setDeletingKey(`project-${projectId}`);

    try {
      await api.delete(`/student/cv-projects/${projectId}`);
      if (editingProjectId === projectId) {
        resetProjectEditor();
      }

      setActionMessage('Proje kaydi silindi.');
      await loadNormalizedProfileData();
    } catch (removeError) {
      setActionError(getErrorMessage(removeError, 'Proje kaydi silinemedi.'));
    } finally {
      setDeletingKey('');
    }
  };

  const beginDomainSignalCreate = () => {
    clearFeedback();
    resetDomainSignalEditor();
  };

  const beginDomainSignalEdit = (item) => {
    clearFeedback();
    setEditingDomainSignalId(item.id);
    setDomainSignalForm({
      name: item.name || '',
    });
  };

  const submitDomainSignal = async (event) => {
    event.preventDefault();
    clearFeedback();
    setSavingSection('signal');

    const payload = {
      name: domainSignalForm.name,
    };

    try {
      if (editingDomainSignalId) {
        await api.put(`/student/domain-signals/${editingDomainSignalId}`, payload);
        setActionMessage('Alan sinyali guncellendi.');
      } else {
        await api.post('/student/domain-signals', payload);
        setActionMessage('Alan sinyali eklendi.');
      }

      resetDomainSignalEditor();
      await loadNormalizedProfileData();
    } catch (submitError) {
      setActionError(getErrorMessage(submitError, 'Alan sinyali kaydedilemedi.'));
    } finally {
      setSavingSection('');
    }
  };

  const removeDomainSignal = async (domainSignalId) => {
    if (!window.confirm('Bu alan sinyalini silmek istiyor musun?')) {
      return;
    }

    clearFeedback();
    setDeletingKey(`signal-${domainSignalId}`);

    try {
      await api.delete(`/student/domain-signals/${domainSignalId}`);
      if (editingDomainSignalId === domainSignalId) {
        resetDomainSignalEditor();
      }

      setActionMessage('Alan sinyali silindi.');
      await loadNormalizedProfileData();
    } catch (removeError) {
      setActionError(getErrorMessage(removeError, 'Alan sinyali silinemedi.'));
    } finally {
      setDeletingKey('');
    }
  };

  const renderOverview = () => (
    <>
      <section className="profile-overview-grid">
        <article className="card profile-identity-card">
          <div className="profile-panel-top">
            <div className="profile-avatar">{initials}</div>
            <div>
              <div className="profile-panel-name">{profile?.fullName || 'Profil hazirlaniyor'}</div>
              <div className="profile-panel-mail">{profile?.email || 'E-posta bilgisi yok'}</div>
            </div>
          </div>

          <div className="profile-keyfacts">
            <div className="profile-keyfact">
              <span>CGPA</span>
              <strong>{cgpa ?? '-'}</strong>
            </div>
            <div className="profile-keyfact">
              <span>AKTS</span>
              <strong>{totalECTS ?? '-'}</strong>
            </div>
            <div className="profile-keyfact">
              <span>Durum</span>
              <strong>{isHonorStudent ? 'Onur Ogrencisi' : 'Aktif Ogrenci'}</strong>
            </div>
          </div>
        </article>

        <article className="card profile-summary-card">
          <div className="profile-section-title">
            <FileText size={16} />
            CV Ozeti
          </div>
          <p>{summaryText}</p>
        </article>
      </section>

      <section className="profile-grid">
        <article className="card profile-block">
          <div className="profile-section-title">
            <Wrench size={16} />
            Yetkinlikler
          </div>

          {skillsByCategory.length ? (
            <div className="skill-category-stack">
              {skillsByCategory.map((category) => (
                <div key={category.CategoryName} className="skill-category-card">
                  <div className="skill-category-name">{category.CategoryName}</div>
                  <div className="project-tags">
                    {(category.Skills || []).map((skill) => (
                      <span key={`${category.CategoryName}-${skill}`} className="tech-tag matched">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">Henuz analiz edilmis yetkinlik gorunmuyor.</div>
          )}
        </article>

        <article className="card profile-block">
          <div className="profile-section-title">
            <GraduationCap size={16} />
            Egitim
          </div>

          {overviewEducation.length ? (
            <div className="profile-list">
              {overviewEducation.map((item, index) => (
                <div key={`${item.SchoolName}-${index}`} className="profile-list-item">
                  <strong>{item.Department || item.Degree || 'Egitim kaydi'}</strong>
                  <span>{item.SchoolName || 'Okul bilgisi yok'}</span>
                  {getDateRange(item.StartDateText, item.EndDateText) ? (
                    <p>{getDateRange(item.StartDateText, item.EndDateText)}</p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">Egitim bilgisi henuz gorunmuyor.</div>
          )}
        </article>

        <article className="card profile-block">
          <div className="profile-section-title">
            <Sparkles size={16} />
            Alan Sinyalleri
          </div>

          {overviewDomainSignals.length ? (
            <div className="project-tags">
              {overviewDomainSignals.map((signal) => (
                <span key={signal} className="tech-tag matched">
                  {signal}
                </span>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              {loadingNormalizedData
                ? 'Alan sinyalleri yukleniyor.'
                : 'Alan sinyali henuz gorunmuyor.'}
            </div>
          )}
        </article>
      </section>
    </>
  );

  const renderSkills = () => (
    <section className="profile-grid profile-grid-single">
      <article className="card profile-block">
        <div className="profile-section-title">
          <Wrench size={16} />
          Yetkinlikler
        </div>

        {skillsByCategory.length ? (
          <div className="skill-category-stack">
            {skillsByCategory.map((category) => (
              <div key={category.CategoryName} className="skill-category-card">
                <div className="skill-category-name">{category.CategoryName}</div>
                <div className="project-tags">
                  {(category.Skills || []).map((skill) => (
                    <span key={`${category.CategoryName}-${skill}`} className="tech-tag matched">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">Henuz analiz edilmis yetkinlik gorunmuyor.</div>
        )}
      </article>
    </section>
  );

  const renderEducation = () => (
    <section className="profile-grid profile-grid-single">
      <article className="card profile-block">
        <div className="profile-card-header">
          <div className="profile-section-title">
            <GraduationCap size={16} />
            Egitim
          </div>

          <button type="button" className="ghost-button profile-inline-button" onClick={beginEducationCreate}>
            <Plus size={16} />
            Yeni kayit
          </button>
        </div>

        <form className="profile-form" onSubmit={submitEducation}>
          <div className="profile-form-grid">
            <label className="profile-form-field">
              <span>Okul</span>
              <input
                className="input-field"
                value={educationForm.schoolName}
                onChange={(event) =>
                  setEducationForm((current) => ({ ...current, schoolName: event.target.value }))
                }
                placeholder="Okul adi"
              />
            </label>

            <label className="profile-form-field">
              <span>Bolum</span>
              <input
                className="input-field"
                value={educationForm.department}
                onChange={(event) =>
                  setEducationForm((current) => ({ ...current, department: event.target.value }))
                }
                placeholder="Bolum"
              />
            </label>

            <label className="profile-form-field">
              <span>Derece</span>
              <input
                className="input-field"
                value={educationForm.degree}
                onChange={(event) =>
                  setEducationForm((current) => ({ ...current, degree: event.target.value }))
                }
                placeholder="Lisans, Yuksek Lisans..."
              />
            </label>

            <label className="profile-form-field">
              <span>Baslangic</span>
              <input
                className="input-field"
                value={educationForm.startDateText}
                onChange={(event) =>
                  setEducationForm((current) => ({ ...current, startDateText: event.target.value }))
                }
                placeholder="2021"
              />
            </label>

            <label className="profile-form-field">
              <span>Bitis</span>
              <input
                className="input-field"
                value={educationForm.endDateText}
                onChange={(event) =>
                  setEducationForm((current) => ({ ...current, endDateText: event.target.value }))
                }
                placeholder="Present veya 2025"
              />
            </label>
          </div>

          <div className="profile-form-actions">
            <button type="submit" className="btn-primary profile-submit-button" disabled={savingSection === 'education'}>
              <Save size={16} />
              {savingSection === 'education'
                ? 'Kaydediliyor...'
                : editingEducationId
                  ? 'Egitimi guncelle'
                  : 'Egitim ekle'}
            </button>

            {(editingEducationId || educationForm.schoolName || educationForm.department || educationForm.degree) ? (
              <button
                type="button"
                className="ghost-button profile-inline-button"
                onClick={resetEducationEditor}
              >
                <X size={16} />
                Vazgec
              </button>
            ) : null}
          </div>
        </form>

        {loadingNormalizedData ? (
          <div className="empty-state">Egitim verileri yukleniyor.</div>
        ) : educationItems.length ? (
          <div className="profile-list">
            {educationItems.map((item) => (
              <div key={item.id} className="profile-list-item">
                <div className="profile-item-top">
                  <div>
                    <strong>{item.department || item.degree || 'Egitim kaydi'}</strong>
                    <span>{item.schoolName || 'Okul bilgisi yok'}</span>
                  </div>

                  <div className="profile-item-actions">
                    <button
                      type="button"
                      className="ghost-button profile-inline-button"
                      onClick={() => beginEducationEdit(item)}
                    >
                      <Pencil size={14} />
                      Duzenle
                    </button>

                    <button
                      type="button"
                      className="ghost-button profile-inline-button profile-inline-button-danger"
                      onClick={() => removeEducation(item.id)}
                      disabled={deletingKey === `education-${item.id}`}
                    >
                      <Trash2 size={14} />
                      {deletingKey === `education-${item.id}` ? 'Siliniyor...' : 'Sil'}
                    </button>
                  </div>
                </div>

                {getDateRange(item.startDateText, item.endDateText) ? (
                  <p>{getDateRange(item.startDateText, item.endDateText)}</p>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">Henuz egitim kaydi yok.</div>
        )}
      </article>
    </section>
  );

  const renderExperiences = () => (
    <section className="profile-grid profile-grid-single">
      <article className="card profile-block">
        <div className="profile-card-header">
          <div className="profile-section-title">
            <FileBadge2 size={16} />
            Deneyimler
          </div>

          <button type="button" className="ghost-button profile-inline-button" onClick={beginExperienceCreate}>
            <Plus size={16} />
            Yeni kayit
          </button>
        </div>

        <form className="profile-form" onSubmit={submitExperience}>
          <div className="profile-form-grid">
            <label className="profile-form-field">
              <span>Kurum</span>
              <input
                className="input-field"
                value={experienceForm.companyName}
                onChange={(event) =>
                  setExperienceForm((current) => ({ ...current, companyName: event.target.value }))
                }
                placeholder="Sirket veya kurum"
              />
            </label>

            <label className="profile-form-field">
              <span>Pozisyon</span>
              <input
                className="input-field"
                value={experienceForm.position}
                onChange={(event) =>
                  setExperienceForm((current) => ({ ...current, position: event.target.value }))
                }
                placeholder="Backend Intern"
              />
            </label>

            <label className="profile-form-field">
              <span>Baslangic</span>
              <input
                className="input-field"
                value={experienceForm.startDateText}
                onChange={(event) =>
                  setExperienceForm((current) => ({ ...current, startDateText: event.target.value }))
                }
                placeholder="06/2024"
              />
            </label>

            <label className="profile-form-field">
              <span>Bitis</span>
              <input
                className="input-field"
                value={experienceForm.endDateText}
                onChange={(event) =>
                  setExperienceForm((current) => ({ ...current, endDateText: event.target.value }))
                }
                placeholder="Present"
              />
            </label>

            <label className="profile-form-field profile-form-field-full">
              <span>Teknolojiler</span>
              <input
                className="input-field"
                value={experienceForm.technologiesText}
                onChange={(event) =>
                  setExperienceForm((current) => ({ ...current, technologiesText: event.target.value }))
                }
                placeholder="C#, ASP.NET Core, PostgreSQL"
              />
            </label>

            <label className="profile-form-field profile-form-field-full">
              <span>Aciklama</span>
              <textarea
                className="input-field profile-textarea"
                value={experienceForm.description}
                onChange={(event) =>
                  setExperienceForm((current) => ({ ...current, description: event.target.value }))
                }
                placeholder="Bu deneyimde neler yaptin?"
              />
            </label>
          </div>

          <div className="profile-form-actions">
            <button type="submit" className="btn-primary profile-submit-button" disabled={savingSection === 'experience'}>
              <Save size={16} />
              {savingSection === 'experience'
                ? 'Kaydediliyor...'
                : editingExperienceId
                  ? 'Deneyimi guncelle'
                  : 'Deneyim ekle'}
            </button>

            {(editingExperienceId ||
              experienceForm.companyName ||
              experienceForm.position ||
              experienceForm.description ||
              experienceForm.technologiesText) ? (
              <button
                type="button"
                className="ghost-button profile-inline-button"
                onClick={resetExperienceEditor}
              >
                <X size={16} />
                Vazgec
              </button>
            ) : null}
          </div>
        </form>

        {loadingNormalizedData ? (
          <div className="empty-state">Deneyim verileri yukleniyor.</div>
        ) : experienceItems.length ? (
          <div className="profile-list">
            {experienceItems.map((item) => (
              <div key={item.id} className="profile-list-item">
                <div className="profile-item-top">
                  <div>
                    <strong>{item.position || 'Pozisyon yok'}</strong>
                    <span>{item.companyName || 'Kurum bilgisi yok'}</span>
                  </div>

                  <div className="profile-item-actions">
                    <button
                      type="button"
                      className="ghost-button profile-inline-button"
                      onClick={() => beginExperienceEdit(item)}
                    >
                      <Pencil size={14} />
                      Duzenle
                    </button>

                    <button
                      type="button"
                      className="ghost-button profile-inline-button profile-inline-button-danger"
                      onClick={() => removeExperience(item.id)}
                      disabled={deletingKey === `experience-${item.id}`}
                    >
                      <Trash2 size={14} />
                      {deletingKey === `experience-${item.id}` ? 'Siliniyor...' : 'Sil'}
                    </button>
                  </div>
                </div>

                {getDateRange(item.startDateText, item.endDateText) ? (
                  <p>{getDateRange(item.startDateText, item.endDateText)}</p>
                ) : null}

                {item.description ? <p>{item.description}</p> : null}

                {item.technologyNames?.length ? (
                  <div className="project-tags profile-item-tags">
                    {item.technologyNames.map((technology) => (
                      <span key={`${item.id}-${technology}`} className="tech-tag matched">
                        {technology}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">Henuz deneyim kaydi yok.</div>
        )}
      </article>
    </section>
  );

  const renderProjects = () => (
    <section className="profile-grid profile-grid-single">
      <article className="card profile-block">
        <div className="profile-card-header">
          <div className="profile-section-title">
            <Award size={16} />
            Projeler
          </div>

          <button type="button" className="ghost-button profile-inline-button" onClick={beginProjectCreate}>
            <Plus size={16} />
            Yeni kayit
          </button>
        </div>

        <form className="profile-form" onSubmit={submitProject}>
          <div className="profile-form-grid">
            <label className="profile-form-field">
              <span>Proje adi</span>
              <input
                className="input-field"
                value={projectForm.name}
                onChange={(event) =>
                  setProjectForm((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="GradPath"
              />
            </label>

            <label className="profile-form-field">
              <span>Rol</span>
              <input
                className="input-field"
                value={projectForm.role}
                onChange={(event) =>
                  setProjectForm((current) => ({ ...current, role: event.target.value }))
                }
                placeholder="Backend Developer"
              />
            </label>

            <label className="profile-form-field">
              <span>Alan</span>
              <input
                className="input-field"
                value={projectForm.domain}
                onChange={(event) =>
                  setProjectForm((current) => ({ ...current, domain: event.target.value }))
                }
                placeholder="AI, Web, Mobile..."
              />
            </label>

            <label className="profile-form-field">
              <span>Takim projesi mi?</span>
              <div className="profile-checkbox-wrap">
                <input
                  type="checkbox"
                  checked={projectForm.isTeamProject}
                  onChange={(event) =>
                    setProjectForm((current) => ({ ...current, isTeamProject: event.target.checked }))
                  }
                />
                <span>Evet, bu kayit bir takim projesi</span>
              </div>
            </label>

            <label className="profile-form-field profile-form-field-full">
              <span>Teknolojiler</span>
              <input
                className="input-field"
                value={projectForm.technologiesText}
                onChange={(event) =>
                  setProjectForm((current) => ({ ...current, technologiesText: event.target.value }))
                }
                placeholder="React, .NET 8, PostgreSQL"
              />
            </label>

            <label className="profile-form-field profile-form-field-full">
              <span>Aciklama</span>
              <textarea
                className="input-field profile-textarea"
                value={projectForm.description}
                onChange={(event) =>
                  setProjectForm((current) => ({ ...current, description: event.target.value }))
                }
                placeholder="Projenin amaci ve etkisi"
              />
            </label>
          </div>

          <div className="profile-form-actions">
            <button type="submit" className="btn-primary profile-submit-button" disabled={savingSection === 'project'}>
              <Save size={16} />
              {savingSection === 'project'
                ? 'Kaydediliyor...'
                : editingProjectId
                  ? 'Projeyi guncelle'
                  : 'Proje ekle'}
            </button>

            {(editingProjectId ||
              projectForm.name ||
              projectForm.description ||
              projectForm.role ||
              projectForm.domain ||
              projectForm.technologiesText) ? (
              <button
                type="button"
                className="ghost-button profile-inline-button"
                onClick={resetProjectEditor}
              >
                <X size={16} />
                Vazgec
              </button>
            ) : null}
          </div>
        </form>

        {loadingNormalizedData ? (
          <div className="empty-state">Proje verileri yukleniyor.</div>
        ) : projectItems.length ? (
          <div className="profile-list">
            {projectItems.map((item) => (
              <div key={item.id} className="profile-list-item">
                <div className="profile-item-top">
                  <div>
                    <strong>{item.name || 'Proje adi yok'}</strong>
                    <span>{item.domain || 'Alan bilgisi yok'}</span>
                  </div>

                  <div className="profile-item-actions">
                    <button
                      type="button"
                      className="ghost-button profile-inline-button"
                      onClick={() => beginProjectEdit(item)}
                    >
                      <Pencil size={14} />
                      Duzenle
                    </button>

                    <button
                      type="button"
                      className="ghost-button profile-inline-button profile-inline-button-danger"
                      onClick={() => removeProject(item.id)}
                      disabled={deletingKey === `project-${item.id}`}
                    >
                      <Trash2 size={14} />
                      {deletingKey === `project-${item.id}` ? 'Siliniyor...' : 'Sil'}
                    </button>
                  </div>
                </div>

                {item.role ? <p>Rol: {item.role}</p> : null}
                {item.description ? <p>{item.description}</p> : null}
                <p>{item.isTeamProject ? 'Takim projesi' : 'Bireysel proje'}</p>

                {item.technologyNames?.length ? (
                  <div className="project-tags profile-item-tags">
                    {item.technologyNames.map((technology) => (
                      <span key={`${item.id}-${technology}`} className="tech-tag matched">
                        {technology}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">Henuz proje kaydi yok.</div>
        )}
      </article>
    </section>
  );

  const renderDomainSignals = () => (
    <section className="profile-grid profile-grid-single">
      <article className="card profile-block">
        <div className="profile-card-header">
          <div className="profile-section-title">
            <Sparkles size={16} />
            Alan Sinyalleri
          </div>

          <button type="button" className="ghost-button profile-inline-button" onClick={beginDomainSignalCreate}>
            <Plus size={16} />
            Yeni kayit
          </button>
        </div>

        <form className="profile-form" onSubmit={submitDomainSignal}>
          <div className="profile-form-grid">
            <label className="profile-form-field profile-form-field-full">
              <span>Alan adi</span>
              <input
                className="input-field"
                value={domainSignalForm.name}
                onChange={(event) =>
                  setDomainSignalForm((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="Backend, AI, Data..."
              />
            </label>
          </div>

          <div className="profile-form-actions">
            <button type="submit" className="btn-primary profile-submit-button" disabled={savingSection === 'signal'}>
              <Save size={16} />
              {savingSection === 'signal'
                ? 'Kaydediliyor...'
                : editingDomainSignalId
                  ? 'Alani guncelle'
                  : 'Alan ekle'}
            </button>

            {(editingDomainSignalId || domainSignalForm.name) ? (
              <button
                type="button"
                className="ghost-button profile-inline-button"
                onClick={resetDomainSignalEditor}
              >
                <X size={16} />
                Vazgec
              </button>
            ) : null}
          </div>
        </form>

        {loadingNormalizedData ? (
          <div className="empty-state">Alan sinyalleri yukleniyor.</div>
        ) : domainSignalItems.length ? (
          <div className="profile-list">
            {domainSignalItems.map((item) => (
              <div key={item.id} className="profile-list-item">
                <div className="profile-item-top">
                  <div>
                    <strong>{item.name}</strong>
                    <span>Profil sinyali</span>
                  </div>

                  <div className="profile-item-actions">
                    <button
                      type="button"
                      className="ghost-button profile-inline-button"
                      onClick={() => beginDomainSignalEdit(item)}
                    >
                      <Pencil size={14} />
                      Duzenle
                    </button>

                    <button
                      type="button"
                      className="ghost-button profile-inline-button profile-inline-button-danger"
                      onClick={() => removeDomainSignal(item.id)}
                      disabled={deletingKey === `signal-${item.id}`}
                    >
                      <Trash2 size={14} />
                      {deletingKey === `signal-${item.id}` ? 'Siliniyor...' : 'Sil'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">Henuz alan sinyali yok.</div>
        )}
      </article>
    </section>
  );

  const renderDocuments = () => (
    <section className="profile-grid">
      <article className="card profile-block">
        <div className="profile-section-title">
          <Upload size={16} />
          CV Yukleme
        </div>

        <div className="upload-panel">
          <div className="upload-current-file">
            <span>Mevcut dosya</span>
            <strong>{profile?.cvFileName || 'Henuz CV yuklenmemis'}</strong>
          </div>

          <input
            type="file"
            className="input-field"
            accept=".pdf"
            onChange={(event) => setCvFile(event.target.files?.[0] || null)}
          />

          <button
            type="button"
            className="btn-primary upload-button"
            onClick={() => handleUpload('cv')}
            disabled={uploadingCv}
          >
            {uploadingCv ? 'CV Yukleniyor...' : 'CV Yukle'}
          </button>
        </div>
      </article>

      <article className="card profile-block">
        <div className="profile-section-title">
          <Upload size={16} />
          Transcript Yukleme
        </div>

        <div className="upload-panel">
          <div className="upload-current-file">
            <span>Mevcut dosya</span>
            <strong>{profile?.transcriptFileName || 'Henuz transcript yuklenmemis'}</strong>
          </div>

          <input
            type="file"
            className="input-field"
            accept=".pdf"
            onChange={(event) => setTranscriptFile(event.target.files?.[0] || null)}
          />

          <button
            type="button"
            className="btn-primary upload-button"
            onClick={() => handleUpload('transcript')}
            disabled={uploadingTranscript}
          >
            {uploadingTranscript ? 'Transcript Yukleniyor...' : 'Transcript Yukle'}
          </button>
        </div>
      </article>

      {uploadMessage ? <div className="dashboard-alert upload-alert">{uploadMessage}</div> : null}
    </section>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'skills':
        return renderSkills();
      case 'education':
        return renderEducation();
      case 'experiences':
        return renderExperiences();
      case 'projects':
        return renderProjects();
      case 'signals':
        return renderDomainSignals();
      case 'documents':
        return renderDocuments();
      default:
        return renderOverview();
    }
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
        <header className="dashboard-header">
          <div>
            <p className="dashboard-date">Ogrenci Profili</p>
            <h1 className="dashboard-title">Profilim</h1>
            <p className="dashboard-subtitle">
              CV analizi, akademik durum ve teknik sinyaller tek ekranda. Bu alan artik hem goruntuleme
              hem de duzenleme deneyimi sunuyor.
            </p>
          </div>

          <div className="dashboard-actions">
            <button className="ghost-button" type="button" onClick={handleRefreshClick} disabled={refreshing}>
              <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
              {refreshing ? 'Yenileniyor' : 'Profili Yenile'}
            </button>
          </div>
        </header>

        {error ? <div className="dashboard-alert">{error}</div> : null}
        {actionError ? <div className="dashboard-alert">{actionError}</div> : null}
        {actionMessage ? <div className="dashboard-alert dashboard-alert-success">{actionMessage}</div> : null}

        <section className="profile-tabs-shell">
          <div className="profile-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`profile-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </section>

        {renderTabContent()}

        <section className="profile-footer-note">
          <div className="card profile-note-card">
            <div className="profile-section-title">
              <Sparkles size={16} />
              Sonraki Adim
            </div>
            <p>
              Artik egitim, deneyim, proje ve alan sinyali kayitlarini bu ekrandan yonetebiliyorsun.
              Bir sonraki asamada ayni deneyimi yetkinlikler ve belge akislarina da tasiyabiliriz.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default ProfilePage;
