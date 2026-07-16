import { Features } from "@/components/landing/Features";
import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7faf7] text-zinc-950">
      <Header />
      <Hero />
      <Features />
    </main>
  );
}