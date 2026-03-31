import "./globals.css";

export const metadata = {
  title: "CampusPay — money with your squad",
  description: "Pocket money, group pools, and campus credit for students in India.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="app-body">{children}</body>
    </html>
  );
}
