import { useQuery } from "@tanstack/react-query";
import { Building2, GitBranch, Package, Truck, AlertTriangle, ShoppingCart, ArrowLeftRight } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { organizationApi, branchApi, productApi, supplierApi, purchaseApi, transferApi } from "@/lib/api";

export default function Dashboard() {
  const { data: organizations } = useQuery({
    queryKey: ["organizations"],
    queryFn: () => organizationApi.getAll(),
  });

  const { data: branches } = useQuery({
    queryKey: ["branches"],
    queryFn: () => branchApi.getAll(),
  });

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: () => productApi.getAll(),
  });

  const { data: suppliers } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => supplierApi.getAll(),
  });

  const { data: purchases } = useQuery({
    queryKey: ["purchases"],
    queryFn: () => purchaseApi.getAll(),
  });

  const { data: transfers } = useQuery({
    queryKey: ["transfers"],
    queryFn: () => transferApi.getAll(),
  });

  const stats = [
    {
      title: "Organizations",
      value: organizations?.data?.length || 0,
      icon: Building2,
    },
    {
      title: "Branches",
      value: branches?.data?.length || 0,
      icon: GitBranch,
    },
    {
      title: "Products",
      value: products?.data?.length || 0,
      icon: Package,
    },
    {
      title: "Suppliers",
      value: suppliers?.data?.length || 0,
      icon: Truck,
    },
  ];

  const lowStockProducts = products?.data?.filter((p: any) => p.stockQuantity < 10) || [];
  const recentPurchases = purchases?.data?.slice(0, 5) || [];
  const pendingTransfers = transfers?.data?.filter((t: any) => t.status === "PENDING" || t.status === "IN_TRANSIT") || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Dashboard Overview</h2>
        <p className="text-muted-foreground mt-1">Welcome to your enterprise management system</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockProducts.length === 0 ? (
              <p className="text-muted-foreground text-sm">No low stock alerts</p>
            ) : (
              <div className="space-y-3">
                {lowStockProducts.slice(0, 5).map((product: any) => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">{product.name}</p>
                      <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                    </div>
                    <span className="text-warning font-semibold">{product.stockQuantity} left</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Recent Purchases
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentPurchases.length === 0 ? (
              <p className="text-muted-foreground text-sm">No recent purchases</p>
            ) : (
              <div className="space-y-3">
                {recentPurchases.map((purchase: any) => (
                  <div key={purchase.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">Purchase #{purchase.id?.slice(0, 8)}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(purchase.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-foreground font-semibold">${purchase.totalAmount}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5 text-warning" />
              Pending Transfers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingTransfers.length === 0 ? (
              <p className="text-muted-foreground text-sm">No pending transfers</p>
            ) : (
              <div className="space-y-3">
                {pendingTransfers.slice(0, 5).map((transfer: any) => (
                  <div key={transfer.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">Transfer #{transfer.id?.slice(0, 8)}</p>
                      <p className="text-sm text-muted-foreground">
                        {transfer.items?.length || 0} items
                      </p>
                    </div>
                    <Badge variant={transfer.status === "PENDING" ? "secondary" : "default"}>
                      {transfer.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
