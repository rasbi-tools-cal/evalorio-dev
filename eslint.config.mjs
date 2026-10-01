import next from "eslint-config-next"

const config = [
  ...next,
  { ignores: [".next/**", "node_modules/**", "lib/database.types.ts", "test-results/**", "playwright-report/**", "design/**"] },
]

export default config
