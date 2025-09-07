// web/app/layout.tsx
export const metadata = {
  title: 'Pranaya’s Money Tracker',
  description: 'Track expenses, rent & payroll with friendly charts and alerts.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
