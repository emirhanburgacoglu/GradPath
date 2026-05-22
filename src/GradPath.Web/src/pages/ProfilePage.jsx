import { useEffect, useState } from 'react';

import {
  Award,
  ChevronDown,
  ChevronUp,
  FileBadge2,
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
  Activity,
  FileText,
  Cpu,
} from 'lucide-react';
import AppHeader from '../components/AppHeader';
import AppFooter from '../components/AppFooter';
import api, { resolvePhotoUrl } from '../api';

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
        CategoryName: category?.CategoryName || category?.categoryName || 'Diğer',
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

function createEmptySkillForm() {
  return {
    technologyId: 0,
    technologyName: '',
    proficiencyLevel: 2,
  };
}

function createAcademicForm(profile) {
  return {
    cgpa: profile?.cgpa?.toString() || '',
    totalECTS: profile?.totalECTS?.toString() || '',
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

function normalizeSkillName(value) {
  const normalizedValue = (value || '')
    .trim()
    .toLowerCase()
    .replace(/\+/g, 'p')
    .replace(/[#.]/g, '')
    .replace(/[/_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  switch (normalizedValue) {
    case 'restful api':
      return 'rest api';
    case 'mssql':
    case 'ms sql':
      return 'sql server';
    case 'postgres':
      return 'postgresql';
    case 'js':
      return 'javascript';
    default:
      return normalizedValue;
  }
}

function buildAnalysisSkillCategoryMap(analysisCategories) {
  const analysisSkillCategoryMap = new Map();

  (analysisCategories || []).forEach((category) => {
    (category?.Skills || []).forEach((skillName) => {
      const normalizedSkill = normalizeSkillName(skillName);
      if (normalizedSkill) {
        analysisSkillCategoryMap.set(normalizedSkill, category.CategoryName || 'Diğer');
      }
    });
  });

  return analysisSkillCategoryMap;
}

function groupSkillRecordsByCategory(skillRecords, technologyOptions, analysisCategories) {
  const technologyOptionMap = new Map(
    (technologyOptions || []).map((option) => [option.id, option])
  );
  const analysisSkillCategoryMap = buildAnalysisSkillCategoryMap(analysisCategories);

  const groups = (skillRecords || []).reduce((accumulator, skill) => {
    const technologyOption = technologyOptionMap.get(skill.technologyId);
    const category =
      analysisSkillCategoryMap.get(normalizeSkillName(skill.technologyName)) ||
      analysisSkillCategoryMap.get(normalizeSkillName(technologyOption?.name)) ||
      mapTechnologyCategoryToDisplayCategory(technologyOption?.category);

    if (!accumulator[category]) {
      accumulator[category] = [];
    }

    accumulator[category].push(skill);
    return accumulator;
  }, {});

  return Object.entries(groups)
    .map(([categoryName, items]) => ({
      CategoryName: categoryName,
      Items: items.sort((left, right) =>
        (left.technologyName || '').localeCompare(right.technologyName || '', 'tr')
      ),
    }))
    .sort((left, right) => left.CategoryName.localeCompare(right.CategoryName, 'tr'));
}

function buildDisplaySkillGroups(skillRecords, analysisCategories, technologyOptions) {
  const normalizedSkillMap = new Map(
    (skillRecords || [])
      .filter((skill) => skill?.technologyName)
      .map((skill) => [normalizeSkillName(skill.technologyName), skill])
  );

  const usedTechnologyIds = new Set();
  const matchedGroups = (analysisCategories || [])
    .map((category) => {
      const items = (category?.Skills || [])
        .map((skillName) => normalizedSkillMap.get(normalizeSkillName(skillName)))
        .filter((skill) => skill && !usedTechnologyIds.has(skill.technologyId))
        .map((skill) => {
          usedTechnologyIds.add(skill.technologyId);
          return skill;
        });

      return {
        CategoryName: category?.CategoryName || 'Diger',
        Items: items,
      };
    })
    .filter((group) => group.Items.length > 0);

  const remainingSkills = (skillRecords || []).filter(
    (skill) => !usedTechnologyIds.has(skill.technologyId)
  );

  return [
    ...matchedGroups,
    ...groupSkillRecordsByCategory(remainingSkills, technologyOptions, analysisCategories),
  ];
}

function mapTechnologyCategoryToDisplayCategory(category) {
  const normalizedCategory = (category || '').trim().toLowerCase();

  if (normalizedCategory === 'language') {
    return 'Programming Languages';
  }

  if (['framework', 'orm', 'web', 'mobile'].includes(normalizedCategory)) {
    return 'Frameworks & Libraries';
  }

  if (['database', 'tool', 'hardware'].includes(normalizedCategory)) {
    return 'Tools & Databases';
  }

    return category || 'Diğer';
}

function buildTechnologyOptionsByDisplayCategory(technologyOptions, analysisCategories) {
  const analysisSkillCategoryMap = new Map();

  (analysisCategories || []).forEach((category) => {
    (category?.Skills || []).forEach((skillName) => {
      analysisSkillCategoryMap.set(normalizeSkillName(skillName), category.CategoryName || 'Diğer');
    });
  });

  return (technologyOptions || []).reduce((accumulator, option) => {
    const displayCategory =
      analysisSkillCategoryMap.get(normalizeSkillName(option.name)) ||
      mapTechnologyCategoryToDisplayCategory(option.category);

    if (!accumulator[displayCategory]) {
      accumulator[displayCategory] = [];
    }

    accumulator[displayCategory].push(option);
    return accumulator;
  }, {});
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
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [uploadingCv, setUploadingCv] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [educationItems, setEducationItems] = useState([]);
  const [experienceItems, setExperienceItems] = useState([]);
  const [projectItems, setProjectItems] = useState([]);
  const [domainSignalItems, setDomainSignalItems] = useState([]);
  const [skillItems, setSkillItems] = useState([]);
  const [draftSkillItems, setDraftSkillItems] = useState([]);
  const [technologyOptions, setTechnologyOptions] = useState([]);
  const [loadingNormalizedData, setLoadingNormalizedData] = useState(false);
  const [loadingSkills, setLoadingSkills] = useState(false);
  const [hasLoadedNormalizedData, setHasLoadedNormalizedData] = useState(false);
  const [hasLoadedSkills, setHasLoadedSkills] = useState(false);
  const [savingSection, setSavingSection] = useState('');
  const [deletingKey, setDeletingKey] = useState('');

  const [educationForm, setEducationForm] = useState(createEmptyEducationForm());
  const [editingEducationId, setEditingEducationId] = useState(null);
  const [isEducationComposerOpen, setIsEducationComposerOpen] = useState(false);
  const [experienceForm, setExperienceForm] = useState(createEmptyExperienceForm());
  const [editingExperienceId, setEditingExperienceId] = useState(null);
  const [isExperienceComposerOpen, setIsExperienceComposerOpen] = useState(false);
  const [projectForm, setProjectForm] = useState(createEmptyProjectForm());
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [isProjectComposerOpen, setIsProjectComposerOpen] = useState(false);
  const [domainSignalForm, setDomainSignalForm] = useState(createEmptyDomainSignalForm());
  const [editingDomainSignalId, setEditingDomainSignalId] = useState(null);
  const [isDomainSignalComposerOpen, setIsDomainSignalComposerOpen] = useState(false);
  const [skillForm, setSkillForm] = useState(createEmptySkillForm());
  const [editingSkillId, setEditingSkillId] = useState(null);
  const [isSkillComposerOpen, setIsSkillComposerOpen] = useState(false);
  const [openSkillCategory, setOpenSkillCategory] = useState(null);
  const [skillSearchQuery, setSkillSearchQuery] = useState('');
  const [academicForm, setAcademicForm] = useState(() => createAcademicForm(profile));

  const analysis = safeParseAnalysis(profile);
  const skillsByCategory = analysis?.SkillsByCategory || [];
  const groupedSkillItemsByCategory = buildDisplaySkillGroups(
    skillItems,
    skillsByCategory,
    technologyOptions
  );
  const displaySkillsByCategory = hasLoadedSkills
    ? groupedSkillItemsByCategory.map((group) => ({
        CategoryName: group.CategoryName,
        Skills: group.Items.map((item) => item.technologyName).filter(Boolean),
      }))
    : skillsByCategory;
  const missingDraftSkills = draftSkillItems.filter(
    (draftSkill) => !skillItems.some((skill) => skill.technologyId === draftSkill.technologyId)
  );
  const groupedDraftSkillsByCategory = buildDisplaySkillGroups(
    missingDraftSkills,
    skillsByCategory,
    technologyOptions
  );
  const groupedSkillItemsByCategoryMap = new Map(
    groupedSkillItemsByCategory.map((group) => [group.CategoryName, group.Items])
  );
  const groupedDraftSkillsByCategoryMap = new Map(
    groupedDraftSkillsByCategory.map((group) => [group.CategoryName, group.Items])
  );
  const technologyOptionsByDisplayCategory = buildTechnologyOptionsByDisplayCategory(
    technologyOptions,
    skillsByCategory
  );
  const skillAccordionCategories = [
    ...new Set([
      ...skillsByCategory.map((category) => category.CategoryName).filter(Boolean),
      ...groupedSkillItemsByCategory.map((group) => group.CategoryName).filter(Boolean),
      ...groupedDraftSkillsByCategory.map((group) => group.CategoryName).filter(Boolean),
      ...Object.keys(technologyOptionsByDisplayCategory),
    ]),
  ];
  const selectedTechnologyIds = new Set(
    skillItems
      .filter((skill) => skill.technologyId !== editingSkillId)
      .map((skill) => skill.technologyId)
  );

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
  const overviewExperienceCount = hasLoadedNormalizedData
    ? experienceItems.length
    : analysis?.Experiences?.length || 0;
  const overviewProjectCount = hasLoadedNormalizedData
    ? projectItems.length
    : analysis?.Projects?.length || 0;
  const displayedSkillCount = hasLoadedSkills
    ? skillItems.length
    : displaySkillsByCategory.reduce(
        (total, category) => total + (category?.Skills?.length || 0),
        0
      );
  const hasCvFile = Boolean(profile?.cvFileName);
  const hasCgpa = cgpa !== null && cgpa !== undefined && cgpa !== '';
  const hasTotalECTS = totalECTS !== null && totalECTS !== undefined && totalECTS !== '';
  const profileCoverageCount = [
    hasCvFile,
    displayedSkillCount > 0,
    overviewEducation.length > 0,
    overviewExperienceCount + overviewProjectCount > 0,
    overviewDomainSignals.length > 0,
  ].filter(Boolean).length;
  const profileCoveragePercent = Math.round((profileCoverageCount / 5) * 100);
  const profileRecordTotal =
    overviewEducation.length +
    overviewExperienceCount +
    overviewProjectCount +
    overviewDomainSignals.length;
  const overviewTopSkillGroups = [...displaySkillsByCategory]
    .sort((left, right) => (right?.Skills?.length || 0) - (left?.Skills?.length || 0))
    .slice(0, 3);

  const tabs = [
    {
      id: 'overview',
      label: 'Genel Bakış',
      description: 'Durum, eksikler ve sonraki adımlar',
      count: `${profileCoverageCount}/5`,
      icon: <Activity size={20} />
    },
    {
      id: 'background',
      label: 'Profil Kayıtları',
      description: 'Eğitim, deneyim, proje ve alanlar',
      count: overviewEducation.length + overviewExperienceCount + overviewProjectCount + overviewDomainSignals.length,
      icon: <FileText size={20} />
    },
    {
      id: 'skills',
      label: 'Yetkinlikler',
      description: 'Teknolojiler ve CV önerileri',
      count: displayedSkillCount,
      icon: <Cpu size={20} />
    },
  ];

  const clearFeedback = () => {
    setActionMessage('');
    setActionError('');
  };

  const resetEducationEditor = () => {
    setEditingEducationId(null);
    setEducationForm(createEmptyEducationForm());
    setIsEducationComposerOpen(false);
  };

  const resetExperienceEditor = () => {
    setEditingExperienceId(null);
    setExperienceForm(createEmptyExperienceForm());
    setIsExperienceComposerOpen(false);
  };

  const resetProjectEditor = () => {
    setEditingProjectId(null);
    setProjectForm(createEmptyProjectForm());
    setIsProjectComposerOpen(false);
  };

  const resetDomainSignalEditor = () => {
    setEditingDomainSignalId(null);
    setDomainSignalForm(createEmptyDomainSignalForm());
    setIsDomainSignalComposerOpen(false);
  };

  const resetSkillEditor = () => {
    setEditingSkillId(null);
    setSkillForm(createEmptySkillForm());
    setIsSkillComposerOpen(false);
    setSkillSearchQuery('');
  };

  const toggleSkillCategory = (categoryName) => {
    clearFeedback();

    if (openSkillCategory === categoryName) {
      resetSkillEditor();
      setOpenSkillCategory(null);
      return;
    }

    setEditingSkillId(null);
    setSkillForm(createEmptySkillForm());
    setIsSkillComposerOpen(false);
    setSkillSearchQuery('');
    setOpenSkillCategory(categoryName);
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

  const loadSkillsData = async () => {
    if (!profile) {
      setSkillItems([]);
      setDraftSkillItems([]);
      setTechnologyOptions([]);
      setHasLoadedSkills(false);
      return;
    }

    setLoadingSkills(true);

    try {
      const results = await Promise.allSettled([
        api.get('/student/skills'),
        api.get('/student/skills/draft'),
        api.get('/student/skills/options'),
      ]);

      setSkillItems(results[0].status === 'fulfilled' ? results[0].value.data || [] : []);
      setDraftSkillItems(results[1].status === 'fulfilled' ? results[1].value.data || [] : []);
      setTechnologyOptions(results[2].status === 'fulfilled' ? results[2].value.data || [] : []);
      setHasLoadedSkills(results[0].status === 'fulfilled');
    } finally {
      setLoadingSkills(false);
    }
  };

  useEffect(() => {
    loadNormalizedProfileData();
    loadSkillsData();
  }, [profile]);

  useEffect(() => {
    setAcademicForm(createAcademicForm(profile));
  }, [profile]);

  const handleRefreshClick = async () => {
    clearFeedback();
    await onRefresh();
    await Promise.allSettled([loadNormalizedProfileData(), loadSkillsData()]);
  };

  const handleUpload = async (type) => {
    const file = cvFile;

    if (!file) {
      setUploadMessage('Önce bir CV dosyası seç.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    setUploadingCv(true);

    setUploadMessage('');
    clearFeedback();

    try {
      await api.post('/student/upload-cv', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploadMessage('CV başarıyla yüklendi. Profil güncellendi; detay veriler arka planda yükleniyor.');
      setCvFile(null);

      await onRefresh();

      Promise.allSettled([loadNormalizedProfileData(), loadSkillsData()]).catch(() => {
        // Background refresh failures should not block the profile update flow.
      });
    } catch (uploadError) {
      setUploadMessage(
        getErrorMessage(uploadError, 'CV yüklenemedi. Dosya formatını ve oturumu kontrol et.')
      );
    } finally {
      setUploadingCv(false);
    }
  };

  const handleProfilePhotoUpload = async () => {
    const file = profilePhotoFile;

    if (!file) {
      setActionError('Önce cihazından bir profil fotoğrafı seç.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    setUploadingPhoto(true);
    setUploadMessage('');
    clearFeedback();

    try {
      await api.post('/student/upload-profile-photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setProfilePhotoFile(null);
      setActionMessage('Profil fotoğrafı güncellendi.');
      await onRefresh();
    } catch (uploadError) {
      setActionError(
        getErrorMessage(uploadError, 'Profil fotoğrafı yüklenemedi. JPG, PNG veya WEBP dosyası deneyebilirsin.')
      );
    } finally {
      setUploadingPhoto(false);
    }
  };

  const submitAcademicProfile = async (event) => {
    event.preventDefault();
    clearFeedback();
    setSavingSection('academic');

    const parsedCgpa =
      academicForm.cgpa.trim() === '' ? null : Number.parseFloat(academicForm.cgpa);
    const parsedTotalECTS =
      academicForm.totalECTS.trim() === '' ? null : Number.parseInt(academicForm.totalECTS, 10);

    if (academicForm.cgpa.trim() !== '' && Number.isNaN(parsedCgpa)) {
      setActionError('CGPA icin gecerli bir sayi gir.');
      setSavingSection('');
      return;
    }

    if (academicForm.totalECTS.trim() !== '' && Number.isNaN(parsedTotalECTS)) {
      setActionError('AKTS icin gecerli bir sayi gir.');
      setSavingSection('');
      return;
    }

    try {
      await api.put('/student/me', {
        cgpa: parsedCgpa,
        totalECTS: parsedTotalECTS,
      });

      setActionMessage('Akademik bilgiler güncellendi.');
      await onRefresh();
    } catch (submitError) {
      setActionError(
        getErrorMessage(submitError, 'Akademik bilgiler güncellenemedi.')
      );
    } finally {
      setSavingSection('');
    }
  };

  const beginSkillCreate = (categoryName) => {
    clearFeedback();
    setEditingSkillId(null);
    setSkillForm(createEmptySkillForm());
    setIsSkillComposerOpen(true);
    setSkillSearchQuery('');
    setOpenSkillCategory(categoryName);
  };

  const beginSkillEdit = (skill, categoryName) => {
    clearFeedback();
    setEditingSkillId(skill.technologyId);
    setIsSkillComposerOpen(true);
    setOpenSkillCategory(categoryName);
    setSkillForm({
      technologyId: skill.technologyId,
      technologyName: skill.technologyName || '',
      proficiencyLevel: skill.proficiencyLevel || 2,
    });
    setSkillSearchQuery(skill.technologyName || '');
  };

  const submitSkill = async (event) => {
    event.preventDefault();
    clearFeedback();
    setSavingSection('skill');

    if (!skillForm.technologyId) {
      setActionError('Lütfen listeden bir teknoloji seç.');
      setSavingSection('');
      return;
    }

    const payload = {
      technologyId: skillForm.technologyId,
      technologyName: skillForm.technologyName,
      proficiencyLevel: Number(skillForm.proficiencyLevel) || 2,
    };

    try {
      await api.post('/student/skills', payload);
      setActionMessage(editingSkillId ? 'Yetkinlik güncellendi.' : 'Yetkinlik eklendi.');
      resetSkillEditor();
      await loadSkillsData();
    } catch (submitError) {
      setActionError(getErrorMessage(submitError, 'Yetkinlik kaydedilemedi.'));
    } finally {
      setSavingSection('');
    }
  };

  const removeSkill = async (technologyId) => {
    if (!window.confirm('Bu yetkinligi silmek istiyor musun?')) {
      return;
    }

    clearFeedback();
    setDeletingKey(`skill-${technologyId}`);

    try {
      await api.delete(`/student/skills/${technologyId}`);
      if (editingSkillId === technologyId) {
        resetSkillEditor();
      }

      setActionMessage('Yetkinlik silindi.');
      await loadSkillsData();
    } catch (removeError) {
      setActionError(getErrorMessage(removeError, 'Yetkinlik silinemedi.'));
    } finally {
      setDeletingKey('');
    }
  };

  const addDraftSkill = async (skill) => {
    clearFeedback();
    setSavingSection(`draft-skill-${skill.technologyId}`);

    try {
      await api.post('/student/skills', {
        technologyId: skill.technologyId,
        technologyName: skill.technologyName,
        proficiencyLevel: skill.proficiencyLevel || 2,
      });

      setActionMessage(`${skill.technologyName} profiline eklendi.`);
      await loadSkillsData();
    } catch (submitError) {
      setActionError(getErrorMessage(submitError, 'Taslak yetkinlik eklenemedi.'));
    } finally {
      setSavingSection('');
    }
  };

  const addAllDraftSkills = async () => {
    if (missingDraftSkills.length === 0) {
      return;
    }

    clearFeedback();
    setSavingSection('all-draft-skills');

    try {
      await api.put('/student/skills', [
        ...skillItems.map((skill) => ({
          technologyId: skill.technologyId,
          technologyName: skill.technologyName,
          proficiencyLevel: skill.proficiencyLevel,
        })),
        ...missingDraftSkills.map((skill) => ({
          technologyId: skill.technologyId,
          technologyName: skill.technologyName,
          proficiencyLevel: skill.proficiencyLevel || 2,
        })),
      ]);

      setActionMessage('CV taslağındaki eksik yetkinlikler profile eklendi.');
      await loadSkillsData();
    } catch (submitError) {
      setActionError(getErrorMessage(submitError, 'Taslak yetkinlikler eklenemedi.'));
    } finally {
      setSavingSection('');
    }
  };

  const beginEducationCreate = () => {
    clearFeedback();
    resetEducationEditor();
    setIsEducationComposerOpen(true);
  };

  const beginEducationEdit = (item) => {
    clearFeedback();
    setIsEducationComposerOpen(true);
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
        setActionMessage('Eğitim kaydı güncellendi.');
      } else {
        await api.post('/student/educations', payload);
        setActionMessage('Eğitim kaydı eklendi.');
      }

      resetEducationEditor();
      await loadNormalizedProfileData();
    } catch (submitError) {
      setActionError(getErrorMessage(submitError, 'Eğitim kaydı kaydedilemedi.'));
    } finally {
      setSavingSection('');
    }
  };

  const removeEducation = async (educationId) => {
    if (!window.confirm('Bu eğitim kaydını silmek istiyor musun?')) {
      return;
    }

    clearFeedback();
    setDeletingKey(`education-${educationId}`);

    try {
      await api.delete(`/student/educations/${educationId}`);
      if (editingEducationId === educationId) {
        resetEducationEditor();
      }

      setActionMessage('Eğitim kaydı silindi.');
      await loadNormalizedProfileData();
    } catch (removeError) {
      setActionError(getErrorMessage(removeError, 'Eğitim kaydı silinemedi.'));
    } finally {
      setDeletingKey('');
    }
  };

  const beginExperienceCreate = () => {
    clearFeedback();
    resetExperienceEditor();
    setIsExperienceComposerOpen(true);
  };

  const beginExperienceEdit = (item) => {
    clearFeedback();
    setIsExperienceComposerOpen(true);
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
        setActionMessage('Deneyim kaydı güncellendi.');
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
    if (!window.confirm('Bu deneyim kaydını silmek istiyor musun?')) {
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
    setIsProjectComposerOpen(true);
  };

  const beginProjectEdit = (item) => {
    clearFeedback();
    setIsProjectComposerOpen(true);
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
        setActionMessage('Proje kaydı güncellendi.');
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
    if (!window.confirm('Bu proje kaydını silmek istiyor musun?')) {
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
    setIsDomainSignalComposerOpen(true);
  };

  const beginDomainSignalEdit = (item) => {
    clearFeedback();
    setIsDomainSignalComposerOpen(true);
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
        setActionMessage('Alan sinyali güncellendi.');
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

  const renderDocumentsBlockLegacy = (sectionId) => (
    <section id={sectionId} className="profile-grid profile-grid-single">
      <article className="card profile-block documents-stage-card">
        <div className="profile-card-header documents-stage-header">
          <div>
            <div className="profile-section-title">
              <Upload size={16} />
              Belgeler ve Akademik Bilgiler
            </div>
          </div>
        </div>

        <div className="documents-grid">
          <section className="documents-panel">
            <div className="documents-panel-head">
              <div className="profile-section-title">
                <Award size={16} />
                Akademik Bilgiler
              </div>
            </div>

            <form className="profile-form documents-form" onSubmit={submitAcademicProfile}>
              <div className="profile-form-grid">
                <label className="profile-form-field">
                  <span>CGPA</span>
                  <input
                    type="number"
                    min="0"
                    max="4"
                    step="0.01"
                    className="input-field"
                    placeholder="Örnek: 3.26"
                    value={academicForm.cgpa}
                    onChange={(event) =>
                      setAcademicForm((current) => ({ ...current, cgpa: event.target.value }))
                    }
                  />
                </label>

                <label className="profile-form-field">
                  <span>Toplam AKTS</span>
                  <input
                    type="number"
                    min="0"
                    max="300"
                    step="1"
                    className="input-field"
                    placeholder="Örnek: 189"
                    value={academicForm.totalECTS}
                    onChange={(event) =>
                      setAcademicForm((current) => ({
                        ...current,
                        totalECTS: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>

              <div className="profile-form-actions">
                <button
                  type="submit"
                  className="btn-primary profile-submit-button documents-submit-button"
                  disabled={savingSection === 'academic'}
                >
                  <Save size={16} />
                  {savingSection === 'academic' ? 'Kaydediliyor...' : 'Akademik bilgileri kaydet'}
                </button>
              </div>
            </form>
          </section>

          <section className="documents-panel">
            <div className="documents-panel-head">
              <div className="profile-section-title">
                <Pencil size={16} />
                Profil Fotoğrafı
              </div>
            </div>

            <div className="upload-panel upload-panel-photo">
              <div className="upload-current-file">
                <span>Aktif fotoğraf</span>
                <strong className="upload-current-file-name">
                  {profile?.profilePhotoUrl ? 'Profil fotoğrafı ayarlı' : 'Henüz fotoğraf yüklenmedi'}
                </strong>
              </div>

              <div className="profile-photo-upload-preview">
                {profile?.profilePhotoUrl ? (
                  <img
                    src={resolvePhotoUrl(profile.profilePhotoUrl)}
                    alt={profile?.fullName || 'Öğrenci profil fotoğrafı'}
                    className="profile-photo-upload-image"
                  />
                ) : (
                  <div className="profile-photo-upload-fallback">{initials}</div>
                )}
              </div>

              <label className="upload-picker">
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  onChange={(event) => setProfilePhotoFile(event.target.files?.[0] || null)}
                />
                <span className="upload-picker-button">Fotoğraf seç</span>
                <span className={`upload-picker-name ${profilePhotoFile ? 'selected' : ''}`}>
                  {profilePhotoFile?.name || 'Henüz görsel seçilmedi'}
                </span>
              </label>

              <button
                type="button"
                className="btn-primary upload-button"
                onClick={handleProfilePhotoUpload}
                disabled={uploadingPhoto}
              >
                {uploadingPhoto ? 'Fotoğraf yükleniyor...' : 'Fotoğrafı kaydet'}
              </button>
            </div>
          </section>

          <section className="documents-panel">
            <div className="documents-panel-head">
              <div className="profile-section-title">
                <Upload size={16} />
                CV Yükleme
              </div>
            </div>

            <div className="upload-panel">
              <div className="upload-current-file">
                <span>Mevcut dosya</span>
                <strong className="upload-current-file-name">
                  {profile?.cvFileName ? 'CV yüklendi' : 'Henüz CV yüklenmemiş'}
                </strong>
              </div>

              <label className="upload-picker">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(event) => setCvFile(event.target.files?.[0] || null)}
                />
                <span className="upload-picker-button">Dosya seç</span>
                <span className={`upload-picker-name ${cvFile ? 'selected' : ''}`}>
                  {cvFile?.name || 'Henüz dosya seçilmedi'}
                </span>
              </label>

              <button
                type="button"
                className="btn-primary upload-button"
                onClick={handleUpload}
                disabled={uploadingCv}
              >
                {uploadingCv ? 'CV yükleniyor...' : 'CV yükle'}
              </button>
            </div>
          </section>
        </div>

        {uploadMessage ? <div className="dashboard-alert upload-alert">{uploadMessage}</div> : null}
      </article>
    </section>
  );

  const renderDocumentsBlock = (sectionId) => (
    <section id={sectionId} className="profile-grid profile-grid-single">
      <article className="card profile-block documents-stage-card">
        <div className="profile-card-header documents-stage-header">
          <div>
            <div className="profile-section-title">
              <Upload size={16} />
              Belgeler ve Akademik Bilgiler
            </div>
          </div>
        </div>

        <div className="documents-shell">
          <section className="documents-hero">
            <div className="documents-hero-identity">
              <div className="documents-hero-avatar">
                {profile?.profilePhotoUrl ? (
                  <img
                    src={resolvePhotoUrl(profile.profilePhotoUrl)}
                    alt={profile?.fullName || 'Öğrenci profil fotoğrafı'}
                    className="documents-hero-avatar-image"
                  />
                ) : (
                  <div className="documents-hero-avatar-fallback">{initials}</div>
                )}
              </div>

            </div>

            <div className="documents-status-grid">
              <div className="documents-status-card">
                <span>Akademik</span>
                <strong>{hasCgpa || hasTotalECTS ? 'Hazır' : 'Eksik'}</strong>
              </div>

              <div className="documents-status-card">
                <span>Fotoğraf</span>
                <strong>{profile?.profilePhotoUrl ? 'Hazır' : 'Eksik'}</strong>
              </div>

              <div className="documents-status-card">
                <span>CV</span>
                <strong>{profile?.cvFileName ? 'Hazır' : 'Eksik'}</strong>
              </div>
            </div>
          </section>

          <div className="documents-workspace">
            <section className="documents-main-panel">
              <div className="documents-panel-head">
                <div className="profile-section-title">
                  <Award size={16} />
                  Akademik Bilgiler
                </div>
              </div>

              <form className="profile-form documents-form" onSubmit={submitAcademicProfile}>
                <div className="profile-form-grid">
                  <label className="profile-form-field">
                    <span>CGPA</span>
                    <input
                      type="number"
                      min="0"
                      max="4"
                      step="0.01"
                      className="input-field"
                      placeholder="Örnek: 3.26"
                      value={academicForm.cgpa}
                      onChange={(event) =>
                        setAcademicForm((current) => ({ ...current, cgpa: event.target.value }))
                      }
                    />
                  </label>

                  <label className="profile-form-field">
                    <span>Toplam AKTS</span>
                    <input
                      type="number"
                      min="0"
                      max="300"
                      step="1"
                      className="input-field"
                      placeholder="Örnek: 189"
                      value={academicForm.totalECTS}
                      onChange={(event) =>
                        setAcademicForm((current) => ({
                          ...current,
                          totalECTS: event.target.value,
                        }))
                      }
                    />
                  </label>
                </div>

                <div className="profile-form-actions">
                  <button
                    type="submit"
                    className="btn-primary profile-submit-button documents-submit-button"
                    disabled={savingSection === 'academic'}
                  >
                    <Save size={16} />
                    {savingSection === 'academic' ? 'Kaydediliyor...' : 'Akademik bilgileri kaydet'}
                  </button>
                </div>
              </form>
            </section>

            <section className="documents-side-panel">
              <article className="documents-mini-panel">
                <div className="documents-panel-head">
                  <div className="profile-section-title">
                    <Pencil size={16} />
                    Profil Fotoğrafı
                  </div>
                </div>

                <div className="upload-panel upload-panel-photo">
                  <div className="profile-photo-upload-preview">
                    {profile?.profilePhotoUrl ? (
                      <img
                        src={resolvePhotoUrl(profile.profilePhotoUrl)}
                        alt={profile?.fullName || 'Öğrenci profil fotoğrafı'}
                        className="profile-photo-upload-image"
                      />
                    ) : (
                      <div className="profile-photo-upload-fallback">{initials}</div>
                    )}
                  </div>

                  <label className="upload-picker">
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                      onChange={(event) => setProfilePhotoFile(event.target.files?.[0] || null)}
                    />
                    <span className="upload-picker-button">Fotoğraf seç</span>
                    <span className={`upload-picker-name ${profilePhotoFile ? 'selected' : ''}`}>
                      {profilePhotoFile?.name || 'Dosya seçilmedi'}
                    </span>
                  </label>

                  <button
                    type="button"
                    className="btn-primary upload-button"
                    onClick={handleProfilePhotoUpload}
                    disabled={uploadingPhoto}
                  >
                    {uploadingPhoto ? 'Yükleniyor...' : 'Kaydet'}
                  </button>
                </div>
              </article>

              <article className="documents-mini-panel">
                <div className="documents-panel-head">
                  <div className="profile-section-title">
                    <FileBadge2 size={16} />
                    CV Yükleme
                  </div>
                </div>

                <div className="upload-panel">
                  <div className="upload-current-file">
                    <span>Mevcut dosya</span>
                    <strong className="upload-current-file-name">
                      {profile?.cvFileName ? 'CV yüklendi' : 'CV yok'}
                    </strong>
                  </div>

                  <label className="upload-picker">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(event) => setCvFile(event.target.files?.[0] || null)}
                    />
                    <span className="upload-picker-button">Dosya seç</span>
                    <span className={`upload-picker-name ${cvFile ? 'selected' : ''}`}>
                      {cvFile?.name || 'Dosya seçilmedi'}
                    </span>
                  </label>

                  <button
                    type="button"
                    className="btn-primary upload-button"
                    onClick={handleUpload}
                    disabled={uploadingCv}
                  >
                    {uploadingCv ? 'Yükleniyor...' : 'CV yükle'}
                  </button>
                </div>
              </article>
            </section>
          </div>
        </div>

        {uploadMessage ? <div className="dashboard-alert upload-alert">{uploadMessage}</div> : null}
      </article>
    </section>
  );

  const renderDocumentsBlockRestored = (sectionId) => (
    <section id={sectionId} className="profile-grid profile-grid-single">
      <article className="card profile-block documents-stage-card">
        <div className="profile-card-header documents-stage-header">
          <div>
            <div className="profile-section-title">
              <Upload size={16} />
              Belgeler ve Akademik Bilgiler
            </div>
          </div>
        </div>

        <div className="docs-cards-grid">
          {/* CV Yükleme Kartı */}
          <div className="docs-card">
            <div className="docs-card-icon docs-card-icon-cv">
              <FileBadge2 size={22} />
            </div>
            <div className="docs-card-header">
              <h3 className="docs-card-title">CV Yükleme</h3>
              <span className={`docs-card-badge ${hasCvFile ? 'docs-card-badge-ok' : 'docs-card-badge-missing'}`}>
                {hasCvFile ? 'Yüklendi' : 'Eksik'}
              </span>
            </div>
            <p className="docs-card-desc">
              {hasCvFile
                ? 'CV dosyan yüklü. Güncellemek istersen yeni bir dosya seçebilirsin.'
                : 'Profilini tamamlamak için PDF formatında CV yükle.'}
            </p>
            <div className="docs-card-body">
              <label className="docs-file-picker">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(event) => setCvFile(event.target.files?.[0] || null)}
                />
                <span className="docs-file-picker-btn">Dosya seç</span>
                <span className={`docs-file-picker-name ${cvFile ? 'active' : ''}`}>
                  {cvFile?.name || 'PDF dosyası seç'}
                </span>
              </label>
            </div>
            <button
              type="button"
              className="docs-card-action"
              onClick={handleUpload}
              disabled={uploadingCv}
            >
              <Upload size={15} />
              {uploadingCv ? 'Yükleniyor...' : 'CV Yükle'}
            </button>
          </div>

          {/* Profil Fotoğrafı Kartı */}
          <div className="docs-card">
            <div className="docs-card-icon docs-card-icon-photo">
              <Pencil size={22} />
            </div>
            <div className="docs-card-header">
              <h3 className="docs-card-title">Profil Fotoğrafı</h3>
              <span className={`docs-card-badge ${profile?.profilePhotoUrl ? 'docs-card-badge-ok' : 'docs-card-badge-missing'}`}>
                {profile?.profilePhotoUrl ? 'Ayarlı' : 'Eksik'}
              </span>
            </div>

            <div className="docs-photo-preview">
              {profile?.profilePhotoUrl ? (
                <img
                  src={resolvePhotoUrl(profile.profilePhotoUrl)}
                  alt={profile?.fullName || 'Profil fotoğrafı'}
                  className="docs-photo-img"
                />
              ) : (
                <div className="docs-photo-fallback">{initials}</div>
              )}
            </div>

            <div className="docs-card-body">
              <label className="docs-file-picker">
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  onChange={(event) => setProfilePhotoFile(event.target.files?.[0] || null)}
                />
                <span className="docs-file-picker-btn">Fotoğraf seç</span>
                <span className={`docs-file-picker-name ${profilePhotoFile ? 'active' : ''}`}>
                  {profilePhotoFile?.name || 'JPG, PNG veya WEBP'}
                </span>
              </label>
            </div>
            <button
              type="button"
              className="docs-card-action"
              onClick={handleProfilePhotoUpload}
              disabled={uploadingPhoto}
            >
              <Save size={15} />
              {uploadingPhoto ? 'Yükleniyor...' : 'Kaydet'}
            </button>
          </div>

          {/* Akademik Bilgiler Kartı */}
          <div className="docs-card">
            <div className="docs-card-icon docs-card-icon-academic">
              <Award size={22} />
            </div>
            <div className="docs-card-header">
              <h3 className="docs-card-title">Akademik Bilgiler</h3>
              <span className={`docs-card-badge ${hasCgpa || hasTotalECTS ? 'docs-card-badge-ok' : 'docs-card-badge-missing'}`}>
                {hasCgpa || hasTotalECTS ? 'Hazır' : 'Eksik'}
              </span>
            </div>
            <p className="docs-card-desc">
              {hasCgpa || hasTotalECTS
                ? 'Akademik bilgilerin kayıtlı. Değişiklik yapmak istersen güncelleyebilirsin.'
                : 'GPA ve AKTS bilgilerini girerek profilini güçlendir.'}
            </p>

            <form className="docs-academic-form" onSubmit={submitAcademicProfile}>
              <div className="docs-academic-fields">
                <label className="docs-field">
                  <span className="docs-field-label">GPA</span>
                  <input
                    type="number"
                    min="0"
                    max="4"
                    step="0.01"
                    className="docs-field-input"
                    placeholder="3.26"
                    value={academicForm.cgpa}
                    onChange={(event) =>
                      setAcademicForm((current) => ({ ...current, cgpa: event.target.value }))
                    }
                  />
                </label>
                <label className="docs-field">
                  <span className="docs-field-label">AKTS</span>
                  <input
                    type="number"
                    min="0"
                    max="300"
                    step="1"
                    className="docs-field-input"
                    placeholder="189"
                    value={academicForm.totalECTS}
                    onChange={(event) =>
                      setAcademicForm((current) => ({
                        ...current,
                        totalECTS: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>

              <button
                type="submit"
                className="docs-card-action"
                disabled={savingSection === 'academic'}
              >
                <Save size={15} />
                {savingSection === 'academic' ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </form>
          </div>
        </div>

        {uploadMessage ? <div className="dashboard-alert upload-alert">{uploadMessage}</div> : null}
      </article>
    </section>
  );

  const renderOverview = () => (
    <>
      <section className="profile-overview-grid">
        <article className="card profile-identity-card overview-hero-card overview-hero-card-expanded">
          <div className="overview-hero-main">
            <div className="overview-hero-identity">
              <div className="profile-panel-top">
                <div className="profile-avatar">
                  {profile?.profilePhotoUrl ? (
                    <img
                      src={resolvePhotoUrl(profile.profilePhotoUrl)}
                      alt={profile?.fullName || 'Öğrenci profil fotoğrafı'}
                      className="profile-avatar-image"
                    />
                  ) : (
                    initials
                  )}
                </div>
                <div>
                  <div className="profile-panel-name">
                    {profile?.fullName || 'Profil hazırlanıyor'}
                  </div>
                  <div className="profile-panel-mail">
                    {profile?.email || 'E-posta bilgisi yok'}
                  </div>
                </div>
              </div>

            </div>

            <div className="overview-hero-coverage">
              <div className="profile-coverage-card">
                <div className="profile-coverage-copy">
                  <span>Profil doluluk</span>
                  <strong>%{profileCoveragePercent}</strong>
                </div>
                <div className="profile-coverage-track" aria-hidden="true">
                  <span
                    className="profile-coverage-fill"
                    style={{ width: `${profileCoveragePercent}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="overview-hero-summary-shell">
              <div className="overview-hero-summary">
                <span>Profil özeti</span>
                <p>
                  {summaryText ||
                    'CV, akademik bilgiler ve kayıtlı deneyimlerin bu alanda kısa bir toplu görünümü yer alır.'}
                </p>
              </div>
            </div>

            <div className="overview-hero-status-shell">
              <div className="overview-hero-status-grid">
                <div className="overview-hero-status-item">
                  <span>CV durumu</span>
                  <strong>{hasCvFile ? 'Hazır' : 'Eksik'}</strong>
                </div>
                <div className="overview-hero-status-item">
                  <span>Akademik bilgi</span>
                  <strong>{hasCgpa && hasTotalECTS ? 'Tamam' : 'Eksik'}</strong>
                </div>
                <div className="overview-hero-status-item">
                  <span>CV önerileri</span>
                  <strong>
                    {missingDraftSkills.length ? `${missingDraftSkills.length} bekliyor` : 'Temiz'}
                  </strong>
                </div>
              </div>
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
      </section>

      {renderDocumentsBlockRestored('overview-documents')}

      <section className="profile-grid">
        <article className="card profile-block overview-summary-card">
          <div className="overview-summary-top">
            <div className="profile-section-title">
              <Wrench size={16} />
              Yetkinlik Özetin
            </div>
            <button
              type="button"
              className="ghost-button profile-inline-button"
              onClick={() => setActiveTab('skills')}
            >
              Yetkinlikleri aç
            </button>
          </div>

          <div className="profile-section-meta">
            <span>{displayedSkillCount} kayıtlı teknoloji</span>
            <span>{overviewTopSkillGroups.length} öne çıkan kategori</span>
          </div>

          {overviewTopSkillGroups.length ? (
            <div className="overview-skill-group-list">
              {overviewTopSkillGroups.map((group) => (
                <div key={group.CategoryName} className="overview-skill-group">
                  <div className="overview-skill-group-head">
                    <strong>{group.CategoryName}</strong>
                    <span>{group.Skills?.length || 0} teknoloji</span>
                  </div>

                  <div className="project-tags">
                    {(group.Skills || []).slice(0, 4).map((skill) => (
                      <span key={`${group.CategoryName}-${skill}`} className="tech-tag matched">
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

        <article className="card profile-block overview-summary-card">
          <div className="overview-summary-top">
            <div className="profile-section-title">
              <FileBadge2 size={16} />
              Profil Kayıt Özetin
            </div>
            <button
              type="button"
              className="ghost-button profile-inline-button"
              onClick={() => setActiveTab('background')}
            >
              Kayıtları aç
            </button>
          </div>

          <div className="profile-section-meta">
            <span>{profileRecordTotal} toplam kayıt</span>
            <span>Detaylar Profil Kayıtları sekmesinde</span>
          </div>

          <div className="overview-summary-metrics">
            <div className="overview-summary-metric">
              <span>Eğitim</span>
              <strong>{overviewEducation.length}</strong>
            </div>

            <div className="overview-summary-metric">
              <span>Deneyim</span>
              <strong>{overviewExperienceCount}</strong>
            </div>

            <div className="overview-summary-metric">
              <span>Proje</span>
              <strong>{overviewProjectCount}</strong>
            </div>

            <div className="overview-summary-metric">
              <span>Alan</span>
              <strong>{overviewDomainSignals.length}</strong>
            </div>
          </div>

          <div className="overview-summary-note">
            {profileRecordTotal
              ? 'Kayıtlarını güncel tutman hem görünürlüğünü hem de proje uyumunu güçlendirir.'
              : 'Henüz detay kaydın yok. Profil Kayıtları sekmesinden ilk eğitim, deneyim veya proje girişini yapabilirsin.'}
          </div>
        </article>
      </section>
    </>
  );

  const renderBackground = () => (
    <div className="profile-group-stack">
      <section className="profile-grid profile-grid-single">
        <article className="card profile-note-card">
          <div className="profile-section-title">
            <FileBadge2 size={16} />
            Profil Kayıtları
          </div>
          <p>
            Eğitim, deneyim, proje ve alan sinyallerini ayrı ayrı sekmeler yerine tek akış içinde
            yönetebilirsin. Bu düzen daha az geçişle daha hızlı güncelleme yapman için tasarlandı.
          </p>
        </article>
      </section>

      {renderEducation()}
      {renderExperiences()}
      {renderProjects()}
      {renderDomainSignals()}
    </div>
  );

  const renderSkills = () => (
    <section className="profile-grid profile-grid-single">
      <article className="card profile-block">
        <div className="profile-card-header">
          <div>
            <div className="profile-section-title">
              <Wrench size={16} />
              Yetkinlikler
            </div>

            <div className="profile-section-meta">
              <span>{skillItems.length} kayıtlı yetkinlik</span>
              <span>{missingDraftSkills.length} CV önerisi</span>
            </div>
          </div>

          {missingDraftSkills.length ? (
            <button
              type="button"
              className="ghost-button profile-inline-button"
              onClick={addAllDraftSkills}
              disabled={savingSection === 'all-draft-skills'}
            >
              <Plus size={16} />
              {savingSection === 'all-draft-skills' ? 'Ekleniyor...' : 'Tüm CV önerilerini ekle'}
            </button>
          ) : null}
        </div>

        <div className="skills-summary-bar">
          <div className="skills-summary-copy">
            <strong>Yetkinliklerini kategori bazlı yönet</strong>
            <p>Bir kategori aç, kayıtlı teknolojileri düzenle ve CV önerilerini tek yerden ekle.</p>
          </div>

          <div className="skills-summary-stats">
            <span className="skills-summary-chip">
              <strong>{skillAccordionCategories.length}</strong> kategori
            </span>
            <span className="skills-summary-chip">
              <strong>{skillItems.length}</strong> kayıtlı
            </span>
            <span className="skills-summary-chip">
              <strong>{missingDraftSkills.length}</strong> önerilen
            </span>
          </div>
        </div>

        {loadingSkills ? (
          <div className="empty-state">Yetkinlikler yükleniyor.</div>
        ) : skillAccordionCategories.length ? (
          <div className="skill-category-stack">
            {skillAccordionCategories.map((categoryName) => {
              const categorySkills = groupedSkillItemsByCategoryMap.get(categoryName) || [];
              const categoryDraftSkills = groupedDraftSkillsByCategoryMap.get(categoryName) || [];
              const categoryOptions = [...(technologyOptionsByDisplayCategory[categoryName] || [])].sort((left, right) =>
                (left.name || '').localeCompare(right.name || '', 'tr')
              );
              const availableCategoryOptions = categoryOptions.filter(
                (option) => option.id === editingSkillId || !selectedTechnologyIds.has(option.id)
              );
              const filteredAvailableCategoryOptions = availableCategoryOptions.filter((option) =>
                !skillSearchQuery.trim()
                  ? true
                  : (option.name || '')
                      .toLocaleLowerCase('tr-TR')
                      .includes(skillSearchQuery.trim().toLocaleLowerCase('tr-TR'))
              );
              const isOpen = openSkillCategory === categoryName;
              const isComposerVisible = isOpen && isSkillComposerOpen;

              return (
                <div
                  key={categoryName}
                  className={`skill-category-card skill-accordion-card ${isOpen ? 'open' : ''}`}
                >
                  <button
                    type="button"
                    className={`skill-accordion-toggle ${isOpen ? 'active' : ''}`}
                    onClick={() => toggleSkillCategory(categoryName)}
                  >
                    <div className="skill-accordion-copy">
                      <div className="skill-category-name skill-accordion-title">{categoryName}</div>
                      <div className="skill-accordion-metrics">
                        <span className="skill-metric-chip">
                          <strong>{categorySkills.length}</strong> kayıtlı
                        </span>
                        <span className="skill-metric-chip">
                          <strong>{categoryDraftSkills.length}</strong> önerilen
                        </span>
                        <span className="skill-metric-chip">
                          <strong>{availableCategoryOptions.length}</strong> eklenebilir
                        </span>
                      </div>
                    </div>

                    <div className="skill-accordion-trailing">
                      <span className="skill-accordion-icon">
                        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </span>
                    </div>
                  </button>

                  {isOpen ? (
                    <div className="skill-accordion-body">
                      <div className="skill-accordion-actions">
                        <div className="skill-accordion-description">
                          {categorySkills.length
                            ? 'Mevcut kayıtları düzenleyebilir, alttan yeni teknoloji ekleyebilirsin.'
                            : 'Bu kategori boş. İlk teknolojiyi ekleyerek başlayabilirsin.'}
                        </div>

                        {!isComposerVisible ? (
                          <button
                            type="button"
                            className="ghost-button profile-inline-button"
                            onClick={() => beginSkillCreate(categoryName)}
                            disabled={!availableCategoryOptions.length}
                          >
                            <Plus size={16} />
                            {availableCategoryOptions.length ? 'Yeni yetkinlik ekle' : 'Tümü eklenmiş'}
                          </button>
                        ) : null}
                      </div>

                      {isComposerVisible ? (
                        <form className="profile-form profile-skill-composer" onSubmit={submitSkill}>
                          <div className="profile-composer-header">
                            <div>
                              <div className="profile-composer-title">
                                {editingSkillId
                                  ? skillForm.technologyName || `${categoryName} düzenle`
                                  : `${categoryName} için yeni yetkinlik`}
                              </div>
                              <div className="profile-composer-subtitle">
                                {editingSkillId
                                  ? 'Seviyeyi güncelleyebilir veya bu kaydı kaldırabilirsin.'
                                  : `Yalnızca ${categoryName} kategorisine ait teknolojiler listeleniyor.`}
                              </div>
                            </div>

                            {editingSkillId ? (
                              <button
                                type="button"
                                className="ghost-button profile-inline-button profile-inline-button-danger"
                                onClick={() => removeSkill(editingSkillId)}
                                disabled={deletingKey === `skill-${editingSkillId}`}
                              >
                                <Trash2 size={14} />
                                {deletingKey === `skill-${editingSkillId}` ? 'Siliniyor...' : 'Kaydı sil'}
                              </button>
                            ) : null}
                          </div>

                          <div className="profile-form-grid profile-skill-form-grid">
                            <label className="profile-form-field">
                              <span>{editingSkillId ? 'Teknoloji' : 'Teknoloji ara'}</span>
                              <input
                                className="input-field"
                                value={editingSkillId ? skillForm.technologyName : skillSearchQuery}
                                onChange={(event) =>
                                  editingSkillId
                                    ? undefined
                                    : (() => {
                                        const nextValue = event.target.value;
                                        setSkillSearchQuery(nextValue);
                                        setSkillForm((current) => ({
                                          ...current,
                                          technologyId:
                                            current.technologyName === nextValue
                                              ? current.technologyId
                                              : 0,
                                          technologyName: nextValue,
                                        }));
                                      })()
                                }
                                disabled={Boolean(editingSkillId)}
                                placeholder="Örnek: React, Angular, Vue"
                              />
                            </label>

                            <label className="profile-form-field">
                              <span>Seviye</span>
                              <select
                                className="input-field"
                                value={skillForm.proficiencyLevel}
                                onChange={(event) =>
                                  setSkillForm((current) => ({
                                    ...current,
                                    proficiencyLevel: Number(event.target.value),
                                  }))
                                }
                              >
                                <option value={1}>Başlangıç</option>
                                <option value={2}>Orta</option>
                                <option value={3}>İleri</option>
                              </select>
                            </label>
                          </div>

                          {!editingSkillId ? (
                            <div className="skill-picker-shell">
                              <div className="skill-picker-head">
                                <span>Kategorideki uygun teknolojiler</span>
                                <strong>
                                  {skillForm.technologyId
                                    ? `${skillForm.technologyName} seçili`
                                    : `${filteredAvailableCategoryOptions.length} sonuç`}
                                </strong>
                              </div>

                              {filteredAvailableCategoryOptions.length ? (
                                <div className="skill-picker-list">
                                  {filteredAvailableCategoryOptions.slice(0, 12).map((option) => (
                                    <button
                                      key={option.id}
                                      type="button"
                                      className={`skill-picker-chip ${
                                        skillForm.technologyId === option.id ? 'selected' : ''
                                      }`}
                                      onClick={() => {
                                        setSkillSearchQuery(option.name || '');
                                        setSkillForm((current) => ({
                                          ...current,
                                          technologyId: option.id,
                                          technologyName: option.name || '',
                                        }));
                                      }}
                                    >
                                      {option.name}
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <div className="profile-form-hint">
                                  Bu aramaya uygun teknoloji bulunamadı.
                                </div>
                              )}
                            </div>
                          ) : null}

                          {!loadingSkills && !categoryOptions.length ? (
                            <div className="profile-form-hint">
                              Bu kategori için veritabanında teknoloji seçeneği görünmüyor.
                            </div>
                          ) : null}

                          {editingSkillId ? (
                            <div className="profile-form-hint">
                              Teknoloji adını değiştirmek yerine mevcut kaydı silip aynı kategoriden yeni bir kayıt
                              eklemen daha güvenli.
                            </div>
                          ) : null}

                          <div className="profile-form-actions">
                            <button
                              type="submit"
                              className="btn-primary profile-submit-button"
                              disabled={savingSection === 'skill'}
                            >
                              <Save size={16} />
                              {savingSection === 'skill'
                                ? 'Kaydediliyor...'
                                : editingSkillId
                                  ? 'Seviyeyi güncelle'
                                  : 'Yetkinlik ekle'}
                            </button>

                            <button
                              type="button"
                              className="ghost-button profile-inline-button"
                              onClick={resetSkillEditor}
                            >
                              <X size={16} />
                              Vazgeç
                            </button>
                          </div>
                        </form>
                      ) : null}

                      <div className="skill-category-subsection skill-category-subsection-primary">
                        <div className="skill-category-head">
                          <div className="skill-category-name">Mevcut teknolojiler</div>
                          <div className="skill-category-count">{categorySkills.length} adet</div>
                        </div>

                        {categorySkills.length ? (
                          <div className="skill-row-list">
                            {categorySkills.map((skill) => {
                              const isDeleting = deletingKey === `skill-${skill.technologyId}`;

                              return (
                                <div
                                  key={skill.technologyId}
                                  className={`skill-row-button ${
                                    editingSkillId === skill.technologyId && isSkillComposerOpen ? 'selected' : ''
                                  }`}
                                >
                                <div className="skill-row-main">
                                  <div className="skill-row-copy">
                                    <strong>{skill.technologyName || 'Teknoloji bilgisi yok'}</strong>
                                    <span>Kayıtlı teknoloji</span>
                                  </div>

                                  <span className={`skill-level-pill level-${skill.proficiencyLevel}`}>
                                    {getProficiencyLabel(skill.proficiencyLevel)}
                                  </span>
                                </div>

                                <div className="skill-row-action">
                                  <button
                                    type="button"
                                    className="ghost-button skill-row-inline-button"
                                    onClick={() => beginSkillEdit(skill, categoryName)}
                                  >
                                    Düzenle
                                  </button>

                                  <button
                                    type="button"
                                    className="ghost-button skill-row-inline-button skill-row-inline-button-danger"
                                    onClick={() => removeSkill(skill.technologyId)}
                                    disabled={isDeleting}
                                  >
                                    {isDeleting ? 'Siliniyor...' : 'Sil'}
                                  </button>
                                </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="empty-state skill-category-empty">
                            Bu kategoride henüz kayıtlı yetkinlik yok.
                          </div>
                        )}
                      </div>

                      {categoryDraftSkills.length ? (
                        <div className="skill-category-subsection">
                          <div className="skill-category-head">
                            <div className="skill-category-name">CV'den önerilenler</div>
                            <div className="skill-category-count">{categoryDraftSkills.length} önerilen</div>
                          </div>

                          <div className="skill-row-list skill-row-list-suggestions">
                            {categoryDraftSkills.map((skill) => (
                              <button
                                key={`draft-${categoryName}-${skill.technologyId}`}
                                type="button"
                                className="skill-row-button skill-row-button-suggestion"
                                onClick={() => addDraftSkill(skill)}
                                disabled={savingSection === `draft-skill-${skill.technologyId}`}
                              >
                                <div className="skill-row-main">
                                  <div className="skill-row-copy">
                                    <strong>{skill.technologyName}</strong>
                                    <span>CV önerisi</span>
                                  </div>

                                  <span className={`skill-level-pill level-${skill.proficiencyLevel}`}>
                                    {getProficiencyLabel(skill.proficiencyLevel || 2)}
                                  </span>
                                </div>

                                <div className="skill-row-action">
                                  <span className="skill-add-chip">
                                    {savingSection === `draft-skill-${skill.technologyId}` ? 'Ekleniyor' : 'Ekle'}
                                  </span>
                                  <Plus size={14} />
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">Bu profilde henüz yetkinlik kategorisi görünmüyor.</div>
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
            Eğitim
          </div>
        </div>

        {isEducationComposerOpen ? (
          <form className="profile-form profile-collapsible-form" onSubmit={submitEducation}>
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
                <span>Bölüm</span>
                <input
                  className="input-field"
                  value={educationForm.department}
                  onChange={(event) =>
                    setEducationForm((current) => ({ ...current, department: event.target.value }))
                  }
                  placeholder="Bölüm"
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
                <span>Başlangıç</span>
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
                    ? 'Eğitimi güncelle'
                    : 'Eğitim ekle'}
              </button>

              <button
                type="button"
                className="ghost-button profile-inline-button"
                onClick={resetEducationEditor}
              >
                <X size={16} />
                Vazgeç
              </button>
            </div>
          </form>
        ) : (
          <button type="button" className="profile-composer-collapsed" onClick={beginEducationCreate}>
            <span className="profile-composer-collapsed-icon">
              <Plus size={18} />
            </span>
            <span className="profile-composer-collapsed-copy">
              <span className="profile-composer-collapsed-kicker">Yeni Kayıt</span>
              <strong>Eğitim kaydı ekle</strong>
              <span>Okul, bölüm, derece ve tarih bilgilerini hızlıca ekle.</span>
            </span>
            <span className="profile-composer-collapsed-action">
              Formu ac
              <ChevronDown size={16} />
            </span>
          </button>
        )}

        {loadingNormalizedData ? (
          <div className="empty-state">Eğitim verileri yükleniyor.</div>
        ) : educationItems.length ? (
          <div className="profile-list">
            {educationItems.map((item) => (
              <div key={item.id} className="profile-list-item">
                <div className="profile-item-top">
                  <div>
                    <strong>{item.department || item.degree || 'Eğitim kaydı'}</strong>
                    <span>{item.schoolName || 'Okul bilgisi yok'}</span>
                  </div>

                  <div className="profile-item-actions">
                    <button
                      type="button"
                      className="ghost-button profile-inline-button"
                      onClick={() => beginEducationEdit(item)}
                    >
                      <Pencil size={14} />
                      Düzenle
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
          <div className="empty-state">Henüz eğitim kaydı yok.</div>
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
        </div>

        {isExperienceComposerOpen ? (
          <form className="profile-form profile-collapsible-form" onSubmit={submitExperience}>
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
                <span>Başlangıç</span>
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
                <span>Açıklama</span>
                <textarea
                  className="input-field profile-textarea"
                  value={experienceForm.description}
                  onChange={(event) =>
                    setExperienceForm((current) => ({ ...current, description: event.target.value }))
                  }
                  placeholder="Bu deneyimde neler yaptın?"
                />
              </label>
            </div>

            <div className="profile-form-actions">
              <button type="submit" className="btn-primary profile-submit-button" disabled={savingSection === 'experience'}>
                <Save size={16} />
                {savingSection === 'experience'
                  ? 'Kaydediliyor...'
                  : editingExperienceId
                    ? 'Deneyimi güncelle'
                    : 'Deneyim ekle'}
              </button>

              <button
                type="button"
                className="ghost-button profile-inline-button"
                onClick={resetExperienceEditor}
              >
                <X size={16} />
                Vazgeç
              </button>
            </div>
          </form>
        ) : (
          <button type="button" className="profile-composer-collapsed" onClick={beginExperienceCreate}>
            <span className="profile-composer-collapsed-icon">
              <Plus size={18} />
            </span>
            <span className="profile-composer-collapsed-copy">
              <span className="profile-composer-collapsed-kicker">Yeni Kayıt</span>
              <strong>Deneyim kaydı ekle</strong>
              <span>Kurum, rol, teknolojiler ve kısa açıklamayı tek panelden ekle.</span>
            </span>
            <span className="profile-composer-collapsed-action">
              Formu ac
              <ChevronDown size={16} />
            </span>
          </button>
        )}

        {loadingNormalizedData ? (
          <div className="empty-state">Deneyim verileri yükleniyor.</div>
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
                      Düzenle
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
          <div className="empty-state">Henüz deneyim kaydı yok.</div>
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
        </div>

        {isProjectComposerOpen ? (
          <form className="profile-form profile-collapsible-form" onSubmit={submitProject}>
            <div className="profile-form-grid">
              <label className="profile-form-field">
                <span>Proje adı</span>
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
                <span>Takım projesi mi?</span>
                <div className="profile-checkbox-wrap">
                  <input
                    type="checkbox"
                    checked={projectForm.isTeamProject}
                    onChange={(event) =>
                      setProjectForm((current) => ({ ...current, isTeamProject: event.target.checked }))
                    }
                  />
                  <span>Evet, bu kayıt bir takım projesi</span>
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
                <span>Açıklama</span>
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
                    ? 'Projeyi güncelle'
                    : 'Proje ekle'}
              </button>

              <button
                type="button"
                className="ghost-button profile-inline-button"
                onClick={resetProjectEditor}
              >
                <X size={16} />
                Vazgeç
              </button>
            </div>
          </form>
        ) : (
          <button type="button" className="profile-composer-collapsed" onClick={beginProjectCreate}>
            <span className="profile-composer-collapsed-icon">
              <Plus size={18} />
            </span>
            <span className="profile-composer-collapsed-copy">
              <span className="profile-composer-collapsed-kicker">Yeni Kayıt</span>
              <strong>Proje kaydı ekle</strong>
              <span>Rol, alan, teknoloji ve açıklama bilgileriyle yeni bir proje tanımla.</span>
            </span>
            <span className="profile-composer-collapsed-action">
              Formu ac
              <ChevronDown size={16} />
            </span>
          </button>
        )}

        {loadingNormalizedData ? (
          <div className="empty-state">Proje verileri yükleniyor.</div>
        ) : projectItems.length ? (
          <div className="profile-list">
            {projectItems.map((item) => (
              <div key={item.id} className="profile-list-item">
                <div className="profile-item-top">
                  <div>
                    <strong>{item.name || 'Proje adı yok'}</strong>
                    <span>{item.domain || 'Alan bilgisi yok'}</span>
                  </div>

                  <div className="profile-item-actions">
                    <button
                      type="button"
                      className="ghost-button profile-inline-button"
                      onClick={() => beginProjectEdit(item)}
                    >
                      <Pencil size={14} />
                      Düzenle
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
                <p>{item.isTeamProject ? 'Takım projesi' : 'Bireysel proje'}</p>

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
          <div className="empty-state">Henüz proje kaydı yok.</div>
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
        </div>

        {isDomainSignalComposerOpen ? (
          <form className="profile-form profile-collapsible-form" onSubmit={submitDomainSignal}>
            <div className="profile-form-grid">
              <label className="profile-form-field profile-form-field-full">
                <span>Alan adı</span>
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
                    ? 'Alanı güncelle'
                    : 'Alan ekle'}
              </button>

              <button
                type="button"
                className="ghost-button profile-inline-button"
                onClick={resetDomainSignalEditor}
              >
                <X size={16} />
                Vazgeç
              </button>
            </div>
          </form>
        ) : (
          <button type="button" className="profile-composer-collapsed" onClick={beginDomainSignalCreate}>
            <span className="profile-composer-collapsed-icon">
              <Plus size={18} />
            </span>
            <span className="profile-composer-collapsed-copy">
              <span className="profile-composer-collapsed-kicker">Yeni Kayıt</span>
              <strong>Alan sinyali ekle</strong>
              <span>Odaklandığın alanları profilinde görünür hale getirmek için yeni sinyal ekle.</span>
            </span>
            <span className="profile-composer-collapsed-action">
              Formu ac
              <ChevronDown size={16} />
            </span>
          </button>
        )}

        {loadingNormalizedData ? (
          <div className="empty-state">Alan sinyalleri yükleniyor.</div>
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
                      Düzenle
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
          <div className="empty-state">Henüz alan sinyali yok.</div>
        )}
      </article>
    </section>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'background':
        return renderBackground();
      case 'skills':
        return renderSkills();
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

      <main className="main-content profile-page">
        <header className="dashboard-header">
          <div>
            <p className="dashboard-date">Öğrenci Profili</p>
            <h1 className="dashboard-title">Profilim</h1>
            <p className="dashboard-subtitle">
              Bilgileri daha sade bölümlerde topladık. Önce genel durumu gör, sonra yetkinlik,
              kayıt ve belge alanlarını ihtiyacına göre ilerlet.
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
                className={`profile-tab profile-tab-detailed ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <div className="profile-tab-copy">
                  <strong>{tab.label}</strong>
                  <small>{tab.description}</small>
                </div>
                <div className="profile-tab-count">{tab.count}</div>
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
              Bu akışta önce eksik görünen alanları tamamlayıp sonra proje eşleşmelerine geri
              dönmek daha rahat bir kullanım sunar. Arayüzü aynı mantıkla diğer ekranlarda da
              sadelestirmeye devam edebiliriz.
            </p>
          </div>
        </section>
      </main>

      <AppFooter currentView={currentView} onViewChange={onViewChange} />
    </div>
  );
}

export default ProfilePage;
