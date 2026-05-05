import { RefreshCw } from 'lucide-react';

function DashboardHeader({ firstName, onRefresh, refreshing, loading, todayLabel }) {
  return (
    <header className="dashboard-header">
      <div>
        <p className="dashboard-date">{todayLabel}</p>
        <h1 className="dashboard-title">Gosterge Paneli</h1>
        <p className="dashboard-subtitle">
          Hos geldin {firstName}. Profil, ilan ve proje eslesmelerin tek panelde toplanmis durumda.
        </p>
      </div>

      <div className="dashboard-actions">
        <div className="dashboard-status-note">Sistem gorunumu guncel</div>

        <button
          className="ghost-button"
          type="button"
          onClick={onRefresh}
          disabled={refreshing || loading}
        >
          <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
          {refreshing ? 'Yenileniyor' : 'Paneli Yenile'}
        </button>
      </div>
    </header>
  );
}

export default DashboardHeader;
