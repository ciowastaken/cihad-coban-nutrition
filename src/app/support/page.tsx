import { AppNav } from "@/components/layout/AppNav";
import { SupportChat } from "@/components/support/SupportChat";

export default function SupportPage(){
  return <><AppNav/><main className="shell-wide py-8 lg:py-12"><div className="mb-7"><p className="eyebrow"><span/> Yardım merkezi</p><h1 className="mt-3 text-3xl font-semibold text-emerald-950 lg:text-5xl">Canlı destek</h1><p className="mt-3 text-slate-600">Diyetisyenine veya destek ekibine site içinden anında mesaj gönder.</p></div><SupportChat/></main></>;
}