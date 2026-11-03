"use client";

import { Button, Input, Select, Checkbox, Tabs, Card, Badge, Dialog, Table, EmptyState, Alert, Skeleton, Icon } from "@/components/ui";
import { OrderStatusBadge } from "@/components/order-status";
import { orderStatusLabels, type OrderStatus } from "@/lib/order-status";

const statuses = Object.keys(orderStatusLabels) as OrderStatus[];
export function UiKit() {
  return <div className="ui-kit">
    <div className="page-heading"><Badge tone="brand"><Icon name="layers" size={14} />Studio OS / UI Kit</Badge><h1>Дизайн-система</h1><p className="text-muted">Общий визуальный язык сайта, Mini App и административной панели. Здесь — только образцы компонентов и состояний.</p></div>
    <Alert title="Только для разработки">В production этот маршрут возвращает 404. Примеры не подключены к заказам или данным.</Alert>
    <section className="ui-section" aria-labelledby="tokens-title"><h2 id="tokens-title"><span>01</span>Цвет и типографика</h2><Card className="ui-panel"><div className="grid-four">{[
      ["Акцент", "#7C3AED", "var(--brand)"],
      ["Текст", "#20202C", "var(--ink)"],
      ["Фон", "#F8F9FC", "var(--canvas)"],
      ["Поверхность", "#FFFFFF", "var(--surface)"],
    ].map(([name, hex, color]) => <div key={name} className="swatch"><div className="swatch__color" style={{ background: color }} /><strong>{name}</strong><code>{hex}</code></div>)}</div>
      <div className="token-spec"><p>Inter / Segoe UI / system-ui · 400, 500, 600, 700</p><p>Основной текст 16 / 1.6 · подписи 14 · пояснения 12 · адаптивные заголовки</p><p>Интервалы <code>4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64</code></p><p>Радиусы: поля 10 · карточки 16 · крупные поверхности 24 · badge pill</p><p>Тени: мягкая для карточек, приподнятая для меню и диалогов</p></div>
    </Card></section>
    <section className="ui-section" aria-labelledby="buttons-title"><h2 id="buttons-title"><span>02</span>Кнопки и состояния</h2><Card className="ui-panel stack"><div className="button-row"><Button>Основная<Icon name="arrow" size={16} /></Button><Button variant="secondary">Вторичная</Button><Button variant="ghost">Текстовая</Button><Button variant="danger">Опасное действие</Button></div><div className="button-row"><Button size="sm">Компактная</Button><Button loading>Загрузка…</Button><Button disabled>Недоступно</Button></div><p className="text-small text-muted">Tab — переход по элементам, Enter / пробел — нажатие. Недоступные кнопки исключены из Tab-порядка.</p></Card></section>
    <section className="ui-section" aria-labelledby="fields-title"><h2 id="fields-title"><span>03</span>Поля формы</h2><Card className="ui-panel"><div className="grid-two">
      <Input label="Название проекта" placeholder="Например, визитки студии" hint="Название видно в карточке будущего заказа." required />
      <Select label="Формат печати" defaultValue="" hint="Пример выбора, без расчёта стоимости."><option value="" disabled>Выберите формат</option><option value="a4">A4</option><option value="a3">A3</option></Select>
      <Input label="Электронная почта" type="email" defaultValue="неполный адрес" error="Введите адрес в формате name@example.com." />
      <Input label="Недоступное поле" placeholder="Пока недоступно" disabled hint="Пример состояния disabled." />
      <Select label="Недоступный выбор" disabled defaultValue="none"><option value="none">Пока недоступно</option></Select>
      <Input label="Поле только для чтения" defaultValue="Образец" readOnly hint="Значение можно выделить и скопировать." />
      <Checkbox label="Показывать подсказки" hint="Переключатель действует только в этом примере." defaultChecked />
      <Checkbox label="Недоступный параметр" disabled />
    </div></Card></section>
    <section className="ui-section" aria-labelledby="tabs-title"><h2 id="tabs-title"><span>04</span>Вкладки и диалог</h2><div className="grid-two"><Card className="ui-panel"><Tabs label="Пример вкладок" items={[
      { id: "overview", label: "Обзор", content: <p className="text-muted">Содержимое первой вкладки. Стрелки, Home и End перемещают фокус и переключают вкладки.</p> },
      { id: "details", label: "Детали", content: <p className="text-muted">Содержимое второй вкладки. Панель связана со своей вкладкой через ARIA.</p> },
      { id: "later", label: "Позже", disabled: true, content: null },
    ]} /></Card><Card className="ui-panel stack"><h3>Модальное окно</h3><p className="text-muted text-small">Escape закрывает диалог. Фокус остаётся внутри окна и возвращается к кнопке открытия.</p><div><Dialog triggerLabel="Открыть диалог" title="Образец диалога" description="Это демонстрация интерфейса, без изменения данных."><Input label="Название в диалоге" placeholder="Образец поля" /></Dialog></div></Card></div></section>
    <section className="ui-section" aria-labelledby="status-title"><h2 id="status-title"><span>05</span>Статусы заказов</h2><Card className="ui-panel stack"><p className="text-muted text-small">Текст и значок дополняют цвет. Это визуальный словарь, а не рабочая доска и не правила переходов.</p><div className="button-row">{statuses.map((status) => <OrderStatusBadge key={status} status={status} />)}</div><Table<OrderStatus> caption="Справочник визуальных статусов — без реальных заказов" rows={statuses} rowKey={(status) => status} columns={[
      { key: "status", header: "Статус", render: (status) => <OrderStatusBadge status={status} /> },
      { key: "meaning", header: "Значение", render: (status) => orderStatusLabels[status].description },
    ]} /></Card></section>
    <section className="ui-section" aria-labelledby="states-title"><h2 id="states-title"><span>06</span>Обратная связь</h2><div className="grid-two"><Alert tone="success" title="Пример: действие выполнено">Положительное подтверждение результата.</Alert><Alert tone="danger" title="Пример: произошла ошибка">Понятное объяснение и следующий шаг для пользователя.</Alert><Alert tone="warning" title="Пример: нужно внимание">Сообщение о необходимости проверить данные.</Alert><Alert title="Пример: информация">Нейтральная подсказка без срочного действия.</Alert></div></section>
    <section className="ui-section" aria-labelledby="empty-title"><h2 id="empty-title"><span>07</span>Пустое состояние и загрузка</h2><div className="grid-two"><Card><EmptyState compact title="Пока ничего нет" description="Здесь появится содержимое, когда данные будут подключены." /></Card><Card className="ui-panel stack"><h3>Загрузка содержимого</h3><p className="text-muted text-small">Skeleton сохраняет место в интерфейсе. Скринридер получает подпись состояния.</p><Skeleton /></Card></div></section>
    <section className="ui-section" aria-labelledby="card-title"><h2 id="card-title"><span>08</span>Карточки, метки и сетки</h2><div className="grid-three">{["Общая поверхность", "Мягкие границы", "Единый ритм"].map((title) => <Card key={title} className="ui-panel stack"><Badge>Компонент</Badge><h3>{title}</h3><p className="text-muted text-small">Одна колонка на узком экране, три — на широком. Длинный текст свободно переносится.</p></Card>)}</div></section>
  </div>;
}
