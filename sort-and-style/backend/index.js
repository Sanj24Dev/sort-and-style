const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { ObjectId } = require('mongodb');
require('dotenv').config();


const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Cloudinary Config
cloudinary.config({
    cloud_name: 'dwasyatyx',
    api_key: 264346711744428,
    api_secret: 'B7PJLm2mccvsTEdGKQQ6EE6nrSA',
});

// Cloudinary Storage using Multer
const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'closet_images',
        allowed_formats: ['jpg', 'jpeg', 'png'],
    },
});

const upload = multer({ storage });

// MongoDB Setup
const uri = "mongodb+srv://sanjanagn24:sanj@style-and-sort-db.quprgjm.mongodb.net/?retryWrites=true&w=majority&appName=style-and-sort-db";
const client = new MongoClient(uri);
let itemsCollection;
let outfitsCollection;
let listsCollection;

async function startServer() {
    try {
        await client.connect();
        const db = client.db("closet");
        itemsCollection = db.collection("items");
        outfitsCollection = db.collection("outfits");
        listsCollection = db.collection("lists");

        console.log("Connected to MongoDB");

        app.listen(port, '0.0.0.0', () => {
            console.log(`Server running on port ${port}`);
        });
    } catch (error) {
        console.error("MongoDB connection failed:", error);
    }
}

// GET all items
app.get('/items', async(req, res) => {
    try {
        const items = await itemsCollection.find({}).toArray();
        res.json(items);
    } catch (err) {
        console.error("Error fetching items:", err);
        res.status(500).json({ error: 'Failed to fetch items' });
    }
});

// POST upload route
app.post('/items/upload', upload.single('photo'), async(req, res) => {
    try {
        const { name, category } = req.body;
        const imageUrl = req.file.path;

        const newItem = { name, category, imageUrl };
        await itemsCollection.insertOne(newItem);

        res.status(201).json({ message: 'Item uploaded', item: newItem });
    } catch (err) {
        console.error('Upload failed:', err);
        res.status(500).json({ error: 'Upload failed' });
    }
});


app.put('/items/:id', multer().none(), async(req, res) => {
    try {
        const { id } = req.params;
        const objectId = new ObjectId(id);

        const { name, category, imageUrl } = req.body;

        if (!name || !category) {
            return res.status(400).json({ error: 'Missing required fields: name and category' });
        }

        const updateFields = {
            name,
            category,
        };

        if (imageUrl) {
            updateFields.imageUrl = imageUrl;
        }

        const result = await itemsCollection.updateOne({ _id: objectId }, { $set: updateFields });

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Item not found' });
        }

        res.status(200).json({ message: 'Item updated successfully' });

    } catch (err) {
        console.error('Update failed:', err);
        res.status(500).json({ error: 'Failed to update item' });
    }
});

app.delete('/items/:id', async(req, res) => {
    try {
        const { id } = req.params;
        const objectId = new ObjectId(id);

        const result = await itemsCollection.deleteOne({ _id: objectId });

        if (result.deletedCount !== 1) {
            return res.status(404).json({ error: 'Item not found' });
        }

        await outfitsCollection.updateMany({ items: id }, { $pull: { items: id } });

        const allLists = await listsCollection.find().toArray();

        for (const list of allLists) {
            const newItems = list.items.filter(([itemId, checked]) => {
                return !(itemId instanceof ObjectId && itemId.equals(objectId));
            });

            if (newItems.length !== list.items.length) {
                await listsCollection.updateOne({ _id: list._id }, { $set: { items: newItems } });
            }
        }


        const orphanedOutfits = await outfitsCollection.find({ items: { $size: 0 } }).toArray();
        const orphanedLists = await listsCollection.find({ items: { $size: 0 } }).toArray();

        if (orphanedOutfits.length > 0) {
            const orphanedIds = orphanedOutfits.map(outfit => outfit._id);
            await outfitsCollection.deleteMany({ _id: { $in: orphanedIds } });
        }

        if (orphanedLists.length > 0) {
            const orphanedListIds = orphanedLists.map(list => list._id);
            await listsCollection.deleteMany({ _id: { $in: orphanedListIds } });
        }

        // console.log('Deleted item', id);
        // console.log('Orphaned outfits:', orphanedOutfits.length);
        // console.log('Orphaned lists:', orphanedLists.length);

        return res.status(200).json({
            message: 'Item deleted successfully',
            outfitsDeleted: orphanedOutfits.length,
            listsDeleted: orphanedLists.length
        });

    } catch (err) {
        console.error('Delete failed:', err);
        return res.status(500).json({ error: 'Delete failed' });
    }
});


app.get('/outfits', async(req, res) => {
    try {
        const items = await outfitsCollection.find({}).toArray();
        res.json(items);
    } catch (err) {
        console.error("Error fetching items:", err);
        res.status(500).json({ error: 'Failed to fetch items' });
    }
});

app.delete('/outfits/:id', async(req, res) => {
    try {
        const { id } = req.params;
        const objectId = new ObjectId(id);

        // Step 1: Set items to empty array
        const updateResult = await outfitsCollection.updateOne({ _id: objectId }, { $set: { items: [] } });

        if (updateResult.matchedCount === 0) {
            return res.status(404).json({ error: 'Outfit not found' });
        }

        // Step 2: Delete the outfit
        const deleteResult = await outfitsCollection.deleteOne({ _id: objectId });

        if (deleteResult.deletedCount === 1) {
            res.status(200).json({ message: 'Outfit emptied and deleted successfully' });
        } else {
            res.status(500).json({ error: 'Failed to delete outfit after clearing items' });
        }
    } catch (err) {
        console.error('Failed to delete outfit:', err);
        res.status(500).json({ error: 'Failed to delete outfit' });
    }
});

app.post('/outfits/upload', multer().none(), async(req, res) => {
    try {
        const { category, items } = req.body;
        const parsedItems = JSON.parse(items);

        const newOutfit = {
            category,
            items: parsedItems,
        };

        await outfitsCollection.insertOne(newOutfit);

        res.status(201).json({ message: 'Outfit uploaded', outfit: newOutfit });
    } catch (err) {
        console.error('Upload failed:', err);
        res.status(500).json({ error: 'Upload failed' });
    }
});

app.put('/outfits/:id', async(req, res) => {
    try {
        const { id } = req.params;
        const { category, items } = req.body;

        if (!category || !Array.isArray(items)) {
            return res.status(400).json({ error: 'Missing or invalid category/items' });
        }

        const result = await outfitsCollection.updateOne({ _id: new ObjectId(id) }, { $set: { category, items } });

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Outfit not found' });
        }

        return res.status(200).json({ message: 'Outfit updated successfully' });

    } catch (err) {
        console.error('PUT /outfits/:id failed:', err);
        return res.status(500).json({ error: 'Update failed' });
    }
});


app.get('/lists', async(req, res) => {
    try {
        const items = await listsCollection.find({}).toArray();
        res.json(items);
    } catch (err) {
        console.error("Error fetching items:", err);
        res.status(500).json({ error: 'Failed to fetch items' });
    }
});


app.post('/lists/upload', multer().none(), async(req, res) => {
    try {
        const { name, items } = req.body;

        const parsedItems = JSON.parse(items); // items: [["itemId", true], ...]

        const formattedItems = parsedItems.map(([id, checked]) => [
            new ObjectId(id),
            checked
        ]);

        const newList = {
            name,
            items: formattedItems
        };

        await listsCollection.insertOne(newList);

        res.status(201).json({ message: 'List uploaded', list: newList });
    } catch (err) {
        console.error('Upload failed:', err);
        res.status(500).json({ error: 'Upload failed' });
    }
});


app.put('/lists/:id', async(req, res) => {
    try {
        const { id } = req.params;
        const { items } = req.body; // expected format: [[stringId, true], [stringId, false]]

        if (!Array.isArray(items)) {
            return res.status(400).json({ error: 'Invalid items format' });
        }

        const formattedItems = items.map(([idStr, checked]) => [
            new ObjectId(idStr), !!checked
        ]);

        const result = await listsCollection.updateOne({ _id: new ObjectId(id) }, { $set: { items: formattedItems } });

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'List not found' });
        }

        if (result.modifiedCount === 1) {
            return res.json({ message: 'List updated successfully' });
        } else {
            return res.status(200).json({ message: 'List unchanged (no modifications)' });
        }

    } catch (err) {
        console.error('Update failed:', err);
        return res.status(500).json({ error: 'Failed to update list' });
    }
});



app.delete('/lists/:id', async(req, res) => {
    try {
        const { id } = req.params;
        const objectId = new ObjectId(id);

        const result = await listsCollection.deleteOne({ _id: objectId });

        if (result.deletedCount !== 1) {
            return res.status(404).json({ error: 'Item not found' });
        }

        return res.status(200).json({
            message: 'Item deleted successfully'
        });

    } catch (err) {
        console.error('Delete failed:', err);
        return res.status(500).json({ error: 'Delete failed' });
    }
});



startServer();