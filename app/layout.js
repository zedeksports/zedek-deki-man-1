import "./globals.css";

export const metadata = {
  title: "ZEDEK SPORTS",
  description: "The home of local football in Ghana and Oti."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
