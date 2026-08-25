import type { AdminUser } from "@/db/admin-users";
import type { Branch } from "@/db/branches";
import type { LiveConversation } from "@/db/live-chat";
import type { ManagedOrder } from "@/db/orders";
import type { ManagedProduct } from "@/db/products";
import { orderTotalNumber } from "./utils";

type ConversationSummary = Pick<LiveConversation, "assignedAdmin" | "status" | "createdAt">;

export function buildBusinessAnalytics({
  orders,
  products,
  branches,
  staff,
  conversations,
  periodDays,
  branchScopeId = "",
}: {
  orders: ManagedOrder[];
  products: ManagedProduct[];
  branches: Branch[];
  staff: AdminUser[];
  conversations: ConversationSummary[];
  periodDays: number;
  branchScopeId?: string;
}) {
  const since = startOfDay(Date.now() - Math.max(1, periodDays - 1) * 86_400_000);
  const periodOrders = orders.filter((order) => order.createdAt >= since && (!branchScopeId || order.branchId === branchScopeId));
  const periodConversations = conversations.filter((item) => item.createdAt >= since);
  const recognized = periodOrders.filter((order) => order.status === "delivered");
  const revenue = recognized.reduce((sum, order) => sum + orderTotalNumber(order, products), 0);
  const cancelled = periodOrders.filter((order) => order.status === "cancelled" || order.status === "returned").length;
  const activeOrders = periodOrders.filter((order) => ["pending", "confirmed", "processing", "shipping"].includes(order.status)).length;
  const branchList = branches.filter((branch) => !branchScopeId || branch.id === branchScopeId);

  const branchRows = branchList.map((branch) => {
    const branchOrders = periodOrders.filter((order) => order.branchId === branch.id);
    const deliveredOrders = branchOrders.filter((order) => order.status === "delivered");
    const branchRevenue = deliveredOrders.reduce((sum, order) => sum + orderTotalNumber(order, products), 0);
    return {
      id: branch.id,
      code: branch.code,
      name: branch.name,
      active: branch.active,
      orders: branchOrders.length,
      delivered: deliveredOrders.length,
      open: branchOrders.filter((order) => ["pending", "confirmed", "processing", "shipping"].includes(order.status)).length,
      revenue: branchRevenue,
      averageOrder: deliveredOrders.length ? Math.round(branchRevenue / deliveredOrders.length) : 0,
      completionRate: branchOrders.length ? Math.round(deliveredOrders.length / branchOrders.length * 100) : 0,
      revenueShare: revenue ? Math.round(branchRevenue / revenue * 100) : 0,
    };
  }).sort((left, right) => right.revenue - left.revenue);

  const scopedStaff = staff.filter((item) => item.role !== "owner" && (!branchScopeId || item.branchId === branchScopeId));
  const employeeRevenueTotal = scopedStaff.reduce((sum, employee) => sum + recognized.filter((order) => order.assignedAdminId === employee.id).reduce((value, order) => value + orderTotalNumber(order, products), 0), 0);
  const employeeRows = scopedStaff.map((employee) => {
    const employeeOrders = periodOrders.filter((order) => order.assignedAdminId === employee.id);
    const deliveredOrders = employeeOrders.filter((order) => order.status === "delivered");
    const employeeRevenue = deliveredOrders.reduce((sum, order) => sum + orderTotalNumber(order, products), 0);
    const chats = periodConversations.filter((item) => item.assignedAdmin === employee.name);
    const closedChats = chats.filter((item) => item.status === "closed").length;
    const completionRate = employeeOrders.length ? deliveredOrders.length / employeeOrders.length : 0;
    const chatResolutionRate = chats.length ? closedChats / chats.length : 0;
    const revenueContribution = employeeRevenueTotal ? employeeRevenue / employeeRevenueTotal : 0;
    const score = Math.round(completionRate * 50 + revenueContribution * 30 + chatResolutionRate * 20);
    return {
      id: employee.id,
      name: employee.name,
      role: employee.role,
      branch: branches.find((branch) => branch.id === employee.branchId)?.name || employee.branch || "Chưa phân chi nhánh",
      active: employee.active,
      orders: employeeOrders.length,
      delivered: deliveredOrders.length,
      open: employeeOrders.filter((order) => ["pending", "confirmed", "processing", "shipping"].includes(order.status)).length,
      revenue: employeeRevenue,
      chats: chats.length,
      closedChats,
      completionRate: Math.round(completionRate * 100),
      score,
    };
  }).sort((left, right) => right.score - left.score || right.revenue - left.revenue);

  return {
    since,
    periodDays,
    revenue,
    orderCount: periodOrders.length,
    deliveredCount: recognized.length,
    activeOrders,
    cancelled,
    averageOrder: recognized.length ? Math.round(revenue / recognized.length) : 0,
    completionRate: periodOrders.length ? Math.round(recognized.length / periodOrders.length * 100) : 0,
    unassignedOrders: periodOrders.filter((order) => !order.branchId).length,
    branchRows,
    employeeRows,
  };
}

function startOfDay(value: number) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}
