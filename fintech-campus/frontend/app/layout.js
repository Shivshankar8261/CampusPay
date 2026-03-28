import "./globals.css";

export const metadata = {
  title: "CampusPay",
  description: "Group pools, pocket money, and campus credit — student fintech MVP",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
