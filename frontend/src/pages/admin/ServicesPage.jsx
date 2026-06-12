import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { categoryService } from "../../services/category.service.js";
import { serviceService } from "../../services/service.service.js";
import { Plus, ChevronDown, ChevronRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DataGrid } from "@mui/x-data-grid";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { datagridSx } from "@/lib/datagrid";

const ServicesPage = () => {
  const queryClient = useQueryClient();
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [confirmCategory, setConfirmCategory] = useState(null);
  const [confirmService, setConfirmService] = useState(null);

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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
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
    services.filter((s) => s.categoryId === categoryId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="หัตถการ"
        subtitle={`${categories.length} หมวดหมู่ / ${services.length} หัตถการ`}
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCategoryForm(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              เพิ่มหมวดหมู่
            </Button>
            <Button onClick={() => setShowServiceForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              เพิ่มหัตถการ
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-5 w-12 rounded-full" />
                </div>
                <Skeleton className="h-8 w-20 rounded-full" />
              </div>
            </Card>
          ))}
        </div>
      ) : categories.length === 0 ? (
        <EmptyState message="ยังไม่มีหมวดหมู่" />
      ) : (
        <div className="space-y-3">
          {categories.map((category) => {
            const categoryServices = getServicesByCategory(category.id);
            const isExpanded = expandedCategory === category.id;

            return (
              <Card key={category.id} className="overflow-hidden">
                <div
                  className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() =>
                    setExpandedCategory(isExpanded ? null : category.id)
                  }
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown size={18} className="text-muted-foreground" />
                    ) : (
                      <ChevronRight size={18} className="text-muted-foreground" />
                    )}
                    <span className="font-medium">{category.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {categoryServices.length} รายการ
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmCategory(category);
                    }}
                  >
                    ปิดหมวดหมู่
                  </Button>
                </div>

                {isExpanded && (
                  <div className="border-t border-border">
                    {categoryServices.length === 0 ? (
                      <p className="px-6 py-4 text-sm text-muted-foreground">
                        ยังไม่มีหัตถการในหมวดนี้
                      </p>
                    ) : (
                      <DataGrid
                        rows={categoryServices}
                        columns={[
                          { field: "name", headerName: "ชื่อหัตถการ", flex: 1 },
                          { field: "duration", headerName: "ระยะเวลา", width: 120, valueGetter: (v) => `${v} นาที` },
                          { field: "price", headerName: "ราคา", width: 120, valueGetter: (v) => v ? `฿${formatCurrency(v)}` : "-" },
                          {
                            field: "isActive",
                            headerName: "สถานะ",
                            width: 90,
                            renderCell: (params) => (
                              <StatusBadge
                                status={params.row.isActive ? "ACTIVE" : "INACTIVE"}
                                label={params.row.isActive ? "เปิด" : "ปิด"}
                              />
                            ),
                          },
                          {
                            field: "actions",
                            headerName: "",
                            width: 70,
                            sortable: false,
                            renderCell: (params) => (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 px-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmService(params.row);
                                }}
                              >
                                ปิด
                              </Button>
                            ),
                          },
                        ]}
                        autoHeight
                        hideFooter
                        sx={datagridSx}
                      />
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <CategoryForm
        open={showCategoryForm}
        onClose={() => setShowCategoryForm(false)}
        onSubmit={(data) => createCategoryMutation.mutate(data)}
        isLoading={createCategoryMutation.isPending}
        error={createCategoryMutation.error?.response?.data?.message}
      />

      <ServiceForm
        open={showServiceForm}
        onClose={() => setShowServiceForm(false)}
        onSubmit={(data) => createServiceMutation.mutate(data)}
        isLoading={createServiceMutation.isPending}
        error={createServiceMutation.error?.response?.data?.message}
        categories={categories}
      />

      <ConfirmDialog
        open={!!confirmCategory}
        onClose={() => setConfirmCategory(null)}
        onConfirm={() => { deleteCategoryMutation.mutate(confirmCategory.id); setConfirmCategory(null); }}
        title="ยืนยันการปิดหมวดหมู่"
        description={confirmCategory ? `ต้องการปิดหมวดหมู่ "${confirmCategory.name}" หรือไม่?` : ""}
        confirmLabel="ปิดหมวดหมู่"
        isLoading={deleteCategoryMutation.isPending}
      />

      <ConfirmDialog
        open={!!confirmService}
        onClose={() => setConfirmService(null)}
        onConfirm={() => { deleteServiceMutation.mutate(confirmService.id); setConfirmService(null); }}
        title="ยืนยันการปิดหัตถการ"
        description={confirmService ? `ต้องการปิดหัตถการ "${confirmService.name}" หรือไม่?` : ""}
        confirmLabel="ปิดหัตถการ"
        isLoading={deleteServiceMutation.isPending}
      />
    </div>
  );
};

const CategoryForm = ({ open, onClose, onSubmit, isLoading, error }) => {
  const [name, setName] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ name });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>เพิ่มหมวดหมู่</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="rounded-md bg-destructive/10 text-destructive text-sm p-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cat-name">ชื่อหมวดหมู่ *</Label>
            <Input
              id="cat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น ฟิลเลอร์ โบท็อกซ์"
              required
            />
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              ยกเลิก
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const ServiceForm = ({ open, onClose, onSubmit, isLoading, error, categories }) => {
  const [form, setForm] = useState({
    name: "",
    categoryId: "",
    duration: "",
    price: "",
    description: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      categoryId: Number(form.categoryId),
      duration: Number(form.duration),
      price: form.price ? Number(form.price) : null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>เพิ่มหัตถการ</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="rounded-md bg-destructive/10 text-destructive text-sm p-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="svc-cat">หมวดหมู่ *</Label>
            <Select
              value={form.categoryId}
              onValueChange={(v) => setForm({ ...form, categoryId: v })}
              required
            >
              <SelectTrigger id="svc-cat" className="w-full">
                <SelectValue placeholder="เลือกหมวดหมู่" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="svc-name">ชื่อหัตถการ *</Label>
            <Input
              id="svc-name"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="svc-dur">ระยะเวลา (นาที) *</Label>
              <Input
                id="svc-dur"
                type="number"
                name="duration"
                value={form.duration}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="svc-price">ราคา (บาท)</Label>
              <Input
                id="svc-price"
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="svc-desc">รายละเอียด</Label>
            <Textarea
              id="svc-desc"
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={2}
            />
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              ยกเลิก
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ServicesPage;
