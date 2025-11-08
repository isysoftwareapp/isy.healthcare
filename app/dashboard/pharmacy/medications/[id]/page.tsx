"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  Package,
  Clock,
  AlertTriangle,
  Plus,
  Loader2,
  Save,
  Trash2,
} from "lucide-react";

interface Medication {
  _id: string;
  name: string;
  genericName?: string;
  brandName?: string;
  category: string;
  form: string;
  strength: string;
  unit: string;
  currentStock: number;
  reorderLevel: number;
  reorderQuantity: number;
  sellingPrice: number;
  costPrice?: number;
  requiresPrescription: boolean;
  isControlled: boolean;
  storageLocation?: string;
  batches: Array<{
    batchNumber: string;
    quantity: number;
    expiryDate: string;
    supplier?: string;
    isExpired?: boolean;
  }>;
  stockAdjustments: Array<{
    adjustmentDate: string;
    adjustmentType: string;
    quantity: number;
    reason?: string;
    notes?: string;
  }>;
}

export default function MedicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [medication, setMedication] = useState<Medication | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [adjustmentForm, setAdjustmentForm] = useState({
    adjustmentType: "correction",
    quantity: 0,
    reason: "",
    notes: "",
  });
  const [batchForm, setBatchForm] = useState({
    batchNumber: "",
    quantity: 0,
    expiryDate: "",
    supplier: "",
    cost: 0,
  });

  useEffect(() => {
    fetchMedication();
  }, [params.id]);

  const fetchMedication = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/medications/${params.id}`);
      const data = await response.json();

      if (data.success) {
        setMedication(data.data);
      }
    } catch (error) {
      console.error("Error fetching medication:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustStock = async () => {
    try {
      const response = await fetch(`/api/medications/${params.id}/adjust`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(adjustmentForm),
      });

      const data = await response.json();

      if (data.success) {
        setShowAdjustModal(false);
        setAdjustmentForm({
          adjustmentType: "correction",
          quantity: 0,
          reason: "",
          notes: "",
        });
        await fetchMedication();
      } else {
        alert(data.error || "Failed to adjust stock");
      }
    } catch (error) {
      console.error("Error adjusting stock:", error);
      alert("An error occurred");
    }
  };

  const handleAddBatch = async () => {
    try {
      const response = await fetch(`/api/medications/${params.id}/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(batchForm),
      });

      const data = await response.json();

      if (data.success) {
        setShowBatchModal(false);
        setBatchForm({
          batchNumber: "",
          quantity: 0,
          expiryDate: "",
          supplier: "",
          cost: 0,
        });
        await fetchMedication();
      } else {
        alert(data.error || "Failed to add batch");
      }
    } catch (error) {
      console.error("Error adding batch:", error);
      alert("An error occurred");
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!medication) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-gray-600">Medication not found</p>
          <Link
            href="/dashboard/pharmacy"
            className="text-blue-600 hover:underline mt-2 inline-block"
          >
            Back to Pharmacy
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/pharmacy"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Pharmacy</span>
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {medication.name}
            </h1>
            <p className="text-gray-600 mt-1">
              {medication.form} • {medication.strength}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowBatchModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Plus className="w-5 h-5" />
              Add Batch
            </button>
            <button
              onClick={() => setShowAdjustModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Edit className="w-5 h-5" />
              Adjust Stock
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Details Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Medication Details
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Generic Name</p>
                <p className="font-medium text-gray-900">
                  {medication.genericName || "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Brand Name</p>
                <p className="font-medium text-gray-900">
                  {medication.brandName || "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Category</p>
                <p className="font-medium text-gray-900">
                  {medication.category}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Storage Location</p>
                <p className="font-medium text-gray-900">
                  {medication.storageLocation || "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Cost Price</p>
                <p className="font-medium text-gray-900">
                  ${medication.costPrice?.toFixed(2) || "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Selling Price</p>
                <p className="font-medium text-gray-900">
                  ${medication.sellingPrice.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Batches */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Stock Batches
            </h2>
            {medication.batches.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No batches available
              </p>
            ) : (
              <div className="space-y-3">
                {medication.batches.map((batch, idx) => (
                  <div
                    key={idx}
                    className={`p-4 border rounded-lg ${
                      batch.isExpired
                        ? "border-red-300 bg-red-50"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          Batch: {batch.batchNumber}
                        </p>
                        <p className="text-sm text-gray-600">
                          Quantity: {batch.quantity} • Expires:{" "}
                          {new Date(batch.expiryDate).toLocaleDateString()}
                        </p>
                        {batch.supplier && (
                          <p className="text-sm text-gray-600">
                            Supplier: {batch.supplier}
                          </p>
                        )}
                      </div>
                      {batch.isExpired && (
                        <span className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full">
                          Expired
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Adjustments */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Recent Stock Adjustments
            </h2>
            {medication.stockAdjustments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No adjustments yet
              </p>
            ) : (
              <div className="space-y-3">
                {medication.stockAdjustments
                  .slice(-10)
                  .reverse()
                  .map((adj, idx) => (
                    <div
                      key={idx}
                      className="p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">
                            {adj.adjustmentType}
                          </p>
                          <p className="text-sm text-gray-600">
                            {new Date(adj.adjustmentDate).toLocaleString()}
                          </p>
                          {adj.reason && (
                            <p className="text-sm text-gray-600">
                              Reason: {adj.reason}
                            </p>
                          )}
                        </div>
                        <span
                          className={`text-lg font-semibold ${
                            adj.quantity > 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {adj.quantity > 0 ? "+" : ""}
                          {adj.quantity}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stock Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Stock Status
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Current Stock</p>
                <p className="text-3xl font-bold text-gray-900">
                  {medication.currentStock}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Reorder Level</p>
                <p className="text-xl font-semibold text-gray-900">
                  {medication.reorderLevel}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Reorder Quantity</p>
                <p className="text-xl font-semibold text-gray-900">
                  {medication.reorderQuantity}
                </p>
              </div>
            </div>
          </div>

          {/* Prescription Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Prescription Info
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  Requires Prescription
                </span>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    medication.requiresPrescription
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {medication.requiresPrescription ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  Controlled Substance
                </span>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    medication.isControlled
                      ? "bg-red-100 text-red-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {medication.isControlled ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Adjust Stock Modal */}
      {showAdjustModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Adjust Stock
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adjustment Type
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  value={adjustmentForm.adjustmentType}
                  onChange={(e) =>
                    setAdjustmentForm({
                      ...adjustmentForm,
                      adjustmentType: e.target.value,
                    })
                  }
                >
                  <option value="correction">Correction</option>
                  <option value="damaged">Damaged</option>
                  <option value="expired">Expired</option>
                  <option value="returned">Returned</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity (positive to add, negative to remove)
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  value={adjustmentForm.quantity}
                  onChange={(e) =>
                    setAdjustmentForm({
                      ...adjustmentForm,
                      quantity: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  value={adjustmentForm.reason}
                  onChange={(e) =>
                    setAdjustmentForm({
                      ...adjustmentForm,
                      reason: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                  value={adjustmentForm.notes}
                  onChange={(e) =>
                    setAdjustmentForm({
                      ...adjustmentForm,
                      notes: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAdjustModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAdjustStock}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Adjust Stock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Batch Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Add New Batch
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Batch Number *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  value={batchForm.batchNumber}
                  onChange={(e) =>
                    setBatchForm({ ...batchForm, batchNumber: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  value={batchForm.quantity}
                  onChange={(e) =>
                    setBatchForm({
                      ...batchForm,
                      quantity: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Date *
                </label>
                <input
                  type="date"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  value={batchForm.expiryDate}
                  onChange={(e) =>
                    setBatchForm({ ...batchForm, expiryDate: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  value={batchForm.supplier}
                  onChange={(e) =>
                    setBatchForm({ ...batchForm, supplier: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cost per Unit
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  value={batchForm.cost}
                  onChange={(e) =>
                    setBatchForm({
                      ...batchForm,
                      cost: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowBatchModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddBatch}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Add Batch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
