import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Shield, UserRound } from "lucide-react";
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

const RoleBadge = ({ role }) =>
  role === "OWNER" ? (
    <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/10 gap-1">
      <Shield className="h-3 w-3" /> Owner
    </Badge>
  ) : (
    <Badge variant="secondary" className="gap-1">
      <UserRound className="h-3 w-3" /> Staff
    </Badge>
  );

const columns = [
  { field: "name", headerName: "ชื่อ", flex: 1 },
  { field: "email", headerName: "อีเมล", flex: 1 },
  {
    field: "role",
    headerName: "บทบาท",
    width: 120,
    renderCell: (params) => <RoleBadge role={params.value} />,
  },
  {
    field: "branch",
    headerName: "สาขา",
    width: 160,
    valueGetter: (_, row) => row.branch?.name || "ทุกสาขา",
  },
  {
    field: "isActive",
    headerName: "สถานะ",
    width: 110,
    renderCell: (params) => (
      <StatusBadge
        status={params.value ? "ACTIVE" : "INACTIVE"}
        label={params.value ? "ใช้งาน" : "ปิดใช้งาน"}
      />
    ),
  },
];

const UsersPage = () => {
  const queryClient = useQueryClient();
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
      toast.success("สร้างบัญชีผู้ใช้สำเร็จ");
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: userService.deactivate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setSelected(null);
      toast.success("ปิดใช้งานบัญชีสำเร็จ");
    },
  });

  const activeCount = users.filter((u) => u.isActive).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="จัดการผู้ใช้งาน"
        subtitle={`ใช้งานอยู่ ${activeCount} จาก ${users.length} บัญชี`}
        action={
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            เพิ่มผู้ใช้
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <TableSkeleton cols={5} />
          ) : users.length === 0 ? (
            <EmptyState message="ยังไม่มีผู้ใช้งานในระบบ" />
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

const UserForm = ({ open, onClose, onSubmit, isLoading, error }) => {
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
          <DialogTitle>เพิ่มผู้ใช้งาน</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="rounded-md bg-destructive/10 text-destructive text-sm p-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="u-name">ชื่อ *</Label>
            <Input
              id="u-name"
              value={form.name}
              onChange={(e) => set("name")(e.target.value)}
              placeholder="สมชาย ใจดี"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="u-email">อีเมล *</Label>
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
            <Label htmlFor="u-password">รหัสผ่าน *</Label>
            <Input
              id="u-password"
              type="password"
              value={form.password}
              onChange={(e) => set("password")(e.target.value)}
              placeholder="อย่างน้อย 6 ตัวอักษร"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="u-role">บทบาท *</Label>
              <Select value={form.role} onValueChange={set("role")}>
                <SelectTrigger id="u-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STAFF">Staff</SelectItem>
                  <SelectItem value="OWNER">Owner</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="u-branch">สาขา</Label>
              <Select
                value={form.branchId || "none"}
                onValueChange={(v) => set("branchId")(v === "none" ? "" : v)}
              >
                <SelectTrigger id="u-branch">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">ทุกสาขา</SelectItem>
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
              ยกเลิก
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? "กำลังบันทึก..." : "บันทึก"}
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
            <DialogTitle>ข้อมูลผู้ใช้งาน</DialogTitle>
          </DialogHeader>

          <div className="divide-y divide-border">
            <DetailRow label="ชื่อ" value={user.name} />
            <DetailRow label="อีเมล" value={user.email} />
            <div className="flex items-center justify-between py-2.5 gap-4">
              <span className="text-sm text-muted-foreground shrink-0">บทบาท</span>
              <RoleBadge role={user.role} />
            </div>
            <DetailRow label="สาขา" value={user.branch?.name || "ทุกสาขา"} />
            <div className="flex items-center justify-between py-2.5 gap-4">
              <span className="text-sm text-muted-foreground shrink-0">สถานะ</span>
              <StatusBadge
                status={user.isActive ? "ACTIVE" : "INACTIVE"}
                label={user.isActive ? "ใช้งาน" : "ปิดใช้งาน"}
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
                ปิดใช้งาน
              </Button>
            )}
            <Button variant="outline" className="flex-1" onClick={onClose}>
              ปิด
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
        title="ยืนยันการปิดใช้งาน"
        description={`บัญชี "${user.name}" จะไม่สามารถเข้าสู่ระบบได้อีกจนกว่าจะเปิดใช้งานใหม่`}
        confirmLabel="ปิดใช้งาน"
      />
    </>
  );
};

export default UsersPage;
