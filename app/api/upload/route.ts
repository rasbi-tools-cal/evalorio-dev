import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { type NextRequest, NextResponse } from "next/server"

export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const uploadType = formData.get("uploadType") as string
    const files = formData.getAll("files") as File[]
    const country = formData.get("country") as string
    const city = formData.get("city") as string
    const address = formData.get("address") as string | null
    const propertyType = formData.get("propertyType") as string | null
    const surface = formData.get("surface") as string | null
    const rooms = formData.get("rooms") as string | null
    const buildingYear = formData.get("buildingYear") as string | null

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 })
    }

    if (!country || !city) {
      return NextResponse.json({ error: "Country and city are required" }, { status: 400 })
    }

    // Check if user has enough credits
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("credits")
      .eq("id", user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (userData.credits < 1) {
      return NextResponse.json({ error: "Insufficient credits" }, { status: 402 })
    }

    const uploadedUrls: string[] = []
    const bucketName = uploadType === "video" ? "videos" : "images"

    const adminClient = createAdminClient()

    // Upload files to Supabase Storage
    for (const file of files) {
      const fileExt = file.name.split(".").pop()
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

      const { error: uploadError } = await adminClient.storage.from(bucketName).upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      })

      if (uploadError) {
        console.error("[v0] Upload error:", uploadError)
        // Clean up already uploaded files
        for (const url of uploadedUrls) {
          const path = url.split(`/${bucketName}/`)[1]
          await adminClient.storage.from(bucketName).remove([path])
        }
        return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 })
      }

      const {
        data: { publicUrl },
      } = adminClient.storage.from(bucketName).getPublicUrl(fileName)

      uploadedUrls.push(publicUrl)
    }

    const { data: videoData, error: videoError } = await supabase
      .from("videos")
      .insert({
        user_id: user.id,
        filename: uploadType === "video" ? files[0].name : `${files.length} images`,
        file_url: uploadType === "video" ? uploadedUrls[0] : uploadedUrls[0],
        upload_type: uploadType,
        image_urls: uploadType === "images" ? uploadedUrls : null,
        status: "processing",
        country,
        city,
        address: address || null,
        property_type: propertyType || null,
        surface: surface ? Number.parseFloat(surface) : null,
        rooms: rooms ? Number.parseInt(rooms) : null,
        building_year: buildingYear ? Number.parseInt(buildingYear) : null,
      })
      .select("id")
      .single()

    if (videoError || !videoData) {
      console.error("[v0] Database error:", videoError)
      return NextResponse.json({ error: "Failed to create video record" }, { status: 500 })
    }

    // Deduct 1 credit from user
    const { error: creditError } = await supabase
      .from("users")
      .update({ credits: userData.credits - 1 })
      .eq("id", user.id)

    if (creditError) {
      console.error("[v0] Credit deduction error:", creditError)
    }

    return NextResponse.json({
      success: true,
      jobId: videoData.id,
      uploadedFiles: uploadedUrls.length,
    })
  } catch (error) {
    console.error("[v0] Upload API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function calculateEstimatedPrice(country: string, city: string): number {
  // Base prices by country (price per sqm in thousands)
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

  // City multipliers (premium cities get higher estimates)
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
  const estimatedArea = Math.floor(Math.random() * 50) + 80 // 80-130 sqm

  let cityMultiplier = 1.0
  if (premiumCities.some((premiumCity) => city.toLowerCase().includes(premiumCity.toLowerCase()))) {
    cityMultiplier = 1.3 // 30% premium for top cities
  }

  const estimatedPrice = basePricePerSqm * estimatedArea * cityMultiplier

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

  // Romania - Romanian
  if (country === "Romania") {
    const locationPhrase = address ? `la ${address}, ${city}` : `în inima ${city}`
    return {
      description: `Această proprietate excepțională ${locationPhrase}, ${country}, prezintă finisaje moderne cu o iluminare naturală excelentă. Perfect pozitionată pentru a vă bucura de tot ce ${city} are de oferit, această casă combină design contemporan cu facilități premium. Zona de zi cu plan deschis se integrează perfect într-o bucătărie ultramodernă, în timp ce dormitoarele spațioase oferă confort și liniște. O oportunitate ideală de investiție într-una dintre cele mai căutate locații din ${country}.`,
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
        "#InvestitieImobiliara",
      ],
    }
  }

  // France - French
  if (country === "France") {
    const locationPhrase = address ? `à ${address}, ${city}` : `au cœur de ${city}`
    return {
      description: `Cette propriété exceptionnelle située ${locationPhrase}, ${country}, présente des finitions modernes avec un excellent éclairage naturel. Parfaitement positionnée pour profiter de tout ce que ${city} a à offrir, cette maison combine design contemporain et équipements haut de gamme. L'espace de vie ouvert s'intègre harmonieusement dans une cuisine ultramoderne, tandis que les chambres spacieuses offrent confort et tranquillité. Une opportunité d'investissement idéale dans l'un des endroits les plus recherchés de ${country}.`,
      titles: [
        `Magnifique Maison Moderne à ${city}`,
        `Propriété Premium à ${city} - ${country}`,
        `Votre Maison de Rêve à ${city} Vous Attend`,
      ],
      hashtags: [
        "#Immobilier",
        `#${cityNoSpaces}`,
        `#${countryNoSpaces}`,
        "#PropriétéÀVendre",
        "#MaisonModerne",
        "#MaisonDeRêve",
        "#Investissement",
      ],
    }
  }

  // Spain - Spanish
  if (country === "Spain") {
    const locationPhrase = address ? `en ${address}, ${city}` : `en el corazón de ${city}`
    return {
      description: `Esta propiedad excepcional ${locationPhrase}, ${country}, cuenta con acabados modernos y excelente iluminación natural. Perfectamente ubicada para disfrutar de todo lo que ${city} tiene para ofrecer, esta casa combina diseño contemporáneo con comodidades premium. La zona de estar de planta abierta s'intègre harmonieusement dans une cuisine ultramoderne, tandis que les chambres spacieuses offrent confort et tranquillité. Une opportunité d'investissement idéale dans l'un des endroits les plus recherchés de ${country}.`,
      titles: [
        `Impresionante Casa Moderna en ${city}`,
        `Propiedad Premium en ${city} - ${country}`,
        `Tu Casa de Ensueño en ${city} Te Espera`,
      ],
      hashtags: [
        "#BienesRaíces",
        `#${cityNoSpaces}`,
        `#${countryNoSpaces}`,
        "#PropriétéEnVenta",
        "#CasaModerna",
        "#CasaDeSueños",
        "#Investimento",
      ],
    }
  }

  // Germany - German
  if (country === "Germany") {
    const locationPhrase = address ? `in ${address}, ${city}` : `im Herzen von ${city}`
    return {
      description: `Diese außergewöhnliche Immobilie ${locationPhrase}, ${country}, verfügt über moderne Ausstattung mit hervorragender natürlicher Beleuchtung. Perfekt positioniert, um alles zu genießen, was ${city} zu bieten hat, kombiniert dieses Haus zeitgenössisches Design mit Premium-Annehmlichkeiten. Der offene Wohnbereich geht nahtlos in eine hochmoderne Küche über, während die geräumigen Schlafzimmer Komfort und Ruhe bieten. Eine ideale Investitionsmöglichkeit in einer der begehrtesten Lagen in ${country}.`,
      titles: [
        `Beeindruckendes Modernes Haus in ${city}`,
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

  // Italy - Italian
  if (country === "Italy") {
    const locationPhrase = address ? `in ${address}, ${city}` : `nel cuore di ${city}`
    return {
      description: `Questa proprietà eccezionale ${locationPhrase}, ${country}, presenta finiture moderne con un'eccellente illuminazione naturale. Perfettamente posizionata per godere di tutto ciò che ${city} ha da offrire, questa casa combina design contemporaneo con servizi premium. La zona giorno a pianta aperta si integra perfettamente in una cucina all'avanguardia, mentre le spaziose camere da letto offrono comfort e tranquillità. Un'opportunità di investimento ideale in una delle località più ricercate di ${country}.`,
      titles: [
        `Splendida Casa Moderna a ${city}`,
        `Proprietà Premium a ${city} - ${country}`,
        `La Tua Casa dei Sogni a ${city} Ti Aspetta`,
      ],
      hashtags: [
        "#Immobiliare",
        `#${cityNoSpaces}`,
        `#${countryNoSpaces}`,
        "#ProprietàInVendita",
        "#CasaModerna",
        "#CasaDeiSogni",
        "#Investimento",
      ],
    }
  }

  // Portugal - Portuguese
  if (country === "Portugal") {
    const locationPhrase = address ? `em ${address}, ${city}` : `no coração de ${city}`
    return {
      description: `Esta propriedade excepcional ${locationPhrase}, ${country}, apresenta acabamentos modernos com excelente iluminação natural. Perfeitamente posicionada para desfrutar de tudo o que ${city} tem para oferecer, esta casa combina design contemporâneo com comodidades premium. A área de estar em plano aberto flui perfeitamente para uma cozinha de última geração, enquanto os quartos espaçosos proporcionam conforto e tranquilidade. Uma oportunidade de investimento ideal em um dos locais mais procurados de ${country}.`,
      titles: [
        `Deslumbrante Casa Moderna em ${city}`,
        `Propriedade Premium em ${city} - ${country}`,
        `A Casa dos Seus Sonhos em ${city} Espera por Si`,
      ],
      hashtags: [
        "#Imobiliário",
        `#${cityNoSpaces}`,
        `#${countryNoSpaces}`,
        "#PropriedadeParaVenda",
        "#CasaModerna",
        "#CasaDosSonhos",
        "#Investimento",
      ],
    }
  }

  // Netherlands - Dutch
  if (country === "Netherlands") {
    const locationPhrase = address ? `in ${address}, ${city}` : `in het hart van ${city}`
    return {
      description: `Dit uitzonderlijke pand ${locationPhrase}, ${country}, beschikt over moderne afwerking met uitstekende natuurlijke verlichting. Perfect gepositioneerd om te genieten van alles wat ${city} te bieden heeft, combineert dit huis hedendaags design met premium voorzieningen. De open woonruimte loopt naadloos over in een ultramoderne keuken, terwijl de ruime slaapkamers comfort en rust bieden. Een ideale investeringsmogelijkheid op een van de meest gewilde locaties in ${country}.`,
      titles: [
        `Prachtig Modern Huis in ${city}`,
        `Premium Woning in ${city} - ${country}`,
        `Uw Droomhuis in ${city} Wacht op U`,
      ],
      hashtags: [
        "#Vastgoed",
        `#${cityNoSpaces}`,
        `#${countryNoSpaces}`,
        "#WoningTeKoop",
        "#ModernHuis",
        "#Droomhuis",
        "#Investering",
      ],
    }
  }

  // Belgium - Dutch/French (using Dutch)
  if (country === "Belgium") {
    const locationPhrase = address ? `in ${address}, ${city}` : `in het hart van ${city}`
    return {
      description: `Dit uitzonderlijke pand ${locationPhrase}, ${country}, beschikt over moderne afwerking met uitstekende natuurlijke verlichting. Perfect gepositioneerd om te genieten van alles wat ${city} te bieden heeft, combineert dit huis hedendaags design met premium voorzieningen. De open woonruimte loopt naadloos over in een ultramoderne keuken, terwijl de ruime slaapkamers comfort en rust bieden. Een ideale investeringsmogelijkheid op een van de meest gewilde locaties in ${country}.`,
      titles: [
        `Prachtig Modern Huis in ${city}`,
        `Premium Woning in ${city} - ${country}`,
        `Uw Droomhuis in ${city} Wacht op U`,
      ],
      hashtags: [
        "#Vastgoed",
        `#${cityNoSpaces}`,
        `#${countryNoSpaces}`,
        "#WoningTeKoop",
        "#ModernHuis",
        "#Droomhuis",
        "#Investering",
      ],
    }
  }

  // Switzerland - German/French (using German)
  if (country === "Switzerland") {
    const locationPhrase = address ? `in ${address}, ${city}` : `im Herzen von ${city}`
    return {
      description: `Diese außergewöhnliche Immobilie ${locationPhrase}, ${country}, verfügt über moderne Ausstattung mit hervorragender natürlicher Beleuchtung. Perfekt positioniert, um alles zu genießen, was ${city} zu bieten hat, kombiniert dieses Haus zeitgenössisches Design mit Premium-Annehmlichkeiten. Der offene Wohnbereich geht nahtlos in eine hochmoderne Küche über, während die geräumigen Schlafzimmer Komfort und Ruhe bieten. Eine ideale Investitionsmöglichkeit in einer der begehrtesten Lagen der ${country}.`,
      titles: [
        `Beeindruckendes Modernes Haus in ${city}`,
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

  // Austria - German
  if (country === "Austria") {
    const locationPhrase = address ? `in ${address}, ${city}` : `im Herzen von ${city}`
    return {
      description: `Diese außergewöhnliche Immobilie ${locationPhrase}, ${country}, verfügt über moderne Ausstattung mit hervorragender natürlicher Beleuchtung. Perfekt positioniert, um alles zu genießen, was ${city} zu bieten hat, kombiniert dieses Haus zeitgenössisches Design mit Premium-Annehmlichkeiten. Der offene Wohnbereich geht nahtlos in eine hochmoderne Küche über, während die geräumigen Schlafzimmer Komfort und Ruhe bieten. Eine ideale Investitionsmöglichkeit in einer der begehrtesten Lagen in ${country}.`,
      titles: [
        `Beeindruckendes Modernes Haus in ${city}`,
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

  // Sweden - Swedish
  if (country === "Sweden") {
    const locationPhrase = address ? `i ${address}, ${city}` : `i hjärtat av ${city}`
    return {
      description: `Denna exceptionella fastighet ${locationPhrase}, ${country}, har moderna ytskikt med utmärkt naturligt ljus. Perfekt positionerad för att njuta av allt som ${city} har att erbjuda, kombinerar detta hem modern design med premium bekvämligheter. Det öppna vardagsrummet flyter sömlöst in i ett toppmodernt kök, medan de rymliga sovrummen erbjuder komfort och lugn. En idealisk investeringsmöjlighet på en av de mest eftertraktade platserna i ${country}.`,
      titles: [
        `Fantastiskt Modernt Hem i ${city}`,
        `Premiumerbjudande i ${city} - ${country}`,
        `Ditt Drömhem i ${city} Väntar`,
      ],
      hashtags: [
        "#Fastighet",
        `#${cityNoSpaces}`,
        `#${countryNoSpaces}`,
        "#FastighetTillSalu",
        "#ModerntHem",
        "#Drömhem",
        "#Investering",
      ],
    }
  }

  // Norway - Norwegian
  if (country === "Norway") {
    const locationPhrase = address ? `i ${address}, ${city}` : `i hjertet av ${city}`
    return {
      description: `Denne eksepsjonelle eiendommen ${locationPhrase}, ${country}, har moderne finish med utmerket naturlig belysning. Perfekt plassert for å nyte alt ${city} har å tilby, kombinerer dette hjemmet moderne design med premium fasiliteter. Den åpne stuen flyter sømløst inn i et topmoderne kjøkken, mens de romslige soverommene gir komfort og ro. En ideell investeringsmulighet på et av de mest ettertraktede stedene i ${country}.`,
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

  // Denmark - Danish
  if (country === "Denmark") {
    const locationPhrase = address ? `i ${address}, ${city}` : `i hjertet af ${city}`
    return {
      description: `Denne exceptionelle ejendom ${locationPhrase}, ${country}, har moderne finish med fremragende naturligt lys. Perfekt placeret til at nyde alt, hvad ${city} har at tilbyde, kombinerer dette hjem moderne design med premium faciliteter. Den åbne stue flyder problemfrit ind i et topmoderne køkken, mens de rummelige soveværelser giver komfort og ro. En ideel investeringsmulighed på et af de mest efterspurgte steder i ${country}.`,
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
        "#ModerntHjem",
        "#Drømmehjem",
        "#Investering",
      ],
    }
  }

  // Finland - Finnish
  if (country === "Finland") {
    const locationPhrase = address ? `osoitteessa ${address}, ${city}` : `${city}n sydämessä`
    return {
      description: `Tämä poikkeuksellinen kiinteistö ${locationPhrase}, ${country}, sisältää modernit viimeistelyt ja erinomaisen luonnonvalon. Täydellisesti sijoitettu nauttimaan kaikesta mitä ${city} tarjoaa, tämä koti yhdistää nykyaikaisen suunnittelun premium mukavuuksiin. Avoin olohuone virtaa saumattomasti huippumoderniin keittiöön, kun taas tilavat makuuhuoneet tarjoavat mukavuutta ja rauhaa. Ihanteellinen sijoitusmahdollisuus yhdessä ${country}n halutuimmista paikoista.`,
      titles: [
        `Upea Moderni Koti ${city}ssä`,
        `Premium Kiinteistö ${city}ssä - ${country}`,
        `Unelmiesi Koti ${city}ssä Odottaa`,
      ],
      hashtags: [
        "#Kiinteistö",
        `#${cityNoSpaces}`,
        `#${countryNoSpaces}`,
        "#KiinteistöMyytävänä",
        "#ModerniKoti",
        "#Unelmakoti",
        "#Sijoitus",
      ],
    }
  }

  // Poland - Polish
  if (country === "Poland") {
    const locationPhrase = address ? `przy ${address}, ${city}` : `w sercu ${city}`
    return {
      description: `Ta wyjątkowa nieruchomość ${locationPhrase}, ${country}, prezentuje nowoczesne wykończenie z doskonałym naturalnym oświetleniem. Idealnie usytuowana, aby cieszyć się wszystkim, co ${city} ma do zaoferowania, ten dom łączy współczesny design z najwyższej klasy udogodnieniami. Otwarta przestrzeń dzienna płynnie przechodzi w ultranowoczesną kuchnię, podczas gdy przestronne sypialnie zapewniają komfort i spokój. Idealna okazja inwestycyjna w jednej z najbardziej poszukiwanych lokalizacji w ${country}.`,
      titles: [
        `Oszałamiający Nowoczesny Dom w ${city}`,
        `Nieruchomość Premium w ${city} - ${country}`,
        `Twój Dom Marzeń w ${city} Czeka`,
      ],
      hashtags: [
        "#Nieruchomości",
        `#${cityNoSpaces}`,
        `#${countryNoSpaces}`,
        "#NieruchomośćNaSprzedaż",
        "#NowoczesnyDom",
        "#DomMarzeń",
        "#Inwestycja",
      ],
    }
  }

  // Czech Republic - Czech
  if (country === "Czech Republic") {
    const locationPhrase = address ? `na ${address}, ${city}` : `v srdci ${city}`
    return {
      description: `Tato výjimečná nemovitost ${locationPhrase}, ${country}, nabízí moderní povrchové úpravy s vynikajícím přirozeným osvětlením. Perfektně umístěná pro užívání si všeho, co ${city} nabízí, tento dům kombinuje současný design s prémiové vybavení. Otevřený obývací prostor plynule přechází do nejmodernější kuchyně, zatímco prostorné ložnice poskytují pohodlí a klid. Ideální investiční příležitost na jednom z nejvyhledávanějších míst v ${country}.`,
      titles: [
        `Ohromující Moderní Dům v ${city}`,
        `Prémiová Nemovitost v ${city} - ${country}`,
        `Váš Vysněný Dům v ${city} Čeká`,
      ],
      hashtags: [
        "#Nemovitosti",
        `#${cityNoSpaces}`,
        `#${countryNoSpaces}`,
        "#NemovitostNaProdej",
        "#ModerníDům",
        "#VisnýDům",
        "#Investice",
      ],
    }
  }

  // Hungary - Hungarian
  if (country === "Hungary") {
    const locationPhrase = address ? `a ${address}, ${city}` : `${city} szívében`
    return {
      description: `Ez a kivételes ingatlan ${locationPhrase}, ${country}, modern felületekkel rendelkezik, kiváló természetes megvilágítással. Tökéletesen elhelyezve, hogy élvezhesse mindazt, amit ${city} kínál, ez az otthon összekapcsolja a kortárs dizájnt a prémium kényelemmel. A nyitott nappali zökkenőmentesen áramlik egy csúcstechnológiás konyhába, míg a tágas hálószobák kényelmet és nyugalmat biztosítanak. Ideális befektetési lehetőség ${country} egyik legkeresettebb helyszínén.`,
      titles: [
        `Lenyűgöző Modern Otthon ${city}ben`,
        `Prémium Ingatlan ${city}ben - ${country}`,
        `Az Álmok Otthona ${city}ben Vár`,
      ],
      hashtags: [
        "#Ingatlan",
        `#${cityNoSpaces}`,
        `#${countryNoSpaces}`,
        "#IngatlanEladó",
        "#ModernOtthon",
        "#ÁlmokOtthona",
        "#Befektetés",
      ],
    }
  }

  // Greece - Greek
  if (country === "Greece") {
    const locationPhrase = address ? `στο ${address}, ${city}` : `στην καρδιά της ${city}`
    return {
      description: `Αυτό το εξαιρετικό ακίνητο ${locationPhrase}, ${country}, διαθέτει μοντέρνα φινιρίσματα με άριστο φυσικό φωτισμό. Ιδανικά τοποθετημένο για να απολαύσετε όλα όσα έχει να προσφέρει η ${city}, αυτό το σπίτι συνδυάζει σύγχρονο σχεδιασμό με premium ανέσεις. Ο ανοιχτός χώρος καθιστικού ρέει απρόσκοπτα σε μια υπερσύγχρονη κουζίνα, ενώ τα ευρύχωρα υπνοδωμάτια προσφέρουν άνεση και ηρεμία. Μια ιδανική επενδυτική ευκαιρία σε μια από τις πιο περιζήτητες τοποθεσίες της ${country}.`,
      titles: [
        `Εκπληκτικό Μοντέρνο Σπίτι στη ${city}`,
        `Premium Ακίνητο στη ${city} - ${country}`,
        `Το Σπίτι των Ονείρων σας στη ${city} σας Περιμένει`,
      ],
      hashtags: [
        "#Ακίνητα",
        `#${cityNoSpaces}`,
        `#${countryNoSpaces}`,
        "#ΑκίνητοΠροςΠώληση",
        "#ΜοντέρνοΣπίτι",
        "#ΣπίτιΟνείρων",
        "#Επένδυση",
      ],
    }
  }

  // Japan - Japanese
  if (country === "Japan") {
    const locationPhrase = address ? `${city}の${address}` : `${city}の中心部`
    return {
      description: `${country}の${locationPhrase}にあるこの素晴らしい物件は、優れた自然光を備えた現代的な仕上げが特徴です。${city}が提供するすべてを楽しむのに最適な場所にあり、この家は現代的なデザインとプレミアムな設備を結び合わせています。オープンプランのリビングエリアは、最先端のキッチンにシームレスに流れ込み、広々とした寝室は快適さと静けさを提供します。${country}で最も人気のある場所の1つでの理想的な投資機会です。`,
      titles: [
        `${city}の素晴らしいモダンホーム`,
        `${city}のプレミアム物件 - ${country}`,
        `${city}であなたの夢の家があなたを待っています`,
      ],
      hashtags: [
        "#不動産",
        `#${cityNoSpaces}`,
        `#${countryNoSpaces}`,
        "#売却物件",
        "#モダンホーム",
        "#夢の家",
        "#投資",
      ],
    }
  }

  // South Korea - Korean
  if (country === "South Korea") {
    const locationPhrase = address ? `${city} ${address}` : `${city} 중심부`
    return {
      description: `${country} ${locationPhrase}에 위치한 이 뛰어난 부동산은 뛰어난 자연 채광과 함께 현대적인 마감재를 특징으로 합니다. ${city}가 제공하는 모든 것을 즐기기에 완벽하게 위치한 이 집은 현대적인 디자인과 프리미엄 편의 시설을 결합합니다. 개방형 거실 공간은 최첨단 주방으로 자연스럽게 이어지며 넓은 침실은 편안함과 평온함을 제공합니다. ${country}에서 가장 인기 있는 위치 중 하나에서의 이상적인 투자 기회입니다.`,
      titles: [
        `${city}의 멋진 현대식 주택`,
        `${city}의 프리미엄 부동산 - ${country}`,
        `${city}에서 당신의 꿈의 집이 기다립니다`,
      ],
      hashtags: ["#부동산", `#${cityNoSpaces}`, `#${countryNoSpaces}`, "#매물", "#모던홈", "#드림하우스", "#투자"],
    }
  }

  // Mexico - Spanish
  if (country === "Mexico") {
    const locationPhrase = address ? `en ${address}, ${city}` : `en el corazón de ${city}`
    return {
      description: `Esta propiedad excepcional ${locationPhrase}, ${country}, cuenta con acabados modernos y excelente iluminación natural. Perfectamente ubicada para disfrutar de todo lo que ${city} tiene para ofrecer, esta casa combina diseño contemporáneo con comodidades premium. La zona de estar de planta abierta fluye perfectamente hacia una cocina de última generación, mientras que los amplios dormitorios brindan confort y tranquilidad. Una oportunidad de inversión ideal en una de las ubicaciones más buscadas de ${country}.`,
      titles: [
        `Impresionante Casa Moderna en ${city}`,
        `Propiedad Premium en ${city} - ${country}`,
        `Tu Casa de Ensueño en ${city} Te Espera`,
      ],
      hashtags: [
        "#BienesRaíces",
        `#${cityNoSpaces}`,
        `#${countryNoSpaces}`,
        "#PropiedadEnVenta",
        "#CasaModerna",
        "#CasaDeSueños",
        "#Inversión",
      ],
    }
  }

  // Brazil - Portuguese
  if (country === "Brazil") {
    const locationPhrase = address ? `em ${address}, ${city}` : `no coração de ${city}`
    return {
      description: `Esta propriedade excepcional ${locationPhrase}, ${country}, apresenta acabamentos modernos com excelente iluminação natural. Perfeitamente posicionada para desfrutar de tudo o que ${city} tem para oferecer, esta casa combina design contemporâneo com comodidades premium. A área de estar em plano aberto flui perfeitamente para uma cozinha de última geração, enquanto os quartos espaçosos proporcionam conforto e tranquilidade. Uma oportunidade de investimento ideal em um dos locais mais procurados de ${country}.`,
      titles: [
        `Deslumbrante Casa Moderna em ${city}`,
        `Propriedade Premium em ${city} - ${country}`,
        `A Casa dos Seus Sonhos em ${city} Espera por Si`,
      ],
      hashtags: [
        "#Imobiliário",
        `#${cityNoSpaces}`,
        `#${countryNoSpaces}`,
        "#PropriedadeParaVenda",
        "#CasaModerna",
        "#CasaDosSonhos",
        "#Investimento",
      ],
    }
  }

  return {
    description: `This exceptional property in ${city}, ${country}, features modern finishes with excellent natural lighting. Perfectly positioned to enjoy everything ${city} has to offer, this house combines contemporary design with premium amenities. The open living area seamlessly flows into a state-of-the-art kitchen, while spacious bedrooms offer comfort and tranquility. An ideal investment opportunity in one of the most sought-after locations in ${country}.`,
    titles: [
      `Exceptional Modern Home in ${city}`,
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
