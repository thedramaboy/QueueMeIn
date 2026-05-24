import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { reportService } from "../../services/report.service";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { CalendarDays, Users, UserCheck, UserPlus } from "lucide-react";

const MONTHS = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

const STATUS_LABEL = {
  PENDING: "รอยืนยัน",
  CONFIRMED: "ยืนยันแล้ว",
  COMPLETED: "เสร็จแล้ว",
  CANCELLED: "ยกเลิก",
  NO_SHOW: "ไม่มา",
  RESCHEDULED: "เลื่อนนัด",
};

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
      <div className="flex items-center justify-between">
        <div>
          <h1>รายงาน</h1>
          <p className="text-gray-500 text-sm mt-1">
            {MONTHS[month - 1]} {year + 543}
          </p>
        </div>

        <div className="flex gap-2">
          <select
            value={month}
            onChange={(event) => setMonth(Number(event.target.value))}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {MONTHS.map((month, index) => (
              <option key={index + 1} value={index + 1}>
                {month}
              </option>
            ))}
          </select>
          <select
            value={year}
            onChange={(event) => setYear(Number(event.target.value))}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {[2026, 2027, 2028].map((year) => (
              <option key={year} value={year}>
                {year + 543}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loadingSummary ? (
        <div className="p-8 text-center text-gray-400">กำลังโหลด...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              label="การจองทั้งหมด"
              value={summary?.totalBookings || 0}
              icon={CalendarDays}
              color="bg-blue-500"
            />
            <StatCard
              label="ลูกค้าใหม่"
              value={summary?.newPatients || 0}
              icon={UserPlus}
              color="bg-green-500"
            />
            <StatCard
              label="ลูกค้าเก่ากลับมา"
              value={summary?.returningPatients || 0}
              icon={UserCheck}
              color="bg-purple-500"
            />
            <StatCard
              label="ลูกค้าทั้งหมด"
              value={
                (summary?.newPatients || 0) + (summary?.returningPatients || 0)
              }
              icon={Users}
              color="bg-yellow-500"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="font-semibold text-gray-700 mb-4">
                การจองแยกตามสถานะ
              </h2>
              <div className="space-y-3">
                {summary?.bookingsByStatus?.map((item) => (
                  <div
                    key={item.status}
                    className="flex justify-between items-center"
                  >
                    <span className="text-sm text-gray-600">
                      {STATUS_LABEL[item.status] || item.status}
                    </span>
                    <span className="font-semibold text-gray-800">
                      {item.count} ครั้ง
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="font-semibold text-gray-700 mb-4">
                การจองแยกตามสาขา
              </h2>
              <div className="space-y-3">
                {summary?.bookingsByBranch?.map((item) => (
                  <div
                    key={item.branch}
                    className="flex justify-between items-center"
                  >
                    <span className="text-sm text-gray-600">{item.branch}</span>
                    <span className="font-semibold text-gray-800">
                      {item.count} ครั้ง
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="font-semibold text-gray-700 mb-4">ลูกค้าใหม่เดือนนี้</h2>
        {loadingPatients ? (
          <div className="text-center text-gray-400 py-4">กำลังโหลด...</div>
        ) : patientsReport?.newPatients?.length === 0 ? (
          <div className="text-center text-gray-400 py-4">ไม่มีลูกค้าใหม่</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr className="text-left text-gray-500">
                <th className="px-4 py-3 font-medium">ชื่อ</th>
                <th className="px-4 py-3 font-medium">เบอร์โทร</th>
                <th className="px-4 py-3 font-medium">
                  วันที่สมัครเข้ารับบริการ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {patientsReport?.newPatients?.map((patient) => (
                <tr key={patient.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-800">
                    {patient.firstName} {patient.lastName} {patient.nickname}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{patient.phone}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {format(new Date(patient.createdAt), "dd MMM yyyy", {
                      locale: th,
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="font-semibold text-gray-700 mb-4">
          ลูกค้าเก่าที่กลับมาเดือนนี้
        </h2>
        {loadingPatients ? (
          <div className="text-center text-gray-400 py-4">กำลังโหลด...</div>
        ) : patientsReport?.returningPatients?.length === 0 ? (
          <div className="text-center text-gray-400 py-4">
            ไม่มีลูกค้าเก่าในเดือนนี้
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr className="text-left text-gray-500">
                <th className="px-4 py-3 font-medium">ชื่อ</th>
                <th className="px-4 py-3 font-medium">เบอร์โทร</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {patientsReport?.returningPatients?.map((patient, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-800">
                    {patient.firstName} {patient.lastName} {patient.nickname}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{patient.phone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, color }) => (
  <div className="bg-white rounded-lg shadow-sm p-6 flex items-center gap-4">
    <div className={`p-3 rounded-full ${color}`}>
      <Icon size={24} className="text-white" />
    </div>
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-700">{value}</p>
    </div>
  </div>
);

export default ReportsPage;
