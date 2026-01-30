import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";

function AdminCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("created"); // created | priceAsc | priceDesc | title
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    instructor: "",
    image: "",
  });
  const [videoUploading, setVideoUploading] = useState({});
  const [videoProgress, setVideoProgress] = useState({});
  const [preTest, setPreTest] = useState([]);
  const [postTest, setPostTest] = useState([]);

  // === ไอคอนเล็ก ๆ ใช้ซ้ำ ===
  const Chevron = ({ open = false }) => (
    <svg
      className={`w-4 h-4 transition-transform duration-200 ${
        open ? "rotate-180" : ""
      }`}
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 011.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
  const BookIcon = () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 5a2 2 0 012-2h12.5A2.5 2.5 0 0120 5.5V19a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM7 6h9v2H7V6zm0 4h9v2H7v-2zm0 4h6v2H7v-2z" />
    </svg>
  );
  const TestIcon = () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M5 4h14a1 1 0 011 1v14l-4-3-4 3-4-3-4 3V5a1 1 0 011-1z" />
    </svg>
  );
  const GridIcon = () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z" />
    </svg>
  );

  const Pill = ({ children }) => (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-700 ring-1 ring-indigo-100">
      {children}
    </span>
  );

  // === เปิด/ปิดแผงต่าง ๆ ===
  const [panelOpen, setPanelOpen] = useState({
    basic: true,
    pre: false,
    post: false,
    curriculum: true,
  });
  const [sectionOpen, setSectionOpen] = useState({});
  const togglePanel = (key) => setPanelOpen((p) => ({ ...p, [key]: !p[key] }));
  const toggleSection = (si) => setSectionOpen((p) => ({ ...p, [si]: !p[si] }));

  // === ฟังก์ชันจัดการแบบทดสอบ ===
  const emptyQ = () => ({
    prompt: "",
    choices: ["", "", "", ""],
    correctIndex: 0,
    explanation: "",
  });
  const addQ = (which) =>
    which === "pre"
      ? setPreTest((prev) => [...prev, emptyQ()])
      : setPostTest((prev) => [...prev, emptyQ()]);
  const removeQ = (which, qi) =>
    which === "pre"
      ? setPreTest((prev) => prev.filter((_, i) => i !== qi))
      : setPostTest((prev) => prev.filter((_, i) => i !== qi));
  const updateQ = (which, qi, key, val) => {
    const upd = (arr) =>
      arr.map((q, i) => (i === qi ? { ...q, [key]: val } : q));
    which === "pre"
      ? setPreTest((prev) => upd(prev))
      : setPostTest((prev) => upd(prev));
  };
  const updateChoice = (which, qi, ci, val) => {
    const upd = (arr) =>
      arr.map((q, i) => {
        if (i !== qi) return q;
        const choices = [...q.choices];
        choices[ci] = val;
        return { ...q, choices };
      });
    which === "pre"
      ? setPreTest((prev) => upd(prev))
      : setPostTest((prev) => upd(prev));
  };

  // === หลักสูตร (sections/lessons) ===
  const [curriculum, setCurriculum] = useState([{ title: "", lessons: [] }]);
  const addSection = () =>
    setCurriculum((prev) => [...prev, { title: "", lessons: [] }]);
  const removeSection = (si) =>
    setCurriculum((prev) => prev.filter((_, i) => i !== si));
  const updateSectionTitle = (si, value) =>
    setCurriculum((prev) =>
      prev.map((s, i) => (i === si ? { ...s, title: value } : s))
    );
  const addLesson = (si) =>
    setCurriculum((prev) =>
      prev.map((s, i) =>
        i === si
          ? {
              ...s,
              lessons: [
                ...s.lessons,
                { title: "", duration: 0, videoUrl: "", freePreview: false },
              ],
            }
          : s
      )
    );
  const removeLesson = (si, li) =>
    setCurriculum((prev) =>
      prev.map((s, i) =>
        i === si ? { ...s, lessons: s.lessons.filter((_, j) => j !== li) } : s
      )
    );
  const updateLesson = (si, li, key, value) =>
    setCurriculum((prev) =>
      prev.map((s, i) =>
        i === si
          ? {
              ...s,
              lessons: s.lessons.map((l, j) =>
                j === li ? { ...l, [key]: value } : l
              ),
            }
          : s
      )
    );

  // === อัปโหลดวิดีโอสำหรับบทเรียน ===
  const uploadLessonVideo = async (si, li, file) => {
    if (!file) return;
    const key = `${si}-${li}`;
    try {
      setVideoUploading((prev) => ({ ...prev, [key]: true }));
      setVideoProgress((prev) => ({ ...prev, [key]: 0 }));
      const fd = new FormData();
      fd.append("video", file);
      const res = await axios.post(
        "http://localhost:5000/api/upload/video",
        fd,
        {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (e) => {
            if (!e.total) return;
            const p = Math.round((e.loaded * 100) / e.total);
            setVideoProgress((prev) => ({ ...prev, [key]: p }));
          },
        }
      );
      updateLesson(si, li, "videoUrl", res.data.videoUrl);
    } catch (err) {
      console.error(err);
      alert("อัปโหลดวิดีโอไม่สำเร็จ");
    } finally {
      setVideoUploading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const token = localStorage.getItem("adminToken");
  const navigate = useNavigate();

  // ---------------- Fetch ----------------
  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/courses");
      setCourses(res.data || []);
    } catch (e) {
      console.error(e);
      alert("โหลดคอร์สไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- Helpers ----------------
  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      price: "",
      instructor: "",
      image: "",
    });
    setEditingId(null);
    setImageFile(null);
    setPreview("");
    setCurriculum([{ title: "", lessons: [] }]);
    setPreTest([]);
    setPostTest([]);
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  // โหลดข้อมูลคอร์สตัวเต็มจาก backend ก่อนค่อยเปิด dialog
  const openEdit = async (c) => {
    try {
      // ดึงข้อมูลคอร์สรวม curriculum / preTest / postTest
      const res = await axios.get(`http://localhost:5000/api/courses/${c._id}`);
      const full = res.data || {};

      // set ฟอร์มพื้นฐาน
      setForm({
        title: full.title || "",
        description: full.description || "",
        price: full.price ?? "",
        instructor: full.instructor || "",
        image: full.image || "",
      });

      // preview รูป
      setPreview(full.image ? `http://localhost:5000${full.image}` : "");

      // id ที่กำลังแก้ไข
      setEditingId(full._id);

      // curriculum จาก backend (ถ้าไม่มีให้สร้างหัวข้อเปล่า 1 อัน)
      setCurriculum(
        Array.isArray(full.curriculum) && full.curriculum.length
          ? full.curriculum
          : [{ title: "", lessons: [] }]
      );

      // แบบทดสอบ
      setPreTest(Array.isArray(full.preTest) ? full.preTest : []);
      setPostTest(Array.isArray(full.postTest) ? full.postTest : []);

      // เปิด dialog
      setDialogOpen(true);
    } catch (err) {
      console.error(err);
      alert("โหลดข้อมูลคอร์สไม่สำเร็จ");
    }
  };

  const onSelectImage = (file) => {
    setImageFile(file || null);
    if (file) setPreview(URL.createObjectURL(file));
    else setPreview("");
  };

  // ---------------- Submit (create/update) ----------------
  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.price || !form.instructor) {
      alert("กรอกข้อมูลให้ครบ: ชื่อคอร์ส ราคา ผู้สอน");
      return;
    }
    setSubmitting(true);
    try {
      let imageUrl = form.image;
      if (imageFile) {
        const fd = new FormData();
        fd.append("image", imageFile);
        const up = await axios.post("http://localhost:5000/api/upload", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        imageUrl = up.data.imageUrl;
      }
      const payload = {
        ...form,
        price: Number(form.price) || 0,
        image: imageUrl,
        curriculum,
        preTest,
        postTest,
      };
      const config = { headers: { Authorization: `Bearer ${token}` } };
      if (editingId) {
        await axios.put(
          `http://localhost:5000/api/courses/${editingId}`,
          payload,
          config
        );
      } else {
        await axios.post("http://localhost:5000/api/courses", payload, config);
      }
      await fetchCourses();
      setDialogOpen(false);
      resetForm();
    } catch (e) {
      console.error(e);
      if (!token) {
        alert("กรุณาเข้าสู่ระบบแอดมิน");
        navigate("/admin/login");
      } else {
        alert("บันทึกไม่สำเร็จ");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ---------------- Delete ----------------
  const onDelete = async (id) => {
    if (!confirm("ยืนยันการลบคอร์สนี้?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/courses/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCourses((prev) => prev.filter((c) => c._id !== id));
    } catch (e) {
      console.error(e);
      alert("ลบไม่สำเร็จ");
    }
  };

  // ---------------- Derived (search/sort) ----------------
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = !q
      ? [...courses]
      : courses.filter((c) =>
          [c.title, c.instructor, c.description].some((t) =>
            (t || "").toLowerCase().includes(q)
          )
        );
    switch (sortBy) {
      case "priceAsc":
        list.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case "priceDesc":
        list.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case "title":
        list.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
        break;
      default:
        break; // created: คงลำดับเดิมจากเซิร์ฟเวอร์
    }
    return list;
  }, [courses, search, sortBy]);

  return (
    <DashboardLayout title="Manage Courses">
      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full gap-3 sm:w-auto">
          <div className="relative w-full sm:w-80">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหา: ชื่อคอร์ส / ผู้สอน / รายละเอียด"
              className="w-full rounded-xl border bg-white px-3 py-2 pr-8 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 opacity-60">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle
                  cx="11"
                  cy="11"
                  r="7"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M20 20l-3-3"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-xl border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
          >
            <option value="created">เรียง: ล่าสุด</option>
            <option value="title">เรียง: ชื่อ (A→Z)</option>
            <option value="priceAsc">เรียง: ราคา (น้อย→มาก)</option>
            <option value="priceDesc">เรียง: ราคา (มาก→น้อย)</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <p className="text-sm text-gray-500">
            ทั้งหมด {filtered.length} คอร์ส
          </p>
          <button
            onClick={openCreate}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700"
          >
            + เพิ่มคอร์ส
          </button>
        </div>
      </div>

      {/* Grid */}
      <section className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {loading ? (
          <div className="col-span-full rounded-2xl bg-white p-6 text-sm shadow-sm">
            กำลังโหลด...
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full rounded-2xl bg-white p-6 text-sm shadow-sm">
            ไม่พบคอร์ส
          </div>
        ) : (
          filtered.map((c) => (
            <article
              key={c._id}
              className="group overflow-hidden rounded-2xl bg-white shadow-sm transition hover:shadow-md"
            >
              <div className="relative">
                <img
                  src={
                    c.image
                      ? `http://localhost:5000${c.image}`
                      : "https://placehold.co/600x360"
                  }
                  alt={c.title}
                  className="h-40 w-full object-cover"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              <div className="p-4">
                <h3 className="line-clamp-2 text-base font-semibold">
                  {c.title}
                </h3>
                <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                  {c.description}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">ผู้สอน</p>
                    <p className="text-sm font-medium">{c.instructor || "-"}</p>
                  </div>
                  <p className="text-lg font-semibold">
                    {(c.price || 0).toLocaleString()} ฿
                  </p>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => openEdit(c)}
                    className="flex-1 rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
                  >
                    แก้ไข
                  </button>
                  <button
                    onClick={() => onDelete(c._id)}
                    className="flex-1 rounded-lg bg-red-500 px-3 py-1.5 text-sm text-white hover:bg-red-600"
                  >
                    ลบ
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </section>

      {/* Dialog ฟอร์มคอร์ส */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-2 md:p-6 bg-black/50 backdrop-blur-sm">
          <div className="w-full md:max-w-4xl bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl ring-1 ring-black/5 flex flex-col max-h-[92vh] overflow-hidden">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-white to-indigo-50/60 border-b border-gray-200/70 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 grid place-items-center rounded-xl bg-indigo-600 text-white shadow">
                  <BookIcon />
                </div>
                <h3 className="text-lg md:text-xl font-semibold tracking-tight">
                  {editingId ? "แก้ไขคอร์ส" : "เพิ่มคอร์ส"}
                </h3>
              </div>
              <button
                onClick={() => setDialogOpen(false)}
                className="inline-flex items-center justify-center h-9 w-9 rounded-xl border bg-white hover:bg-gray-50 active:scale-[.98] transition text-gray-700 shadow-sm"
                aria-label="ปิด"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto px-4 md:px-6 py-5 space-y-5">
              <form onSubmit={onSubmit} className="space-y-5">
                {/* ===== กล่อง: ข้อมูลพื้นฐานคอร์ส ===== */}
                <div className="rounded-2xl border border-gray-200/70 bg-white shadow-sm overflow-hidden">
                  <button
                    type="button"
                    onClick={() => togglePanel("basic")}
                    className="w-full flex items-center justify-between gap-3 px-4 md:px-5 py-3.5 bg-white/60 hover:bg-white transition"
                  >
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <span className="text-gray-800">ข้อมูลพื้นฐานคอร์ส</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <span className="hidden md:inline">
                        ชื่อคอร์ส, ผู้สอน, ราคา, รายละเอียด, รูปภาพ
                      </span>
                      <Chevron open={panelOpen.basic} />
                    </div>
                  </button>

                  {panelOpen.basic && (
                    <div className="px-4 md:px-5 pb-5 pt-2 grid gap-4 md:grid-cols-2">
                      {/* รูปภาพ */}
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          รูปภาพคอร์ส
                        </label>
                        {preview ? (
                          <img
                            src={preview}
                            alt="preview"
                            className="h-56 w-full rounded-2xl object-cover ring-1 ring-gray-200"
                          />
                        ) : (
                          <div className="grid h-56 w-full place-items-center rounded-2xl border border-dashed text-sm text-gray-500 bg-gray-50">
                            ไม่มีรูป
                          </div>
                        )}
                        <div className="flex gap-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => onSelectImage(e.target.files?.[0])}
                            className="block w-full text-sm file:mr-3 file:rounded-xl file:border file:bg-white file:px-3 file:py-2 file:text-sm hover:file:bg-gray-50 file:ring-1 file:ring-gray-200"
                          />
                          {preview && (
                            <button
                              type="button"
                              onClick={() => onSelectImage(null)}
                              className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
                            >
                              ลบรูป
                            </button>
                          )}
                        </div>
                      </div>

                      {/* ฟอร์มพื้นฐาน */}
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">
                          ชื่อคอร์ส *
                        </label>
                        <input
                          value={form.title}
                          onChange={(e) =>
                            setForm({ ...form, title: e.target.value })
                          }
                          placeholder="เช่น React for Beginners"
                          required
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">
                          ผู้สอน *
                        </label>
                        <input
                          value={form.instructor}
                          onChange={(e) =>
                            setForm({ ...form, instructor: e.target.value })
                          }
                          placeholder="ชื่อผู้สอน"
                          required
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">
                          ราคา (บาท) *
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={form.price}
                          onChange={(e) =>
                            setForm({ ...form, price: e.target.value })
                          }
                          placeholder="เช่น 1990"
                          required
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                        />
                      </div>

                      <div className="space-y-1 md:col-span-2">
                        <label className="text-sm font-medium text-gray-700">
                          รายละเอียด
                        </label>
                        <textarea
                          rows={4}
                          value={form.description}
                          onChange={(e) =>
                            setForm({ ...form, description: e.target.value })
                          }
                          placeholder="สรุปเนื้อหา สิ่งที่ผู้เรียนจะได้รับ ฯลฯ"
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* ===== Pre-test ===== */}
                <div className="rounded-2xl border border-gray-200/70 bg-white shadow-sm overflow-hidden">
                  <button
                    type="button"
                    onClick={() => togglePanel("pre")}
                    className="w-full flex items-center justify-between gap-3 px-4 md:px-5 py-3.5 bg-white/60 hover:bg-white transition"
                  >
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <span className="text-gray-800 flex items-center gap-2">
                        <TestIcon /> แบบทดสอบก่อนเรียน (Pre-test)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Pill>{preTest.length} ข้อ</Pill>
                      <Chevron open={panelOpen.pre} />
                    </div>
                  </button>

                  {panelOpen.pre && (
                    <div className="px-4 md:px-5 pb-5 pt-2 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-600">
                          * ทำครั้งเดียว (ฝั่งผู้เรียน)
                        </p>
                        <button
                          type="button"
                          onClick={() => addQ("pre")}
                          className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs px-3 py-1.5 shadow hover:brightness-95 active:scale-[.98] transition"
                        >
                          + เพิ่มคำถาม
                        </button>
                      </div>

                      {preTest.length === 0 && (
                        <p className="text-xs text-gray-400">ยังไม่มีคำถาม</p>
                      )}

                      {preTest.map((q, qi) => (
                        <div
                          key={`pre-${qi}`}
                          className="rounded-xl border border-gray-200 p-3 space-y-2 bg-white/70"
                        >
                          <input
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-100"
                            placeholder={`คำถามที่ ${qi + 1}`}
                            value={q.prompt}
                            onChange={(e) =>
                              updateQ("pre", qi, "prompt", e.target.value)
                            }
                            required
                          />
                          <div className="grid md:grid-cols-2 gap-2">
                            {q.choices.map((c, ci) => (
                              <label
                                key={ci}
                                className="flex items-center gap-2 rounded-lg border border-gray-200 px-2 py-1.5"
                              >
                                <input
                                  type="radio"
                                  name={`pre-correct-${qi}`}
                                  checked={q.correctIndex === ci}
                                  onChange={() =>
                                    updateQ("pre", qi, "correctIndex", ci)
                                  }
                                />
                                <input
                                  className="flex-1 outline-none text-sm"
                                  placeholder={`ตัวเลือกที่ ${ci + 1}`}
                                  value={c}
                                  onChange={(e) =>
                                    updateChoice("pre", qi, ci, e.target.value)
                                  }
                                  required
                                />
                                {q.correctIndex === ci && (
                                  <span className="text-emerald-600 text-xs font-medium">
                                    ถูก
                                  </span>
                                )}
                              </label>
                            ))}
                          </div>
                          <input
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-100"
                            placeholder="คำอธิบาย/เฉลย (ไม่บังคับ)"
                            value={q.explanation}
                            onChange={(e) =>
                              updateQ("pre", qi, "explanation", e.target.value)
                            }
                          />
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => removeQ("pre", qi)}
                              className="rounded-xl border px-3 py-1.5 text-xs hover:bg-gray-50"
                            >
                              ลบคำถาม
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ===== Post-test ===== */}
                <div className="rounded-2xl border border-gray-200/70 bg-white shadow-sm overflow-hidden">
                  <button
                    type="button"
                    onClick={() => togglePanel("post")}
                    className="w-full flex items-center justify-between gap-3 px-4 md:px-5 py-3.5 bg-white/60 hover:bg-white transition"
                  >
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <span className="text-gray-800 flex items-center gap-2">
                        <TestIcon /> แบบทดสอบหลังเรียน (Post-test)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Pill>{postTest.length} ข้อ</Pill>
                      <Chevron open={panelOpen.post} />
                    </div>
                  </button>

                  {panelOpen.post && (
                    <div className="px-4 md:px-5 pb-5 pt-2 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-600">
                          * ทำได้หลายครั้ง (ฝั่งผู้เรียน)
                        </p>
                        <button
                          type="button"
                          onClick={() => addQ("post")}
                          className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs px-3 py-1.5 shadow hover:brightness-95 active:scale-[.98] transition"
                        >
                          + เพิ่มคำถาม
                        </button>
                      </div>

                      {postTest.length === 0 && (
                        <p className="text-xs text-gray-400">ยังไม่มีคำถาม</p>
                      )}

                      {postTest.map((q, qi) => (
                        <div
                          key={`post-${qi}`}
                          className="rounded-xl border border-gray-200 p-3 space-y-2 bg-white/70"
                        >
                          <input
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-100"
                            placeholder={`คำถามที่ ${qi + 1}`}
                            value={q.prompt}
                            onChange={(e) =>
                              updateQ("post", qi, "prompt", e.target.value)
                            }
                            required
                          />
                          <div className="grid md:grid-cols-2 gap-2">
                            {q.choices.map((c, ci) => (
                              <label
                                key={ci}
                                className="flex items-center gap-2 rounded-lg border border-gray-200 px-2 py-1.5"
                              >
                                <input
                                  type="radio"
                                  name={`post-correct-${qi}`}
                                  checked={q.correctIndex === ci}
                                  onChange={() =>
                                    updateQ("post", qi, "correctIndex", ci)
                                  }
                                />
                                <input
                                  className="flex-1 outline-none text-sm"
                                  placeholder={`ตัวเลือกที่ ${ci + 1}`}
                                  value={c}
                                  onChange={(e) =>
                                    updateChoice("post", qi, ci, e.target.value)
                                  }
                                  required
                                />
                                {q.correctIndex === ci && (
                                  <span className="text-emerald-600 text-xs font-medium">
                                    ถูก
                                  </span>
                                )}
                              </label>
                            ))}
                          </div>
                          <input
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-100"
                            placeholder="คำอธิบาย/เฉลย (ไม่บังคับ)"
                            value={q.explanation}
                            onChange={(e) =>
                              updateQ("post", qi, "explanation", e.target.value)
                            }
                          />
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => removeQ("post", qi)}
                              className="rounded-xl border px-3 py-1.5 text-xs hover:bg-gray-50"
                            >
                              ลบคำถาม
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ===== Curriculum ===== */}
                <div className="rounded-2xl border border-gray-200/70 bg-white shadow-sm overflow-hidden">
                  <button
                    type="button"
                    onClick={() => togglePanel("curriculum")}
                    className="w-full flex items-center justify-between gap-3 px-4 md:px-5 py-3.5 bg-white/60 hover:bg-white transition"
                  >
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <span className="text-gray-800 flex items-center gap-2">
                        <GridIcon /> เนื้อหาภายในคอร์ส
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Pill>
                        {curriculum.reduce(
                          (n, s) => n + (s.lessons?.length || 0),
                          0
                        )}{" "}
                        บทเรียน
                      </Pill>
                      <Pill>{curriculum.length} หัวข้อ</Pill>
                      <Chevron open={panelOpen.curriculum} />
                    </div>
                  </button>

                  {panelOpen.curriculum && (
                    <div className="px-4 md:px-5 pb-5 pt-3 space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-600">
                          คลิกหัวข้อเพื่อแสดง/ซ่อนบทเรียน
                        </p>
                        <button
                          type="button"
                          onClick={addSection}
                          className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs px-3 py-1.5 shadow hover:brightness-95 active:scale-[.98] transition"
                        >
                          + เพิ่มหัวข้อ (Section)
                        </button>
                      </div>

                      {curriculum.length === 0 && (
                        <div className="text-xs text-gray-400">
                          ยังไม่มีหัวข้อ
                        </div>
                      )}

                      {curriculum.map((sec, si) => {
                        const open = !!sectionOpen[si];
                        return (
                          <div
                            key={si}
                            className="rounded-xl border border-gray-200 bg-white/70 overflow-hidden"
                          >
                            {/* แถวหัวข้อหลัก */}
                            <div className="flex items-center gap-2 p-3.5 border-b">
                              <button
                                type="button"
                                onClick={() => toggleSection(si)}
                                className="flex items-center gap-3 px-2 py-1.5 rounded hover:bg-gray-50 transition"
                                title={open ? "ยุบ" : "ขยาย"}
                              >
                                <Chevron open={open} />
                                <span className="text-sm font-medium">
                                  {sec.title?.trim()
                                    ? sec.title
                                    : `ชื่อหัวข้อที่ ${si + 1}`}
                                </span>
                                <Pill>{sec.lessons?.length || 0} บทเรียน</Pill>
                              </button>

                              <input
                                className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-100"
                                placeholder={`ชื่อหัวข้อที่ ${si + 1}`}
                                value={sec.title}
                                onChange={(e) =>
                                  updateSectionTitle(si, e.target.value)
                                }
                                required
                              />
                              <button
                                type="button"
                                onClick={() => removeSection(si)}
                                className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
                              >
                                ลบหัวข้อ
                              </button>
                            </div>

                            {/* รายการบทเรียน */}
                            {open && (
                              <div className="p-3.5 space-y-2">
                                <div className="flex items-center justify-between">
                                  <p className="text-xs text-gray-500">
                                    บทเรียนในหัวข้อนี้
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => addLesson(si)}
                                    className="rounded-xl bg-indigo-600 text-white text-xs px-3 py-1.5 shadow hover:brightness-95 active:scale-[.98] transition"
                                  >
                                    + เพิ่มบทเรียน
                                  </button>
                                </div>

                                {sec.lessons.length === 0 && (
                                  <div className="text-xs text-gray-400">
                                    ยังไม่มีบทเรียน
                                  </div>
                                )}

                                {sec.lessons.map((les, li) => {
                                  const key = `${si}-${li}`;
                                  return (
                                    <div
                                      key={li}
                                      className="rounded-xl border border-gray-200 p-3 bg-white"
                                    >
                                      <div className="grid md:grid-cols-12 gap-2">
                                        <input
                                          className="md:col-span-5 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-100"
                                          placeholder="ชื่อตอน/บทเรียน เช่น 'Introduction'"
                                          value={les.title}
                                          onChange={(e) =>
                                            updateLesson(
                                              si,
                                              li,
                                              "title",
                                              e.target.value
                                            )
                                          }
                                          required
                                        />
                                        <input
                                          type="number"
                                          min="0"
                                          className="md:col-span-2 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-100"
                                          placeholder="นาที"
                                          value={les.duration}
                                          onChange={(e) =>
                                            updateLesson(
                                              si,
                                              li,
                                              "duration",
                                              Number(e.target.value)
                                            )
                                          }
                                        />
                                        <input
                                          className="md:col-span-4 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-100"
                                          placeholder="ลิงก์วิดีโอ (หรือจะอัปโหลดก็ได้)"
                                          value={les.videoUrl}
                                          onChange={(e) =>
                                            updateLesson(
                                              si,
                                              li,
                                              "videoUrl",
                                              e.target.value
                                            )
                                          }
                                        />
                                      </div>

                                      {/* อัปโหลดวิดีโอ */}
                                      <div className="mt-2 flex items-center gap-2">
                                        <div className="md:col-span-1 flex items-center gap-2">
                                          <input
                                            id={`free-${si}-${li}`}
                                            type="checkbox"
                                            checked={!!les.freePreview}
                                            onChange={(e) =>
                                              updateLesson(
                                                si,
                                                li,
                                                "freePreview",
                                                e.target.checked
                                              )
                                            }
                                          />
                                          <label
                                            htmlFor={`free-${si}-${li}`}
                                            className="text-xs"
                                          >
                                            พรีวิวฟรี
                                          </label>

                                          <label className="relative inline-flex items-center">
                                            <input
                                              type="file"
                                              accept="video/*"
                                              className="hidden"
                                              onChange={(e) =>
                                                uploadLessonVideo(
                                                  si,
                                                  li,
                                                  e.target.files?.[0]
                                                )
                                              }
                                              disabled={!!videoUploading[key]}
                                            />
                                            <span
                                              className={`cursor-pointer rounded-xl border px-3 py-1.5 text-sm hover:bg-gray-50 ${
                                                videoUploading[key]
                                                  ? "opacity-60 pointer-events-none"
                                                  : ""
                                              }`}
                                            >
                                              {videoUploading[key]
                                                ? "กำลังอัปโหลด…"
                                                : "อัปโหลดวิดีโอ"}
                                            </span>
                                          </label>

                                          {/* Progress */}
                                          {typeof videoProgress[key] ===
                                            "number" &&
                                            videoUploading[key] && (
                                              <div className="flex-1 h-2 rounded bg-gray-200 overflow-hidden">
                                                <div
                                                  className="h-2 bg-indigo-600"
                                                  style={{
                                                    width: `${videoProgress[key]}%`,
                                                  }}
                                                />
                                              </div>
                                            )}

                                          {/* ลิงก์วิดีโอ */}
                                          {les.videoUrl &&
                                            !videoUploading[key] && (
                                              <a
                                                href={`http://localhost:5000${
                                                  les.videoUrl.startsWith(
                                                    "/uploads"
                                                  )
                                                    ? les.videoUrl
                                                    : les.videoUrl
                                                }`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-xs underline text-indigo-600"
                                              >
                                                เปิดวิดีโอ
                                              </a>
                                            )}
                                        </div>
                                      </div>

                                      <div className="flex justify-end">
                                        <button
                                          type="button"
                                          onClick={() => removeLesson(si, li)}
                                          className="mt-2 rounded-xl border px-3 py-1.5 text-xs hover:bg-gray-50"
                                        >
                                          ลบบทเรียน
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* ===== Footer ปุ่มบันทึก ===== */}
                <div className="sticky bottom-0 bg-gradient-to-t from-white/95 to-white/40 backdrop-blur border-t border-gray-200/70 -mx-4 md:-mx-6 px-4 md:px-6 py-4 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDialogOpen(false);
                      resetForm();
                    }}
                    className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50 shadow-sm"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-xl px-4 py-2 text-sm text-white shadow-md disabled:opacity-60 bg-gradient-to-r from-indigo-600 to-violet-600 hover:brightness-95 active:scale-[.98] transition"
                  >
                    {submitting
                      ? "กำลังบันทึก..."
                      : editingId
                      ? "บันทึกการแก้ไข"
                      : "+ เพิ่มคอร์ส"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default AdminCourses;
