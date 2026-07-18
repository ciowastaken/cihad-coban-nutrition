import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";

const columns = [
  { title: "Ürün", links: [["Özellikler","/#features"],["Nasıl çalışır?","/#how-it-works"],["Plan oluştur","/onboarding"],["Kişisel panel","/dashboard"]]},
  { title: "Hesap", links: [["Profilim","/profile"],["Programlarım","/plans"],["Giriş yap","/login"],["Kayıt ol","/register"]]},
  { title: "Kaynaklar", links: [["Beslenme rehberi","/nutrition-guide"],["Randevu al","/appointment"],["Sık sorulanlar","/faq"],["Hakkımızda","/about"],["İletişim","/contact"]]},
  { title: "Yasal", links: [["Gizlilik","/privacy"],["Kullanım şartları","/terms"]]},
];

export function SiteFooter(){return <footer className="site-footer">
  <div className="shell-wide footer-grid">
    <div className="footer-brand"><BrandLogo inverted subtitle="Nutrition" /><p>Hedeflerini, öğünlerini ve gelişimini tek yerde yöneten kişisel beslenme platformu.</p><div className="footer-badge">✦ Bilimsel yaklaşım · Esnek planlama</div></div>
    {columns.map(column=><div key={column.title} className="footer-column"><h3>{column.title}</h3>{column.links.map(([label,href])=><Link key={href} href={href}>{label}</Link>)}</div>)}
  </div>
  <div className="shell-wide footer-bottom"><p>© {new Date().getFullYear()} Cihad Çoban Nutrition</p><p>Genel bilgilendirme amaçlıdır; tıbbi tanı veya tedavi yerine geçmez.</p></div>
</footer>}
