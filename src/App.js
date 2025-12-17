import * as d3 from "d3";
import { useEffect, useState } from "react";
import ScoreHistogram from "./charts/ScoreHistogram";
import StudyVsScoreScatter from "./charts/StudyVsScore";
import SleepHabitsBar from "./charts/SleepVsScore";
import AccessFactorsBar from "./charts/ResourcesVsScore";
import "./App.css";

function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sleepMode, setSleepMode] = useState("quality");
  const [factor, setFactor] = useState("internet_access");
  const [effortX, setEffortX] = useState("study_hours");

  useEffect(() => {
    d3.csv("/Exam_Score_Prediction.csv").then(csvData => {
      const cleanedData = csvData.map(d => ({
        student_id: +d.student_id,
        age: +d.age,
        gender: d.gender,
        course: d.course,
        study_hours: +d.study_hours,
        class_attendance: +d.class_attendance,
        internet_access: d.internet_access,
        sleep_hours: +d.sleep_hours,
        sleep_quality: d.sleep_quality,
        study_method: d.study_method,
        facility_rating: d.facility_rating,
        exam_difficulty: d.exam_difficulty,
        exam_score: +d.exam_score,
      }));

      console.log("Parsed row example:", cleanedData[0]);
      console.log("Rows loaded:", cleanedData.length);

      setData(cleanedData);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div>Loading data...</div>;
  }

  return (
    <div className="dashboard-grid">

      {/* Chart 1 */}
      <div className="chart-card">
        <h2>Exam Score Distribution</h2>
        <div className="chart-content">
          <div className="chart-viz">
            <ScoreHistogram data={data} binsCount={12} />
          </div>
          <div className="chart-story">
            <p>
              Exam scores are broadly distributed, with most students scoring in the
              mid-range. This suggests a mix of preparedness levels across the population
              rather than extreme outcomes.
            </p>
          </div>
        </div>
      </div>

      {/* Chart 2 */}
      <div className="chart-card">
        <h2>Student Engagement vs Exam Performance</h2>

        <label style={{ fontSize: 14 }}>
          Compare by{" "}
          <select value={effortX} onChange={e => setEffortX(e.target.value)}>
            <option value="study_hours">Study Hours</option>
            <option value="class_attendance">Class Attendance</option>
          </select>
        </label>

        <div className="chart-content">
          <div className="chart-viz">
            <StudyVsScoreScatter data={data} xField={effortX} />
          </div>

          <div className="chart-story">
            {effortX === "study_hours" && (
              <p>
                Students who spend more time studying generally achieve higher exam scores.
                While individual variation exists, the overall upward trend highlights the
                impact of sustained study effort.
              </p>
            )}

            {effortX === "class_attendance" && (
              <p>
                Class attendance shows limited impact on exam performance on its own.
                This suggests that simply being present in class is not sufficient to improve 
                scores unless it is paired with active studying and engagement outside the 
                classroom.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Chart 3 */}
      <div className="chart-card">
        <h2>Sleep Habits vs Exam Score</h2>

        <label style={{ fontSize: 14 }}>
          Compare by{" "}
          <select value={sleepMode} onChange={e => setSleepMode(e.target.value)}>
            <option value="quality">Sleep Quality</option>
            <option value="hours">Sleep Hours</option>
          </select>
        </label>

        <div className="chart-content">
          <div className="chart-viz">
            <SleepHabitsBar data={data} mode={sleepMode} />
          </div>
          <div className="chart-story">
            <p>
              Students reporting better sleep quality or healthier sleep durations tend to
              perform better on exams. This highlights sleep as an important contributor
              to academic success.
            </p>
          </div>
        </div>
      </div>

      {/* Chart 4 */}
      <div className="chart-card">
        <h2>Learning Resources & Study Context</h2>
        <label style={{ fontSize: 14 }}>
          Compare by{" "}
          <select value={factor} onChange={e => setFactor(e.target.value)}>
            <option value="internet_access">Internet Access</option>
            <option value="study_method">Study Method</option>
            <option value="facility_rating">Facility Rating</option>
          </select>
        </label>
        <div className="chart-content">
          <div className="chart-viz">
            <AccessFactorsBar data={data} factor={factor} />
          </div>
          <div className="chart-story">
            {factor === "internet_access" && (
              <p>
                Students with reliable internet access tend to achieve the same exam scores as
                those without, suggesting that internet access alone may not be an important determinant
                of academic performance.
              </p>
            )}

            {factor === "study_method" && (
              <p>
                Certain study methods are associated with stronger academic outcomes, suggesting
                that how students study can be just as important as how long they study.
              </p>
            )}

            {factor === "facility_rating" && (
              <p>
                Higher-rated educational facilities correspond with improved exam performance,
                indicating that learning environments can meaningfully influence student success.
              </p>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}

export default App;
