"use client";

import { Badge, Card, EmptyState, Icon, Tabs } from "@/components/ui";
export function MiniWorkspace() {
  return <div className="mini-workspace">
    <div className="page-heading"><Badge tone="brand">Mini App · Превью</Badge><h1>Студия под рукой</h1><p className="text-muted">Компактное пространство для будущих заказов.</p></div>
    <Tabs label="Навигация Mini App" variant="mobile" items={[
      { id: "home", label: "Главная", icon: "home", content: <Card><div className="mini-welcome"><span className="feature-icon"><Icon name="spark" /></span><h2>От идеи до готового тиража</h2><p className="text-muted">Здесь появится краткий обзор вашей работы со студией.</p></div><EmptyState compact title="Начинаем с основы" description="Каталог и оформление заказов будут подключены позже." /></Card> },
      { id: "catalog", label: "Каталог", icon: "grid", content: <Card><EmptyState title="Каталог в подготовке" description="Изделия и параметры печати пока не подключены." /></Card> },
      { id: "orders", label: "Заказы", icon: "orders", content: <Card><EmptyState title="Заказы пока недоступны" description="Вход и получение заказов будут добавлены на следующем этапе." /></Card> },
      { id: "cart", label: "Корзина", icon: "bag", content: <Card><EmptyState title="Корзина в подготовке" description="Добавление изделий и оформление пока недоступны." /></Card> },
    ]} />
    <p className="preview-note">Страница-заглушка. Подключение Telegram и рабочие функции пока не реализованы.</p>
  </div>;
}
