import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  createColumnHelper,
} from "@tanstack/react-table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { productApi, branchApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().min(1, "SKU is required"),
  barcode: z.string().optional(),
  categoryId: z.string().optional(),
  branchId: z.string().min(1, "Branch is required"),
  price: z.number().min(0, "Price must be positive"),
  cost: z.number().min(0, "Cost must be positive"),
  unit: z.string().min(1, "Unit is required"),
});

type ProductFormData = z.infer<typeof productSchema>;

const columnHelper = createColumnHelper<any>();

export default function Products() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => productApi.getAll(),
  });

  const { data: branches } = useQuery({
    queryKey: ["branches"],
    queryFn: () => branchApi.getAll(),
  });

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  });

  const createMutation = useMutation({
    mutationFn: productApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Product created successfully" });
      setIsOpen(false);
      reset();
    },
    onError: () => {
      toast({ title: "Failed to create product", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => productApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Product updated successfully" });
      setIsOpen(false);
      setEditingProduct(null);
      reset();
    },
    onError: () => {
      toast({ title: "Failed to update product", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: productApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Product deleted successfully" });
      setDeleteId(null);
    },
    onError: () => {
      toast({ title: "Failed to delete product", variant: "destructive" });
    },
  });

  const columns = [
    columnHelper.accessor("name", {
      header: "Product Name",
      cell: (info) => <span className="font-medium">{info.getValue()}</span>,
    }),
    columnHelper.accessor("sku", {
      header: "SKU",
    }),
    columnHelper.accessor("price", {
      header: "Price",
      cell: (info) => <span className="text-success">${info.getValue()}</span>,
    }),
    columnHelper.accessor("cost", {
      header: "Cost",
      cell: (info) => <span>${info.getValue()}</span>,
    }),
    columnHelper.accessor("stockQuantity", {
      header: "Stock",
      cell: (info) => {
        const stock = info.getValue() || 0;
        return (
          <span className={stock < 10 ? "text-warning font-semibold" : "text-foreground"}>
            {stock}
          </span>
        );
      },
    }),
    columnHelper.accessor("unit", {
      header: "Unit",
    }),
    columnHelper.display({
      id: "actions",
      header: "Actions",
      cell: (info) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => handleEdit(info.row.original)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => setDeleteId(info.row.original.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    }),
  ];

  const table = useReactTable({
    data: products?.data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
  });

  const onSubmit = (data: ProductFormData) => {
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    reset(product);
    setIsOpen(true);
  };

  const handleNew = () => {
    setEditingProduct(null);
    reset({});
    setIsOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Products</h2>
          <p className="text-muted-foreground mt-1">Manage your product inventory</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNew}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingProduct ? "Edit Product" : "Create Product"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Product Name *</Label>
                  <Input {...register("name")} />
                  {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <Label>SKU *</Label>
                  <Input {...register("sku")} />
                  {errors.sku && <p className="text-sm text-destructive mt-1">{errors.sku.message}</p>}
                </div>
                <div>
                  <Label>Barcode</Label>
                  <Input {...register("barcode")} />
                </div>
                <div>
                  <Label>Branch *</Label>
                  <Select onValueChange={(value) => setValue("branchId", value)} defaultValue={editingProduct?.branchId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches?.data?.map((branch: any) => (
                        <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.branchId && <p className="text-sm text-destructive mt-1">{errors.branchId.message}</p>}
                </div>
                <div>
                  <Label>Price *</Label>
                  <Input type="number" step="0.01" {...register("price", { valueAsNumber: true })} />
                  {errors.price && <p className="text-sm text-destructive mt-1">{errors.price.message}</p>}
                </div>
                <div>
                  <Label>Cost *</Label>
                  <Input type="number" step="0.01" {...register("cost", { valueAsNumber: true })} />
                  {errors.cost && <p className="text-sm text-destructive mt-1">{errors.cost.message}</p>}
                </div>
                <div>
                  <Label>Unit *</Label>
                  <Input {...register("unit")} placeholder="e.g., pcs, kg, liter" />
                  {errors.unit && <p className="text-sm text-destructive mt-1">{errors.unit.message}</p>}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button type="submit">{editingProduct ? "Update" : "Create"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Input
        placeholder="Search products..."
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        className="max-w-sm"
      />

      {isLoading ? <p>Loading...</p> : <DataTable table={table} />}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
