'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import {
    collection, query, getDocs, addDoc, deleteDoc, doc, updateDoc, serverTimestamp, Timestamp, setDoc, getDoc
} from 'firebase/firestore';
import { format, differenceInCalendarDays, addMonths, addYears } from 'date-fns';
import {
    ArrowLeft, Plus, Trash2, Loader2, Wallet, AlertTriangle, Check, Calendar, IndianRupee, RotateCcw, X
} from 'lucide-react';

interface Expense {
    id: string;
    name: string;
    amount: number;
    frequency: 'monthly' | 'quarterly' | 'semi-annual' | 'annual' | 'biennial' | 'triennial';
    nextDueDate: Date;
    lastPaidDate: Date | null;
    isPaid: boolean;
    createdAt: Date;
}

const FREQUENCY_LABELS: Record<string, string> = {
    monthly: 'Monthly',
    quarterly: 'Every 3 Months',
    'semi-annual': 'Every 6 Months',
    annual: 'Yearly',
    biennial: 'Every 2 Years',
    triennial: 'Every 3 Years',
};

function getNextDueDate(currentDue: Date, frequency: string): Date {
    switch (frequency) {
        case 'monthly': return addMonths(currentDue, 1);
        case 'quarterly': return addMonths(currentDue, 3);
        case 'semi-annual': return addMonths(currentDue, 6);
        case 'annual': return addYears(currentDue, 1);
        case 'biennial': return addYears(currentDue, 2);
        case 'triennial': return addYears(currentDue, 3);
        default: return addYears(currentDue, 1);
    }
}

function getAlertLevel(dueDate: Date, isPaid: boolean): 'red' | 'yellow' | null {
    if (isPaid) return null;
    const daysUntil = differenceInCalendarDays(dueDate, new Date());
    if (daysUntil <= 3) return 'red';
    if (daysUntil <= 15) return 'yellow';
    return null;
}

const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

export default function ArambhExpensesPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form state
    const [formName, setFormName] = useState('');
    const [formAmount, setFormAmount] = useState('');
    const [formFrequency, setFormFrequency] = useState<string>('annual');
    const [formDueDate, setFormDueDate] = useState('');

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login?redirect=/admin/expenses');
            return;
        }
        if (!authLoading && user && user.role !== 'admin') {
            router.push('/');
            return;
        }

        async function fetchExpenses() {
            if (!user) return;
            try {
                const q = query(collection(db, 'arambh_expenses'));
                const snap = await getDocs(q);
                const fetched = snap.docs.map(d => ({
                    id: d.id,
                    ...d.data(),
                    nextDueDate: d.data().nextDueDate?.toDate() || new Date(),
                    lastPaidDate: d.data().lastPaidDate?.toDate() || null,
                    createdAt: d.data().createdAt?.toDate() || new Date(),
                })) as Expense[];
                fetched.sort((a, b) => a.nextDueDate.getTime() - b.nextDueDate.getTime());
                setExpenses(fetched);
            } catch (error) {
                console.error('Error fetching expenses:', error);
            } finally {
                setLoading(false);
            }
        }

        if (user) fetchExpenses();
    }, [user, authLoading, router]);

    const handleAddExpense = async () => {
        if (!formName.trim() || !formAmount || !formDueDate) {
            alert('Please fill all fields.');
            return;
        }

        setSaving(true);
        try {
            const expenseData = {
                name: formName.trim(),
                amount: parseFloat(formAmount),
                frequency: formFrequency,
                nextDueDate: Timestamp.fromDate(new Date(formDueDate)),
                lastPaidDate: null,
                isPaid: false,
                createdAt: serverTimestamp(),
            };

            const docRef = await addDoc(collection(db, 'arambh_expenses'), expenseData);

            const newExpense: Expense = {
                id: docRef.id,
                name: formName.trim(),
                amount: parseFloat(formAmount),
                frequency: formFrequency as Expense['frequency'],
                nextDueDate: new Date(formDueDate),
                lastPaidDate: null,
                isPaid: false,
                createdAt: new Date(),
            };

            setExpenses(prev => [...prev, newExpense].sort((a, b) => a.nextDueDate.getTime() - b.nextDueDate.getTime()));
            setFormName('');
            setFormAmount('');
            setFormFrequency('annual');
            setFormDueDate('');
            setShowForm(false);
        } catch (error) {
            console.error('Error adding expense:', error);
            alert('Failed to add expense.');
        } finally {
            setSaving(false);
        }
    };

    const handleMarkPaid = async (expense: Expense) => {
        try {
            const nextDue = getNextDueDate(expense.nextDueDate, expense.frequency);
            await updateDoc(doc(db, 'arambh_expenses', expense.id), {
                isPaid: false, // Reset for next cycle
                lastPaidDate: serverTimestamp(),
                nextDueDate: Timestamp.fromDate(nextDue),
            });

            setExpenses(prev =>
                prev.map(e =>
                    e.id === expense.id
                        ? { ...e, isPaid: false, lastPaidDate: new Date(), nextDueDate: nextDue }
                        : e
                ).sort((a, b) => a.nextDueDate.getTime() - b.nextDueDate.getTime())
            );
        } catch (error) {
            console.error('Error marking as paid:', error);
            alert('Failed to mark as paid.');
        }
    };

    const handleDeleteExpense = async (id: string) => {
        if (!confirm('Are you sure you want to delete this expense entry?')) return;
        try {
            await deleteDoc(doc(db, 'arambh_expenses', id));
            setExpenses(prev => prev.filter(e => e.id !== id));
        } catch (error) {
            console.error('Error deleting expense:', error);
            alert('Failed to delete expense.');
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--warm-50)]">
                <Loader2 className="w-8 h-8 text-[var(--primary-500)] animate-spin" />
            </div>
        );
    }

    if (!user || user.role !== 'admin') return null;

    return (
        <div className="min-h-screen flex flex-col">
            <main className="flex-1 py-24 px-4 bg-gradient-to-b from-[var(--warm-100)] to-[var(--warm-50)]">
                <div className="max-w-4xl mx-auto">
                    <motion.div initial="hidden" animate="visible" variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } }}>

                        {/* Header */}
                        <motion.div variants={fadeInUp} className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <Link href="/admin/dashboard" className="p-2 hover:bg-white rounded-full transition-colors">
                                    <ArrowLeft className="w-5 h-5 text-[var(--neutral-600)]" />
                                </Link>
                                <div>
                                    <h1 className="font-serif text-3xl text-[var(--primary-700)] flex items-center gap-3">
                                        <Wallet className="w-7 h-7" />
                                        Arambh Expenses
                                    </h1>
                                    <p className="text-sm text-[var(--neutral-500)] mt-1">Track recurring business expenses and payments</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowForm(!showForm)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-[var(--primary-600)] text-white rounded-xl hover:bg-[var(--primary-700)] transition-colors text-sm font-medium shadow-sm"
                            >
                                {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                {showForm ? 'Cancel' : 'Add Expense'}
                            </button>
                        </motion.div>

                        {/* Add Expense Form */}
                        {showForm && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-white rounded-xl p-6 shadow-sm border border-[var(--neutral-200)] mb-8"
                            >
                                <h3 className="text-lg font-serif text-[var(--primary-700)] mb-4">New Expense</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--neutral-700)] mb-1">Expense Name / Payee</label>
                                        <input
                                            type="text"
                                            value={formName}
                                            onChange={e => setFormName(e.target.value)}
                                            placeholder="e.g., Website Hosting - Rahul"
                                            className="w-full px-3 py-2.5 border border-[var(--neutral-200)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary-400)] text-sm bg-[var(--neutral-50)]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--neutral-700)] mb-1">Amount (₹)</label>
                                        <input
                                            type="number"
                                            value={formAmount}
                                            onChange={e => setFormAmount(e.target.value)}
                                            placeholder="e.g., 2400"
                                            className="w-full px-3 py-2.5 border border-[var(--neutral-200)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary-400)] text-sm bg-[var(--neutral-50)]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--neutral-700)] mb-1">Frequency</label>
                                        <select
                                            value={formFrequency}
                                            onChange={e => setFormFrequency(e.target.value)}
                                            className="w-full px-3 py-2.5 border border-[var(--neutral-200)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary-400)] text-sm bg-[var(--neutral-50)]"
                                        >
                                            {Object.entries(FREQUENCY_LABELS).map(([val, label]) => (
                                                <option key={val} value={val}>{label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--neutral-700)] mb-1">Next Due Date</label>
                                        <input
                                            type="date"
                                            value={formDueDate}
                                            onChange={e => setFormDueDate(e.target.value)}
                                            className="w-full px-3 py-2.5 border border-[var(--neutral-200)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary-400)] text-sm bg-[var(--neutral-50)]"
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={handleAddExpense}
                                    disabled={saving}
                                    className="mt-4 w-full md:w-auto px-6 py-2.5 bg-[var(--primary-600)] text-white rounded-lg hover:bg-[var(--primary-700)] disabled:opacity-50 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                    {saving ? 'Adding...' : 'Add Expense'}
                                </button>
                            </motion.div>
                        )}

                        {/* Expense List */}
                        <motion.div variants={fadeInUp} className="space-y-4">
                            {expenses.length === 0 ? (
                                <div className="text-center py-16 bg-white rounded-xl border border-dashed border-[var(--neutral-200)]">
                                    <Wallet className="w-12 h-12 mx-auto text-[var(--neutral-300)] mb-3" />
                                    <p className="text-[var(--neutral-500)]">No expenses added yet.</p>
                                    <p className="text-sm text-[var(--neutral-400)] mt-1">Click "Add Expense" to start tracking payments.</p>
                                </div>
                            ) : (
                                expenses.map((expense) => {
                                    const alert = getAlertLevel(expense.nextDueDate, expense.isPaid);
                                    const daysUntil = differenceInCalendarDays(expense.nextDueDate, new Date());
                                    const isOverdue = daysUntil < 0;

                                    return (
                                        <div
                                            key={expense.id}
                                            className={`bg-white rounded-xl p-5 shadow-sm border-l-4 transition-all hover:shadow-md ${alert === 'red'
                                                ? 'border-l-red-500 ring-1 ring-red-100'
                                                : alert === 'yellow'
                                                    ? 'border-l-yellow-500 ring-1 ring-yellow-100'
                                                    : 'border-l-green-400'
                                                }`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        {/* Alert indicator */}
                                                        {alert === 'red' && (
                                                            <span className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center text-white animate-pulse" title="Due very soon!">
                                                                <AlertTriangle className="w-4 h-4" />
                                                            </span>
                                                        )}
                                                        {alert === 'yellow' && (
                                                            <span className="w-7 h-7 rounded-full bg-yellow-400 flex items-center justify-center text-black" title="Due soon">
                                                                <AlertTriangle className="w-4 h-4" />
                                                            </span>
                                                        )}
                                                        {!alert && (
                                                            <span className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                                                <Check className="w-4 h-4" />
                                                            </span>
                                                        )}

                                                        <h3 className="text-base font-semibold text-[var(--neutral-900)]">{expense.name}</h3>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 ml-10">
                                                        <div className="flex items-center gap-1.5 text-sm">
                                                            <IndianRupee className="w-3.5 h-3.5 text-[var(--neutral-400)]" />
                                                            <span className="font-semibold text-[var(--primary-700)]">₹{expense.amount.toLocaleString()}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-sm text-[var(--neutral-500)]">
                                                            <RotateCcw className="w-3.5 h-3.5" />
                                                            {FREQUENCY_LABELS[expense.frequency] || expense.frequency}
                                                        </div>
                                                        <div className={`flex items-center gap-1.5 text-sm font-medium ${alert === 'red' ? 'text-red-600' : alert === 'yellow' ? 'text-yellow-600' : 'text-[var(--neutral-500)]'
                                                            }`}>
                                                            <Calendar className="w-3.5 h-3.5" />
                                                            {isOverdue
                                                                ? `Overdue by ${Math.abs(daysUntil)} day${Math.abs(daysUntil) !== 1 ? 's' : ''}`
                                                                : daysUntil === 0
                                                                    ? 'Due today!'
                                                                    : `Due in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`
                                                            }
                                                            <span className="text-[var(--neutral-400)] font-normal">
                                                                ({format(expense.nextDueDate, 'MMM d, yyyy')})
                                                            </span>
                                                        </div>
                                                        {expense.lastPaidDate && (
                                                            <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                                                Last paid: {format(expense.lastPaidDate, 'MMM d, yyyy')}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 ml-4 shrink-0">
                                                    <button
                                                        onClick={() => handleMarkPaid(expense)}
                                                        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors border border-green-200"
                                                        title="Mark as paid & advance to next cycle"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                        Paid
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteExpense(expense.id)}
                                                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete expense"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </motion.div>

                        {/* Revenue Reset Section */}
                        <motion.div variants={fadeInUp} className="mt-10 bg-white rounded-xl p-5 shadow-sm border border-[var(--neutral-200)]">
                            <h3 className="text-sm font-medium text-[var(--neutral-900)] mb-2">Revenue Reset</h3>
                            <p className="text-xs text-[var(--neutral-500)] mb-3">
                                Reset the revenue counter so all dashboards start counting earnings from today onward. Old bookings will be excluded from revenue calculations.
                            </p>
                            <button
                                onClick={async () => {
                                    if (!confirm('Are you sure? This will reset all revenue counters to ₹0 starting from today.')) return;
                                    try {
                                        const today = new Date();
                                        today.setHours(0, 0, 0, 0);
                                        await setDoc(doc(db, 'settings', 'revenue'), {
                                            startDate: Timestamp.fromDate(today),
                                            setAt: serverTimestamp(),
                                            description: 'Revenue calculations will ignore bookings before this date'
                                        }, { merge: true });
                                        alert('Revenue reset! All dashboards will now show ₹0 for bookings before today.');
                                    } catch (error) {
                                        console.error('Error resetting revenue:', error);
                                        alert('Failed to reset revenue.');
                                    }
                                }}
                                className="px-4 py-2 text-sm font-medium bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors border border-red-200"
                            >
                                Reset Revenue from Today
                            </button>
                        </motion.div>

                    </motion.div>
                </div>
            </main>
        </div>
    );
}
