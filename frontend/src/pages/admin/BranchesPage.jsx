import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { branchService } from "../../services/branch.service.js";
import { Plus } from "lucide-react";
import { formatPhone } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DataGrid } from "@mui/x-data-grid";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import DetailRow from "@/components/shared/DetailRow";
import EmptyState from "@/components/shared/EmptyState";
import TableSkeleton from "@/components/shared/TableSkeleton";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { datagridSx } from "@/lib/datagrid";

const BranchesPage = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);

  const { data: branches = [], isLoading } = useQuery({
    queryKey: ["branches"],
    queryFn: branchService.getAll,
  });

  const createMutation = useMutation({
    mutationFn: branchService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: branchService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Branches"
        subtitle={`${branches.length} total`}
        action={
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add branch
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <TableSkeleton cols={4} />
          ) : branches.length === 0 ? (
            <EmptyState message="No branches found" />
          ) : (
            <DataGrid
              rows={branches}
              columns={[
                { field: "name", headerName: "Branch name", flex: 1 },
                { field: "location", headerName: "Address", flex: 1 },
                { field: "phone", headerName: "Phone", width: 140, valueGetter: (v) => formatPhone(v) },
                {
                  field: "isActive",
                  headerName: "Status",
                  width: 100,
                  renderCell: (params) => (
                    <StatusBadge
                      status={params.row.isActive ? "ACTIVE" : "INACTIVE"}
                      label={params.row.isActive ? "Open" : "Closed"}
                    />
                  ),
                },
              ]}
              autoHeight
              hideFooter
              onRowClick={(params) => setSelected(params.row)}
              sx={{ ...datagridSx, cursor: "pointer" }}
            />
          )}
        </CardContent>
      </Card>

      <BranchForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={(data) => createMutation.mutate(data)}
        isLoading={createMutation.isPending}
        error={createMutation.error?.response?.data?.message}
      />

      <BranchDetail
        branch={selected}
        onClose={() => setSelected(null)}
        onDelete={() => {
          deleteMutation.mutate(selected.id);
          setSelected(null);
        }}
      />
    </div>
  );
};

const BranchForm = ({ open, onClose, onSubmit, isLoading, error }) => {
  const [form, setForm] = useState({ name: "", location: "", phone: "" });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add new branch</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="rounded-md bg-destructive/10 text-destructive text-sm p-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="branch-name">Branch name *</Label>
            <Input
              id="branch-name"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="branch-location">Address *</Label>
            <Input
              id="branch-location"
              name="location"
              value={form.location}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="branch-phone">Phone</Label>
            <Input
              id="branch-phone"
              name="phone"
              value={form.phone}
              onChange={handleChange}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const BranchDetail = ({ branch, onClose, onDelete }) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  return (
    <>
      <Dialog open={!!branch} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Branch details</DialogTitle>
          </DialogHeader>

          {branch && (
            <>
              <div className="divide-y divide-border">
                <DetailRow label="Branch name" value={branch.name} />
                <DetailRow label="Address" value={branch.location} />
                <DetailRow label="Phone" value={formatPhone(branch.phone)} />
                <DetailRow
                  label="Status"
                  value={branch.isActive ? "Open" : "Closed"}
                  valueClassName={branch.isActive ? "text-green-600" : "text-destructive"}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => setConfirmOpen(true)}
                >
                  Close branch
                </Button>
                <Button className="flex-1" onClick={onClose}>
                  Close
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => { setConfirmOpen(false); onDelete(); }}
        title="Confirm closing branch"
        description={branch ? `Close branch "${branch.name}"?` : ""}
        confirmLabel="Close branch"
      />
    </>
  );
};

export default BranchesPage;
