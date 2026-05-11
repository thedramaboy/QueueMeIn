import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { bookingService } from "../../services/booking.service.js";
import { patientService } from "../../services/patient.service.js";
import { CalendarDays, Users, UserCheck, Clock } from "lucide-react";

const StatCard = ({ label, value, icon: Icon, color }) => {
  <div className="bg-white rounded-lg shadow-sm p-6 flex items-center gap-4">
    <div className={`p-3 rounded-full ${color}`}>
      <Icon size={24} className="text-white" />
    </div>
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-700">{value}</p>
    </div>
  </div>;
};

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

  const newPatients = patients.filter((patient) => patient.isNewPatient).length;
  const pendingCount = todayBookings.filter(
    (book) => book.status === "PENDING",
  ).length;

  const stats = [
    {
      label: "การจองวันนี้",
      value: loadingBookings ? "..." : todayBookings.length,
      icon: CalendarDays,
      color: "bg-blue-500",
    },
    {
      label: "รอยืนยัน",
      value: loadingBookings ? "..." : pendingCount,
      icon: Clock,
      color: "bg-yellow-500",
    },
    {
      label: "ลูกค้าทั้งหมด",
      value: loadingPatients ? "..." : patients.length,
      icon: Users,
      color: "bg-green-500",
    },
    {
      label: "ลูกค้าใหม่วันนี้",
      value: loadingPatients ? "..." : newPatients,
      icon: UserCheck,
      color: "bg-purple-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          {format(new Date(), "EEEE dd MMMM yyyy", { locale: th })}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          การจองวันนี้
        </h2>

        {loadingBookings ? (
          <p className="text-gray-400 text-sm">กำลังโหลดข้อมูล...</p>
        ) : todayBookings.length === 0 ? (
          <p className="text-gray-400 text-sm">ไม่มีการจองวันนี้</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-3 font-medium">เวลา</th>
                  <th className="pb-3 font-medium">ลูกค้า</th>
                  <th className="pb-3 font-medium">หัตถการ</th>
                  <th className="pb-3 font-medium">หมอ</th>
                  <th className="pb-3 font-medium">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {todayBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="py-3 text-gray-700">
                      {booking.startTime} - {booking.endTime}
                    </td>
                    <td className="py-3 text-gray-700">
                      {booking.patient?.nickname || booking.patient?.firstName}
                    </td>
                    <td className="py-3 text-gray-700">
                      {booking.service?.name}
                    </td>
                    <td className="py-3 text-gray-700">
                      {booking.doctor?.name}
                    </td>
                    <td className="py-3">
                      <StatusBadge status={booking.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const config = {
    PENDING: { label: "รอยืนยัน", color: "bg-yellow-100 text-yellow-700" },
    CONFIRMED: { label: "ยืนยันแล้ว", color: "bg-blue-100 text-blue-700" },
    COMPLETED: { label: "เสร็จแล้ว", color: "bg-green-100 text-green-700" },
    CANCELLED: { label: "ยกเลิก", color: "bg-red-100 text-red-700" },
    NO_SHOW: { label: "ไม่มา", color: "bg-gray-100 text-gray-700" },
    RESCHEDULED: { label: "เลื่อนนัด", color: "bg-purple-100 text-purple-700" },
  };

  const { label, color } = config[status] || {
    label: status,
    color: "bg-gray-100",
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
      {label}
    </span>
  );
};

export default DashboardPage;
