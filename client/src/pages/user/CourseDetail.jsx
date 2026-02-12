import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";

/* อ่าน token จาก localStorage */
const getToken = () => {
  try {
    return localStorage.getItem("token") || "";
  } catch {
    return "";
  }
};

/* helper: คีย์เก็บ progress ต่อคอร์สใน localStorage */
const progressKey = (courseId) => `courseProgress:${courseId}`;

/* helper: แสดงไอคอนเชฟร่อนขึ้น/ลงแบบไม่พึ่งไลบรารีเพิ่ม */
const Chevron = ({ open }) => (
  <svg
    className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
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

/* ไอคอนติ๊กถูก */
const CheckIcon = () => (
  <svg
    className="w-4 h-4 text-emerald-600"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M16.704 5.29a1 1 0 010 1.42l-7.25 7.25a1 1 0 01-1.42 0l-3-3a1 1 0 111.42-1.42l2.29 2.29 6.54-6.54a1 1 0 011.42 0z"
      clipRule="evenodd"
    />
  </svg>
);

const shuffleArray = (items) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = getToken();

  /* State หลักของหน้า */
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]); // ใช้ตรวจว่าซื้อแล้วหรือยัง
  const [certificate, setCertificate] = useState({ loading: true, data: null });

  // โครงสร้างเป็น { [sectionIndex]: boolean }
  const [openSections, setOpenSections] = useState({});

  // เก็บ index ของบทเรียนที่กำลังเล่นด้วย เพื่ออัปเดต progress ถูกตัว
  const [player, setPlayer] = useState({
    open: false,
    title: "",
    url: "",
    si: -1, // section index
    li: -1, // lesson index
  });

  const videoRef = useRef(null);

  /* แบบทดสอบ */
  const [quizStatus, setQuizStatus] = useState({ pre: null, post: null });
  const [quiz, setQuiz] = useState({
    open: false,
    title: "",
    items: [],
    type: "pre",
    answers: {},
    showResult: false,
    score: 0,
  });

  /* Progress การดูวิดีโอต่อบทเรียน */
  // โครงสร้าง: { "si-li": { pct: number, done: boolean } }
  const [progress, setProgress] = useState({});

  /* โหลด progress จาก localStorage เมื่อรู้จักคอร์สแล้ว */
  useEffect(() => {
    if (!id) return;
    try {
      const raw = localStorage.getItem(progressKey(id));
      setProgress(raw ? JSON.parse(raw) : {});
    } catch {
      setProgress({});
    }
  }, [id]);

  /* เซฟ progress กลับ localStorage ทุกครั้งที่เปลี่ยน */
  useEffect(() => {
    if (!id) return;
    localStorage.setItem(progressKey(id), JSON.stringify(progress));
  }, [id, progress]);

  /* โหลดข้อมูลคอร์ส */
  useEffect(() => {
    let active = true;
    setLoading(true);
    axios
      .get(`http://localhost:5000/api/courses/${id}`)
      .then((res) => active && setCourse(res.data))
      .catch((err) => console.error(err))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);

  /* โหลดออเดอร์ผู้ใช้เพื่อเช็คสิทธิ์ */
  useEffect(() => {
    if (!token) return;
    axios
      .get("http://localhost:5000/api/orders", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setOrders(Array.isArray(res.data) ? res.data : []))
      .catch(() => setOrders([]));
  }, [token]);

  /* โหลดสถานะแบบทดสอบ */
  useEffect(() => {
    if (!token) return;
    axios
      .get(`http://localhost:5000/api/courses/${id}/quiz/status`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setQuizStatus(res.data || { pre: null, post: null }))
      .catch(() => setQuizStatus({ pre: null, post: null }));
  }, [id, token]);

  useEffect(() => {
  let alive = true;

  const checkCert = async () => {
    //  ยังไม่ผ่าน post-test ไม่ต้องเช็ค certificate เลย
    if (!quizStatus?.post?.passed) {
      setCertificate({ loading: false, data: null });
      return;
    }

    setCertificate({ loading: true, data: null });

    try {
      const r = await axios.get(
        `http://localhost:5000/api/certificates/${id}/me`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!alive) return;

      if (r.data?.hasCertificate) {
        setCertificate({ loading: false, data: r.data.certificate });
      } else {
        setCertificate({ loading: false, data: null });
      }
    } catch (e) {
      if (!alive) return;
      // สำคัญ: error ก็ต้องปิด loading
      setCertificate({ loading: false, data: null });
    }
  };

  checkCert();
  return () => { alive = false; };
}, [id, token, quizStatus?.post?.passed]);

  /* เป็นเจ้าของคอร์สแล้วหรือยัง */
  const purchased = useMemo(() => {
    if (!orders?.length) return false;
    return orders.some((o) => {
      const cid = (o.courseId && (o.courseId._id || o.courseId)) || "";
      const okId = String(cid) === String(id);
      // ฝั่ง orderRoutes ใช้ paymentStatus, บางรายการอาจไม่มี field status ใน client ตัวนี้จึงไม่บล็อกหากเป็นข้อมูลเก่า
      const okStatus = o.paymentStatus
        ? String(o.paymentStatus).toLowerCase() === "paid"
        : true;
      return okId && okStatus;
    });
  }, [orders, id]);

  /* Accordion handlers */
  const toggleSection = (si) =>
    setOpenSections((prev) => ({ ...prev, [si]: !prev[si] }));

  /* Player handlers  */
  const openPlayer = (si, li, title, url) => {
    const finalUrl = url?.startsWith("/uploads")
      ? `http://localhost:5000${url}`
      : url;
    setPlayer({ open: true, title, url: finalUrl, si, li });
    document.body.style.overflow = "hidden";
  };
  const closePlayer = () => {
    setPlayer({ open: false, title: "", url: "", si: -1, li: -1 });
    document.body.style.overflow = "";
  };

  /* คำนวณและอัปเดตความคืบหน้าขณะดูวิดีโอ */
  const handleTimeUpdate = () => {
    if (!videoRef.current || player.si < 0 || player.li < 0) return;
    const dur = videoRef.current.duration || 0;
    const cur = videoRef.current.currentTime || 0;
    if (dur <= 0) return;

    const pct = Math.min(100, Math.round((cur / dur) * 100));
    const key = `${player.si}-${player.li}`;
    setProgress((prev) => {
      const done = prev[key]?.done || pct >= 95;
      return { ...prev, [key]: { pct, done } };
    });
  };

  /* กันกรณีผู้ใช้ดูจนจบพอดี */
  const handleEnded = () => {
    if (player.si < 0 || player.li < 0) return;
    const key = `${player.si}-${player.li}`;
    setProgress((prev) => ({ ...prev, [key]: { pct: 100, done: true } }));
  };

  /* Quiz controls */
  const startQuiz = (title, items, type) => {
    if (!items?.length) return;
    const quizItems =
      type === "post" ? shuffleArray(items) : Array.isArray(items) ? items : [];
    setQuiz({
      open: true,
      title,
      items: quizItems,
      type,
      answers: {},
      showResult: false,
      score: 0,
    });
    document.body.style.overflow = "hidden";
  };
  const closeQuiz = () => {
    setQuiz({
      open: false,
      title: "",
      items: [],
      type: "pre",
      answers: {},
      showResult: false,
      score: 0,
    });
    document.body.style.overflow = "";
  };

  const submitQuiz = async () => {
    try {
      // ส่งเป็น [{ questionId, answerIndex }] เพื่อรองรับการ shuffle
      const answersPayload = quiz.items.map((q, i) => {
        const qid = q?._id || q?.id; // subdocument ของ mongoose จะมี _id
        if (!qid) {
          throw new Error("ไม่พบ questionId (_id) ในข้อสอบ กรุณาเช็คโครงสร้างข้อมูลข้อสอบ");
        }
        return {
          questionId: String(qid),
          answerIndex: typeof quiz.answers[i] === "number" ? quiz.answers[i] : -1,
        };
      });

      const res = await axios.post(
        `http://localhost:5000/api/courses/${id}/quiz/${quiz.type}`,
        { answers: answersPayload },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { score } = res.data;
      setQuiz((prev) => ({ ...prev, showResult: true, score }));

      // โหลดสถานะใหม่เหมือนเดิม
      const st = await axios.get(
        `http://localhost:5000/api/courses/${id}/quiz/status`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setQuizStatus(st.data || { pre: null, post: null });

      // ตรวจ Certificate หลังทำ post-test
      if (quiz.type === "post") {
        setCertificate({ loading: true, data: null });
        try {
          const certRes = await axios.get(
            `http://localhost:5000/api/certificates/${id}/me`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (certRes.data?.hasCertificate) {
            setCertificate({ loading: false, data: certRes.data.certificate });
          } else {
            setCertificate({ loading: false, data: null });
          }
        } catch {
          setCertificate({ loading: false, data: null });
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || "ส่งคำตอบไม่สำเร็จ");
    }
  };

  /*  UI  */
  if (loading) return <p className="text-center mt-20"> กำลังโหลดข้อมูล...</p>;
  if (!course) return <p className="text-center mt-20">ไม่พบคอร์ส</p>;

  const curriculum = Array.isArray(course.curriculum) ? course.curriculum : [];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-5xl grid md:grid-cols-12 gap-6">
        {/* ซ้าย: รายละเอียดคอร์ส + สารบัญ */}
        <div className="md:col-span-8">
          {course.image && (
            <img
              src={`http://localhost:5000${course.image}`}
              alt={course.title}
              className="w-full h-64 object-cover rounded-xl shadow-sm"
            />
          )}

          <h1 className="mt-4 text-3xl font-bold text-slate-800">
            {course.title}
          </h1>
          <p className="mt-2 text-slate-600 whitespace-pre-line">
            {course.description}
          </p>

          {/* ปุ่มแบบทดสอบ */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold">สารบัญคอร์ส</h2>

            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={() =>
                  startQuiz("แบบทดสอบก่อนเรียน", course.preTest || [], "pre")
                }
                className="rounded-lg border px-4 py-2 hover:bg-gray-50 disabled:opacity-60"
                disabled={
                  !course.preTest?.length || quizStatus.pre?.attemptCount >= 1
                }
                title={
                  !course.preTest?.length
                    ? "ยังไม่มีข้อสอบ"
                    : quizStatus.pre?.attemptCount >= 1
                      ? "ทำได้ครั้งเดียว"
                      : ""
                }
              >
                ทำแบบทดสอบก่อนเรียน
              </button>

              <button
                onClick={() =>
                  purchased
                    ? startQuiz(
                      "แบบทดสอบหลังเรียน",
                      course.postTest || [],
                      "post"
                    )
                    : navigate(`/checkout/${course._id}`)
                }
                className={`rounded-lg px-4 py-2 ${purchased
                    ? "border hover:bg-gray-50"
                    : "bg-indigo-600 text-white hover:bg-indigo-700"
                  } disabled:opacity-60`}
                disabled={
                  purchased
                    ? !course.postTest?.length || quizStatus.post?.passed
                    : false
                }
                title={
                  purchased
                    ? !course.postTest?.length
                      ? "ยังไม่มีข้อสอบ"
                      : quizStatus.post?.passed
                        ? "ผ่านแล้ว"
                        : ""
                    : "ต้องชำระเงินก่อน"
                }
              >
                {purchased
                  ? "ทำแบบทดสอบหลังเรียน"
                  : "ซื้อคอร์สเพื่อทำ Post-test"}
              </button>
            </div>

            {/* สรุปสถานะแบบทดสอบ */}
            <div className="mt-2 space-y-1">
              {quizStatus.pre && (
                <p className="text-xs text-slate-600">
                  Pre-test: ทำ {quizStatus.pre.attemptCount}/1 ครั้ง |
                  คะแนนล่าสุด {quizStatus.pre.lastScore}/{quizStatus.pre.total}
                  {typeof quizStatus.pre.bestScore === "number" &&
                    ` | ดีที่สุด ${quizStatus.pre.bestScore}/${quizStatus.pre.total}`}
                </p>
              )}
              {quizStatus.post && (
                <p className="text-xs text-slate-600">
                  Post-test: ทำ {quizStatus.post.attemptCount} ครั้ง | ดีที่สุด{" "}
                  {quizStatus.post.bestScore}/{quizStatus.post.total} |{" "}
                  {quizStatus.post.passed ? "ผ่านแล้ว" : "ยังไม่ผ่าน"}
                </p>
              )}
            </div>

            {/* สารบัญแบบ Accordion */}
            {curriculum.length === 0 && (
              <p className="text-sm text-slate-500 mt-4">
                ยังไม่มีเนื้อหาหลักสูตร
              </p>
            )}

            <div className="mt-3 space-y-3">
              {curriculum.map((sec, si) => {
                const isOpen = !!openSections[si];
                const total = (sec.lessons || []).length;
                const doneCount = (sec.lessons || []).reduce((acc, _, li) => {
                  const k = `${si}-${li}`;
                  return acc + (progress[k]?.done ? 1 : 0);
                }, 0);

                return (
                  <div
                    key={si}
                    className="rounded-xl border bg-white overflow-hidden"
                  >
                    {/* Header: คลิกเพื่อยุบ/ขยาย */}
                    <button
                      onClick={() => toggleSection(si)}
                      className="w-full px-4 py-3 border-b flex items-center justify-between hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <Chevron open={isOpen} />
                        <p className="font-medium">
                          {sec.title || `หัวข้อที่ ${si + 1}`}
                        </p>
                      </div>
                      <span className="text-xs text-slate-500">
                        {doneCount}/{total} บทเรียนเสร็จแล้ว
                      </span>
                    </button>

                    {/* Body: รายการบทเรียน (โชว์เมื่อ open) */}
                    {isOpen && (
                      <div className="divide-y">
                        {(sec.lessons || []).map((les, li) => {
                          const canPreview = !!les.freePreview;
                          const canPlay = canPreview || purchased;
                          const k = `${si}-${li}`;
                          const done = !!progress[k]?.done;

                          return (
                            <div
                              key={li}
                              className="flex items-center gap-3 px-4 py-3"
                            >
                              {/* ติ๊กถูกเมื่อ ≥95% */}
                              <div className="w-5 h-5 flex items-center justify-center">
                                {done && <CheckIcon />}
                              </div>

                              <div className="flex-1">
                                <p className="text-sm font-medium">
                                  {les.title || `บทเรียนที่ ${li + 1}`}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {Number(les.duration) > 0
                                    ? `${les.duration} นาที`
                                    : "—"}
                                  {canPreview && (
                                    <span className="ml-2 inline-flex items-center text-emerald-600">
                                      พรีวิวฟรี
                                    </span>
                                  )}
                                  {/* แสดง % ความคืบหน้าแบบบางๆ */}
                                  {progress[k]?.pct > 0 && (
                                    <span className="ml-2 text-slate-400">
                                      • ดูแล้ว ~{progress[k].pct}%
                                    </span>
                                  )}
                                </p>
                              </div>

                              {canPlay ? (
                                <button
                                  onClick={() =>
                                    openPlayer(si, li, les.title, les.videoUrl)
                                  }
                                  className="text-sm rounded-lg bg-indigo-600 text-white px-3 py-1.5 hover:bg-indigo-700"
                                  disabled={!les.videoUrl}
                                  title={
                                    les.videoUrl ? "" : "ยังไม่มีลิงก์วิดีโอ"
                                  }
                                >
                                  เล่นวิดีโอ
                                </button>
                              ) : (
                                <Link
                                  to={`/checkout/${course._id}`}
                                  className="text-sm rounded-lg border px-3 py-1.5 hover:bg-gray-50"
                                >
                                  ชำระเงินเพื่อรับชม
                                </Link>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ขวา: กล่องสรุปราคา/ซื้อคอร์ส */}
        <aside className="md:col-span-4">
          <div className="top-4 rounded-xl border bg-white p-4 space-y-3">
            <div className="text-2xl font-bold text-indigo-700">
              {typeof course.price === "number"
                ? course.price.toLocaleString()
                : course.price}{" "}
              ฿
            </div>
            <div className="text-sm text-slate-600">
              ผู้สอน:{" "}
              <span className="font-medium">{course.instructor || "-"}</span>
            </div>

            {purchased ? (
              <div className="rounded-lg bg-emerald-50 text-emerald-700 px-3 py-2 text-sm">
                คุณเป็นผู้เรียนคอร์สนี้แล้ว
              </div>
            ) : (
              <button
                onClick={() => navigate(`/checkout/${course._id}`)}
                className="w-full rounded-lg bg-indigo-600 text-white py-2.5 hover:bg-indigo-700"
              >
                ซื้อคอร์สนี้
              </button>
            )}
            {certificate.loading ? (
              <p className="text-xs text-slate-500 mt-2">
                กำลังตรวจสอบ Certificate...
              </p>
            ) : certificate.data ? (
              <button
                onClick={() => navigate(`/certificate/${course._id}`)}
                className="w-full mt-2 rounded-lg border border-emerald-500 text-emerald-700 py-2 text-sm hover:bg-emerald-50"
              >
                ดู/ดาวน์โหลดใบ Certificate
              </button>
            ) : (
              <p className="text-xs text-slate-500 mt-2">
                ยังไม่ผ่านเงื่อนไขการออก Certificate
              </p>
            )}
          </div>
        </aside>
      </div>

      {/* Modal เล่นวิดีโอ (จับเวลาเพื่อคิด % ความคืบหน้า) */}
      {player.open && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-black rounded-xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-900">
              <p className="text-white text-sm truncate">
                {player.title || "พรีวิววิดีโอ"}
              </p>
              <button
                onClick={closePlayer}
                className="text-white/80 hover:text-white text-sm"
              >
                ปิด
              </button>
            </div>
            <div className="bg-black">
              {player.url ? (
                <video
                  ref={videoRef}
                  controls
                  className="w-full h-[60vh] bg-black"
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={handleEnded}
                >
                  <source src={player.url} />
                  เบราว์เซอร์ของคุณไม่รองรับการเล่นวิดีโอ
                </video>
              ) : (
                <div className="text-white p-6">ไม่พบวิดีโอ</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal แบบทดสอบ */}
      {quiz.open && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-white rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="font-medium">{quiz.title}</h3>
              <button
                onClick={closeQuiz}
                className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
              >
                ปิด
              </button>
            </div>

            <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
              {quiz.items.map((q, i) => (
                <div key={i} className="rounded-lg border p-3">
                  <p className="font-medium text-sm mb-2">
                    {i + 1}. {q.prompt}
                  </p>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {q.choices.map((c, ci) => (
                      <label
                        key={ci}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer ${quiz.showResult && ci === q.correctIndex
                            ? "border-emerald-400 bg-emerald-50"
                            : ""
                          }`}
                      >
                        <input
                          type="radio"
                          name={`q-${i}`}
                          checked={quiz.answers[i] === ci}
                          onChange={() =>
                            setQuiz((prev) => ({
                              ...prev,
                              answers: { ...prev.answers, [i]: ci },
                            }))
                          }
                        />
                        <span>{c}</span>
                      </label>
                    ))}
                  </div>

                  {quiz.showResult && q.explanation && (
                    <p className="mt-2 text-xs text-slate-600">
                      เฉลย: ข้อ {q.correctIndex + 1} — {q.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="px-4 py-3 border-t flex items-center justify-between">
              {quiz.showResult ? (
                <p className="text-sm">{`คะแนน: ${quiz.score}/${quiz.items.length}`}</p>
              ) : (
                <div />
              )}

              {!quiz.showResult ? (
                <button
                  onClick={submitQuiz}
                  className="rounded-lg bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-700"
                >
                  ส่งคำตอบ
                </button>
              ) : (
                <button
                  onClick={closeQuiz}
                  className="rounded-lg border px-4 py-2 hover:bg-gray-50"
                >
                  ปิด
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CourseDetail;
