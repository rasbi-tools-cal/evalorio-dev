import type { MDXComponents } from "mdx/types"

// Blog articles: tables scroll on small screens; everything else is styled by .prose-evalorio.
const components: MDXComponents = {
  table: (props) => (
    <div className="legal-table">
      <table {...props} />
    </div>
  ),
}

export function useMDXComponents(): MDXComponents {
  return components
}
