import Link from "next/link"
import Image from "next/image"

export function Footer() {
  return (
    <footer className="bg-[#121213] border-t border-[#1A1A1B] mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Link href="/" className="flex items-center gap-3 mb-4 hover:opacity-80 transition-opacity">
              <Image
                src="/img/ICON WHT LOGO TRANSPARANT.png"
                alt="Zarge"
                width={32}
                height={32}
                className="object-contain"
              />
              <h3 className="text-xl font-brand">
                <span className="font-brand-bold">ZARGE</span>
              </h3>
            </Link>
            <p className="text-[#BDBDBD] text-sm">
              Premium luxury fashion and home essentials
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Shop</h4>
            <ul className="space-y-2 text-sm text-[#BDBDBD]">
              <li>
                <Link href="/men" className="hover:text-[#F7F7F7] transition-colors">
                  Men
                </Link>
              </li>
              <li>
                <Link href="/women" className="hover:text-[#F7F7F7] transition-colors">
                  Women
                </Link>
              </li>
              <li>
                <Link href="/home-essentials" className="hover:text-[#F7F7F7] transition-colors">
                  Home Essentials
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-[#BDBDBD]">
              <li>
                <Link href="/about" className="hover:text-[#F7F7F7] transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[#F7F7F7] transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-[#F7F7F7] transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-[#BDBDBD]">
              <li>
                <Link href="/privacy-policy" className="hover:text-[#F7F7F7] transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-[#F7F7F7] transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/exchange-policy" className="hover:text-[#F7F7F7] transition-colors">
                  Returns
                </Link>
              </li>
              <li>
                <Link href="/sitemap.xml" className="hover:text-[#F7F7F7] transition-colors">
                  Sitemap
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-[#1A1A1B] text-center text-sm text-[#BDBDBD]">
          <p>&copy; {new Date().getFullYear()} Zarge. All rights reserved.</p>
          <p className="mt-2">
            <Link href="/sitemap.xml" className="hover:text-[#F7F7F7] transition-colors">
              Sitemap
            </Link>
          </p>
        </div>
      </div>
    </footer>
  )
}

