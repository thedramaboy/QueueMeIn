import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Shield, UserRound, Crown } from "lucide-react";
import useAuthStore from "../../stores/auth.store.js";
import { userService } from "../../services/user.service.js";
import { branchService } from "../../services/branch.service.js";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import TableSkeleton from "@/components/shared/TableSkeleton";
import EmptyState from "@/components/shared/EmptyState";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { datagridSx } from "@/lib/datagrid";

const RoleBadge = ({ role }) => {
  if (role === "SUPERUSER") return (
    <Badge className="bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-100 gap-1">
      <Crown className="h-3 w-3" /> Superuser
    </Badge>
  );
  if (role === "ADMIN") return (
    <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/10 gap-1">
      <Shield className="h-3 w-3" /> Admin
    </Badge>
  );
  return (
    <Badge variant="secondary" className="gap-1">
      <UserRound className="h-3 w-3" /> Staff
    </Badge>
  );
};

const columns = [
  { field: "name", headerName: "Name", flex: 1 },
  { field: "email", headerName: "Email", flex: 1 },
  {
    field: "role",
    headerName: "Role",
    width: 120,
    renderCell: (params) => <RoleBadge role={params.value} />,
  },
  {
    field: "branch",
    headerName: "Branch",
    width: 160,
    valueGetter: (_, row) => row.branch?.name || "All branches",
  },
  {
    field: "isActive",
    headerName: "Status",
    width: 110,
    renderCell: (params) => (
      <StatusBadge
        status={params.value ? "ACTIVE" : "INACTIVE"}
        label={params.value ? "Active" : "Inactive"}
      />
    ),
  },
];

const UsersPage = () => {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: userService.getAll,
  });

  const createMutation = useMutation({
    mutationFn: userService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setShowForm(false);
      toast.success("User account created");
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: userService.deactivate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setSelected(null);
      toast.success("Account deactivated");
    },
  });

  const activeCount = users.filter((u) => u.isActive).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="User management"
        subtitle={`${activeCount} of ${users.length} accounts active`}
        action={
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add user
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <TableSkeleton cols={5} />
          ) : users.length === 0 ? (
            <EmptyState message="No users in the system yet" />
          ) : (
            <DataGrid
              rows={users}
              columns={columns}
              autoHeight
              hideFooter
              onRowClick={(params) => setSelected(params.row)}
              sx={{ ...datagridSx, cursor: "pointer" }}
            />
          )}
        </CardContent>
      </Card>

      <UserForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={(data) => createMutation.mutate(data)}
        isLoading={createMutation.isPending}
        error={createMutation.error?.response?.data?.message}
        currentUserRole={currentUser?.role}
      />

      <UserDetail
        user={selected}
        onClose={() => setSelected(null)}
        onDeactivate={() => {
          deactivateMutation.mutate(selected.id);
        }}
        isDeactivating={deactivateMutation.isPending}
      />
    </div>
  );
};

const UserForm = ({ open, onClose, onSubmit, isLoading, error, currentUserRole }) => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "STAFF",
    branchId: "",
  });

  const { data: branches = [] } = useQuery({
    queryKey: ["branches"],
    queryFn: branchService.getAll,
  });

  const set = (field) => (value) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      branchId: form.branchId ? Number(form.branchId) : null,
    });
  };

  const handleClose = () => {
    setForm({ name: "", email: "", password: "", role: "STAFF", branchId: "" });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add user</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="rounded-md bg-destructive/10 text-destructive text-sm p-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="u-name">Name *</Label>
            <Input
              id="u-name"
              value={form.name}
              onChange={(e) => set("name")(e.target.value)}
              placeholder="John Smith"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="u-email">Email *</Label>
            <Input
              id="u-email"
              type="email"
              value={form.email}
              onChange={(e) => set("email")(e.target.value)}
              placeholder="staff@clinic.com"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="u-password">Password *</Label>
            <Input
              id="u-password"
              type="password"
              value={form.password}
              onChange={(e) => set("password")(e.target.value)}
              placeholder="At least 6 characters"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="u-role">Role *</Label>
              <Select value={form.role} onValueChange={set("role")}>
                <SelectTrigger id="u-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STAFF">Staff</SelectItem>
                  {currentUserRole === "SUPERUSER" && (
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="u-branch">Branch</Label>
              <Select
                value={form.branchId || "none"}
                onValueChange={(v) => set("branchId")(v === "none" ? "" : v)}
              >
                <SelectTrigger id="u-branch">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">All branches</SelectItem>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const UserDetail = ({ user, onClose, onDeactivate, isDeactivating }) => {
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!user) return null;

  return (
    <>
      <Dialog open={!!user} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>User details</DialogTitle>
          </DialogHeader>

          <div className="divide-y divide-border">
            <DetailRow label="Name" value={user.name} />
            <DetailRow label="Email" value={user.email} />
            <div className="flex items-center justify-between py-2.5 gap-4">
              <span className="text-sm text-muted-foreground shrink-0">Role</span>
              <RoleBadge role={user.role} />
            </div>
            <DetailRow label="Branch" value={user.branch?.name || "All branches"} />
            <div className="flex items-center justify-between py-2.5 gap-4">
              <span className="text-sm text-muted-foreground shrink-0">Status</span>
              <StatusBadge
                status={user.isActive ? "ACTIVE" : "INACTIVE"}
                label={user.isActive ? "Active" : "Inactive"}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            {user.isActive && (
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => setConfirmOpen(true)}
                disabled={isDeactivating}
              >
                Deactivate
              </Button>
            )}
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          onDeactivate();
        }}
        title="Confirm deactivation"
        description={`The account "${user.name}" will not be able to log in until it is reactivated.`}
        confirmLabel="Deactivate"
      />
    </>
  );
};

export default UsersPage;
