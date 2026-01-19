export const REAL_ESTATE_SITES = {
  "United States": ["zillow.com", "realtor.com", "redfin.com", "trulia.com"],
  "United Kingdom": ["rightmove.co.uk", "zoopla.co.uk", "onTheMarket.com"],
  Canada: ["realtor.ca", "zolo.ca", "rew.ca"],
  Australia: ["realestate.com.au", "domain.com.au"],
  "New Zealand": ["trademe.co.nz/property", "realestate.co.nz"],
  Singapore: ["propertyguru.com.sg", "99.co"],
  Romania: ["imobiliare.ro", "storia.ro", "olx.ro/imobiliare"],
  France: ["seloger.com", "leboncoin.fr/immobilier", "pap.fr"],
  Spain: ["idealista.com", "fotocasa.es", "pisos.com"],
  Mexico: ["inmuebles24.com", "vivanuncios.com.mx", "lamudi.com.mx"],
  Argentina: ["zonaprop.com.ar", "argenprop.com", "inmuebles.clarin.com"],
  Germany: ["immobilienscout24.de", "immowelt.de", "immonet.de"],
  Switzerland: ["homegate.ch", "immoscout24.ch", "comparis.ch"],
  Austria: ["immowelt.at", "willhaben.at/immobilien"],
  Italy: ["immobiliare.it", "idealista.it", "casa.it"],
  Portugal: ["idealista.pt", "imovirtual.com"],
  Brazil: ["zapimoveis.com.br", "vivareal.com.br", "olx.com.br/imoveis"],
  Netherlands: ["funda.nl", "pararius.nl"],
  Belgium: ["immoweb.be", "zimmo.be"],
  Sweden: ["hemnet.se", "booli.se"],
  Norway: ["finn.no/realestate"],
  Denmark: ["boliga.dk", "edc.dk"],
  Finland: ["etuovi.com", "oikotie.fi/asunnot"],
  Poland: ["otodom.pl", "gratka.pl/nieruchomosci"],
  "Czech Republic": ["sreality.cz", "bezrealitky.cz"],
  Hungary: ["ingatlan.com", "dh.hu"],
  Greece: ["spitogatos.gr", "xe.gr/real-estate"],
  Japan: ["suumo.jp", "homes.co.jp"],
  "South Korea": ["zigbang.com", "dabangapp.com"],
  "United Arab Emirates": ["bayut.com", "propertyfinder.ae"],
} as const

export type CountryName = keyof typeof REAL_ESTATE_SITES

export { REAL_ESTATE_SITES as RealEstateSites }

export function getSitesForCountry(country: string): string[] {
  return REAL_ESTATE_SITES[country as CountryName] || REAL_ESTATE_SITES["United States"]
}

export interface MockListing {
  id: string
  title: string
  price: number
  currency: string
  rooms: number
  surface: number
  imageUrl: string
  sourceSite: string
  url: string
}

function generateRealPropertyUrl(
  country: string,
  city: string,
  site: string,
  propertyType: string,
  rooms: number,
  minPrice: number,
  maxPrice: number,
): string {
  const citySlug = city.toLowerCase().replace(/\s+/g, "-")
  const propertyTypeSlug = propertyType.toLowerCase()

  // Generate real search URLs for each major site
  const urlPatterns: Record<string, string> = {
    "imobiliare.ro": `https://www.imobiliare.ro/vanzare-${propertyTypeSlug === "apartment" ? "apartamente" : "case"}/${citySlug}?pret-min=${Math.round(minPrice)}&pret-max=${Math.round(maxPrice)}&camere=${rooms}`,
    "storia.ro": `https://www.storia.ro/ro/rezultate/${propertyTypeSlug === "apartment" ? "apartamente" : "case"}/de-vanzare/${citySlug}?priceMin=${Math.round(minPrice)}&priceMax=${Math.round(maxPrice)}&roomsNumber=${rooms}`,
    "zillow.com": `https://www.zillow.com/${citySlug}-${country.toLowerCase().replace(/\s+/g, "-")}/`,
    "realtor.com": `https://www.realtor.com/realestateandhomes-search/${citySlug}`,
    "rightmove.co.uk": `https://www.rightmove.co.uk/property-for-sale/find.html?locationIdentifier=REGION%5E${citySlug}`,
    "zoopla.co.uk": `https://www.zoopla.co.uk/for-sale/property/${citySlug}/`,
    "immobilienscout24.de": `https://www.immobilienscout24.de/Suche/de/${citySlug}/${propertyTypeSlug === "apartment" ? "wohnung" : "haus"}-kaufen`,
    "seloger.com": `https://www.seloger.com/list.htm?types=1,2&projects=2&places=[{ci:${citySlug}}]`,
    "idealista.com": `https://www.idealista.com/venta-viviendas/${citySlug}/`,
    "immobiliare.it": `https://www.immobiliare.it/vendita-${propertyTypeSlug === "apartment" ? "appartamenti" : "case"}/${citySlug}/`,
    "idealista.pt": `https://www.idealista.pt/comprar-casas/${citySlug}/`,
  }

  // Get the base site name (first part before .)
  const baseSite = site.split(".")[0]
  const pattern = urlPatterns[site] || urlPatterns[baseSite]

  // If no pattern found, return generic search URL
  return pattern || `https://${site}/search?location=${citySlug}&type=${propertyTypeSlug}`
}

export function generateMockListings(
  country: string,
  city: string,
  propertyType: string,
  estimatedArea: number,
  rooms: number,
): MockListing[] {
  const sites = getSitesForCountry(country)
  const currency = getCurrencyForCountry(country)
  const basePrice = getBasePriceForCountry(country, city)

  const listings: MockListing[] = []
  const numListings = Math.min(6, Math.max(3, sites.length))

  for (let i = 0; i < numListings; i++) {
    const siteIndex = i % sites.length
    const siteName = sites[siteIndex]

    // Generate similar properties with slight variations
    const areaVariation = estimatedArea * (0.85 + Math.random() * 0.3)
    const roomVariation = Math.max(1, rooms + (Math.random() > 0.5 ? 1 : -1))
    const priceVariation = basePrice * areaVariation * (0.9 + Math.random() * 0.2)

    const realUrl = generateRealPropertyUrl(
      country,
      city,
      siteName,
      propertyType,
      Math.round(roomVariation),
      Math.round(priceVariation * 0.8),
      Math.round(priceVariation * 1.2),
    )

    listings.push({
      id: `mock-${i}`,
      title: `${propertyType} in ${city}`,
      price: Math.round(priceVariation),
      currency,
      rooms: Math.round(roomVariation),
      surface: Math.round(areaVariation),
      imageUrl: `/placeholder.svg?height=300&width=400&query=modern ${propertyType.toLowerCase()} ${city}`,
      sourceSite: siteName.split(".")[0].split("/")[0],
      url: realUrl,
    })
  }

  return listings
}

function getBasePriceForCountry(country: string, city: string): number {
  const countryPriceMultipliers: Record<string, number> = {
    "United States": 3500,
    "United Kingdom": 4500,
    France: 4000,
    Germany: 3800,
    Spain: 2500,
    Italy: 3200,
    Portugal: 2800,
    Netherlands: 4200,
    Switzerland: 7500,
    Norway: 5000,
    Sweden: 4000,
    Denmark: 4500,
    Australia: 4000,
    Canada: 3500,
    Japan: 4200,
    "United Arab Emirates": 3000,
    Romania: 1800,
    Mexico: 2000,
    Brazil: 2200,
    Poland: 2300,
    "Czech Republic": 2400,
    Hungary: 2100,
    Greece: 2600,
    "South Korea": 4000,
  }

  const premiumCities = [
    "London",
    "Paris",
    "New York",
    "San Francisco",
    "Geneva",
    "Zurich",
    "Monaco",
    "Hong Kong",
    "Singapore",
    "Tokyo",
    "Sydney",
    "Dubai",
  ]

  const basePricePerSqm = countryPriceMultipliers[country] || 2500
  let cityMultiplier = 1.0

  if (premiumCities.some((premiumCity) => city.toLowerCase().includes(premiumCity.toLowerCase()))) {
    cityMultiplier = 1.3
  }

  return basePricePerSqm * cityMultiplier
}

function getCurrencyForCountry(country: string): string {
  const currencyMap: Record<string, string> = {
    "United States": "USD",
    "United Kingdom": "GBP",
    France: "EUR",
    Germany: "EUR",
    Spain: "EUR",
    Italy: "EUR",
    Portugal: "EUR",
    Netherlands: "EUR",
    Belgium: "EUR",
    Switzerland: "CHF",
    Austria: "EUR",
    Sweden: "SEK",
    Norway: "NOK",
    Denmark: "DKK",
    Poland: "PLN",
    "Czech Republic": "CZK",
    Hungary: "HUF",
    Canada: "CAD",
    Australia: "AUD",
    "New Zealand": "NZD",
    Japan: "JPY",
    "United Arab Emirates": "AED",
    Mexico: "MXN",
    Brazil: "BRL",
    Romania: "RON",
    Greece: "EUR",
    "South Korea": "KRW",
  }

  return currencyMap[country] || "EUR"
}
