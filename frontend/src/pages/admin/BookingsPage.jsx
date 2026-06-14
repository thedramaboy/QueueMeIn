import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { bookingService } from "../../services/booking.service.js";
import { patientService } from "../../services/patient.service.js";
import { doctorService } from "../../services/doctor.service.js";
import { branchService } from "../../services/branch.service.js";
import { serviceService } from "../../services/service.service.js";
import { toast } from "sonner";
import { Plus, Search, Pencil, X } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import DetailRow from "@/components/shared/DetailRow";
import EmptyState from "@/components/shared/EmptyState";

const HOUR_START = 8;
const HOUR_END = 20;
const TOTAL_MINUTES = (HOUR_END - HOUR_START) * 60;
const HOURS = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i);
const ROW_HEIGHT = 64;

const STATUS_BLOCK = {
  PENDING:     "bg-amber-50 border-amber-400 text-amber-900",
  CONFIRMED:   "bg-blue-50 border-blue-400 text-blue-900",
  COMPLETED:   "bg-green-50 border-green-500 text-green-900",
  CANCELLED:   "bg-red-50 border-red-400 text-red-700 opacity-50",
  NO_SHOW:     "bg-gray-100 border-gray-400 text-gray-500 opacity-50",
  RESCHEDULED: "bg-purple-50 border-purple-400 text-purple-900 opacity-60",
};

const timeToMinutes = (t) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

const getBlockStyle = (booking) => {
  const startMin = Math.max(0, timeToMinutes(booking.startTime) - HOUR_START * 60);
  const endMin = Math.min(TOTAL_MINUTES, timeToMinutes(booking.endTime) - HOUR_START * 60);
  return {
    left: `${(startMin / TOTAL_MINUTES) * 100}%`,
    width: `${Math.max(1, ((endMin - startMin) / TOTAL_MINUTES) * 100)}%`,
  };
};

const GanttSkeleton = () => (
  <Card>
    <CardContent className="p-0">
      <div className="min-w-[700px]">
        <div className="flex border-b border-border h-9">
          <div className="w-36 shrink-0 border-r border-border/40" />
          <Skeleton className="flex-1 m-2 rounded" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex border-b border-border/30" style={{ minHeight: ROW_HEIGHT }}>
            <div className="w-36 shrink-0 border-r border-border/40 p-3 flex items-center">
              <Skeleton className="h-3 w-24" />
            </div>
            <div className="flex-1 p-2 flex items-center">
              <Skeleton className="h-10 rounded" style={{ width: `${20 + i * 10}%` }} />
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

const BookingGantt = ({ bookings, isLoading, onBookingClick }) => {
  const doctorRows = useMemo(() => {
    const map = new Map();
    for (const b of bookings) {
      const key = b.doctor?.id ?? 0;
      if (!map.has(key)) map.set(key, { doctor: b.doctor, bookings: [] });
      map.get(key).bookings.push(b);
    }
    return Array.from(map.values());
  }, [bookings]);

  if (isLoading) return <GanttSkeleton />;
  if (bookings.length === 0) return <EmptyState message="ไม่มีการจองวันนี้" />;

  return (
    <Card>
      <CardContent className="p-0 overflow-x-auto">
        <div className="min-w-[700px]">
          {/* Hour header */}
          <div className="flex border-b border-border">
            <div className="w-36 shrink-0 border-r border-border/40" />
            <div className="flex-1 flex">
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="flex-1 text-xs text-muted-foreground py-2 pl-1 border-l border-border/40 font-mono"
                >
                  {h}:00
                </div>
              ))}
            </div>
          </div>

          {/* Doctor rows */}
          {doctorRows.map(({ doctor, bookings: rowBookings }) => (
            <div
              key={doctor?.id}
              className="flex border-b border-border/30 last:border-0"
              style={{ minHeight: ROW_HEIGHT }}
            >
              {/* Doctor name */}
              <div className="w-36 shrink-0 sticky left-0 bg-card flex items-center px-3 border-r border-border/40 z-10">
                <p className="text-xs font-medium leading-tight">{doctor?.name}</p>
              </div>

              {/* Time area */}
              <div className="flex-1 relative" style={{ minHeight: ROW_HEIGHT }}>
                {/* Grid lines */}
                <div className="absolute inset-0 flex pointer-events-none">
                  {HOURS.map((h) => (
                    <div key={h} className="flex-1 border-l border-border/30" />
                  ))}
                </div>

                {/* Booking blocks */}
                {rowBookings.map((booking) => {
                  const { left, width } = getBlockStyle(booking);
                  return (
                    <div
                      key={booking.id}
                      className={cn(
                        "absolute top-2 bottom-2 rounded border cursor-pointer px-2 py-1 overflow-hidden",
                        "hover:brightness-95 transition-all",
                        STATUS_BLOCK[booking.status] ?? STATUS_BLOCK.PENDING,
                      )}
                      style={{ left, width }}
                      onClick={() => onBookingClick(booking)}
                    >
                      <p className="text-xs font-semibold truncate leading-tight">
                        {booking.patient?.nickname || booking.patient?.firstName}{" "}
                        {booking.patient?.lastName}
                      </p>
                      <p className="text-xs font-mono truncate opacity-75">
                        {booking.startTime}–{booking.endTime}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const STATUSES = [
  { value: "PENDING",   label: "รอยืนยัน" },
  { value: "CONFIRMED", label: "ยืนยันแล้ว" },
  { value: "COMPLETED", label: "เสร็จสิ้น" },
  { value: "CANCELLED", label: "ยกเลิก" },
  { value: "NO_SHOW",   label: "ไม่มา" },
];

const BookingsPage = () => {
  const queryClient = useQueryClient();
  const [calDate, setCalDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const [filters, setFilters] = useState({ branchId: "", doctorId: "", status: "" });

  const date = format(calDate, "yyyy-MM-dd");
  const hasFilter = filters.branchId || filters.doctorId || filters.status;

  const { data: branches = [] } = useQuery({
    queryKey: ["branches"],
    queryFn: branchService.getAll,
  });

  const { data: doctors = [] } = useQuery({
    queryKey: ["doctors"],
    queryFn: doctorService.getAll,
  });

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["bookings", date, filters.branchId, filters.doctorId, filters.status],
    queryFn: () => bookingService.getAll({
      date,
      ...(filters.branchId && { branchId: filters.branchId }),
      ...(filters.doctorId && { doctorId: filters.doctorId }),
      ...(filters.status   && { status: filters.status }),
    }),
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
      toast.success("สร้างการจองสำเร็จ");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => bookingService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      setEditing(null);
      toast.success("อัปเดตการจองสำเร็จ");
    },
  });

  const paymentMutation = useMutation({
    mutationFn: ({ id, data }) => bookingService.markAsPaid(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      setSelected(null);
      toast.success("บันทึกการชำระเงินสำเร็จ");
    },
  });

  const formOpen = showForm || !!editing;
  const formError =
    createMutation.error?.response?.data?.message ||
    updateMutation.error?.response?.data?.message;

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

        {/* Right: Filter bar + Gantt */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Select
              value={filters.branchId || "all"}
              onValueChange={(v) => setFilters((f) => ({ ...f, branchId: v === "all" ? "" : v }))}
            >
              <SelectTrigger className="h-8 w-36 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกสาขา</SelectItem>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.doctorId || "all"}
              onValueChange={(v) => setFilters((f) => ({ ...f, doctorId: v === "all" ? "" : v }))}
            >
              <SelectTrigger className="h-8 w-44 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกหมอ</SelectItem>
                {doctors.map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.status || "all"}
              onValueChange={(v) => setFilters((f) => ({ ...f, status: v === "all" ? "" : v }))}
            >
              <SelectTrigger className="h-8 w-32 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกสถานะ</SelectItem>
                {STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasFilter && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-muted-foreground"
                onClick={() => setFilters({ branchId: "", doctorId: "", status: "" })}
              >
                <X className="h-3.5 w-3.5 mr-1" />
                ล้าง
              </Button>
            )}
          </div>

          <BookingGantt
            bookings={bookings}
            isLoading={isLoading}
            onBookingClick={setSelected}
          />
        </div>
      </div>

      <BookingForm
        key={editing?.id ?? "create"}
        open={formOpen}
        onClose={() => { setShowForm(false); setEditing(null); }}
        onSubmit={(data) => {
          if (editing) {
            const { patientId, ...updateData } = data;
            updateMutation.mutate({ id: editing.id, data: updateData });
          } else {
            createMutation.mutate(data);
          }
        }}
        isLoading={createMutation.isPending || updateMutation.isPending}
        error={formError}
        defaultDate={date}
        booking={editing}
      />

      <BookingDetail
        booking={selected}
        onClose={() => setSelected(null)}
        onEdit={() => { setEditing(selected); setSelected(null); }}
        onStatusChange={(status) => {
          statusMutation.mutate({ id: selected.id, status });
          setSelected(null);
        }}
        onPayment={(data) => paymentMutation.mutate({ id: selected.id, data })}
        isPaymentLoading={paymentMutation.isPending}
      />
    </div>
  );
};

const BookingForm = ({ open, onClose, onSubmit, isLoading, error, defaultDate, booking }) => {
  const isEdit = !!booking;
  const [form, setForm] = useState({
    patientId: booking ? String(booking.patientId) : "",
    doctorId: booking ? String(booking.doctorId) : "",
    branchId: booking ? String(booking.branchId) : "",
    serviceId: booking ? String(booking.serviceId) : "",
    date: booking ? format(new Date(booking.date), "yyyy-MM-dd") : defaultDate,
    startTime: booking?.startTime ?? "",
    deposit: booking?.deposit != null ? String(booking.deposit) : "",
    note: booking?.note ?? "",
    treatmentNote: booking?.treatmentNote ?? "",
  });

  const patientLabel = booking
    ? `${booking.patient?.nickname || booking.patient?.firstName} ${booking.patient?.lastName} (${booking.patient?.phone})`
    : "";
  const [patientSearch, setPatientSearch] = useState(patientLabel);
  const [patientDisplay, setPatientDisplay] = useState(patientLabel);
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
    queryFn: () => serviceService.getAll(),
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
      treatmentNote: form.treatmentNote || null,
    });
  };

  const set = (field) => (value) => setForm((f) => ({ ...f, [field]: value }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "แก้ไขการจอง" : "จองคิวใหม่"}</DialogTitle>
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
            {isEdit ? (
              <Input value={patientDisplay} disabled className="bg-muted" />
            ) : (
              <Popover open={patientPopoverOpen} onOpenChange={setPatientPopoverOpen}>
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
            )}
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

          {isEdit && (
            <div className="space-y-1.5">
              <Label htmlFor="b-treatment">บันทึกการรักษา</Label>
              <Textarea
                id="b-treatment"
                value={form.treatmentNote}
                onChange={(e) => set("treatmentNote")(e.target.value)}
                placeholder="รายละเอียดการรักษาที่ดำเนินการ..."
                rows={3}
              />
            </div>
          )}

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

const PAYMENT_LABELS = { CASH: "เงินสด", TRANSFER: "โอนเงิน", CARD: "บัตรเครดิต" };
const SKIP_PAY_STATUSES = ["CANCELLED", "NO_SHOW", "RESCHEDULED"];

const BookingDetail = ({ booking, onClose, onEdit, onStatusChange, onPayment, isPaymentLoading }) => {
  const [showPayForm, setShowPayForm] = useState(false);
  const [payForm, setPayForm] = useState({ paidAmount: "", paymentMethod: "CASH" });

  const statuses = [
    { value: "CONFIRMED",  label: "ยืนยันนัด" },
    { value: "COMPLETED",  label: "เสร็จแล้ว" },
    { value: "CANCELLED",  label: "ยกเลิก" },
    { value: "NO_SHOW",    label: "ไม่มา" },
  ];

  const handlePaySubmit = (e) => {
    e.preventDefault();
    onPayment({ paidAmount: Number(payForm.paidAmount), paymentMethod: payForm.paymentMethod });
  };

  return (
    <Dialog open={!!booking} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
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
              <DetailRow label="ชื่อเล่น" value={booking.patient?.nickname || "-"} />
              <DetailRow label="เวลา" value={`${booking.startTime} – ${booking.endTime}`} />
              <DetailRow label="หัตถการ" value={booking.service?.name} />
              <DetailRow label="หมอ" value={booking.doctor?.name} />
              <DetailRow label="สาขา" value={booking.branch?.name} />
              <DetailRow
                label="มัดจำ"
                value={booking.deposit ? `฿${formatCurrency(booking.deposit)}` : "-"}
              />
              <DetailRow label="หมายเหตุ" value={booking.note || "-"} />
              {booking.treatmentNote && (
                <DetailRow label="บันทึกการรักษา" value={booking.treatmentNote} />
              )}
              {booking.patient?.allergyHistory && (
                <DetailRow
                  label="แพ้ยา"
                  value={booking.patient.allergyHistory}
                  valueClassName="text-destructive"
                />
              )}
              <div className="flex items-center justify-between py-2.5 gap-4">
                <span className="text-sm text-muted-foreground shrink-0">สถานะ</span>
                <StatusBadge status={booking.status} />
              </div>
            </div>

            {/* Payment section */}
            {booking.paidAmount ? (
              <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 space-y-0.5">
                <p className="text-sm font-semibold text-green-700">ชำระเงินแล้ว</p>
                <p className="text-sm text-green-700">
                  ฿{formatCurrency(booking.paidAmount)} — {PAYMENT_LABELS[booking.paymentMethod]}
                </p>
              </div>
            ) : !SKIP_PAY_STATUSES.includes(booking.status) && (
              <div>
                {!showPayForm ? (
                  <Button
                    variant="outline"
                    className="w-full border-green-300 text-green-700 hover:bg-green-50"
                    onClick={() => setShowPayForm(true)}
                  >
                    บันทึกการชำระเงิน
                  </Button>
                ) : (
                  <form onSubmit={handlePaySubmit} className="space-y-3 border border-border rounded-lg p-3">
                    <p className="text-sm font-medium">บันทึกการชำระเงิน</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label htmlFor="pay-amount" className="text-xs">จำนวนเงิน (บาท) *</Label>
                        <Input
                          id="pay-amount"
                          type="number"
                          min="1"
                          value={payForm.paidAmount}
                          onChange={(e) => setPayForm((f) => ({ ...f, paidAmount: e.target.value }))}
                          placeholder="0"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="pay-method" className="text-xs">วิธีชำระ *</Label>
                        <Select
                          value={payForm.paymentMethod}
                          onValueChange={(v) => setPayForm((f) => ({ ...f, paymentMethod: v }))}
                        >
                          <SelectTrigger id="pay-method">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CASH">เงินสด</SelectItem>
                            <SelectItem value="TRANSFER">โอนเงิน</SelectItem>
                            <SelectItem value="CARD">บัตรเครดิต</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => setShowPayForm(false)}>
                        ยกเลิก
                      </Button>
                      <Button type="submit" size="sm" className="flex-1" disabled={isPaymentLoading}>
                        {isPaymentLoading ? "กำลังบันทึก..." : "บันทึก"}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            )}

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

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={onEdit}>
                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                แก้ไข
              </Button>
              <Button className="flex-1" onClick={onClose}>
                ปิด
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BookingsPage;
