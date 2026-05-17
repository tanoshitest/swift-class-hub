import { createContext, useContext, useState, ReactNode } from "react";

export type Room = { id: string; name: string; capacity: number };
export type TimeSlot = { id: string; name: string; start: string; end: string };
export type Teacher = { id: string; name: string; phone: string; specialization: string; email?: string };
export type Student = { id: string; name: string; parentName: string; parentPhone: string; dob?: string };
export type ScheduleCell = { slotId: string; day: number }; // day: 1..7

export type FeeConfig = {
  id: string;
  name: string;
  courseFee: number; // Học phí theo khóa (vd: 10.000.000 VNĐ)
  monthFee: number;  // Học phí theo tháng (vd: 1.500.000 VNĐ)
};

export type ClassEntity = {
  id: string;
  name: string;
  teacherId: string;
  roomId: string;
  studentIds: string[];
  schedule: ScheduleCell[];
  feePerMonth: number;
  feeConfigId?: string; // Assigned fee configuration
  studentBillings?: { studentId: string; billingMethod: "course" | "month" }[];
  tuitionType?: "course" | "month";
  startDate?: string;
  totalSessions?: number;
  endDate?: string;
};

export type Invoice = {
  id: string;
  studentId: string;
  classId: string;
  billingMethod: "course" | "month";
  period: string; // Kỳ thu phí
  previousDebt: number; // Nợ kỳ trước
  currentAmount: number; // Số tiền kỳ này
  amountDue: number; // Tổng phải thu = Nợ kỳ trước + Số tiền kỳ này
  amountPaid: number; // Đã thu
  status: "paid" | "unpaid" | "partial"; // Trạng thái
};

export const DAYS = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ Nhật"];

export function calculateEndDate(startDateStr: string, totalSessions: number, schedule: { day: number }[]): string {
  if (!startDateStr || !totalSessions || schedule.length === 0) return "";
  
  let currentDate = new Date(startDateStr);
  if (isNaN(currentDate.getTime())) return "";

  const scheduleDays = schedule.map(s => s.day); // 1 = Monday, 7 = Sunday
  
  let sessionsCount = 0;
  let safetyLimit = 0;
  
  while (sessionsCount < totalSessions && safetyLimit < 1000) {
    safetyLimit++;
    
    let jsDay = currentDate.getDay();
    let ourDay = jsDay === 0 ? 7 : jsDay;

    if (scheduleDays.includes(ourDay)) {
      sessionsCount++;
      if (sessionsCount === totalSessions) {
        break;
      }
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const yyyy = currentDate.getFullYear();
  const mm = String(currentDate.getMonth() + 1).padStart(2, "0");
  const dd = String(currentDate.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

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
  { id: "t1", name: "Nguyễn Thị Lan", phone: "0901234567", specialization: "Cambridge English", email: "lan.nt@edu.vn" },
  { id: "t2", name: "Trần Văn Minh", phone: "0912345678", specialization: "IELTS Academic", email: "minh.tv@edu.vn" },
  { id: "t3", name: "Lê Hoàng Anh", phone: "0923456789", specialization: "Tiếng Anh Giao Tiếp", email: "anh.lh@edu.vn" },
  { id: "t4", name: "Phạm Thu Hà", phone: "0934567890", specialization: "SAT & TOEFL Prep", email: "ha.pt@edu.vn" },
  { id: "t5", name: "Vũ Đức Thắng", phone: "0945678901", specialization: "English Literature", email: "thang.vd@edu.vn" },
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

const initialFeeConfigs: FeeConfig[] = [
  { id: "fc1", name: "Cấu hình Độ tuổi 4 - 6 tuổi", courseFee: 10000000, monthFee: 1500000 },
  { id: "fc2", name: "Cấu hình Độ tuổi 7 - 11 tuổi", courseFee: 12000000, monthFee: 1800000 },
  { id: "fc3", name: "Cấu hình Độ tuổi 12 - 15 tuổi", courseFee: 8000000, monthFee: 1200000 },
];

const initialClasses: ClassEntity[] = [
  {
    id: "c1", name: "Tiếng Anh Cambridge Stage 9", teacherId: "t1", roomId: "r1",
    studentIds: ["st1", "st2", "st3", "st4"],
    schedule: [{ slotId: "s3", day: 1 }, { slotId: "s3", day: 3 }, { slotId: "s3", day: 5 }],
    feePerMonth: 1500000,
    feeConfigId: "fc1",
    studentBillings: [
      { studentId: "st1", billingMethod: "course" },
      { studentId: "st2", billingMethod: "month" },
      { studentId: "st3", billingMethod: "month" },
      { studentId: "st4", billingMethod: "month" },
    ],
    tuitionType: "month",
    startDate: "2026-05-18",
    totalSessions: 30,
    endDate: "2026-07-24"
  },
  {
    id: "c2", name: "Tiếng Anh Giao Tiếp Quốc Tế", teacherId: "t3", roomId: "r2",
    studentIds: ["st2", "st5", "st6", "st7", "st8"],
    schedule: [{ slotId: "s5", day: 2 }, { slotId: "s5", day: 4 }],
    feePerMonth: 1200000,
    feeConfigId: "fc1",
    studentBillings: [
      { studentId: "st2", billingMethod: "course" },
      { studentId: "st5", billingMethod: "course" },
      { studentId: "st6", billingMethod: "course" },
      { studentId: "st7", billingMethod: "course" },
      { studentId: "st8", billingMethod: "course" },
    ],
    tuitionType: "course",
    startDate: "2026-05-18",
    totalSessions: 30,
    endDate: "2026-08-27"
  },
  {
    id: "c3", name: "Tiếng Anh IELTS Academic Masterclass", teacherId: "t2", roomId: "r3",
    studentIds: ["st1", "st5", "st8"],
    schedule: [{ slotId: "s4", day: 2 }, { slotId: "s4", day: 6 }],
    feePerMonth: 1400000,
    feeConfigId: "fc2",
    studentBillings: [
      { studentId: "st1", billingMethod: "course" },
      { studentId: "st5", billingMethod: "course" },
      { studentId: "st8", billingMethod: "course" },
    ],
    tuitionType: "course",
    startDate: "2026-05-18",
    totalSessions: 30,
    endDate: "2026-08-29"
  },
  {
    id: "c4", name: "Tiếng Anh SAT Prep & Vocabulary", teacherId: "t4", roomId: "r4",
    studentIds: ["st3", "st4", "st6"],
    schedule: [{ slotId: "s2", day: 7 }],
    feePerMonth: 1000000,
    feeConfigId: "fc3",
    studentBillings: [
      { studentId: "st3", billingMethod: "month" },
      { studentId: "st4", billingMethod: "month" },
      { studentId: "st6", billingMethod: "month" },
    ],
    tuitionType: "month",
    startDate: "2026-05-18",
    totalSessions: 30,
    endDate: "2026-12-13"
  },
];

const initialInvoices: Invoice[] = [
  // Mock Data 1 (Theo khóa): Học viên A (st1 - Đỗ Minh Khôi), Hình thức "Theo khóa", Nợ kỳ trước: 0, Số tiền kỳ này: 10.000.000. Tổng phải thu: 10.000.000. Trạng thái: Đã thanh toán
  {
    id: "i_c1",
    studentId: "st1",
    classId: "c1",
    billingMethod: "course",
    period: "Khóa Hè 2026",
    previousDebt: 0,
    currentAmount: 10000000,
    amountDue: 10000000,
    amountPaid: 10000000,
    status: "paid"
  },
  // Mock Data 2 (Theo khóa): Học viên B (st5 - Phạm Hải Nam), Hình thức "Theo khóa", Nợ kỳ trước: 0, Số tiền kỳ này: 10.000.000. Tổng phải thu: 10.000.000. Trạng thái: Chưa thanh toán
  {
    id: "i_c2",
    studentId: "st5",
    classId: "c2",
    billingMethod: "course",
    period: "Khóa Hè 2026",
    previousDebt: 0,
    currentAmount: 10000000,
    amountDue: 10000000,
    amountPaid: 0,
    status: "unpaid"
  },
  // Mock Data 3 (Theo tháng - Tháng đầu tiên): Học viên C (st2 - Nguyễn Bảo Châu), Hình thức "Theo tháng", Kỳ thu phí: "Tháng 5/2026", Nợ kỳ trước: 0, Số tiền kỳ này: 1.500.000. Trạng thái: Chưa thanh toán.
  {
    id: "i_m1",
    studentId: "st2",
    classId: "c1",
    billingMethod: "month",
    period: "Tháng 5/2026",
    previousDebt: 0,
    currentAmount: 1500000,
    amountDue: 1500000,
    amountPaid: 0,
    status: "unpaid"
  },
  // Mock Data 4 (Theo tháng - Cộng dồn nợ): Học viên C (st2 - Nguyễn Bảo Châu), Hình thức "Theo tháng", Kỳ thu phí: "Tháng 6/2026", Nợ kỳ trước: 1.500.000 (từ tháng 5), Số tiền kỳ này: 1.500.000. Tổng phải thu: 3.000.000. Trạng thái: Chưa thanh toán.
  {
    id: "i_m2",
    studentId: "st2",
    classId: "c1",
    billingMethod: "month",
    period: "Tháng 6/2026",
    previousDebt: 1500000,
    currentAmount: 1500000,
    amountDue: 3000000,
    amountPaid: 0,
    status: "unpaid"
  }
];

type Store = {
  rooms: Room[]; setRooms: (r: Room[]) => void;
  slots: TimeSlot[]; setSlots: (s: TimeSlot[]) => void;
  teachers: Teacher[]; setTeachers: (t: Teacher[]) => void;
  students: Student[]; setStudents: (s: Student[]) => void;
  classes: ClassEntity[]; setClasses: (c: ClassEntity[]) => void;
  invoices: Invoice[]; setInvoices: (i: Invoice[]) => void;
  feeConfigs: FeeConfig[]; setFeeConfigs: (f: FeeConfig[]) => void;
};

const StoreCtx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [rooms, setRooms] = useState(initialRooms);
  const [slots, setSlots] = useState(initialSlots);
  const [teachers, setTeachers] = useState(initialTeachers);
  const [students, setStudents] = useState(initialStudents);
  const [classes, setClasses] = useState(initialClasses);
  const [invoices, setInvoices] = useState(initialInvoices);
  const [feeConfigs, setFeeConfigs] = useState(initialFeeConfigs);
  return (
    <StoreCtx.Provider value={{
      rooms, setRooms,
      slots, setSlots,
      teachers, setTeachers,
      students, setStudents,
      classes, setClasses,
      invoices, setInvoices,
      feeConfigs, setFeeConfigs
    }}>
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

// ─── Session / Lesson types ───────────────────────────────────────────────────
export type Attendance = "present" | "absent" | "late";

export type StudentSessionRecord = {
  studentId: string;
  attendance: Attendance;
  classScore: number | null;
  homeworkScore: number | null;
  comment: string;
};

export type LessonSession = {
  id: string;          // e.g. "c1_s1"
  classId: string;
  sessionNo: number;   // Buổi 1, 2, 3…
  date: string;        // "DD/MM/YYYY"
  topic: string;
  objectives: string[];
  activities: string[];
  materials: string[];
  homework: string;
  records: StudentSessionRecord[];
};

// ─── Mock sessions ────────────────────────────────────────────────────────────
// ─── Session Generator ────────────────────────────────────────────────────────
const generate30Sessions = (classId: string, studentIds: string[]): LessonSession[] => {
  const list: LessonSession[] = [];
  const cambridgeTopics = [
    { topic: "Narrative Writing: Designing sensory openings and tension", book: "Cambridge IGCSE Coursebook p. 12-18", obj: "sensory language, setting atmosphere, spatial organization" },
    { topic: "Persuasive Techniques: AFOREST & Rhetoric in Speeches", book: "Cambridge IGCSE Coursebook p. 24-31", obj: "rhetorical devices, Churchill speech analysis, persuasive pitching" },
    { topic: "Analytical Essays: Mastering the PEEL Structure", book: "Cambridge Coursebook p. 45-52", obj: "PEEL structure, Lord of the Flies text integration, character analysis" },
    { topic: "Descriptive Writing: Crafting Atmospheric Settings", book: "IGCSE Coursebook p. 60-65", obj: "sensory language, setting atmosphere, spatial organization" },
    { topic: "Narrative Voice: First vs. Third Person Perspectives", book: "IGCSE Coursebook p. 66-72", obj: "narrator bias, character perspective, narrative distance" },
    { topic: "Argumentative Writing: Structuring Balanced Debates", book: "IGCSE Coursebook p. 73-80", obj: "counter-arguments, signposting transitions, logical coherence" },
    { topic: "Information Retrieval: Active Reading & Synthesis", book: "IGCSE Coursebook p. 81-88", obj: "paraphrasing source texts, combining information, bullet outline" },
    { topic: "Comparing Texts: Analyzing Style and Purpose", book: "IGCSE Coursebook p. 89-95", obj: "comparative vocabulary, tone deconstruction, target audience" },
    { topic: "The Art of Rhetoric: Rhetorical Questions & Emotive Appeal", book: "IGCSE Coursebook p. 96-102", obj: "pathos appeal, parallel structures, powerful vocabulary" },
    { topic: "Poetry Analysis: Deciphering Metaphors & Imagery", book: "IGCSE Coursebook p. 103-110", obj: "stanza structure, thematic motifs, symbolic decoding" },
    { topic: "Drama Analysis: Character Conflicts & Stage Directions", book: "IGCSE Coursebook p. 111-118", obj: "dialogue subtext, dramatic irony, character development" },
    { topic: "IELTS Reading: Matching Headings and Summaries", book: "IELTS Prep Suite p. 120-126", obj: "main paragraph ideas, key synonyms, paragraph matching" },
    { topic: "IELTS Reading: True/False/Not Given Mastery", book: "IELTS Prep Suite p. 127-133", obj: "factual verification, absolute qualifiers, scanning techniques" },
    { topic: "IELTS Listening: Understanding Conversational Details", book: "IELTS Prep Suite p. 134-140", obj: "spelling names, identifying numbers, maps labelling" },
    { topic: "IELTS Listening: Navigating Multiple Choice Distractors", book: "IELTS Prep Suite p. 141-148", obj: "distractor recognition, speed vocabulary processing" },
    { topic: "Academic Writing Task 1: Describing Trends & Charts", book: "IELTS Prep Suite p. 149-155", obj: "percentage vocabulary, upward/downward verbs, overview paragraphs" },
    { topic: "Academic Writing Task 2: Expressing Direct Opinions", book: "IELTS Prep Suite p. 156-162", obj: "thesis statements, supporting evidence, standard essay layout" },
    { topic: "Speaking Part 1: Fluency, Coherence & Quick Answers", book: "IELTS Prep Suite p. 163-170", obj: "idiomatic expressions, natural intonation, descriptive templates" },
    { topic: "Speaking Part 2: Structuring the 2-Minute Long Turn", book: "IELTS Prep Suite p. 171-178", obj: "sequencing transitions, robust adjectives, timing pacing" }
  ];

  for (let i = 1; i <= 30; i++) {
    const topicData = cambridgeTopics[(i - 1) % cambridgeTopics.length];
    
    const dateObj = new Date(2025, 4, 6);
    dateObj.setDate(dateObj.getDate() + (i - 1) * 2);
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    const dateStr = `${day}/${month}/${year}`;

    const records: StudentSessionRecord[] = studentIds.map((sid, idx) => {
      const classScore = 7.0 + ((i + idx * 7) % 31) / 10;
      const homeworkScore = 6.5 + ((i * 3 + idx * 4) % 36) / 10;
      const isAbsent = (i + idx * 11) % 25 === 0;
      const isLate = (i * 2 + idx * 13) % 23 === 0;
      const attendance: Attendance = isAbsent ? "absent" : isLate ? "late" : "present";

      const comments = [
        "Demonstrated a strong grasp of the core concepts, engaged actively.",
        "Excellent vocabulary acquisition, writing is highly structured.",
        "Followed instructions well, though spelling needs revision.",
        "Outstanding performance in analytical questions, very proactive.",
        "Spoke with confidence, but watch out for subject-verb agreement.",
        "Well-reasoned paragraph outline, needs to expand the final summary."
      ];
      const comment = attendance === "absent"
        ? "Vắng có phép - cần xem lại video bài giảng và hoàn thành bài tập."
        : comments[(i + idx) % comments.length];

      return {
        studentId: sid,
        attendance,
        classScore: attendance === "absent" ? null : parseFloat(classScore.toFixed(1)),
        homeworkScore: attendance === "absent" ? null : parseFloat(homeworkScore.toFixed(1)),
        comment
      };
    });

    list.push({
      id: `${classId}_s${i}`,
      classId,
      sessionNo: i,
      date: dateStr,
      topic: i <= 3 && classId === "c1" 
        ? (i === 1 ? "Narrative Writing: Designing sensory openings and tension" : i === 2 ? "Persuasive Techniques: AFOREST & Rhetoric in Speeches" : "Analytical Essays: Mastering the PEEL Structure")
        : topicData.topic,
      objectives: [
        `Understand and apply the primary principles of ${topicData.obj.split(', ')[0]}`,
        `Demonstrate active use of ${topicData.obj.split(', ')[1]} in core exercises`,
        `Familiarize with IGCSE/IELTS standards for ${topicData.obj.split(', ')[2]}`
      ],
      activities: [
        `Direct visual warm-up and active review task (15 mins)`,
        `Explicit lesson delivery on topic: ${topicData.topic} (20 mins)`,
        `Guided workbook text analysis of ${topicData.book} (20 mins)`,
        `Individual drafting and timed skill application (30 mins)`,
        `Peer review feedback and standard self-grading (15 mins)`
      ],
      materials: [
        `Cambridge Standard Handout: ${topicData.topic}`,
        `Lesson slides and student worksheet packet`,
        `Activity extracts from ${topicData.book}`
      ],
      homework: `Complete practice exercise sheet 3 & 4 of ${topicData.book}; compile weekly vocabulary list.`,
      records
    });
  }
  return list;
};

export const initialSessions: LessonSession[] = [
  ...generate30Sessions("c1", ["st1", "st2", "st3", "st4"]),
  ...generate30Sessions("c2", ["st2", "st5", "st6", "st7", "st8"])
];