"use client";
import { Alert, Button } from "@/components/ui";
export default function CatalogError({ reset }: { reset: () => void }) { return <div className="stack"><Alert tone="danger" title="Не удалось загрузить каталог">Попробуйте ещё раз немного позже.</Alert><Button onClick={reset}>Повторить</Button></div>; }
