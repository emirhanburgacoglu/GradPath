select
  "CvFileName",
  left(("ParsedCvData"::jsonb ->> 'NormalizedSummary'), 220) as summary_preview,
  jsonb_array_length(coalesce("ParsedCvData"::jsonb -> 'SkillsByCategory', '[]'::jsonb)) as category_count,
  (
    select coalesce(sum(jsonb_array_length(coalesce(category -> 'Skills', '[]'::jsonb))), 0)
    from jsonb_array_elements(coalesce("ParsedCvData"::jsonb -> 'SkillsByCategory', '[]'::jsonb)) as category
  ) as total_skill_count
from "StudentProfiles"
order by "UpdatedAt" desc nulls last;
