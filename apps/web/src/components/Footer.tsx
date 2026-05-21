export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-slate-500 sm:flex-row sm:px-6">
        <p>© {new Date().getFullYear()} OneCard · Demo — not a licensed issuer</p>
        <p className="text-center sm:text-right">
          Rewards data is illustrative. Verify with your issuer before applying.
        </p>
      </div>
    </footer>
  );
}
