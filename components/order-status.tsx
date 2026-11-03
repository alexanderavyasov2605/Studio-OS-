import { orderStatusLabels, type OrderStatus } from "@/lib/order-status";
import { Badge, Icon } from "@/components/ui";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { label, tone, icon } = orderStatusLabels[status];
  return <Badge tone={tone}><Icon name={icon} size={14} />{label}</Badge>;
}
