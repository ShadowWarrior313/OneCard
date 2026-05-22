export function Footer() {
  return (
    <footer className="oc-footer">
      <div className="oc-container oc-footer-inner">
        <p>© {new Date().getFullYear()} OneCard · Demo — not a licensed issuer</p>
        <p>
          Rewards data is illustrative. Verify with your issuer before applying.
        </p>
      </div>
    </footer>
  );
}
