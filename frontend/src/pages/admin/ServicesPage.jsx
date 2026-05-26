import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { categoryService } from "../../services/category.service.js";
import { serviceService } from "../../services/service.service.js";
import { Plus, X, ChevronDown, ChevronRight } from "lucide-react";

const ServicesPage = () => {
  const queryClient = useQueryClient();
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState(null);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: categoryService.getAll,
  });

  const { data: services = [] } = useQuery({
    queryKey: ["services"],
    queryFn: () => serviceService.getAll(),
  });

  const createCategoryMutation = useMutation({
    mutationFn: categoryService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setShowCategoryForm(false);
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: categoryService.delete,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });

  const createServiceMutation = useMutation({
    mutationFn: serviceService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      setShowServiceForm(false);
    },
  });

  const deleteServiceMutation = useMutation({
    mutationFn: serviceService.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["services"] }),
  });

  const getServicesByCategory = (categoryId) =>
    services.filter((service) => service.categoryId === categoryId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">หัตถการ</h1>
          <p className="text-gray-500 text-sm mt-1">
            {categories.length} หมวดหมู่ / {services.length} หัตถการ
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCategoryForm(true)}
            className="flex items-center gap-2 border border-blue-500 text-blue-500 px-4 py-2 rounded-lg hover:bg-blue-50 text-sm"
          >
            <Plus size={16} />
            เพิ่มหมวดหมู่
          </button>
          <button
            onClick={() => setShowServiceForm(true)}
            className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 text-sm"
          >
            <Plus size={16} />
            เพิ่มหัตถการ
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-gray-400">กำลังโหลด...</div>
      ) : categories.length === 0 ? (
        <div className="p-8 text-center text-gray-400">ยังไม่มีหมวดหมู่</div>
      ) : (
        <div className="space-y-3">
          {categories.map((category) => {
            const categoryServices = getServicesByCategory(category.id);
            const isExpanded = expandedCategory === category.id;

            return (
              <div
                key={category.id}
                className="bg-white rounded-lg shadow-sm overflow-hidden"
              >
                <div
                  className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-gray-50"
                  onClick={() =>
                    setExpandedCategory(isExpanded ? null : category.id)
                  }
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown size={18} className="text-gray-400" />
                    ) : (
                      <ChevronRight size={18} className="text-gray-400" />
                    )}
                    <span className="font-medium text-gray-800">
                      {category.name}
                    </span>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      {categoryServices.length} รายการ
                    </span>
                  </div>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      deleteCategoryMutation.mutate(category.id);
                    }}
                    className="text-red-400 hover:text-red-600 text-xs px-2 py-1 hover:bg-red-50 rounded"
                  >
                    ปิดหมวดหมู่
                  </button>
                </div>

                {isExpanded && (
                  <div className="border-t">
                    {categoryServices.length === 0 ? (
                      <div className="px-6 py-4 text-sm text-gray-400">
                        ยังไม่มีหัตถการในหมวดนี้
                      </div>
                    ) : (
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr className="text-left text-gray-500">
                            <th className="px-6 py-3 font-medium">
                              ชื่อหัตถการ
                            </th>
                            <th className="px-6 py-3 font-medium">ระยะเวลา</th>
                            <th className="px-6 py-3 font-medium">ราคา</th>
                            <th className="px-6 py-3 font-medium">สถานะ</th>
                            <th className="px-6 py-3 font-medium"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {categoryServices.map((service) => (
                            <tr key={service.id} className="hover:bg-gray-50">
                              <td className="px-6 py-3 text-gray-800">
                                {service.name}
                              </td>
                              <td className="px-6 py-3 text-gray-500">
                                {service.duration} นาที
                              </td>
                              <td className="px-6 py-3 text-gray-500">
                                {service.price ? `${service.price} ฿` : "-"}
                              </td>
                              <td className="px-6 py-3">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${service.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                                >
                                  {service.isActive ? "เปิด" : "ปิด"}
                                </span>
                              </td>
                              <td className="px-6 py-3">
                                <button
                                  onClick={() =>
                                    deleteServiceMutation.mutate(service.id)
                                  }
                                  className="text-red-400 hover:text-red-600 text-xs"
                                >
                                  ปิด
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showCategoryForm && (
        <CategoryForm
          onClose={() => setShowCategoryForm(false)}
          onSubmit={(data) => createCategoryMutation.mutate(data)}
          isLoading={createCategoryMutation.isPending}
          error={createCategoryMutation.error?.response?.data?.message}
        />
      )}

      {showServiceForm && (
        <ServiceForm
          onClose={() => setShowServiceForm(false)}
          onSubmit={(data) => createServiceMutation.mutate(data)}
          isLoading={createServiceMutation.isPending}
          error={createServiceMutation.error?.response?.data?.message}
          categories={categories}
        />
      )}
    </div>
  );
};

const CategoryForm = ({ onClose, onSubmit, isLoading, error }) => {
  const [name, setName] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({ name });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">เพิ่มหมวดหมู่</h2>
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
              ชื่อหมวดหมู่ *
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="เช่น ฟิลเลอร์ โบท็อกซ์"
              required
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded px-4 py-2 text-sm hover:bg-gray-50"
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

const ServiceForm = ({ onClose, onSubmit, isLoading, error, categories }) => {
  const [form, setForm] = useState({
    name: "",
    categoryId: "",
    duration: "",
    price: "",
    description: "",
  });

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      ...form,
      categoryId: Number(form.categoryId),
      duration: Number(form.duration),
      price: form.price ? Number(form.price) : null,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">เพิ่มหัตถการ</h2>
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
            <label className="block text-sm font-medium mb-1">หมวดหมู่ *</label>
            <select
              name="categoryId"
              value={form.categoryId}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">เลือกหมวดหมู่</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              ชื่อหัตถการ *
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">
                ระยะเวลา (นาที) *
              </label>
              <input
                type="number"
                name="duration"
                value={form.duration}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                ราคา (บาท)
              </label>
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">รายละเอียด</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={2}
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3">
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

export default ServicesPage;
