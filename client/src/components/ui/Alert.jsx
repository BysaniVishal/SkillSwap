const VARIANTS = {
  error: "text-red-700 bg-red-50 border-red-200",
  success: "text-emerald-700 bg-emerald-50 border-emerald-200",
  warning: "text-amber-700 bg-amber-50 border-amber-200",
  info: "text-blue-700 bg-blue-50 border-blue-200",
};

function Alert({ variant = "info", className = "", children }) {
  return (
    <div className={`text-sm rounded-xl px-3 py-2 border ${VARIANTS[variant]} ${className}`}>
      {children}
    </div>
  );
}

export default Alert;
