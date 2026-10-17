'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import {
  getCurrentUser,
  getAllStaff,
  addStaffMember,
  updateStaffMember,
  deleteStaffMember,
} from '@/lib/storage';
import { UserProfile } from '@/lib/types';
import {
  Users2,
  UserPlus,
  Phone,
  Mail,
  Clock,
  Briefcase,
  KeyRound,
  Trash2,
  Edit2,
  CheckCircle2,
  X,
  ArrowLeft,
  ShieldCheck,
  Search,
  Copy,
} from 'lucide-react';
import Link from 'next/link';

export default function StaffManagementPage() {
  const router = useRouter();
  const [staffList, setStaffList] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<UserProfile | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [designation, setDesignation] = useState('');
  const [shiftStart, setShiftStart] = useState('09:00');
  const [shiftEnd, setShiftEnd] = useState('18:00');
  const [pin, setPin] = useState('1234');
  const [formError, setFormError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const user = getCurrentUser();
    if (!user || user.role !== 'admin') {
      router.replace('/login');
      return;
    }
    const data = await getAllStaff();
    setStaffList(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [router]);

  const openAddModal = () => {
    setEditingStaff(null);
    setFullName('');
    setPhone('');
    setEmail('');
    setDesignation('');
    setShiftStart('09:00');
    setShiftEnd('18:00');
    setPin('1234');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (staff: UserProfile) => {
    setEditingStaff(staff);
    setFullName(staff.full_name);
    setPhone(staff.phone || '');
    setEmail(staff.email || '');
    setDesignation(staff.designation || '');
    setShiftStart(staff.shift_start || '09:00');
    setShiftEnd(staff.shift_end || '18:00');
    setPin(staff.pin || '1234');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!fullName.trim()) {
      setFormError('Please enter the employee full name.');
      return;
    }
    if (!phone.trim()) {
      setFormError('Please enter a valid mobile number for staff login.');
      return;
    }

    try {
      if (editingStaff) {
        await updateStaffMember({
          ...editingStaff,
          full_name: fullName.trim(),
          phone: phone.trim(),
          email: email.trim().toLowerCase(),
          designation: designation.trim() || 'Staff',
          shift_start: shiftStart,
          shift_end: shiftEnd,
          pin: pin.trim() || '1234',
        });
      } else {
        await addStaffMember({
          full_name: fullName.trim(),
          phone: phone.trim(),
          email: email.trim().toLowerCase() || `${phone.trim()}@company.com`,
          role: 'staff',
          designation: designation.trim() || 'Staff',
          shift_start: shiftStart,
          shift_end: shiftEnd,
          pin: pin.trim() || '1234',
        });
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save staff member.');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from the staff directory?`)) return;
    await deleteStaffMember(id);
    await loadData();
  };

  const handleCopyCredentials = (staff: UserProfile) => {
    const text = `WorkPulse Attendance Login:\nPhone: ${staff.phone}\nPIN: ${staff.pin || '1234'}\nLink: ${window.location.origin}/login`;
    navigator.clipboard.writeText(text);
    setCopiedId(staff.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const filteredStaff = staffList.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      s.full_name.toLowerCase().includes(q) ||
      (s.phone && s.phone.includes(q)) ||
      (s.email && s.email.toLowerCase().includes(q)) ||
      (s.designation && s.designation.toLowerCase().includes(q))
    );
  });

  return (
    <>
      <Navbar />

      <main className="flex-1 w-full max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Header & Add Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Daily Monitor
            </Link>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <Users2 className="w-6 h-6 text-blue-400" />
              Staff Directory & Registrations
            </h1>
            <p className="text-xs text-slate-400">
              Add employees so they can log in via their phone number or email to punch in.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New Staff</span>
          </button>
        </div>

        {/* Search Bar & Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, phone, email, or role..."
              className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div className="text-xs text-slate-400">
            Total Registered: <strong className="text-white">{staffList.length}</strong> (Active)
          </div>
        </div>

        {/* Staff Cards List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredStaff.map((staff) => (
            <div
              key={staff.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-xl space-y-3 relative hover:border-slate-700 transition"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    {staff.full_name}
                    {staff.role === 'admin' && (
                      <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
                        Admin
                      </span>
                    )}
                  </h3>
                  <span className="text-[11px] text-blue-400 font-medium">
                    {staff.designation || 'Staff'}
                  </span>
                </div>

                {staff.role !== 'admin' && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(staff)}
                      title="Edit Profile"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(staff.id, staff.full_name)}
                      title="Remove Staff"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Contact & Shift Info */}
              <div className="space-y-1.5 text-xs text-slate-300 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="font-mono text-white font-semibold">{staff.phone || 'No phone'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="truncate text-slate-400">{staff.email || 'No email'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>
                    Shift: <strong>{staff.shift_start}</strong> to <strong>{staff.shift_end || '18:00'}</strong>
                  </span>
                </div>
              </div>

              {/* Login Credentials Share Card */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px]">
                <span className="text-slate-400 flex items-center gap-1">
                  <KeyRound className="w-3 h-3 text-slate-500" />
                  PIN: <strong className="text-slate-200 font-mono">{staff.pin || '1234'}</strong>
                </span>

                <button
                  onClick={() => handleCopyCredentials(staff)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-blue-400 hover:text-blue-300"
                >
                  <Copy className="w-3 h-3" />
                  {copiedId === staff.id ? 'Copied!' : 'Share Login'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Add / Edit Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4 bg-slate-950">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-blue-400" />
                {editingStaff ? 'Edit Staff Profile' : 'Register New Staff Member'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveStaff} className="p-5 space-y-4">
              {formError && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-300">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Employee Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Mobile Number * (For Login)
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Login PIN (4-Digits)
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="1234"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="staff@company.com"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Designation / Title
                  </label>
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="e.g. Sales Officer"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Shift Hours */}
              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                    Shift Start Time
                  </label>
                  <input
                    type="time"
                    required
                    value={shiftStart}
                    onChange={(e) => setShiftStart(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                    Shift End Time
                  </label>
                  <input
                    type="time"
                    required
                    value={shiftEnd}
                    onChange={(e) => setShiftEnd(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-800 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-750"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500"
                >
                  {editingStaff ? 'Update Profile' : 'Save & Register Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
