import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { bookingService } from "../../services/booking.service.js";
import { patientService } from "../../services/patient.service.js";
import { doctorService } from "../../services/doctor.service.js";
import { branchService } from "../../services/branch.service.js";
import { serviceService } from "../../services/service.service.js";
import { Plus, Search } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import DetailRow from "@/components/shared/DetailRow";
import EmptyState from "@/components/shared/EmptyState";

const BookingSlotSkeleton = () => (
  <div className="w-full p-4 rounded-xl border-2 border-border bg-card">
    <div className="flex items-start justify-between gap-3">
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-3 w-52" />
      </div>
      <Skeleton className="h-5 w-16 rounded-full shrink-0" />
    </div>
  </div>
);

const SLOT_BORDER = {
  PENDING:     "border-amber-400",
  CONFIRMED:   "border-blue-400",
  COMPLETED:   "border-green-500",
  CANCELLED:   "border-red-400",
  NO_SHOW:     "border-border",
  RESCHEDULED: "border-purple-400",
};

const BookingSlot = ({ booking, onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full text-left p-4 rounded-xl border-2 bg-card transition-colors min-h-[44px]",
      "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
      "hover:bg-accent/10",
      SLOT_BORDER[booking.status] ?? "border-border",
    )}
  >
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="font-medium text-sm truncate">
          {booking.patient?.nickname || booking.patient?.firstName}{" "}
          {booking.patient?.lastName}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {booking.startTime} – {booking.endTime} · {booking.service?.name}
        </p>
        {booking.patient?.allergyHistory && (
          <p className="text-xs text-destructive mt-0.5">
            แพ้: {booking.patient.allergyHistory}
          </p>
        )}
      </div>
      <div className="shrink-0 flex flex-col items-end gap-1">
        <StatusBadge status={booking.status} />
        <span className="text-xs text-muted-foreground">
          {booking.doctor?.name}
        </span>
      </div>
    </div>
  </button>
);

const BookingsPage = () => {
  const queryClient = useQueryClient();
  const [calDate, setCalDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);

  const date = format(calDate, "yyyy-MM-dd");

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["bookings", date],
    queryFn: () => bookingService.getAll({ date }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => bookingService.updateStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bookings"] }),
  });

  const createMutation = useMutation({
    mutationFn: bookingService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      setShowForm(false);
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="การจอง"
        subtitle={format(calDate, "EEEE dd MMMM yyyy", { locale: th })}
        action={
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            จองคิว
          </Button>
        }
      />

      <div className="flex flex-col md:flex-row gap-6">
        {/* Left: Calendar */}
        <div className="md:w-80 shrink-0">
          <Card>
            <CardContent className="p-1">
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={th}>
                <DateCalendar
                  value={calDate}
                  onChange={(d) => d && setCalDate(d)}
                  sx={{ width: "100%" }}
                />
              </LocalizationProvider>
            </CardContent>
          </Card>
          <p className="text-sm text-muted-foreground mt-2 px-1">
            {bookings.length} การจอง
          </p>
        </div>

        {/* Right: Booking slots */}
        <div className="flex-1 min-w-0 max-w-lg">
          <ScrollArea className="h-[calc(100vh-220px)]">
            <div className="space-y-2 pr-4">
              {isLoading ? (
                Array.from({ length: 4 }, (_, i) => <BookingSlotSkeleton key={i} />)
              ) : bookings.length === 0 ? (
                <EmptyState message="ไม่มีการจองวันนี้" />
              ) : (
                bookings.map((booking) => (
                  <BookingSlot
                    key={booking.id}
                    booking={booking}
                    onClick={() => setSelected(booking)}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      <BookingForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={(data) => createMutation.mutate(data)}
        isLoading={createMutation.isPending}
        error={createMutation.error?.response?.data?.message}
        defaultDate={date}
      />

      <BookingDetail
        booking={selected}
        onClose={() => setSelected(null)}
        onStatusChange={(status) => {
          statusMutation.mutate({ id: selected.id, status });
          setSelected(null);
        }}
      />
    </div>
  );
};

const BookingForm = ({ open, onClose, onSubmit, isLoading, error, defaultDate }) => {
  const [form, setForm] = useState({
    patientId: "",
    doctorId: "",
    branchId: "",
    serviceId: "",
    date: defaultDate,
    startTime: "",
    deposit: "",
    note: "",
  });

  const [patientSearch, setPatientSearch] = useState("");
  const [patientDisplay, setPatientDisplay] = useState("");
  const [patientPopoverOpen, setPatientPopoverOpen] = useState(false);

  const { data: patients = [] } = useQuery({
    queryKey: ["patients", patientSearch],
    queryFn: () => patientService.getAll({ search: patientSearch }),
    enabled: patientSearch.length > 1,
  });

  const { data: doctors = [] } = useQuery({
    queryKey: ["doctors"],
    queryFn: doctorService.getAll,
  });

  const { data: branches = [] } = useQuery({
    queryKey: ["branches"],
    queryFn: branchService.getAll,
  });

  const { data: services = [] } = useQuery({
    queryKey: ["services"],
    queryFn: serviceService.getAll,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      patientId: Number(form.patientId),
      doctorId: Number(form.doctorId),
      branchId: Number(form.branchId),
      serviceId: Number(form.serviceId),
      deposit: form.deposit ? Number(form.deposit) : null,
    });
  };

  const set = (field) => (value) => setForm((f) => ({ ...f, [field]: value }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>จองคิวใหม่</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="rounded-md bg-destructive/10 text-destructive text-sm p-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Patient search combobox */}
          <div className="space-y-1.5">
            <Label>ค้นหาลูกค้า *</Label>
            <Popover
              open={patientPopoverOpen}
              onOpenChange={setPatientPopoverOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between font-normal"
                >
                  {patientDisplay || "พิมพ์ชื่อหรือเบอร์โทร"}
                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput
                    placeholder="ค้นหาลูกค้า..."
                    value={patientSearch}
                    onValueChange={(v) => {
                      setPatientSearch(v);
                      setForm((f) => ({ ...f, patientId: "" }));
                    }}
                  />
                  <CommandList>
                    <CommandEmpty>ไม่พบลูกค้า</CommandEmpty>
                    <CommandGroup>
                      {patients.map((p) => (
                        <CommandItem
                          key={p.id}
                          value={`${p.firstName} ${p.lastName} ${p.phone}`}
                          onSelect={() => {
                            setForm((f) => ({ ...f, patientId: p.id }));
                            setPatientDisplay(
                              `${p.nickname || p.firstName} ${p.lastName} (${p.phone})`,
                            );
                            setPatientSearch(
                              `${p.nickname || p.firstName} ${p.lastName} (${p.phone})`,
                            );
                            setPatientPopoverOpen(false);
                          }}
                        >
                          {p.nickname || p.firstName} {p.lastName} – {p.phone}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="b-branch">สาขา *</Label>
              <Select value={form.branchId} onValueChange={set("branchId")} required>
                <SelectTrigger id="b-branch" className="w-full">
                  <SelectValue placeholder="เลือกสาขา" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="b-doctor">หมอ *</Label>
              <Select value={form.doctorId} onValueChange={set("doctorId")} required>
                <SelectTrigger id="b-doctor" className="w-full">
                  <SelectValue placeholder="เลือกหมอ" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="b-service">หัตถการ *</Label>
            <Select value={form.serviceId} onValueChange={set("serviceId")} required>
              <SelectTrigger id="b-service" className="w-full">
                <SelectValue placeholder="เลือกหัตถการ" />
              </SelectTrigger>
              <SelectContent>
                {services.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name} ({s.duration} นาที)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="b-date">วันที่ *</Label>
              <Input
                id="b-date"
                type="date"
                value={form.date}
                onChange={(e) => set("date")(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="b-time">เวลาเริ่ม *</Label>
              <Input
                id="b-time"
                type="time"
                value={form.startTime}
                onChange={(e) => set("startTime")(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="b-deposit">มัดจำ (บาท)</Label>
            <Input
              id="b-deposit"
              type="number"
              value={form.deposit}
              onChange={(e) => set("deposit")(e.target.value)}
              placeholder="500"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="b-note">หมายเหตุ</Label>
            <Textarea
              id="b-note"
              value={form.note}
              onChange={(e) => set("note")(e.target.value)}
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

const BookingDetail = ({ booking, onClose, onStatusChange }) => {
  const statuses = [
    { value: "CONFIRMED",  label: "ยืนยันนัด" },
    { value: "COMPLETED",  label: "เสร็จแล้ว" },
    { value: "CANCELLED",  label: "ยกเลิก" },
    { value: "NO_SHOW",    label: "ไม่มา" },
  ];

  return (
    <Dialog open={!!booking} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>รายละเอียดการจอง</DialogTitle>
          {booking && (
            <p className="text-xs text-muted-foreground">{booking.bookingNo}</p>
          )}
        </DialogHeader>

        {booking && (
          <>
            <div className="divide-y divide-border">
              <DetailRow
                label="ลูกค้า"
                value={`${booking.patient?.firstName} ${booking.patient?.lastName}`}
              />
              <DetailRow
                label="ชื่อเล่น"
                value={booking.patient?.nickname || "-"}
              />
              <DetailRow
                label="เวลา"
                value={`${booking.startTime} – ${booking.endTime}`}
              />
              <DetailRow label="หัตถการ" value={booking.service?.name} />
              <DetailRow label="หมอ" value={booking.doctor?.name} />
              <DetailRow label="สาขา" value={booking.branch?.name} />
              <DetailRow
                label="มัดจำ"
                value={booking.deposit ? `฿${formatCurrency(booking.deposit)}` : "-"}
              />
              <DetailRow label="หมายเหตุ" value={booking.note || "-"} />
              {booking.patient?.allergyHistory && (
                <DetailRow
                  label="แพ้ยา"
                  value={booking.patient.allergyHistory}
                  valueClassName="text-destructive"
                />
              )}
              <div className="flex items-center justify-between py-2.5 gap-4">
                <span className="text-sm text-muted-foreground shrink-0">
                  สถานะ
                </span>
                <StatusBadge status={booking.status} />
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">เปลี่ยนสถานะ</p>
              <div className="grid grid-cols-2 gap-2">
                {statuses.map((s) => (
                  <Button
                    key={s.value}
                    variant="outline"
                    size="sm"
                    onClick={() => onStatusChange(s.value)}
                    disabled={booking.status === s.value}
                    className="min-h-[44px]"
                  >
                    {s.label}
                  </Button>
                ))}
              </div>
            </div>

            <Button className="w-full" onClick={onClose}>
              ปิด
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BookingsPage;
