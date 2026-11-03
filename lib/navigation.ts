// Browser-safe route metadata only. No environment variables or business rules.
export const publicNavigation = [
  { href: "/", label: "Главная" },
  { href: "/catalog", label: "Каталог" },
  { href: "/cart", label: "Корзина" },
  { href: "/orders", label: "Заказы" },
  { href: "/mini", label: "Mini App" },
  { href: "/account", label: "Аккаунт" },
] as const;
