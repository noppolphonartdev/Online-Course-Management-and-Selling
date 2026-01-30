import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

function HomePage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy] = useState("latest"); // latest | priceAsc | priceDesc | title

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await axios.get("http://localhost:5000/api/courses");
        if (mounted) setCourses(res.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, []);

  // --- Derived ---
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
        // latest: keep server order
        break;
    }
    return list;
  }, [courses, search, sortBy]);

  const featured = useMemo(() => filtered.slice(0, 3), [filtered]);

  // --- Components ---
  const Skeleton = () => (
    <div className="animate-pulse overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className="h-40 bg-gray-200" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-3/5 rounded bg-gray-200" />
        <div className="h-4 w-4/5 rounded bg-gray-200" />
        <div className="h-4 w-1/3 rounded bg-gray-200" />
      </div>
    </div>
  );

  const CourseCard = ({ c }) => (
    <article className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-950/5 transition hover:shadow-md">
      <Link to={`/course/${c._id}`} className="block">
        <div className="relative">
          <img
            src={
              c.image
                ? `http://localhost:5000${c.image}`
                : "https://placehold.co/600x360"
            }
            alt={c.title}
            className="h-44 w-full object-cover"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
        <div className="p-4">
          <h3 className="line-clamp-2 text-base font-semibold leading-tight">
            {c.title}
          </h3>
          <p className="mt-1 text-sm text-gray-600 line-clamp-2">
            {c.description}
          </p>
          <div className="mt-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">ผู้สอน</p>
              <p className="text-sm font-medium">{c.instructor || "-"}</p>
            </div>
            <p className="text-lg font-semibold">
              {(c.price || 0).toLocaleString()} ฿
            </p>
          </div>
        </div>
      </Link>
      <div className="flex gap-2 p-4 pt-0">
        <Link
          to={`/course/${c._id}`}
          className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-center text-sm font-medium text-white hover:bg-indigo-700"
        >
          ดูรายละเอียด
        </Link>
        <Link
          to={`/checkout/${c._id}`}
          className="flex-1 rounded-lg border px-3 py-2 text-center text-sm font-medium hover:bg-gray-50"
        >
          ซื้อเลย
        </Link>
      </div>
    </article>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* HERO */}
      <section className="relative isolate">
        <div className="mx-auto max-w-[1200px] px-4 pt-10 pb-14 sm:pb-16 lg:pt-14">
          <div className="grid items-center gap-8 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium text-gray-600">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                เรียนได้ทันที — ซื้อและเข้าเรียนได้เลย
              </span>
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
                คอร์สออนไลน์สำหรับทุกคน
              </h1>
              <p className="mt-3 text-gray-600">
                อัปสกิลสาย Dev/Design/Business ด้วยคอร์สคุณภาพ
                เลือกเรียนตามจังหวะของคุณเอง
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#courses"
                  className="rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-black"
                >
                  สำรวจคอร์ส
                </a>
                <a
                  href="#featured"
                  className="rounded-xl border px-5 py-3 text-sm font-semibold hover:bg-gray-50"
                >
                  แนะนำสำหรับคุณ
                </a>
              </div>

              {/* Search */}
            </div>

            {/* Illustration */}
            <div className="relative hidden select-none lg:block">
              <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-emerald-100 blur-2xl" />
              <div className="absolute -right-8 bottom-12 h-40 w-40 rounded-full bg-indigo-100 blur-2xl" />
              <div className="relative rounded-3xl border bg-white p-3 shadow-xl">
                <img
                  src="https://images.unsplash.com/photo-1553877522-43269d4ea984?q=80&w=1600&auto=format&fit=crop"
                  alt="learn"
                  className="h-[340px] w-full rounded-2xl object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED */}
      <section id="featured" className="mx-auto max-w-[1200px] px-4 pb-4">
        <div className="flex items-end justify-between">
          <h2 className="text-lg font-semibold">คอร์สแนะนำ</h2>
          <Link
            to="#courses"
            className="text-sm text-indigo-600 hover:underline"
          >
            ดูทั้งหมด
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <>
              <Skeleton />
              <Skeleton />
              <Skeleton />
            </>
          ) : featured.length === 0 ? (
            <div className="col-span-full rounded-2xl bg-white p-6 text-sm shadow-sm">
              ยังไม่มีคอร์ส
            </div>
          ) : (
            featured.map((c) => <CourseCard key={c._id} c={c} />)
          )}
        </div>
      </section>

      <div className="mx-auto max-w-[1200px] px-4">
        <div className="mt-8 flex items-center gap-3 rounded-2xl border bg-white p-2 shadow-sm">
          <div className="relative flex-1">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหา: ชื่อคอร์ส / ผู้สอน / คำอธิบาย"
              className="w-full rounded-xl px-3 py-2 pr-9 text-sm outline-none"
            />
            <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 opacity-60">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
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
        </div>
      </div>

      {/* ALL COURSES */}
      <section id="courses" className="mx-auto max-w-[1200px] px-4 pb-16">
        <div className="mt-8 flex items-center justify-between">
          <h2 className="text-lg font-semibold">คอร์สทั้งหมด</h2>
          <p className="text-sm text-gray-500">
            ทั้งหมด {filtered.length} คอร์ส
          </p>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {loading ? (
            <>
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} />
              ))}
            </>
          ) : filtered.length === 0 ? (
            <div className="col-span-full rounded-2xl bg-white p-6 text-sm shadow-sm">
              ไม่พบคอร์สตามเงื่อนไข
            </div>
          ) : (
            filtered.map((c) => <CourseCard key={c._id} c={c} />)
          )}
        </div>
      </section>
    </div>
  );
}

export default HomePage;
