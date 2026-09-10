import { lazy, Suspense, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import HeroFallback from "./HeroFallback";

const Hero3D = lazy(() => import("./Hero3D"));

function useWantsHero3D() {
  const [wants, setWants] = useState(false);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const widthQuery = window.matchMedia("(min-width: 768px)");

    function update() {
      setWants(!motionQuery.matches && widthQuery.matches);
    }

    update();
    motionQuery.addEventListener("change", update);
    widthQuery.addEventListener("change", update);
    return () => {
      motionQuery.removeEventListener("change", update);
      widthQuery.removeEventListener("change", update);
    };
  }, []);

  return wants;
}

function Hero() {
  const { user } = useAuth();
  const wants3D = useWantsHero3D();

  return (
    <section className="max-w-6xl mx-auto px-4 pt-20 pb-16 grid lg:grid-cols-2 gap-12 items-center">
      <div>
        <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-slate-900 tracking-tight leading-[1.05]">
          Learn what
          <br />
          you want.
          <br />
          <span className="text-indigo-600">Teach what you know.</span>
        </h1>
        <p className="font-body mt-6 text-lg text-slate-600 max-w-md">
          SkillSwap matches students who can teach each other — no tutoring fees, just a fair
          trade of skills.
        </p>
        <div className="mt-8 flex items-center gap-3">
          {user ? (
            <Link
              to="/discover"
              className="bg-slate-900 text-white rounded-md px-6 py-3 text-sm font-medium hover:bg-slate-700 transition hover:shadow-lg hover:-translate-y-0.5"
            >
              Discover matches
            </Link>
          ) : (
            <>
              <Link
                to="/register"
                className="border border-slate-300 rounded-md px-6 py-3 text-sm font-medium hover:bg-slate-900 hover:text-white hover:border-slate-900 transition hover:shadow-lg hover:-translate-y-0.5"
              >
                Get started
              </Link>
              <Link
                to="/login"
                className="border border-slate-300 rounded-md px-6 py-3 text-sm font-medium hover:bg-white transition hover:-translate-y-0.5"
              >
                Log in
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="relative h-72 lg:h-[420px]">
        {wants3D ? (
          <Suspense fallback={<HeroFallback />}>
            <Hero3D />
          </Suspense>
        ) : (
          <HeroFallback />
        )}
      </div>
    </section>
  );
}

export default Hero;
