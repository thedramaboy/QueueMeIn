import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { doctorService } from "../../services/doctor.service";
import { Plus, X } from "lucide-react";
import { branchService } from "../../services/branch.service";

const DoctorsPage = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);

  const { data: doctors = [], isLoading } = useQuery({
    queryKey: ["doctors"],
    queryFn: doctorService.getAll,
  });

  const createMutation = useMutation({
    mutationFn: doctorService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: doctorService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">หมอ</h1>
          <p className="text-gray-500 text-sm mt-1">
            ทั้งหมด {doctors.length} คน
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
        >
          <Plus size={18} />
          เพิ่มหมอ
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">กำลังโหลด</div>
        ) : doctors.length === 0 ? (
          <div className="p-8 text-center text-gray-400">ไม่พบข้อมูลหมอ</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr className="text-left text-gray-500">
                <th className="px-6 py-3 font-medium">ชื่อ</th>
                <th className="px-6 py-3 font-medium">ความเชี่ยวชาญ</th>
                <th className="px-6 py-3 font-medium">เบอร์โทร</th>
                <th className="px-6 py-3 font-medium">สาขา</th>
                <th className="px-6 py-3 font-medium">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {doctors.map((doctor) => (
                <tr
                  key={doctor.id}
                  onClick={() => setSelected(doctor)}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-6 py-4 font-medium text-gray-800">
                    {doctor.name}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {doctor.specialty || "-"}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {doctor.phone || "-"}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {doctor.doctorBranches
                      ?.map((doctorBranch) => doctorBranch.branch?.name)
                      .join(", ") || "-"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${doctor.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                    >
                      {doctor.isActive ? "Active" : "In-active"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <DoctorForm
          onClose={() => setShowForm(false)}
          onSubmit={(data) => createMutation.mutate(data)}
          isLoading={createMutation.isPending}
          error={createMutation.error?.response?.data?.message}
        />
      )}

      {selected && (
        <DoctorDetail
          doctor={selected}
          onClose={() => setSelected(null)}
          onDelete={() => {
            deleteMutation.mutate(selected.id);
            setSelected(null);
          }}
        />
      )}
    </div>
  );
};

const DoctorForm = ({ onClose, onSubmit, isLoading, error }) => {
  const [form, setForm] = useState({
    name: "",
    specialty: "",
    phone: "",
    branchIds: [],
  });

  const { data: branches = [] } = useQuery({
    queryKey: ["branches"],
    queryFn: branchService.getAll,
  });

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleBranchChange = (branchId) => {
    const id = Number(branchId);
    const exists = form.branchIds.includes(id);
    setForm({
      ...form,
      branchIds: exists
        ? form.branchIds.filter((branch) => branch !== id)
        : [...form.branchIds, id],
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">เพิ่มหมอใหม่</h2>
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
            <label className="block text-sm font-medium mb-1">ชื่อหมอ *</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              ความเชี่ยวชาญ
            </label>
            <input
              name="specialty"
              value={form.specialty}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">เบอร์โทร</label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              สาขาที่ทำงาน *
            </label>
            <div className="space-y-2">
              {branches.map((branch) => (
                <label
                  key={branch.id}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={form.branchIds.includes(branch.id)}
                    onChange={() => handleBranchChange(branch.id)}
                    className="rounded"
                  />
                  <span className="text-sm">{branch.name}</span>
                </label>
              ))}
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

const DoctorDetail = ({ doctor, onClose, onDelete }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">ข้อมูลหมอ</h2>
        <button onClick={onClose}>
          <X size={20} className="text-gray-400 hover:text-gray-600" />
        </button>
      </div>

      <div className="space-y-3 text-sm">
        <Row label="ชื่อ" value={doctor.name} />
        <Row label="ความเชี่ยวชาญ" value={doctor.specialty || "-"} />
        <Row label="เบอร์โทร" value={doctor.phone || "-"} />
        <Row
          label="สาขา"
          value={
            doctor.doctorBranches?.map((doctorBranch) => doctorBranch.branch.name).join(", ") || "-"
          }
        />
        <Row
          label="สถานะ"
          value={doctor.isActive ? "ใช้งาน" : "ปิด"}
          valueClass={doctor.isActive ? "text-green-600" : "text-red-500"}
        />
      </div>

      <div className="flex gap-3 mt-6">
        <button
          onClick={onDelete}
          className="flex-1 border border-red-300 text-red-500 rounded px-4 py-2 text-sm hover:bg-red-50"
        >
          ปิดการใช้งาน
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

export default DoctorsPage;
