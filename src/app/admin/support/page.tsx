import { AppNav } from "@/components/layout/AppNav";
import { SupportChat } from "@/components/support/SupportChat";
import "../admin.css";

export default function AdminSupportPage(){
  return <><AppNav/><main className="shell-wide py-8 lg:py-12"><div className="admin-heading"><div><p className="eyebrow"><span/> Yönetim merkezi</p><h1>Canlı destek konuşmaları</h1><p>Kullanıcılardan gelen mesajları gör, konuşmaya bağlan ve gerçek zamanlı yanıt ver.</p></div></div><SupportChat admin/></main></>;
}