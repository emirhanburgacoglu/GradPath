import AppHeader from '../components/AppHeader';
import DashboardHeader from '../components/DashboardHeader';
import HeroSection from '../components/HeroSection';
import StatsGrid from '../components/StatsGrid';
import RecommendationsSection from '../components/RecommendationsSection';

function DashboardPage({
  cgpa,
  currentView,
  error,
  firstName,
  initials,
  isHonorStudent,
  loading,
  onLogout,
  onRefresh,
  onViewChange,
  profile,
  recommendations,
  refreshing,
  stats,
  summaryText,
  todayLabel,
  totalECTS,
}) {
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
          cgpa={cgpa}
          initials={initials}
          isHonorStudent={isHonorStudent}
          profile={profile}
          stats={stats}
          summaryText={summaryText}
          totalECTS={totalECTS}
        />

        <StatsGrid stats={stats} />

        <RecommendationsSection loading={loading} recommendations={recommendations} />
      </main>
    </div>
  );
}

export default DashboardPage;
