import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import useAuthStore from "../../stores/auth.store.js";
import { scheduleService } from "../../services/schedule.service.js";
import { doctorService } from "../../services/doctor.service.js";
import { branchService } from "../../services/branch.service.js";
import { Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
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
import PageHeader from "@/components/shared/PageHeader";
import DetailRow from "@/components/shared/DetailRow";
import EmptyState from "@/components/shared/EmptyState";
import ConfirmDialog from "@/components/shared/ConfirmDialog";

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const DAY_LABELS = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};

const HOUR_START = 8;
const HOUR_END = 20;
const TOTAL_MINUTES = (HOUR_END - HOUR_START) * 60;
const HOURS = Array.from(
  { length: HOUR_END - HOUR_START },
  (_, i) => HOUR_START + i,
);
const LANE_HEIGHT = 52;

const timeToMinutes = (t) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

const getBlockStyle = (schedule) => {
  const startMin = Math.max(
    0,
    timeToMinutes(schedule.startTime) - HOUR_START * 60,
  );
  const endMin = Math.min(
    TOTAL_MINUTES,
    timeToMinutes(schedule.endTime) - HOUR_START * 60,
  );
  return {
    left: `${(startMin / TOTAL_MINUTES) * 100}%`,
    width: `${((endMin - startMin) / TOTAL_MINUTES) * 100}%`,
  };
};

const SchedulesPage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isStaff = user?.role === "STAFF";
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [filterBranch, setFilterBranch] = useState(
    isStaff ? String(user?.branchId) : "all",
  );
  const [filterDoctor, setFilterDoctor] = useState("all");

  const { data: schedules = [], isLoading, isFetching } = useQuery({
    queryKey: ["schedules", filterBranch, filterDoctor],
    queryFn: () =>
      scheduleService.getAll({
        ...(filterBranch !== "all" && { branchId: filterBranch }),
        ...(filterDoctor !== "all" && { doctorId: filterDoctor }),
      }),
  });

  const { data: branches = [] } = useQuery({
    queryKey: ["branches"],
    queryFn: branchService.getAll,
  });

  const { data: doctors = [] } = useQuery({
    queryKey: ["doctors"],
    queryFn: doctorService.getAll,
  });

  const createMutation = useMutation({
    mutationFn: scheduleService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: scheduleService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      setSelected(null);
    },
  });

  const schedulesByDay = DAY_ORDER.reduce((acc, day) => {
    acc[day] = schedules.filter((s) => s.dayOfWeek === day);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <PageHeader
        title="Schedules"
        subtitle={`${schedules.length} total`}
        action={
          !isStaff && (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add schedule
            </Button>
          )
        }
      />

      <div className="flex flex-wrap gap-3">
        <Select value={filterBranch} onValueChange={setFilterBranch}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All branches" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All branches</SelectItem>
            {branches.map((b) => (
              <SelectItem key={b.id} value={String(b.id)}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterDoctor} onValueChange={setFilterDoctor}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All doctors" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All doctors</SelectItem>
            {doctors.map((d) => (
              <SelectItem key={d.id} value={String(d.id)}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading || isFetching ? (
        <GanttSkeleton />
      ) : schedules.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <EmptyState message="No schedules found" />
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <CardContent className="p-0 overflow-x-auto">
            <div className="min-w-[720px]">
              {/* Hour header row */}
              <div className="flex border-b border-border bg-muted/50 sticky top-0 z-10">
                <div className="w-24 shrink-0 border-r border-border" />
                <div className="flex flex-1">
                  {HOURS.map((h) => (
                    <div
                      key={h}
                      className="flex-1 text-center text-xs text-muted-foreground py-2 border-r border-border last:border-r-0 font-mono"
                    >
                      {String(h).padStart(2, "0")}:00
                    </div>
                  ))}
                </div>
              </div>

              {/* Day rows */}
              {DAY_ORDER.map((day) => {
                const daySchedules = schedulesByDay[day];
                const rowHeight = Math.max(
                  64,
                  daySchedules.length * LANE_HEIGHT + 8,
                );
                return (
                  <div
                    key={day}
                    className="flex border-b border-border last:border-b-0"
                    style={{ minHeight: rowHeight }}
                  >
                    {/* Day label */}
                    <div className="w-24 shrink-0 border-r border-border flex items-center justify-center sticky left-0 bg-card z-10">
                      <span className="text-sm font-semibold text-foreground">
                        {DAY_LABELS[day]}
                      </span>
                    </div>

                    {/* Time area */}
                    <div className="flex-1 relative">
                      {/* Background hour grid lines */}
                      <div className="absolute inset-0 flex pointer-events-none">
                        {HOURS.map((h) => (
                          <div
                            key={h}
                            className="flex-1 border-r border-border/40 last:border-r-0"
                          />
                        ))}
                      </div>

                      {/* Half-hour lines (lighter) */}
                      <div className="absolute inset-0 flex pointer-events-none">
                        {HOURS.map((h) => (
                          <div key={h} className="flex-1 flex">
                            <div className="flex-1" />
                            <div className="w-px bg-border/20" />
                          </div>
                        ))}
                      </div>

                      {/* Schedule blocks */}
                      {daySchedules.length === 0 ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        </div>
                      ) : (
                        daySchedules.map((schedule, idx) => {
                          const { left, width } = getBlockStyle(schedule);
                          return (
                            <div
                              key={schedule.id}
                              className="absolute rounded-lg bg-primary/12 border border-primary/30 cursor-pointer hover:bg-primary/20 transition-colors px-2 py-1 overflow-hidden"
                              style={{
                                left,
                                width,
                                top: idx * LANE_HEIGHT + 4,
                                height: LANE_HEIGHT - 10,
                              }}
                              onClick={() => setSelected(schedule)}
                            >
                              <div className="flex items-baseline gap-1.5 overflow-hidden">
                                <p className="text-xs font-semibold text-primary leading-tight truncate min-w-0">
                                  {schedule.doctor?.name}
                                </p>
                                <p className="text-xs text-primary/60 font-mono shrink-0">
                                  {schedule.startTime}–{schedule.endTime}
                                </p>
                              </div>
                              <p className="text-xs text-primary/70 line-clamp-1">
                                {schedule.branch?.name}
                              </p>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <ScheduleForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={(data) => createMutation.mutate(data)}
        isLoading={createMutation.isPending}
        error={createMutation.error?.response?.data?.message}
        doctors={doctors}
        branches={branches}
      />

      <ScheduleDetail
        schedule={selected}
        onClose={() => setSelected(null)}
        onDelete={() => deleteMutation.mutate(selected.id)}
        readOnly={isStaff}
      />
    </div>
  );
};

const GanttSkeleton = () => (
  <Card className="overflow-hidden">
    <CardContent className="p-0">
      <div className="min-w-[720px]">
        <div className="flex border-b border-border bg-muted/50 h-9">
          <div className="w-24 shrink-0 border-r border-border" />
          <div className="flex flex-1 items-center px-4 gap-4">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-3 flex-1" />
            ))}
          </div>
        </div>
        {DAY_ORDER.map((day) => (
          <div
            key={day}
            className="flex border-b border-border last:border-b-0 h-16"
          >
            <div className="w-24 shrink-0 border-r border-border flex items-center justify-center">
              <Skeleton className="h-3 w-12" />
            </div>
            <div className="flex-1 flex items-center px-4">
              {day % 3 !== 0 && (
                <Skeleton
                  className="h-10 rounded-lg"
                  style={{
                    marginLeft: `${(day * 7) % 30}%`,
                    width: `${30 + ((day * 5) % 30)}%`,
                  }}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

const ScheduleForm = ({
  open,
  onClose,
  onSubmit,
  isLoading,
  error,
  doctors,
  branches,
}) => {
  const [form, setForm] = useState({
    branchId: "",
    doctorId: "",
    dayOfWeek: "",
    startTime: "",
    endTime: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      branchId: Number(form.branchId),
      doctorId: Number(form.doctorId),
      dayOfWeek: Number(form.dayOfWeek),
    });
  };

  const set = (field) => (value) => setForm({ ...form, [field]: value });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add schedule</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="rounded-md bg-destructive/10 text-destructive text-sm p-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="sched-branch">Branch *</Label>
            <Select
              value={form.branchId}
              onValueChange={set("branchId")}
              required
            >
              <SelectTrigger id="sched-branch" className="w-full">
                <SelectValue placeholder="Select branch" />
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
            <Label htmlFor="sched-doctor">Doctor *</Label>
            <Select
              value={form.doctorId}
              onValueChange={set("doctorId")}
              required
            >
              <SelectTrigger id="sched-doctor" className="w-full">
                <SelectValue placeholder="Select doctor" />
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

          <div className="space-y-1.5">
            <Label htmlFor="sched-day">Day *</Label>
            <Select
              value={form.dayOfWeek}
              onValueChange={set("dayOfWeek")}
              required
            >
              <SelectTrigger id="sched-day" className="w-full">
                <SelectValue placeholder="Select day" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DAY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="sched-start">Start time *</Label>
              <Input
                id="sched-start"
                type="time"
                value={form.startTime}
                onChange={(e) => set("startTime")(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sched-end">End time *</Label>
              <Input
                id="sched-end"
                type="time"
                value={form.endTime}
                onChange={(e) => set("endTime")(e.target.value)}
                required
              />
            </div>
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

const ScheduleDetail = ({ schedule, onClose, onDelete, readOnly }) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  return (
    <>
      <Dialog open={!!schedule} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule details</DialogTitle>
          </DialogHeader>

          {schedule && (
            <>
              <div className="divide-y divide-border">
                <DetailRow label="Day" value={DAY_LABELS[schedule.dayOfWeek]} />
                <DetailRow label="Doctor" value={schedule.doctor?.name} />
                <DetailRow label="Branch" value={schedule.branch?.name} />
                <DetailRow
                  label="Time"
                  value={`${schedule.startTime} – ${schedule.endTime}`}
                />
                <DetailRow
                  label="Status"
                  value={schedule.isActive ? "Active" : "Inactive"}
                  valueClassName={
                    schedule.isActive ? "text-green-600" : "text-destructive"
                  }
                />
              </div>

              <div className="flex gap-3 pt-2">
                {!readOnly && (
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => setConfirmOpen(true)}
                  >
                    Close schedule
                  </Button>
                )}
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
        title="Confirm closing schedule"
        description={
          schedule
            ? `Close the ${DAY_LABELS[schedule.dayOfWeek]} schedule for ${schedule.doctor?.name}?`
            : ""
        }
        confirmLabel="Close schedule"
      />
    </>
  );
};

export default SchedulesPage;
