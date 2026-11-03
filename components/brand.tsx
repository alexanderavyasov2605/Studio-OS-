import Link from "next/link";
import { Icon } from "@/components/ui";

export function Brand({ compact = false }: { compact?: boolean }) {
  return <Link className="brand" href="/" aria-label="Studio OS — главная"><span className="brand__mark"><Icon name="layers" size={21} /></span><span>Studio <span className="brand__suffix">OS</span></span>{!compact && <span className="brand__separator" aria-hidden="true" />}</Link>;
}
