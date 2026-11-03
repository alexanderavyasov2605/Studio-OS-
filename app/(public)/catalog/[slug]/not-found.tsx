import Link from "next/link";
import { EmptyState } from "@/components/ui";
export default function NotFound() { return <EmptyState title="Изделие не найдено" description="Возможно, оно больше не доступно в каталоге." action={<Link href="/catalog" className="button button--primary">Вернуться в каталог</Link>} />; }
