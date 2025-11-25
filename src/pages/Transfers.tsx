import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Eye, Trash2, ArrowRight, CheckCircle, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { transferApi, branchApi, productApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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

interface TransferItem {
  productId: string;
  productName?: string;
  quantity: number;
}

export default function Transfers() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const [sourceBranchId, setSourceBranchId] = useState("");
  const [destinationBranchId, setDestinationBranchId] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<TransferItem[]>([]);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: transfers, isLoading } = useQuery({
    queryKey: ["transfers"],
    queryFn: () => transferApi.getAll(),
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
    mutationFn: transferApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transfers"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast({ title: "Transfer created successfully" });
      setIsCreateOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to create transfer", variant: "destructive" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => 
      transferApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transfers"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast({ title: "Transfer status updated" });
      setIsViewOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to update transfer status", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: transferApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transfers"] });
      toast({ title: "Transfer deleted successfully" });
      setDeleteId(null);
    },
    onError: () => {
      toast({ title: "Failed to delete transfer", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setSourceBranchId("");
    setDestinationBranchId("");
    setNotes("");
    setItems([]);
  };

  const addItem = () => {
    setItems([...items, {
      productId: "",
      quantity: 1,
    }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof TransferItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Get product name
    if (field === "productId") {
      const product = products?.data?.find((p: any) => p.id === value);
      newItems[index].productName = product?.name;
    }
    
    setItems(newItems);
  };

  const handleSubmit = () => {
    if (!sourceBranchId || !destinationBranchId || items.length === 0) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }

    if (sourceBranchId === destinationBranchId) {
      toast({ title: "Source and destination branches must be different", variant: "destructive" });
      return;
    }

    const transferData = {
      sourceBranchId,
      destinationBranchId,
      status: "PENDING",
      notes,
      items,
    };

    createMutation.mutate(transferData);
  };

  const viewTransfer = (transfer: any) => {
    setSelectedTransfer(transfer);
    setIsViewOpen(true);
  };

  const handleStatusUpdate = (id: string, status: string) => {
    updateStatusMutation.mutate({ id, status });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: "bg-warning text-warning-foreground",
      IN_TRANSIT: "bg-primary text-primary-foreground",
      COMPLETED: "bg-success text-success-foreground",
      CANCELLED: "bg-destructive text-destructive-foreground",
    };
    return colors[status] || "bg-secondary text-secondary-foreground";
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, any> = {
      PENDING: Clock,
      IN_TRANSIT: ArrowRight,
      COMPLETED: CheckCircle,
      CANCELLED: XCircle,
    };
    return icons[status] || Clock;
  };

  const sourceBranchProducts = products?.data?.filter(
    (p: any) => p.branchId === sourceBranchId
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Branch Transfers</h2>
          <p className="text-muted-foreground mt-1">Transfer inventory between branches</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Transfer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Branch Transfer</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Source Branch (From) *</Label>
                  <Select value={sourceBranchId} onValueChange={setSourceBranchId}>
                    <SelectTrigger className="bg-card">
                      <SelectValue placeholder="Select source branch" />
                    </SelectTrigger>
                    <SelectContent className="bg-card z-50">
                      {branches?.data?.map((branch: any) => (
                        <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Destination Branch (To) *</Label>
                  <Select value={destinationBranchId} onValueChange={setDestinationBranchId}>
                    <SelectTrigger className="bg-card">
                      <SelectValue placeholder="Select destination branch" />
                    </SelectTrigger>
                    <SelectContent className="bg-card z-50">
                      {branches?.data?.map((branch: any) => (
                        <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about this transfer..."
                  className="bg-card"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Transfer Items</h3>
                  <Button 
                    type="button" 
                    size="sm" 
                    onClick={addItem}
                    disabled={!sourceBranchId}
                  >
                    Add Item
                  </Button>
                </div>

                {!sourceBranchId && (
                  <p className="text-sm text-muted-foreground mb-4">
                    Please select a source branch first to add items
                  </p>
                )}

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
                          <Label>Product *</Label>
                          <Select 
                            value={item.productId} 
                            onValueChange={(value) => updateItem(index, "productId", value)}
                          >
                            <SelectTrigger className="bg-card">
                              <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                            <SelectContent className="bg-card z-50">
                              {sourceBranchProducts.map((product: any) => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product.name} (Stock: {product.stockQuantity || 0})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Quantity *</Label>
                          <Input 
                            type="number" 
                            value={item.quantity} 
                            onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 0)}
                            min="1"
                            className="bg-card"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button onClick={handleSubmit}>Create Transfer</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-warning" />
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold">
                {transfers?.data?.filter((t: any) => t.status === "PENDING").length || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-3">
            <ArrowRight className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">In Transit</p>
              <p className="text-2xl font-bold">
                {transfers?.data?.filter((t: any) => t.status === "IN_TRANSIT").length || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-success" />
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold">
                {transfers?.data?.filter((t: any) => t.status === "COMPLETED").length || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-3">
            <XCircle className="h-8 w-8 text-destructive" />
            <div>
              <p className="text-sm text-muted-foreground">Cancelled</p>
              <p className="text-2xl font-bold">
                {transfers?.data?.filter((t: any) => t.status === "CANCELLED").length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <p>Loading...</p>
        ) : transfers?.data?.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No transfers found</p>
            <p className="text-sm text-muted-foreground mt-2">Create your first branch transfer</p>
          </div>
        ) : (
          transfers?.data?.map((transfer: any) => {
            const StatusIcon = getStatusIcon(transfer.status);
            return (
              <div key={transfer.id} className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold text-foreground">Transfer #{transfer.id?.slice(0, 8)}</h3>
                      <Badge className={getStatusColor(transfer.status)}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {transfer.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">From Branch</p>
                        <p className="font-semibold">{branches?.data?.find((b: any) => b.id === transfer.sourceBranchId)?.name || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">To Branch</p>
                        <p className="font-semibold">{branches?.data?.find((b: any) => b.id === transfer.destinationBranchId)?.name || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Items</p>
                        <p className="font-semibold">{transfer.items?.length || 0} items</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Date</p>
                        <p className="font-semibold">{new Date(transfer.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => viewTransfer(transfer)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setDeleteId(transfer.id)}
                      disabled={transfer.status === "COMPLETED"}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Transfer Details</DialogTitle>
          </DialogHeader>
          {selectedTransfer && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Transfer ID</Label>
                  <p className="font-medium">{selectedTransfer.id}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(selectedTransfer.status)}>
                      {selectedTransfer.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label>From Branch</Label>
                  <p className="font-medium">
                    {branches?.data?.find((b: any) => b.id === selectedTransfer.sourceBranchId)?.name || "N/A"}
                  </p>
                </div>
                <div>
                  <Label>To Branch</Label>
                  <p className="font-medium">
                    {branches?.data?.find((b: any) => b.id === selectedTransfer.destinationBranchId)?.name || "N/A"}
                  </p>
                </div>
                <div>
                  <Label>Created Date</Label>
                  <p className="font-medium">{new Date(selectedTransfer.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {selectedTransfer.notes && (
                <div>
                  <Label>Notes</Label>
                  <p className="text-sm text-muted-foreground mt-1">{selectedTransfer.notes}</p>
                </div>
              )}

              <div>
                <Label className="text-lg">Transfer Items</Label>
                <div className="mt-2 space-y-2">
                  {selectedTransfer.items?.map((item: any, index: number) => {
                    const product = products?.data?.find((p: any) => p.id === item.productId);
                    return (
                      <div key={index} className="border border-border rounded-lg p-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Product</p>
                            <p className="font-medium">{product?.name || "Unknown Product"}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">SKU</p>
                            <p className="font-medium">{product?.sku || "-"}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Quantity</p>
                            <p className="font-medium text-primary">{item.quantity}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {selectedTransfer.status !== "COMPLETED" && selectedTransfer.status !== "CANCELLED" && (
                <div className="border-t border-border pt-4">
                  <Label className="mb-3 block">Update Status</Label>
                  <div className="flex gap-2">
                    {selectedTransfer.status === "PENDING" && (
                      <>
                        <Button 
                          variant="outline"
                          onClick={() => handleStatusUpdate(selectedTransfer.id, "IN_TRANSIT")}
                        >
                          <ArrowRight className="h-4 w-4 mr-2" />
                          Mark In Transit
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => handleStatusUpdate(selectedTransfer.id, "CANCELLED")}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      </>
                    )}
                    {selectedTransfer.status === "IN_TRANSIT" && (
                      <>
                        <Button 
                          onClick={() => handleStatusUpdate(selectedTransfer.id, "COMPLETED")}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Complete Transfer
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => handleStatusUpdate(selectedTransfer.id, "CANCELLED")}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the transfer.
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
