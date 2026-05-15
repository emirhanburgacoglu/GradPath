import {
  BrainCircuit,
  FileText,
  FolderKanban,
  GraduationCap,
  Network,
  Sparkles,
  UserRoundSearch,
  Users,
} from 'lucide-react';

const workflowSteps = [
  {
    id: '01',
    title: 'Ogrenci Verisi',
    description: 'CV, teknik yetkinlikler, akademik gecmis ve ilgi alanlari sisteme aktarilir.',
    icon: FileText,
  },
  {
    id: '02',
    title: 'Profil Analizi',
    description: 'NLP destekli analiz ile ogrencinin teknik profili ve akademik egilimi cikartilir.',
    icon: BrainCircuit,
  },
  {
    id: '03',
    title: 'Eslesme Motoru',
    description: 'Proje uygunlugu ve takim uyumu birlikte degerlendirilir.',
    icon: Network,
  },
  {
    id: '04',
    title: 'Akilli Oneri',
    description: 'Ogrenciye uygun proje secenekleri ve tamamlayici takim arkadaslari onerilir.',
    icon: Sparkles,
  },
];

const evaluationSignals = [
  {
    title: 'Akademik Arka Plan',
    detail: 'Bolum, dersler, not ortalamasi ve proje deneyimi',
    icon: GraduationCap,
  },
  {
    title: 'Teknik Yetkinlik',
    detail: 'Yazilim dilleri, araclar ve framework bilgisi',
    icon: FolderKanban,
  },
  {
    title: 'Takim Uyumu',
    detail: 'Birbirini tamamlayan beceriler ve ortak ilgi alanlari',
    icon: Users,
  },
  {
    title: 'Kisisel Profil',
    detail: 'CV icerigi, ilgi alanlari ve kariyer yonelimi',
    icon: UserRoundSearch,
  },
];

function PosterWorkflowPage() {
  return (
    <main className="poster-page">
      <section className="poster-hero">
        <div className="poster-hero-copy">
          <span className="poster-kicker">GradPath Poster Demo</span>
          <h1>Akilli proje ve takim eslestirme is akis diyagrami</h1>
          <p>
            Bu sayfa, posterde kullanabilecegin sistem akisini daha guclu bir gorsel yapida
            gostermek icin hazirlandi. Ekran goruntusu alarak posterine dogrudan ekleyebilirsin.
          </p>
          <div className="poster-chip-row">
            <span>AI destekli analiz</span>
            <span>Proje uygunlugu</span>
            <span>Takim uyumu</span>
          </div>
        </div>

        <div className="poster-hero-panel">
          <div className="poster-panel-label">Sistemin odagi</div>
          <strong>Dogru ogrenci, dogru proje, dogru takim</strong>
          <p>
            GradPath sadece proje secimi yapmaz; ogrencilerin birlikte verimli
            calisabilecegi takim yapilarini da onerir.
          </p>
        </div>
      </section>

      <section className="poster-workflow card">
        <div className="poster-section-head">
          <div>
            <span className="poster-section-kicker">Sistem Is Akisi</span>
            <h2>Veriden oneriye uzanan eslestirme sureci</h2>
          </div>
          <p>
            Kutu yapisini aynen posterde kullanabilir veya bu bolumun ekran goruntusunu alarak
            merkezi gorsel olarak yerlestirebilirsin.
          </p>
        </div>

        <div className="poster-flow-grid">
          {workflowSteps.map((step, index) => {
            const Icon = step.icon;

            return (
              <article className="poster-flow-card" key={step.id}>
                <div className="poster-flow-top">
                  <span className="poster-flow-index">{step.id}</span>
                  <span className="poster-flow-icon">
                    <Icon size={22} strokeWidth={2.1} />
                  </span>
                </div>
                <strong>{step.title}</strong>
                <p>{step.description}</p>
                {index < workflowSteps.length - 1 ? <span className="poster-flow-arrow" /> : null}
              </article>
            );
          })}
        </div>
      </section>

      <section className="poster-details-grid">
        <article className="poster-signal-card card">
          <div className="poster-section-head compact">
            <div>
              <span className="poster-section-kicker">Degerlendirilen Veriler</span>
              <h2>Eslesme hangi verilerle yapiliyor?</h2>
            </div>
          </div>

          <div className="poster-signal-list">
            {evaluationSignals.map((item) => {
              const Icon = item.icon;

              return (
                <div className="poster-signal-item" key={item.title}>
                  <span className="poster-signal-icon">
                    <Icon size={18} strokeWidth={2.1} />
                  </span>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        <article className="poster-outcome-card card">
          <div className="poster-section-head compact">
            <div>
              <span className="poster-section-kicker">Beklenen Cikti</span>
              <h2>Oneri ekraninda ne gorulur?</h2>
            </div>
          </div>

          <div className="poster-outcome-stack">
            <div className="poster-outcome-pill">Kisisellestirilmis proje listesi</div>
            <div className="poster-outcome-pill">Takim uyumu yuksek ogrenci onerileri</div>
            <div className="poster-outcome-pill">Eksik yetkinlik ve gelisim alani gorunumu</div>
            <div className="poster-outcome-pill">Daha hizli ve veri temelli karar sureci</div>
          </div>
        </article>
      </section>
    </main>
  );
}

export default PosterWorkflowPage;
