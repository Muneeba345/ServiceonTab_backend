const express = require('express');
const router = express.Router();
const Favorite = require('../models/faavorite');
const AddService = require('../models/addservice');



router.post('/add', async (req, res) => {
    try {
        const {  userEmail, serviceId } = req.body;
        if (!userEmail || !serviceId) {
            return res.status(400).json({ success: false, message: "userEmail and serviceId are required." });
        }


     
        const existingFavorite = await Favorite.findOne({ userEmail, addservice: serviceId });
        if (existingFavorite) return res.status(400).json({ message: 'Already in favorites' });

       
        const favorite = new Favorite({ userEmail, addservice: serviceId });
        await favorite.save();

        res.status(201).json({ success: true, message: 'Added to favorites', favorite });
    } catch (error) {
        console.error('Error adding favorite:', error);
        res.status(500).json({ message: 'Error adding favorite', error });
    }
});


router.get('/get/:email', async (req, res) => {
    try {
        const { email } = req.params;
        console.log("Fetching favorites for email:", email); 

        if (!email) {
            return res.status(400).json({ success: false, message: "Email is required" });
        }

        // Fetch user's favorite services
        const favorites = await Favorite.find({ userEmail: email }).populate({
            path: 'addservice',
            select: 'name estimatedCharges type picture'
        });

        if (!favorites || favorites.length === 0) {
            return res.status(404).json({ success: false, message: 'No favorite services found' });
        }

        console.log("Favorites fetched:", favorites); 

        //  Send formatted response
        const services = favorites.map(fav => ({
            _id: fav.addservice?._id,
            name: fav.addservice?.name,
            estimatedCharges: fav.addservice?.estimatedCharges,
            type: fav.addservice?.type,
            picture: fav.addservice?.picture
        }));

        return res.status(200).json({ success: true, services });
    } catch (error) {
        console.error("Error fetching favorites:", error); //  Debugging Error
        return res.status(500).json({ success: false, message: "Error fetching favorites", error: error.message });
    }
});


router.delete('/remove/:email/:serviceId', async (req, res) => {
    try {
        const { email, serviceId } = req.params;

        
        const result = await Favorite.findOneAndDelete({ userEmail: email, addservice: serviceId });

        if (!result) return res.status(404).json({ message: 'Favorite not found' });

        res.status(200).json({ success: true, message: 'Removed from favorites' });
    } catch (error) {
        console.error('Error removing favorite:', error);
        res.status(500).json({ message: 'Error removing favorite', error });
    }
});

module.exports = router;
