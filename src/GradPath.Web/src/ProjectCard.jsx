import { useMemo, useState } from 'react';
import { BrainCircuit, CheckCircle2, CircleDot, Layers3, Sparkles } from 'lucide-react';
import AdvisorRequestModal from './components/AdvisorRequestModal';

const difficultyMap = {
  1: 'Uygun',
  2: 'Orta Seviye',
  3: 'Zorlayici',
};

const requestToneMap = {
  Pending: 'Beklemede',
  Approved: 'Onaylandi',
  Rejected: 'Reddedildi',
};

function ProjectCard({ advisorRequest, onCreateAdvisorRequest, project }) {
  const [isAdvisorModalOpen, setIsAdvisorModalOpen] = useState(false);
  const score = Math.round(project.matchScore ?? 0);
  const difficulty = difficultyMap[project.difficultyScore] ?? 'Degerlendiriliyor';

  const requestSummary = useMemo(() => {
    if (!advisorRequest) {
      return null;
    }

    return {
      label: requestToneMap[advisorRequest.status] || advisorRequest.status,
      isLocked: advisorRequest.status === 'Pending' || advisorRequest.status === 'Approved',
      detail: advisorRequest.advisorFullName
        ? `${advisorRequest.advisorAcademicTitle ? `${advisorRequest.advisorAcademicTitle} ` : ''}${advisorRequest.advisorFullName}`
        : 'Danisman secimi yapildi',
    };
  }, [advisorRequest]);

  return (
    <>
      <article className="project-card">
        <div className="project-card-top">
          <div className="project-card-heading">
            <div className="project-card-kicker">
              <Sparkles size={14} />
              Uyum Analizi
            </div>

            <h3>{project.projectTitle}</h3>
            <p>{project.projectDescription}</p>
          </div>

          <div className="project-score-box">
            <strong>%{score}</strong>
            <span>Uyum Skoru</span>
          </div>
        </div>

        <div className="project-meta-row">
          <div className="project-meta-chip">
            <Layers3 size={15} />
            {project.category || 'Genel Kategori'}
          </div>

          {project.departmentNames?.length ? (
            <div className="project-meta-chip subtle">
              Bolum: {project.departmentNames.slice(0, 2).join(', ')}
              {project.departmentNames.length > 2 ? ' +' : ''}
            </div>
          ) : null}

          <div className="project-meta-chip subtle">Zorluk: {difficulty}</div>
        </div>

        {requestSummary ? (
          <div className={`advisor-request-summary-card ${advisorRequest.status.toLowerCase()}`}>
            <div>
              <strong>Danisman durumu: {requestSummary.label}</strong>
              <span>{requestSummary.detail}</span>
            </div>
            {advisorRequest.advisorNote ? <p>{advisorRequest.advisorNote}</p> : null}
          </div>
        ) : null}

        <div className="project-skill-grid">
          <div className="project-skill-block">
            <h4>Eslesen Yetkinlikler</h4>
            <div className="project-tags">
              {project.matchedTechnologies?.length ? (
                project.matchedTechnologies.map((tech) => (
                  <span key={tech} className="tech-tag matched">
                    <CheckCircle2 size={12} />
                    {tech}
                  </span>
                ))
              ) : (
                <span className="project-empty-tag">Henuz eslesen teknoloji yok</span>
              )}
            </div>
          </div>

          <div className="project-skill-block">
            <h4>Gelistirilecek Alanlar</h4>
            <div className="project-tags">
              {project.missingTechnologies?.length ? (
                project.missingTechnologies.map((tech) => (
                  <span key={tech} className="tech-tag missing">
                    <CircleDot size={12} />
                    {tech}
                  </span>
                ))
              ) : (
                <span className="project-empty-tag">Eksik teknoloji gorunmuyor</span>
              )}
            </div>
          </div>
        </div>

        <div className="project-ai-box">
          <div className="project-ai-title">
            <BrainCircuit size={16} />
            Analiz Notu
          </div>

          <p>
            {project.aiExplanation?.trim()
              ? project.aiExplanation
              : 'Bu proje icin analiz aciklamasi henuz uretilmedi. Teknik eslesme skoruna gore yine de oneriler arasinda yer aliyor.'}
          </p>
        </div>

        <div className="project-card-actions">
          <button
            type="button"
            className="btn-primary"
            disabled={requestSummary?.isLocked}
            onClick={() => setIsAdvisorModalOpen(true)}
          >
            {advisorRequest?.status === 'Rejected'
              ? 'Yeni danisman talebi'
              : requestSummary?.isLocked
                ? 'Talep gonderildi'
                : 'Danisman sec'}
          </button>
        </div>
      </article>

      {isAdvisorModalOpen ? (
        <AdvisorRequestModal
          existingRequest={advisorRequest}
          onClose={() => setIsAdvisorModalOpen(false)}
          onSubmit={onCreateAdvisorRequest}
          project={project}
        />
      ) : null}
    </>
  );
}

export default ProjectCard;
