export const projectTypeOptions = [
  'Hackathon',
  'Competition',
  'Startup',
  'CourseProject',
  'Research',
  'OpenSource',
];

export const statusOptions = ['Draft', 'Open', 'Closed', 'Filled'];
export const allTechnologyCategoriesLabel = 'Tüm Kategoriler';
export const allDepartmentFacultiesLabel = 'Tüm Fakülteler';

const sharedTechnologyPresets = [
  {
    key: 'web-stack',
    label: 'Web Stack',
    description: 'Arayüz, API ve veri katmanını hızla kur.',
    names: ['React', 'REST API', 'PostgreSQL'],
  },
  {
    key: 'backend-stack',
    label: 'Backend Temel',
    description: 'Servis, ORM ve veritabanı omurgası.',
    names: ['ASP.NET Core', 'Entity Framework', 'PostgreSQL'],
  },
];

const technologyPresetCatalog = {
  Hackathon: [
    {
      key: 'hackathon-mvp',
      label: 'Hızlı MVP',
      description: 'Demo, sunum ve servis akışını aynı anda kur.',
      names: ['React', 'REST API', 'PostgreSQL'],
    },
    {
      key: 'hackathon-ai',
      label: 'AI Prototip',
      description: 'Model, veri ve analiz çekirdeği.',
      names: ['Python', 'Machine Learning', 'Scikit-learn'],
    },
  ],
  Competition: [
    {
      key: 'competition-ai',
      label: 'Yarışma AI',
      description: 'Veri ve model odaklı hızlı kadro.',
      names: ['Python', 'Machine Learning', 'Scikit-learn'],
    },
    {
      key: 'competition-cv',
      label: 'Görüntü İşleme',
      description: 'Kamera veya algı tabanlı takımlar için.',
      names: ['Python', 'OpenCV', 'Raspberry Pi'],
    },
  ],
  Startup: [
    {
      key: 'startup-web',
      label: 'Ürün Çekirdeği',
      description: 'Web ürününü hızla yayına çıkar.',
      names: ['React', 'REST API', 'PostgreSQL'],
    },
    {
      key: 'startup-mobile',
      label: 'Mobil MVP',
      description: 'Mobil arayüz ve servis katmanı.',
      names: ['Flutter', 'REST API', 'PostgreSQL'],
    },
  ],
  CourseProject: [
    {
      key: 'course-web',
      label: 'Ders Projesi Web',
      description: 'Temel arayüz ve backend iskeleti.',
      names: ['HTML', 'CSS', 'JavaScript', 'REST API'],
    },
    {
      key: 'course-backend',
      label: 'Ders Projesi Backend',
      description: 'Sunucu ve veri katmanı için güvenli başlangıç.',
      names: ['ASP.NET Core', 'Entity Framework', 'PostgreSQL'],
    },
  ],
  Research: [
    {
      key: 'research-ai',
      label: 'Araştırma AI',
      description: 'Analiz, modelleme ve deney seti.',
      names: ['Python', 'Machine Learning', 'Scikit-learn'],
    },
    {
      key: 'research-platform',
      label: 'Araştırma Platformu',
      description: 'API ve veri odaklı araştırma akışı.',
      names: ['REST API', 'PostgreSQL', 'Git'],
    },
  ],
  OpenSource: [
    {
      key: 'opensource-core',
      label: 'Açık Kaynak Başlangıç',
      description: 'Depo, katkılar ve servis katmanı.',
      names: ['Git', 'GitHub', 'REST API'],
    },
    {
      key: 'opensource-web',
      label: 'Açık Kaynak Web',
      description: 'Arayüz tarafına katkı verecek ekip.',
      names: ['React', 'JavaScript', 'CSS'],
    },
  ],
};

export const technologyPresetDefinitions = {
  technologyPresetCatalog,
  sharedTechnologyPresets,
};
