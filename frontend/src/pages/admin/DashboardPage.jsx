import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { reportService } from "../../services/report.service.js";
import { CalendarDays, Users, TrendingUp, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataGrid } from "@mui/x-data-grid";
import StatusBadge from "@/components/shared/StatusBadge";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import TableSkeleton, { StatCardSkeleton } from "@/components/shared/TableSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { datagridSx } from "@/lib/datagrid";
import { formatCurrency } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const STATUS_COLORS = {
  PENDING:     "#f59e0b",
  CONFIRMED:   "#3b82f6",
  COMPLETED:   "#22c55e",
  CANCELLED:   "#ef4444",
  NO_SHOW:     "#9ca3af",
  RESCHEDULED: "#a855f7",
};

const STATUS_LABELS = {
  PENDING:     "รอยืนยัน",
  CONFIRMED:   "ยืนยัน",
  COMPLETED:   "เสร็จสิ้น",
  CANCELLED:   "ยกเลิก",
  NO_SHOW:     "ไม่มา",
  RESCHEDULED: "เลื่อนนัด",
};

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

const ChartSkeleton = ({ height = 220 }) => (
  <Skeleton className="w-full rounded-lg" style={{ height }} />
);

const DashboardPage = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => reportService.getDashboard(),
  });

  const stats = [
    {
      label: "การจองวันนี้",
      value: data?.todayCount ?? 0,
      icon: CalendarDays,
      iconClassName: "bg-primary",
    },
    {
      label: "รอยืนยัน",
      value: data?.pendingCount ?? 0,
      icon: Clock,
      iconClassName: "bg-amber-500",
    },
    {
      label: "ลูกค้าทั้งหมด",
      value: data?.totalPatients ?? 0,
      icon: Users,
      iconClassName: "bg-green-600",
    },
    {
      label: "รายได้เดือนนี้",
      value: data?.monthRevenue ? `฿${formatCurrency(data.monthRevenue)}` : "฿0",
      icon: TrendingUp,
      iconClassName: "bg-accent",
    },
  ];

  const pieData = (data?.statusBreakdown ?? []).map((s) => ({
    name: STATUS_LABELS[s.status] ?? s.status,
    value: s.count,
    color: STATUS_COLORS[s.status] ?? "#94a3b8",
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="แดชบอร์ด"
        subtitle={format(new Date(), "EEEE dd MMMM yyyy", { locale: th })}
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }, (_, i) => <StatCardSkeleton key={i} />)
          : stats.map((stat) => <StatCard key={stat.label} {...stat} />)}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Monthly volume bar chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">การจองรายเดือน (12 เดือนล่าสุด)</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <ChartSkeleton height={220} />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data?.monthlyVolume ?? []} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    formatter={(v) => [v, "การจอง"]}
                  />
                  <Bar dataKey="count" fill="var(--color-primary, #0F7E86)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Status breakdown pie chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">สถานะการจองเดือนนี้</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <ChartSkeleton height={220} />
            ) : pieData.length === 0 ? (
              <div className="flex items-center justify-center h-[220px]">
                <p className="text-sm text-muted-foreground">ไม่มีข้อมูล</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    formatter={(v, n) => [v, n]}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 11 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Today's bookings table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">การจองวันนี้</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <TableSkeleton cols={5} rows={4} />
          ) : (data?.todayBookings ?? []).length === 0 ? (
            <EmptyState message="ไม่มีการจองวันนี้" />
          ) : (
            <DataGrid
              rows={data.todayBookings}
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
                  valueGetter: (_, row) => row.patient?.nickname || row.patient?.firstName,
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
                  renderCell: (params) => <StatusBadge status={params.row.status} />,
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
