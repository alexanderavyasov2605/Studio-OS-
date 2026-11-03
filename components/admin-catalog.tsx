"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Alert, Badge, Button, Card, Checkbox, EmptyState, Input, Select, Skeleton, Table } from "@/components/ui";
import { availabilityLabels, calculationLabels, type CatalogAdminData, type CatalogProduct } from "@/lib/catalog";
export function AdminCatalog({ initialData }: { initialData: CatalogAdminData }) {
  const [data, setData] = useState(initialData), [editing, setEditing] = useState<CatalogProduct | null>(null);
  const [creating, setCreating] = useState(false), [busy, setBusy] = useState(false), [loading, setLoading] = useState(false);
  const [error, setError] = useState(""), [success, setSuccess] = useState("");
  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/catalog", { cache: "no-store" });
      if (!response.ok) throw new Error(response.status === 401 ? "Сессия истекла. Войдите снова." : "Не удалось загрузить каталог.");
      setData(await response.json());
    } catch (e) { setError(e instanceof Error ? e.message : "Не удалось загрузить каталог."); }
    finally { setLoading(false); }
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const lines = (name: string) => String(form.get(name) ?? "").split("\n").map(v => v.trim()).filter(Boolean);
    const body = {
      name: String(form.get("name")), slug: String(form.get("slug")), description: String(form.get("description")),
      categoryId: String(form.get("categoryId")), calculationMode: String(form.get("calculationMode")),
      sortOrder: Number(form.get("sortOrder")), isActive: form.get("isActive") === "on", features: lines("features"),
      images: lines("images").map(line => { const divider = line.indexOf(" | "); return { url: divider >= 0 ? line.slice(0, divider) : line, alt: divider >= 0 ? line.slice(divider + 3) : "" }; }),
      materialIds: form.getAll("materialIds"), ...(editing ? { revision: editing.revision } : {}),
    };
    setBusy(true); setError(""); setSuccess("");
    try {
      const response = await fetch("/api/admin/catalog/products" + (editing ? `/${editing.id}` : ""), { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message ?? "Не удалось сохранить товар.");
      setEditing(null); setCreating(false); setSuccess("Товар сохранён. Изменения уже доступны в публичном каталоге, если товар и категория включены."); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Не удалось сохранить товар."); }
    finally { setBusy(false); }
  }
  function editButton(p: CatalogProduct) { return data.canWrite ? <Button variant="secondary" size="sm" aria-label={`Редактировать ${p.name}`} disabled={busy} onClick={() => { setEditing(p); setCreating(false); setError(""); setSuccess(""); }}>Редактировать</Button> : "Просмотр"; }
  return <div className="stack"><div className="section-heading"><div><h1>Каталог студии</h1><p className="text-muted">Товары, материалы и порядок на витрине.</p></div>{data?.canWrite && <Button disabled={busy} onClick={() => { setEditing(null); setCreating(true); setError(""); setSuccess(""); }}>Создать товар</Button>}</div>
    {error && <Alert tone="danger" title="Не удалось выполнить действие">{error} <Link href="/admin/login">Вход</Link><Button variant="ghost" onClick={() => { setError(""); void load(); }}>Повторить загрузку</Button></Alert>}
    {success && <Alert tone="success" title="Сохранено">{success}</Alert>}
    {loading && <Skeleton label="Загрузка каталога админки" />}
    {data && <>{!data.canWrite && <Alert title="Только просмотр">Изменение каталога требует права catalog:write.</Alert>}
      <section className="stack"><h2>Категории</h2><Table caption="Категории каталога" rowKey={c => c.id} rows={data.categories} columns={[{ key: "name", header: "Категория", render: c => c.name }, { key: "status", header: "Состояние", render: c => <Badge tone={c.isActive ? "success" : "neutral"}>{c.isActive ? "Включена" : "Выключена"}</Badge> }, { key: "count", header: "Товары", render: c => c.productCount }]} /></section>
      {(creating || editing) && data.canWrite && <Card className="card-pad stack"><h2>{editing ? "Редактирование товара" : "Новый товар"}</h2><form className="stack" key={editing ? `${editing.id}-${editing.revision}` : "new"} onSubmit={save}><fieldset className="catalog-fieldset stack" disabled={busy}>
        <div className="catalog-form-grid"><Input label="Название" name="name" required maxLength={200} defaultValue={editing?.name} /><Input label="Адрес товара (slug)" name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={100} hint="Латинские буквы, цифры и дефисы. Изменение адреса меняет ссылку товара." defaultValue={editing?.slug} /><Select label="Категория" name="categoryId" required defaultValue={editing?.categoryId ?? ""}><option value="" disabled>Выберите категорию</option>{data.categories.map(c => <option key={c.id} value={c.id}>{c.name}{!c.isActive ? " (выключена)" : ""}</option>)}</Select><Select label="Режим расчёта" name="calculationMode" defaultValue={editing?.calculationMode ?? "MANUAL_REQUEST"}>{Object.entries(calculationLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</Select></div>
        <div className="field"><label htmlFor="product-description">Описание (обязательно)</label><textarea id="product-description" name="description" required maxLength={10000} rows={5} defaultValue={editing?.description} /></div>
        <div className="field"><label htmlFor="product-features">Особенности — по одной на строку</label><textarea id="product-features" name="features" maxLength={2412} rows={3} defaultValue={editing?.features.join("\n")} /><p className="field__hint">До 12 особенностей, каждая до 200 символов.</p></div>
        <div className="field"><label htmlFor="product-images">Изображения (обязательно)</label><textarea id="product-images" name="images" required rows={4} maxLength={14000} defaultValue={editing?.images.map(i => `${i.url} | ${i.alt}`).join("\n")} aria-describedby="images-hint" /><p id="images-hint" className="field__hint">До 6 строк в формате: HTTPS-ссылка | описание изображения. Файлы предварительно размещаются в Supabase Storage. Для стартовых иллюстраций допустим /catalog-art/имя.svg. Порядок строк задаёт порядок фото.</p></div>
        <fieldset className="catalog-fieldset stack"><legend>Материалы (выберите хотя бы один)</legend>{data.materials.map(m => <Checkbox key={m.id} name="materialIds" value={m.id} label={`${m.name} — ${availabilityLabels[m.availability]}`} disabled={m.availability === "ARCHIVED"} defaultChecked={editing?.materials.some(v => v.id === m.id)} />)}</fieldset>
        <Input label="Порядок сортировки" name="sortOrder" type="number" min={0} max={100000} step={1} required defaultValue={editing?.sortOrder ?? 0} hint="Меньшее значение — выше в каталоге." /><Checkbox label="Товар включён и виден в каталоге" name="isActive" defaultChecked={editing?.isActive ?? false} />
        <Alert title="Режим расчёта">Автоматический режим задаёт тип изделия. Калькулятор, проверенные производственные профили и тарифы будут подключены отдельно.</Alert>
        <div className="catalog-actions"><Button type="submit" loading={busy}>Сохранить товар</Button><Button variant="secondary" disabled={busy} onClick={() => { setEditing(null); setCreating(false); }}>Отмена</Button></div>
      </fieldset></form></Card>}
      <section className="stack"><h2>Товары</h2>{data.products.length ? <><div className="catalog-admin-table"><Table caption="Товары в порядке витрины" rowKey={p => p.id} rows={data.products} columns={[{ key: "sort", header: "Порядок", render: p => p.sortOrder }, { key: "name", header: "Название", render: p => <><strong>{p.name}</strong><p className="text-muted">{p.category.name}</p></> }, { key: "mode", header: "Расчёт", render: p => calculationLabels[p.calculationMode] }, { key: "active", header: "Состояние", render: p => <Badge tone={p.isActive ? "success" : "neutral"}>{p.isActive ? "Включён" : "Выключен"}</Badge> }, { key: "action", header: "Действие", render: editButton }]} /></div><div className="catalog-admin-cards stack">{data.products.map(p => <Card key={p.id} className="card-pad stack"><h3>{p.name}</h3><p className="text-muted">{p.category.name} · Порядок: {p.sortOrder}</p><Badge tone={p.isActive ? "success" : "neutral"}>{p.isActive ? "Включён" : "Выключен"}</Badge><p>{calculationLabels[p.calculationMode]}</p>{editButton(p)}</Card>)}</div></> : <EmptyState title="Товаров пока нет" description="Создайте первый товар, чтобы наполнить витрину." />}</section>
    </>}
  </div>;
}
