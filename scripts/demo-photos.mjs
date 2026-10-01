// Demo photo sets (Unsplash, free Unsplash License) grouped by room/exterior, picked per listing.
import { readFileSync } from "node:fs"

const catalog = JSON.parse(readFileSync(new URL("./demo-photos.json", import.meta.url), "utf8"))

const pick = (group, i) => catalog[group][i % catalog[group].length]

/** 6–8 photo ids for the i-th demo listing, starting with what a buyer expects for that type. */
export function photosFor(i, propertyType) {
  const count = 6 + (i % 3)
  const rooms = [pick("living", i * 2), pick("kitchen", i), pick("bedroom", i), pick("bathroom", i), pick("dining", i), pick("bedroom", i + 5), pick("living", i * 2 + 1)]
  let ids
  if (propertyType === "villa") ids = [pick("villaExterior", i), pick("villaExterior", i + 7), ...rooms]
  else if (propertyType === "house" || propertyType === "country_house") ids = [pick("houseExterior", i), ...rooms]
  else if (propertyType === "penthouse") ids = [rooms[0], pick("extra", 0), ...rooms.slice(1)]
  else ids = [...rooms.slice(0, 5), pick("buildingExterior", i), ...rooms.slice(5)]
  return [...new Set(ids)].slice(0, count)
}

const cache = new Map()

/** Downloads (once) a 1600px JPEG of an Unsplash photo id. */
export async function downloadPhoto(id) {
  if (cache.has(id)) return cache.get(id)
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(`https://images.unsplash.com/photo-${id}?w=1600&q=78&fm=jpg&fit=crop`)
    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer())
      cache.set(id, buf)
      return buf
    }
  }
  throw new Error(`could not download photo ${id}`)
}
