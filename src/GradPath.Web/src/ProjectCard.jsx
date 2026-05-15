import { BrainCircuit, CheckCircle2, CircleDot, Layers3, Sparkles } from 'lucide-react';

const difficultyMap = {
  1: 'Uygun',
  2: 'Orta Seviye',
  3: 'Zorlayıcı',
};

const ProjectCard = ({ project }) => {
  const score = Math.round(project.matchScore ?? 0);
  const difficulty = difficultyMap[project.difficultyScore] ?? 'Değerlendiriliyor';

  return (
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
            Bölüm: {project.departmentNames.slice(0, 2).join(', ')}
            {project.departmentNames.length > 2 ? ' +' : ''}
          </div>
        ) : null}

        <div className="project-meta-chip subtle">Zorluk: {difficulty}</div>
      </div>

      <div className="project-skill-grid">
        <div className="project-skill-block">
          <h4>Eşleşen Yetkinlikler</h4>
          <div className="project-tags">
            {project.matchedTechnologies?.length ? (
              project.matchedTechnologies.map((tech) => (
                <span key={tech} className="tech-tag matched">
                  <CheckCircle2 size={12} />
                  {tech}
                </span>
              ))
            ) : (
              <span className="project-empty-tag">Henüz eşleşen teknoloji yok</span>
            )}
          </div>
        </div>

        <div className="project-skill-block">
          <h4>Geliştirilecek Alanlar</h4>
          <div className="project-tags">
            {project.missingTechnologies?.length ? (
              project.missingTechnologies.map((tech) => (
                <span key={tech} className="tech-tag missing">
                  <CircleDot size={12} />
                  {tech}
                </span>
              ))
            ) : (
              <span className="project-empty-tag">Eksik teknoloji görünmüyor</span>
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
            : 'Bu proje için analiz açıklaması henüz üretilmedi. Teknik eşleşme skoruna göre yine de öneriler arasında yer alıyor.'}
        </p>
      </div>
    </article>
  );
};

export default ProjectCard;
