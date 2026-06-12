import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { doctorService } from "../../services/doctor.service";
import { branchService } from "../../services/branch.service";
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

const DoctorsPage = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);

  const { data: doctors = [], isLoading } = useQuery({
    queryKey: ["doctors"],
    queryFn: doctorService.getAll,
  });

  const createMutation = useMutation({
    mutationFn: doctorService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: doctorService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="หมอ"
        subtitle={`ทั้งหมด ${doctors.length} คน`}
        action={
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            เพิ่มหมอ
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <TableSkeleton cols={5} />
          ) : doctors.length === 0 ? (
            <EmptyState message="ไม่พบข้อมูลหมอ" />
          ) : (
            <DataGrid
              rows={doctors}
              columns={[
                { field: "name", headerName: "ชื่อ", flex: 1 },
                { field: "specialty", headerName: "ความเชี่ยวชาญ", flex: 1, valueGetter: (v) => v || "-" },
                { field: "phone", headerName: "เบอร์โทร", width: 140, valueGetter: (v) => formatPhone(v) },
                {
                  field: "branches",
                  headerName: "สาขา",
                  flex: 1,
                  valueGetter: (_, row) =>
                    row.doctorBranches?.map((db) => db.branch?.name).join(", ") || "-",
                },
                {
                  field: "isActive",
                  headerName: "สถานะ",
                  width: 110,
                  renderCell: (params) => (
                    <StatusBadge
                      status={params.row.isActive ? "ACTIVE" : "INACTIVE"}
                      label={params.row.isActive ? "ใช้งาน" : "ปิด"}
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

      <DoctorForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={(data) => createMutation.mutate(data)}
        isLoading={createMutation.isPending}
        error={createMutation.error?.response?.data?.message}
      />

      <DoctorDetail
        doctor={selected}
        onClose={() => setSelected(null)}
        onDelete={() => {
          deleteMutation.mutate(selected.id);
          setSelected(null);
        }}
      />
    </div>
  );
};

const DoctorForm = ({ open, onClose, onSubmit, isLoading, error }) => {
  const [form, setForm] = useState({
    name: "",
    specialty: "",
    phone: "",
    branchIds: [],
  });

  const { data: branches = [] } = useQuery({
    queryKey: ["branches"],
    queryFn: branchService.getAll,
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleBranchChange = (branchId) => {
    const id = Number(branchId);
    setForm({
      ...form,
      branchIds: form.branchIds.includes(id)
        ? form.branchIds.filter((b) => b !== id)
        : [...form.branchIds, id],
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>เพิ่มหมอใหม่</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="rounded-md bg-destructive/10 text-destructive text-sm p-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="doctor-name">ชื่อหมอ *</Label>
            <Input
              id="doctor-name"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="doctor-specialty">ความเชี่ยวชาญ</Label>
            <Input
              id="doctor-specialty"
              name="specialty"
              value={form.specialty}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="doctor-phone">เบอร์โทร</Label>
            <Input
              id="doctor-phone"
              name="phone"
              value={form.phone}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label>สาขาที่ทำงาน *</Label>
            <div className="space-y-1">
              {branches.map((branch) => (
                <Label
                  key={branch.id}
                  className="flex items-center gap-2 min-h-[44px] cursor-pointer font-normal"
                >
                  <input
                    type="checkbox"
                    checked={form.branchIds.includes(branch.id)}
                    onChange={() => handleBranchChange(branch.id)}
                    className="h-4 w-4 rounded border-border cursor-pointer accent-primary"
                  />
                  <span>{branch.name}</span>
                </Label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              ยกเลิก
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const DoctorDetail = ({ doctor, onClose, onDelete }) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  return (
    <>
      <Dialog open={!!doctor} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>ข้อมูลหมอ</DialogTitle>
          </DialogHeader>

          {doctor && (
            <>
              <div className="divide-y divide-border">
                <DetailRow label="ชื่อ" value={doctor.name} />
                <DetailRow
                  label="ความเชี่ยวชาญ"
                  value={doctor.specialty || "-"}
                />
                <DetailRow label="เบอร์โทร" value={formatPhone(doctor.phone)} />
                <DetailRow
                  label="สาขา"
                  value={
                    doctor.doctorBranches
                      ?.map((db) => db.branch?.name)
                      .join(", ") || "-"
                  }
                />
                <DetailRow
                  label="สถานะ"
                  value={doctor.isActive ? "ใช้งาน" : "ปิด"}
                  valueClassName={
                    doctor.isActive ? "text-green-600" : "text-destructive"
                  }
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => setConfirmOpen(true)}
                >
                  ปิดการใช้งาน
                </Button>
                <Button className="flex-1" onClick={onClose}>
                  ปิด
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
        title="ยืนยันการปิดการใช้งาน"
        description={doctor ? `ต้องการปิดการใช้งาน "${doctor.name}" หรือไม่?` : ""}
        confirmLabel="ปิดการใช้งาน"
      />
    </>
  );
};

export default DoctorsPage;
