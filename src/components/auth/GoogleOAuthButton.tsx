"use client";

type GoogleOAuthButtonProps = {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
};

export default function GoogleOAuthButton({
  onClick,
  disabled = false,
  loading = false,
}: GoogleOAuthButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full h-12 px-4 border border-zinc-200 bg-white text-zinc-800 rounded-full font-medium hover:bg-zinc-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 48 48"
        aria-hidden="true"
      >
        <path
          fill="#EA4335"
          d="M24 9.5c3.54 0 6.72 1.22 9.23 3.61l6.88-6.88C35.93 2.33 30.37 0 24 0 14.62 0 6.51 5.38 2.56 13.22l8.01 6.22C12.43 13.4 17.75 9.5 24 9.5z"
        />
        <path
          fill="#4285F4"
          d="M46.5 24.5c0-1.66-.15-3.26-.43-4.8H24v9.08h12.65c-.55 2.95-2.22 5.45-4.73 7.13l7.27 5.64C43.8 37.42 46.5 31.53 46.5 24.5z"
        />
        <path
          fill="#FBBC05"
          d="M10.57 28.56A14.51 14.51 0 0 1 9.75 24c0-1.57.29-3.08.82-4.56l-8.01-6.22A24.03 24.03 0 0 0 0 24c0 3.87.93 7.53 2.56 10.78l8.01-6.22z"
        />
        <path
          fill="#34A853"
          d="M24 48c6.37 0 11.73-2.09 15.64-5.67l-7.27-5.64c-2.01 1.35-4.59 2.16-8.37 2.16-6.25 0-11.57-3.9-13.43-9.44l-8.01 6.22C6.51 42.62 14.62 48 24 48z"
        />
      </svg>
      <span>{loading ? "Redirecting..." : "Continue with Google"}</span>
    </button>
  );
}
