import Link from 'next/link';

type AppHeaderProps = {
  brand: string;
};

export function AppHeader({ brand }: AppHeaderProps) {
  const hasBotSuffix = brand.endsWith('Bot');
  const brandMain = hasBotSuffix ? brand.slice(0, -3) : brand;
  const brandSuffix = hasBotSuffix ? 'Bot' : '';

  return (
    <header className="app-header">
      <div className="container app-header-inner">
        <Link href="/" className="app-header-brand" aria-label="ENEMBot home">
          <span className="brand-badge" aria-hidden>
            <span className="brand-dot" />
          </span>
          <strong className="brand-text">
            <span className="brand-main">{brandMain}</span>
            {brandSuffix && <span className="brand-suffix">{brandSuffix}</span>}
          </strong>
        </Link>

        <div className="app-header-actions">
          <span className="chip" aria-hidden>
            <span>🧪</span>
            Prototipo
          </span>
        </div>
      </div>
    </header>
  );
}
