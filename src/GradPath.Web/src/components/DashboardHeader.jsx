import { Bell, RefreshCw } from 'lucide-react';

function DashboardHeader({ firstName, onRefresh, refreshing, loading, todayLabel }) {
  return (
    <header className="dashboard-header">
      <div>
        <p className="dashboard-date">{todayLabel}</p>
        <h1 className="dashboard-title">Proje ve Uyum Panosu</h1>
        <p className="dashboard-subtitle">
          Hos geldin {firstName}. Profil, ilan ve eslesme verilerin tek yonetim ekraninda hazir.
        </p>
      </div>

      <div className="dashboard-actions">
        <button
          className="ghost-button"
          type="button"
          onClick={onRefresh}
          disabled={refreshing || loading}
        >
          <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
          {refreshing ? 'Yenileniyor' : 'Verileri Yenile'}
        </button>

        <button className="icon-button" type="button" aria-label="Bildirimler">
          <Bell size={18} />
        </button>
      </div>
    </header>
  );
}

export default DashboardHeader;
