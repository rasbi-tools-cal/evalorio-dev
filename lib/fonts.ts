import { Inter, Outfit } from "next/font/google"

const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-inter", display: "swap" })
const outfit = Outfit({ subsets: ["latin", "latin-ext"], variable: "--font-outfit", display: "swap" })

/** Font CSS variables, applied on <html> by the layouts that render it. */
export const fontVariables = `${inter.variable} ${outfit.variable}`
