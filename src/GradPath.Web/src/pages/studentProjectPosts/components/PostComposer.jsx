import { Building2, FolderKanban, Plus, Save, Sparkles, Tag, X } from 'lucide-react';
import {
  projectTypeOptions,
  statusOptions,
} from '../studentProjectPosts.constants';

function renderSelectionPreview(options, emptyText, metaSelector) {
  if (!options.length) {
    return <div className="post-picker-empty">{emptyText}</div>;
  }

  return (
    <div className="post-picker-tags">
      {options.slice(0, 6).map((option) => (
        <span key={option.id} className="post-picker-tag">
          <strong>{option.name}</strong>
          {metaSelector(option) ? <small>{metaSelector(option)}</small> : null}
        </span>
      ))}

      {options.length > 6 ? (
        <span className="post-picker-more">+{options.length - 6} daha</span>
      ) : null}
    </div>
  );
}

function PostComposer({
  editingPostId,
  isComposerOpen,
  onBeginCreate,
  onCancel,
  onOpenDepartmentSelector,
  onOpenTechnologySelector,
  onSubmit,
  postForm,
  saving,
  selectedDepartmentOptions,
  selectedTechnologyOptions,
  setPostForm,
}) {
  const publicationHint = postForm.status === 'Draft'
    ? 'Taslak olarak kaydolur ve sadece sen görürsün.'
    : postForm.status === 'Open'
      ? 'Kaydedildiğinde öğrencilere açık olarak listelenir.'
      : 'Yayın durumu ilanın görünürlüğünü belirler.';

  return (
    <article className="card profile-block">
      <div className="profile-card-header">
        <div>
          <div className="profile-section-title">
            <Sparkles size={16} />
            Yeni ilan
          </div>
        </div>

        {!isComposerOpen ? (
          <button type="button" className="ghost-button profile-inline-button" onClick={onBeginCreate}>
            <Plus size={16} />
            Yeni İlan
          </button>
        ) : null}
      </div>

      {isComposerOpen ? (
        <form className="profile-form profile-collapsible-form post-composer-form post-composer-simple" onSubmit={onSubmit}>
          <div className="post-composer-body">
            <div className="post-form-section">
              <div className="post-form-section-head">
                <strong>İlan bilgileri</strong>
              </div>

              <div className="profile-form-grid post-composer-fields">
                <label className="profile-form-field">
                  <span>Başlık</span>
                  <input
                    className="input-field"
                    value={postForm.title}
                    onChange={(event) =>
                      setPostForm((current) => ({ ...current, title: event.target.value }))
                    }
                    placeholder="Hackathon için frontend geliştirici arıyorum"
                  />
                </label>

                <label className="profile-form-field">
                  <span>Kategori</span>
                  <input
                    className="input-field"
                    value={postForm.category}
                    onChange={(event) =>
                      setPostForm((current) => ({ ...current, category: event.target.value }))
                    }
                    placeholder="Web, AI, Mobil"
                  />
                </label>

                <label className="profile-form-field">
                  <span>Proje tipi</span>
                  <select
                    className="input-field"
                    value={postForm.projectType}
                    onChange={(event) =>
                      setPostForm((current) => ({ ...current, projectType: event.target.value }))
                    }
                  >
                    {projectTypeOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="profile-form-field">
                  <span>Yayın durumu</span>
                  <select
                    className="input-field"
                    value={postForm.status}
                    onChange={(event) =>
                      setPostForm((current) => ({ ...current, status: event.target.value }))
                    }
                  >
                    {statusOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <small className="profile-form-hint">{publicationHint}</small>
                </label>

                <label className="profile-form-field">
                  <span>Toplam takım boyutu</span>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    className="input-field"
                    value={postForm.teamSize}
                    onChange={(event) =>
                      setPostForm((current) => ({
                        ...current,
                        teamSize: Number(event.target.value),
                      }))
                    }
                  />
                </label>

                <label className="profile-form-field">
                  <span>Açık pozisyon sayısı</span>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    className="input-field"
                    value={postForm.neededMemberCount}
                    onChange={(event) =>
                      setPostForm((current) => ({
                        ...current,
                        neededMemberCount: Number(event.target.value),
                      }))
                    }
                  />
                </label>

                <label className="profile-form-field profile-form-field-full">
                  <span>Başvuru son tarihi</span>
                  <input
                    type="datetime-local"
                    className="input-field"
                    value={postForm.applicationDeadline}
                    onChange={(event) =>
                      setPostForm((current) => ({
                        ...current,
                        applicationDeadline: event.target.value,
                      }))
                    }
                  />
                </label>

                <label className="profile-form-field profile-form-field-full">
                  <span>Açıklama</span>
                  <textarea
                    className="input-field profile-textarea"
                    value={postForm.description}
                    onChange={(event) =>
                      setPostForm((current) => ({ ...current, description: event.target.value }))
                    }
                    placeholder="Projeyi, aradığın rolü ve ekipten beklentini kısaca anlat."
                  />
                </label>
              </div>
            </div>

            <div className="post-form-section">
              <div className="post-form-section-head">
                <strong>Hedefleme</strong>
              </div>

              <div className="post-picker-grid">
                <div className="post-picker-card">
                  <div className="post-picker-card-head">
                    <div>
                      <div className="post-picker-card-title">
                        <Tag size={16} />
                        Teknolojiler
                      </div>
                    </div>

                    <span className="post-selector-count">{postForm.technologyIds.length} seçili</span>
                  </div>

                  {renderSelectionPreview(
                    selectedTechnologyOptions,
                    'Henüz teknoloji seçilmedi.',
                    (option) => option.category
                  )}

                  <div className="post-picker-actions">
                    <button
                      type="button"
                      className="ghost-button profile-inline-button"
                      onClick={onOpenTechnologySelector}
                    >
                      <FolderKanban size={16} />
                      {selectedTechnologyOptions.length ? 'Teknolojileri düzenle' : 'Teknoloji ekle'}
                    </button>

                    {selectedTechnologyOptions.length ? (
                      <button
                        type="button"
                        className="ghost-button profile-inline-button"
                        onClick={() =>
                          setPostForm((current) => ({ ...current, technologyIds: [] }))
                        }
                      >
                        Temizle
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="post-picker-card">
                  <div className="post-picker-card-head">
                    <div>
                      <div className="post-picker-card-title">
                        <Building2 size={16} />
                        Bölümler
                      </div>
                    </div>

                    <span className="post-selector-count">{postForm.departmentIds.length} seçili</span>
                  </div>

                  {renderSelectionPreview(
                    selectedDepartmentOptions,
                    'Henüz bölüm seçilmedi.',
                    (option) => option.facultyName || option.code
                  )}

                  <div className="post-picker-actions">
                    <button
                      type="button"
                      className="ghost-button profile-inline-button"
                      onClick={onOpenDepartmentSelector}
                    >
                      <Building2 size={16} />
                      {selectedDepartmentOptions.length ? 'Bölümleri düzenle' : 'Bölüm seç'}
                    </button>

                    {selectedDepartmentOptions.length ? (
                      <button
                        type="button"
                        className="ghost-button profile-inline-button"
                        onClick={() =>
                          setPostForm((current) => ({ ...current, departmentIds: [] }))
                        }
                      >
                        Temizle
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="post-composer-footer post-composer-footer-simple">
            <button
              type="button"
              className="ghost-button profile-inline-button"
              onClick={onCancel}
            >
              <X size={16} />
              Vazgeç
            </button>

            <button type="submit" className="btn-primary post-submit-button" disabled={saving}>
              <Save size={16} />
              {saving
                ? 'Kaydediliyor...'
                : editingPostId
                  ? 'İlanı güncelle'
                  : 'İlanı kaydet'}
            </button>
          </div>
        </form>
      ) : (
        <button type="button" className="profile-composer-collapsed" onClick={onBeginCreate}>
          <span className="profile-composer-collapsed-icon">
            <Plus size={18} />
          </span>
          <span className="profile-composer-collapsed-copy">
            <span className="profile-composer-collapsed-kicker">Yeni kayıt</span>
            <strong>Takım ilanı aç</strong>
            <span>Başlık, ekip ve hedef kitleyi gir.</span>
          </span>
          <span className="profile-composer-collapsed-action">Formu aç</span>
        </button>
      )}
    </article>
  );
}

export default PostComposer;
