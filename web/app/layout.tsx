export const metadata = {
  title: "Pranaya’s Money Tracker",
  description: "Track spending, add expenses, and see friendly charts & alerts.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      {/* Keep global providers or styles here if you add them later */}
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}

