import { useState } from 'react';
import {
  Award,
  FileBadge2,
  FileText,
  GraduationCap,
  RefreshCw,
  Sparkles,
  Upload,
  Wrench,
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
        ProjectName: project?.ProjectName || project?.projectName || '',
        Role: project?.Role || project?.role || '',
        Description: project?.Description || project?.description || '',
        Technologies: project?.Technologies || project?.technologies || [],
      })),
      Experiences: rawExperiences.map((experience) => ({
        CompanyName: experience?.CompanyName || experience?.companyName || '',
        Position: experience?.Position || experience?.position || '',
        DateRange: experience?.DateRange || experience?.dateRange || '',
        Description: experience?.Description || experience?.description || '',
      })),
      Education: rawEducation.map((item) => ({
        SchoolName: item?.SchoolName || item?.schoolName || '',
        Department: item?.Department || item?.department || '',
        Degree: item?.Degree || item?.degree || '',
        DateRange: item?.DateRange || item?.dateRange || '',
      })),
      DomainSignals: rawDomainSignals.map((signal) => ({
        DomainName: signal?.DomainName || signal?.domainName || '',
        Evidence: signal?.Evidence || signal?.evidence || [],
      })),
      RawSummary: parsed?.RawSummary || parsed?.rawSummary || '',
      NormalizedSummary: parsed?.NormalizedSummary || parsed?.normalizedSummary || '',
    };
  } catch {
    return null;
  }
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
  const analysis = safeParseAnalysis(profile);
  const skillsByCategory = analysis?.SkillsByCategory || [];
  const projects = analysis?.Projects || [];
  const experiences = analysis?.Experiences || [];
  const education = analysis?.Education || [];

  const tabs = [
    { id: 'overview', label: 'Genel Bakış' },
    { id: 'skills', label: 'Yetkinlikler' },
    { id: 'education', label: 'Eğitim' },
    { id: 'experiences', label: 'Deneyimler' },
    { id: 'projects', label: 'Projeler' },
    { id: 'documents', label: 'Belgeler' },
  ];

  const handleUpload = async (type) => {
    const isCv = type === 'cv';
    const file = isCv ? cvFile : transcriptFile;

    if (!file) {
      setUploadMessage(isCv ? 'Önce bir CV dosyası seç.' : 'Önce bir transcript dosyası seç.');
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

    try {
      await api.post(isCv ? '/student/upload-cv' : '/student/upload-transcript', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploadMessage(
        isCv
          ? 'CV başarıyla yüklendi. Profil verileri yenileniyor.'
          : 'Transcript başarıyla yüklendi. Profil verileri yenileniyor.'
      );

      if (isCv) {
        setCvFile(null);
      } else {
        setTranscriptFile(null);
      }

      await onRefresh();
    } catch (uploadError) {
      const fallback = isCv
        ? 'CV yüklenemedi. Dosya formatını ve oturumu kontrol et.'
        : 'Transcript yüklenemedi. Dosya formatını ve oturumu kontrol et.';

      setUploadMessage(uploadError?.response?.data?.message || fallback);
    } finally {
      if (isCv) {
        setUploadingCv(false);
      } else {
        setUploadingTranscript(false);
      }
    }
  };

  const renderOverview = () => (
    <>
      <section className="profile-overview-grid">
        <article className="card profile-identity-card">
          <div className="profile-panel-top">
            <div className="profile-avatar">{initials}</div>
            <div>
              <div className="profile-panel-name">{profile?.fullName || 'Profil hazırlanıyor'}</div>
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
              <strong>{isHonorStudent ? 'Onur Öğrencisi' : 'Aktif Öğrenci'}</strong>
            </div>
          </div>
        </article>

        <article className="card profile-summary-card">
          <div className="profile-section-title">
            <FileText size={16} />
            CV Özeti
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
            <div className="empty-state">Henüz analiz edilmiş yetkinlik görünmüyor.</div>
          )}
        </article>

        <article className="card profile-block">
          <div className="profile-section-title">
            <GraduationCap size={16} />
            Eğitim
          </div>

          {education.length ? (
            <div className="profile-list">
              {education.map((item, index) => (
                <div key={`${item.SchoolName}-${index}`} className="profile-list-item">
                  <strong>{item.Department || 'Bölüm bilgisi yok'}</strong>
                  <span>{item.SchoolName || 'Okul bilgisi yok'}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">Eğitim bilgisi henüz görünmüyor.</div>
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
          <div className="empty-state">Henüz analiz edilmiş yetkinlik görünmüyor.</div>
        )}
      </article>
    </section>
  );

  const renderEducation = () => (
    <section className="profile-grid profile-grid-single">
      <article className="card profile-block">
        <div className="profile-section-title">
          <GraduationCap size={16} />
          Eğitim
        </div>

        {education.length ? (
          <div className="profile-list">
            {education.map((item, index) => (
              <div key={`${item.SchoolName}-${index}`} className="profile-list-item">
                <strong>{item.Department || 'Bölüm bilgisi yok'}</strong>
                <span>{item.SchoolName || 'Okul bilgisi yok'}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">Eğitim bilgisi henüz görünmüyor.</div>
        )}
      </article>
    </section>
  );

  const renderExperiences = () => (
    <section className="profile-grid profile-grid-single">
      <article className="card profile-block">
        <div className="profile-section-title">
          <FileBadge2 size={16} />
          Deneyimler
        </div>

        {experiences.length ? (
          <div className="profile-list">
            {experiences.map((item, index) => (
              <div key={`${item.CompanyName}-${item.Position}-${index}`} className="profile-list-item">
                <strong>{item.Position || 'Pozisyon yok'}</strong>
                <span>{item.CompanyName || 'Kurum bilgisi yok'}</span>
                {item.Description ? <p>{item.Description}</p> : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">Deneyim bilgisi henüz görünmüyor.</div>
        )}
      </article>
    </section>
  );

  const renderProjects = () => (
    <section className="profile-grid profile-grid-single">
      <article className="card profile-block">
        <div className="profile-section-title">
          <Award size={16} />
          Projeler
        </div>

        {projects.length ? (
          <div className="profile-list">
            {projects.map((item, index) => (
              <div key={`${item.Name}-${index}`} className="profile-list-item">
                <strong>{item.Name || 'Proje adı yok'}</strong>
                {item.Description ? <p>{item.Description}</p> : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">Proje bilgisi henüz görünmüyor.</div>
        )}
      </article>
    </section>
  );

  const renderDocuments = () => (
    <section className="profile-grid">
      <article className="card profile-block">
        <div className="profile-section-title">
          <Upload size={16} />
          CV Yükleme
        </div>

        <div className="upload-panel">
          <div className="upload-current-file">
            <span>Mevcut dosya</span>
            <strong>{profile?.cvFileName || 'Henüz CV yüklenmemiş'}</strong>
          </div>

          <input
            type="file"
            className="input-field"
            accept=".pdf"
            onChange={(e) => setCvFile(e.target.files?.[0] || null)}
          />

          <button
            type="button"
            className="btn-primary upload-button"
            onClick={() => handleUpload('cv')}
            disabled={uploadingCv}
          >
            {uploadingCv ? 'CV Yükleniyor...' : 'CV Yükle'}
          </button>
        </div>
      </article>

      <article className="card profile-block">
        <div className="profile-section-title">
          <Upload size={16} />
          Transcript Yükleme
        </div>

        <div className="upload-panel">
          <div className="upload-current-file">
            <span>Mevcut dosya</span>
            <strong>{profile?.transcriptFileName || 'Henüz transcript yüklenmemiş'}</strong>
          </div>

          <input
            type="file"
            className="input-field"
            accept=".pdf"
            onChange={(e) => setTranscriptFile(e.target.files?.[0] || null)}
          />

          <button
            type="button"
            className="btn-primary upload-button"
            onClick={() => handleUpload('transcript')}
            disabled={uploadingTranscript}
          >
            {uploadingTranscript ? 'Transcript Yükleniyor...' : 'Transcript Yükle'}
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
            <p className="dashboard-date">Öğrenci Profili</p>
            <h1 className="dashboard-title">Profilim</h1>
            <p className="dashboard-subtitle">
              CV analizi, akademik durum ve teknik sinyaller tek ekranda. Artık bu alan gerçek bir
              profil paneli olarak çalışıyor.
            </p>
          </div>

          <div className="dashboard-actions">
            <button className="ghost-button" type="button" onClick={onRefresh} disabled={refreshing}>
              <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
              {refreshing ? 'Yenileniyor' : 'Profili Yenile'}
            </button>
          </div>
        </header>

        {error ? <div className="dashboard-alert">{error}</div> : null}

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
              Sonraki Adım
            </div>
            <p>
              Buradan sonra CV yükleme ve analiz detaylarını bu profil ekranına bağlayabiliriz. Bu
              ekran artık o akış için hazır bir iskelet oldu.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default ProfilePage;
