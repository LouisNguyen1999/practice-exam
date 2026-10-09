import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Test from "./pages/Test";
import Result from "./pages/Result";
import QuestionBank from "./pages/QuestionBank";
import History from "./pages/History";
import Practice from "./pages/Practice";
import { loadQuestionBank } from "./data/questionBank";

export default function App() {
  const [bankState, setBankState] = useState({
    loading: true,
    questions: [],
    sources: [],
    error: null
  });

  useEffect(() => {
    loadQuestionBank()
      .then((result) => setBankState({ loading: false, ...result, error: null }))
      .catch((error) =>
        setBankState({
          loading: false,
          questions: [],
          sources: [],
          error: error?.message || "Cannot load question bank."
        })
      );
  }, []);

  return (
    <Layout bankState={bankState}>
      {bankState.loading ? (
        <div className="page-center">
          <div className="loader" />
          <p>Loading question bank...</p>
        </div>
      ) : bankState.error ? (
        <div className="page-center">
          <div className="error-card">
            <h2>Could not load questions</h2>
            <p>{bankState.error}</p>
            <p className="muted">
              Put your .docx files inside <code>src/data/documents/</code> and restart Vite.
            </p>
          </div>
        </div>
      ) : (
        <Routes>
          <Route path="/" element={<Home bank={bankState} />} />
          <Route path="/test" element={<Test bank={bankState} />} />
          <Route path="/result" element={<Result bank={bankState} />} />
          <Route path="/questions" element={<QuestionBank bank={bankState} />} />
          <Route path="/practice" element={<Practice bank={bankState} />} />
          <Route path="/history" element={<History />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}
    </Layout>
  );
}
