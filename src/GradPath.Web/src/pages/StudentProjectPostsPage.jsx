import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  Building2,
  CalendarDays,
  Check,
  ClipboardList,
  Clock3,
  Layers3,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Sparkles,
  UserPlus,
  X,
} from 'lucide-react';
import AppHeader from '../components/AppHeader';
import AppFooter from '../components/AppFooter';
import api from '../api';
import PostCard from './studentProjectPosts/components/PostCard';
import PostComposer from './studentProjectPosts/components/PostComposer';
import {
  allDepartmentFacultiesLabel,
  allTechnologyCategoriesLabel,
} from './studentProjectPosts/studentProjectPosts.constants';
import {
  buildTechnologyPresets,
  createEmptyPostForm,
  formatDateLabel,
  getApplicationTone,
  getDateRange,
  getErrorMessage,
  getProficiencyLabel,
  matchesLookupQuery,
  sortOptionsForSelection,
  toDateTimeLocalValue,
  toggleSelection,
} from './studentProjectPosts/studentProjectPosts.utils';

function StudentProjectPostsPage({
  currentView,
  initials,
  onLogout,
  onViewChange,
  profile,
}) {
  const [activeTab, setActiveTab] = useState('open');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [applicationStatusFilter, setApplicationStatusFilter] = useState('All');
  const [myPosts, setMyPosts] = useState([]);
  const [openPosts, setOpenPosts] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [technologyOptions, setTechnologyOptions] = useState([]);
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [postForm, setPostForm] = useState(createEmptyPostForm());
  const [editingPostId, setEditingPostId] = useState(null);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [openQuery, setOpenQuery] = useState('');
  const [selectionModal, setSelectionModal] = useState(null);
  const [technologyQuery, setTechnologyQuery] = useState('');
  const [departmentQuery, setDepartmentQuery] = useState('');
  const [activeTechnologyCategory, setActiveTechnologyCategory] = useState(
    allTechnologyCategoriesLabel
  );
  const [activeDepartmentFaculty, setActiveDepartmentFaculty] = useState(
    allDepartmentFacultiesLabel
  );
  const [applyingPostId, setApplyingPostId] = useState('');
  const [withdrawingPostId, setWithdrawingPostId] = useState('');
  const [applicationManagerPost, setApplicationManagerPost] = useState(null);
  const [managedApplications, setManagedApplications] = useState([]);
  const [loadingManagedApplications, setLoadingManagedApplications] = useState(false);
  const [applicationDecisionId, setApplicationDecisionId] = useState('');
  const [selectedApplicantUserId, setSelectedApplicantUserId] = useState('');
  const [selectedApplicantProfile, setSelectedApplicantProfile] = useState(null);
  const [loadingApplicantProfileId, setLoadingApplicantProfileId] = useState('');

  const myDraftCount = myPosts.filter((post) => post.status === 'Draft').length;
  const myOpenCount = myPosts.filter((post) => post.status === 'Open').length;
  const myPostIdSet = new Set(myPosts.map((post) => post.id));
  const myApplicationMap = myApplications.reduce((accumulator, application) => {
    accumulator[application.studentProjectPostId] = application;
    return accumulator;
  }, {});
  const pendingMyApplicationCount = myApplications.filter(
    (application) => application.status === 'Pending'
  ).length;
  const acceptedMyApplicationCount = myApplications.filter(
    (application) => application.status === 'Accepted'
  ).length;
  const managedPendingCount = managedApplications.filter(
    (application) => application.status === 'Pending'
  ).length;
  const managedAcceptedCount = managedApplications.filter(
    (application) => application.status === 'Accepted'
  ).length;
  const managedAvailableSlotCount = applicationManagerPost
    ? Math.max((applicationManagerPost.neededMemberCount || 0) - managedAcceptedCount, 0)
    : 0;
  const filteredMyApplications = myApplications.filter((application) => (
    applicationStatusFilter === 'All' || application.status === applicationStatusFilter
  ));
  const myPostSections = useMemo(() => {
    const openItems = myPosts.filter((post) => post.status === 'Open');
    const draftItems = myPosts.filter((post) => post.status === 'Draft');
    const otherItems = myPosts.filter((post) => post.status !== 'Open' && post.status !== 'Draft');

    return [
      {
        id: 'open',
        title: 'Açık ilanlarım',
        description: 'Şu an öğrencilerin görebildiği ve başvuru alabilen ilanlar.',
        posts: openItems,
      },
      {
        id: 'draft',
        title: 'Taslaklar',
        description: 'Henüz yayına almadığın, üzerinde çalışmaya devam ettiğin ilanlar.',
        posts: draftItems,
      },
      {
        id: 'other',
        title: 'Kapanan ilanlar',
        description: 'Süreci tamamlanan ya da yeni başvuru almayan ilanlar.',
        posts: otherItems,
      },
    ].filter((section) => section.posts.length);
  }, [myPosts]);

  const filteredOpenPosts = openPosts.filter((post) => {
    const normalizedQuery = openQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return true;
    }

    return [
      post.title,
      post.description,
      post.category,
      post.projectType,
      ...(post.technologyNames || []),
      ...(post.departmentNames || []),
    ]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(normalizedQuery));
  });

  const selectedTechnologyOptions = [...technologyOptions]
    .filter((option) => postForm.technologyIds.includes(option.id))
    .sort((left, right) => left.name.localeCompare(right.name, 'tr', { sensitivity: 'base' }));

  const selectedDepartmentOptions = [...departmentOptions]
    .filter((option) => postForm.departmentIds.includes(option.id))
    .sort((left, right) => left.name.localeCompare(right.name, 'tr', { sensitivity: 'base' }));

  const technologyCategories = useMemo(
    () => [
      allTechnologyCategoriesLabel,
      ...Array.from(
        new Set(technologyOptions.map((option) => option.category).filter(Boolean))
      ).sort((left, right) => left.localeCompare(right, 'tr', { sensitivity: 'base' })),
    ],
    [technologyOptions]
  );

  const departmentFaculties = useMemo(
    () => [
      allDepartmentFacultiesLabel,
      ...Array.from(
        new Set(departmentOptions.map((option) => option.facultyName).filter(Boolean))
      ).sort((left, right) => left.localeCompare(right, 'tr', { sensitivity: 'base' })),
    ],
    [departmentOptions]
  );

  const filteredTechnologyOptions = sortOptionsForSelection(
    technologyOptions.filter((option) => {
      const matchesCategory =
        activeTechnologyCategory === allTechnologyCategoriesLabel
        || option.category === activeTechnologyCategory;

      return (
        matchesCategory
        && matchesLookupQuery([option.name, option.category], technologyQuery)
      );
    }),
    postForm.technologyIds,
    (option) => option.category
  );

  const filteredDepartmentOptions = sortOptionsForSelection(
    departmentOptions.filter((option) => {
      const matchesFaculty =
        activeDepartmentFaculty === allDepartmentFacultiesLabel
        || option.facultyName === activeDepartmentFaculty;

      return (
        matchesFaculty
        && matchesLookupQuery([option.name, option.code, option.facultyName], departmentQuery)
      );
    }),
    postForm.departmentIds,
    (option) => option.facultyName
  );

  const groupedDepartmentOptions = filteredDepartmentOptions.reduce((groups, option) => {
    const faculty = option.facultyName || 'Diger Fakulteler';

    if (!groups[faculty]) {
      groups[faculty] = [];
    }

    groups[faculty].push(option);
    return groups;
  }, {});

  const technologyPresets = buildTechnologyPresets(technologyOptions, postForm.projectType);
  const viewOptions = useMemo(() => ([
    {
      id: 'mine',
      icon: Layers3,
      label: 'İlanlarım',
      description: 'Oluşturduğun tüm ilanlar',
      count: myPosts.length,
    },
    {
      id: 'open',
      icon: Search,
      label: 'Açık İlanlar',
      description: 'Öğrencilere açık ilanlar',
      count: openPosts.length,
    },
    {
      id: 'applications',
      icon: ClipboardList,
      label: 'Başvurularım',
      description: 'Gönderdiğin başvurular',
      count: myApplications.length,
    },
  ]), [myApplications.length, myPosts.length, openPosts.length]);
  const applicationFilters = useMemo(() => ([
    { id: 'All', label: 'Tum', count: myApplications.length },
    { id: 'Pending', label: 'Bekleyen', count: pendingMyApplicationCount },
    { id: 'Accepted', label: 'Kabul', count: acceptedMyApplicationCount },
    {
      id: 'Rejected',
      label: 'Red',
      count: myApplications.filter((application) => application.status === 'Rejected').length,
    },
    {
      id: 'Withdrawn',
      label: 'Geri cekilen',
      count: myApplications.filter((application) => application.status === 'Withdrawn').length,
    },
  ]), [acceptedMyApplicationCount, myApplications, pendingMyApplicationCount]);

  const clearFeedback = () => {
    setActionMessage('');
    setActionError('');
  };

  const closeApplicationManager = () => {
    setApplicationManagerPost(null);
    setManagedApplications([]);
    setLoadingManagedApplications(false);
    setApplicationDecisionId('');
    setSelectedApplicantUserId('');
    setSelectedApplicantProfile(null);
    setLoadingApplicantProfileId('');
  };

  const closeSelectionModal = () => {
    setSelectionModal(null);
    setTechnologyQuery('');
    setDepartmentQuery('');
    setActiveTechnologyCategory(allTechnologyCategoriesLabel);
    setActiveDepartmentFaculty(allDepartmentFacultiesLabel);
  };

  const resetComposer = () => {
    setEditingPostId(null);
    setPostForm(createEmptyPostForm());
    closeSelectionModal();
    setIsComposerOpen(false);
  };

  useEffect(() => {
    if (!selectionModal && !applicationManagerPost) {
      return undefined;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        if (selectionModal) {
          closeSelectionModal();
          return;
        }

        closeApplicationManager();
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [applicationManagerPost, selectionModal]);

  useEffect(() => {
    if (!technologyCategories.includes(activeTechnologyCategory)) {
      setActiveTechnologyCategory(allTechnologyCategoriesLabel);
    }
  }, [activeTechnologyCategory, technologyCategories]);

  useEffect(() => {
    if (!departmentFaculties.includes(activeDepartmentFaculty)) {
      setActiveDepartmentFaculty(allDepartmentFacultiesLabel);
    }
  }, [activeDepartmentFaculty, departmentFaculties]);

  const loadPostsData = useCallback(async (silent = false) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    const [formOptionsResult, mineResult, openResult, myApplicationsResult] = await Promise.allSettled([
      api.get('/student-project-posts/form-options'),
      api.get('/student-project-posts/mine'),
      api.get('/student-project-posts/open'),
      api.get('/student-project-posts/applications/mine'),
    ]);

    if (
      (mineResult.status === 'rejected' && mineResult.reason?.response?.status === 401)
      || (myApplicationsResult.status === 'rejected' && myApplicationsResult.reason?.response?.status === 401)
    ) {
      onLogout();
      return;
    }

    if (formOptionsResult.status === 'fulfilled') {
      setTechnologyOptions(formOptionsResult.value.data?.technologies || []);
      setDepartmentOptions(formOptionsResult.value.data?.departments || []);
    } else {
      setTechnologyOptions([]);
      setDepartmentOptions([]);
    }

    if (mineResult.status === 'fulfilled') {
      setMyPosts(mineResult.value.data || []);
    } else {
      setMyPosts([]);
    }

    if (openResult.status === 'fulfilled') {
      setOpenPosts(openResult.value.data || []);
    } else {
      setOpenPosts([]);
    }

    if (myApplicationsResult.status === 'fulfilled') {
      setMyApplications(myApplicationsResult.value.data || []);
    } else {
      setMyApplications([]);
    }

    const failedSections = [];

    if (formOptionsResult.status === 'rejected') {
      failedSections.push('form secenekleri');
    }

    if (mineResult.status === 'rejected') {
      failedSections.push('ilanlarim');
    }

    if (openResult.status === 'rejected') {
      failedSections.push('acik ilanlar');
    }

    if (myApplicationsResult.status === 'rejected') {
      failedSections.push('basvurularim');
    }

    if (failedSections.length > 0) {
      setActionError(
        `${failedSections.join(', ')} yuklenemedi. Sayfayi yenileyip tekrar deneyebilirsin.`
      );
    } else {
      setActionError('');
    }

    if (silent) {
      setRefreshing(false);
    } else {
      setLoading(false);
    }
  }, [onLogout]);

  useEffect(() => {
    loadPostsData();
  }, [loadPostsData]);

  const beginCreate = () => {
    clearFeedback();
    closeSelectionModal();
    closeApplicationManager();
    setActiveTab('mine');
    setEditingPostId(null);
    setPostForm(createEmptyPostForm());
    setIsComposerOpen(true);
  };

  const beginEdit = (post) => {
    clearFeedback();
    closeSelectionModal();
    closeApplicationManager();
    setActiveTab('mine');
    setEditingPostId(post.id);
    setPostForm({
      title: post.title || '',
      description: post.description || '',
      category: post.category || '',
      projectType: post.projectType || 'Hackathon',
      status: post.status || 'Draft',
      teamSize: post.teamSize || 1,
      neededMemberCount: post.neededMemberCount || 0,
      applicationDeadline: toDateTimeLocalValue(post.applicationDeadline),
      technologyIds: post.technologyIds || [],
      departmentIds: post.departmentIds || [],
    });
    setIsComposerOpen(true);
  };

  const openTechnologySelector = () => {
    clearFeedback();
    closeApplicationManager();
    setTechnologyQuery('');
    setActiveTechnologyCategory(allTechnologyCategoriesLabel);
    setSelectionModal('technology');
  };

  const openDepartmentSelector = () => {
    clearFeedback();
    closeApplicationManager();
    setDepartmentQuery('');
    setActiveDepartmentFaculty(allDepartmentFacultiesLabel);
    setSelectionModal('department');
  };

  const toggleTechnologySelection = (technologyId) => {
    setPostForm((current) => ({
      ...current,
      technologyIds: toggleSelection(current.technologyIds, technologyId),
    }));
  };

  const toggleDepartmentSelection = (departmentId) => {
    setPostForm((current) => ({
      ...current,
      departmentIds: toggleSelection(current.departmentIds, departmentId),
    }));
  };

  const applyTechnologyPreset = (preset) => {
    setPostForm((current) => ({
      ...current,
      technologyIds: Array.from(new Set([...current.technologyIds, ...preset.optionIds])),
    }));
  };

  const submitPost = async (event) => {
    event.preventDefault();
    clearFeedback();

    if (!postForm.title.trim() || !postForm.description.trim() || !postForm.category.trim()) {
      setActionError('Başlık, açıklama ve kategori alanları zorunlu.');
      return;
    }

    if (postForm.teamSize < 1 || postForm.teamSize > 20) {
      setActionError('Takım boyutu 1 ile 20 arasında olmalı.');
      return;
    }

    if (postForm.neededMemberCount < 0 || postForm.neededMemberCount > 20) {
      setActionError('Aranan üye sayısı 0 ile 20 arasında olmalı.');
      return;
    }

    if (postForm.neededMemberCount > postForm.teamSize) {
      setActionError('Aranan üye sayısı takım boyutundan büyük olamaz.');
      return;
    }

    setSaving(true);

    const payload = {
      title: postForm.title.trim(),
      description: postForm.description.trim(),
      category: postForm.category.trim(),
      projectType: postForm.projectType,
      status: postForm.status,
      teamSize: Number(postForm.teamSize),
      neededMemberCount: Number(postForm.neededMemberCount),
      applicationDeadline: postForm.applicationDeadline
        ? new Date(postForm.applicationDeadline).toISOString()
        : null,
      technologyIds: postForm.technologyIds,
      departmentIds: postForm.departmentIds,
    };

    try {
      if (editingPostId) {
        await api.put(`/student-project-posts/${editingPostId}`, payload);
        setActionMessage('İlan başarıyla güncellendi.');
      } else {
        await api.post('/student-project-posts', payload);
        setActionMessage('İlan başarıyla oluşturuldu.');
      }

      resetComposer();
      await loadPostsData(true);
    } catch (error) {
      if (error?.response?.status === 401) {
        onLogout();
        return;
      }

      setActionError(getErrorMessage(error, 'İlan kaydedilemedi. Bilgileri kontrol edip tekrar dene.'));
    } finally {
      setSaving(false);
    }
  };

  const removePost = async (postId) => {
    if (!window.confirm('Bu ilanı silmek istediğine emin misin?')) {
      return;
    }

    clearFeedback();
    setDeletingId(postId);

    try {
      await api.delete(`/student-project-posts/${postId}`);
      setActionMessage('İlan başarıyla silindi.');

      if (editingPostId === postId) {
        resetComposer();
      }

      await loadPostsData(true);
    } catch (error) {
      if (error?.response?.status === 401) {
        onLogout();
        return;
      }

      setActionError(getErrorMessage(error, 'İlan silinemedi. Lütfen tekrar dene.'));
    } finally {
      setDeletingId('');
    }
  };

  const loadManagedApplications = async (postId) => {
    setLoadingManagedApplications(true);

    try {
      const response = await api.get(`/student-project-posts/${postId}/applications`);
      setManagedApplications(response.data || []);
    } catch (error) {
      if (error?.response?.status === 401) {
        onLogout();
        return;
      }

      setManagedApplications([]);
      setActionError(getErrorMessage(error, 'Başvurular yüklenemedi. Lütfen tekrar dene.'));
    } finally {
      setLoadingManagedApplications(false);
    }
  };

  const openApplicationManager = async (post) => {
    clearFeedback();
    closeSelectionModal();
    setApplicationManagerPost(post);
    await loadManagedApplications(post.id);
  };

  const toggleApplicantProfile = async (applicantUserId) => {
    if (
      selectedApplicantUserId === applicantUserId
      && selectedApplicantProfile
      && loadingApplicantProfileId !== applicantUserId
    ) {
      setSelectedApplicantUserId('');
      setSelectedApplicantProfile(null);
      setLoadingApplicantProfileId('');
      return;
    }

    clearFeedback();
    setSelectedApplicantUserId(applicantUserId);
    setLoadingApplicantProfileId(applicantUserId);

    try {
      const response = await api.get(`/student/${applicantUserId}/public-profile`);
      setSelectedApplicantProfile(response.data || null);
    } catch (error) {
      if (error?.response?.status === 401) {
        onLogout();
        return;
      }

      setSelectedApplicantUserId('');
      setSelectedApplicantProfile(null);
      setActionError(getErrorMessage(error, 'Aday profili yüklenemedi. Lütfen tekrar dene.'));
    } finally {
      setLoadingApplicantProfileId('');
    }
  };

  const applyToPost = async (postId) => {
    clearFeedback();
    setApplyingPostId(postId);

    try {
      const response = await api.post(`/student-project-posts/${postId}/apply`);
      setActionMessage(response.data || 'Başvurun başarıyla gönderildi.');
      await loadPostsData(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      if (error?.response?.status === 401) {
        onLogout();
        return;
      }

      setActionError(getErrorMessage(error, 'Başvuru gönderilemedi. Lütfen tekrar dene.'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setApplyingPostId('');
    }
  };

  const withdrawApplication = async (postId) => {
    clearFeedback();
    setWithdrawingPostId(postId);

    try {
      const response = await api.delete(`/student-project-posts/${postId}/apply`);
      setActionMessage(response.data || 'Başvurun geri çekildi.');
      await loadPostsData(true);
    } catch (error) {
      if (error?.response?.status === 401) {
        onLogout();
        return;
      }

      setActionError(getErrorMessage(error, 'Başvuru geri çekilemedi. Lütfen tekrar dene.'));
    } finally {
      setWithdrawingPostId('');
    }
  };

  const decideApplication = async (postId, applicationId, decision) => {
    clearFeedback();
    setApplicationDecisionId(applicationId);

    try {
      const response = await api.post(
        `/student-project-posts/${postId}/applications/${applicationId}/${decision}`
      );

      setActionMessage(response.data || 'Başvuru durumu güncellendi.');
      await Promise.all([loadPostsData(true), loadManagedApplications(postId)]);
    } catch (error) {
      if (error?.response?.status === 401) {
        onLogout();
        return;
      }

      setActionError(getErrorMessage(error, 'Başvuru durumu güncellenemedi. Lütfen tekrar dene.'));
    } finally {
      setApplicationDecisionId('');
    }
  };

  const renderSelectionPreview = (options, emptyText, metaSelector) => {
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
  };

  const renderSelectionRows = (options, selectedIds, toggleItem, metaSelector, emptyText) => {
    if (!options.length) {
      return <div className="empty-state post-inline-empty">{emptyText}</div>;
    }

    return (
      <div className="selection-option-list">
        {options.map((option) => {
          const isSelected = selectedIds.includes(option.id);
          const metaText = metaSelector(option);

          return (
            <button
              key={option.id}
              type="button"
              className={`selection-option-row ${isSelected ? 'selected' : ''}`}
              onClick={() => toggleItem(option.id)}
            >
              <div className="selection-option-copy">
                <strong>{option.name}</strong>
                {metaText ? <span>{metaText}</span> : null}
              </div>

              <span className={`selection-option-check ${isSelected ? 'selected' : ''}`}>
                {isSelected ? <Check size={16} /> : null}
              </span>
            </button>
          );
        })}
      </div>
    );
  };

  const renderApplicationManagerModal = () => (
    <div className="selection-modal-overlay" onClick={closeApplicationManager}>
      <div
        className="selection-modal application-manager-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Başvuru yönetimi"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="selection-modal-header">
          <div>
            <div className="selection-modal-kicker">Owner paneli</div>
            <h2>Başvuruları yönet</h2>
            <p>
              <strong>{applicationManagerPost?.title || 'İlan'}</strong> için gelen başvuruları
              buradan kabul edebilir veya reddedebilirsin.
            </p>
          </div>

          <button
            type="button"
            className="selection-modal-close"
            onClick={closeApplicationManager}
          >
            <X size={18} />
          </button>
        </div>

        <section className="selection-modal-section">
          <div className="selection-modal-section-head">
            <div>
              <strong>İlan özeti</strong>
              <span>Kalan slot, bekleyen ve kabul edilen başvuruları hızla gör.</span>
            </div>
          </div>

          <div className="application-summary-grid">
            <article className="application-summary-card">
              <span>Bekleyen</span>
              <strong>{managedPendingCount}</strong>
            </article>

            <article className="application-summary-card">
              <span>Kabul</span>
              <strong>{managedAcceptedCount}</strong>
            </article>

            <article className="application-summary-card">
              <span>Slot</span>
              <strong>{managedAvailableSlotCount}</strong>
            </article>
          </div>
        </section>

        <section className="selection-modal-section selection-modal-results">
          {selectedApplicantUserId ? (
            <div className="applicant-public-profile-shell">
              <div className="selection-modal-section-head">
                <div>
                  <strong>Aday profili</strong>
                  <span>Başvuran öğrencinin salt okunur profil görünümü.</span>
                </div>

                <button
                  type="button"
                  className="ghost-button selection-inline-button"
                  onClick={() => {
                    setSelectedApplicantUserId('');
                    setSelectedApplicantProfile(null);
                    setLoadingApplicantProfileId('');
                  }}
                >
                  Profili gizle
                </button>
              </div>

              {loadingApplicantProfileId === selectedApplicantUserId ? (
                <div className="empty-state">Profil yukleniyor.</div>
              ) : selectedApplicantProfile ? (
                <>
                  <div className="applicant-public-profile-top">
                    <div className="applicant-public-profile-avatar">
                      {selectedApplicantProfile.profilePhotoUrl ? (
                        <img
                          src={selectedApplicantProfile.profilePhotoUrl}
                          alt={selectedApplicantProfile.fullName || 'Öğrenci profil fotoğrafı'}
                          className="applicant-public-profile-avatar-image"
                        />
                      ) : (
                        (selectedApplicantProfile.fullName || '')
                          .split(' ')
                          .map((part) => part?.[0] || '')
                          .join('')
                          .slice(0, 2)
                          .toUpperCase() || 'GP'
                      )}
                    </div>

                    <div className="applicant-public-profile-copy">
                      <strong>{selectedApplicantProfile.fullName}</strong>
                      <span>
                        {[
                          selectedApplicantProfile.departmentName,
                          selectedApplicantProfile.departmentCode,
                        ]
                          .filter(Boolean)
                          .join(' • ') || 'Bölüm bilgisi yok'}
                      </span>
                      {selectedApplicantProfile.facultyName ? (
                        <span>{selectedApplicantProfile.facultyName}</span>
                      ) : null}
                    </div>

                    <div className="applicant-public-profile-metrics">
                      <span className="project-meta-chip">
                        GPA: {selectedApplicantProfile.cgpa ?? '-'}
                      </span>
                      <span className="project-meta-chip">
                        AKTS: {selectedApplicantProfile.totalECTS ?? '-'}
                      </span>
                      <span className="project-meta-chip subtle">
                        {selectedApplicantProfile.isHonorStudent ? 'Onur öğrencisi' : 'Standart profil'}
                      </span>
                    </div>
                  </div>

                  {selectedApplicantProfile.cvSummary ? (
                    <div className="applicant-public-profile-summary">
                      <strong>CV ozeti</strong>
                      <p>{selectedApplicantProfile.cvSummary}</p>
                    </div>
                  ) : null}

                  <div className="applicant-public-profile-grid">
                    <article className="applicant-public-profile-card applicant-public-profile-card-accent">
                      <div className="applicant-public-profile-card-title">Yetenekler</div>
                      {selectedApplicantProfile.skills?.length ? (
                        <div className="project-tags">
                          {selectedApplicantProfile.skills.map((skill) => (
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

                    <article className="applicant-public-profile-card applicant-public-profile-card-accent">
                      <div className="applicant-public-profile-card-title">Ilgi alanlari</div>
                      {selectedApplicantProfile.domainSignals?.length ? (
                        <div className="project-tags">
                          {selectedApplicantProfile.domainSignals.map((signal) => (
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
                      {selectedApplicantProfile.educations?.length ? (
                        <div className="applicant-public-profile-list">
                          {selectedApplicantProfile.educations.map((education) => (
                            <div
                              key={education.id || `${education.schoolName}-${education.startDateText}`}
                              className="applicant-public-profile-item"
                            >
                              <strong>{education.schoolName || 'Okul bilgisi yok'}</strong>
                              <span>
                                {[education.department, education.degree].filter(Boolean).join(' • ')}
                              </span>
                              <small>{getDateRange(education.startDateText, education.endDateText) || 'Tarih bilgisi yok'}</small>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="applicant-public-profile-empty">Egitim kaydi yok.</div>
                      )}
                    </article>

                    <article className="applicant-public-profile-card applicant-public-profile-card-full">
                      <div className="applicant-public-profile-card-title">Deneyimler</div>
                      {selectedApplicantProfile.experiences?.length ? (
                        <div className="applicant-public-profile-list">
                          {selectedApplicantProfile.experiences.map((experience) => (
                            <div
                              key={experience.id || `${experience.companyName}-${experience.position}`}
                              className="applicant-public-profile-item"
                            >
                              <strong>{experience.companyName || 'Deneyim kaydi'}</strong>
                              <span>{experience.position || 'Pozisyon belirtilmemis'}</span>
                              <small>{getDateRange(experience.startDateText, experience.endDateText) || 'Tarih bilgisi yok'}</small>
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
                      {selectedApplicantProfile.cvProjects?.length ? (
                        <div className="applicant-public-profile-list">
                          {selectedApplicantProfile.cvProjects.map((project) => (
                            <div
                              key={project.id || `${project.name}-${project.role}`}
                              className="applicant-public-profile-item"
                            >
                              <strong>{project.name || 'Proje kaydi'}</strong>
                              <span>
                                {[project.role, project.domain].filter(Boolean).join(' • ') || 'Rol veya domain belirtilmemis'}
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
                        <div className="applicant-public-profile-empty">Proje kaydi yok.</div>
                      )}
                    </article>
                  </div>
                </>
              ) : null}
            </div>
          ) : null}

          <div className="selection-modal-section-head">
            <div>
              <strong>Başvuran öğrenciler</strong>
              <span>Bekleyen başvurular ilk sırada listelenir.</span>
            </div>
          </div>

          {loadingManagedApplications ? (
            <div className="empty-state">Başvurular yükleniyor.</div>
          ) : managedApplications.length ? (
            <div className="application-card-list">
              {managedApplications.map((application) => {
                const applicationTone = getApplicationTone(application.status);
                const isPending = application.status === 'Pending';
                const canAccept =
                  application.status !== 'Accepted'
                  && application.status !== 'Withdrawn'
                  && (managedAvailableSlotCount > 0 || isPending);
                const isBusy = applicationDecisionId === application.id;
                const isProfileLoading = loadingApplicantProfileId === application.applicantUserId;
                const isProfileOpen =
                  selectedApplicantUserId === application.applicantUserId
                  && !!selectedApplicantProfile;

                return (
                  <article key={application.id} className="application-card">
                    <div className="application-card-top">
                      <div className="application-card-copy">
                        <strong>{application.applicantFullName}</strong>
                        <span>{application.applicantEmail}</span>
                        {application.applicantDepartmentName ? (
                          <span>{application.applicantDepartmentName}</span>
                        ) : null}
                      </div>

                      <span className={`post-status-pill application-status-pill ${applicationTone}`}>
                        {application.status}
                      </span>
                    </div>

                    <div className="post-meta-row">
                      <span className="project-meta-chip">
                        <Clock3 size={14} />
                        {formatDateLabel(application.createdAt)}
                      </span>
                    </div>

                    {application.status === 'Accepted' ? (
                      <div className="application-contact-hint">
                        Bu öğrenci ekipte. İletişim için yukarıdaki e-posta bilgisini kullanabilirsin.
                      </div>
                    ) : null}

                    <div className="application-card-actions">
                      <button
                        type="button"
                        className="ghost-button profile-inline-button"
                        onClick={() => toggleApplicantProfile(application.applicantUserId)}
                        disabled={isProfileLoading}
                      >
                        <Sparkles size={15} />
                        {isProfileLoading
                          ? 'Profil yukleniyor...'
                          : isProfileOpen
                            ? 'Profili gizle'
                            : 'Profili gor'}
                      </button>

                      <button
                        type="button"
                        className="ghost-button profile-inline-button"
                        onClick={() =>
                          decideApplication(application.studentProjectPostId, application.id, 'accept')
                        }
                        disabled={isBusy || !canAccept}
                      >
                        <BadgeCheck size={15} />
                        {isBusy ? 'Kaydediliyor...' : 'Kabul et'}
                      </button>

                      <button
                        type="button"
                        className="ghost-button profile-inline-button profile-inline-button-danger"
                        onClick={() =>
                          decideApplication(application.studentProjectPostId, application.id, 'reject')
                        }
                        disabled={isBusy || application.status === 'Withdrawn'}
                      >
                        <X size={15} />
                        {isBusy ? 'Kaydediliyor...' : 'Reddet'}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              Bu ilana henuz basvuru gelmemis.
            </div>
          )}
        </section>
      </div>
    </div>
  );

  const renderTechnologyModal = () => (
    <div className="selection-modal-overlay" onClick={closeSelectionModal}>
      <div
        className="selection-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Teknoloji seçimi"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="selection-modal-header">
          <div>
            <div className="selection-modal-kicker">Arama + kategori + preset</div>
            <h2>Teknoloji seç</h2>
            <p>
              Büyük listelerde önce ara, sonra kategoriyle daralt veya hazır paket ekle.
            </p>
          </div>

          <button type="button" className="selection-modal-close" onClick={closeSelectionModal}>
            <X size={18} />
          </button>
        </div>

        <div className="selection-modal-toolbar">
          <label className="post-search-shell">
            <Search size={16} />
            <input
              className="input-field post-search-input"
              value={technologyQuery}
              onChange={(event) => setTechnologyQuery(event.target.value)}
              placeholder="Teknoloji veya kategori ara"
            />
          </label>

          <span className="selection-toolbar-count">
            {filteredTechnologyOptions.length} sonuç
          </span>
        </div>

        {technologyPresets.length ? (
          <section className="selection-modal-section">
            <div className="selection-modal-section-head">
              <div>
                <strong>{postForm.projectType} için hızlı paketler</strong>
                <span>Tek tıkla uygun teknoloji setini ekle, sonra ince ayar yap.</span>
              </div>
            </div>

            <div className="selection-preset-grid">
              {technologyPresets.map((preset) => {
                const isPresetReady = preset.optionIds.every((id) =>
                  postForm.technologyIds.includes(id)
                );

                return (
                  <button
                    key={preset.key}
                    type="button"
                    className={`selection-preset-card ${isPresetReady ? 'selected' : ''}`}
                    onClick={() => applyTechnologyPreset(preset)}
                  >
                    <div className="selection-preset-top">
                      <strong>{preset.label}</strong>
                      <span>{isPresetReady ? 'Hazır' : 'Paketi ekle'}</span>
                    </div>

                    <p>{preset.description}</p>

                    <div className="selection-preset-tags">
                      {preset.optionNames.map((name) => (
                        <span key={name}>{name}</span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        <section className="selection-modal-section">
          <div className="selection-modal-section-head">
            <div>
              <strong>Kategori filtresi</strong>
              <span>Liste büyüdükçe sadece ilgili grupları aç.</span>
            </div>
          </div>

          <div className="selection-filter-pills">
            {technologyCategories.map((category) => (
              <button
                key={category}
                type="button"
                className={`selection-filter-pill ${
                  activeTechnologyCategory === category ? 'active' : ''
                }`}
                onClick={() => setActiveTechnologyCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </section>

        <section className="selection-modal-section">
          <div className="selection-modal-section-head">
            <div>
              <strong>Seçilen teknolojiler</strong>
              <span>{selectedTechnologyOptions.length} teknoloji ilanda kullanılacak.</span>
            </div>

            {selectedTechnologyOptions.length ? (
              <button
                type="button"
                className="ghost-button selection-inline-button"
                onClick={() =>
                  setPostForm((current) => ({ ...current, technologyIds: [] }))
                }
              >
                Temizle
              </button>
            ) : null}
          </div>

          {renderSelectionPreview(
            selectedTechnologyOptions,
            'Henüz teknoloji seçilmedi. Arama yapabilir veya hazır paket ekleyebilirsin.',
            (option) => option.category
          )}
        </section>

        <section className="selection-modal-section selection-modal-results">
          <div className="selection-modal-section-head">
            <div>
              <strong>
                {activeTechnologyCategory === allTechnologyCategoriesLabel
                  ? 'Tüm teknolojiler'
                  : activeTechnologyCategory}
              </strong>
              <span>
                {technologyQuery.trim()
                  ? 'Arama sonucunu seç veya kaldır.'
                  : 'İhtiyacına uygun teknolojileri işaretle.'}
              </span>
            </div>
          </div>

          {renderSelectionRows(
            filteredTechnologyOptions,
            postForm.technologyIds,
            toggleTechnologySelection,
            (option) => option.category,
            'Bu filtreye uygun teknoloji bulunamadı.'
          )}
        </section>

        <div className="selection-modal-footer">
          <button type="button" className="btn-primary selection-modal-confirm" onClick={closeSelectionModal}>
            Secimi tamamla
          </button>
        </div>
      </div>
    </div>
  );

  const renderDepartmentModal = () => (
    <div className="selection-modal-overlay" onClick={closeSelectionModal}>
      <div
        className="selection-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Bölüm seçimi"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="selection-modal-header">
          <div>
            <div className="selection-modal-kicker">Arama + fakülte filtresi</div>
            <h2>Bölüm seç</h2>
            <p>
              İlanını hangi bölümlerin göreceğini arayarak veya fakülteye göre filtreleyerek belirle.
            </p>
          </div>

          <button type="button" className="selection-modal-close" onClick={closeSelectionModal}>
            <X size={18} />
          </button>
        </div>

        <div className="selection-modal-toolbar">
          <label className="post-search-shell">
            <Search size={16} />
            <input
              className="input-field post-search-input"
              value={departmentQuery}
              onChange={(event) => setDepartmentQuery(event.target.value)}
              placeholder="Bölüm, kod veya fakülte ara"
            />
          </label>

          <span className="selection-toolbar-count">
            {filteredDepartmentOptions.length} sonuç
          </span>
        </div>

        <section className="selection-modal-section">
          <div className="selection-modal-section-head">
            <div>
              <strong>Fakülte filtresi</strong>
              <span>Kalabalık bölüm listesinde önce fakülteyi daralt.</span>
            </div>
          </div>

          <div className="selection-filter-pills">
            {departmentFaculties.map((facultyName) => (
              <button
                key={facultyName}
                type="button"
                className={`selection-filter-pill ${
                  activeDepartmentFaculty === facultyName ? 'active' : ''
                }`}
                onClick={() => setActiveDepartmentFaculty(facultyName)}
              >
                {facultyName}
              </button>
            ))}
          </div>
        </section>

        <section className="selection-modal-section">
          <div className="selection-modal-section-head">
            <div>
              <strong>Seçilen bölümler</strong>
              <span>{selectedDepartmentOptions.length} bölüm ilanı görebilecek.</span>
            </div>

            {selectedDepartmentOptions.length ? (
              <button
                type="button"
                className="ghost-button selection-inline-button"
                onClick={() =>
                  setPostForm((current) => ({ ...current, departmentIds: [] }))
                }
              >
                Temizle
              </button>
            ) : null}
          </div>

          {renderSelectionPreview(
            selectedDepartmentOptions,
            'Henüz bölüm seçilmedi. Fakülteye göre daraltıp ilgili bölümleri işaretleyebilirsin.',
            (option) => option.facultyName || option.code
          )}
        </section>

        <section className="selection-modal-section selection-modal-results">
          <div className="selection-modal-section-head">
            <div>
              <strong>
                {activeDepartmentFaculty === allDepartmentFacultiesLabel
                  ? 'Tüm bölümler'
                  : activeDepartmentFaculty}
              </strong>
              <span>
                {departmentQuery.trim()
                  ? 'Arama sonuçlarından uygun bölümleri seç.'
                  : 'İlanın hangi bölümlere gideceğini belirle.'}
              </span>
            </div>
          </div>

          {activeDepartmentFaculty === allDepartmentFacultiesLabel ? (
            <div className="selection-group-stack">
              {Object.entries(groupedDepartmentOptions).map(([facultyName, options]) => (
                <div key={facultyName} className="selection-group">
                  <div className="selection-group-head">
                    <strong>{facultyName}</strong>
                    <span>{options.length} bölüm</span>
                  </div>

                  {renderSelectionRows(
                    options,
                    postForm.departmentIds,
                    toggleDepartmentSelection,
                    (option) => [option.code, option.facultyName].filter(Boolean).join(' • '),
                    'Bu fakültede gösterilecek bölüm bulunamadı.'
                  )}
                </div>
              ))}

              {!Object.keys(groupedDepartmentOptions).length ? (
                <div className="empty-state post-inline-empty">
                  Bu filtreye uygun bolum bulunamadi.
                </div>
              ) : null}
            </div>
          ) : (
            renderSelectionRows(
              filteredDepartmentOptions,
              postForm.departmentIds,
              toggleDepartmentSelection,
              (option) => [option.code, option.facultyName].filter(Boolean).join(' • '),
              'Bu filtreye uygun bolum bulunamadi.'
            )
          )}
        </section>

        <div className="selection-modal-footer">
          <button type="button" className="btn-primary selection-modal-confirm" onClick={closeSelectionModal}>
            Secimi tamamla
          </button>
        </div>
      </div>
    </div>
  );

  const renderMyPosts = () => (
    <section className="posts-workspace">
      {isComposerOpen ? (
        <PostComposer
          key={`${isComposerOpen ? 'open' : 'closed'}-${editingPostId ?? 'new'}`}
          editingPostId={editingPostId}
          isComposerOpen={isComposerOpen}
          onBeginCreate={beginCreate}
          onCancel={resetComposer}
          onOpenDepartmentSelector={openDepartmentSelector}
          onOpenTechnologySelector={openTechnologySelector}
          onSubmit={submitPost}
          postForm={postForm}
          saving={saving}
          selectedDepartmentOptions={selectedDepartmentOptions}
          selectedTechnologyOptions={selectedTechnologyOptions}
          setPostForm={setPostForm}
        />
      ) : null}

      <article className="card profile-block posts-panel">
        <div className="posts-panel-head">
          <div>
            <h2 className="posts-panel-title">İlanlarım</h2>
            <p className="posts-panel-meta">
              {myPosts.length} ilan • {myOpenCount} açık • {myDraftCount} taslak
            </p>
          </div>
        </div>

        {loading ? (
          <div className="empty-state">İlanlar yükleniyor.</div>
        ) : myPosts.length ? (
          <div className="posts-group-stack">
            {myPostSections.map((section) => (
              <section key={section.id} className="posts-group-section">
                <div className="posts-group-head">
                  <strong>{section.title}</strong>
                  <span className="posts-group-count">{section.posts.length}</span>
                </div>

                <div className="post-card-grid post-card-grid-single">
                  {section.posts.map((post) => (
                    <PostCard
                      key={post.id}
                      applyingPostId={applyingPostId}
                      deletingId={deletingId}
                      isMineTab
                      isOwnPost={myPostIdSet.has(post.id)}
                      myApplication={myApplicationMap[post.id]}
                      onApply={applyToPost}
                      onEdit={beginEdit}
                      onManageApplications={openApplicationManager}
                      onRemove={removePost}
                      onWithdraw={withdrawApplication}
                      post={post}
                      withdrawingPostId={withdrawingPostId}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="empty-state empty-state-rich posts-empty-state">
            <strong>Henüz ilanın yok.</strong>
            <p>
              {isComposerOpen
                ? 'Formu doldurup ilk ilanını kaydettiğinde burada görünecek.'
                : 'Yeni İlan butonuyla ilk ilanını oluşturabilirsin.'}
            </p>
          </div>
        )}
      </article>
    </section>
  );

  const renderMyApplications = () => (
    <section className="posts-workspace">
      <article className="card profile-block posts-panel">
        <div className="posts-panel-head">
          <div>
            <h2 className="posts-panel-title">Başvurularım</h2>
            <p className="posts-panel-meta">{myApplications.length} toplam başvuru</p>
          </div>
        </div>

        <div className="posts-filter-row">
          {applicationFilters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              className={`posts-filter-chip ${applicationStatusFilter === filter.id ? 'active' : ''}`}
              onClick={() => setApplicationStatusFilter(filter.id)}
            >
              <span>{filter.label}</span>
              <strong>{filter.count}</strong>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="empty-state">Başvurular yükleniyor.</div>
        ) : filteredMyApplications.length ? (
          <div className="application-card-list">
            {filteredMyApplications.map((application) => {
              const applicationTone = getApplicationTone(application.status);
              const isAccepted = application.status === 'Accepted';
              const isPending = application.status === 'Pending';
              const isRejectedOrWithdrawn =
                application.status === 'Rejected' || application.status === 'Withdrawn';

              return (
                <article key={application.id} className="application-card">
                  <div className="application-card-top">
                    <div className="application-card-copy">
                      <strong>{application.postTitle}</strong>
                      <span>{application.postCategory || 'Kategori belirtilmedi'}</span>
                      <span>{application.postProjectType || 'Proje tipi belirtilmedi'}</span>
                    </div>

                    <span className={`post-status-pill application-status-pill ${applicationTone}`}>
                      {application.status}
                    </span>
                  </div>

                  <div className="post-meta-row">
                    <span className="project-meta-chip">
                      <CalendarDays size={14} />
                      {formatDateLabel(application.applicationDeadline)}
                    </span>
                    <span className="project-meta-chip subtle">
                      İlan durumu: {application.postStatus}
                    </span>
                  </div>

                  {isAccepted ? (
                    <div className="application-match-panel">
                      <div className="application-match-panel-copy">
                        <span className="application-match-kicker">Takım eşleşmesi hazır</span>
                        <strong>{application.ownerFullName || 'İlan sahibi'}</strong>
                        <p>
                          İlan sahibi seni ekibe kabul etti. İletişime geçip görev dağılımı ve
                          sonraki adımları netleştirebilirsin.
                        </p>
                      </div>

                      <div className="application-match-contact-list">
                        {application.ownerDepartmentName ? (
                          <span className="project-meta-chip subtle">
                            <Building2 size={14} />
                            {application.ownerDepartmentName}
                          </span>
                        ) : null}

                        {application.ownerEmail ? (
                          <span className="project-meta-chip">
                            {application.ownerEmail}
                          </span>
                        ) : null}
                      </div>

                      {application.ownerEmail ? (
                        <div className="application-card-actions application-card-contact-actions">
                          <a
                            className="ghost-button profile-inline-button"
                            href={`mailto:${application.ownerEmail}`}
                          >
                            E-posta gönder
                          </a>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="application-card-actions">
                    {isPending ? (
                      <button
                        type="button"
                        className="ghost-button profile-inline-button"
                        onClick={() => withdrawApplication(application.studentProjectPostId)}
                        disabled={withdrawingPostId === application.studentProjectPostId}
                      >
                        <RotateCcw size={15} />
                        {withdrawingPostId === application.studentProjectPostId
                          ? 'Geri cekiliyor...'
                          : 'Başvuruyu geri çek'}
                      </button>
                    ) : null}

                    {isRejectedOrWithdrawn && application.postStatus === 'Open' ? (
                      <button
                        type="button"
                        className="ghost-button profile-inline-button"
                        onClick={() => applyToPost(application.studentProjectPostId)}
                        disabled={applyingPostId === application.studentProjectPostId}
                      >
                        <UserPlus size={15} />
                        {applyingPostId === application.studentProjectPostId
                          ? 'Gonderiliyor...'
                          : 'Tekrar başvur'}
                      </button>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            {myApplications.length
              ? 'Bu filtreye uyan başvuru bulunamadı.'
              : 'Henüz herhangi bir ilana başvurmadın. Açık ilanlar sekmesinden ilgini çeken ilanlara başvurabilirsin.'}
          </div>
        )}
      </article>
    </section>
  );

  const renderOpenPosts = () => (
    <section className="posts-workspace">
      <article className="card profile-block posts-panel">
        <div className="posts-panel-head">
          <div>
            <h2 className="posts-panel-title">Açık İlanlar</h2>
            <p className="posts-panel-meta">
              {openQuery.trim() ? `${filteredOpenPosts.length} sonuç` : `${openPosts.length} ilan`}
            </p>
          </div>
        </div>

        <div className="posts-search-row">
          <label className="post-search-shell">
            <Search size={16} />
            <input
              className="input-field post-search-input"
              value={openQuery}
              onChange={(event) => setOpenQuery(event.target.value)}
              placeholder="Başlık, kategori, teknoloji veya bölüm ara"
            />
          </label>
        </div>

        {loading ? (
          <div className="empty-state">Açık ilanlar yükleniyor.</div>
        ) : filteredOpenPosts.length ? (
          <div className="post-card-grid">
            {filteredOpenPosts.map((post) => (
              <PostCard
                key={post.id}
                applyingPostId={applyingPostId}
                deletingId={deletingId}
                isOwnPost={myPostIdSet.has(post.id)}
                myApplication={myApplicationMap[post.id]}
                onApply={applyToPost}
                onEdit={beginEdit}
                onManageApplications={openApplicationManager}
                onRemove={removePost}
                onWithdraw={withdrawApplication}
                post={post}
                withdrawingPostId={withdrawingPostId}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            Bu filtreye uygun açık ilan bulunamadı.
          </div>
        )}
      </article>
    </section>
  );

  return (
    <div className="app-layout">
      <AppHeader
        currentView={currentView}
        initials={initials}
        onLogout={onLogout}
        onViewChange={onViewChange}
        profile={profile}
      />

      <main className="main-content posts-page-main">
        <section className="posts-page-header">
          <div className="posts-page-header-copy">
            <h1>İlanlar</h1>
            <p>İlan aç, açık ilanları incele ve başvurularını yönet.</p>
          </div>

          <div className="posts-page-header-actions">
            <button className="btn-primary posts-hero-primary" type="button" onClick={beginCreate}>
              <Plus size={16} />
              Yeni İlan
            </button>

            <button
              className="ghost-button"
              type="button"
              onClick={() => loadPostsData(true)}
              disabled={refreshing}
            >
              <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
              {refreshing ? 'Yenileniyor' : 'Yenile'}
            </button>
          </div>
        </section>

        {actionError ? <div className="dashboard-alert">{actionError}</div> : null}
        {actionMessage ? <div className="dashboard-alert dashboard-alert-success">{actionMessage}</div> : null}

        <section className="posts-tabbar">
          <div className="posts-view-grid">
            {viewOptions.map((option) => {
              const Icon = option.icon;

              return (
                <button
                  key={option.id}
                  type="button"
                  className={`posts-view-card posts-view-card-${option.id} ${activeTab === option.id ? 'active' : ''}`}
                  onClick={() => {
                    clearFeedback();
                    setActiveTab(option.id);
                  }}
                >
                  <div className="posts-view-card-top">
                    <span className="posts-view-icon">
                      <Icon size={16} />
                    </span>
                    <div className="posts-view-card-copy">
                      <strong>{option.label}</strong>
                    </div>
                    <span className="posts-view-count">{option.count}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {activeTab === 'mine'
          ? renderMyPosts()
          : activeTab === 'applications'
            ? renderMyApplications()
            : renderOpenPosts()}
      </main>

      <AppFooter currentView={currentView} onViewChange={onViewChange} />
      {selectionModal === 'technology' ? renderTechnologyModal() : null}
      {selectionModal === 'department' ? renderDepartmentModal() : null}
      {applicationManagerPost ? renderApplicationManagerModal() : null}
    </div>
  );
}

export default StudentProjectPostsPage;
