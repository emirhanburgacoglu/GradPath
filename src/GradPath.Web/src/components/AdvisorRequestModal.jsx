import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import api from '../api';

function AdvisorRequestModal({ existingRequest, onClose, onSubmit, project }) {
  const [advisors, setAdvisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAdvisorId, setSelectedAdvisorId] = useState(existingRequest?.advisorUserId || '');
  const [studentNote, setStudentNote] = useState(existingRequest?.studentNote || '');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let ignore = false;

    const loadAdvisors = async () => {
      setLoading(true);
      setMessage('');

      try {
        const response = await api.get('/advisors/available', {
          params: { projectId: project.projectId },
        });

        if (ignore) {
          return;
        }

        setAdvisors(response.data || []);

        if (!selectedAdvisorId && response.data?.length) {
          setSelectedAdvisorId(response.data[0].userId);
        }
      } catch (error) {
        if (!ignore) {
          setMessage('Uygun danismanlar su an getirilemiyor.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadAdvisors();

    return () => {
      ignore = true;
    };
  }, [project.projectId]);

  const handleSubmit = async () => {
    if (!selectedAdvisorId) {
      setMessage('Lutfen bir danisman sec.');
      return;
    }

    setSubmitting(true);
    setMessage('');

    const result = await onSubmit({
      projectId: project.projectId,
      advisorUserId: selectedAdvisorId,
      studentNote,
    });

    setSubmitting(false);

    if (!result?.succeeded) {
      setMessage(result?.message || 'Talep gonderilemedi.');
      return;
    }

    window.alert(result.message);
    onClose();
  };

  return (
    <div className="selection-modal-overlay" onClick={onClose}>
      <div
        className="selection-modal advisor-request-modal"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="selection-modal-header">
          <div>
            <div className="selection-modal-kicker">Danisman secimi</div>
            <h2>{project.projectTitle}</h2>
            <p>Bu proje icin uygun bir danisman sec ve talebini gonder.</p>
          </div>

          <button type="button" className="selection-modal-close" onClick={onClose} aria-label="Kapat">
            <X size={18} />
          </button>
        </div>

        <section className="selection-modal-section">
          <div className="selection-modal-section-head">
            <strong>Uygun danismanlar</strong>
            <span>{advisors.length} kayit</span>
          </div>

          {loading ? (
            <div className="card loading-card">Danismanlar yukleniyor...</div>
          ) : advisors.length ? (
            <div className="selection-option-list advisor-option-list">
              {advisors.map((advisor) => {
                const isSelected = selectedAdvisorId === advisor.userId;

                return (
                  <button
                    key={advisor.userId}
                    type="button"
                    className={`selection-option-row ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedAdvisorId(advisor.userId)}
                  >
                    <div className="selection-option-copy">
                      <strong>
                        {advisor.academicTitle ? `${advisor.academicTitle} ` : ''}
                        {advisor.fullName}
                      </strong>
                      <span>
                        {advisor.departmentName || 'Bolum bilgisi yok'} · Kontenjan:{' '}
                        {advisor.approvedStudentCount}/{advisor.maxConcurrentStudents}
                      </span>
                      {advisor.expertiseAreas ? <span>{advisor.expertiseAreas}</span> : null}
                    </div>

                    <span className={`selection-option-check ${isSelected ? 'selected' : ''}`}>
                      {isSelected ? 'Secildi' : 'Sec'}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              Bu proje icin su anda listelenebilen uygun danisman bulunamadi.
            </div>
          )}
        </section>

        <section className="selection-modal-section">
          <div className="selection-modal-section-head">
            <strong>Kisa not</strong>
            <span>Opsiyonel</span>
          </div>

          <textarea
            className="advisor-note-input"
            placeholder="Projeye neden ilgi duydugunu veya hocaya iletmek istedigin kisa notu yazabilirsin."
            rows={4}
            value={studentNote}
            onChange={(event) => setStudentNote(event.target.value)}
          />

          {existingRequest ? (
            <div className="advisor-request-inline-status">
              Mevcut durum: <strong>{existingRequest.status}</strong>
            </div>
          ) : null}

          {message ? <div className="dashboard-alert">{message}</div> : null}
        </section>

        <div className="selection-modal-footer">
          <button type="button" className="ghost-button" onClick={onClose}>
            Vazgec
          </button>
          <button
            type="button"
            className="btn-primary selection-modal-confirm"
            onClick={handleSubmit}
            disabled={submitting || loading || !advisors.length}
          >
            {submitting ? 'Gonderiliyor' : 'Talebi gonder'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdvisorRequestModal;
