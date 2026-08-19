import './globals.css';

export const metadata = {
  title: 'MULTIGAMES',
  description: 'Play free online games',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}