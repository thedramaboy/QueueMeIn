import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { scheduleService } from "../../services/schedule.service.js";
import { doctorService } from "../../services/doctor.service.js";
import { branchService } from "../../services/branch.service.js";
import { Plus, X } from "lucide-react";

const DAY_LABELS = {
  0: "อาทิตย์",
  1: "จันทร์",
  2: "อังคาร",
  3: "พุธ",
  4: "พฤหัส",
  5: "ศุกร์",
  6: "เสาร์",
};

const SchedulesPage = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [filterBranch, setFilterBranch] = useState("");
  const [filterDoctor, setFilterDoctor] = useState("");

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ["schedules", filterBranch, filterDoctor],
    queryFn: () =>
      scheduleService.getAll({
        ...(filterBranch && { branchId: filterBranch }),
        ...(filterDoctor && { doctorId: filterDoctor }),
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">ตารางเวลา</h1>
          <p className="text-gray-500 text-sm mt-1">
            ทั้งหมด {schedules.length} รายการ
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
        >
          <Plus size={18} />
          เพิ่มตาราง
        </button>
      </div>

      <div className="flex gap-3"></div>
      <select
        value={filterBranch}
        onChange={(event) => setFilterBranch(event.target.value)}
        className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">ทุกสาขา</option>
        {branches.map((branch) => (
          <option key={branch.id} value={branch.id}>
            {branch.name}
          </option>
        ))}
      </select>

      <select
        value={filterDoctor}
        onChange={(event) => setFilterDoctor(event.target.value)}
        className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">ทุกหมอ</option>
        {doctors.map((doctor) => (
          <option key={doctor.id} value={doctor.id}>
            {doctor.name}
          </option>
        ))}
      </select>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">กำลังโหลด</div>
        ) : schedules.length === 0 ? (
          <div className="p-8 text-center text-gray-400">ไม่พบตารางเวลา</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr className="text-left text-gray-500">
                <th className="px-6 py-3 font-medium">วัน</th>
                <th className="px-6 py-3 font-medium">หมอ</th>
                <th className="px-6 py-3 font-medium">สาขา</th>
                <th className="px-6 py-3 font-medium">เวลา</th>
                <th className="px-6 py-3 font-medium">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {schedules.map((schedule) => (
                <tr
                  key={schedule.id}
                  onClick={() => setSelected(schedule)}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-6 py-4 font-medium text-gray-800">
                    {DAY_LABELS[schedule.dayOfWeek]}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-600">
                    {schedule.doctor?.name}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-600">
                    {schedule.branch?.name}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-600">
                    {schedule.startTime} - {schedule.endTime}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${schedule.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                    >
                      {schedule.isActive ? "เปิด" : "ปิด"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <ScheduleForm
          onClose={() => setShowForm(false)}
          onSubmit={(data) => createMutation.mutate(data)}
          isLoading={createMutation.isPending}
          error={createMutation.error?.response?.data?.message}
          doctors={doctors}
          branches={branches}
        />
      )}

      {selected && (
        <ScheduleDetail
          schedule={selected}
          onClose={() => setSelected(null)}
          onDelete={() => deleteMutation.mutate(selected.id)}
        />
      )}
    </div>
  );
};

const ScheduleForm = ({
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

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      ...form,
      branchId: Number(form.branchId),
      doctorId: Number(form.doctorId),
      dayOfWeek: Number(form.dayOfWeek),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">เพิ่มตารางเวลา</h2>
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
            <label className="block text-sm font-medium mb-1">สาขา *</label>
            <select
              name="branchId"
              value={form.branchId}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">เลือกสาขา</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
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
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">วัน *</label>
            <select
              name="dayOfWeek"
              value={form.dayOfWeek}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">เลือกวัน</option>
              {Object.entries(DAY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
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
            <div>
              <label className="block text-sm font-medium mb-1">
                เวลาสิ้นสุด *
              </label>
              <input
                type="time"
                name="endTime"
                value={form.endTime}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
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

const ScheduleDetail = ({ schedule, onClose, onDelete }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">รายละเอียดตาราง</h2>
        <button onClick={onClose}>
          <X size={20} className="text-gray-400 hover:text-gray-600" />
        </button>
      </div>

      <div className="space-y-3 text-sm">
        <Row label="วัน" value={DAY_LABELS[schedule.dayOfWeek]} />
        <Row label="หมอ" value={schedule.doctor?.name} />
        <Row label="สาขา" value={schedule.branch?.name} />
        <Row
          label="เวลา"
          value={`${schedule.startTime} - ${schedule.endTime}`}
        />
        <Row
          label="สถานะ"
          value={schedule.isActive ? "เปิด" : "ปิด"}
          valueClass={schedule.isActive ? "text-green-600" : "text-red-500"}
        />
      </div>

      <div className="flex gap-3 mt-6">
        <button
          onClick={onDelete}
          className="flex-1 border border-red-300 text-red-500 rounded px-4 py-2 text-sm hover:bg-red-50"
        >
          ปิดตาราง
        </button>
        <button
          onClick={onClose}
          className="flex-1 bg-blue-500 text-white rounded px-4 py-2 text-sm hover:bg-blue-600"
        >
          ปิด
        </button>
      </div>
    </div>
  </div>
);

const Row = ({ label, value, valueClass = "text-gray-700" }) => (
  <div className="flex justify-between py-2 border-b last:border-0">
    <span className="text-gray-500">{label}</span>
    <span className={valueClass}>{value}</span>
  </div>
);

export default SchedulesPage;
