import "./globals.css";

export const metadata = {
  title: "ZEDEK SPORTS CONTROL ROOM",
  description: "Private football operations control room for ZEDEK SPORTS."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}