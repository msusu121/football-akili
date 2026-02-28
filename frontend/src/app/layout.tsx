import "./globals.css";
import AppProviders from "@/components/AppProviders";

export const metadata = {
  title: "Official Club Website",
  description: "News, fixtures, squad, tickets, shop, and club updates",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
