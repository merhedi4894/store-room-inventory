"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
// DialogContent uses CSS grid by default.
// We override grid-template-rows to "auto 1fr auto"
// so that: header=auto, form=flexible(scrollable), footer=always visible.
// This fixes the save button not working in all dialogs.
import {
  Package,
  PackagePlus,
  PackageX,
  Truck,
  BarChart3,
  AlertTriangle,
  Search,
  Plus,
  Trash2,
  Edit2,
  Warehouse,
  CheckCircle2,
  Lock,
  KeyRound,
  ShieldCheck,
  ArrowLeft,
  Eye,
  EyeOff,
} from "lucide-react";

// Password & security constants
const DEFAULT_PASSWORD = "admin123";
const SECURITY_QUESTION = "Where is your birth place?";
const LS_PASSWORD_KEY = "storeRoom_password";
const LS_SECURITY_KEY = "storeRoom_security_answer";
const SS_AUTH_KEY = "storeRoom_auth";

// Types
interface Item {
  id: string;
  name: string;
  description: string | null;
  unit: string;
  lowStockThreshold: number | null;
  stock: number;
  totalIncoming: number;
  totalConsumed: number;
  totalTransferred: number;
  createdAt: string;
}

interface IncomingRecord {
  id: string;
  itemId: string;
  item: { id: string; name: string; unit: string };
  quantity: number;
  date: string;
  supplier: string | null;
  note: string | null;
}

interface ConsumedRecord {
  id: string;
  itemId: string;
  item: { id: string; name: string; unit: string };
  quantity: number;
  date: string;
  note: string | null;
}

interface TransferredRecord {
  id: string;
  itemId: string;
  item: { id: string; name: string; unit: string };
  quantity: number;
  transferredTo: string;
  purpose: string | null;
  receivedBy: string;
  date: string;
  note: string | null;
}

interface DashboardData {
  totalItems: number;
  totalIncomingRecords: number;
  totalConsumedRecords: number;
  totalTransferredRecords: number;
  totalIncomingQty: number;
  totalConsumedQty: number;
  totalTransferredQty: number;
  recentIncoming: IncomingRecord[];
  recentConsumed: ConsumedRecord[];
  recentTransferred: TransferredRecord[];
  lowStockItems: (Item & { stock: number })[];
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("bn-BD", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function Home() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [items, setItems] = useState<Item[]>([]);
  const [incomingRecords, setIncomingRecords] = useState<IncomingRecord[]>([]);
  const [consumedRecords, setConsumedRecords] = useState<ConsumedRecord[]>([]);
  const [transferredRecords, setTransferredRecords] = useState<TransferredRecord[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form states
  const [itemName, setItemName] = useState("");
  const [itemDesc, setItemDesc] = useState("");
  const [itemUnit, setItemUnit] = useState("টি");
  const [itemLowStock, setItemLowStock] = useState("");
  const [editItemId, setEditItemId] = useState<string | null>(null);

  // Incoming form
  const [incItemId, setIncItemId] = useState("");
  const [incQty, setIncQty] = useState("");
  const [incDate, setIncDate] = useState(new Date().toISOString().split("T")[0]);
  const [incSupplier, setIncSupplier] = useState("");
  const [incNote, setIncNote] = useState("");
  const [incDialogOpen, setIncDialogOpen] = useState(false);
  const [editIncId, setEditIncId] = useState<string | null>(null);

  // Consumed form
  const [conItemId, setConItemId] = useState("");
  const [conQty, setConQty] = useState("");
  const [conDate, setConDate] = useState(new Date().toISOString().split("T")[0]);
  const [conNote, setConNote] = useState("");
  const [conDialogOpen, setConDialogOpen] = useState(false);
  const [editConId, setEditConId] = useState<string | null>(null);

  // Transferred form
  const [traItemId, setTraItemId] = useState("");
  const [traQty, setTraQty] = useState("");
  const [traDate, setTraDate] = useState(new Date().toISOString().split("T")[0]);
  const [traTo, setTraTo] = useState("");
  const [traPurpose, setTraPurpose] = useState("");
  const [traReceivedBy, setTraReceivedBy] = useState("");
  const [traNote, setTraNote] = useState("");
  const [traDialogOpen, setTraDialogOpen] = useState(false);
  const [editTraId, setEditTraId] = useState<string | null>(null);

  // Item dialog
  const [itemDialogOpen, setItemDialogOpen] = useState(false);

  // Search
  const [searchTerm, setSearchTerm] = useState("");

  // Items list pagination
  const [itemPage, setItemPage] = useState(1);

  // Reset page when search changes
  useEffect(() => {
    setItemPage(1);
  }, [searchTerm]);

  // ========== PASSWORD / LOGIN SYSTEM ==========
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showSecuritySetup, setShowSecuritySetup] = useState(false);
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [securitySetupConfirm, setSecuritySetupConfirm] = useState("");
  const [securitySetupError, setSecuritySetupError] = useState("");
  const [forgotAnswer, setForgotAnswer] = useState("");
  const [forgotNewPass, setForgotNewPass] = useState("");
  const [forgotConfirmPass, setForgotConfirmPass] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotStep, setForgotStep] = useState<1 | 2>(1); // 1=answer question, 2=new password
  const [showPassword, setShowPassword] = useState(false);

  // Check session on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const auth = sessionStorage.getItem(SS_AUTH_KEY);
      if (auth === "true") {
        setIsAuthenticated(true);
      }
    }
  }, []);

  const handleLogin = () => {
    if (!loginPassword.trim()) { setLoginError("পাসওয়ার্ড লিখুন"); return; }
    const storedPass = localStorage.getItem(LS_PASSWORD_KEY) || DEFAULT_PASSWORD;
    if (loginPassword === storedPass) {
      sessionStorage.setItem(SS_AUTH_KEY, "true");
      setIsAuthenticated(true);
      setLoginError("");
      setLoginPassword("");
      // Check if security answer is set
      if (!localStorage.getItem(LS_SECURITY_KEY)) {
        setShowSecuritySetup(true);
      }
    } else {
      setLoginError("ভুল পাসওয়ার্ড!");
      setLoginPassword("");
    }
  };

  const handleSecuritySetup = () => {
    if (!securityAnswer.trim()) { setSecuritySetupError("উত্তর দিন"); return; }
    if (securityAnswer.toLowerCase() !== securitySetupConfirm.toLowerCase()) {
      setSecuritySetupError("উত্তর দুইবার একই হতে হবে");
      return;
    }
    localStorage.setItem(LS_SECURITY_KEY, securityAnswer.toLowerCase().trim());
    setShowSecuritySetup(false);
    setSecurityAnswer("");
    setSecuritySetupConfirm("");
    setSecuritySetupError("");
  };

  const handleForgotStep1 = () => {
    if (!forgotAnswer.trim()) { setForgotError("উত্তর লিখুন"); return; }
    const storedAnswer = localStorage.getItem(LS_SECURITY_KEY);
    if (!storedAnswer) {
      setForgotError("নিরাপত্তা উত্তর সেট করা হয়নি। ডিফল্ট পাসওয়ার্ড: admin123");
      return;
    }
    if (forgotAnswer.toLowerCase().trim() === storedAnswer) {
      setForgotStep(2);
      setForgotError("");
    } else {
      setForgotError("ভুল উত্তর! আবার চেষ্টা করুন।");
    }
  };

  const handleForgotStep2 = () => {
    if (!forgotNewPass.trim() || forgotNewPass.length < 4) {
      setForgotError("পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে");
      return;
    }
    if (forgotNewPass !== forgotConfirmPass) {
      setForgotError("পাসওয়ার্ড মিলছে না");
      return;
    }
    localStorage.setItem(LS_PASSWORD_KEY, forgotNewPass.trim());
    setForgotError("");
    setShowForgotPassword(false);
    setForgotStep(1);
    setForgotAnswer("");
    setForgotNewPass("");
    setForgotConfirmPass("");
    setLoginError("পাসওয়ার্ড পরিবর্তন হয়েছে! নতুন পাসওয়ার্ড দিন।");
  };

  // Fetch functions
  const fetchItems = useCallback(async () => {
    const res = await fetch("/api/items");
    if (res.ok) {
      const data = await res.json();
      setItems(data);
    }
  }, []);

  const fetchIncoming = useCallback(async () => {
    const res = await fetch("/api/incoming");
    if (res.ok) {
      const data = await res.json();
      setIncomingRecords(data);
    }
  }, []);

  const fetchConsumed = useCallback(async () => {
    const res = await fetch("/api/consumed");
    if (res.ok) {
      const data = await res.json();
      setConsumedRecords(data);
    }
  }, []);

  const fetchTransferred = useCallback(async () => {
    const res = await fetch("/api/transferred");
    if (res.ok) {
      const data = await res.json();
      setTransferredRecords(data);
    }
  }, []);

  const fetchDashboard = useCallback(async () => {
    const res = await fetch("/api/dashboard");
    if (res.ok) {
      const data = await res.json();
      setDashboardData(data);
    }
  }, []);

  const fetchAllSilent = useCallback(async () => {
    try {
      await Promise.all([fetchItems(), fetchIncoming(), fetchConsumed(), fetchTransferred(), fetchDashboard()]);
    } catch {
      // silent refresh
    }
  }, [fetchItems, fetchIncoming, fetchConsumed, fetchTransferred, fetchDashboard]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      await fetchAllSilent();
    } catch {
      setError("ডেটা লোড করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  }, [fetchAllSilent]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Item CRUD
  const handleAddItem = async () => {
    if (!itemName.trim()) return;
    const res = await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: itemName, description: itemDesc, unit: itemUnit, lowStockThreshold: itemLowStock }),
    });
    if (res.ok) {
      setItemName("");
      setItemDesc("");
      setItemUnit("টি");
      setItemLowStock("");
      setItemDialogOpen(false);
      fetchAllSilent();
      toast.success("নতুন আইটেম সংরক্ষণ হয়েছে");
    } else {
      const data = await res.json();
      toast.error(data.error || "আইটেম যোগ করতে সমস্যা হয়েছে");
    }
  };

  const handleUpdateItem = async () => {
    if (!editItemId || !itemName.trim()) return;
    const res = await fetch("/api/items", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editItemId, name: itemName, description: itemDesc, unit: itemUnit, lowStockThreshold: itemLowStock }),
    });
    if (res.ok) {
      setItemName("");
      setItemDesc("");
      setItemUnit("টি");
      setItemLowStock("");
      setEditItemId(null);
      setItemDialogOpen(false);
      fetchAllSilent();
      toast.success("আইটেম আপডেট হয়েছে");
    } else {
      const data = await res.json();
      toast.error(data.error || "আইটেম আপডেট করতে সমস্যা হয়েছে");
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("আপনি কি এই আইটেম মুছে ফেলতে চান? এর সাথে সম্পর্কিত সব রেকর্ডও মুছে যাবে।")) return;
    const res = await fetch(`/api/items?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      fetchAllSilent();
      toast.success("আইটেম মুছে ফেলা হয়েছে");
    }
  };

  const handleEditItem = (item: Item) => {
    setEditItemId(item.id);
    setItemName(item.name);
    setItemDesc(item.description || "");
    setItemUnit(item.unit);
    setItemLowStock(item.lowStockThreshold !== null && item.lowStockThreshold !== undefined ? String(item.lowStockThreshold) : "");
    setItemDialogOpen(true);
  };

  // Incoming CRUD
  const handleEditIncoming = (record: IncomingRecord) => {
    setEditIncId(record.id);
    setIncItemId(record.itemId);
    setIncQty(String(record.quantity));
    setIncDate(record.date.split("T")[0]);
    setIncSupplier(record.supplier || "");
    setIncNote(record.note || "");
    setIncDialogOpen(true);
  };

  const handleUpdateIncoming = async () => {
    if (!editIncId || !incItemId || !incQty) return;
    const res = await fetch("/api/incoming", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editIncId, itemId: incItemId, quantity: incQty, date: incDate, supplier: incSupplier, note: incNote }),
    });
    if (res.ok) {
      setIncItemId(""); setIncQty(""); setIncSupplier(""); setIncNote("");
      setEditIncId(null); setIncDialogOpen(false);
      fetchAllSilent();
      toast.success("মালামাল ঢুকানো রেকর্ড আপডেট হয়েছে");
    } else {
      const data = await res.json();
      toast.error(data.error || "রেকর্ড আপডেট করতে সমস্যা হয়েছে");
    }
  };

  const handleAddIncoming = async () => {
    if (!incItemId || !incQty) return;
    const res = await fetch("/api/incoming", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: incItemId, quantity: incQty, date: incDate, supplier: incSupplier, note: incNote }),
    });
    if (res.ok) {
      setIncItemId(""); setIncQty(""); setIncSupplier(""); setIncNote("");
      setIncDialogOpen(false);
      fetchAllSilent();
      toast.success("নতুন মালামাল ঢুকানো রেকর্ড সংরক্ষিত হয়েছে");
    } else {
      const data = await res.json();
      toast.error(data.error || "রেকর্ড যোগ করতে সমস্যা হয়েছে");
    }
  };

  const handleDeleteIncoming = async (id: string) => {
    if (!confirm("আপনি কি এই রেকর্ড মুছে ফেলতে চান?")) return;
    const res = await fetch(`/api/incoming?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      fetchAllSilent();
      toast.success("মালামাল ঢুকানো রেকর্ড মুছে ফেলা হয়েছে");
    }
  };

  // Consumed CRUD
  const handleEditConsumed = (record: ConsumedRecord) => {
    setEditConId(record.id);
    setConItemId(record.itemId);
    setConQty(String(record.quantity));
    setConDate(record.date.split("T")[0]);
    setConNote(record.note || "");
    setConDialogOpen(true);
  };

  const handleUpdateConsumed = async () => {
    if (!editConId || !conItemId || !conQty) return;
    const res = await fetch("/api/consumed", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editConId, itemId: conItemId, quantity: conQty, date: conDate, note: conNote }),
    });
    if (res.ok) {
      setConItemId(""); setConQty(""); setConNote("");
      setEditConId(null); setConDialogOpen(false);
      fetchAllSilent();
      toast.success("নস্ট রেকর্ড আপডেট হয়েছে");
    } else {
      const data = await res.json();
      toast.error(data.error || "রেকর্ড আপডেট করতে সমস্যা হয়েছে");
    }
  };

  const handleAddConsumed = async () => {
    if (!conItemId || !conQty) return;
    const res = await fetch("/api/consumed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: conItemId, quantity: conQty, date: conDate, note: conNote }),
    });
    if (res.ok) {
      setConItemId(""); setConQty(""); setConNote("");
      setConDialogOpen(false);
      fetchAllSilent();
      toast.success("নতুন নস্ট রেকর্ড সংরক্ষিত হয়েছে");
    } else {
      const data = await res.json();
      toast.error(data.error || "রেকর্ড যোগ করতে সমস্যা হয়েছে");
    }
  };

  const handleDeleteConsumed = async (id: string) => {
    if (!confirm("আপনি কি এই রেকর্ড মুছে ফেলতে চান?")) return;
    const res = await fetch(`/api/consumed?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      fetchAllSilent();
      toast.success("নস্ট রেকর্ড মুছে ফেলা হয়েছে");
    }
  };

  // Transferred CRUD
  const handleEditTransferred = (record: TransferredRecord) => {
    setEditTraId(record.id);
    setTraItemId(record.itemId);
    setTraQty(String(record.quantity));
    setTraDate(record.date.split("T")[0]);
    setTraTo(record.transferredTo);
    setTraPurpose(record.purpose || "");
    setTraReceivedBy(record.receivedBy);
    setTraNote(record.note || "");
    setTraDialogOpen(true);
  };

  const handleUpdateTransferred = async () => {
    if (!editTraId || !traItemId || !traQty || !traTo || !traReceivedBy) return;
    const res = await fetch("/api/transferred", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editTraId, itemId: traItemId, quantity: traQty, date: traDate,
        transferredTo: traTo, purpose: traPurpose, receivedBy: traReceivedBy, note: traNote,
      }),
    });
    if (res.ok) {
      setTraItemId(""); setTraQty(""); setTraTo(""); setTraPurpose(""); setTraReceivedBy(""); setTraNote("");
      setEditTraId(null); setTraDialogOpen(false);
      fetchAllSilent();
      toast.success("স্থানান্তর রেকর্ড আপডেট হয়েছে");
    } else {
      const data = await res.json();
      toast.error(data.error || "রেকর্ড আপডেট করতে সমস্যা হয়েছে");
    }
  };

  const handleAddTransferred = async () => {
    if (!traItemId || !traQty || !traTo || !traReceivedBy) return;
    const res = await fetch("/api/transferred", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemId: traItemId,
        quantity: traQty,
        date: traDate,
        transferredTo: traTo,
        purpose: traPurpose,
        receivedBy: traReceivedBy,
        note: traNote,
      }),
    });
    if (res.ok) {
      setTraItemId("");
      setTraQty("");
      setTraTo("");
      setTraPurpose("");
      setTraReceivedBy("");
      setTraNote("");
      setTraDialogOpen(false);
      fetchAllSilent();
      toast.success("নতুন স্থানান্তর রেকর্ড সংরক্ষিত হয়েছে");
    } else {
      const data = await res.json();
      toast.error(data.error || "রেকর্ড যোগ করতে সমস্যা হয়েছে");
    }
  };

  const handleDeleteTransferred = async (id: string) => {
    if (!confirm("আপনি কি এই রেকর্ড মুছে ফেলতে চান?")) return;
    const res = await fetch(`/api/transferred?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      fetchAllSilent();
      toast.success("স্থানান্তর রেকর্ড মুছে ফেলা হয়েছে");
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredIncoming = incomingRecords.filter(
    (r) =>
      r.item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.supplier && r.supplier.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredConsumed = consumedRecords.filter((r) =>
    r.item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTransferred = transferredRecords.filter(
    (r) =>
      r.item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.transferredTo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.receivedBy.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Items to display (5 per page with pagination)
  const ITEMS_PER_PAGE = 5;
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(itemPage, totalPages);
  const displayItems = filteredItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="flex flex-col items-center gap-4">
          <Warehouse className="h-16 w-16 text-emerald-600 animate-pulse" />
          <p className="text-lg text-emerald-700 font-medium">লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  // ========== LOGIN OVERLAY ==========
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-4">
        {/* Security Setup Modal */}
        {showSecuritySetup && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
              <div className="text-center">
                <div className="mx-auto w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                  <ShieldCheck className="h-7 w-7 text-purple-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">নিরাপত্তা সেটআপ</h2>
                <p className="text-sm text-gray-500 mt-1">প্রথমবার লগইন করায় আপনার নিরাপত্তা তথ্য দিন</p>
              </div>
              <div className="space-y-3">
                <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                  <p className="text-sm font-medium text-purple-800">নিরাপত্তা প্রশ্ন:</p>
                  <p className="text-sm text-purple-700 mt-1 font-semibold">{SECURITY_QUESTION}</p>
                </div>
                <div>
                  <Label>আপনার উত্তর *</Label>
                  <Input placeholder="উত্তর লিখুন" value={securityAnswer} onChange={(e) => { setSecurityAnswer(e.target.value); setSecuritySetupError(""); }} className="min-h-[44px] mt-1" />
                </div>
                <div>
                  <Label>উত্তর নিশ্চিত করুন *</Label>
                  <Input placeholder="আবার উত্তর লিখুন" value={securitySetupConfirm} onChange={(e) => { setSecuritySetupConfirm(e.target.value); setSecuritySetupError(""); }} className="min-h-[44px] mt-1" />
                </div>
              </div>
              {securitySetupError && <p className="text-sm text-red-600 text-center">{securitySetupError}</p>}
              <Button className="w-full bg-purple-600 hover:bg-purple-700 min-h-[44px]" onClick={handleSecuritySetup}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                সংরক্ষণ করুন
              </Button>
            </div>
          </div>
        )}

        {/* Forgot Password Modal */}
        {showForgotPassword && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
              <div className="text-center">
                <div className="mx-auto w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mb-3">
                  <KeyRound className="h-7 w-7 text-amber-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">পাসওয়ার্ড ভুলে গেছেন?</h2>
              </div>

              {forgotStep === 1 ? (
                <div className="space-y-3">
                  <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                    <p className="text-sm font-medium text-amber-800">নিরাপত্তা প্রশ্ন:</p>
                    <p className="text-sm text-amber-700 mt-1 font-semibold">{SECURITY_QUESTION}</p>
                  </div>
                  <div>
                    <Label>আপনার উত্তর *</Label>
                    <Input placeholder="উত্তর লিখুন" value={forgotAnswer} onChange={(e) => { setForgotAnswer(e.target.value); setForgotError(""); }} className="min-h-[44px] mt-1" onKeyDown={(e) => e.key === "Enter" && handleForgotStep1()} />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-green-600 font-medium text-center">নিরাপত্তা উত্তর সঠিক! নতুন পাসওয়ার্ড দিন।</p>
                  <div>
                    <Label>নতুন পাসওয়ার্ড *</Label>
                    <Input type="password" placeholder="নতুন পাসওয়ার্ড" value={forgotNewPass} onChange={(e) => { setForgotNewPass(e.target.value); setForgotError(""); }} className="min-h-[44px] mt-1" />
                  </div>
                  <div>
                    <Label>পাসওয়ার্ড নিশ্চিত করুন *</Label>
                    <Input type="password" placeholder="আবার পাসওয়ার্ড লিখুন" value={forgotConfirmPass} onChange={(e) => { setForgotConfirmPass(e.target.value); setForgotError(""); }} className="min-h-[44px] mt-1" onKeyDown={(e) => e.key === "Enter" && handleForgotStep2()} />
                  </div>
                </div>
              )}

              {forgotError && <p className="text-sm text-red-600 text-center">{forgotError}</p>}

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 min-h-[44px]" onClick={() => { setShowForgotPassword(false); setForgotStep(1); setForgotAnswer(""); setForgotNewPass(""); setForgotConfirmPass(""); setForgotError(""); }}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> ফিরে যান
                </Button>
                <Button className="flex-1 bg-purple-600 hover:bg-purple-700 min-h-[44px]" onClick={forgotStep === 1 ? handleForgotStep1 : handleForgotStep2}>
                  {forgotStep === 1 ? "যাচাই করুন" : "পরিবর্তন করুন"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Login Card */}
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Warehouse className="h-9 w-9 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">স্টোর রুম ইনভেন্টরি</h1>
              <p className="text-sm text-gray-500">প্রবেশ করতে পাসওয়ার্ড দিন</p>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="পাসওয়ার্ড লিখুন"
                  value={loginPassword}
                  onChange={(e) => { setLoginPassword(e.target.value); setLoginError(""); }}
                  className="pl-10 pr-10 min-h-[50px] text-base"
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  autoFocus
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {loginError && (
                <p className="text-sm text-red-600 text-center font-medium">{loginError}</p>
              )}

              <Button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 min-h-[50px] text-base font-semibold" onClick={handleLogin}>
                <Lock className="h-4 w-4 mr-2" />
                প্রবেশ করুন
              </Button>

              <button
                className="w-full text-sm text-purple-600 hover:text-purple-800 hover:underline font-medium text-center py-1 min-h-[44px]"
                onClick={() => setShowForgotPassword(true)}
              >
                পাসওয়ার্ড ভুলে গেছেন?
              </button>
            </div>

            <p className="text-xs text-gray-400 text-center">
              স্টোর রুম ইনভেন্টরি ম্যানেজমেন্ট সিস্টেম © {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-emerald-50 to-teal-50">
      {/* Header - compact on mobile */}
      <header className="bg-gradient-to-r from-emerald-700 to-teal-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <Warehouse className="h-6 w-6 sm:h-8 sm:w-8" />
              <div>
                <h1 className="text-lg sm:text-2xl font-bold leading-tight">স্টোর রুম ইনভেন্টরি</h1>
                <p className="text-emerald-200 text-xs sm:text-sm hidden xs:inline">বিল্ডিং স্টোর রুম মালামাল ট্র্যাকিং সিস্টেম</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="খুঁজুন..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64 bg-white/10 border-white/20 text-white placeholder:text-emerald-200 focus:bg-white/20"
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="sm:hidden text-white hover:bg-white/20 min-h-[44px] min-w-[44px]"
                onClick={() => setSearchTerm(searchTerm ? "" : " ")}
              >
                <Search className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Search */}
      {searchTerm !== "" && (
        <div className="sm:hidden px-3 pt-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="খুঁজুন..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 min-h-[44px]"
              autoFocus
            />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 mt-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
            <Button variant="ghost" size="sm" className="min-h-[44px] min-w-[44px]" onClick={() => setError("")}>✕</Button>
          </Alert>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 w-full">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-4 gap-1 sm:gap-2 bg-white shadow-sm p-1 overflow-hidden">
            <TabsTrigger value="dashboard" className="flex items-center justify-center gap-1 sm:gap-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white min-h-[44px] text-xs sm:text-sm">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">ড্যাশবোর্ড</span>
              <span className="sm:hidden">ড্যাশ</span>
            </TabsTrigger>
            <TabsTrigger value="incoming" className="flex items-center justify-center gap-1 sm:gap-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white min-h-[44px] text-xs sm:text-sm">
              <PackagePlus className="h-4 w-4" />
              <span className="hidden sm:inline">মালামাল ঢুকছে</span>
              <span className="sm:hidden">ঢুকছে</span>
            </TabsTrigger>
            <TabsTrigger value="consumed" className="flex items-center justify-center gap-1 sm:gap-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white min-h-[44px] text-xs sm:text-sm">
              <PackageX className="h-4 w-4" />
              <span className="hidden sm:inline">নস্ট হচ্ছে</span>
              <span className="sm:hidden">নস্ট</span>
            </TabsTrigger>
            <TabsTrigger value="transferred" className="flex items-center justify-center gap-1 sm:gap-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white min-h-[44px] text-xs sm:text-sm">
              <Truck className="h-4 w-4" />
              <span className="hidden sm:inline">স্থানান্তরিত</span>
              <span className="sm:hidden">স্থানান্তর</span>
            </TabsTrigger>
          </TabsList>

          {/* ==================== DASHBOARD ==================== */}
          <TabsContent value="dashboard" className="space-y-4 sm:space-y-6">
            {dashboardData && (
              <>
                {/* Low Stock Warning */}
                {dashboardData.lowStockItems.length > 0 && (
                  <Card className="bg-red-50 border-red-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-red-700 flex items-center gap-2 text-base sm:text-lg">
                        <AlertTriangle className="h-5 w-5" />
                        কম স্টক সতর্কতা
                      </CardTitle>
                      <CardDescription className="text-red-500 text-sm">নিচের আইটেমগুলোর স্টক নির্ধারিত সীমার নিচে নেমে গেছে</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {dashboardData.lowStockItems.map((item) => (
                          <div key={item.id} className="flex items-center justify-between bg-white rounded-lg p-3 shadow-sm">
                            <div>
                              <p className="font-medium text-gray-800">{item.name}</p>
                              <p className="text-sm text-gray-500">স্টক: {item.stock} {item.unit}</p>
                            </div>
                            <Badge variant={item.stock === 0 ? "destructive" : "secondary"} className={item.stock === 0 ? "" : "bg-orange-100 text-orange-700"}>
                              {item.stock === 0 ? "শেষ" : `${item.stock} ${item.unit}`}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* ==================== INCOMING ==================== */}
          <TabsContent value="incoming" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
                  <PackagePlus className="h-5 w-5 text-blue-600" />
                  মালামাল প্রবেশ রেকর্ড
                </h2>
                <p className="text-sm text-gray-500">স্টোর রুমে নতুন মালামাল আসার হিসাব</p>
              </div>
              <Dialog open={incDialogOpen} onOpenChange={(open) => {
                setIncDialogOpen(open);
                if (!open) { setEditIncId(null); setIncItemId(""); setIncQty(""); setIncSupplier(""); setIncNote(""); }
              }}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700 min-h-[44px]">
                    <Plus className="h-4 w-4 mr-2" />
                    নতুন মালামাল ঢুকান
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[calc(100%-1rem)] sm:max-w-md max-h-[90vh]" style={{ gridTemplateRows: 'auto 1fr auto' }}>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-blue-700">
                      <PackagePlus className="h-5 w-5" />
                      {editIncId ? "মালামাল ঢুকানো সম্পাদনা" : "নতুন মালামাল ঢুকান"}
                    </DialogTitle>
                    <DialogDescription>{editIncId ? "রেকর্ড আপডেট করুন" : "স্টোর রুমে নতুন মালামাল যোগ করুন"}</DialogDescription>
                  </DialogHeader>
                  <div className="overflow-y-auto -mx-1 px-1 py-1 space-y-4">
                      <div>
                        <Label>আইটেম নির্বাচন করুন *</Label>
                        <Select value={incItemId} onValueChange={setIncItemId}>
                          <SelectTrigger className="min-h-[44px]">
                            <SelectValue placeholder="আইটেম নির্বাচন করুন" />
                          </SelectTrigger>
                          <SelectContent>
                            {items.map((item) => (
                              <SelectItem key={item.id} value={item.id}>
                                {item.name} (স্টক: {item.stock} {item.unit})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>পরিমাণ *</Label>
                        <Input type="number" min="1" placeholder="পরিমাণ লিখুন" value={incQty} onChange={(e) => setIncQty(e.target.value)} className="min-h-[44px]" />
                      </div>
                      <div>
                        <Label>তারিখ</Label>
                        <Input type="date" value={incDate} onChange={(e) => setIncDate(e.target.value)} className="min-h-[44px]" />
                      </div>
                      <div>
                        <Label>সরবরাহকারী</Label>
                        <Input placeholder="সরবরাহকারীর নাম (ঐচ্ছিক)" value={incSupplier} onChange={(e) => setIncSupplier(e.target.value)} className="min-h-[44px]" />
                      </div>
                      <div>
                        <Label>নোট</Label>
                        <Textarea placeholder="অতিরিক্ত তথ্য (ঐচ্ছিক)" value={incNote} onChange={(e) => setIncNote(e.target.value)} />
                      </div>
                    </div>
                  <DialogFooter className="pt-2">
                    <Button variant="outline" onClick={() => {
                      setIncDialogOpen(false); setEditIncId(null);
                    }} className="min-h-[44px]">বাতিল</Button>
                    <Button className="bg-blue-600 hover:bg-blue-700 min-h-[44px]" onClick={editIncId ? handleUpdateIncoming : handleAddIncoming}>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      {editIncId ? "আপডেট করুন" : "সংরক্ষণ করুন"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Desktop Table */}
            <Card className="bg-white shadow-sm hidden md:block">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-blue-50">
                        <TableHead className="text-blue-800">ক্রম</TableHead>
                        <TableHead className="text-blue-800">আইটেম নাম</TableHead>
                        <TableHead className="text-blue-800">পরিমাণ</TableHead>
                        <TableHead className="text-blue-800">তারিখ</TableHead>
                        <TableHead className="text-blue-800">সরবরাহকারী</TableHead>
                        <TableHead className="text-blue-800">নোট</TableHead>
                        <TableHead className="text-blue-800 text-right">অ্যাকশন</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredIncoming.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-gray-400">
                            {searchTerm ? "কোনো ফলাফল পাওয়া যায়নি" : "কোনো রেকর্ড নেই। নতুন মালামাল ঢুকাতে উপরের বাটনে ক্লিক করুন।"}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredIncoming.map((record, idx) => (
                          <TableRow key={record.id} className="hover:bg-blue-50/50">
                            <TableCell>{idx + 1}</TableCell>
                            <TableCell className="font-medium">{record.item.name}</TableCell>
                            <TableCell><Badge className="bg-blue-100 text-blue-700">{record.quantity} {record.item.unit}</Badge></TableCell>
                            <TableCell>{formatDate(record.date)}</TableCell>
                            <TableCell>{record.supplier || "-"}</TableCell>
                            <TableCell className="max-w-32 truncate">{record.note || "-"}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="sm" className="text-blue-500 hover:text-blue-700 hover:bg-blue-50" onClick={() => handleEditIncoming(record)}>
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteIncoming(record.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {filteredIncoming.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  {searchTerm ? "কোনো ফলাফল পাওয়া যায়নি" : "কোনো রেকর্ড নেই। নতুন মালামাল ঢুকাতে উপরের বাটনে ক্লিক করুন।"}
                </div>
              ) : (
                filteredIncoming.map((record) => (
                  <div key={record.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 text-base">{record.item.name}</p>
                        <p className="text-sm text-gray-500 mt-1">{formatDate(record.date)}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Badge className="bg-blue-100 text-blue-700 text-sm">{record.quantity} {record.item.unit}</Badge>
                        <Button variant="ghost" size="sm" className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 min-h-[44px] min-w-[44px]" onClick={() => handleEditIncoming(record)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50 min-h-[44px] min-w-[44px]" onClick={() => handleDeleteIncoming(record.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2 space-y-1 text-sm">
                      {record.supplier && (
                        <p className="text-gray-600">
                          <span className="text-gray-400">সরবরাহকারী:</span> {record.supplier}
                        </p>
                      )}
                      {record.note && (
                        <p className="text-gray-600">
                          <span className="text-gray-400">নোট:</span> {record.note}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          {/* ==================== CONSUMED ==================== */}
          <TabsContent value="consumed" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
                  <PackageX className="h-5 w-5 text-red-600" />
                  মালামাল নস্ট রেকর্ড
                </h2>
                <p className="text-sm text-gray-500">স্টোর রুম থেকে নস্ট হওয়া মালামালের হিসাব</p>
              </div>
              <Dialog open={conDialogOpen} onOpenChange={(open) => {
                setConDialogOpen(open);
                if (!open) { setEditConId(null); setConItemId(""); setConQty(""); setConNote(""); }
              }}>
                <DialogTrigger asChild>
                  <Button className="bg-red-600 hover:bg-red-700 min-h-[44px]">
                    <Plus className="h-4 w-4 mr-2" />
                    নস্ট রেকর্ড করুন
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[calc(100%-1rem)] sm:max-w-md max-h-[90vh]" style={{ gridTemplateRows: 'auto 1fr auto' }}>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-700">
                      <PackageX className="h-5 w-5" />
                      {editConId ? "নস্ট রেকর্ড সম্পাদনা" : "নস্ট রেকর্ড করুন"}
                    </DialogTitle>
                    <DialogDescription>{editConId ? "রেকর্ড আপডেট করুন" : "স্টোর রুম থেকে নস্ট হওয়া মালামাল যোগ করুন"}</DialogDescription>
                  </DialogHeader>
                  <div className="overflow-y-auto -mx-1 px-1 py-1 space-y-4">
                      <div>
                        <Label>আইটেম নির্বাচন করুন *</Label>
                        <Select value={conItemId} onValueChange={setConItemId}>
                          <SelectTrigger className="min-h-[44px]">
                            <SelectValue placeholder="আইটেম নির্বাচন করুন" />
                          </SelectTrigger>
                          <SelectContent>
                            {items.filter((i) => i.stock > 0).map((item) => (
                              <SelectItem key={item.id} value={item.id}>
                                {item.name} (স্টক: {item.stock} {item.unit})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>পরিমাণ *</Label>
                        <Input type="number" min="1" placeholder="পরিমাণ লিখুন" value={conQty} onChange={(e) => setConQty(e.target.value)} className="min-h-[44px]" />
                      </div>
                      <div>
                        <Label>তারিখ</Label>
                        <Input type="date" value={conDate} onChange={(e) => setConDate(e.target.value)} className="min-h-[44px]" />
                      </div>
                      <div>
                        <Label>নোট</Label>
                        <Textarea placeholder="কারণ বা অতিরিক্ত তথ্য (ঐচ্ছিক)" value={conNote} onChange={(e) => setConNote(e.target.value)} />
                      </div>
                    </div>
                  <DialogFooter className="pt-2">
                    <Button variant="outline" onClick={() => {
                      setConDialogOpen(false); setEditConId(null);
                    }} className="min-h-[44px]">বাতিল</Button>
                    <Button className="bg-red-600 hover:bg-red-700 min-h-[44px]" onClick={editConId ? handleUpdateConsumed : handleAddConsumed}>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      {editConId ? "আপডেট করুন" : "সংরক্ষণ করুন"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Desktop Table */}
            <Card className="bg-white shadow-sm hidden md:block">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-red-50">
                        <TableHead className="text-red-800">ক্রম</TableHead>
                        <TableHead className="text-red-800">আইটেম নাম</TableHead>
                        <TableHead className="text-red-800">পরিমাণ</TableHead>
                        <TableHead className="text-red-800">তারিখ</TableHead>
                        <TableHead className="text-red-800">নোট</TableHead>
                        <TableHead className="text-red-800 text-right">অ্যাকশন</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredConsumed.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-gray-400">
                            {searchTerm ? "কোনো ফলাফল পাওয়া যায়নি" : "কোনো রেকর্ড নেই। নস্ট রেকর্ড করতে উপরের বাটনে ক্লিক করুন।"}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredConsumed.map((record, idx) => (
                          <TableRow key={record.id} className="hover:bg-red-50/50">
                            <TableCell>{idx + 1}</TableCell>
                            <TableCell className="font-medium">{record.item.name}</TableCell>
                            <TableCell><Badge className="bg-red-100 text-red-700">{record.quantity} {record.item.unit}</Badge></TableCell>
                            <TableCell>{formatDate(record.date)}</TableCell>
                            <TableCell className="max-w-32 truncate">{record.note || "-"}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="sm" className="text-blue-500 hover:text-blue-700 hover:bg-blue-50" onClick={() => handleEditConsumed(record)}>
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteConsumed(record.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {filteredConsumed.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  {searchTerm ? "কোনো ফলাফল পাওয়া যায়নি" : "কোনো রেকর্ড নেই। নস্ট রেকর্ড করতে উপরের বাটনে ক্লিক করুন।"}
                </div>
              ) : (
                filteredConsumed.map((record) => (
                  <div key={record.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 text-base">{record.item.name}</p>
                        <p className="text-sm text-gray-500 mt-1">{formatDate(record.date)}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Badge className="bg-red-100 text-red-700 text-sm">{record.quantity} {record.item.unit}</Badge>
                        <Button variant="ghost" size="sm" className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 min-h-[44px] min-w-[44px]" onClick={() => handleEditConsumed(record)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50 min-h-[44px] min-w-[44px]" onClick={() => handleDeleteConsumed(record.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {record.note && (
                      <p className="mt-2 text-sm text-gray-600">
                        <span className="text-gray-400">নোট:</span> {record.note}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          {/* ==================== TRANSFERRED ==================== */}
          <TabsContent value="transferred" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Truck className="h-5 w-5 text-[#E8272C]" />
                  মালামাল স্থানান্তর রেকর্ড
                </h2>
                <p className="text-sm text-gray-500">স্টোর রুম থেকে অন্য জায়গায় নেওয়া মালামালের হিসাব</p>
              </div>
              <Dialog open={traDialogOpen} onOpenChange={(open) => {
                setTraDialogOpen(open);
                if (!open) { setEditTraId(null); setTraItemId(""); setTraQty(""); setTraTo(""); setTraPurpose(""); setTraReceivedBy(""); setTraNote(""); }
              }}>
                <DialogTrigger asChild>
                  <Button className="bg-[#E8272C] hover:bg-[#C41E22] min-h-[44px]">
                    <Plus className="h-4 w-4 mr-2" />
                    স্থানান্তর রেকর্ড করুন
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[calc(100%-1rem)] sm:max-w-lg max-h-[90vh]" style={{ gridTemplateRows: 'auto 1fr auto' }}>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-[#C41E22]">
                      <Truck className="h-5 w-5" />
                      {editTraId ? "স্থানান্তর রেকর্ড সম্পাদনা" : "মালামাল স্থানান্তর রেকর্ড"}
                    </DialogTitle>
                    <DialogDescription>{editTraId ? "রেকর্ড আপডেট করুন" : "স্টোর রুম থেকে অন্য জায়গায় নেওয়ার রেকর্ড করুন"}</DialogDescription>
                  </DialogHeader>
                  <div className="overflow-y-auto -mx-1 px-1 py-1 space-y-4">
                      <div>
                        <Label>আইটেম নির্বাচন করুন *</Label>
                        <Select value={traItemId} onValueChange={setTraItemId}>
                          <SelectTrigger className="min-h-[44px]">
                            <SelectValue placeholder="আইটেম নির্বাচন করুন" />
                          </SelectTrigger>
                          <SelectContent>
                            {items.filter((i) => i.stock > 0).map((item) => (
                              <SelectItem key={item.id} value={item.id}>
                                {item.name} (স্টক: {item.stock} {item.unit})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>পরিমাণ *</Label>
                        <Input type="number" min="1" placeholder="পরিমাণ লিখুন" value={traQty} onChange={(e) => setTraQty(e.target.value)} className="min-h-[44px]" />
                      </div>
                      <div>
                        <Label>কোথায় নেওয়া হচ্ছে *</Label>
                        <Input placeholder="যেখানে পাঠানো হচ্ছে" value={traTo} onChange={(e) => setTraTo(e.target.value)} className="min-h-[44px]" />
                      </div>
                      <div>
                        <Label>উদ্দেশ্য</Label>
                        <Input placeholder="কী কাজের জন্য (ঐচ্ছিক)" value={traPurpose} onChange={(e) => setTraPurpose(e.target.value)} className="min-h-[44px]" />
                      </div>
                      <div>
                        <Label>কে নিয়ে যাচ্ছে *</Label>
                        <Input placeholder="প্রাপকের নাম" value={traReceivedBy} onChange={(e) => setTraReceivedBy(e.target.value)} className="min-h-[44px]" />
                      </div>
                      <div>
                        <Label>তারিখ</Label>
                        <Input type="date" value={traDate} onChange={(e) => setTraDate(e.target.value)} className="min-h-[44px]" />
                      </div>
                      <div>
                        <Label>নোট</Label>
                        <Textarea placeholder="অতিরিক্ত তথ্য (ঐচ্ছিক)" value={traNote} onChange={(e) => setTraNote(e.target.value)} />
                      </div>
                    </div>
                  <DialogFooter className="pt-2">
                    <Button variant="outline" onClick={() => {
                      setTraDialogOpen(false); setEditTraId(null);
                    }} className="min-h-[44px]">বাতিল</Button>
                    <Button className="bg-[#E8272C] hover:bg-[#C41E22] min-h-[44px]" onClick={editTraId ? handleUpdateTransferred : handleAddTransferred}>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      {editTraId ? "আপডেট করুন" : "সংরক্ষণ করুন"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Desktop Table */}
            <Card className="bg-white shadow-sm hidden md:block">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-[#FEF2F2]">
                        <TableHead className="text-[#A31820]">ক্রম</TableHead>
                        <TableHead className="text-[#A31820]">আইটেম</TableHead>
                        <TableHead className="text-[#A31820]">পরিমাণ</TableHead>
                        <TableHead className="text-[#A31820]">কোথায়</TableHead>
                        <TableHead className="text-[#A31820]">উদ্দেশ্য</TableHead>
                        <TableHead className="text-[#A31820]">কে নিচ্ছে</TableHead>
                        <TableHead className="text-[#A31820]">তারিখ</TableHead>
                        <TableHead className="text-[#A31820] text-right">অ্যাকশন</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransferred.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-gray-400">
                            {searchTerm ? "কোনো ফলাফল পাওয়া যায়নি" : "কোনো রেকর্ড নেই। স্থানান্তর রেকর্ড করতে উপরের বাটনে ক্লিক করুন।"}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredTransferred.map((record, idx) => (
                          <TableRow key={record.id} className="hover:bg-[#FEF2F2]/50">
                            <TableCell>{idx + 1}</TableCell>
                            <TableCell className="font-medium">{record.item.name}</TableCell>
                            <TableCell><Badge className="bg-[#FCE4E5] text-[#C41E22]">{record.quantity} {record.item.unit}</Badge></TableCell>
                            <TableCell>{record.transferredTo}</TableCell>
                            <TableCell className="max-w-24 truncate">{record.purpose || "-"}</TableCell>
                            <TableCell><Badge variant="outline" className="border-[#F09497] text-[#C41E22]">{record.receivedBy}</Badge></TableCell>
                            <TableCell>{formatDate(record.date)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="sm" className="text-blue-500 hover:text-blue-700 hover:bg-blue-50" onClick={() => handleEditTransferred(record)}>
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteTransferred(record.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {filteredTransferred.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  {searchTerm ? "কোনো ফলাফল পাওয়া যায়নি" : "কোনো রেকর্ড নেই। স্থানান্তর রেকর্ড করতে উপরের বাটনে ক্লিক করুন।"}
                </div>
              ) : (
                filteredTransferred.map((record) => (
                  <div key={record.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 text-base">{record.item.name}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <Badge className="bg-[#FCE4E5] text-[#C41E22] text-sm">{record.quantity} {record.item.unit}</Badge>
                          <span className="text-sm text-gray-500">{formatDate(record.date)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button variant="ghost" size="sm" className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 min-h-[44px] min-w-[44px]" onClick={() => handleEditTransferred(record)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 min-h-[44px] min-w-[44px]"
                          onClick={() => handleDeleteTransferred(record.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-3 space-y-1 text-sm">
                      <p className="text-gray-600">
                        <span className="text-gray-400">কোথায়:</span> {record.transferredTo}
                      </p>
                      {record.purpose && (
                        <p className="text-gray-600">
                          <span className="text-gray-400">উদ্দেশ্য:</span> {record.purpose}
                        </p>
                      )}
                      <p className="text-gray-600">
                        <span className="text-gray-400">কে নিচ্ছে:</span> {record.receivedBy}
                      </p>
                      {record.note && (
                        <p className="text-gray-600">
                          <span className="text-gray-400">নোট:</span> {record.note}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* ==================== ITEMS MANAGEMENT ==================== */}
        <div className="mt-8">
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="h-5 w-5 text-emerald-600" />
                    সকল আইটেমের তালিকা
                  </CardTitle>
                  <CardDescription className="text-sm">স্টোর রুমের সকল মালামালের বর্তমান স্টক</CardDescription>
                </div>
                <Dialog open={itemDialogOpen} onOpenChange={(open) => {
                  setItemDialogOpen(open);
                  if (!open) {
                    setEditItemId(null);
                    setItemName("");
                    setItemDesc("");
                    setItemUnit("টি");
                    setItemLowStock("");
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]">
                      <Plus className="h-4 w-4 mr-2" />
                      নতুন আইটেম যোগ করুন
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-[calc(100%-1rem)] sm:max-w-md max-h-[90vh]" style={{ gridTemplateRows: 'auto 1fr auto' }}>
                    <DialogHeader>
                      <DialogTitle>
                        {editItemId ? "আইটেম সম্পাদনা করুন" : "নতুন আইটেম যোগ করুন"}
                      </DialogTitle>
                      <DialogDescription>
                        {editItemId ? "আইটেমের তথ্য আপডেট করুন" : "স্টোর রুমে নতুন আইটেম যোগ করুন"}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="overflow-y-auto -mx-1 px-1 py-1 space-y-4">
                      <div>
                        <Label>আইটেমের নাম *</Label>
                        <Input placeholder="যেমন: সিমেন্ট, ইট, নাট-বল্টু" value={itemName} onChange={(e) => setItemName(e.target.value)} className="min-h-[44px]" />
                      </div>
                      <div>
                        <Label>বিবরণ (ঐচ্ছিক)</Label>
                        <Textarea placeholder="আইটেম সম্পর্কে বিস্তারিত" value={itemDesc} onChange={(e) => setItemDesc(e.target.value)} />
                      </div>
                      <div>
                        <Label>একক</Label>
                        <Select value={itemUnit} onValueChange={setItemUnit}>
                          <SelectTrigger className="min-h-[44px]">
                            <SelectValue placeholder="একক নির্বাচন করুন" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="টি">টি (পিস)</SelectItem>
                            <SelectItem value="কেজি">কেজি</SelectItem>
                            <SelectItem value="ব্যাগ">ব্যাগ</SelectItem>
                            <SelectItem value="লিটার">লিটার</SelectItem>
                            <SelectItem value="মিটার">মিটার</SelectItem>
                            <SelectItem value="ফুট">ফুট</SelectItem>
                            <SelectItem value="গ্যালন">গ্যালন</SelectItem>
                            <SelectItem value="রোল">রোল</SelectItem>
                            <SelectItem value="বক্স">বক্স</SelectItem>
                            <SelectItem value="ডজন">ডজন</SelectItem>
                            <SelectItem value="সেট">সেট</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>কম স্টক সতর্কতা সীমা</Label>
                        <Input type="number" min="0" placeholder="কত থেকে কম হলে সতর্কতা দেখাবে" value={itemLowStock} onChange={(e) => setItemLowStock(e.target.value)} className="min-h-[44px]" />
                        <p className="text-xs text-gray-400 mt-1">ফাঁকা রাখলে কোনো সতর্কতা দেখাবে না</p>
                      </div>
                    </div>
                    <DialogFooter className="pt-2">
                      <Button variant="outline" onClick={() => {
                        setItemDialogOpen(false);
                        setEditItemId(null);
                      }} className="min-h-[44px]">বাতিল</Button>
                      <Button className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]" onClick={editItemId ? handleUpdateItem : handleAddItem}>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        {editItemId ? "আপডেট করুন" : "সংরক্ষণ করুন"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {/* Compact Items List - scrollable with page numbers */}
              <div className="max-h-[350px] overflow-y-auto space-y-1 scrollbar-thin">
                {filteredItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    {searchTerm ? "কোনো ফলাফল পাওয়া যায়নি" : "কোনো আইটেম নেই। নতুন আইটেম যোগ করুন।"}
                  </div>
                ) : (
                  displayItems.map((item, idx) => {
                    const isLowStock = item.lowStockThreshold !== null && item.lowStockThreshold !== undefined && item.stock <= item.lowStockThreshold;
                    const isOutOfStock = item.stock === 0;
                    return (
                      <div key={item.id} className="flex items-center gap-1.5 sm:gap-3 py-2 px-2 sm:px-3 rounded-md hover:bg-emerald-50/50 border-b border-gray-100 last:border-0 text-xs sm:text-sm">
                        <span className="text-gray-400 text-xs w-5 text-center flex-shrink-0">{(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}</span>
                        <span className="font-medium text-gray-800 flex-shrink-0 min-w-0 truncate max-w-[80px] sm:max-w-[180px]" title={item.name}>{item.name}</span>
                        <Badge className={
                          isOutOfStock
                            ? "bg-red-100 text-red-700 text-xs flex-shrink-0"
                            : isLowStock
                              ? "bg-orange-100 text-orange-700 text-xs flex-shrink-0"
                              : "bg-emerald-100 text-emerald-700 text-xs flex-shrink-0"
                        }>
                          স্টক: {item.stock} {item.unit}
                        </Badge>
                        <span className="text-xs text-blue-600 flex-shrink-0 font-medium">ঢুকেছে: {item.totalIncoming}</span>
                        <span className="text-xs text-red-500 flex-shrink-0 font-medium">নস্ট: {item.totalConsumed}</span>
                        <span className="text-xs text-[#E8272C] flex-shrink-0 font-medium">স্থানান্তর: {item.totalTransferred}</span>
                        <div className="flex items-center gap-0.5 ml-auto flex-shrink-0">
                          <Button variant="ghost" size="sm" className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 h-7 w-7 p-0" onClick={() => handleEditItem(item)}>
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 w-7 p-0" onClick={() => handleDeleteItem(item.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              {/* Page Number Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-1 pt-3 pb-1">
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-xs" disabled={currentPage <= 1} onClick={() => setItemPage(p => p - 1)}>&laquo;</Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <Button key={page} variant={currentPage === page ? "default" : "outline"} size="sm" className={"h-8 w-8 p-0 text-xs " + (currentPage === page ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "")} onClick={() => { setItemPage(page); }}>
                      {page}
                    </Button>
                  ))}
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-xs" disabled={currentPage >= totalPages} onClick={() => setItemPage(p => p + 1)}>&raquo;</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <footer className="mt-8 pb-4 text-center text-xs sm:text-sm text-gray-400">
          স্টোর রুম ইনভেন্টরি ম্যানেজমেন্ট সিস্টেম © {new Date().getFullYear()}
        </footer>
      </main>
    </div>
  );
}
