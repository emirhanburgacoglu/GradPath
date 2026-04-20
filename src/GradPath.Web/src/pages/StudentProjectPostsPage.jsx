import { useEffect, useState } from 'react';
import {
  BadgeCheck,
  Building2,
  CalendarDays,
  Check,
  ClipboardList,
  Clock3,
  FolderKanban,
  Layers3,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Sparkles,
  Tag,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import AppHeader from '../components/AppHeader';
import api from '../api';

const projectTypeOptions = [
  'Hackathon',
  'Competition',
  'Startup',
  'CourseProject',
  'Research',
  'OpenSource',
];

const statusOptions = ['Draft', 'Open', 'Closed', 'Filled'];
const allTechnologyCategoriesLabel = 'Tum Kategoriler';
const allDepartmentFacultiesLabel = 'Tum Fakulteler';

const sharedTechnologyPresets = [
  {
    key: 'web-stack',
    label: 'Web Stack',
    description: 'Arayuz, API ve veri katmanini hizla kur.',
    names: ['React', 'REST API', 'PostgreSQL'],
  },
  {
    key: 'backend-stack',
    label: 'Backend Temel',
    description: 'Servis, ORM ve veritabani omurgasi.',
    names: ['ASP.NET Core', 'Entity Framework', 'PostgreSQL'],
  },
];

const technologyPresetCatalog = {
  Hackathon: [
    {
      key: 'hackathon-mvp',
      label: 'Hizli MVP',
      description: 'Demo, sunum ve servis akisini ayni anda kur.',
      names: ['React', 'REST API', 'PostgreSQL'],
    },
    {
      key: 'hackathon-ai',
      label: 'AI Prototip',
      description: 'Model, veri ve analiz cekirdegi.',
      names: ['Python', 'Machine Learning', 'Scikit-learn'],
    },
  ],
  Competition: [
    {
      key: 'competition-ai',
      label: 'Yarisma AI',
      description: 'Veri ve model odakli hizli kadro.',
      names: ['Python', 'Machine Learning', 'Scikit-learn'],
    },
    {
      key: 'competition-cv',
      label: 'Goruntu Isleme',
      description: 'Kamera veya algi tabanli takimlar icin.',
      names: ['Python', 'OpenCV', 'Raspberry Pi'],
    },
  ],
  Startup: [
    {
      key: 'startup-web',
      label: 'Urun Cekirdegi',
      description: 'Web urununu hizla yayina cikar.',
      names: ['React', 'REST API', 'PostgreSQL'],
    },
    {
      key: 'startup-mobile',
      label: 'Mobil MVP',
      description: 'Mobil arayuz ve servis katmani.',
      names: ['Flutter', 'REST API', 'PostgreSQL'],
    },
  ],
  CourseProject: [
    {
      key: 'course-web',
      label: 'Ders Projesi Web',
      description: 'Temel arayuz ve backend iskeleti.',
      names: ['HTML', 'CSS', 'JavaScript', 'REST API'],
    },
    {
      key: 'course-backend',
      label: 'Ders Projesi Backend',
      description: 'Sunucu ve veri katmani icin guvenli baslangic.',
      names: ['ASP.NET Core', 'Entity Framework', 'PostgreSQL'],
    },
  ],
  Research: [
    {
      key: 'research-ai',
      label: 'Arastirma AI',
      description: 'Analiz, modelleme ve deney seti.',
      names: ['Python', 'Machine Learning', 'Scikit-learn'],
    },
    {
      key: 'research-platform',
      label: 'Arastirma Platformu',
      description: 'API ve veri odakli arastirma akisi.',
      names: ['REST API', 'PostgreSQL', 'Git'],
    },
  ],
  OpenSource: [
    {
      key: 'opensource-core',
      label: 'Acik Kaynak Baslangic',
      description: 'Depo, katkilar ve servis katmani.',
      names: ['Git', 'GitHub', 'REST API'],
    },
    {
      key: 'opensource-web',
      label: 'Acik Kaynak Web',
      description: 'Arayuz tarafina katki verecek ekip.',
      names: ['React', 'JavaScript', 'CSS'],
    },
  ],
};

function createEmptyPostForm() {
  return {
    title: '',
    description: '',
    category: '',
    projectType: 'Hackathon',
    status: 'Draft',
    teamSize: 4,
    neededMemberCount: 2,
    applicationDeadline: '',
    technologyIds: [],
    departmentIds: [],
  };
}

function getErrorMessage(error, fallback) {
  const responseData = error?.response?.data;

  if (typeof responseData === 'string' && responseData.trim()) {
    return responseData;
  }

  return responseData?.message || responseData?.title || fallback;
}

function formatDateLabel(value) {
  if (!value) {
    return 'Son tarih belirlenmedi';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Gecersiz tarih';
  }

  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function toDateTimeLocalValue(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const timezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
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

function toggleSelection(list, value) {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

function normalizeLookupValue(value) {
  return String(value || '').trim().toLowerCase();
}

function matchesLookupQuery(values, query) {
  const normalizedQuery = normalizeLookupValue(query);

  if (!normalizedQuery) {
    return true;
  }

  return values
    .filter(Boolean)
    .some((value) => normalizeLookupValue(value).includes(normalizedQuery));
}

function getStatusTone(status) {
  switch (status) {
    case 'Open':
      return 'open';
    case 'Draft':
      return 'draft';
    case 'Filled':
      return 'filled';
    default:
      return 'closed';
  }
}

function getApplicationTone(status) {
  switch (status) {
    case 'Accepted':
      return 'accepted';
    case 'Rejected':
      return 'rejected';
    case 'Withdrawn':
      return 'withdrawn';
    default:
      return 'pending';
  }
}

function sortOptionsForSelection(options, selectedIds, metaSelector) {
  return [...options].sort((left, right) => {
    const leftSelected = selectedIds.includes(left.id);
    const rightSelected = selectedIds.includes(right.id);

    if (leftSelected !== rightSelected) {
      return leftSelected ? -1 : 1;
    }

    const metaCompare = String(metaSelector(left) || '').localeCompare(
      String(metaSelector(right) || ''),
      'tr',
      { sensitivity: 'base' }
    );

    if (metaCompare !== 0) {
      return metaCompare;
    }

    return String(left.name || '').localeCompare(String(right.name || ''), 'tr', {
      sensitivity: 'base',
    });
  });
}

function buildTechnologyPresets(options, projectType) {
  const optionMap = options.reduce((accumulator, option) => {
    const normalizedName = normalizeLookupValue(option.name);

    if (normalizedName && !accumulator[normalizedName]) {
      accumulator[normalizedName] = option;
    }

    return accumulator;
  }, {});

  const definitions = [
    ...(technologyPresetCatalog[projectType] || []),
    ...sharedTechnologyPresets,
  ];

  return definitions
    .map((definition) => {
      const resolvedOptions = definition.names
        .map((name) => optionMap[normalizeLookupValue(name)])
        .filter(Boolean)
        .filter(
          (option, index, collection) =>
            collection.findIndex((candidate) => candidate.id === option.id) === index
        );

      if (resolvedOptions.length < 2) {
        return null;
      }

      return {
        key: definition.key,
        label: definition.label,
        description: definition.description,
        optionIds: resolvedOptions.map((option) => option.id),
        optionNames: resolvedOptions.map((option) => option.name),
      };
    })
    .filter(Boolean);
}

function StudentProjectPostsPage({
  currentView,
  initials,
  onLogout,
  onViewChange,
  profile,
}) {
  const [activeTab, setActiveTab] = useState('mine');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');
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

  const technologyCategories = [
    allTechnologyCategoriesLabel,
    ...Array.from(
      new Set(technologyOptions.map((option) => option.category).filter(Boolean))
    ).sort((left, right) => left.localeCompare(right, 'tr', { sensitivity: 'base' })),
  ];

  const departmentFaculties = [
    allDepartmentFacultiesLabel,
    ...Array.from(
      new Set(departmentOptions.map((option) => option.facultyName).filter(Boolean))
    ).sort((left, right) => left.localeCompare(right, 'tr', { sensitivity: 'base' })),
  ];

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

  const loadPostsData = async (silent = false) => {
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
  };

  useEffect(() => {
    loadPostsData();
  }, []);

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
      setActionError('Baslik, aciklama ve kategori alanlari zorunlu.');
      return;
    }

    if (postForm.teamSize < 1 || postForm.teamSize > 20) {
      setActionError('Takim boyutu 1 ile 20 arasinda olmali.');
      return;
    }

    if (postForm.neededMemberCount < 0 || postForm.neededMemberCount > 20) {
      setActionError('Aranan uye sayisi 0 ile 20 arasinda olmali.');
      return;
    }

    if (postForm.neededMemberCount > postForm.teamSize) {
      setActionError('Aranan uye sayisi takim boyutundan buyuk olamaz.');
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
        setActionMessage('Ilan basariyla guncellendi.');
      } else {
        await api.post('/student-project-posts', payload);
        setActionMessage('Ilan basariyla olusturuldu.');
      }

      resetComposer();
      await loadPostsData(true);
    } catch (error) {
      if (error?.response?.status === 401) {
        onLogout();
        return;
      }

      setActionError(getErrorMessage(error, 'Ilan kaydedilemedi. Bilgileri kontrol edip tekrar dene.'));
    } finally {
      setSaving(false);
    }
  };

  const removePost = async (postId) => {
    if (!window.confirm('Bu ilani silmek istedigine emin misin?')) {
      return;
    }

    clearFeedback();
    setDeletingId(postId);

    try {
      await api.delete(`/student-project-posts/${postId}`);
      setActionMessage('Ilan basariyla silindi.');

      if (editingPostId === postId) {
        resetComposer();
      }

      await loadPostsData(true);
    } catch (error) {
      if (error?.response?.status === 401) {
        onLogout();
        return;
      }

      setActionError(getErrorMessage(error, 'Ilan silinemedi. Lutfen tekrar dene.'));
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
      setActionError(getErrorMessage(error, 'Basvurular yuklenemedi. Lutfen tekrar dene.'));
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
      setActionError(getErrorMessage(error, 'Aday profili yuklenemedi. Lutfen tekrar dene.'));
    } finally {
      setLoadingApplicantProfileId('');
    }
  };

  const applyToPost = async (postId) => {
    clearFeedback();
    setApplyingPostId(postId);

    try {
      const response = await api.post(`/student-project-posts/${postId}/apply`);
      setActionMessage(response.data || 'Basvurun basariyla gonderildi.');
      await loadPostsData(true);
    } catch (error) {
      if (error?.response?.status === 401) {
        onLogout();
        return;
      }

      setActionError(getErrorMessage(error, 'Basvuru gonderilemedi. Lutfen tekrar dene.'));
    } finally {
      setApplyingPostId('');
    }
  };

  const withdrawApplication = async (postId) => {
    clearFeedback();
    setWithdrawingPostId(postId);

    try {
      const response = await api.delete(`/student-project-posts/${postId}/apply`);
      setActionMessage(response.data || 'Basvurun geri cekildi.');
      await loadPostsData(true);
    } catch (error) {
      if (error?.response?.status === 401) {
        onLogout();
        return;
      }

      setActionError(getErrorMessage(error, 'Basvuru geri cekilemedi. Lutfen tekrar dene.'));
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

      setActionMessage(response.data || 'Basvuru durumu guncellendi.');
      await Promise.all([loadPostsData(true), loadManagedApplications(postId)]);
    } catch (error) {
      if (error?.response?.status === 401) {
        onLogout();
        return;
      }

      setActionError(getErrorMessage(error, 'Basvuru durumu guncellenemedi. Lutfen tekrar dene.'));
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

  const renderPostTags = (items, fallbackText) => {
    if (!items?.length) {
      return <span className="project-empty-tag">{fallbackText}</span>;
    }

    return items.map((item) => (
      <span key={item} className="tech-tag matched">
        {item}
      </span>
    ));
  };

  const renderApplicationManagerModal = () => (
    <div className="selection-modal-overlay" onClick={closeApplicationManager}>
      <div
        className="selection-modal application-manager-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Basvuru yonetimi"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="selection-modal-header">
          <div>
            <div className="selection-modal-kicker">Owner paneli</div>
            <h2>Basvurulari yonet</h2>
            <p>
              <strong>{applicationManagerPost?.title || 'Ilan'}</strong> icin gelen basvurulari
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
              <strong>Ilan ozeti</strong>
              <span>Kalan slot, bekleyen ve kabul edilen basvurulari hizla gor.</span>
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
                  <span>Basvuran ogrencinin read-only profil gorunumu.</span>
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
                    <div className="applicant-public-profile-copy">
                      <strong>{selectedApplicantProfile.fullName}</strong>
                      <span>
                        {[
                          selectedApplicantProfile.departmentName,
                          selectedApplicantProfile.departmentCode,
                        ]
                          .filter(Boolean)
                          .join(' • ') || 'Bolum bilgisi yok'}
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
                        {selectedApplicantProfile.isHonorStudent ? 'Onur ogrencisi' : 'Standart profil'}
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
                    <article className="applicant-public-profile-card">
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

                    <article className="applicant-public-profile-card">
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
                </>
              ) : null}
            </div>
          ) : null}

          <div className="selection-modal-section-head">
            <div>
              <strong>Basvuran ogrenciler</strong>
              <span>Bekleyen basvurular ilk sirada listelenir.</span>
            </div>
          </div>

          {loadingManagedApplications ? (
            <div className="empty-state">Basvurular yukleniyor.</div>
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
        aria-label="Teknoloji secimi"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="selection-modal-header">
          <div>
            <div className="selection-modal-kicker">Arama + kategori + preset</div>
            <h2>Teknoloji sec</h2>
            <p>
              Buyuk listelerde once ara, sonra kategoriyle daralt veya hazir paket ekle.
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
            {filteredTechnologyOptions.length} sonuc
          </span>
        </div>

        {technologyPresets.length ? (
          <section className="selection-modal-section">
            <div className="selection-modal-section-head">
              <div>
                <strong>{postForm.projectType} icin hizli paketler</strong>
                <span>Tek tikla uygun teknoloji setini ekle, sonra ince ayar yap.</span>
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
                      <span>{isPresetReady ? 'Hazir' : 'Paketi ekle'}</span>
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
              <span>Liste buyudukce sadece ilgili gruplari ac.</span>
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
              <strong>Secilen teknolojiler</strong>
              <span>{selectedTechnologyOptions.length} teknoloji ilanda kullanilacak.</span>
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
            'Henuz teknoloji secilmedi. Arama yapabilir veya hazir paket ekleyebilirsin.',
            (option) => option.category
          )}
        </section>

        <section className="selection-modal-section selection-modal-results">
          <div className="selection-modal-section-head">
            <div>
              <strong>
                {activeTechnologyCategory === allTechnologyCategoriesLabel
                  ? 'Tum teknolojiler'
                  : activeTechnologyCategory}
              </strong>
              <span>
                {technologyQuery.trim()
                  ? 'Arama sonucunu sec veya kaldir.'
                  : 'Ihtiyacina uygun teknolojileri isaretle.'}
              </span>
            </div>
          </div>

          {renderSelectionRows(
            filteredTechnologyOptions,
            postForm.technologyIds,
            toggleTechnologySelection,
            (option) => option.category,
            'Bu filtreye uygun teknoloji bulunamadi.'
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
        aria-label="Bolum secimi"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="selection-modal-header">
          <div>
            <div className="selection-modal-kicker">Arama + fakulte filtresi</div>
            <h2>Bolum sec</h2>
            <p>
              Ilanini hangi bolumlerin gorecegini arayarak veya fakulteye gore filtreleyerek belirle.
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
              placeholder="Bolum, kod veya fakulte ara"
            />
          </label>

          <span className="selection-toolbar-count">
            {filteredDepartmentOptions.length} sonuc
          </span>
        </div>

        <section className="selection-modal-section">
          <div className="selection-modal-section-head">
            <div>
              <strong>Fakulte filtresi</strong>
              <span>Kalabalik bolum listesinde once fakulteyi daralt.</span>
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
              <strong>Secilen bolumler</strong>
              <span>{selectedDepartmentOptions.length} bolum ilani gorebilecek.</span>
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
            'Henuz bolum secilmedi. Fakulteye gore daraltip ilgili bolumleri isaretleyebilirsin.',
            (option) => option.facultyName || option.code
          )}
        </section>

        <section className="selection-modal-section selection-modal-results">
          <div className="selection-modal-section-head">
            <div>
              <strong>
                {activeDepartmentFaculty === allDepartmentFacultiesLabel
                  ? 'Tum bolumler'
                  : activeDepartmentFaculty}
              </strong>
              <span>
                {departmentQuery.trim()
                  ? 'Arama sonuclarindan uygun bolumleri sec.'
                  : 'Ilanin hangi bolumlere gidecegini belirle.'}
              </span>
            </div>
          </div>

          {activeDepartmentFaculty === allDepartmentFacultiesLabel ? (
            <div className="selection-group-stack">
              {Object.entries(groupedDepartmentOptions).map(([facultyName, options]) => (
                <div key={facultyName} className="selection-group">
                  <div className="selection-group-head">
                    <strong>{facultyName}</strong>
                    <span>{options.length} bolum</span>
                  </div>

                  {renderSelectionRows(
                    options,
                    postForm.departmentIds,
                    toggleDepartmentSelection,
                    (option) => [option.code, option.facultyName].filter(Boolean).join(' • '),
                    'Bu fakultede gosterilecek bolum bulunamadi.'
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

  const renderPostCard = (post, isMineTab = false) => {
    const statusTone = getStatusTone(post.status);
    const isOwnPost = myPostIdSet.has(post.id);
    const myApplication = myApplicationMap[post.id];
    const applicationTone = myApplication ? getApplicationTone(myApplication.status) : '';
    const canApply = !isOwnPost && post.status === 'Open' && post.availableMemberSlotCount > 0;
    const isApplying = applyingPostId === post.id;
    const isWithdrawing = withdrawingPostId === post.id;

    return (
      <article key={post.id} className="card post-card">
        <div className="post-card-top">
          <div className="post-card-copy">
            <div className="post-card-kicker">
              {myPostIdSet.has(post.id) ? 'Sana ait ilan' : 'Acik ekip ilani'}
            </div>
            <h3>{post.title}</h3>
            <p>{post.description}</p>
          </div>

          <div className="post-card-side">
            <span className={`post-status-pill ${statusTone}`}>{post.status}</span>
            {isMineTab ? (
              <div className="profile-item-actions">
                <button
                  type="button"
                  className="ghost-button profile-inline-button"
                  onClick={() => beginEdit(post)}
                >
                  <Pencil size={14} />
                  Duzenle
                </button>

                <button
                  type="button"
                  className="ghost-button profile-inline-button profile-inline-button-danger"
                  onClick={() => removePost(post.id)}
                  disabled={deletingId === post.id}
                >
                  <Trash2 size={14} />
                  {deletingId === post.id ? 'Siliniyor...' : 'Sil'}
                </button>

                <button
                  type="button"
                  className="ghost-button profile-inline-button"
                  onClick={() => openApplicationManager(post)}
                >
                  <ClipboardList size={14} />
                  Basvurulari yonet
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="post-meta-row">
          <span className="project-meta-chip">{post.category || 'Kategori yok'}</span>
          <span className="project-meta-chip subtle">{post.projectType || 'Proje tipi yok'}</span>
          <span className="project-meta-chip">
            <Users size={14} />
            Takim: {post.teamSize}
          </span>
          <span className="project-meta-chip">
            <Layers3 size={14} />
            Aranan: {post.neededMemberCount}
          </span>
          <span className="project-meta-chip">
            <CalendarDays size={14} />
            {formatDateLabel(post.applicationDeadline)}
          </span>
          <span className="project-meta-chip">
            <ClipboardList size={14} />
            Bekleyen: {post.pendingApplicationCount || 0}
          </span>
          <span className="project-meta-chip">
            <BadgeCheck size={14} />
            Kabul: {post.acceptedApplicationCount || 0}
          </span>
          <span className="project-meta-chip subtle">
            Slot: {post.availableMemberSlotCount || 0}
          </span>
        </div>

        <div className="post-card-section">
          <div className="post-card-section-title">Bolumler</div>
          <div className="project-tags">
            {renderPostTags(post.departmentNames, 'Bolum secimi yok')}
          </div>
        </div>

        <div className="post-card-section">
          <div className="post-card-section-title">Teknolojiler</div>
          <div className="project-tags">
            {renderPostTags(post.technologyNames, 'Teknoloji secimi yok')}
          </div>
        </div>

        {!isMineTab ? (
          <div className="post-card-actions">
            {isOwnPost ? (
              <button
                type="button"
                className="ghost-button profile-inline-button"
                onClick={() => openApplicationManager(post)}
              >
                <ClipboardList size={15} />
                Basvurulari yonet
              </button>
            ) : null}

            {!isOwnPost && myApplication ? (
              <>
                <span className={`post-status-pill application-status-pill ${applicationTone}`}>
                  Basvuru: {myApplication.status}
                </span>

                {myApplication.status === 'Pending' ? (
                  <button
                    type="button"
                    className="ghost-button profile-inline-button"
                    onClick={() => withdrawApplication(post.id)}
                    disabled={isWithdrawing}
                  >
                    <RotateCcw size={15} />
                    {isWithdrawing ? 'Geri cekiliyor...' : 'Basvuruyu geri cek'}
                  </button>
                ) : null}

                {(myApplication.status === 'Rejected' || myApplication.status === 'Withdrawn') && canApply ? (
                  <button
                    type="button"
                    className="ghost-button profile-inline-button"
                    onClick={() => applyToPost(post.id)}
                    disabled={isApplying}
                  >
                    <UserPlus size={15} />
                    {isApplying ? 'Gonderiliyor...' : 'Tekrar basvur'}
                  </button>
                ) : null}
              </>
            ) : null}

            {!isOwnPost && !myApplication && canApply ? (
              <button
                type="button"
                className="ghost-button profile-inline-button"
                onClick={() => applyToPost(post.id)}
                disabled={isApplying}
              >
                <UserPlus size={15} />
                {isApplying ? 'Gonderiliyor...' : 'Basvur'}
              </button>
            ) : null}

            {!isOwnPost && !canApply && !myApplication ? (
              <span className="post-inline-note">
                Bu ilan su an basvuru kabul etmiyor.
              </span>
            ) : null}
          </div>
        ) : null}
      </article>
    );
  };

  const renderComposer = () => (
    <article className="card profile-block">
      <div className="profile-card-header">
        <div>
          <div className="profile-section-title">
            <Sparkles size={16} />
            Ilan Bestecisi
          </div>
          <div className="profile-section-meta">
            <span>Ilanini taslak olarak kaydedebilir ya da dogrudan yayina acabilirsin.</span>
          </div>
        </div>

        {!isComposerOpen ? (
          <button type="button" className="ghost-button profile-inline-button" onClick={beginCreate}>
            <Plus size={16} />
            Yeni Ilan
          </button>
        ) : null}
      </div>

      {isComposerOpen ? (
        <form className="profile-form profile-collapsible-form" onSubmit={submitPost}>
          <div className="profile-form-grid">
            <label className="profile-form-field">
              <span>Baslik</span>
              <input
                className="input-field"
                value={postForm.title}
                onChange={(event) =>
                  setPostForm((current) => ({ ...current, title: event.target.value }))
                }
                placeholder="Hackathon icin ekip arkadasi araniyor"
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
                placeholder="AI, Web, Mobile..."
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
              <span>Durum</span>
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
            </label>

            <label className="profile-form-field">
              <span>Takim boyutu</span>
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
              <span>Aranan uye sayisi</span>
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
              <span>Basvuru son tarihi</span>
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
              <span>Aciklama</span>
              <textarea
                className="input-field profile-textarea"
                value={postForm.description}
                onChange={(event) =>
                  setPostForm((current) => ({ ...current, description: event.target.value }))
                }
                placeholder="Projeyi, hedefini, aradigin katkiyi ve ekip beklentini yaz."
              />
            </label>
          </div>

          <div className="post-picker-grid">
            <div className="post-picker-card">
              <div className="post-picker-card-head">
                <div>
                  <div className="post-picker-card-title">
                    <Tag size={16} />
                    Teknoloji secimi
                  </div>
                  <p>Arama, kategori ve hizli paketlerle ekibini daha rahat kur.</p>
                </div>

                <span className="post-selector-count">{postForm.technologyIds.length} secili</span>
              </div>

              {renderSelectionPreview(
                selectedTechnologyOptions,
                'Henuz teknoloji secilmedi. Buyuk listelerde arama ve paket onerileriyle ilerle.',
                (option) => option.category
              )}

              <div className="post-picker-actions">
                <button
                  type="button"
                  className="ghost-button profile-inline-button"
                  onClick={openTechnologySelector}
                >
                  <FolderKanban size={16} />
                  {selectedTechnologyOptions.length ? 'Teknolojileri duzenle' : 'Teknoloji ekle'}
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
                    Bolum secimi
                  </div>
                  <p>Bolumleri tek ekranda arayip fakultelere gore daralt.</p>
                </div>

                <span className="post-selector-count">{postForm.departmentIds.length} secili</span>
              </div>

              {renderSelectionPreview(
                selectedDepartmentOptions,
                'Henuz bolum secilmedi. Fakulte filtresiyle daha hedefli gorunurluk kurabilirsin.',
                (option) => option.facultyName || option.code
              )}

              <div className="post-picker-actions">
                <button
                  type="button"
                  className="ghost-button profile-inline-button"
                  onClick={openDepartmentSelector}
                >
                  <Building2 size={16} />
                  {selectedDepartmentOptions.length ? 'Bolumleri duzenle' : 'Bolum sec'}
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

          <div className="profile-form-actions">
            <button type="submit" className="btn-primary post-submit-button" disabled={saving}>
              <Save size={16} />
              {saving
                ? 'Kaydediliyor...'
                : editingPostId
                  ? 'Ilani guncelle'
                  : 'Ilani kaydet'}
            </button>

            <button
              type="button"
              className="ghost-button profile-inline-button"
              onClick={resetComposer}
            >
              <X size={16} />
              Vazgec
            </button>
          </div>
        </form>
      ) : (
        <button type="button" className="profile-composer-collapsed" onClick={beginCreate}>
          <span className="profile-composer-collapsed-icon">
            <Plus size={18} />
          </span>
          <span className="profile-composer-collapsed-copy">
            <span className="profile-composer-collapsed-kicker">Yeni Kayit</span>
            <strong>Takim ilani ac</strong>
            <span>Taslak kaydet, acik ilani yayinla ve ekip arayisini buradan yonet.</span>
          </span>
          <span className="profile-composer-collapsed-action">Formu ac</span>
        </button>
      )}
    </article>
  );

  const renderMyPosts = () => (
    <section className="profile-grid profile-grid-single">
      {renderComposer()}

      <article className="card profile-block">
        <div className="profile-card-header">
          <div>
            <div className="profile-section-title">
              <Layers3 size={16} />
              Ilanlarim
            </div>
            <div className="profile-section-meta">
              <span>Taslaklari duzenleyebilir, acik ilanlarini yonetebilirsin.</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="empty-state">Ilanlar yukleniyor.</div>
        ) : myPosts.length ? (
          <div className="post-card-grid post-card-grid-single">
            {myPosts.map((post) => renderPostCard(post, true))}
          </div>
        ) : (
          <div className="empty-state">
            Henuz kendi ilanin yok. Ustteki besteciyi acip ilk ilani hazirlayabilirsin.
          </div>
        )}
      </article>
    </section>
  );

  const renderMyApplications = () => (
    <section className="profile-grid profile-grid-single">
      <article className="card profile-block">
        <div className="profile-card-header">
          <div>
            <div className="profile-section-title">
              <ClipboardList size={16} />
              Basvurularim
            </div>
            <div className="profile-section-meta">
              <span>Gonderdigin basvurularin durumunu ve acik ilan sonucunu buradan takip et.</span>
            </div>
          </div>
        </div>

        <div className="application-summary-grid">
          <article className="application-summary-card">
            <span>Toplam</span>
            <strong>{myApplications.length}</strong>
          </article>

          <article className="application-summary-card">
            <span>Bekleyen</span>
            <strong>{pendingMyApplicationCount}</strong>
          </article>

          <article className="application-summary-card">
            <span>Kabul</span>
            <strong>{acceptedMyApplicationCount}</strong>
          </article>
        </div>

        {loading ? (
          <div className="empty-state">Basvurular yukleniyor.</div>
        ) : myApplications.length ? (
          <div className="application-card-list">
            {myApplications.map((application) => {
              const applicationTone = getApplicationTone(application.status);
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
                      Ilan durumu: {application.postStatus}
                    </span>
                  </div>

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
                          : 'Basvuruyu geri cek'}
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
                          : 'Tekrar basvur'}
                      </button>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            Henuz herhangi bir ilana basvurmadin. Acik ilanlar sekmesinden ilgini ceken ilanlara
            basvurabilirsin.
          </div>
        )}
      </article>
    </section>
  );

  const renderOpenPosts = () => (
    <section className="profile-grid profile-grid-single">
      <article className="card profile-block">
        <div className="profile-card-header">
          <div>
            <div className="profile-section-title">
              <Search size={16} />
              Acik Ilanlar
            </div>
            <div className="profile-section-meta">
              <span>Sistemdeki acik ekip arayislarini filtreleyip inceleyebilirsin.</span>
            </div>
          </div>
        </div>

        <label className="post-search-shell post-search-shell-wide">
          <Search size={16} />
          <input
            className="input-field post-search-input"
            value={openQuery}
            onChange={(event) => setOpenQuery(event.target.value)}
            placeholder="Baslik, kategori, teknoloji veya bolum ara"
          />
        </label>

        {loading ? (
          <div className="empty-state">Acik ilanlar yukleniyor.</div>
        ) : filteredOpenPosts.length ? (
          <div className="post-card-grid">
            {filteredOpenPosts.map((post) => renderPostCard(post))}
          </div>
        ) : (
          <div className="empty-state">
            Bu filtreye uygun acik ilan bulunamadi.
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

      <main className="main-content">
        <header className="dashboard-header">
          <div>
            <p className="dashboard-date">Ogrenci Proje Ilanlari</p>
            <h1 className="dashboard-title">Ilanlar</h1>
            <p className="dashboard-subtitle">
              Kendi ekip arayislarini yonet, taslaklar olustur ve sistemde yayinlanan acik
              ogrenci proje ilanlarini tek akista takip et.
            </p>
          </div>

          <div className="dashboard-actions">
            <button
              className="ghost-button"
              type="button"
              onClick={() => loadPostsData(true)}
              disabled={refreshing}
            >
              <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
              {refreshing ? 'Yenileniyor' : 'Listeyi Yenile'}
            </button>

            <button className="ghost-button" type="button" onClick={beginCreate}>
              <Plus size={16} />
              Yeni Ilan
            </button>
          </div>
        </header>

        {actionError ? <div className="dashboard-alert">{actionError}</div> : null}
        {actionMessage ? <div className="dashboard-alert dashboard-alert-success">{actionMessage}</div> : null}

        <section className="posts-stats-grid">
          <article className="card posts-stat-card">
            <span className="posts-stat-label">Toplam Ilan</span>
            <strong className="posts-stat-value">{myPosts.length}</strong>
            <p className="posts-stat-copy">Olusturdugun tum taslak ve yayinlanmis ilanlar.</p>
          </article>

          <article className="card posts-stat-card">
            <span className="posts-stat-label">Taslaklar</span>
            <strong className="posts-stat-value">{myDraftCount}</strong>
            <p className="posts-stat-copy">Henuz anonim kullanicilara acilmamis ilanlar.</p>
          </article>

          <article className="card posts-stat-card">
            <span className="posts-stat-label">Acik Ilanlarim</span>
            <strong className="posts-stat-value">{myOpenCount}</strong>
            <p className="posts-stat-copy">Yayinda olan ve ekip arkadasi bekleyen ilanlarin.</p>
          </article>

          <article className="card posts-stat-card">
            <span className="posts-stat-label">Sistemde Acik</span>
            <strong className="posts-stat-value">{openPosts.length}</strong>
            <p className="posts-stat-copy">Tum ogrencilerin gorebildigi aktif ekip arayislari.</p>
          </article>
        </section>

        <section className="profile-tabs-shell">
          <div className="profile-tabs">
            <button
              type="button"
              className={`profile-tab ${activeTab === 'mine' ? 'active' : ''}`}
              onClick={() => {
                clearFeedback();
                setActiveTab('mine');
              }}
            >
              Ilanlarim
            </button>

            <button
              type="button"
              className={`profile-tab ${activeTab === 'open' ? 'active' : ''}`}
              onClick={() => {
                clearFeedback();
                setActiveTab('open');
              }}
            >
              Acik Ilanlar
            </button>

            <button
              type="button"
              className={`profile-tab ${activeTab === 'applications' ? 'active' : ''}`}
              onClick={() => {
                clearFeedback();
                setActiveTab('applications');
              }}
            >
              Basvurularim
            </button>
          </div>
        </section>

        {activeTab === 'mine'
          ? renderMyPosts()
          : activeTab === 'applications'
            ? renderMyApplications()
            : renderOpenPosts()}

        <section className="profile-footer-note">
          <div className="card profile-note-card">
            <div className="profile-section-title">
              <Sparkles size={16} />
              Gorunurluk Notu
            </div>
            <p>
              Draft ilanlar sadece sana gorunur. Ilani Open durumuna getirdiginde acik listeye
              duser ve herkes tarafindan goruntulenebilir hale gelir.
            </p>
          </div>
        </section>
      </main>

      {selectionModal === 'technology' ? renderTechnologyModal() : null}
      {selectionModal === 'department' ? renderDepartmentModal() : null}
      {applicationManagerPost ? renderApplicationManagerModal() : null}
    </div>
  );
}

export default StudentProjectPostsPage;
