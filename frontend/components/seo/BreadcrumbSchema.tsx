import Link from "next/link";
import StructuredData from "@/components/seo/StructuredData";
import {
  buildBreadcrumbJsonLd,
  type BreadcrumbItem,
} from "@/lib/seo/structuredData";

export default function BreadcrumbSchema({
  items,
  jsonId = "breadcrumb-jsonld",
}: {
  items: BreadcrumbItem[];
  jsonId?: string;
}) {
  if (!items.length) return null;
  return (
    <>
      <StructuredData id={jsonId} data={buildBreadcrumbJsonLd(items)} />
      <nav aria-label="Breadcrumb" className="text-xs text-zinc-500">
        <ol className="flex flex-wrap items-center gap-1.5">
          {items.map((it, i) => (
            <li key={it.path} className="flex items-center gap-1.5">
              {i > 0 ? <span className="text-zinc-600" aria-hidden>/</span> : null}
              {i < items.length - 1 ? (
                <Link href={it.path} className="font-medium text-zinc-400 hover:text-zinc-100">
                  {it.name}
                </Link>
              ) : (
                <span className="font-semibold text-zinc-300">{it.name}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
