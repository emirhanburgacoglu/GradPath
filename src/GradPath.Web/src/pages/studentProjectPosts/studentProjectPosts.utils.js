import { technologyPresetDefinitions } from './studentProjectPosts.constants';

export function createEmptyPostForm() {
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

export function getErrorMessage(error, fallback) {
  const responseData = error?.response?.data;

  if (typeof responseData === 'string' && responseData.trim()) {
    return responseData;
  }

  return responseData?.message || responseData?.title || fallback;
}

export function formatDateLabel(value) {
  if (!value) {
    return 'Son tarih belirlenmedi';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Geçersiz tarih';
  }

  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function toDateTimeLocalValue(value) {
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

export function getDateRange(startDateText, endDateText) {
  return [startDateText, endDateText].filter(Boolean).join(' - ');
}

export function getProficiencyLabel(level) {
  switch (level) {
    case 3:
      return 'İleri';
    case 2:
      return 'Orta';
    default:
      return 'Başlangıç';
  }
}

export function toggleSelection(list, value) {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

export function normalizeLookupValue(value) {
  return String(value || '').trim().toLowerCase();
}

export function matchesLookupQuery(values, query) {
  const normalizedQuery = normalizeLookupValue(query);

  if (!normalizedQuery) {
    return true;
  }

  return values
    .filter(Boolean)
    .some((value) => normalizeLookupValue(value).includes(normalizedQuery));
}

export function getStatusTone(status) {
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

export function getApplicationTone(status) {
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

export function sortOptionsForSelection(options, selectedIds, metaSelector) {
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

export function buildTechnologyPresets(options, projectType) {
  const optionMap = options.reduce((accumulator, option) => {
    const normalizedName = normalizeLookupValue(option.name);

    if (normalizedName && !accumulator[normalizedName]) {
      accumulator[normalizedName] = option;
    }

    return accumulator;
  }, {});

  const definitions = [
    ...(technologyPresetDefinitions.technologyPresetCatalog[projectType] || []),
    ...technologyPresetDefinitions.sharedTechnologyPresets,
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
