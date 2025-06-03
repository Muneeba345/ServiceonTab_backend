const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const AddService = require("../models/addservice"); // ✅ Correct Model

//  SEARCH route - placed first
router.get("/search", async (req, res) => {
    const query = req.query.query;

    if (!query) {
        return res.status(400).json({ success: false, message: "Query parameter is required" });
    }

    try {
        const services = await AddService.find({
            name: { $regex: query, $options: "i" } // Case-insensitive search
        });

        res.json({ success: true, services });
    } catch (error) {
        console.error("Error searching services:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

// GET by ID route - placed after search
router.get("/:id", async (req, res) => {
    console.log("Received ID:", req.params.id);

    try {
        const service = await AddService.findById(req.params.id);

        if (!service) {
            console.log("Service Not Found");
            return res.status(404).json({ success: false, message: "Service Not Found" });
        }

        res.json({ success: true, service });
    } catch (error) {
        console.error("Error fetching service:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

module.exports = router;
