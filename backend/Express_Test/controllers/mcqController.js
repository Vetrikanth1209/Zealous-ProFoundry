const express = require('express');
const MCQ = require('../models/MCQ');
const Consul = require("consul");
const consul = new Consul();
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");

const router = express.Router();

// Add multiple MCQs
router.post('/add_mcq', async (req, res) => {
    try {
        let mcqs = req.body; // Expecting an array of MCQs or a single object

        // Convert to an array if a single object is received
        if (!Array.isArray(mcqs)) {
            mcqs = [mcqs];
        }

        // Extract all questions to check for duplicates
        const mcqQuestions = mcqs.map(mcq => mcq.mcq_question);

        // Check if any of the questions already exist
        const existingMcqs = await MCQ.find({ mcq_question: { $in: mcqQuestions } });
        const existingQuestions = existingMcqs.map(mcq => mcq.mcq_question);

        // Filter out duplicates
        const newMcqs = mcqs.filter(mcq => !existingQuestions.includes(mcq.mcq_question));

        if (newMcqs.length === 0) {
            return res.status(400).json({ error: "All questions already exist. No new MCQs added." });
        }

        // Insert non-duplicate MCQs
        const savedMcqs = await MCQ.insertMany(newMcqs);

        res.status(201).json({
            message: `${savedMcqs.length} MCQ(s) added successfully`,
            mcqs: savedMcqs
        });

    } catch (error) {
        console.error("Error adding MCQs:", error);
        res.status(500).json({ error: error.message });
    }
});


// Get all MCQs
router.get('/get_all_mcqs', async (req, res) => {
    try {
        const mcqs = await MCQ.find({});
        res.status(200).json(mcqs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get a single MCQ by ID
router.get('/get_mcq/:mcq_id', async (req, res) => {
    try {
        const { mcq_id } = req.params;
        const mcq = await MCQ.findOne({ mcq_id });

        if (!mcq) {
            return res.status(404).json({ message: `No MCQ found with mcq_id: ${mcq_id}` });
        }

        res.status(200).json(mcq);
    } catch (error) {
        console.error("Error fetching MCQ:", error);
        res.status(500).json({ error: error.message });
    }
});

router.put('/test/update', async (req, res) => {
    try {
        const { test_id, mcq_id } = req.body;

        if (!test_id) {
            return res.status(400).json({ error: "test_id is required" });
        }

        const updatedTest = await Test.findOneAndUpdate(
            { test_id },
            { test_mcq_id: mcq_id },  // Only updating mcq_id
            { new: true }
        );

        if (!updatedTest) {
            return res.status(404).json({ error: "Test not found" });
        }

        res.status(200).json({ message: "Test updated successfully", test: updatedTest });
    } catch (error) {
        console.error("Update Test Error:", error);
        res.status(500).json({ error: error.message });
    }
});


// router.post("/submit_result", async (req, res) => {
//   try {
//     const { result_user_id, result_test_id, result_score, result_poc_id, result_id } = req.body;

//     // Fetch service details from Consul
//     const serviceName = "Express_Report";
//     const services = await consul.catalog.service.nodes(serviceName);
    
//     console.log("🔍 Retrieved services from Consul:", services); // Log Consul services

//     if (!services || services.length === 0) {
//       console.error("❌ No available service instances found in Consul");
//       return res.status(500).json({ message: "No available service instances found in Consul" });
//     }

//     // Use the first available service instance
//     const { ServiceAddress, ServicePort } = services[0];

//     console.log(`📡 Target Service: ${ServiceAddress}:${ServicePort}`); // Log target URL

//     if (!ServiceAddress || !ServicePort) {
//       console.error("❌ Invalid service details from Consul:", services[0]);
//       return res.status(500).json({ message: "Invalid service details from Consul" });
//     }

//     const targetUrl = `http://${ServiceAddress}:${ServicePort}/results/post-result`;
//     console.log(`🚀 Sending request to: ${targetUrl}`); // Log the exact request URL

//     // Send the result data to the external service
//     const response = await axios.post(targetUrl, {
//       result_id: result_id || uuidv4(),
//       result_user_id,
//       result_test_id,
//       result_score,
//       result_poc_id,
//     });

//     console.log("✅ Response from external service:", response.data); // Log response

//     res.status(200).json({
//       message: "✅ Result sent successfully to external service",
//       response: response.data,
//     });

//   } catch (error) {
//     console.error("❌ Error sending result to external service:", error.message);

//     if (error.response) {
//       console.error("⚠️ Response Data:", error.response.data);
//       console.error("⚠️ Response Status:", error.response.status);
//     }

//     res.status(500).json({ 
//       message: "Error sending result", 
//       error: error.message 
//     });
//   }
// });

router.post("/submit_result", async (req, res) => {
    try {
      let { result_user_id, result_test_id, result_score, result_total_score, result_poc_id, result_id } = req.body;
  
      // ✅ Ensure valid values
      result_id = result_id || uuidv4();
      result_user_id = result_user_id || "unknown_user";
      result_test_id = result_test_id || "unknown_test";
      result_score = result_score ?? 0;
  
      // ✅ Ensure `result_total_score` is a **valid number**
      if (result_total_score === undefined || result_total_score === null) {
        console.error("❌ result_total_score is undefined or null!");
        return res.status(400).json({ message: "result_total_score is required", value: result_total_score });
      }
  
      result_total_score = Number(result_total_score);
      if (isNaN(result_total_score)) {
        console.error("❌ result_total_score is NaN!");
        return res.status(400).json({ message: "Invalid result_total_score", value: result_total_score });
      }
  
      result_poc_id = result_poc_id || "unknown_poc";
  
      console.log("📨 Received result data (Before Sending):", {
        result_id,
        result_user_id,
        result_test_id,
        result_score,
        result_total_score,
        result_poc_id,
      });
  
      // ✅ Forward the request to the result service
      const targetUrl = "http://localhost:9000/results/post-result";
      console.log(`🚀 Sending request to: ${targetUrl}`);
  
      const response = await axios.post(targetUrl, {
        result_id,
        result_user_id,
        result_test_id,
        result_score,
        result_total_score,
        result_poc_id,
      });
  
      console.log("✅ Response from external service:", response.data);
      res.status(200).json({ message: "✅ Result sent successfully", response: response.data });
  
    } catch (error) {
      console.error("❌ Error sending result:", error.message);
  
      if (error.response) {
        console.error("⚠️ Full Axios Error Response:", JSON.stringify(error.response.data, null, 2));
      }
  
      res.status(500).json({
        message: "Error sending result",
        error: error.response ? error.response.data : error.message,
      });
    }
  });

// GET /mcq/ids - Fetch only mcq_id values
router.get('/mcq/ids', async (req, res) => {
    try {
        const mcqIds = await MCQ.find({}, 'mcq_id'); // Fetch only mcq_id field
        res.status(200).json(mcqIds.map(mcq => mcq.mcq_id)); // Send as array of IDs
    } catch (error) {
        console.error("Error fetching MCQ IDs:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
  
  
  



module.exports = router;
