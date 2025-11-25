import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { purchaseApi, supplierApi, branchApi, productApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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

interface PurchaseItem {
  productId: string;
  quantity: number;
  costPrice: number;
  discount: number;
  discountType: "percentage" | "fixed";
  total_d: number;
  total: number;
}

export default function Purchases() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const [supplierId, setSupplierId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [items, setItems] = useState<PurchaseItem[]>([]);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: purchases, isLoading } = useQuery({
    queryKey: ["purchases"],
    queryFn: () => purchaseApi.getAll(),
  });

  const { data: suppliers } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => supplierApi.getAll(),
  });

  const { data: branches } = useQuery({
    queryKey: ["branches"],
    queryFn: () => branchApi.getAll(),
  });

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: () => productApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: purchaseApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast({ title: "Purchase created successfully" });
      setIsCreateOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to create purchase", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: purchaseApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      toast({ title: "Purchase deleted successfully" });
      setDeleteId(null);
    },
    onError: () => {
      toast({ title: "Failed to delete purchase", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setSupplierId("");
    setBranchId("");
    setItems([]);
  };

  const addItem = () => {
    setItems([...items, {
      productId: "",
      quantity: 1,
      costPrice: 0,
      discount: 0,
      discountType: "percentage",
      total_d: 0,
      total: 0,
    }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof PurchaseItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Calculate total_d and total
    const item = newItems[index];
    const subtotal = item.quantity * item.costPrice;
    const discountAmount = item.discountType === "percentage" 
      ? (subtotal * item.discount / 100)
      : item.discount;
    item.total_d = subtotal - discountAmount;
    item.total = item.total_d;
    
    setItems(newItems);
  };

  const calculateTotalAmount = () => {
    return items.reduce((sum, item) => sum + item.total, 0).toFixed(2);
  };

  const handleSubmit = () => {
    if (!supplierId || !branchId || items.length === 0) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }

    const purchaseData = {
      supplierId,
      branchId,
      status: true,
      totalAmount: parseFloat(calculateTotalAmount()),
      items,
    };

    createMutation.mutate(purchaseData);
  };

  const viewPurchase = (purchase: any) => {
    setSelectedPurchase(purchase);
    setIsViewOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Purchase Orders</h2>
          <p className="text-muted-foreground mt-1">Create and manage purchase orders</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Purchase
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Purchase Order</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Supplier *</Label>
                  <Select value={supplierId} onValueChange={setSupplierId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers?.data?.map((supplier: any) => (
                        <SelectItem key={supplier.id} value={supplier.id}>{supplier.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Branch *</Label>
                  <Select value={branchId} onValueChange={setBranchId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches?.data?.map((branch: any) => (
                        <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Purchase Items</h3>
                  <Button type="button" size="sm" onClick={addItem}>Add Item</Button>
                </div>

                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div key={index} className="border border-border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Item #{index + 1}</span>
                        <Button type="button" size="sm" variant="outline" onClick={() => removeItem(index)}>
                          Remove
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Product</Label>
                          <Select value={item.productId} onValueChange={(value) => updateItem(index, "productId", value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                            <SelectContent>
                              {products?.data?.map((product: any) => (
                                <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Quantity</Label>
                          <Input 
                            type="number" 
                            value={item.quantity} 
                            onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div>
                          <Label>Cost Price</Label>
                          <Input 
                            type="number" 
                            step="0.01"
                            value={item.costPrice} 
                            onChange={(e) => updateItem(index, "costPrice", parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div>
                          <Label>Discount Type</Label>
                          <Select value={item.discountType} onValueChange={(value: any) => updateItem(index, "discountType", value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percentage">Percentage</SelectItem>
                              <SelectItem value="fixed">Fixed Amount</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Discount</Label>
                          <Input 
                            type="number" 
                            step="0.01"
                            value={item.discount} 
                            onChange={(e) => updateItem(index, "discount", parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div>
                          <Label>Line Total</Label>
                          <Input value={`$${item.total.toFixed(2)}`} disabled />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <div className="flex items-center justify-between text-lg font-bold">
                  <span>Total Amount:</span>
                  <span className="text-primary">${calculateTotalAmount()}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button onClick={handleSubmit}>Create Purchase</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <p>Loading...</p>
        ) : (
          purchases?.data?.map((purchase: any) => (
            <div key={purchase.id} className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-foreground">Purchase #{purchase.id?.slice(0, 8)}</h3>
                    <Badge variant={purchase.status ? "default" : "secondary"}>
                      {purchase.status ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Total Amount</p>
                      <p className="font-semibold text-primary">${purchase.totalAmount}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Items</p>
                      <p className="font-semibold">{purchase.items?.length || 0} items</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Date</p>
                      <p className="font-semibold">{new Date(purchase.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => viewPurchase(purchase)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setDeleteId(purchase.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Purchase Details</DialogTitle>
          </DialogHeader>
          {selectedPurchase && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Purchase ID</Label>
                  <p className="font-medium">{selectedPurchase.id}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge variant={selectedPurchase.status ? "default" : "secondary"}>
                    {selectedPurchase.status ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div>
                  <Label>Total Amount</Label>
                  <p className="font-medium text-primary">${selectedPurchase.totalAmount}</p>
                </div>
                <div>
                  <Label>Date</Label>
                  <p className="font-medium">{new Date(selectedPurchase.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div>
                <Label className="text-lg">Purchase Items</Label>
                <div className="mt-2 space-y-2">
                  {selectedPurchase.items?.map((item: any, index: number) => (
                    <div key={index} className="border border-border rounded-lg p-4">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Quantity</p>
                          <p className="font-medium">{item.quantity}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Cost Price</p>
                          <p className="font-medium">${item.costPrice}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Discount</p>
                          <p className="font-medium">{item.discount}{item.discountType === "percentage" ? "%" : "$"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">After Discount</p>
                          <p className="font-medium">${item.total_d}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Line Total</p>
                          <p className="font-medium text-success">${item.total}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the purchase order.
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
