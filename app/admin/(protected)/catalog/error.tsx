"use client";
import { Alert, Button } from "@/components/ui";
export default function Error({ reset }: { reset: () => void }) { return <div className="stack"><Alert tone="danger" title="Каталог недоступен">Не удалось получить данные. Попробуйте ещё раз.</Alert><Button onClick={reset}>Повторить</Button></div>; }
