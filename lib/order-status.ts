// Display vocabulary only. This does not implement or authorise order transitions.
export const orderStatusLabels = {
  new: { label: "Новый", tone: "info", icon: "orders", description: "Заказ принят к рассмотрению" },
  preparation: { label: "Подготовка", tone: "neutral", icon: "layers", description: "Подготавливаются параметры и макет" },
  approval: { label: "На согласовании", tone: "warning", icon: "clock", description: "Ожидается решение по версии макета" },
  production: { label: "В производстве", tone: "brand", icon: "settings", description: "Заказ передан в производство" },
  ready: { label: "Готов", tone: "success", icon: "check", description: "Готов к выдаче" },
  completed: { label: "Завершён", tone: "neutral", icon: "check", description: "Работа по заказу завершена" },
  cancelled: { label: "Отменён", tone: "danger", icon: "close", description: "Выполнение заказа отменено" },
} as const;
export type OrderStatus = keyof typeof orderStatusLabels;
