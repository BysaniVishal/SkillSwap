import { Link } from "react-router-dom";

const VARIANTS = {
  primary: "bg-slate-900 text-white hover:bg-slate-700 hover:shadow-lg hover:-translate-y-0.5",
  secondary: "border border-slate-300 text-slate-700 hover:bg-slate-50",
  ghost: "text-slate-600 hover:text-slate-900 hover:bg-slate-50",
  accent: "bg-amber-500 text-white hover:bg-amber-600 hover:shadow-lg hover:-translate-y-0.5",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

const SIZES = {
  md: "px-4 py-2 text-sm",
  sm: "px-3 py-1.5 text-xs",
};

function Button({ variant = "primary", size = "md", to, className = "", children, ...rest }) {
  const classes = `inline-flex items-center justify-center font-medium rounded-xl transition disabled:opacity-50 disabled:pointer-events-none ${VARIANTS[variant]} ${SIZES[size]} ${className}`;

  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}

export default Button;
