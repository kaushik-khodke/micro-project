'use client';

import { useState, useEffect } from 'react';
import {
  Search, Filter, MoreVertical, Plus, Trash2, Edit2, Users,
  UserPlus, ChevronRight, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { patientService, Patient } from '@/services/patients';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";


export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPatient, setNewPatient] = useState({
    name: '',
    age: '',
    gender: 'Male',
    mrn: '',
    contact_info: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [mounted, setMounted] = useState(false);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const data = await patientService.getPatients();
      setPatients(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch patients');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPatient = async () => {
    try {
      setSubmitting(true);
      if (editingPatient) {
        await patientService.updatePatient(editingPatient.id.toString(), {
          ...newPatient,
          age: parseInt(newPatient.age) || 0
        });
        toast.success("Patient updated successfully");
      } else {
        await patientService.createPatient({
          ...newPatient,
          age: parseInt(newPatient.age) || 0
        });
        toast.success("Patient registered successfully");
      }
      setIsModalOpen(false);
      setEditingPatient(null);
      setNewPatient({ name: '', age: '', gender: 'Male', mrn: '', contact_info: '' });
      fetchPatients();
    } catch (err: any) {
      toast.error(err.message || "Failed to save patient");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePatient = async (id: string | number) => {
    if (!window.confirm("Are you sure you want to delete this patient record?")) return;
    
    try {
      await patientService.deletePatient(id.toString());
      toast.success("Patient record deleted");
      fetchPatients();
    } catch (err: any) {
      toast.error("Failed to delete patient");
    }
  };

  const startEdit = (patient: Patient) => {
    setEditingPatient(patient);
    setNewPatient({
      name: patient.name,
      age: patient.age.toString(),
      gender: patient.gender || 'Male',
      mrn: patient.mrn,
      contact_info: patient.contact_info || ''
    });
    setIsModalOpen(true);
  };

  useEffect(() => {
    setMounted(true);
    fetchPatients();
  }, []);

  if (!mounted) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'In Queue':
        return 'bg-amber-500/10 text-amber-600 border border-amber-500/20';
      case 'Waiting':
        return 'bg-muted text-muted-foreground border border-border';
      case 'Treated':
        return 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20';
      case 'Discharged':
        return 'bg-primary/10 text-primary border border-primary/20';
      default:
        return 'bg-muted/50 text-muted-foreground border border-border';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-destructive/10 text-destructive border border-destructive/20';
      case 'Normal':
        return 'bg-primary/10 text-primary border border-primary/20';
      case 'Low':
        return 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20';
      default:
        return 'bg-muted/50 text-muted-foreground border border-border';
    }
  };

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = 
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.mrn.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'All' || (patient.status || 'Waiting') === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="px-8 py-6">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-10 border-b border-border pb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Users size={20} className="text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-foreground tracking-tight">Patient Registry</h1>
              <p className="text-[13px] text-muted-foreground font-medium tracking-tight">Centralised management of clinical identities and study logs</p>
            </div>
          </div>
          
          <Dialog open={isModalOpen} onOpenChange={(open) => {
            setIsModalOpen(open);
            if (!open) {
              setEditingPatient(null);
              setNewPatient({ name: '', age: '', gender: 'Male', mrn: '', contact_info: '' });
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg h-10 px-6 font-bold shadow-sm gap-2">
                <Plus size={16} />
                Register Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px] rounded-xl border-border bg-card">
              <DialogHeader>
                <DialogTitle className="text-lg font-black tracking-tight text-foreground">
                  {editingPatient ? 'Update Identity Log' : 'Nodal Registry Sequence'}
                </DialogTitle>
                <p className="text-[11px] text-muted-foreground uppercase tracking-[0.1em] font-medium border-l border-primary/30 pl-2">Medical record synchronisation node alpha</p>
              </DialogHeader>
              <div className="grid gap-6 py-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Legal Surname & Given Name</Label>
                  <Input id="name" value={newPatient.name} onChange={(e) => setNewPatient({...newPatient, name: e.target.value})} className="rounded-lg h-11 border-border bg-muted/30 focus:border-primary/40 focus:ring-primary/20" placeholder="e.g. JOHNATHAN SMITH" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="age" className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Age</Label>
                    <Input id="age" type="number" value={newPatient.age} onChange={(e) => setNewPatient({...newPatient, age: e.target.value})} className="rounded-lg h-11 border-border bg-muted/30 focus:border-primary/40 focus:ring-primary/20" placeholder="00" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender" className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Bios / Gender</Label>
                    <select
                      id="gender"
                      value={newPatient.gender}
                      onChange={(e) => setNewPatient({...newPatient, gender: e.target.value})}
                      className="w-full h-11 px-3 rounded-lg border border-border bg-muted/30 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 text-sm font-medium"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mrn" className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Medical Record Number (MRN)</Label>
                  <Input id="mrn" placeholder="MRN-XXXX-XX" value={newPatient.mrn} onChange={(e) => setNewPatient({...newPatient, mrn: e.target.value})} className="rounded-lg h-11 border-border bg-muted/30 focus:border-primary/40 focus:ring-primary/20" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact" className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Communication Channel</Label>
                  <Input id="contact" placeholder="Secure phone or encrypted email" value={newPatient.contact_info} onChange={(e) => setNewPatient({...newPatient, contact_info: e.target.value})} className="rounded-lg h-11 border-border bg-muted/30 focus:border-primary/40 focus:ring-primary/20" />
                </div>
              </div>
              <DialogFooter className="gap-3 border-t border-border pt-6">
                <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="rounded-lg text-[10px] h-10 font-bold uppercase tracking-widest hover:bg-muted text-muted-foreground">Abort</Button>
                <Button onClick={handleAddPatient} disabled={submitting} className="rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 h-10">
                  {submitting ? 'PROCESSING...' : editingPatient ? 'UPDATE LOG' : 'COMMIT REGISTRY'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4 mb-8">
          <div className="flex-1 relative group">
            <Search size={14} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Query registry by identity or MRN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-lg border border-border bg-muted/20 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary/40 transition-all text-[13px] font-medium"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2.5 rounded-lg h-[46px] px-6 border-border bg-card font-bold text-[11px] uppercase tracking-widest hover:bg-muted transition-colors">
                <Filter size={12} className="text-muted-foreground" />
                {filterStatus === 'All' ? 'ALL STATUS' : filterStatus}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-lg border-border bg-card">
              <DropdownMenuItem onClick={() => setFilterStatus('All')} className="cursor-pointer text-[10px] font-bold uppercase tracking-widest">Global Overview</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setFilterStatus('In Queue')} className="cursor-pointer text-[10px] font-bold uppercase tracking-widest">Active Triaging</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus('Waiting')} className="cursor-pointer text-[10px] font-bold uppercase tracking-widest">Awaiting Analysis</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus('Treated')} className="cursor-pointer text-[10px] font-bold uppercase tracking-widest">Post-Procedure</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus('Discharged')} className="cursor-pointer text-[10px] font-bold uppercase tracking-widest">Released / Inactive</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Patient Count */}
        <div className="flex items-center justify-between mb-4 border-l-2 border-primary/50 pl-4 py-0.5">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] leading-none">
            {filteredPatients.length} Identity Object{filteredPatients.length !== 1 ? 's' : ''} in View
          </span>
        </div>

        {/* Patients Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted/30 border-b border-border">
                  <th className="px-6 py-5 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                    Subject Profile
                  </th>
                  <th className="px-6 py-5 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                    Biological Age
                  </th>
                  <th className="px-6 py-5 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                    Identifier (MRN)
                  </th>
                  <th className="px-6 py-5 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                    Triage State
                  </th>
                  <th className="px-6 py-5 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                    Risk Priority
                  </th>
                  <th className="px-6 py-5 text-right text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                    Operations
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredPatients.map((patient, index) => (
                  <tr
                    key={patient.id}
                    className="hover:bg-muted/10 transition-colors animate-fade-in group"
                    style={{ animationDelay: `${index * 40}ms` }}
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center`}>
                          <span className="text-[11px] font-black text-primary leading-none tracking-tight">{getInitials(patient.name)}</span>
                        </div>
                        <div>
                          <p className="text-[13px] font-bold text-foreground tracking-tight leading-none mb-1">{patient.name}</p>
                          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest opacity-60">{patient.gender || 'UNDEFINED'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-[13px] font-bold text-foreground/80">{patient.age}</span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase bg-muted/50 px-2 py-0.5 rounded border border-border">{patient.mrn}</span>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${getStatusBadge(patient.status || 'Waiting')}`}>
                        {patient.status || 'Waiting'}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${getPriorityBadge(patient.priority || 'Normal')}`}>
                        {patient.priority || 'Normal'}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted text-muted-foreground h-8 w-8">
                            <MoreVertical size={14} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52 rounded-lg border-border bg-card">
                          <DropdownMenuItem className="cursor-pointer flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-widest" onClick={() => startEdit(patient)}>
                            <Edit2 size={12} />
                            Modify Entry
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="cursor-pointer flex items-center gap-2.5 text-destructive focus:text-destructive focus:bg-destructive/10 text-[11px] font-bold uppercase tracking-widest"
                            onClick={() => handleDeletePatient(patient.id)}
                          >
                            <Trash2 size={12} />
                            Purge Registry
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
                {filteredPatients.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-24 text-center">
                      <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-muted/30 border border-border flex items-center justify-center">
                        <Users size={28} className="text-muted-foreground/20" />
                      </div>
                      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Zero Identities Authenticated</p>
                      <p className="text-[10px] text-muted-foreground/40 mt-2 font-medium">Verify search logic or update subject registry database</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
