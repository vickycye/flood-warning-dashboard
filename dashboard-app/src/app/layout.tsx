import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Flood Risk Dashboard",
  description: "[to be filled out]",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased overscroll-y-none overflow-y-auto bg-background`}
      >
        {children}
        <footer className="bg-background text-white mt-12 border-t-2 border-supp-muted-gold">
          <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <h4 className="font-semibold mb-3 text-secondary-gold">Data Sources</h4>
                <ul className="text-sm text-white space-y-1">
                  <li>USGS Water Data</li>
                  <li>NOAA National Weather Service</li>
                  <li>Climate Impacts Group, UW</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3 text-secondary-gold">Contact</h4>
                <p className="text-sm text-white">
                  Climate Impacts Group<br />
                  University of Washington<br />
                  cig@uw.edu, vickyye@uw.edu
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-3 text-secondary-gold">Acknowledgements</h4>
                <p className="text-sm text-white">
                The University of Washington acknowledges the Coast Salish peoples of this land, the land which touches the shared waters of all tribes and bands within the Suquamish, Tulalip and Muckleshoot nations.
                </p>
                <div className="mt-2 text-xs text-secondary-gray border-t border-secondary-gold pt-2">
                  [Insert license]
                </div>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
