import { createContext, useContext, useState, ReactNode } from "react";

export type Room = { id: string; name: string; capacity: number };
export type TimeSlot = { id: string; name: string; start: string; end: string };
export type Teacher = { id: string; name: string; phone: string; specialization: string; email?: string };
export type Student = { id: string; name: string; parentName: string; parentPhone: string; dob?: string };
export type ScheduleCell = { slotId: string; day: number }; // day: 1..7
export type ClassEntity = {
  id: string;
  name: string;
  teacherId: string;
  roomId: string;
  studentIds: string[];
  schedule: ScheduleCell[];
  feePerMonth: number;
};
export type Invoice = {
  id: string;
  studentId: string;
  classId: string;
  period: string;
  amountDue: number;
  amountPaid: number;
  status: "paid" | "unpaid" | "partial";
};

export const DAYS = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ Nhật"];

const initialRooms: Room[] = [
  { id: "r1", name: "Phòng A101", capacity: 20 },
  { id: "r2", name: "Phòng A102", capacity: 25 },
  { id: "r3", name: "Phòng B201", capacity: 15 },
  { id: "r4", name: "Phòng Lab", capacity: 12 },
];
const initialSlots: TimeSlot[] = [
  { id: "s1", name: "Ca 1", start: "07:30", end: "09:00" },
  { id: "s2", name: "Ca 2", start: "09:15", end: "10:45" },
  { id: "s3", name: "Ca 3", start: "14:00", end: "15:30" },
  { id: "s4", name: "Ca 4", start: "15:45", end: "17:15" },
  { id: "s5", name: "Ca 5", start: "17:30", end: "19:00" },
  { id: "s6", name: "Ca 6", start: "19:15", end: "20:45" },
];
const initialTeachers: Teacher[] = [
  { id: "t1", name: "Nguyễn Thị Lan", phone: "0901234567", specialization: "Toán học", email: "lan.nt@edu.vn" },
  { id: "t2", name: "Trần Văn Minh", phone: "0912345678", specialization: "Vật lý", email: "minh.tv@edu.vn" },
  { id: "t3", name: "Lê Hoàng Anh", phone: "0923456789", specialization: "Tiếng Anh", email: "anh.lh@edu.vn" },
  { id: "t4", name: "Phạm Thu Hà", phone: "0934567890", specialization: "Hóa học", email: "ha.pt@edu.vn" },
  { id: "t5", name: "Vũ Đức Thắng", phone: "0945678901", specialization: "Ngữ văn", email: "thang.vd@edu.vn" },
];
const initialStudents: Student[] = [
  { id: "st1", name: "Đỗ Minh Khôi", parentName: "Đỗ Văn Hùng", parentPhone: "0981111222", dob: "2010-05-12" },
  { id: "st2", name: "Nguyễn Bảo Châu", parentName: "Nguyễn Thị Mai", parentPhone: "0982222333", dob: "2009-08-21" },
  { id: "st3", name: "Trần Gia Bảo", parentName: "Trần Văn Nam", parentPhone: "0983333444", dob: "2011-02-03" },
  { id: "st4", name: "Lê Thảo Nguyên", parentName: "Lê Thị Hoa", parentPhone: "0984444555", dob: "2010-11-30" },
  { id: "st5", name: "Phan Quốc Huy", parentName: "Phan Văn Tài", parentPhone: "0985555666", dob: "2009-04-17" },
  { id: "st6", name: "Hoàng Diệu Linh", parentName: "Hoàng Văn Đức", parentPhone: "0986666777", dob: "2010-07-09" },
  { id: "st7", name: "Bùi Anh Tuấn", parentName: "Bùi Thị Lan", parentPhone: "0987777888", dob: "2011-01-25" },
  { id: "st8", name: "Ngô Thùy Dương", parentName: "Ngô Văn Sơn", parentPhone: "0988888999", dob: "2010-09-14" },
];
const initialClasses: ClassEntity[] = [
  {
    id: "c1", name: "Toán 9 Nâng Cao", teacherId: "t1", roomId: "r1",
    studentIds: ["st1", "st2", "st3", "st4"],
    schedule: [{ slotId: "s3", day: 1 }, { slotId: "s3", day: 3 }, { slotId: "s3", day: 5 }],
    feePerMonth: 1500000,
  },
  {
    id: "c2", name: "Tiếng Anh Giao Tiếp", teacherId: "t3", roomId: "r2",
    studentIds: ["st2", "st5", "st6", "st7", "st8"],
    schedule: [{ slotId: "s5", day: 2 }, { slotId: "s5", day: 4 }],
    feePerMonth: 1200000,
  },
  {
    id: "c3", name: "Vật Lý 11", teacherId: "t2", roomId: "r3",
    studentIds: ["st1", "st5", "st8"],
    schedule: [{ slotId: "s4", day: 2 }, { slotId: "s4", day: 6 }],
    feePerMonth: 1400000,
  },
  {
    id: "c4", name: "Hóa Học Cơ Bản", teacherId: "t4", roomId: "r4",
    studentIds: ["st3", "st4", "st6"],
    schedule: [{ slotId: "s2", day: 7 }],
    feePerMonth: 1000000,
  },
];
const initialInvoices: Invoice[] = [
  { id: "i1", studentId: "st1", classId: "c1", period: "11/2025", amountDue: 1500000, amountPaid: 1500000, status: "paid" },
  { id: "i2", studentId: "st2", classId: "c1", period: "11/2025", amountDue: 1500000, amountPaid: 0, status: "unpaid" },
  { id: "i3", studentId: "st3", classId: "c1", period: "11/2025", amountDue: 1500000, amountPaid: 800000, status: "partial" },
  { id: "i4", studentId: "st4", classId: "c1", period: "11/2025", amountDue: 1500000, amountPaid: 1500000, status: "paid" },
  { id: "i5", studentId: "st2", classId: "c2", period: "11/2025", amountDue: 1200000, amountPaid: 0, status: "unpaid" },
  { id: "i6", studentId: "st5", classId: "c2", period: "11/2025", amountDue: 1200000, amountPaid: 1200000, status: "paid" },
  { id: "i7", studentId: "st6", classId: "c2", period: "11/2025", amountDue: 1200000, amountPaid: 0, status: "unpaid" },
  { id: "i8", studentId: "st1", classId: "c3", period: "11/2025", amountDue: 1400000, amountPaid: 1400000, status: "paid" },
  { id: "i9", studentId: "st5", classId: "c3", period: "11/2025", amountDue: 1400000, amountPaid: 700000, status: "partial" },
  { id: "i10", studentId: "st3", classId: "c4", period: "11/2025", amountDue: 1000000, amountPaid: 0, status: "unpaid" },
];

type Store = {
  rooms: Room[]; setRooms: (r: Room[]) => void;
  slots: TimeSlot[]; setSlots: (s: TimeSlot[]) => void;
  teachers: Teacher[]; setTeachers: (t: Teacher[]) => void;
  students: Student[]; setStudents: (s: Student[]) => void;
  classes: ClassEntity[]; setClasses: (c: ClassEntity[]) => void;
  invoices: Invoice[]; setInvoices: (i: Invoice[]) => void;
};

const StoreCtx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [rooms, setRooms] = useState(initialRooms);
  const [slots, setSlots] = useState(initialSlots);
  const [teachers, setTeachers] = useState(initialTeachers);
  const [students, setStudents] = useState(initialStudents);
  const [classes, setClasses] = useState(initialClasses);
  const [invoices, setInvoices] = useState(initialInvoices);
  return (
    <StoreCtx.Provider value={{ rooms, setRooms, slots, setSlots, teachers, setTeachers, students, setStudents, classes, setClasses, invoices, setInvoices }}>
      {children}
    </StoreCtx.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore must be inside StoreProvider");
  return ctx;
}

export const formatVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);

export const uid = () => Math.random().toString(36).slice(2, 10);