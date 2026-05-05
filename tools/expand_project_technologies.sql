BEGIN;

INSERT INTO "ProjectTechnologies" ("ProjectId", "TechnologyId", "ImportanceLevel", "CreatedAt")
SELECT p."Id", t."Id", v."ImportanceLevel", NOW()
FROM (
    VALUES
    ('AI Destekli CV Analiz ve Proje Oneri Sistemi', 'Scikit-learn', 2),
    ('AI Destekli CV Analiz ve Proje Oneri Sistemi', 'GitHub', 1),

    ('Akilli Aydinlatma Kontrol Sistemi', 'PostgreSQL', 2),
    ('Akilli Aydinlatma Kontrol Sistemi', 'Linux', 1),

    ('Akilli Depo Robotu Koordinasyon Sistemi', 'OpenCV', 2),
    ('Akilli Depo Robotu Koordinasyon Sistemi', 'PostgreSQL', 2),

    ('Akilli Ders Programi Optimizasyon Sistemi', 'Scikit-learn', 2),
    ('Akilli Ders Programi Optimizasyon Sistemi', 'Git', 1),

    ('Akilli Enerji Dagitim Izleme Sistemi', 'Raspberry Pi', 2),
    ('Akilli Enerji Dagitim Izleme Sistemi', 'Machine Learning', 2),

    ('Akilli Otopark Tahmin ve Yonlendirme Sistemi', 'OpenCV', 2),

    ('Akilli Sera Kontrol ve Izleme Sistemi', 'REST API', 2),
    ('Akilli Sera Kontrol ve Izleme Sistemi', 'Git', 1),

    ('Akilli Sera Robotik Kontrol Platformu', 'OpenCV', 2),
    ('Akilli Sera Robotik Kontrol Platformu', 'Git', 1),

    ('Akilli Soru Cozum Asistani', 'TensorFlow', 2),
    ('Akilli Soru Cozum Asistani', 'Git', 1),

    ('Akilli Trafik Sinyal Kontrol Sistemi', 'OpenCV', 2),
    ('Akilli Trafik Sinyal Kontrol Sistemi', 'PostgreSQL', 2),

    ('API Gateway ve Servis Yetkilendirme Platformu', 'Docker', 2),

    ('Bakim Planlama ve Ariza Yonetim Sistemi', 'Git', 1),
    ('Bakim Planlama ve Ariza Yonetim Sistemi', 'Docker', 2),

    ('Bakim ve Is Emri Planlama Platformu', 'Git', 1),
    ('Bakim ve Is Emri Planlama Platformu', 'Docker', 2),

    ('Bilgisayarli Goru ile Hedef Tespit Sistemi', 'TensorFlow', 2),
    ('Bilgisayarli Goru ile Hedef Tespit Sistemi', 'Git', 1),

    ('Bulut Tabanli Kod Kalite Analiz Platformu', 'Docker', 2),

    ('Dagitik Servis Izleme ve Alert Platformu', 'Azure', 1),

    ('Depo Operasyon Verimlilik Analiz Sistemi', 'Machine Learning', 2),
    ('Depo Operasyon Verimlilik Analiz Sistemi', 'Git', 1),

    ('Depo ve Stok Tahminleme Sistemi', 'Scikit-learn', 2),
    ('Depo ve Stok Tahminleme Sistemi', 'Git', 1),

    ('Drone Telemetri ve Gorev Kontrol Paneli', 'PostgreSQL', 2),
    ('Drone Telemetri ve Gorev Kontrol Paneli', 'Git', 1),

    ('Endustriyel Motor Ariza Tahminleme Platformu', 'Scikit-learn', 2),
    ('Endustriyel Motor Ariza Tahminleme Platformu', 'Git', 1),

    ('Endustriyel Sensor Agi Veri Toplama Platformu', 'PostgreSQL', 2),
    ('Endustriyel Sensor Agi Veri Toplama Platformu', 'Git', 1),

    ('Goruntu Isleme Destekli Kalite Kontrol Robotu', 'TensorFlow', 2),
    ('Goruntu Isleme Destekli Kalite Kontrol Robotu', 'Raspberry Pi', 2),

    ('Goruntu Isleme ile Akilli Guvenlik Sistemi', 'TensorFlow', 2),
    ('Goruntu Isleme ile Akilli Guvenlik Sistemi', 'Git', 1),

    ('Gunes Paneli Performans Izleme Sistemi', 'Machine Learning', 2),
    ('Gunes Paneli Performans Izleme Sistemi', 'Git', 1),

    ('Insansiz Arac Telemetri ve Komuta Platformu', 'PostgreSQL', 2),
    ('Insansiz Arac Telemetri ve Komuta Platformu', 'Git', 1),

    ('IoT Enerji Tuketim Izleme Paneli', 'PostgreSQL', 2),
    ('IoT Enerji Tuketim Izleme Paneli', 'Git', 1),

    ('IoT Tabanli Sera Izleme Sistemi', 'REST API', 2),
    ('IoT Tabanli Sera Izleme Sistemi', 'Git', 1),

    ('Kalite Kontrol icin Goruntu Isleme Sistemi', 'TensorFlow', 2),
    ('Kalite Kontrol icin Goruntu Isleme Sistemi', 'Git', 1),

    ('Kampus Ici Navigasyon Mobil Uygulamasi', 'Firebase', 2),
    ('Kampus Ici Navigasyon Mobil Uygulamasi', 'Git', 1),

    ('Konteyner Tabanli DevOps Gozlem Platformu', 'Azure', 1),

    ('Kurumsal Gorev ve Surec Yonetim Platformu', 'Entity Framework', 2),
    ('Kurumsal Gorev ve Surec Yonetim Platformu', 'Docker', 2),

    ('Kurumsal Web CMS', 'JavaScript', 2),

    ('Mobil Kampus Yardimcisi', 'Firebase', 2),
    ('Mobil Kampus Yardimcisi', 'Git', 1),

    ('Otonom Cizgi Izleyen Robot', 'Linux', 1),
    ('Otonom Cizgi Izleyen Robot', 'Git', 1),

    ('Otonom Tasima Robotu Gorev Yonetim Sistemi', 'OpenCV', 2),
    ('Otonom Tasima Robotu Gorev Yonetim Sistemi', 'Git', 1),

    ('Staj Ilan Eslestirme Motoru', 'Machine Learning', 2),
    ('Staj Ilan Eslestirme Motoru', 'Git', 1),

    ('Stok ve Tedarik Tahminleme Platformu', 'PostgreSQL', 2),
    ('Stok ve Tedarik Tahminleme Platformu', 'Git', 1),

    ('Test Otomasyon ve CI Pipeline Sistemi', 'Kubernetes', 2),

    ('Trafo Durum Tahminleme ve Alarm Sistemi', 'Scikit-learn', 2),
    ('Trafo Durum Tahminleme ve Alarm Sistemi', 'Git', 1),

    ('Universite Etkinlik ve Kayit Platformu', 'JavaScript', 2),
    ('Universite Etkinlik ve Kayit Platformu', 'Git', 1),

    ('Uretim Cizelgeleme Optimizasyon Sistemi', 'Machine Learning', 2),
    ('Uretim Cizelgeleme Optimizasyon Sistemi', 'Git', 1),

    ('Uretim Hatti Verimlilik Analiz Sistemi', 'Machine Learning', 2),
    ('Uretim Hatti Verimlilik Analiz Sistemi', 'Git', 1),

    ('Yazilim Test ve CI Pipeline Yonetim Platformu', 'Kubernetes', 2),
    ('Yazilim Test ve CI Pipeline Yonetim Platformu', 'Linux', 1)
) AS v("ProjectTitle", "TechnologyName", "ImportanceLevel")
JOIN "Projects" p ON p."Title" = v."ProjectTitle"
JOIN (
    SELECT MIN("Id") AS "Id", LOWER("Name") AS norm_name
    FROM "Technologies"
    GROUP BY LOWER("Name")
) tc ON LOWER(v."TechnologyName") = tc.norm_name
JOIN "Technologies" t ON t."Id" = tc."Id"
WHERE NOT EXISTS (
    SELECT 1
    FROM "ProjectTechnologies" pt
    WHERE pt."ProjectId" = p."Id"
      AND pt."TechnologyId" = t."Id"
);

COMMIT;
