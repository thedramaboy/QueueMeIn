import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { bookingService } from "../../services/booking.service.js";
import { patientService } from "../../services/patient.service.js";
import { doctorService } from "../../services/doctor.service.js";
import { branchService } from "../../services/branch.service.js";
import { serviceService } from "../../services/service.service.js";
import { Plus, X, Calendar, Search } from "lucide-react";

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

const BookingsPage = () => {
  const queryClient = useQueryClient();
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">การจอง</h1>
          <p className="text-gray-500 text-sm mt-1">
            {format(new Date(date), "EEEE dd MMMM yyyy", { locale: th })}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
        >
          <Plus size={18} />
          จองคิว
        </button>
      </div>

      <div className="flex items-center gap-3">
        <Calendar size={18} className="text-gray-400" />
        <input
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="text-sm text-gray-500">{bookings.length} การจอง</span>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">กำลังโหลด...</div>
        ) : bookings.length === 0 ? (
          <div className="p-8 text-center text-gray-400">ไม่มีการจองวันนี้</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr className="text-left text-gray-500">
                <th className="px-6 py-3 font-medium">เลขที่จอง</th>
                <th className="px-6 py-3 font-medium">เวลา</th>
                <th className="px-6 py-3 font-medium">ลูกค้า</th>
                <th className="px-6 py-3 font-medium">หัตถการ</th>
                <th className="px-6 py-3 font-medium">หมอ</th>
                <th className="px-6 py-3 font-medium">สาขา</th>
                <th className="px-6 py-3 font-medium">มัดจำ</th>
                <th className="px-6 py-3 font-medium">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {bookings.map((booking) => (
                <tr
                  key={booking.id}
                  onClick={() => setSelected(booking)}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-6 py-4 text-gray-500 text-xs">
                    {booking.bookingNo}
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {booking.startTime} - {booking.endTime}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-800">
                      {booking.patient?.nickname || booking.patient?.firstName}
                    </p>
                    {booking.patient?.allergyHistory && (
                      <p className="text-red-400 text-xs">
                        แพ้: {booking.patient.allergyHistory}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {booking.service?.name}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {booking.doctor?.name}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {booking.branch?.name}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {booking.deposit ? `${booking.deposit} ฿` : "-"}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={booking.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <BookingForm
          onClose={() => setShowForm(false)}
          onSubmit={(data) => createMutation.mutate(data)}
          isLoading={createMutation.isPending}
          error={createMutation.error?.response?.data?.message}
          defaultDate={date}
        />
      )}

      {selected && (
        <BookingDetail
          booking={selected}
          onClose={() => setSelected(null)}
          onStatusChange={(status) => {
            statusMutation.mutate({ id: selected.id, status });
            setSelected(null);
          }}
        />
      )}
    </div>
  );
};

const BookingForm = ({ onClose, onSubmit, isLoading, error, defaultDate }) => {
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

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      ...form,
      patientId: Number(form.patientId),
      doctorId: Number(form.doctorId),
      branchId: Number(form.branchId),
      serviceId: Number(form.serviceId),
      deposit: form.deposit ? Number(form.deposit) : null,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 max-h-[90vh]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">จองคิวใหม่</h2>
          <button onClick={onClose}>
            <X size={20} className="text-gray-400 hover:text-gray-600" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              ค้นหาลูกค้า
            </label>
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="พิมพ์ชื่อหรือเบอร์โทร"
                value={patientSearch}
                onChange={(event) => setPatientSearch(event.target.value)}
                className="w-full pl-9 pr-3 py-2 border rounded text-sm focus:ouline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {patients.length > 0 && !form.patientId && (
              <div className="border rounded mt-1 divide-y max-h-32 overflow-y-auto">
                {patients.map((patient) => (
                  <div
                    key={patient.id}
                    onClick={() => {
                      setForm({ ...form, patientId: patient.id });
                      setPatientSearch(
                        `${patient.firstName} ${patient.lastName} (${patient.phone})`,
                      );
                    }}
                    className="px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer"
                  >
                    {patient.nickname || patient.firstName} {patient.lastName} -{" "}
                    {patient.phone}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">สาขา *</label>
              <select
                name="branchId"
                value={form.branchId}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">เลือกสาขา</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">หมอ *</label>
              <select
                name="doctorId"
                value={form.doctorId}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">เลือกหมอ</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">หัตถการ *</label>
            <select
              name="serviceId"
              value={form.serviceId}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">เลือกหัตถการ</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name} ({service.duration} นาที)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">วันที่ *</label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                เวลาเริ่ม *
              </label>
              <input
                type="time"
                name="startTime"
                value={form.startTime}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              มัดจำ (บาท)
            </label>
            <input
              type="number"
              name="deposit"
              value={form.deposit}
              onChange={handleChange}
              placeholder="500"
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">หมายเหตุ</label>
            <textarea
              name="note"
              value={form.note}
              onChange={handleChange}
              rows={2}
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border rounded px-4 py-2 text-sm hover:bg-gray-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-blue-500 text-white rounded px-4 py-2 text-sm hover:bg-blue-600 disabled:opacity-50"
            >
              {isLoading ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const BookingDetail = ({ booking, onClose, onStatusChange }) => {
  const statuses = [
    { value: "CONFIRMED", label: "ยืนยันนัด" },
    { value: "COMPLETED", label: "เสร็จแล้ว" },
    { value: "CANCELLED", label: "ยกเลิก" },
    { value: "NO_SHOW", label: "ไม่มา" },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">รายละเอียดการจอง</h2>
            <p className="text-xs text-gray-400">{booking.bookingNo}</p>
          </div>
          <button onClick={onClose}>
            <X size={20} className="text-gray-400 hover:text-gray-600" />
          </button>
        </div>

        <div className="space-y-2 text-sm mb-6">
          <Row
            label="ลูกค้า"
            value={`${booking.patient?.firstName} ${booking.patient?.lastName}`}
          />
          <Row label="ชื่อเล่น" value={booking.patient?.nickname || "-"} />
          <Row
            label="เวลา"
            value={`${booking.startTime} - ${booking.endTime}`}
          />
          <Row label="หัตถการ" value={booking.service?.name} />
          <Row label="หมอ" value={booking.doctor?.name} />
          <Row label="สาขา" value={booking.branch?.name} />
          <Row
            label="มัดจำ"
            value={booking.deposit ? `฿${booking.deposit}` : "-"}
          />
          <Row label="หมายเหตุ" value={booking.note || "-"} />
          {booking.patient?.allergyHistory && (
            <Row
              label="แพ้ยา"
              value={booking.patient.allergyHistory}
              valueClass="text-red-500"
            />
          )}
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-500">สถานะ</span>
            <StatusBadge status={booking.status} />
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">เปลี่ยนสถานะ</p>
          <div className="grid grid-cols-2 gap-2">
            {statuses.map((s) => (
              <button
                key={s.value}
                onClick={() => onStatusChange(s.value)}
                disabled={booking.status === s.value}
                className="border rounded px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 bg-blue-500 text-white rounded px-4 py-2 text-sm hover:bg-blue-600"
        >
          ปิด
        </button>
      </div>
    </div>
  );
};

const Row = ({ label, value, valueClass = "text-gray-700" }) => (
  <div className="flex justify-between py-2 border-b last:border-0">
    <span className="text-gray-500">{label}</span>
    <span className={valueClass}>{value}</span>
  </div>
);

export default BookingsPage;
