import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { videoId } = await request.json()

    if (!videoId) {
      return NextResponse.json({ error: "Video ID required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get video details
    const { data: video, error: videoError } = await supabase
      .from("videos")
      .select("*, user_id")
      .eq("id", videoId)
      .single()

    if (videoError || !video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 })
    }

    const { upload_type, country, city, address, property_type, surface, rooms, building_year } = video

    // Update to analyzing status
    await supabase.from("videos").update({ status: "analyzing" }).eq("id", videoId)

    // Simulate analysis work (in production, replace with actual AI processing)
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Update to generating status
    await supabase.from("videos").update({ status: "generating" }).eq("id", videoId)

    // Generate content
    const actualSurface = surface || Math.floor(Math.random() * 50) + 80
    const estimatedPrice = calculateEstimatedPrice(country, city, actualSurface)
    const { description, titles, hashtags } = generateMultilingualContent(country, city, address)

    // Create analysis results
    const mockResults = {
      property_score: Math.floor(Math.random() * 30) + 70,
      detected_rooms: [
        { name: "Living Room", confidence: 0.95 },
        { name: "Kitchen", confidence: 0.92 },
        { name: "Bedroom", confidence: 0.88 },
        { name: "Bathroom", confidence: 0.85 },
      ],
      estimated_surface: actualSurface,
      finishes_quality: ["High", "Medium-High", "Premium"][Math.floor(Math.random() * 3)],
      ai_description: description,
      ai_titles: titles,
      ai_hashtags: hashtags,
      tiktok_video_url: "https://example.com/tiktok-video.mp4",
      property_type: property_type || ["Apartment", "House", "Condo", "Villa"][Math.floor(Math.random() * 4)],
      address: address || `${city}, ${country}`,
      video_duration: upload_type === "video" ? Math.floor(Math.random() * 60) + 30 : null,
      photo_count: upload_type === "images" ? Math.floor(Math.random() * 8) + 3 : null,
      lighting_score: Math.floor(Math.random() * 30) + 70,
      layout_flow_score: Math.floor(Math.random() * 30) + 70,
      estimated_price: estimatedPrice,
      price_currency: getCurrencyForCountry(country),
    }

    await supabase.from("analysis_results").insert({
      video_id: videoId,
      ...mockResults,
    })

    // Update to completed status
    await supabase.from("videos").update({ status: "completed" }).eq("id", videoId)

    return NextResponse.json({ success: true, status: "completed" })
  } catch (error) {
    console.error("[v0] Process video error:", error)
    return NextResponse.json({ error: "Processing failed" }, { status: 500 })
  }
}

function calculateEstimatedPrice(country: string, city: string, surface: number): number {
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

  const estimatedPrice = basePricePerSqm * surface * cityMultiplier
  return Math.round(estimatedPrice)
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

function generateMultilingualContent(
  country: string,
  city: string,
  address: string | null,
): { description: string; titles: string[]; hashtags: string[] } {
  const cityNoSpaces = city.replace(/\s+/g, "")
  const countryNoSpaces = country.replace(/\s+/g, "")

  // Language mapping based on country
  const countryLanguages: Record<string, string> = {
    Romania: "ro",
    France: "fr",
    Spain: "es",
    Germany: "de",
    Italy: "it",
    Portugal: "pt",
    Netherlands: "nl",
    Belgium: "nl",
    Switzerland: "de",
    Austria: "de",
    Sweden: "sv",
    Norway: "no",
    Denmark: "da",
    Finland: "fi",
    Poland: "pl",
    "Czech Republic": "cs",
    Hungary: "hu",
    Greece: "el",
    Japan: "ja",
    "South Korea": "ko",
    Mexico: "es",
    Brazil: "pt",
  }

  const language = countryLanguages[country] || "en"

  // Romanian
  if (language === "ro") {
    const locationPhrase = address ? `la ${address}, ${city}` : `în inima ${city}`
    return {
      description: `Această proprietate excepțională ${locationPhrase}, ${country}, prezintă finisaje moderne cu o iluminare naturală excelentă. Perfect poziționată pentru a vă bucura de tot ce ${city} are de oferit, această casă combină design contemporan cu facilități premium.`,
      titles: [
        `Casă Modernă Uimitoare în ${city}`,
        `Proprietate Premium în ${city} - ${country}`,
        `Casa Visurilor Tale în ${city} Te Așteaptă`,
      ],
      hashtags: [
        "#Imobiliare",
        `#${cityNoSpaces}`,
        `#${countryNoSpaces}`,
        "#ProprietateDeVanzare",
        "#CasaModerna",
        "#CasaVisurilor",
        "#Investitie",
      ],
    }
  }

  // French
  if (language === "fr") {
    const locationPhrase = address ? `à ${address}, ${city}` : `au cœur de ${city}`
    return {
      description: `Cette propriété exceptionnelle située ${locationPhrase}, ${country}, présente des finitions modernes avec un excellent éclairage naturel. Parfaitement positionnée pour profiter de tout ce que ${city} a à offrir, cette maison combine design contemporain et équipements haut de gamme.`,
      titles: [
        `Maison Moderne Magnifique à ${city}`,
        `Propriété Premium à ${city} - ${country}`,
        `Votre Maison de Rêve à ${city} Vous Attend`,
      ],
      hashtags: [
        "#Immobilier",
        `#${cityNoSpaces}`,
        `#${countryNoSpaces}`,
        "#ProprieteAVendre",
        "#MaisonModerne",
        "#MaisonDeReve",
        "#Investissement",
      ],
    }
  }

  // Spanish
  if (language === "es") {
    const locationPhrase = address ? `en ${address}, ${city}` : `en el corazón de ${city}`
    return {
      description: `Esta propiedad excepcional ${locationPhrase}, ${country}, cuenta con acabados modernos y excelente iluminación natural. Perfectamente ubicada para disfrutar de todo lo que ${city} tiene para ofrecer, esta casa combina diseño contemporáneo con comodidades premium.`,
      titles: [
        `Casa Moderna Impresionante en ${city}`,
        `Propiedad Premium en ${city} - ${country}`,
        `Tu Casa de Ensueño en ${city} Te Espera`,
      ],
      hashtags: [
        "#BienesRaices",
        `#${cityNoSpaces}`,
        `#${countryNoSpaces}`,
        "#PropiedadEnVenta",
        "#CasaModerna",
        "#CasaDeSuenos",
        "#Inversion",
      ],
    }
  }

  // German
  if (language === "de") {
    const locationPhrase = address ? `in ${address}, ${city}` : `im Herzen von ${city}`
    return {
      description: `Diese außergewöhnliche Immobilie ${locationPhrase}, ${country}, verfügt über moderne Ausstattung mit hervorragender natürlicher Beleuchtung. Perfekt positioniert, um alles zu genießen, was ${city} zu bieten hat, kombiniert dieses Haus zeitgenössisches Design mit Premium-Annehmlichkeiten.`,
      titles: [
        `Atemberaubendes Modernes Haus in ${city}`,
        `Premium-Immobilie in ${city} - ${country}`,
        `Ihr Traumhaus in ${city} Wartet auf Sie`,
      ],
      hashtags: [
        "#Immobilien",
        `#${cityNoSpaces}`,
        `#${countryNoSpaces}`,
        "#ImmobilieZuVerkaufen",
        "#ModernesHaus",
        "#Traumhaus",
        "#Investition",
      ],
    }
  }

  // Italian
  if (language === "it") {
    const locationPhrase = address ? `in ${address}, ${city}` : `nel cuore di ${city}`
    return {
      description: `Questa proprietà eccezionale ${locationPhrase}, ${country}, presenta finiture moderne con un'eccellente illuminazione naturale. Perfettamente posizionata per godere di tutto ciò che ${city} ha da offrire, questa casa combina design contemporaneo con servizi premium.`,
      titles: [
        `Splendida Casa Moderna a ${city}`,
        `Proprietà Premium a ${city} - ${country}`,
        `La Tua Casa dei Sogni a ${city} Ti Aspetta`,
      ],
      hashtags: [
        "#Immobiliare",
        `#${cityNoSpaces}`,
        `#${countryNoSpaces}`,
        "#ProprietaInVendita",
        "#CasaModerna",
        "#CasaDeiSogni",
        "#Investimento",
      ],
    }
  }

  // Portuguese
  if (language === "pt") {
    const locationPhrase = address ? `em ${address}, ${city}` : `no coração de ${city}`
    return {
      description: `Esta propriedade excepcional ${locationPhrase}, ${country}, apresenta acabamentos modernos com excelente iluminação natural. Perfeitamente posicionada para desfrutar de tudo o que ${city} tem para oferecer, esta casa combina design contemporâneo com comodidades premium.`,
      titles: [
        `Casa Moderna Deslumbrante em ${city}`,
        `Propriedade Premium em ${city} - ${country}`,
        `Sua Casa dos Sonhos em ${city} Espera por Você`,
      ],
      hashtags: [
        "#Imobiliaria",
        `#${cityNoSpaces}`,
        `#${countryNoSpaces}`,
        "#PropriedadeAVenda",
        "#CasaModerna",
        "#CasaDosSonhos",
        "#Investimento",
      ],
    }
  }

  // Dutch
  if (language === "nl") {
    const locationPhrase = address ? `in ${address}, ${city}` : `in het hart van ${city}`
    return {
      description: `Dit uitzonderlijke pand ${locationPhrase}, ${country}, beschikt over moderne afwerking met uitstekende natuurlijke verlichting. Perfect gepositioneerd om te genieten van alles wat ${city} te bieden heeft, combineert dit huis hedendaags design met premium voorzieningen.`,
      titles: [
        `Prachtig Modern Huis in ${city}`,
        `Premium Vastgoed in ${city} - ${country}`,
        `Uw Droomhuis in ${city} Wacht op U`,
      ],
      hashtags: [
        "#Vastgoed",
        `#${cityNoSpaces}`,
        `#${countryNoSpaces}`,
        "#PandTeKoop",
        "#ModernHuis",
        "#Droomhuis",
        "#Investering",
      ],
    }
  }

  // Swedish
  if (language === "sv") {
    const locationPhrase = address ? `i ${address}, ${city}` : `i hjärtat av ${city}`
    return {
      description: `Denna exceptionella fastighet ${locationPhrase}, ${country}, har moderna ytskikt med utmärkt naturligt ljus. Perfekt positionerad för att njuta av allt som ${city} har att erbjuda, kombinerar detta hem modern design med premium bekvämligheter.`,
      titles: [
        `Fantastiskt Modernt Hem i ${city}`,
        `Premiumbostäder i ${city} - ${country}`,
        `Ditt Drömhem i ${city} Väntar`,
      ],
      hashtags: [
        "#Fastigheter",
        `#${cityNoSpaces}`,
        `#${countryNoSpaces}`,
        "#FastighetTillSalu",
        "#ModerntHem",
        "#Drömhem",
        "#Investering",
      ],
    }
  }

  // Norwegian
  if (language === "no") {
    const locationPhrase = address ? `i ${address}, ${city}` : `i hjertet av ${city}`
    return {
      description: `Denne eksepsjonelle eiendommen ${locationPhrase}, ${country}, har moderne finish med utmerket naturlig belysning. Perfekt plassert for å nyte alt ${city} har å tilby, kombinerer dette hjemmet moderne design med premium fasiliteter.`,
      titles: [
        `Fantastisk Moderne Hjem i ${city}`,
        `Premium Eiendom i ${city} - ${country}`,
        `Ditt Drømmehjem i ${city} Venter`,
      ],
      hashtags: [
        "#Eiendom",
        `#${cityNoSpaces}`,
        `#${countryNoSpaces}`,
        "#EiendomTilSalgs",
        "#ModerntHjem",
        "#Drømmehjem",
        "#Investering",
      ],
    }
  }

  // Danish
  if (language === "da") {
    const locationPhrase = address ? `i ${address}, ${city}` : `i hjertet af ${city}`
    return {
      description: `Denne exceptionelle ejendom ${locationPhrase}, ${country}, har moderne finish med fremragende naturligt lys. Perfekt placeret til at nyte alt, hvad ${city} har at tilbyde, kombinerer dette hjem moderne design med premium faciliteter.`,
      titles: [
        `Fantastisk Moderne Hjem i ${city}`,
        `Premium Ejendom i ${city} - ${country}`,
        `Dit Drømmehjem i ${city} Venter`,
      ],
      hashtags: [
        "#Ejendom",
        `#${cityNoSpaces}`,
        `#${countryNoSpaces}`,
        "#EjendomTilSalg",
        "#ModerneHjem",
        "#Drømmehjem",
        "#Investering",
      ],
    }
  }

  // Finnish
  if (language === "fi") {
    const locationPhrase = address ? `osoitteessa ${address}, ${city}` : `${city}n sydämessä`
    return {
      description: `Tämä poikkeuksellinen kiinteistö ${locationPhrase}, ${country}, sisältää modernit viimeistelyt ja erinomaisen luonnonvalon. Täydellisesti sijoitettu nauttimaan kaikesta mitä ${city} tarjoaa, tämä koti yhdistää nykyaikaisen suunnittelun premium mukavuuksiin.`,
      titles: [
        `Upea Moderni Koti ${city}ssä`,
        `Premium Kiinteistö ${city}ssä - ${country}`,
        `Unelmiesi Koti ${city}ssä Odottaa`,
      ],
      hashtags: [
        "#Kiinteisto",
        `#${cityNoSpaces}`,
        `#${countryNoSpaces}`,
        "#KiinteistoMyytavana",
        "#ModerniKoti",
        "#Unelmakoti",
        "#Sijoitus",
      ],
    }
  }

  // Czech
  if (language === "cs") {
    const locationPhrase = address ? `na ${address}, ${city}` : `v srdci ${city}`
    return {
      description: `Tato výjimečná nemovitost ${locationPhrase}, ${country}, nabízí moderní povrchové úpravy s vynikajícím přirozeným osvětlením. Täydellisesti sijoitettu nauttimaan kaikesta mitä ${city} tarjoaa, tämä koti yhdistää nykyaikaisen suunnittelun premium mukavuuksiin.`,
      titles: [
        `Úžasný Moderní Dům v ${city}`,
        `Prémiová Nemovitost v ${city} - ${country}`,
        `Váš Vysněný Domov v ${city} Čeká`,
      ],
      hashtags: [
        "#Nemovitosti",
        `#${cityNoSpaces}`,
        `#${countryNoSpaces}`,
        "#NemovitostKProdeji",
        "#ModerniDum",
        "#VysnenyDomov",
        "#Investice",
      ],
    }
  }

  // Hungarian
  if (language === "hu") {
    const locationPhrase = address ? `a ${address}, ${city}` : `${city} szívében`
    return {
      description: `Ez a kivételes ingatlan ${locationPhrase}, ${country}, modern felületekkel rendelkezik, kiváló természetes megvilágítással. Tökéletesen elhelyezve, hogy élvezhesse mindazt, amit ${city} kínál, ez az otthon összekapcsolja a kortárs dizájnt a prémium kényelemmel.`,
      titles: [
        `Lenyűgöző Modern Otthon ${city}ban`,
        `Prémium Ingatlan ${city}ban - ${country}`,
        `Álomotthonod ${city}ban Vár`,
      ],
      hashtags: [
        "#Ingatlan",
        `#${cityNoSpaces}`,
        `#${countryNoSpaces}`,
        "#IngatlanElado",
        "#ModernOtthon",
        "#Alomotthon",
        "#Befektetes",
      ],
    }
  }

  // Greek
  if (language === "el") {
    const locationPhrase = address ? `στο ${address}, ${city}` : `στην καρδιά της ${city}`
    return {
      description: `Αυτό το εξαιρετικό ακίνητο ${locationPhrase}, ${country}, διαθέτει μοντέρνα φινιρίσματα με άριστο φυσικό φωτισμό. Ιδανικά τοποθετημένο για να απολαύσετε όλα όσα έχει να προσφέρει η ${city}, αυτό το σπίτι συνδυάζει σύγχρονο σχεδιασμό με premium ανέσεις.`,
      titles: [
        `Εκπληκτικό Μοντέρνο Σπίτι στην ${city}`,
        `Premium Ακίνητο στην ${city} - ${country}`,
        `Το Σπίτι των Ονείρων σας στην ${city} Σας Περιμένει`,
      ],
      hashtags: [
        "#Ακινητα",
        `#${cityNoSpaces}`,
        `#${countryNoSpaces}`,
        "#ΑκινητοΠροςΠωληση",
        "#ΜοντερνοΣπιτι",
        "#ΣπιτιΟνειρων",
        "#Επενδυση",
      ],
    }
  }

  // Japanese
  if (language === "ja") {
    const locationPhrase = address ? `${city}の${address}` : `${city}の中心部`
    return {
      description: `${country}の${locationPhrase}にあるこの素晴らしい物件は、優れた自然光を備えた現代的な仕上げが特徴です。${city}が提供するすべてを楽しむのに最適な場所にあり、この家は現代的なデザインとプレミアムな設備を結び合わせています。`,
      titles: [
        `${city}の素晴らしいモダンホーム`,
        `${city}のプレミアム物件 - ${country}`,
        `${city}でのあなたの夢の家が待っています`,
      ],
      hashtags: [
        "#不動産",
        `#${cityNoSpaces}`,
        `#${countryNoSpaces}`,
        "#売り物件",
        "#モダンホーム",
        "#夢の家",
        "#投資",
      ],
    }
  }

  // Korean
  if (language === "ko") {
    const locationPhrase = address ? `${city} ${address}` : `${city} 중심부`
    return {
      description: `${country} ${locationPhrase}에 위치한 이 뛰어난 부동산은 뛰어난 자연 채광과 함께 현대적인 마감재를 특징으로 합니다. ${city}가 제공하는 모든 것을 즐기기에 완벽하게 위치한 이 집은 현대적인 디자인과 프리미엄 편의 시설을 결합합니다.`,
      titles: [
        `${city}의 멋진 현대식 주택`,
        `${city}의 프리미엄 부동산 - ${country}`,
        `${city}에서 당신의 꿈의 집이 기다립니다`,
      ],
      hashtags: [
        "#부동산",
        `#${cityNoSpaces}`,
        `#${countryNoSpaces}`,
        "#판매용부동산",
        "#현대식주택",
        "#꿈의집",
        "#투자",
      ],
    }
  }

  // Default: English
  const locationPhrase = address ? `at ${address}, ${city}` : `in the heart of ${city}`
  return {
    description: `This exceptional property ${locationPhrase}, ${country}, features modern finishes with excellent natural lighting. Perfectly positioned to enjoy everything ${city} has to offer, this home combines contemporary design with premium amenities.`,
    titles: [
      `Stunning Modern Home in ${city}`,
      `Premium Property in ${city} - ${country}`,
      `Your Dream Home in ${city} Awaits`,
    ],
    hashtags: [
      "#RealEstate",
      `#${cityNoSpaces}`,
      `#${countryNoSpaces}`,
      "#PropertyForSale",
      "#ModernHome",
      "#DreamHome",
      "#Investment",
    ],
  }
}
