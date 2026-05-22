import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { branchService } from "../../services/branch.service.js";
import { Plus, X } from "lucide-react";

const BranchesPage = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);

  const { data: branches = [], isLoading } = useQuery({
    queryKey: ["branches"],
    queryFn: branchService.getAll,
  });

  const createMutation = useMutation({
    mutationFn: branchService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: branchService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">สาขา</h1>
          <p className="text-gray-500 text-sm mt-1">
            ทั้งหมด {branches.length} สาขา
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
        >
          <Plus size={18} />
          เพิ่มสาขา
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">กำลังโหลด...</div>
        ) : branches.length === 0 ? (
          <div className="p-8 text-center text-gray-400">ไม่พบข้อมูลสาขา</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr className="text-left text-gray-500">
                <th className="px-6 py-3 font-medium">ชื่อสาขา</th>
                <th className="px-6 py-3 font-medium">ที่อยู่</th>
                <th className="px-6 py-3 font-medium">เบอร์โทร</th>
                <th className="px-6 py-3 font-medium">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {branches.map((branch) => (
                <tr
                  key={branch.id}
                  onClick={() => setSelected(branch)}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-6 py-4 font-medium text-gray-800">
                    {branch.name}
                  </td>
                  <td className="px-6 py-4 text-gray-500">{branch.location}</td>
                  <td className="px-6 py-4 text-gray-500">
                    {branch.phone || "-"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium
                      ${
                        branch.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {branch.isActive ? "เปิด" : "ปิด"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <BranchForm
          onClose={() => setShowForm(false)}
          onSubmit={(data) => createMutation.mutate(data)}
          isLoading={createMutation.isPending}
          error={createMutation.error?.response?.data?.message}
        />
      )}

      {selected && (
        <BranchDetail
          branch={selected}
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

const BranchForm = ({ onClose, onSubmit, isLoading, error }) => {
  const [form, setForm] = useState({
    name: "",
    location: "",
    phone: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">เพิ่มสาขาใหม่</h2>
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
            <label className="block text-sm font-medium mb-1">ชื่อสาขา *</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">ที่อยู่ *</label>
            <input
              name="location"
              value={form.location}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
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

const BranchDetail = ({ branch, onClose, onDelete }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">ข้อมูลสาขา</h2>
        <button onClick={onClose}>
          <X size={20} className="text-gray-400 hover:text-gray-600" />
        </button>
      </div>

      <div className="space-y-3 text-sm">
        <Row label="ชื่อสาขา" value={branch.name} />
        <Row label="ที่อยู่" value={branch.location} />
        <Row label="เบอร์โทร" value={branch.phone || "-"} />
        <Row
          label="สถานะ"
          value={branch.isActive ? "เปิด" : "ปิด"}
          valueClass={branch.isActive ? "text-green-600" : "text-red-500"}
        />
      </div>

      <div className="flex gap-3 mt-6">
        <button
          onClick={onDelete}
          className="flex-1 border border-red-300 text-red-500 rounded px-4 py-2 text-sm hover:bg-red-50"
        >
          ปิดสาขา
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

export default BranchesPage;
