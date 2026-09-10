function HeroFallback() {
  return (
    <div
      className="absolute inset-0 rounded-3xl"
      style={{
        background:
          "radial-gradient(circle at 30% 30%, rgba(99,102,241,0.35), transparent 60%), radial-gradient(circle at 70% 65%, rgba(249,115,22,0.3), transparent 60%)",
        filter: "blur(40px)",
      }}
    />
  );
}

export default HeroFallback;
