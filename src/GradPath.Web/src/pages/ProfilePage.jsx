import { useEffect, useState } from 'react';

import {
  Award,
  ChevronDown,
  ChevronUp,
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

function createEmptySkillForm() {
  return {
    technologyId: 0,
    technologyName: '',
    proficiencyLevel: 2,
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
      return 'Ileri';
    case 2:
      return 'Orta';
    default:
      return 'Baslangic';
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
        analysisSkillCategoryMap.set(normalizedSkill, category.CategoryName || 'Diger');
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

  return category || 'Diger';
}

function buildTechnologyOptionsByDisplayCategory(technologyOptions, analysisCategories) {
  const analysisSkillCategoryMap = new Map();

  (analysisCategories || []).forEach((category) => {
    (category?.Skills || []).forEach((skillName) => {
      analysisSkillCategoryMap.set(normalizeSkillName(skillName), category.CategoryName || 'Diger');
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

  const handleRefreshClick = async () => {
    clearFeedback();
    await onRefresh();
    await Promise.all([loadNormalizedProfileData(), loadSkillsData()]);
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
      await Promise.all([loadNormalizedProfileData(), loadSkillsData()]);
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

  const beginSkillCreate = (categoryName) => {
    clearFeedback();
    setEditingSkillId(null);
    setSkillForm(createEmptySkillForm());
    setIsSkillComposerOpen(true);
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
  };

  const submitSkill = async (event) => {
    event.preventDefault();
    clearFeedback();
    setSavingSection('skill');

    if (!skillForm.technologyId) {
      setActionError('Lutfen listeden bir teknoloji sec.');
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
      setActionMessage(editingSkillId ? 'Yetkinlik guncellendi.' : 'Yetkinlik eklendi.');
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

      setActionMessage('CV taslagindaki eksik yetkinlikler profile eklendi.');
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

          {displaySkillsByCategory.length ? (
            <div className="skill-category-stack">
              {displaySkillsByCategory.map((category) => (
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
        <div className="profile-card-header">
          <div>
            <div className="profile-section-title">
              <Wrench size={16} />
              Yetkinlikler
            </div>

            <div className="profile-section-meta">
              <span>{skillItems.length} kayitli yetkinlik</span>
              <span>{missingDraftSkills.length} CV onerisi</span>
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
              {savingSection === 'all-draft-skills' ? 'Ekleniyor...' : 'Tum CV onerilerini ekle'}
            </button>
          ) : null}
        </div>

        <div className="skill-stage-banner">
          <div className="skill-stage-copy">
            <span className="skill-stage-kicker">Kategori Bazli Yonetim</span>
            <strong>Yetkinliklerini daha temiz ve kontrollu yonet</strong>
            <p>
              Bir kategori ac, altindaki mevcut kayitlari incele ve sadece o kategoriye ait teknolojileri secerek yeni
              yetkinlik ekle.
            </p>
          </div>

          <div className="skill-stage-stats">
            <div className="skill-stage-stat">
              <span>Kategori</span>
              <strong>{skillAccordionCategories.length}</strong>
            </div>
            <div className="skill-stage-stat">
              <span>Kayitli</span>
              <strong>{skillItems.length}</strong>
            </div>
            <div className="skill-stage-stat">
              <span>CV Onerisi</span>
              <strong>{missingDraftSkills.length}</strong>
            </div>
          </div>
        </div>

        {loadingSkills ? (
          <div className="empty-state">Yetkinlikler yukleniyor.</div>
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
                      <span className="skill-accordion-eyebrow">Kategori</span>
                      <div className="skill-category-name">{categoryName}</div>
                      <div className="skill-accordion-metrics">
                        <span className="skill-metric-chip">{categorySkills.length} kayitli</span>
                        <span className="skill-metric-chip">{categoryDraftSkills.length} CV onerisi</span>
                        <span className="skill-metric-chip">{availableCategoryOptions.length} eklenebilir</span>
                      </div>
                    </div>

                    <div className="skill-accordion-trailing">
                      <span className="skill-accordion-state">{isOpen ? 'Acik' : 'Gor'}</span>
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
                            ? 'Kartlardan birine tiklayarak seviyeyi guncelleyebilirsin.'
                            : 'Bu kategori henuz bos. Asagidan yeni teknoloji ekleyebilirsin.'}
                        </div>

                        {!isComposerVisible ? (
                          <button
                            type="button"
                            className="ghost-button profile-inline-button"
                            onClick={() => beginSkillCreate(categoryName)}
                            disabled={!availableCategoryOptions.length}
                          >
                            <Plus size={16} />
                            {availableCategoryOptions.length ? 'Bu kategoriden ekle' : 'Tumu eklenmis'}
                          </button>
                        ) : null}
                      </div>

                      {isComposerVisible ? (
                        <form className="profile-form profile-skill-composer" onSubmit={submitSkill}>
                          <div className="profile-composer-header">
                            <div>
                              <div className="profile-composer-title">
                                {editingSkillId
                                  ? skillForm.technologyName || `${categoryName} duzenle`
                                  : `${categoryName} icin yeni yetkinlik`}
                              </div>
                              <div className="profile-composer-subtitle">
                                {editingSkillId
                                  ? 'Seviyeyi guncelleyebilir veya bu kaydi kaldirabilirsin.'
                                  : `Yalnizca ${categoryName} kategorisine ait teknolojiler listeleniyor.`}
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
                                {deletingKey === `skill-${editingSkillId}` ? 'Siliniyor...' : 'Kaydi sil'}
                              </button>
                            ) : null}
                          </div>

                          <div className="profile-form-grid profile-skill-form-grid">
                            <label className="profile-form-field">
                              <span>Teknoloji</span>
                              <select
                                className="input-field"
                                value={skillForm.technologyId}
                                onChange={(event) =>
                                  setSkillForm((current) => {
                                    const selectedTechnologyId = Number(event.target.value);
                                    const selectedOption = categoryOptions.find(
                                      (option) => option.id === selectedTechnologyId
                                    );

                                    return {
                                      ...current,
                                      technologyId: selectedTechnologyId,
                                      technologyName: selectedOption?.name || '',
                                    };
                                  })
                                }
                                disabled={Boolean(editingSkillId)}
                              >
                                <option value={0}>Bu kategoriden teknoloji sec</option>
                                {categoryOptions.map((option) => (
                                  <option
                                    key={option.id}
                                    value={option.id}
                                    disabled={!editingSkillId && selectedTechnologyIds.has(option.id)}
                                  >
                                    {option.name}
                                  </option>
                                ))}
                              </select>
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
                                <option value={1}>Baslangic</option>
                                <option value={2}>Orta</option>
                                <option value={3}>Ileri</option>
                              </select>
                            </label>
                          </div>

                          {!loadingSkills && !categoryOptions.length ? (
                            <div className="profile-form-hint">
                              Bu kategori icin veritabaninda teknoloji secenegi gorunmuyor.
                            </div>
                          ) : null}

                          {editingSkillId ? (
                            <div className="profile-form-hint">
                              Teknoloji adini degistirmek yerine mevcut kaydi silip ayni kategoriden yeni bir kayit
                              eklemen daha guvenli.
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
                                  ? 'Seviyeyi guncelle'
                                  : 'Yetkinlik ekle'}
                            </button>

                            <button
                              type="button"
                              className="ghost-button profile-inline-button"
                              onClick={resetSkillEditor}
                            >
                              <X size={16} />
                              Vazgec
                            </button>
                          </div>
                        </form>
                      ) : null}

                      <div className="skill-category-subsection skill-category-subsection-primary">
                        <div className="skill-category-head">
                          <div className="skill-category-name">Kayitli Yetkinlikler</div>
                          <div className="skill-category-count">{categorySkills.length} adet</div>
                        </div>

                        {categorySkills.length ? (
                          <div className="skill-card-grid">
                            {categorySkills.map((skill) => (
                              <button
                                key={skill.technologyId}
                                type="button"
                                className={`skill-mini-card skill-mini-card-interactive ${
                                  editingSkillId === skill.technologyId && isSkillComposerOpen ? 'selected' : ''
                                }`}
                                onClick={() => beginSkillEdit(skill, categoryName)}
                              >
                                <div className="skill-mini-top">
                                  <div className="skill-mini-copy">
                                    <strong>{skill.technologyName || 'Teknoloji bilgisi yok'}</strong>
                                    <span>Kayitli yetkinlik</span>
                                  </div>
                                </div>

                                <div className="skill-mini-footer">
                                  <span className={`skill-level-pill level-${skill.proficiencyLevel}`}>
                                    {getProficiencyLabel(skill.proficiencyLevel)}
                                  </span>
                                  <span className="skill-mini-hint">Duzenlemek icin tikla</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="empty-state skill-category-empty">
                            Bu kategoride henuz kayitli yetkinlik yok.
                          </div>
                        )}
                      </div>

                      {categoryDraftSkills.length ? (
                        <div className="skill-category-subsection">
                          <div className="skill-category-head">
                            <div className="skill-category-name">CV Taslak Onerileri</div>
                            <div className="skill-category-count">{categoryDraftSkills.length} onerilen</div>
                          </div>

                          <div className="skill-suggestion-grid">
                            {categoryDraftSkills.map((skill) => (
                              <button
                                key={`draft-${categoryName}-${skill.technologyId}`}
                                type="button"
                                className="skill-suggestion-chip"
                                onClick={() => addDraftSkill(skill)}
                                disabled={savingSection === `draft-skill-${skill.technologyId}`}
                              >
                                <span className="skill-suggestion-name">{skill.technologyName}</span>
                                <span className="skill-suggestion-level">
                                  {getProficiencyLabel(skill.proficiencyLevel || 2)}
                                </span>
                                <span className="skill-suggestion-action">
                                  <Plus size={14} />
                                  {savingSection === `draft-skill-${skill.technologyId}` ? 'Ekleniyor' : 'Ekle'}
                                </span>
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
          <div className="empty-state">Bu profilde henuz yetkinlik kategorisi gorunmuyor.</div>
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

              <button
                type="button"
                className="ghost-button profile-inline-button"
                onClick={resetEducationEditor}
              >
                <X size={16} />
                Vazgec
              </button>
            </div>
          </form>
        ) : (
          <button type="button" className="profile-composer-collapsed" onClick={beginEducationCreate}>
            <span className="profile-composer-collapsed-icon">
              <Plus size={18} />
            </span>
            <span className="profile-composer-collapsed-copy">
              <span className="profile-composer-collapsed-kicker">Yeni Kayit</span>
              <strong>Egitim kaydi ekle</strong>
              <span>Okul, bolum, derece ve tarih bilgilerini hizlica ekle.</span>
            </span>
            <span className="profile-composer-collapsed-action">
              Formu ac
              <ChevronDown size={16} />
            </span>
          </button>
        )}

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

              <button
                type="button"
                className="ghost-button profile-inline-button"
                onClick={resetExperienceEditor}
              >
                <X size={16} />
                Vazgec
              </button>
            </div>
          </form>
        ) : (
          <button type="button" className="profile-composer-collapsed" onClick={beginExperienceCreate}>
            <span className="profile-composer-collapsed-icon">
              <Plus size={18} />
            </span>
            <span className="profile-composer-collapsed-copy">
              <span className="profile-composer-collapsed-kicker">Yeni Kayit</span>
              <strong>Deneyim kaydi ekle</strong>
              <span>Kurum, rol, teknolojiler ve kisa aciklamayi tek panelden ekle.</span>
            </span>
            <span className="profile-composer-collapsed-action">
              Formu ac
              <ChevronDown size={16} />
            </span>
          </button>
        )}

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
        </div>

        {isProjectComposerOpen ? (
          <form className="profile-form profile-collapsible-form" onSubmit={submitProject}>
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

              <button
                type="button"
                className="ghost-button profile-inline-button"
                onClick={resetProjectEditor}
              >
                <X size={16} />
                Vazgec
              </button>
            </div>
          </form>
        ) : (
          <button type="button" className="profile-composer-collapsed" onClick={beginProjectCreate}>
            <span className="profile-composer-collapsed-icon">
              <Plus size={18} />
            </span>
            <span className="profile-composer-collapsed-copy">
              <span className="profile-composer-collapsed-kicker">Yeni Kayit</span>
              <strong>Proje kaydi ekle</strong>
              <span>Rol, alan, teknoloji ve aciklama bilgileriyle yeni bir proje tanimla.</span>
            </span>
            <span className="profile-composer-collapsed-action">
              Formu ac
              <ChevronDown size={16} />
            </span>
          </button>
        )}

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
        </div>

        {isDomainSignalComposerOpen ? (
          <form className="profile-form profile-collapsible-form" onSubmit={submitDomainSignal}>
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

              <button
                type="button"
                className="ghost-button profile-inline-button"
                onClick={resetDomainSignalEditor}
              >
                <X size={16} />
                Vazgec
              </button>
            </div>
          </form>
        ) : (
          <button type="button" className="profile-composer-collapsed" onClick={beginDomainSignalCreate}>
            <span className="profile-composer-collapsed-icon">
              <Plus size={18} />
            </span>
            <span className="profile-composer-collapsed-copy">
              <span className="profile-composer-collapsed-kicker">Yeni Kayit</span>
              <strong>Alan sinyali ekle</strong>
              <span>Odaklandigin alanlari profilinde gorunur hale getirmek icin yeni sinyal ekle.</span>
            </span>
            <span className="profile-composer-collapsed-action">
              Formu ac
              <ChevronDown size={16} />
            </span>
          </button>
        )}

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
