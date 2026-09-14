'use client';
export default function ErrorPage({ reset }: { reset: () => void }) { return <main id="main" className="error-page"><div className="eyebrow">[ INTERRUPTED ]</div><h1>Let’s try that again.</h1><p>The studio ran into a rendering problem. Reload this view to recover.</p><button className="button primary" onClick={reset}>Retry</button></main>; }
