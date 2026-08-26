import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { bookingService } from "../../services/booking.service.js";
import { patientService } from "../../services/patient.service.js";
import { doctorService } from "../../services/doctor.service.js";
import { branchService } from "../../services/branch.service.js";
import { serviceService } from "../../services/service.service.js";
import { toast } from "sonner";
import { Plus, Search, Pencil, X, ChevronLeft, ChevronRight } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import DetailRow from "@/components/shared/DetailRow";
import EmptyState from "@/components/shared/EmptyState";

const HOUR_START = 8;
const HOUR_END = 20;
const TOTAL_HOURS = HOUR_END - HOUR_START;
const PX_PER_HOUR = 96;
const HOURS = Array.from({ length: TOTAL_HOURS }, (_, i) => HOUR_START + i);
const DAY_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const STATUS_BLOCK = {
  PENDING:     "bg-amber-50 border-amber-400 text-amber-900",
  CONFIRMED:   "bg-blue-50 border-blue-400 text-blue-900",
  COMPLETED:   "bg-green-50 border-green-500 text-green-900",
  CANCELLED:   "bg-red-50 border-red-400 text-red-700 opacity-50",
  NO_SHOW:     "bg-gray-100 border-gray-400 text-gray-500 opacity-50",
  RESCHEDULED: "bg-purple-50 border-purple-400 text-purple-900 opacity-60",
};

const STATUSES = [
  { value: "PENDING",   label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "NO_SHOW",   label: "No-show" },
];

const timeToMinutes = (t) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
const timeToTop = (t) =>
  (Math.max(0, timeToMinutes(t) - HOUR_START * 60) / 60) * PX_PER_HOUR;
const timeToDuration = (start, end) =>
  (Math.max(0, timeToMinutes(end) - timeToMinutes(start)) / 60) * PX_PER_HOUR;

function layoutItems(items, getStart, getEnd) {
  const sorted = [...items].sort((a, b) => getStart(a) - getStart(b));
  const result = sorted.map((item) => ({ item, lane: 0, total: 1 }));
  let i = 0;
  while (i < result.length) {
    let maxEnd = getEnd(result[i].item);
    let j = i + 1;
    while (j < result.length && getStart(result[j].item) < maxEnd) {
      maxEnd = Math.max(maxEnd, getEnd(result[j].item));
      j++;
    }
    const count = j - i;
    for (let k = i; k < j; k++) {
      result[k].lane = k - i;
      result[k].total = count;
    }
    i = j;
  }
  return result;
}

const WeekGridSkeleton = () => (
  <Card className="overflow-hidden">
    <CardContent className="p-0">
      <div className="flex border-b border-border h-12">
        <div className="w-14 shrink-0 border-r border-border" />
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className="flex-1 border-l border-border p-2 text-center">
            <Skeleton className="h-2.5 w-5 mx-auto mb-1" />
            <Skeleton className="h-5 w-6 mx-auto" />
          </div>
        ))}
      </div>
      <div className="flex" style={{ height: 320 }}>
        <div className="w-14 shrink-0 border-r border-border" />
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className="flex-1 relative border-l border-border p-1.5">
            {i % 3 === 0 && <Skeleton className="absolute rounded h-14" style={{ top: 80, left: 3, right: 3 }} />}
            {i % 3 === 1 && <Skeleton className="absolute rounded h-9" style={{ top: 148, left: 3, right: 3 }} />}
            {i % 3 === 2 && <Skeleton className="absolute rounded h-10" style={{ top: 200, left: 3, right: 3 }} />}
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

const WeeklyGrid = ({ days, bookingsByDay, isLoading, onBookingClick }) => {
  const today = format(new Date(), "yyyy-MM-dd");

  if (isLoading) return <WeekGridSkeleton />;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="overflow-auto" style={{ maxHeight: "calc(100vh - 230px)" }}>
          <div style={{ minWidth: 540 }}>
            {/* Sticky header */}
            <div className="flex sticky top-0 z-20 bg-card border-b border-border shadow-sm">
              <div className="w-14 shrink-0 border-r border-border" />
              {days.map((day) => {
                const str = format(day, "yyyy-MM-dd");
                const isToday = str === today;
                return (
                  <div
                    key={str}
                    className={cn(
                      "flex-1 text-center py-1.5 border-l border-border",
                      isToday && "bg-primary/5",
                    )}
                  >
                    <div className={cn("text-[10px] font-medium", isToday ? "text-primary" : "text-muted-foreground")}>
                      {DAY_ABBR[day.getDay()]}
                    </div>
                    <div className={cn("text-sm font-bold leading-tight", isToday ? "text-primary" : "text-foreground")}>
                      {format(day, "d")}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Grid body */}
            <div className="flex">
              {/* Time gutter */}
              <div
                className="w-14 shrink-0 sticky left-0 z-10 bg-card border-r border-border"
                style={{ height: TOTAL_HOURS * PX_PER_HOUR }}
              >
                {HOURS.map((h) => (
                  <div
                    key={h}
                    className="relative border-t border-border/40"
                    style={{ height: PX_PER_HOUR }}
                  >
                    <span className="absolute -top-2 right-2 text-[10px] text-muted-foreground font-mono select-none">
                      {String(h).padStart(2, "0")}:00
                    </span>
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {days.map((day) => {
                const str = format(day, "yyyy-MM-dd");
                const isToday = str === today;
                const dayBookings = bookingsByDay[str] ?? [];
                const laid = layoutItems(
                  dayBookings,
                  (b) => timeToMinutes(b.startTime),
                  (b) => timeToMinutes(b.endTime),
                );

                return (
                  <div
                    key={str}
                    className={cn(
                      "flex-1 relative border-l border-border",
                      isToday && "bg-primary/[0.02]",
                    )}
                    style={{ height: TOTAL_HOURS * PX_PER_HOUR }}
                  >
                    {HOURS.map((h) => (
                      <div
                        key={h}
                        className="absolute left-0 right-0 border-t border-border/40"
                        style={{ top: (h - HOUR_START) * PX_PER_HOUR }}
                      />
                    ))}
                    {HOURS.map((h) => (
                      <div
                        key={`${h}h`}
                        className="absolute left-0 right-0 border-t border-border/20"
                        style={{ top: (h - HOUR_START) * PX_PER_HOUR + PX_PER_HOUR / 2 }}
                      />
                    ))}

                    {laid.map(({ item: b, lane, total }) => {
                      const top = timeToTop(b.startTime);
                      const height = Math.max(22, timeToDuration(b.startTime, b.endTime));
                      const widthPct = 100 / total;
                      const leftPct = lane * widthPct;
                      return (
                        <div
                          key={b.id}
                          className={cn(
                            "absolute rounded border text-[10px] cursor-pointer overflow-hidden px-1.5 leading-snug",
                            "hover:brightness-95 transition-all select-none",
                            STATUS_BLOCK[b.status] ?? STATUS_BLOCK.PENDING,
                          )}
                          style={{
                            top: top + 1,
                            height: height - 2,
                            left: `calc(${leftPct}% + 2px)`,
                            width: `calc(${widthPct}% - 4px)`,
                          }}
                          onClick={() => onBookingClick(b)}
                        >
                          <div className="font-semibold truncate pt-0.5">
                            {b.patient?.nickname || b.patient?.firstName}
                          </div>
                          {height >= 26 && (
                            <div className="truncate opacity-75 font-mono">
                              {b.startTime}–{b.endTime}
                            </div>
                          )}
                          {height >= 40 && (
                            <div className="truncate opacity-65">
                              {b.service?.name}
                            </div>
                          )}
                          {height >= 68 && (
                            <div className="truncate opacity-55">
                              {b.doctor?.name?.replace(/^(นพ\.|พญ\.)/, "")}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {dayBookings.length === 0 && (
                      <div
                        className="absolute left-0 right-0 flex items-center justify-center pointer-events-none"
                        style={{ top: PX_PER_HOUR, height: PX_PER_HOUR }}
                      >
                        <span className="text-[10px] text-muted-foreground/40">—</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const BookingsPage = () => {
  const queryClient = useQueryClient();
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - d.getDay());
    return d;
  });
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const [filters, setFilters] = useState({ branchId: "", doctorId: "", status: "" });

  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        return d;
      }),
    [weekStart],
  );

  const weekEndDate = days[6];
  const startDate = format(weekStart, "yyyy-MM-dd");
  const endDate = format(weekEndDate, "yyyy-MM-dd");
  const hasFilter = filters.branchId || filters.doctorId || filters.status;

  const { data: branches = [] } = useQuery({
    queryKey: ["branches"],
    queryFn: () => branchService.getAll(),
  });

  const { data: doctors = [] } = useQuery({
    queryKey: ["doctors"],
    queryFn: () => doctorService.getAll(),
  });

  const { data: bookings = [], isLoading, isFetching } = useQuery({
    queryKey: ["bookings", startDate, endDate, filters.branchId, filters.doctorId, filters.status],
    queryFn: () =>
      bookingService.getAll({
        startDate,
        endDate,
        ...(filters.branchId && { branchId: filters.branchId }),
        ...(filters.doctorId && { doctorId: filters.doctorId }),
        ...(filters.status   && { status: filters.status }),
      }),
  });

  const bookingsByDay = useMemo(() => {
    const map = {};
    for (const b of bookings) {
      const key = format(new Date(b.date), "yyyy-MM-dd");
      if (!map[key]) map[key] = [];
      map[key].push(b);
    }
    return map;
  }, [bookings]);

  const prevWeek = () =>
    setWeekStart((d) => { const n = new Date(d); n.setDate(n.getDate() - 7); return n; });
  const nextWeek = () =>
    setWeekStart((d) => { const n = new Date(d); n.setDate(n.getDate() + 7); return n; });
  const goToday = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - d.getDay());
    setWeekStart(d);
  };

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => bookingService.updateStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bookings"] }),
  });

  const createMutation = useMutation({
    mutationFn: bookingService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      setShowForm(false);
      toast.success("Booking created");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => bookingService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      setEditing(null);
      toast.success("Booking updated");
    },
  });

  const paymentMutation = useMutation({
    mutationFn: ({ id, data }) => bookingService.markAsPaid(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      setSelected(null);
      toast.success("Payment recorded");
    },
  });

  const formOpen = showForm || !!editing;
  const formError =
    createMutation.error?.response?.data?.message ||
    updateMutation.error?.response?.data?.message;

  const weekLabel = `${format(weekStart, "d MMM")} – ${format(weekEndDate, "d MMM yyyy")}`;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Bookings"
        subtitle={weekLabel}
        action={
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New booking
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 mr-1">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={prevWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="h-8 px-3 text-xs" onClick={goToday}>
            This week
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={nextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Select
          value={filters.branchId || "all"}
          onValueChange={(v) => setFilters((f) => ({ ...f, branchId: v === "all" ? "" : v }))}
        >
          <SelectTrigger className="h-8 w-36 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All branches</SelectItem>
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
            <SelectItem value="all">All doctors</SelectItem>
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
            <SelectItem value="all">All statuses</SelectItem>
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
            Clear
          </Button>
        )}

        <span className="ml-auto text-xs text-muted-foreground">
          {bookings.length} items
        </span>
      </div>

      <WeeklyGrid
        days={days}
        bookingsByDay={bookingsByDay}
        isLoading={isLoading || isFetching}
        onBookingClick={setSelected}
      />

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
        defaultDate={startDate}
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
    queryFn: () => doctorService.getAll(),
  });

  const { data: branches = [] } = useQuery({
    queryKey: ["branches"],
    queryFn: () => branchService.getAll(),
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
          <DialogTitle>{isEdit ? "Edit booking" : "New booking"}</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="rounded-md bg-destructive/10 text-destructive text-sm p-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Search patient *</Label>
            {isEdit ? (
              <Input value={patientDisplay} disabled className="bg-muted" />
            ) : (
              <Popover open={patientPopoverOpen} onOpenChange={setPatientPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                    {patientDisplay || "Type name or phone"}
                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Search patient..."
                      value={patientSearch}
                      onValueChange={(v) => {
                        setPatientSearch(v);
                        setForm((f) => ({ ...f, patientId: "" }));
                      }}
                    />
                    <CommandList>
                      <CommandEmpty>No patients found</CommandEmpty>
                      <CommandGroup>
                        {patients.map((p) => (
                          <CommandItem
                            key={p.id}
                            value={`${p.firstName} ${p.lastName} ${p.phone}`}
                            onSelect={() => {
                              setForm((f) => ({ ...f, patientId: p.id }));
                              setPatientDisplay(`${p.nickname || p.firstName} ${p.lastName} (${p.phone})`);
                              setPatientSearch(`${p.nickname || p.firstName} ${p.lastName} (${p.phone})`);
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
              <Label htmlFor="b-branch">Branch *</Label>
              <Select value={form.branchId} onValueChange={set("branchId")} required>
                <SelectTrigger id="b-branch" className="w-full">
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="b-doctor">Doctor *</Label>
              <Select value={form.doctorId} onValueChange={set("doctorId")} required>
                <SelectTrigger id="b-doctor" className="w-full">
                  <SelectValue placeholder="Select doctor" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="b-service">Service *</Label>
            <Select value={form.serviceId} onValueChange={set("serviceId")} required>
              <SelectTrigger id="b-service" className="w-full">
                <SelectValue placeholder="Select service" />
              </SelectTrigger>
              <SelectContent>
                {services.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name} ({s.duration} min)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="b-date">Date *</Label>
              <Input
                id="b-date"
                type="date"
                value={form.date}
                onChange={(e) => set("date")(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="b-time">Start time *</Label>
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
            <Label htmlFor="b-deposit">Deposit (THB)</Label>
            <Input
              id="b-deposit"
              type="number"
              value={form.deposit}
              onChange={(e) => set("deposit")(e.target.value)}
              placeholder="500"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="b-note">Note</Label>
            <Textarea
              id="b-note"
              value={form.note}
              onChange={(e) => set("note")(e.target.value)}
              rows={2}
            />
          </div>

          {isEdit && (
            <div className="space-y-1.5">
              <Label htmlFor="b-treatment">Treatment note</Label>
              <Textarea
                id="b-treatment"
                value={form.treatmentNote}
                onChange={(e) => set("treatmentNote")(e.target.value)}
                placeholder="Details of the treatment performed..."
                rows={3}
              />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
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

const PAYMENT_LABELS = { CASH: "Cash", TRANSFER: "Transfer", CARD: "Credit card" };
const SKIP_PAY_STATUSES = ["CANCELLED", "NO_SHOW", "RESCHEDULED"];

const BookingDetail = ({ booking, onClose, onEdit, onStatusChange, onPayment, isPaymentLoading }) => {
  const [showPayForm, setShowPayForm] = useState(false);
  const [payForm, setPayForm] = useState({ paidAmount: "", paymentMethod: "CASH" });

  const statuses = [
    { value: "CONFIRMED", label: "Confirm" },
    { value: "COMPLETED", label: "Completed" },
    { value: "CANCELLED", label: "Cancelled" },
    { value: "NO_SHOW",   label: "No-show" },
  ];

  const handlePaySubmit = (e) => {
    e.preventDefault();
    onPayment({ paidAmount: Number(payForm.paidAmount), paymentMethod: payForm.paymentMethod });
  };

  return (
    <Dialog open={!!booking} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Booking details</DialogTitle>
          {booking && <p className="text-xs text-muted-foreground">{booking.bookingNo}</p>}
        </DialogHeader>

        {booking && (
          <>
            <div className="divide-y divide-border">
              <DetailRow label="Patient" value={`${booking.patient?.firstName} ${booking.patient?.lastName}`} />
              <DetailRow label="Nickname" value={booking.patient?.nickname || "-"} />
              <DetailRow label="Time" value={`${booking.startTime} – ${booking.endTime}`} />
              <DetailRow label="Service" value={booking.service?.name} />
              <DetailRow label="Doctor" value={booking.doctor?.name} />
              <DetailRow label="Branch" value={booking.branch?.name} />
              <DetailRow label="Deposit" value={booking.deposit ? `฿${formatCurrency(booking.deposit)}` : "-"} />
              <DetailRow label="Note" value={booking.note || "-"} />
              {booking.treatmentNote && (
                <DetailRow label="Treatment note" value={booking.treatmentNote} />
              )}
              {booking.patient?.allergyHistory && (
                <DetailRow label="Allergies" value={booking.patient.allergyHistory} valueClassName="text-destructive" />
              )}
              <div className="flex items-center justify-between py-2.5 gap-4">
                <span className="text-sm text-muted-foreground shrink-0">Status</span>
                <StatusBadge status={booking.status} />
              </div>
            </div>

            {booking.paidAmount ? (
              <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 space-y-0.5">
                <p className="text-sm font-semibold text-green-700">Paid</p>
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
                    Record payment
                  </Button>
                ) : (
                  <form onSubmit={handlePaySubmit} className="space-y-3 border border-border rounded-lg p-3">
                    <p className="text-sm font-medium">Record payment</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label htmlFor="pay-amount" className="text-xs">Amount (THB) *</Label>
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
                        <Label htmlFor="pay-method" className="text-xs">Payment method *</Label>
                        <Select
                          value={payForm.paymentMethod}
                          onValueChange={(v) => setPayForm((f) => ({ ...f, paymentMethod: v }))}
                        >
                          <SelectTrigger id="pay-method">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CASH">Cash</SelectItem>
                            <SelectItem value="TRANSFER">Transfer</SelectItem>
                            <SelectItem value="CARD">Credit card</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => setShowPayForm(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" size="sm" className="flex-1" disabled={isPaymentLoading}>
                        {isPaymentLoading ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            )}

            <div>
              <p className="text-sm font-medium mb-2">Change status</p>
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
                Edit
              </Button>
              <Button className="flex-1" onClick={onClose}>
                Close
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BookingsPage;
