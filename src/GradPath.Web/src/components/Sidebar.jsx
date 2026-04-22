import { GraduationCap, LayoutDashboard, LogOut, Settings, User, Users } from 'lucide-react';

function Sidebar({ currentView, initials, onLogout, onViewChange, profile }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-mark">GP</div>
        <div className="sidebar-brand-copy">
          <span>Project Intelligence Platform</span>
          <strong>GradPath</strong>
        </div>
      </div>

      <div className="sidebar-section-label">Calisma Alani</div>

      <nav style={{ flex: 1 }}>
        <button
          type="button"
          className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
          onClick={() => onViewChange('dashboard')}
        >
          <LayoutDashboard size={18} />
          Dashboard
        </button>
        <button
          type="button"
          className={`nav-item ${currentView === 'profile' ? 'active' : ''}`}
          onClick={() => onViewChange('profile')}
        >
          <User size={18} />
          Profilim
        </button>
        <button
          type="button"
          className={`nav-item ${currentView === 'students' ? 'active' : ''}`}
          onClick={() => onViewChange('students')}
        >
          <Users size={18} />
          Ogrenci Dizini
        </button>
        <button
          type="button"
          className={`nav-item ${currentView === 'posts' ? 'active' : ''}`}
          onClick={() => onViewChange('posts')}
        >
          <GraduationCap size={18} />
          Proje Ilanlari
        </button>
        <div className="nav-item nav-item-passive">
          <Settings size={18} />
          Ayarlar
        </div>
      </nav>

      <div className="sidebar-profile">
        <div className="sidebar-avatar">{initials}</div>
        <div className="sidebar-profile-copy">
          <strong>{profile?.fullName || 'GradPath kullanicisi'}</strong>
          <span>{profile?.email || 'Aktif oturum'}</span>
        </div>
      </div>

      <button type="button" className="nav-item sidebar-logout" onClick={onLogout}>
        <LogOut size={18} />
        Cikis Yap
      </button>
    </aside>
  );
}

export default Sidebar;
