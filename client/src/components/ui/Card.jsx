const PADDING = {
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

function Card({ padding = "md", hover = false, className = "", children, ...rest }) {
  const hoverClasses = hover
    ? "hover:shadow-md hover:-translate-y-1 hover:border-slate-300 transition-shadow transition-transform"
    : "";

  return (
    <div
      className={`bg-white border border-slate-200 rounded-2xl shadow-sm ${PADDING[padding]} ${hoverClasses} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export default Card;
