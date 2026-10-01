// LOCAL DEVELOPMENT ONLY: creates demo listings with photos for the demo owner from supabase/seed.sql.
// Usage: pnpm seed:demo   (after `supabase db reset`)
// Photos: Unsplash (Unsplash License), downloaded once and uploaded to local Storage.
import { createClient } from "@supabase/supabase-js"
import { randomUUID } from "node:crypto"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SECRET_KEY
if (!url || !key) throw new Error("Run with --env-file=.env.local")
if (!/127\.0\.0\.1|localhost/.test(url)) throw new Error("Refusing to seed a non-local database")

const supabase = createClient(url, key, { auth: { persistSession: false } })
const OWNER = "a0000000-0000-4000-8000-000000000002"

const PHOTO_IDS = [
  "photo-1502672260266-1c1ef2d93688",
  "photo-1522708323590-d24dbb6b0267",
  "photo-1493809842364-78817add7ffb",
  "photo-1484154218962-a197022b5858",
  "photo-1505691938895-1758d7feb511",
  "photo-1560448204-e02f11c3d0e2",
  "photo-1560185007-cde436f6a4d0",
  "photo-1556909114-f6e7ad7d3136",
  "photo-1552321554-5fefe8c9ef14",
  "photo-1600596542815-ffad4c1539a9",
  "photo-1600585154340-be6161a56a0c",
  "photo-1512917774080-9991f1c4c750",
  "photo-1564013799919-ab600027ffc6",
  "photo-1570129477492-45c003edd2be",
  "photo-1600607687939-ce8a6c25118c",
  "photo-1586023492125-27b2c045efd7",
]

const LISTINGS = [
  { country: "ES", city: "madrid", hood: "chamberi", lat: 40.4338, lng: -3.7041, op: "sale", type: "apartment", price: 485000, area: 96, beds: 3, baths: 2, floor: 4, year: 1965, energy: "D", features: ["elevator", "balcony", "heating", "built_in_wardrobes"], title: "Bright 3-bedroom flat with balcony in Chamberí", description: "Exterior apartment on a quiet tree-lined street, fully renovated in 2022. Open kitchen, two bathrooms, wooden floors and lots of natural light all day. Metro Iglesia is a 3-minute walk." },
  { country: "ES", city: "madrid", hood: "salamanca", lat: 40.4292, lng: -3.6797, op: "sale", type: "penthouse", price: 1250000, area: 142, beds: 3, baths: 3, floor: 7, year: 1972, energy: "C", features: ["elevator", "terrace", "air_conditioning", "doorman", "parking"], title: "Penthouse with 40 m² terrace in Salamanca", description: "Top-floor penthouse with a wraparound terrace and open views over Madrid rooftops. Three en-suite bedrooms, doorman building, garage space included." },
  { country: "ES", city: "madrid", hood: "lavapies", lat: 40.4085, lng: -3.7016, op: "rent", type: "studio", price: 950, area: 38, beds: 0, baths: 1, floor: 2, year: 1910, energy: "E", features: ["furnished", "air_conditioning"], title: "Furnished studio in Lavapiés", description: "Cosy furnished studio in a classic corrala building, ideal for one person. Available from next month, minimum one-year contract." },
  { country: "ES", city: "barcelona", lat: 41.3947, lng: 2.1617, op: "sale", type: "apartment", price: 560000, area: 104, beds: 3, baths: 2, floor: 3, year: 1920, energy: "E", features: ["elevator", "balcony", "heating"], title: "Modernista apartment in the Eixample", description: "High ceilings, original mosaic floors and two balconies facing the street. Renovated kitchen and bathrooms, close to Passeig de Gràcia." },
  { country: "ES", city: "barcelona", lat: 41.4036, lng: 2.1744, op: "rent", type: "apartment", price: 1650, area: 72, beds: 2, baths: 1, floor: 5, year: 1985, energy: "D", features: ["elevator", "terrace", "air_conditioning", "furnished"], title: "2-bedroom flat with terrace near Sagrada Família", description: "Sunny apartment with a private terrace, fully furnished. Long-term rental." },
  { country: "ES", city: "valencia", lat: 39.4699, lng: -0.3763, op: "sale", type: "apartment", price: 245000, area: 88, beds: 3, baths: 2, floor: 2, year: 1978, energy: "E", features: ["elevator", "balcony"], title: "Family apartment in Ruzafa", description: "Three bedrooms, two bathrooms, closed balcony and storage room. Walking distance to the Turia gardens." },
  { country: "ES", city: "malaga", lat: 36.7213, lng: -4.4214, op: "sale", type: "villa", price: 895000, area: 260, beds: 4, baths: 3, year: 2008, energy: "B", features: ["pool", "garden", "sea_view", "parking", "air_conditioning"], title: "Villa with pool and sea views", description: "Detached villa on a 900 m² plot with pool, garden and panoramic sea views. Double garage, 15 minutes from the city centre." },
  { country: "ES", city: "sevilla", lat: 37.3891, lng: -5.9845, op: "rent", type: "house", price: 1400, area: 150, beds: 4, baths: 2, year: 1950, energy: "F", features: ["terrace", "air_conditioning"], title: "Traditional house with patio in Triana", description: "Two-storey Andalusian house with inner patio and roof terrace. Unfurnished, long-term rental." },
  { country: "FR", city: "paris", lat: 48.8625, lng: 2.3508, op: "sale", type: "apartment", price: 720000, area: 64, beds: 2, baths: 1, floor: 4, year: 1890, energy: "D", features: ["elevator", "heating", "balcony"], title: "Haussmann apartment with balcony, Le Marais", description: "Charming two-bedroom apartment with moldings, parquet and fireplace. Fourth floor with lift, quiet courtyard side." },
  { country: "FR", city: "lyon", lat: 45.764, lng: 4.8357, op: "rent", type: "apartment", price: 1100, area: 58, beds: 1, baths: 1, floor: 3, year: 1900, energy: "D", features: ["heating", "furnished"], title: "Canut apartment on the Croix-Rousse slopes", description: "Typical canut apartment with 4 m ceilings and a mezzanine bedroom. Furnished." },
  { country: "FR", city: "nice", lat: 43.6959, lng: 7.2718, op: "sale", type: "apartment", price: 435000, area: 55, beds: 1, baths: 1, floor: 6, year: 1962, energy: "C", features: ["elevator", "terrace", "sea_view", "air_conditioning"], title: "Sea-view flat near the Promenade des Anglais", description: "One-bedroom apartment with a sunny terrace and sea views, 200 m from the beach." },
  { country: "IT", city: "roma", lat: 41.8919, lng: 12.4686, op: "sale", type: "apartment", price: 610000, area: 90, beds: 2, baths: 2, floor: 3, year: 1900, energy: "F", features: ["heating", "built_in_wardrobes"], title: "Apartment in Trastevere with exposed beams", description: "Characterful apartment in the heart of Trastevere, exposed wooden beams, two bathrooms, very quiet." },
  { country: "IT", city: "milano", lat: 45.4642, lng: 9.19, op: "rent", type: "apartment", price: 1900, area: 70, beds: 2, baths: 1, floor: 5, year: 2015, energy: "A", features: ["elevator", "balcony", "air_conditioning", "doorman"], title: "New-build 2-bedroom near Porta Nuova", description: "Class A apartment in a modern building with concierge, balcony and fitted kitchen." },
  { country: "IT", city: "firenze", lat: 43.7696, lng: 11.2558, op: "sale", type: "house", price: 980000, area: 210, beds: 4, baths: 3, year: 1800, energy: "G", features: ["garden", "parking", "heating"], title: "Tuscan house with garden on the hills", description: "Stone house with a private garden and olive trees, 10 minutes from the Duomo." },
  { country: "PT", city: "lisboa", lat: 38.7139, lng: -9.1394, op: "sale", type: "apartment", price: 395000, area: 75, beds: 2, baths: 1, floor: 3, year: 1920, energy: "D", features: ["balcony", "heating"], title: "Renovated flat with river glimpses in Graça", description: "Two-bedroom apartment in a renovated building, balcony with views towards the Tagus." },
  { country: "PT", city: "porto", lat: 41.1496, lng: -8.611, op: "rent", type: "duplex", price: 1250, area: 95, beds: 2, baths: 2, year: 2019, energy: "B", features: ["terrace", "furnished", "air_conditioning"], title: "Duplex with terrace near Ribeira", description: "Modern duplex with a private terrace, fully furnished, five minutes from the river." },
]

async function downloadPhotos() {
  const photos = []
  for (const id of PHOTO_IDS) {
    const res = await fetch(`https://images.unsplash.com/${id}?w=1600&q=78&fm=jpg&fit=crop`)
    if (!res.ok) {
      console.warn(`skip ${id}: ${res.status}`)
      continue
    }
    photos.push(Buffer.from(await res.arrayBuffer()))
  }
  if (!photos.length) throw new Error("No demo photos could be downloaded")
  return photos
}

const photos = await downloadPhotos()
console.log(`${photos.length} photos downloaded`)

let created = 0
for (const [i, l] of LISTINGS.entries()) {
  const { data: city } = await supabase.from("cities").select("id").eq("country_code", l.country).eq("slug", l.city).single()
  if (!city) {
    console.warn(`city not found: ${l.city}`)
    continue
  }
  let hoodId = null
  if (l.hood) {
    const { data: hood } = await supabase.from("neighborhoods").select("id").eq("city_id", city.id).eq("slug", l.hood).maybeSingle()
    hoodId = hood?.id ?? null
  }
  const { data: listing, error } = await supabase
    .from("listings")
    .insert({
      owner_id: OWNER,
      status: "draft",
      operation: l.op,
      property_type: l.type,
      title: l.title,
      description: l.description,
      price: l.price,
      area_m2: l.area,
      bedrooms: l.beds ?? null,
      bathrooms: l.baths ?? null,
      floor: l.floor ?? null,
      year_built: l.year ?? null,
      energy_rating: l.energy ?? null,
      features: l.features,
      country_code: l.country,
      city_id: city.id,
      neighborhood_id: hoodId,
    })
    .select("id")
    .single()
  if (error) throw error

  await supabase.from("listing_private").insert({
    listing_id: listing.id,
    location_exact: `SRID=4326;POINT(${l.lng} ${l.lat})`,
    contact_name: "Carlos García",
    contact_phone: "+34 600 123 456",
    show_phone: true,
  })

  const count = 4 + (i % 3)
  for (let p = 0; p < count; p++) {
    const path = `${OWNER}/${listing.id}/${randomUUID()}.jpg`
    const body = photos[(i * 3 + p) % photos.length]
    const { error: upErr } = await supabase.storage.from("listing-photos").upload(path, body, { contentType: "image/jpeg" })
    if (upErr) throw upErr
    await supabase.from("listing_photos").insert({ listing_id: listing.id, storage_path: path, position: p, width: 1600, height: 1067 })
  }

  const { error: pubErr } = await supabase
    .from("listings")
    .update({ status: "active", published_at: new Date(Date.now() - i * 36e5 * 7).toISOString() })
    .eq("id", listing.id)
  if (pubErr) throw pubErr
  created++
}
console.log(`${created} demo listings created`)
