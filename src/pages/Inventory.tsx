import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  createColumnHelper,
} from "@tanstack/react-table";
import { inventoryApi } from "@/lib/api";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const columnHelper = createColumnHelper<any>();

const adjustmentTypes = [
  "ALL",
  "PURCHASE",
  "TRANSFER_IN",
  "TRANSFER_OUT",
  "MANUAL_ADD",
  "MANUAL_REMOVE",
  "RETURN",
  "SALE",
];

export default function Inventory() {
  const [globalFilter, setGlobalFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const { data: inventory, isLoading } = useQuery({
    queryKey: ["inventory"],
    queryFn: () => inventoryApi.getAll(),
  });

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      PURCHASE: "bg-success text-success-foreground",
      TRANSFER_IN: "bg-primary text-primary-foreground",
      TRANSFER_OUT: "bg-warning text-warning-foreground",
      MANUAL_ADD: "bg-success text-success-foreground",
      MANUAL_REMOVE: "bg-destructive text-destructive-foreground",
      RETURN: "bg-warning text-warning-foreground",
      SALE: "bg-primary text-primary-foreground",
    };
    return colors[type] || "bg-secondary text-secondary-foreground";
  };

  const columns = [
    columnHelper.accessor("productId", {
      header: "Product",
      cell: (info) => <span className="font-medium">{info.getValue()?.slice(0, 8) || "N/A"}</span>,
    }),
    columnHelper.accessor("branchId", {
      header: "Branch",
      cell: (info) => <span className="text-muted-foreground">{info.getValue()?.slice(0, 8) || "N/A"}</span>,
    }),
    columnHelper.accessor("type", {
      header: "Type",
      cell: (info) => (
        <Badge className={getTypeColor(info.getValue())}>
          {info.getValue()}
        </Badge>
      ),
    }),
    columnHelper.accessor("quantity", {
      header: "Quantity",
      cell: (info) => {
        const quantity = info.getValue();
        const type = info.row.original.type;
        const isIncrease = ["PURCHASE", "TRANSFER_IN", "MANUAL_ADD", "RETURN"].includes(type);
        return (
          <span className={isIncrease ? "text-success font-semibold" : "text-destructive font-semibold"}>
            {isIncrease ? "+" : "-"}{Math.abs(quantity)}
          </span>
        );
      },
    }),
    columnHelper.accessor("referenceId", {
      header: "Reference",
      cell: (info) => <span className="text-sm text-muted-foreground">{info.getValue()?.slice(0, 8) || "-"}</span>,
    }),
    columnHelper.accessor("createdAt", {
      header: "Date",
      cell: (info) => (
        <span className="text-sm">
          {new Date(info.getValue()).toLocaleDateString()}
        </span>
      ),
    }),
    columnHelper.accessor("notes", {
      header: "Notes",
      cell: (info) => <span className="text-sm text-muted-foreground">{info.getValue() || "-"}</span>,
    }),
  ];

  const filteredData = inventory?.data?.filter((item: any) => {
    if (typeFilter !== "ALL" && item.type !== typeFilter) return false;
    return true;
  }) || [];

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Inventory Management</h2>
        <p className="text-muted-foreground mt-1">Track all inventory adjustments and stock movements</p>
      </div>

      <div className="flex items-center gap-4">
        <Input
          placeholder="Search inventory..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {adjustmentTypes.map((type) => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {adjustmentTypes.slice(1).map((type) => {
          const count = inventory?.data?.filter((item: any) => item.type === type).length || 0;
          return (
            <div key={type} className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">{type}</p>
              <p className="text-2xl font-bold text-foreground mt-1">{count}</p>
            </div>
          );
        })}
      </div>

      {isLoading ? <p>Loading...</p> : <DataTable table={table} />}
    </div>
  );
}
