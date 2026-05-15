import { CalendarDays, ClipboardList, Pencil, RotateCcw, Trash2, UserPlus } from 'lucide-react';
import {
  formatDateLabel,
  getApplicationTone,
  getStatusTone,
} from '../studentProjectPosts.utils';

function renderLimitedTags(items) {
  if (!items?.length) {
    return null;
  }

  const visibleItems = items.slice(0, 4);
  const hiddenCount = items.length - visibleItems.length;

  return (
    <>
      {visibleItems.map((item) => (
        <span key={item} className="tech-tag matched">
          {item}
        </span>
      ))}

      {hiddenCount > 0 ? (
        <span className="project-meta-chip subtle">+{hiddenCount}</span>
      ) : null}
    </>
  );
}

function renderMetaChip(label, value) {
  return (
    <div className="post-stat-chip">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function renderTagGroup(title, items) {
  if (!items?.length) {
    return null;
  }

  return (
    <div className="post-card-tag-group">
      <span className="post-card-tag-title">{title}</span>
      <div className="project-tags">
        {renderLimitedTags(items)}
      </div>
    </div>
  );
}

function PostCard({
  applyingPostId,
  deletingId,
  isMineTab = false,
  isOwnPost,
  myApplication,
  onApply,
  onEdit,
  onManageApplications,
  onRemove,
  onWithdraw,
  post,
  withdrawingPostId,
}) {
  const statusTone = getStatusTone(post.status);
  const applicationTone = myApplication ? getApplicationTone(myApplication.status) : '';
  const isOpenPost = post.status === 'Open';
  const hasAvailableSlots = post.availableMemberSlotCount == null || post.availableMemberSlotCount > 0;
  const canApply = !isOwnPost && isOpenPost && hasAvailableSlots;
  const isApplying = applyingPostId === post.id;
  const isWithdrawing = withdrawingPostId === post.id;
  const primaryMetricLabel = isMineTab || isOwnPost ? 'Bekleyen' : 'Slot';
  const primaryMetricValue = isMineTab || isOwnPost
    ? `${post.pendingApplicationCount || 0}`
    : `${post.availableMemberSlotCount || 0}`;
  const departmentTagGroup = renderTagGroup('Bölümler', post.departmentNames);
  const technologyTagGroup = renderTagGroup('Teknolojiler', post.technologyNames);
  const hasTagGroups = !!departmentTagGroup || !!technologyTagGroup;
  const handleApplyClick = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!isApplying) {
      onApply(post.id);
    }
  };

  const handleWithdrawClick = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!isWithdrawing) {
      onWithdraw(post.id);
    }
  };

  return (
    <article className="card post-card">
      <div className="post-card-hero">
        <div className="post-card-top">
          <div className="post-card-copy">
            <h3>{post.title}</h3>
            <p>{post.description}</p>

            <div className="post-card-meta-row">
              <span className="project-meta-chip">{post.category || 'Kategori yok'}</span>
              <span className="project-meta-chip subtle">{post.projectType || 'Proje tipi yok'}</span>
              <span className="project-meta-chip subtle">
                <CalendarDays size={14} />
                {formatDateLabel(post.applicationDeadline)}
              </span>
            </div>
          </div>

          <div className="post-card-side">
            <span className={`post-status-pill ${statusTone}`}>{post.status}</span>

            {!isMineTab && myApplication ? (
              <span className={`post-status-pill application-status-pill ${applicationTone}`}>
                Başvuru: {myApplication.status}
              </span>
            ) : null}
          </div>
        </div>

        <div className="post-card-stats">
          {renderMetaChip('Ekip', `${post.teamSize}`)}
          {renderMetaChip('Aranan', `${post.neededMemberCount}`)}
          {renderMetaChip(primaryMetricLabel, primaryMetricValue)}
        </div>
      </div>

      {hasTagGroups ? (
        <div className="post-card-tags-shell">
          {departmentTagGroup}
          {technologyTagGroup}
        </div>
      ) : null}

      {isMineTab ? (
        <div className="post-card-toolbar">
          <div className="post-card-owner-actions">
            <button
              type="button"
              className="ghost-button profile-inline-button"
              onClick={() => onEdit(post)}
            >
              <Pencil size={14} />
              Düzenle
            </button>

            <button
              type="button"
              className="btn-primary profile-inline-button post-primary-action"
              onClick={() => onManageApplications(post)}
            >
              <ClipboardList size={14} />
              Başvuruları yönet
            </button>

            <button
              type="button"
              className="ghost-button profile-inline-button profile-inline-button-danger"
              onClick={() => onRemove(post.id)}
              disabled={deletingId === post.id}
            >
              <Trash2 size={14} />
              {deletingId === post.id ? 'Siliniyor...' : 'Sil'}
            </button>
          </div>
        </div>
      ) : null}

      {!isMineTab ? (
        <div className="post-card-actions">
          {isOwnPost ? (
            <button
              type="button"
              className="btn-primary profile-inline-button post-primary-action"
              onClick={() => onManageApplications(post)}
            >
              <ClipboardList size={15} />
              Başvuruları yönet
            </button>
          ) : null}

          {!isOwnPost && myApplication ? (
            <>
              {myApplication.status === 'Pending' ? (
                <button
                  type="button"
                  className="ghost-button profile-inline-button"
                  onClick={handleWithdrawClick}
                  disabled={isWithdrawing}
                >
                  <RotateCcw size={15} />
                  {isWithdrawing ? 'Geri çekiliyor...' : 'Başvuruyu geri çek'}
                </button>
              ) : null}

              {(myApplication.status === 'Rejected' || myApplication.status === 'Withdrawn') && canApply ? (
                <button
                  type="button"
                  className="btn-primary profile-inline-button post-primary-action"
                  onClick={handleApplyClick}
                  disabled={isApplying}
                >
                  <UserPlus size={15} />
                  {isApplying ? 'Gönderiliyor...' : 'Tekrar başvur'}
                </button>
              ) : null}
            </>
          ) : null}

          {!isOwnPost && !myApplication && canApply ? (
            <button
              type="button"
              className="btn-primary profile-inline-button post-primary-action"
              onClick={handleApplyClick}
              disabled={isApplying}
            >
              <UserPlus size={15} />
              {isApplying ? 'Gönderiliyor...' : 'Başvur'}
            </button>
          ) : null}

          {!isOwnPost && !canApply && !myApplication ? (
            <span className="post-inline-note">
              Başvuru kapalı
            </span>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

export default PostCard;
