import "./globals.css";

export const metadata = {
  title: "PCL Portal",
  description: "Perth Car Leasing customer and admin portal"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
