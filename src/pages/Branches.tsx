import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { branchApi, organizationApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

const branchSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  address: z.string().min(1, "Address is required"),
  contactNumber: z.string().min(1, "Contact number is required"),
  organizationId: z.string().min(1, "Organization is required"),
});

type BranchFormData = z.infer<typeof branchSchema>;

export default function Branches() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: branches, isLoading } = useQuery({
    queryKey: ["branches"],
    queryFn: () => branchApi.getAll(),
  });

  const { data: organizations } = useQuery({
    queryKey: ["organizations"],
    queryFn: () => organizationApi.getAll(),
  });

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<BranchFormData>({
    resolver: zodResolver(branchSchema),
  });

  const createMutation = useMutation({
    mutationFn: branchApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      toast({ title: "Branch created successfully" });
      setIsOpen(false);
      reset();
    },
    onError: () => {
      toast({ title: "Failed to create branch", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => branchApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      toast({ title: "Branch updated successfully" });
      setIsOpen(false);
      setEditingBranch(null);
      reset();
    },
    onError: () => {
      toast({ title: "Failed to update branch", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: branchApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      toast({ title: "Branch deleted successfully" });
      setDeleteId(null);
    },
    onError: () => {
      toast({ title: "Failed to delete branch", variant: "destructive" });
    },
  });

  const onSubmit = (data: BranchFormData) => {
    if (editingBranch) {
      updateMutation.mutate({ id: editingBranch.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (branch: any) => {
    setEditingBranch(branch);
    reset(branch);
    setIsOpen(true);
  };

  const handleNew = () => {
    setEditingBranch(null);
    reset({});
    setIsOpen(true);
  };

  const filteredBranches = branches?.data?.filter((branch: any) =>
    branch.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    branch.code?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Branches</h2>
          <p className="text-muted-foreground mt-1">Manage your branch locations</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNew}>
              <Plus className="h-4 w-4 mr-2" />
              Add Branch
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingBranch ? "Edit Branch" : "Create Branch"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name *</Label>
                  <Input {...register("name")} />
                  {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <Label>Code *</Label>
                  <Input {...register("code")} />
                  {errors.code && <p className="text-sm text-destructive mt-1">{errors.code.message}</p>}
                </div>
                <div>
                  <Label>Contact Number *</Label>
                  <Input {...register("contactNumber")} />
                  {errors.contactNumber && <p className="text-sm text-destructive mt-1">{errors.contactNumber.message}</p>}
                </div>
                <div>
                  <Label>Organization *</Label>
                  <Select onValueChange={(value) => setValue("organizationId", value)} defaultValue={editingBranch?.organizationId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select organization" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizations?.data?.map((org: any) => (
                        <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.organizationId && <p className="text-sm text-destructive mt-1">{errors.organizationId.message}</p>}
                </div>
                <div className="col-span-2">
                  <Label>Address *</Label>
                  <Input {...register("address")} />
                  {errors.address && <p className="text-sm text-destructive mt-1">{errors.address.message}</p>}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button type="submit">{editingBranch ? "Update" : "Create"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Input
        placeholder="Search branches..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="max-w-sm"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <p>Loading...</p>
        ) : (
          filteredBranches.map((branch: any) => (
            <div key={branch.id} className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-foreground">{branch.name}</h3>
                  <span className="inline-block mt-2 px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">{branch.code}</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(branch)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setDeleteId(branch.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground">{branch.address}</p>
                <p className="text-muted-foreground">{branch.contactNumber}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the branch.
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
