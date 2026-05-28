"use client";
import { useState, useEffect, useRef } from "react";
import { inputStyle, cardStyle, btnPrimary, btnSecondary, ScoreBar } from "../../shared";

export default function StudentPage({ params }) {
  const id = params.id;
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [essay, setEssay] = useState("");
  const [draftCount, setDraftCount] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [grading, setGrading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [timerStarted, setTimerStarted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/activities?id=${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setNotFound(true); setLoading(false); return; }
        setActivity(data);
        if (data.timerMinutes > 0) setTimeLeft(data.timerMinutes * 60);
        setLoading(false);
      })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [id]);

  const startTimer = () => {
    setTimerStarted(true);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(timerRef.current); setSubmitted(true); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const wordCount = essay.trim() === "" ? 0 : essay.trim().split(/\s+/).length;

  const handleGrade = async () => {
    setGrading(true);
    const res = await fetch("/api/grade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ essay, activity }),
    });
    const data = await res.json();
    setFeedback(data);
    setDraftCount((prev) => prev + 1);
    setGrading(false);
  };

  const handleFinalSubmit = () => {
    clearInterval(timerRef.current);
    setSubmitted(true);
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f3f4f6" }}>
      <p style={{ color: "#6b7280", fontSize: 16 }}>Loading activity...</p>
    </div>
  );

  if (notFound) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f3f4f6" }}>
      <div style={{ ...cardStyle, textAlign: "center", maxWidth: 400 }}>
        <p style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px" }}>Activity not found</p>
        <p style={{ color: "#6b7280", fontSize: 14, margin: 0 }}>This link may be invalid or the activity has been deleted.</p>
      </div>
    </div>
  );

  if (submitted && feedback) return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6", padding: "24px 16px" }}>
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        <div style={{ ...cardStyle, textAlign: "center", marginBottom: 24, background: "#f0fdf4", border: "2px solid #86efac" }}>
          <p style={{ fontSize: 22, fontWeight: 700, margin: "0 0 4px" }}>✅ Submitted!</p>
          <p style={{ color: "#166534", fontSize: 14, margin: 0 }}>Your final essay has been submitted. Here is your feedback.</p>
        </div>
        <FeedbackPanel feedback={feedback} essay={essay} />
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6", padding: "24px 16px" }}>
      <div style={{ maxWidth: 700, margin: "0 auto" }}>

        <div style={{ ...cardStyle, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>{activity.title}</h1>
              <p style={{ color: "#6b7280", fontSize: 13, margin: 0 }}>{activity.cefrLevel} · {activity.taskType}</p>
            </div>
            {activity.timerMinutes > 0 && (
              <div style={{ background: timeLeft < 60 ? "#fef2f2" : "#fefce8", border: `1px solid ${timeLeft < 60 ? "#fca5a5" : "#fde68a"}`, borderRadius: 10, padding: "8px 16px", textAlign: "center" }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", margin: "0 0 2px" }}>TIME LEFT</p>
                <p style={{ fontSize: 22, fontWeight: 700, margin: 0, color: timeLeft < 60 ? "#dc2626" : "#111", fontFamily: "monospace" }}>
                  {formatTime(timeLeft)}
                </p>
              </div>
            )}
          </div>
        </div>

        <div style={{ ...cardStyle, marginBottom: 20, background: "#eff6ff", border: "1px solid #bfdbfe" }}>
          <p style={{ fontWeight: 700, fontSize: 13, margin: "0 0 6px", color: "#1e40af" }}>✏️ Writing Prompt</p>
          <p style={{ fontSize: 15, margin: 0, lineHeight: 1.6, color: "#1e3a8a" }}>{activity.prompt}</p>
        </div>

        <div style={{ ...cardStyle, marginBottom: 20 }}>
          <p style={{ fontWeight: 700, fontSize: 13, margin: "0 0 10px" }}>Requirements</p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {[
              `📝 ${activity.minWords}–${activity.maxWords} words`,
              `🎯 Target: ${activity.targetWords} words`,
              `📋 ${activity.requiredDrafts} draft${activity.requiredDrafts > 1 ? "s" : ""} required`,
              `⏱️ ${activity.timerMinutes > 0 ? `${activity.timerMinutes} minutes` : "No timer"}`,
            ].map((label) => (
              <span key={label} style={{ background: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: 8, padding: "4px 10px", fontSize: 13 }}>{label}</span>
            ))}
          </div>
        </div>

        {activity.timerMinutes > 0 && !timerStarted && (
          <div style={{ ...cardStyle, marginBottom: 20, textAlign: "center", background: "#fefce8", border: "1px solid #fde68a" }}>
            <p style={{ fontSize: 15, fontWeight: 600, margin: "0 0 12px" }}>Ready? The timer will start when you click below.</p>
            <button style={{ ...btnPrimary, width: "auto", padding: "10px 28px" }} onClick={startTimer}>Start Timer & Begin Writing</button>
          </div>
        )}

        {(timerStarted || activity.timerMinutes === 0) && !submitted && (
          <>
            <div style={{ ...cardStyle, marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <label style={{ fontWeight: 700, fontSize: 14 }}>Your Essay</label>
                <span style={{ fontSize: 13, color: wordCount < activity.minWords ? "#dc2626" : wordCount > activity.maxWords ? "#dc2626" : "#16a34a", fontWeight: 600 }}>
                  {wordCount} / {activity.targetWords} words
                </span>
              </div>
              <textarea
                style={{ ...inputStyle, height: 280, resize: "vertical", fontSize: 15, lineHeight: 1.6 }}
                placeholder="Write your essay here..."
                value={essay}
                onChange={(e) => setEssay(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
              <button
                style={{ ...btnPrimary, flex: 1, opacity: grading || wordCount < activity.minWords ? 0.6 : 1 }}
                onClick={handleGrade}
                disabled={grading || wordCount < activity.minWords}
              >
                {grading ? "Getting feedback..." : `Get Feedback (Draft ${draftCount + 1})`}
              </button>
              {draftCount >= activity.requiredDrafts && (
                <button style={{ ...btnSecondary, flex: 1 }} onClick={handleFinalSubmit}>
                  ✅ Final Submit
                </button>
              )}
            </div>

            {wordCount < activity.minWords && (
              <p style={{ color: "#dc2626", fontSize: 13, marginTop: -16, marginBottom: 16 }}>
                You need at least {activity.minWords} words to get feedback. ({activity.minWords - wordCount} more needed)
              </p>
            )}
          </>
        )}

        {feedback && !submitted && <FeedbackPanel feedback={feedback} essay={essay} draftCount={draftCount} requiredDrafts={activity.requiredDrafts} />}

      </div>
    </div>
  );
}

function FeedbackPanel({ feedback, draftCount, requiredDrafts }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ ...cardStyle, background: "#fafafa" }}>
        <p style={{ fontWeight: 700, fontSize: 16, margin: "0 0 16px" }}>📊 Your Scores</p>
        {feedback.scores && Object.entries(feedback.scores).map(([key, val]) => (
          <div key={key} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
              <span>{key}</span><span>{val}/10</span>
            </div>
            <ScoreBar score={val} />
          </div>
        ))}
        {feedback.overall !== undefined && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #e5e7eb" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 700, marginBottom: 6 }}>
              <span>Overall</span><span>{feedback.overall}/10</span>
            </div>
            <ScoreBar score={feedback.overall} />
          </div>
        )}
      </div>

      {feedback.strengths && (
        <div style={{ ...cardStyle, background: "#f0fdf4", border: "1px solid #86efac" }}>
          <p style={{ fontWeight: 700, fontSize: 14, margin: "0 0 8px", color: "#166534" }}>✅ Strengths</p>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {feedback.strengths.map((s, i) => <li key={i} style={{ fontSize: 14, color: "#166534", marginBottom: 4 }}>{s}</li>)}
          </ul>
        </div>
      )}

      {feedback.improvements && (
        <div style={{ ...cardStyle, background: "#fef2f2", border: "1px solid #fca5a5" }}>
          <p style={{ fontWeight: 700, fontSize: 14, margin: "0 0 8px", color: "#991b1b" }}>🔧 Areas to Improve</p>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {feedback.improvements.map((s, i) => <li key={i} style={{ fontSize: 14, color: "#991b1b", marginBottom: 4 }}>{s}</li>)}
          </ul>
        </div>
      )}

      {feedback.comment && (
        <div style={{ ...cardStyle }}>
          <p style={{ fontWeight: 700, fontSize: 14, margin: "0 0 8px" }}>💬 Teacher Comment</p>
          <p style={{ fontSize: 14, color: "#374151", margin: 0, lineHeight: 1.6 }}>{feedback.comment}</p>
        </div>
      )}

      {draftCount !== undefined && requiredDrafts !== undefined && draftCount < requiredDrafts && (
        <div style={{ ...cardStyle, background: "#fefce8", border: "1px solid #fde68a", textAlign: "center" }}>
          <p style={{ fontSize: 14, color: "#78350f", margin: 0 }}>
            You need <strong>{requiredDrafts - draftCount} more draft{requiredDrafts - draftCount > 1 ? "s" : ""}</strong> before you can do a final submit. Use the feedback above to improve your essay.
          </p>
        </div>
      )}
    </div>
  );
}