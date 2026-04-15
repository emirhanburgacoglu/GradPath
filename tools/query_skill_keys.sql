select
  "CvFileName",
  (
    select string_agg(category ->> 'CategoryName', ', ' order by ord)
    from jsonb_array_elements(coalesce("ParsedCvData"::jsonb -> 'SkillsByCategory', '[]'::jsonb)) with ordinality as categories(category, ord)
  ) as categories
from "StudentProfiles"
order by "UpdatedAt" desc nulls last;
