import { useRef } from "react";
import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import SubscribeForm from "@/components/landing/SubscribeForm";
import Footer from "@/components/landing/Footer";

const Index = () => {
  const subscribeRef = useRef<HTMLDivElement>(null);

  const scrollToSubscribe = () => {
    subscribeRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen">
      <Header onSubscribe={scrollToSubscribe} />
      <main className="pt-16">
        <Hero onGetStarted={scrollToSubscribe} />
        <Features />
        <div ref={subscribeRef}>
          <SubscribeForm id="subscribe" />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;