"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { SiteHeader } from "@/components/layout/SiteHeader";

const features = [
  [
    "01",
    "Gerçekten kişiye özel",
    "Kilon, hedefin, öğün düzenin, bütçen ve tercihlerin birlikte değerlendirilir.",
  ],
  [
    "02",
    "Geçmişini hatırlar",
    "Eski öğünlerin, programların ve kilo değişimin tek bir gelişim hikâyesinde kalır.",
  ],
  [
    "03",
    "Gününe uyum sağlar",
    "Kahvaltı yapmadığın, dışarıda yediğin veya antrenmanı kaçırdığın günlerde planın esner.",
  ],
];

const testimonials = [
  {
    initials: "EA",
    name: "Ece A.",
    context: "Örnek deneyim · kilo kontrolü",
    quote:
      "Kahvaltı yapmadığım günlerde planın beni zorlamaması takip etmeyi çok kolaylaştırdı.",
  },
  {
    initials: "MK",
    name: "Mert K.",
    context: "Örnek deneyim · sporcu beslenmesi",
    quote:
      "Tekrar hesaplama yaptığımda hedef ve aktivite değişimime göre planın yenilenmesi en sevdiğim tarafı oldu.",
  },
  {
    initials: "SD",
    name: "Selin D.",
    context: "Örnek deneyim · düzen oluşturma",
    quote:
      "Öğünleri ve kilo geçmişini aynı yerde görmek, neyi neden değiştirdiğimi anlamamı sağladı.",
  },
];

const steps = [
  [
    "Profilini oluştur",
    "Boy, kilo, hedef, aktivite ve beslenme düzenini birkaç dakikada ekle.",
  ],
  [
    "Planını kişiselleştir",
    "Bilgileri profilden getir veya bu program için güncel değerlerini yeniden gir.",
  ],
  [
    "Takip et ve güncelle",
    "Öğünlerini kaydet; sistem ilerlemene göre hedeflerini yeniden yorumlasın.",
  ],
];

type ProfileResponse = {
  profile?: {
    full_name?: string | null;
  } | null;
  full_name?: string | null;
};

function getGreeting(hour: number): string {
  if (hour >= 5 && hour < 12) {
    return "Günaydın";
  }

  if (hour >= 12 && hour < 18) {
    return "İyi günler";
  }

  return "İyi akşamlar";
}

function getFirstName(fullName?: string | null): string {
  if (!fullName) {
    return "";
  }

  return fullName.trim().split(/\s+/)[0] ?? "";
}

export default function Home() {
  const [greeting, setGreeting] = useState("Merhaba");
  const [firstName, setFirstName] = useState("");

  useEffect(() => {
    setGreeting(getGreeting(new Date().getHours()));

    const loadProfile = async () => {
      try {
        const response = await fetch("/api/profile", {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        });

        // Kullanıcı giriş yapmamışsa isim göstermeden devam eder.
        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as ProfileResponse;

        const fullName =
          data.profile?.full_name ??
          data.full_name ??
          null;

        setFirstName(getFirstName(fullName));
      } catch {
        // Profil alınamazsa ana sayfa çalışmaya devam eder.
        setFirstName("");
      }
    };

    void loadProfile();
  }, []);

  const greetingText = firstName
    ? `${greeting}, ${firstName} 👋`
    : `${greeting} 👋`;

  return (
    <main className="home-page">
      <SiteHeader variant="home" />

      <section className="hero shell-wide">
        <div className="hero-copy reveal">
          <div className="eyebrow">
            <span />
            Yapay zekâ destekli beslenme koçu
          </div>

          <h1>
            Hedefini bilen,
            <br />
            <em>hayatına uyum sağlayan</em>
            <br />
            beslenme planı.
          </h1>

          <p>
            Hazır listeler yerine seni tanıyan bir sistem. Öğünlerini, kilo
            değişimini ve geçmiş programlarını takip et; planını gerçek
            hayatına göre güncelle.
          </p>

          <div className="hero-actions">
            <Link href="/onboarding" className="button button-primary">
              Planımı oluştur <span>→</span>
            </Link>

            <a href="#how-it-works" className="button button-secondary">
              Nasıl çalıştığını gör
            </a>
          </div>

          <div className="trust-row">
            <span>✓ Zorunlu öğün yok</span>
            <span>✓ Geçmiş kayıtları</span>
            <span>✓ Esnek hedef takibi</span>
          </div>
        </div>

        <div className="hero-visual reveal reveal-delay">
          <div className="orb orb-one" />
          <div className="orb orb-two" />

          <div className="dashboard-preview">
            <div className="preview-top">
              <div>
                <small>
                  {new Intl.DateTimeFormat("tr-TR", {
                    day: "numeric",
                    month: "long",
                    weekday: "long",
                  }).format(new Date())}
                </small>

                <h2>{greetingText}</h2>
              </div>

              <span className="status-pill">Hedefte</span>
            </div>

            <div className="calorie-panel">
              <div>
                <small>Günlük tüketim</small>

                <strong>
                  1.640 <i>/ 2.150 kcal</i>
                </strong>
              </div>

              <b>%76</b>

              <div className="progress">
                <span style={{ width: "76%" }} />
              </div>
            </div>

            <div className="metric-grid">
              <div>
                <small>Protein</small>
                <strong>112 g</strong>
                <span>145 g hedef</span>
              </div>

              <div>
                <small>Su</small>
                <strong>2.1 L</strong>
                <span>3 L hedef</span>
              </div>

              <div>
                <small>Hedef</small>
                <strong>-6.2 kg</strong>
                <span>86 kg&apos;a kalan</span>
              </div>
            </div>

            <div className="coach-card">
              <span>✦</span>

              <div>
                <b>Bugünün koç notu</b>

                <p>
                  Kahvaltıyı atladın. Öğle öğününde protein ve lif dengesini
                  biraz güçlendirelim.
                </p>
              </div>
            </div>
          </div>

          <div className="floating-card weight-card">
            <small>Son 30 gün</small>
            <b>-2.8 kg</b>
            <span>İstikrarlı ilerleme ↗</span>
          </div>

          <div className="floating-card meal-card">
            <span>🥗</span>

            <div>
              <b>Öğün kaydedildi</b>
              <small>Tavuklu salata · 520 kcal</small>
            </div>
          </div>
        </div>
      </section>

      <section className="stats-strip">
        <div className="shell-wide stats-inner">
          <div>
            <strong>Tek profil</strong>
            <span>Tüm geçmişin bir arada</span>
          </div>

          <div>
            <strong>Esnek öğünler</strong>
            <span>Kahvaltısız günler dahil</span>
          </div>

          <div>
            <strong>Canlı hedef</strong>
            <span>Kilona göre güncellenir</span>
          </div>

          <div>
            <strong>Akıllı plan</strong>
            <span>Tercihlerine göre alternatifli</span>
          </div>
        </div>
      </section>

      <section id="features" className="section shell-wide">
        <div className="section-heading">
          <div>
            <div className="eyebrow">
              <span />
              Platform özellikleri
            </div>

            <h2>
              Sadece kalori saymaz.
              <br />
              Seni ve düzenini anlar.
            </h2>
          </div>

          <p>
            Uygulama, tek seferlik hesaplama yerine zamanla gelişen bir
            beslenme profili oluşturur.
          </p>
        </div>

        <div className="feature-grid">
          {features.map(([number, title, description]) => (
            <article className="feature-card" key={title}>
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{description}</p>
              <i>↗</i>
            </article>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="how-section">
        <div className="shell-wide how-grid">
          <div className="how-copy">
            <div className="eyebrow light">
              <span />
              Nasıl çalışır?
            </div>

            <h2>Üç adımda sana ait bir sistem.</h2>

            <p>
              Profilindeki bilgileri kullanır, fakat her yeni programda güncel
              durumunu onaylamanı ister.
            </p>

            <Link href="/onboarding" className="button button-light">
              Hemen deneyimle →
            </Link>
          </div>

          <div className="steps-list">
            {steps.map(([title, description], index) => (
              <div className="step-item" key={title}>
                <span>0{index + 1}</span>

                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      <section className="testimonial-section">
        <div className="shell-wide">
          <div className="section-heading testimonial-heading">
            <div>
              <div className="eyebrow"><span /> Örnek kullanıcı deneyimleri</div>
              <h2>Günlük hayata uyum sağlayan küçük farklar.</h2>
            </div>
            <p>
              Aşağıdaki kartlar arayüz gösterimi için hazırlanmış örnek deneyimlerdir;
              gerçek kullanıcı yorumu veya doğrulanmış sonuç değildir.
            </p>
          </div>

          <div className="testimonial-grid">
            {testimonials.map((testimonial) => (
              <article className="testimonial-card" key={testimonial.name}>
                <div className="testimonial-rating" aria-label="5 yıldız">★★★★★</div>
                <blockquote>“{testimonial.quote}”</blockquote>
                <div className="testimonial-person">
                  <span>{testimonial.initials}</span>
                  <div>
                    <b>{testimonial.name}</b>
                    <small>{testimonial.context}</small>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="appointment-cta shell-wide">
        <div>
          <div className="eyebrow light"><span /> Birebir görüşme</div>
          <h2>Programını birlikte değerlendirmek için randevu oluştur.</h2>
          <p>
            Uygun tarih ve saati seç; randevu talebin yönetim paneline ve
            danışman e-postasına iletilsin.
          </p>
        </div>
        <Link href="/appointment" className="button button-light">
          Randevu talebi oluştur →
        </Link>
      </section>

      <section className="section shell-wide final-cta">
        <div>
          <div className="eyebrow">
            <span />
            Bugün başla
          </div>

          <h2>
            Beslenme planın hayatına uysun,
            <br />
            hayatın plana değil.
          </h2>
        </div>

        <Link href="/onboarding" className="button button-primary">
          Ücretsiz profil oluştur →
        </Link>
      </section>
    </main>
  );
}