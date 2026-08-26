import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { patientService } from "../../services/patient.service.js";
import { Search, Plus, X } from "lucide-react";
import api from "../../services/api.js";
import { formatPhone } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import DetailRow from "@/components/shared/DetailRow";
import EmptyState from "@/components/shared/EmptyState";
import TableSkeleton from "@/components/shared/TableSkeleton";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { datagridSx } from "@/lib/datagrid";

const PatientsPage = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ["patients", search],
    queryFn: () => patientService.getAll({ search }),
  });

  const { data: pendingUsers = [], isError: pendingError } = useQuery({
    queryKey: ["pending-line"],
    queryFn: () => api.get("/webhook/pending").then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: patientService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      setShowForm(false);
    },
  });

  const linkMutation = useMutation({
    mutationFn: ({ patientId, lineUserId }) =>
      api.post("/webhook/link", { patientId, lineUserId }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      queryClient.invalidateQueries({ queryKey: ["pending-line"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: patientService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });

  const unlinkMutation = useMutation({
    mutationFn: (patientId) =>
      api.delete(`/webhook/link/${patientId}`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      setSelected(null);
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Patients"
        subtitle={`${patients.length} total`}
        action={
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add patient
          </Button>
        }
      />

      {pendingError && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-3 text-sm text-destructive">
            Unable to load pending LINE links. Please refresh the page.
          </CardContent>
        </Card>
      )}

      {pendingUsers.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <h2 className="font-semibold text-amber-800 mb-1">
              Pending LINE links ({pendingUsers.length})
            </h2>
            <p className="text-xs text-amber-600 mb-3">
              These users already follow the clinic's LINE bot —
              select a patient to link the account.
            </p>
            <div className="space-y-2">
              {pendingUsers.map((user) => (
                <Card key={user.id} className="bg-background">
                  <CardContent className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={user.pictureUrl} />
                        <AvatarFallback className="text-xs">
                          {user.displayName?.charAt(0) ?? "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">
                          {user.displayName || "No name"}
                        </p>
                      </div>
                    </div>

                    <Select
                      onValueChange={(patientId) => {
                        if (patientId) {
                          linkMutation.mutate({
                            patientId,
                            lineUserId: user.lineUserId,
                          });
                        }
                      }}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select patient" />
                      </SelectTrigger>
                      <SelectContent>
                        {patients.map((p) => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            {p.firstName} {p.lastName} ({p.phone})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        />
        <Input
          type="text"
          placeholder="Search patient, phone, HN…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 pr-9 rounded-full bg-muted border border-border focus-visible:ring-2 focus-visible:ring-ring"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <TableSkeleton cols={6} />
          ) : patients.length === 0 ? (
            <EmptyState message="No patients found" />
          ) : (
            <DataGrid
              rows={patients}
              columns={[
                { field: "opdNumber", headerName: "OPD", width: 100 },
                {
                  field: "fullName",
                  headerName: "Name",
                  flex: 1,
                  renderCell: (params) => (
                    <div className="flex flex-col justify-center py-1">
                      <p className="font-medium text-sm leading-tight">
                        {params.row.firstName} {params.row.lastName}
                      </p>
                      {params.row.nickname && (
                        <p className="text-xs text-muted-foreground">
                          ({params.row.nickname})
                        </p>
                      )}
                    </div>
                  ),
                },
                {
                  field: "phone",
                  headerName: "Phone",
                  width: 140,
                  valueGetter: (v) => formatPhone(v),
                },
                {
                  field: "age",
                  headerName: "Age",
                  width: 70,
                  valueGetter: (v) => v || "-",
                },
                {
                  field: "isNewPatient",
                  headerName: "Type",
                  width: 90,
                  renderCell: (params) => (
                    <StatusBadge
                      status={params.row.isNewPatient ? "ACTIVE" : "INACTIVE"}
                      label={params.row.isNewPatient ? "New" : "Returning"}
                    />
                  ),
                },
                {
                  field: "allergyHistory",
                  headerName: "Allergies",
                  flex: 1,
                  valueGetter: (v) => v || "-",
                },
              ]}
              autoHeight
              pageSizeOptions={[10, 25]}
              initialState={{
                pagination: { paginationModel: { pageSize: 10 } },
              }}
              onRowClick={(params) => setSelected(params.row)}
              sx={{ ...datagridSx, cursor: "pointer" }}
            />
          )}
        </CardContent>
      </Card>

      <PatientForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={(data) => createMutation.mutate(data)}
        isLoading={createMutation.isPending}
        error={createMutation.error?.response?.data?.message}
      />

      <PatientDetail
        patient={selected}
        onClose={() => setSelected(null)}
        onDelete={() => {
          deleteMutation.mutate(selected.id);
          setSelected(null);
        }}
        onUnlink={() => unlinkMutation.mutate(selected.id)}
        unlinkLoading={unlinkMutation.isPending}
      />
    </div>
  );
};

const PatientForm = ({ open, onClose, onSubmit, isLoading, error }) => {
  const [form, setForm] = useState({
    opdNumber: "",
    firstName: "",
    lastName: "",
    nickname: "",
    phone: "",
    age: "",
    allergyHistory: "",
    nationalId: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...form, age: form.age ? Number(form.age) : null });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add new patient</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="rounded-md bg-destructive/10 text-destructive text-sm p-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="p-opd">OPD number *</Label>
              <Input
                id="p-opd"
                name="opdNumber"
                value={form.opdNumber}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-nid">National ID</Label>
              <Input
                id="p-nid"
                name="nationalId"
                value={form.nationalId}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="p-first">First name *</Label>
              <Input
                id="p-first"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-last">Last name *</Label>
              <Input
                id="p-last"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="p-nick">Nickname</Label>
              <Input
                id="p-nick"
                name="nickname"
                value={form.nickname}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-age">Age</Label>
              <Input
                id="p-age"
                name="age"
                type="number"
                value={form.age}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="p-phone">Phone *</Label>
            <Input
              id="p-phone"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="p-allergy">Allergy history</Label>
            <Textarea
              id="p-allergy"
              name="allergyHistory"
              value={form.allergyHistory}
              onChange={handleChange}
              rows={2}
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

const PatientDetail = ({ patient, onClose, onDelete, onUnlink, unlinkLoading }) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [unlinkOpen, setUnlinkOpen] = useState(false);
  return (
    <>
      <Dialog open={!!patient} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Patient details</DialogTitle>
          </DialogHeader>

          {patient && (
            <>
              <div className="divide-y divide-border">
                <DetailRow label="OPD number" value={patient.opdNumber} />
                <DetailRow
                  label="Name"
                  value={`${patient.firstName} ${patient.lastName}`}
                />
                <DetailRow label="Nickname" value={patient.nickname || "-"} />
                <DetailRow
                  label="Phone"
                  value={formatPhone(patient.phone)}
                />
                <DetailRow label="Age" value={patient.age || "-"} />
                <DetailRow
                  label="Type"
                  value={patient.isNewPatient ? "New patient" : "Returning patient"}
                />
                <DetailRow
                  label="Allergies"
                  value={patient.allergyHistory || "-"}
                  valueClassName={
                    patient.allergyHistory ? "text-destructive" : undefined
                  }
                />
                <div className="flex items-center justify-between py-2.5 gap-4">
                  <span className="text-sm text-muted-foreground shrink-0">LINE</span>
                  {patient.lineUserId ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {patient.lineDisplayName || "Linked"}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setUnlinkOpen(true)}
                        disabled={unlinkLoading}
                      >
                        Unlink LINE
                      </Button>
                    </div>
                  ) : (
                    <span className="text-sm font-medium text-muted-foreground">
                      Not linked
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => setConfirmOpen(true)}
                >
                  Delete
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
        onConfirm={() => {
          setConfirmOpen(false);
          onDelete();
        }}
        title="Confirm delete patient"
        description={
          patient
            ? `Delete "${patient.firstName} ${patient.lastName}" from the system?`
            : ""
        }
        confirmLabel="Delete"
      />

      <ConfirmDialog
        open={unlinkOpen}
        onClose={() => setUnlinkOpen(false)}
        onConfirm={() => {
          setUnlinkOpen(false);
          onUnlink();
        }}
        title="Confirm unlink LINE"
        description={
          patient
            ? `Unlink the LINE account of "${patient.firstName} ${patient.lastName}"?`
            : ""
        }
        confirmLabel="Unlink LINE"
      />
    </>
  );
};

export default PatientsPage;
