import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { patientService } from "../../services/patient.service.js";
import { Search, Plus, X } from "lucide-react";

const PatientsPage = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ["patients", search],
    queryFn: () => patientService.getAll({ search }),
  });

  const createMutation = useMutation({
    mutationFn: patientService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: patientService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">ลูกค้า</h1>
          <p className="text-gray-500m text-sm mt-1">
            ทั้งหมด {patients.length} คน
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
        >
          <Plus size={18} />
          เพิ่มลูกค้า
        </button>
      </div>

      <div className="relative">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          placeholder="ค้นหาชื่อ เบอร์โทร หรือเลข OPD"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">กำลังโหลด...</div>
        ) : patients.length === 0 ? (
          <div>ไม่พบข้อมูลลูกค้า</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr className="text-left text-gray-500">
                <th className="px-6 py-3 font-medium">OPD</th>
                <th className="px-6 py-3 font-medium">ชื่อ</th>
                <th className="px-6 py-3 font-medium">เบอร์โทร</th>
                <th className="px-6 py-3 font-medium">อายุ</th>
                <th className="px-6 py-3 font-medium">ประเภท</th>
                <th className="px-6 py-3 font-medium">แพ้ยา</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {patients.map((patient) => (
                <tr
                  key={patient.id}
                  onClick={() => setSelected(patient)}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-6 py-4 text-gray-500">
                    {patient.opdNumber}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-800">
                      {patient.firstName} {patient.lastName}
                    </p>
                    {patient.nickname && (
                      <p className="text-gray-400 text-xs">
                        ({patient.nickname})
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-500">{patient.phone}</td>
                  <td className="px-6 py-4 text-gray-500">
                    {patient.age || "-"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${patient.isNewPatient ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}
                    >
                      {patient.isNewPatient ? "ใหม่" : "เก่า"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <PatientForm
          onClose={() => setShowForm(false)}
          onSubmit={(data) => createMutation.mutate(data)}
          isLoading={createMutation.isPending}
          error={createMutation.error?.response?.data?.message}
        />
      )}

      {selected && (
        <PatientDetail
          patient={selected}
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

const PatientForm = ({ onClose, onSubmit, isLoading, error }) => {
  const [form, setForm] = useState({
    opdNumber: "",
    firstName: "",
    lastName: "",
    nickname: "",
    phone: "",
    age: "",
    allergyHistory: "",
    nationalId: "",
  });

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      ...form,
      age: form.age ? Number(form.age) : null,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">เพิ่มลูกค้าใหม่</h2>
          <button onClick={onClose}>
            <X size={20} className="text-gray-400 hover:text-gray-600" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">
                เลข OPD *
              </label>
              <input
                name="opdNumber"
                value={form.opdNumber}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                เลขบัตรประชาชน
              </label>
              <input
                name="nationalId"
                value={form.nationalId}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">ชื่อ *</label>
              <input
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                นามสกุล *
              </label>
              <input
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">ชื่อเล่น</label>
              <input
                name="nickname"
                value={form.nickname}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">อายุ</label>
              <input
                name="age"
                value={form.age}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">เบอร์โทร *</label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              ประวัติแพ้ยา
            </label>
            <textarea
              name="allergyHistory"
              value={form.allergyHistory}
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

const PatientDetail = ({ patient, onClose, onDelete }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">ข้อมูลลูกค้า</h2>
          <button onClick={onClose}>
            <X size={20} className="text-gray-400 hover:text-gray-600" />
          </button>
        </div>

        <div className="space-y-3 text-sm">
          <Row label="เลข OPD" value={patient.opdNumber} />
          <Row
            label="ชื่อ"
            value={`${patient.firstName} ${patient.lastName}`}
          />
          <Row label="ชื่อเล่น" value={patient.nickname || "-"} />
          <Row label="เบอร์โทร" value={patient.phone} />
          <Row label="อายุ" value={patient.age || "-"} />
          <Row
            label="ประเภท"
            value={patient.isNewPatient ? "ลูกค้าใหม่" : "ลูกค้าเก่า"}
          />
          <Row
            label="แพ้ยา"
            value={patient.allergyHistory || "-"}
            valueClass="text-red-500"
          />
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onDelete}
            className="flex-1 border border-red-300 text-red-500 rounded px-4 py-2 text-sm hover:bg-red-50"
          >
            ลบ
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
};

const Row = ({ label, value, valueClass = "text-gray-700" }) => (
  <div className="flex justify-between py-2 border-b last:border-0">
    <span className="text-gray-500">{label}</span>
    <span className={valueClass}>{value}</span>
  </div>
);

export default PatientsPage;
