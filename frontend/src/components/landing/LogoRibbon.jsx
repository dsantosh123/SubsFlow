import React from 'react';

export function LogoRibbon() {
  const logos = [
    {
      name: 'Stripe',
      svg: (
        <svg className="h-6 w-auto fill-current" viewBox="0 0 60 25" fill="none">
          <path d="M59.64 14.28c0-4.47-2.19-8.03-6.43-8.03-4.27 0-6.84 3.56-6.84 8 0 5.27 3.03 7.97 7.42 7.97 2.14 0 3.76-.49 4.97-1.19v-3.32c-1.21.65-2.61.98-4.27.98-1.74 0-3.26-.69-3.46-2.73h8.56c.03-.4.05-1.2.05-1.68zm-8.62-1.57c0-1.85 1.13-2.65 2.24-2.65 1.09 0 2.18.8 2.18 2.65h-4.42zM38.83 6.57c-1.75 0-2.88.82-3.48 1.4V6.84h-4.32V22h4.56v-9.15c0-2.31 1.54-3.56 3.2-3.56.59 0 1.07.08 1.34.19V6.78c-.41-.13-.88-.21-1.3-.21zm-9.76-.32h-4.59V22h4.59V6.25zM22.95 2.16l-4.54.96v3.47h2.86v3.91h-2.86V17c0 1.25.96 1.76 2.06 1.76.85 0 1.48-.12 1.84-.28v3.46c-.66.27-1.56.41-2.7.41-3.25 0-5.76-1.64-5.76-5.46v-6.38h-2.73V6.59h2.73V3.97l4.54-.96v3.58h4.56V2.16zM6.59 10.74c-2.45-.69-3.28-1.15-3.28-2.14 0-.85.8-1.48 2.22-1.48 1.94 0 3.89.69 5.27 1.48V4.86c-1.56-.63-3.32-.93-5.06-.93-4.22 0-7.01 2.22-7.01 5.92 0 3.78 2.44 5.37 6.3 6.3 2.63.63 3.53 1.29 3.53 2.3 0 .99-.93 1.62-2.52 1.62-2.22 0-4.63-.91-6.19-1.84v3.92c1.78.77 3.86 1.15 5.95 1.15 4.38 0 7.39-2.14 7.39-6.03-.01-4.09-2.58-5.69-6.6-6.52z" />
        </svg>
      ),
    },
    {
      name: 'Vercel',
      svg: (
        <div className="flex items-center gap-2 font-bold tracking-tight text-sm">
          <svg className="h-4 w-4 fill-current" viewBox="0 0 116 100">
            <polygon points="58 0, 116 100, 0 100" />
          </svg>
          <span>VERCEL</span>
        </div>
      ),
    },
    {
      name: 'Supabase',
      svg: (
        <div className="flex items-center gap-1.5 font-bold tracking-tight text-sm">
          <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
            <path d="M21.362 9.354H12V.396a.396.396 0 0 0-.716-.233L2.203 12.424a.792.792 0 0 0 .616 1.296h8.778v9.884a.396.396 0 0 0 .716.233l9.08-12.261a.792.792 0 0 0-.616-1.296z" fill="#3ECF8E"/>
          </svg>
          <span>SUPABASE</span>
        </div>
      ),
    },
    {
      name: 'Linear',
      svg: (
        <div className="flex items-center gap-2 font-bold tracking-wider text-sm">
          <svg className="h-4 w-4 fill-current" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="10" fill="none" />
            <line x1="20" y1="50" x2="80" y2="50" stroke="currentColor" strokeWidth="10" />
          </svg>
          <span>LINEAR</span>
        </div>
      ),
    },
    {
      name: 'Retool',
      svg: (
        <div className="flex items-center gap-1.5 font-bold tracking-wider text-sm">
          <div className="w-3.5 h-3.5 rounded bg-current" />
          <span>RETOOL</span>
        </div>
      ),
    },
    {
      name: 'Cloudflare',
      svg: (
        <div className="flex items-center gap-1.5 font-bold tracking-wider text-sm">
          <svg className="h-4 w-5 fill-current" viewBox="0 0 24 24">
            <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
          </svg>
          <span>CLOUDFLARE</span>
        </div>
      ),
    },
  ];

  return (
    <div className="border-y border-slate-200/80 bg-slate-50/50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-7">
          POWERING MULTI-TENANT WORKSPACES FOR HIGH-GROWTH TEAMS
        </p>

        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14 text-slate-500 opacity-70 hover:opacity-100 transition-opacity">
          {logos.map((logo, index) => (
            <div
              key={index}
              className="flex items-center transition-transform hover:scale-105 select-none"
            >
              {logo.svg}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
