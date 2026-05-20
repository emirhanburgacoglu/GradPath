import { useEffect, useMemo, useState } from 'react';

import AppHeader from '../components/AppHeader';
import AppFooter from '../components/AppFooter';
import DashboardHeader from '../components/DashboardHeader';
import HeroSection from '../components/HeroSection';
import RecommendationsSection from '../components/RecommendationsSection';

function DashboardPage({
  activeAdvisorRequest,
  advisorRequests,
  cgpa,
  currentView,
  error,
  firstName,
  initials,
  loading,
  onLogout,
  onRefresh,
  onSelectProjectForAdvisor,
  onViewChange,
  profile,
  recommendations,
  refreshing,
  stats,
  todayLabel,
  totalECTS,
}) {
  const [filters, setFilters] = useState({
    department: 'all',
    category: 'all',
  });
  const [currentPage, setCurrentPage] = useState(1);

  const departmentOptions = useMemo(
    () =>
      [...new Set(recommendations.flatMap((item) => item.departmentNames || []).filter(Boolean))].sort(
        (left, right) => left.localeCompare(right, 'tr')
      ),
    [recommendations]
  );

  const departmentScopedRecommendations = useMemo(
    () =>
      filters.department === 'all'
        ? recommendations
        : recommendations.filter((item) => (item.departmentNames || []).includes(filters.department)),
    [filters.department, recommendations]
  );

  const categoryOptions = useMemo(
    () =>
      [...new Set(departmentScopedRecommendations.map((item) => item.category).filter(Boolean))].sort(
        (left, right) => left.localeCompare(right, 'tr')
      ),
    [departmentScopedRecommendations]
  );

  const advisorRequestLookup = useMemo(() => {
    return advisorRequests.reduce((lookup, request) => {
      const current = lookup[request.projectId];

      if (!current) {
        lookup[request.projectId] = request;
        return lookup;
      }

      lookup[request.projectId] =
        new Date(request.createdAt).getTime() > new Date(current.createdAt).getTime()
          ? request
          : current;

      return lookup;
    }, {});
  }, [advisorRequests]);

  useEffect(() => {
    if (filters.category !== 'all' && !categoryOptions.includes(filters.category)) {
      setFilters((current) => ({
        ...current,
        category: 'all',
      }));
    }
  }, [categoryOptions, filters.category]);

  const filteredRecommendations = useMemo(() => {
    return departmentScopedRecommendations.filter((item) => {
      const matchesCategory = filters.category === 'all' || item.category === filters.category;
      return matchesCategory;
    });
  }, [departmentScopedRecommendations, filters.category]);

  const recommendationsPerPage = 6;
  const totalPages = Math.max(1, Math.ceil(filteredRecommendations.length / recommendationsPerPage));

  const pagedRecommendations = useMemo(() => {
    const startIndex = (currentPage - 1) * recommendationsPerPage;
    return filteredRecommendations.slice(startIndex, startIndex + recommendationsPerPage);
  }, [currentPage, filteredRecommendations]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters.category, filters.department]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const activeFilterCount = useMemo(
    () => [filters.department !== 'all', filters.category !== 'all'].filter(Boolean).length,
    [filters]
  );

  const hasCgpa = cgpa !== null && cgpa !== undefined && cgpa !== '';
  const hasTotalECTS = totalECTS !== null && totalECTS !== undefined && totalECTS !== '';
  const showProfilePrompt = !profile?.cvFileName || !hasCgpa || !hasTotalECTS;

  const handleFilterChange = (field, value) => {
    setFilters((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      department: 'all',
      category: 'all',
    });
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);

    if (typeof window !== 'undefined') {
      const projectsSection = document.querySelector('.projects-section');

      if (projectsSection) {
        const sectionTop = projectsSection.getBoundingClientRect().top + window.scrollY - 24;
        window.scrollTo({
          top: Math.max(sectionTop, 0),
          behavior: 'smooth',
        });
        return;
      }

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
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
        <DashboardHeader
          firstName={firstName}
          loading={loading}
          onRefresh={onRefresh}
          refreshing={refreshing}
          todayLabel={todayLabel}
        />

        {error ? <div className="dashboard-alert">{error}</div> : null}

        <HeroSection
          activeFilterCount={activeFilterCount}
          categoryOptions={categoryOptions}
          departmentOptions={departmentOptions}
          filteredCount={filteredRecommendations.length}
          filters={filters}
          firstName={firstName}
          onClearFilters={clearFilters}
          onFilterChange={handleFilterChange}
          onOpenProfile={() => onViewChange('profile')}
          showProfilePrompt={showProfilePrompt}
          stats={stats}
        />

        <RecommendationsSection
          activeFilterCount={activeFilterCount}
          activeAdvisorRequest={activeAdvisorRequest}
          advisorRequestLookup={advisorRequestLookup}
          currentPage={currentPage}
          loading={loading}
          onClearFilters={clearFilters}
          onPageChange={handlePageChange}
          onSelectProject={onSelectProjectForAdvisor}
          recommendations={pagedRecommendations}
          totalPages={totalPages}
          totalResults={filteredRecommendations.length}
          totalRecommendations={recommendations.length}
        />
      </main>

      <AppFooter currentView={currentView} onViewChange={onViewChange} />
    </div>
  );
}

export default DashboardPage;
