import Hero from "../components/landing/Hero";
import Features from "../components/landing/Features";
import HowItWorks from "../components/landing/HowItWorks";
import MatchShowcase from "../components/landing/MatchShowcase";

function Landing() {
  return (
    <div className="bg-slate-50 min-h-screen overflow-x-hidden">
      <Hero />
      <Features />
      <HowItWorks />
      <MatchShowcase />
    </div>
  );
}

export default Landing;
