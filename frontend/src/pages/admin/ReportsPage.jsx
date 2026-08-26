import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { reportService } from "../../services/report.service";
import { format } from "date-fns";
import { CalendarDays, Users, UserCheck, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataGrid } from "@mui/x-data-grid";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import TableSkeleton, { StatCardSkeleton } from "@/components/shared/TableSkeleton";
import { datagridSx } from "@/lib/datagrid";

const MONTHS = [
  "January", "February", "March", "April",
  "May", "June", "July", "August",
  "September", "October", "November", "December",
];

const STATUS_LABEL = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  NO_SHOW: "No-show",
  RESCHEDULED: "Rescheduled",
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

const ReportsPage = () => {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const params = { month, year };

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ["reports", "summary", month, year],
    queryFn: () => reportService.getSummary(params),
  });

  const { data: patientsReport, isLoading: loadingPatients } = useQuery({
    queryKey: ["reports", "patients", month, year],
    queryFn: () => reportService.getPatients(params),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        subtitle={`${MONTHS[month - 1]} ${year + 543}`}
        action={
          <div className="flex gap-2">
            <Select
              value={String(month)}
              onValueChange={(v) => setMonth(Number(v))}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m, i) => (
                  <SelectItem key={i + 1} value={String(i + 1)}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={String(year)}
              onValueChange={(v) => setYear(Number(v))}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2026, 2027, 2028].map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y + 543}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />

      {loadingSummary ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => <StatCardSkeleton key={i} />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              label="Total bookings"
              value={summary?.totalBookings || 0}
              icon={CalendarDays}
              iconClassName="bg-primary"
            />
            <StatCard
              label="New patients"
              value={summary?.newPatients || 0}
              icon={UserPlus}
              iconClassName="bg-green-600"
            />
            <StatCard
              label="Returning patients"
              value={summary?.returningPatients || 0}
              icon={UserCheck}
              iconClassName="bg-accent"
            />
            <StatCard
              label="Total patients"
              value={
                (summary?.newPatients || 0) + (summary?.returningPatients || 0)
              }
              icon={Users}
              iconClassName="bg-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardContent className="p-6">
                <p className="text-base font-semibold mb-4">Bookings by status</p>
                <div className="space-y-3">
                  {summary?.bookingsByStatus?.map((item) => (
                    <div
                      key={item.status}
                      className="flex justify-between items-center"
                    >
                      <span className="text-sm text-muted-foreground">
                        {STATUS_LABEL[item.status] || item.status}
                      </span>
                      <span className="font-semibold">{item.count} times</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <p className="text-base font-semibold mb-4">Bookings by branch</p>
                <div className="space-y-3">
                  {summary?.bookingsByBranch?.map((item) => (
                    <div
                      key={item.branch}
                      className="flex justify-between items-center"
                    >
                      <span className="text-sm text-muted-foreground">
                        {item.branch}
                      </span>
                      <span className="font-semibold">{item.count} times</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">New patients this month</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loadingPatients ? (
            <TableSkeleton cols={3} rows={3} />
          ) : !patientsReport?.newPatients?.length ? (
            <EmptyState message="No new patients" />
          ) : (
            <DataGrid
              rows={patientsReport.newPatients}
              columns={[
                {
                  field: "fullName",
                  headerName: "Name",
                  flex: 1,
                  valueGetter: (_, row) =>
                    `${row.firstName} ${row.lastName}${row.nickname ? ` (${row.nickname})` : ""}`,
                },
                { field: "phone", headerName: "Phone", width: 140 },
                {
                  field: "createdAt",
                  headerName: "Date registered",
                  width: 150,
                  valueGetter: (v) => format(new Date(v), "dd MMM yyyy"),
                },
              ]}
              autoHeight
              hideFooter
              sx={datagridSx}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Returning patients this month</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loadingPatients ? (
            <TableSkeleton cols={2} rows={3} />
          ) : !patientsReport?.returningPatients?.length ? (
            <EmptyState message="No returning patients this month" />
          ) : (
            <DataGrid
              rows={patientsReport.returningPatients.map((p, i) => ({ ...p, id: p.id ?? i }))}
              columns={[
                {
                  field: "fullName",
                  headerName: "Name",
                  flex: 1,
                  valueGetter: (_, row) =>
                    `${row.firstName} ${row.lastName}${row.nickname ? ` (${row.nickname})` : ""}`,
                },
                { field: "phone", headerName: "Phone", width: 140 },
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

export default ReportsPage;
