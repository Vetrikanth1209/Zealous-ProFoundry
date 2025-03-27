import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Container,
  Typography,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  CircularProgress,
  Alert,
} from "@mui/material";

const API_BASE_URL = "http://localhost:4000";

const McqTest = () => {
  const { testId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const testMcqIds = location.state?.testMcqIds || [];
  const [test_id, setTestId] = useState(""); // Test ID from API
  const [mcqs, setMcqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [score, setScore] = useState(0);
  const [userId, setUserId] = useState("");
  const [pocId, setPocId] = useState(""); // Store PoC ID

  // Fetch MCQs
  useEffect(() => {
    const fetchMcqs = async () => {
      try {
        const mcqResponses = await Promise.all(
          testMcqIds.map(async (mcqId) => {
            const res = await axios.get(`${API_BASE_URL}/mcq_gateway/mcq/get_mcq/${mcqId}`);
            return res.data;
          })
        );
        setMcqs(mcqResponses);
      } catch (err) {
        console.error("Error fetching MCQs:", err);
        setError("Failed to load questions.");
      }
      setLoading(false);
    };

    fetchMcqs();

    // Fetch user ID from session
    const storedUser = sessionStorage.getItem("true");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (user?.user?.user_id) {
          setUserId(user.user.user_id);
          fetchModuleAndPoc(user.user.user_id); // Fetch PoC ID
        }
      } catch (err) {
        console.error("Error parsing user data:", err);
      }
    }
  }, [testMcqIds]);

  // Fetch module and PoC data
  const fetchModuleAndPoc = async (userId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/poc_gateway/poc/mod_and_poc/${userId}`);
      if (response.data && response.data.mod_poc_id) {
        setPocId(response.data.mod_poc_id); // Store PoC ID
        setTestId(response.data.test_ids[0]); // Set first test ID

      }
    } catch (err) {
      console.error("Error fetching module and PoC:", err);
    }
  };

  // Handle answer selection
  const handleAnswerSelection = (answer) => {
    setSelectedAnswer(answer);
  };

  // Handle next question
  const handleNext = () => {
    if (selectedAnswer === mcqs[currentIndex].mcq_answer) {
      setScore((prev) => prev + 1);
    }
    setSelectedAnswer("");
    setCurrentIndex((prev) => prev + 1);
  };

  // Handle previous question
  const handlePrevious = () => {
    setCurrentIndex((prev) => prev - 1);
    setSelectedAnswer("");
  };

  // Handle submission
  const handleSubmit = async () => {
    if (selectedAnswer === mcqs[currentIndex].mcq_answer) {
      setScore((prev) => prev + 1);
    }

    const finalScore = score + (selectedAnswer === mcqs[currentIndex].mcq_answer ? 1 : 0);
    
    const resultData = {
      result_user_id: userId,
      result_test_id: test_id,
      result_score: finalScore,
      result_poc_id: pocId, // Correctly assigned PoC ID
    };

    try {
      await axios.post(`${API_BASE_URL}/mcq_gateway/mcq/submit_result`, resultData);
      alert("Test submitted successfully!");
      navigate("/test-modules");
    } catch (err) {
      console.error("Error submitting result:", err);
      alert("Failed to submit test.");
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Container maxWidth="md" sx={{ py: 5 }}>
      {mcqs.length > 0 && currentIndex < mcqs.length ? (
        <Box>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Question {currentIndex + 1} of {mcqs.length}
          </Typography>

          <Typography variant="h6" gutterBottom>{mcqs[currentIndex].mcq_question}</Typography>

          <RadioGroup value={selectedAnswer} onChange={(e) => handleAnswerSelection(e.target.value)}>
            {mcqs[currentIndex].mcq_options.map((option, idx) => (
              <FormControlLabel key={idx} value={option} control={<Radio />} label={option} />
            ))}
          </RadioGroup>

          <Box display="flex" justifyContent="space-between" mt={3}>
            <Button variant="contained" disabled={currentIndex === 0} onClick={handlePrevious}>
              Previous
            </Button>

            {currentIndex === mcqs.length - 1 ? (
              <Button variant="contained" color="success" onClick={handleSubmit}>
                Submit Test
              </Button>
            ) : (
              <Button variant="contained" onClick={handleNext} disabled={!selectedAnswer}>
                Next
              </Button>
            )}
          </Box>
        </Box>
      ) : (
        <Typography variant="h6">No MCQs found for this test.</Typography>
      )}
    </Container>
  );
};

export default McqTest;
