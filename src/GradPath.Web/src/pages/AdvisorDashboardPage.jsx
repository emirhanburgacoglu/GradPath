import AppHeader from '../components/AppHeader';
import AppFooter from '../components/AppFooter';

function AdvisorDashboardPage({
    currentView,
    initials,
    onLogout,
    onViewChange,
    profile,
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
                <section className="hero-card">
                    <div className="hero-copy">
                        <div className="hero-badge">Danisman Paneli</div>
                        <h1>{profile?.fullName || 'Danisman paneli'}</h1>
                        <p>
                            Bu alan danisman hocalarin gelen proje taleplerini yonetmesi icin
                            hazirlaniyor. Bir sonraki adimda burada talep listesi ve onay/red
                            aksiyonlarini baglayacagiz.
                        </p>
                        <div className="project-meta-row" style={{ marginTop: 16 }}>
                            <span className="project-meta-chip">
                                {profile?.academicTitle || 'Unvan bilgisi bekleniyor'}
                            </span>
                            <span className="project-meta-chip subtle">
                                {profile?.departmentName || 'Bolum bilgisi bekleniyor'}
                            </span>
                            <span className="project-meta-chip subtle">
                                Kontenjan: {profile?.maxConcurrentStudents ?? '-'}
                            </span>
                        </div>

                        {profile?.expertiseAreas ? (
                            <p style={{ marginTop: 16 }}>
                                <strong>Uzmanlik alanlari:</strong> {profile.expertiseAreas}
                            </p>
                        ) : null}

                        {profile?.officeLocation ? (
                            <p>
                                <strong>Ofis:</strong> {profile.officeLocation}
                            </p>
                        ) : null}
                    </div>
                </section>
            </main>

            <AppFooter currentView={currentView} onViewChange={onViewChange} />
        </div>
    );
}

export default AdvisorDashboardPage;