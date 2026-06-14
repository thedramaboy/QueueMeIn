import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { bookingService } from "../../services/booking.service.js";
import { patientService } from "../../services/patient.service.js";
import { CalendarDays, Users, UserCheck, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataGrid } from "@mui/x-data-grid";
import StatusBadge from "@/components/shared/StatusBadge";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import TableSkeleton, {
  StatCardSkeleton,
} from "@/components/shared/TableSkeleton";
import { datagridSx } from "@/lib/datagrid";

const StatCard = ({ label, value, icon: Icon, iconClassName }) => (
  <Card>
    <CardContent className="flex items-center gap-4 p-6">
      <div className={`p-3 rounded-full ${iconClassName}`}>
        <Icon size={24} className="text-white" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </CardContent>
  </Card>
);

const DashboardPage = () => {
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: todayBookings = [], isLoading: loadingBookings } = useQuery({
    queryKey: ["bookings", "today"],
    queryFn: () => bookingService.getAll({ date: today }),
  });

  const { data: patients = [], isLoading: loadingPatients } = useQuery({
    queryKey: ["patients"],
    queryFn: () => patientService.getAll(),
  });

  const newPatients = patients.filter((p) => p.isNewPatient).length;
  const pendingCount = todayBookings.filter(
    (b) => b.status === "PENDING",
  ).length;

  const stats = [
    {
      label: "การจองวันนี้",
      value: todayBookings.length,
      icon: CalendarDays,
      iconClassName: "bg-primary",
    },
    {
      label: "รอยืนยัน",
      value: pendingCount,
      icon: Clock,
      iconClassName: "bg-amber-500",
    },
    {
      label: "ลูกค้าทั้งหมด",
      value: patients.length,
      icon: Users,
      iconClassName: "bg-green-600",
    },
    {
      label: "ลูกค้าใหม่วันนี้",
      value: newPatients,
      icon: UserCheck,
      iconClassName: "bg-accent",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="แดชบอร์ด"
        subtitle={format(new Date(), "EEEE dd MMMM yyyy", { locale: th })}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {loadingBookings || loadingPatients
          ? Array.from({ length: 4 }, (_, i) => <StatCardSkeleton key={i} />)
          : stats.map((stat) => <StatCard key={stat.label} {...stat} />)}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">การจองวันนี้</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loadingBookings ? (
            <TableSkeleton cols={5} rows={4} />
          ) : todayBookings.length === 0 ? (
            <EmptyState message="ไม่มีการจองวันนี้" />
          ) : (
            <DataGrid
              rows={todayBookings}
              columns={[
                {
                  field: "time",
                  headerName: "เวลา",
                  width: 130,
                  valueGetter: (_, row) => `${row.startTime} – ${row.endTime}`,
                },
                {
                  field: "patient",
                  headerName: "ลูกค้า",
                  flex: 1,
                  valueGetter: (_, row) =>
                    row.patient?.nickname || row.patient?.firstName,
                },
                {
                  field: "service",
                  headerName: "หัตถการ",
                  flex: 1,
                  valueGetter: (_, row) => row.service?.name,
                },
                {
                  field: "doctor",
                  headerName: "หมอ",
                  flex: 1,
                  valueGetter: (_, row) => row.doctor?.name,
                },
                {
                  field: "status",
                  headerName: "สถานะ",
                  width: 130,
                  renderCell: (params) => (
                    <StatusBadge status={params.row.status} />
                  ),
                },
              ]}
              autoHeight
              hideFooter
              sx={datagridSx}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;
