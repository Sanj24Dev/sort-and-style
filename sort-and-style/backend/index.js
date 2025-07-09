const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { ObjectId } = require('mongodb');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your_secret_key';


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
let usersCollection;

async function startServer() {
    try {
        await client.connect();
        const db = client.db("closet");
        itemsCollection = db.collection("items");
        outfitsCollection = db.collection("outfits");
        listsCollection = db.collection("lists");
        usersCollection = db.collection("users");

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
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ error: 'Missing userId in query' });
        }

        const items = await itemsCollection.find({ userId }).toArray();
        res.json(items);
    } catch (err) {
        console.error("Error fetching items:", err);
        res.status(500).json({ error: 'Failed to fetch items' });
    }
});


// POST upload route
app.post('/items/upload', upload.single('photo'), async(req, res) => {
    try {
        const { name, category, userId } = req.body;
        const imageUrl = req.file.path;

        if (!userId) {
            return res.status(400).json({ error: 'Missing userId in request body' });
        }

        const newItem = { name, category, imageUrl, userId };

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
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ error: 'Missing userId in query' });
        }

        const objectId = new ObjectId(id);
        const { name, category, imageUrl } = req.body;

        if (!name || !category) {
            return res.status(400).json({ error: 'Missing required fields: name and category' });
        }

        // 🔍 Find item first
        const item = await itemsCollection.findOne({ _id: objectId });

        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }

        // 🔒 Check ownership
        if (item.userId !== userId) {
            return res.status(403).json({ error: 'Unauthorized: Item does not belong to user' });
        }

        // ✅ Perform update
        const updateFields = { name, category };
        if (imageUrl) {
            updateFields.imageUrl = imageUrl;
        }

        const result = await itemsCollection.updateOne({ _id: objectId }, { $set: updateFields });

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Item not found (post-check)' });
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
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ error: 'Missing userId in query' });
        }

        const objectId = new ObjectId(id);

        // 🛑 Check if the item belongs to the user
        const item = await itemsCollection.findOne({ _id: objectId });

        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }

        if (item.userId !== userId) {
            return res.status(403).json({ error: 'Unauthorized: Item does not belong to user' });
        }

        // ✅ Proceed with deletion
        const result = await itemsCollection.deleteOne({ _id: objectId });

        if (result.deletedCount !== 1) {
            return res.status(404).json({ error: 'Item not found (post-check)' });
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
        const { userId } = req.query;
        const items = await outfitsCollection.find({ userId }).toArray();
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

app.post('/outfits/upload', async(req, res) => {
    try {
        const { category, items, userId } = req.body;
        // NO need to parse items here
        const newOutfit = {
            category,
            items,
            userId,
        };

        console.log(newOutfit); // Verify the structure

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
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ error: 'Missing userId in query' });
        }

        if (!category || !Array.isArray(items)) {
            return res.status(400).json({ error: 'Missing or invalid category/items' });
        }

        const outfit = await outfitsCollection.findOne({ _id: new ObjectId(id) });

        if (!outfit) {
            return res.status(404).json({ error: 'Outfit not found' });
        }

        // 🔒 Check ownership
        if (outfit.userId !== userId) {
            return res.status(403).json({ error: 'Unauthorized: Item does not belong to user' });
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
        const { userId } = req.query;
        const items = await listsCollection.find({ userId }).toArray();
        res.json(items);
    } catch (err) {
        console.error("Error fetching items:", err);
        res.status(500).json({ error: 'Failed to fetch items' });
    }
});


app.post('/lists/upload', async(req, res) => {
    try {
        const { name, items, userId } = req.body;

        // NO need to parse items here
        const newList = {
            name,
            items,
            userId,
        };

        console.log(newList); // Verify the structure

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
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ error: 'Missing userId in query' });
        }

        if (!Array.isArray(items)) {
            return res.status(400).json({ error: 'Invalid items format' });
        }

        const list = await listsCollection.findOne({ _id: new ObjectId(id) });

        if (!list) {
            return res.status(404).json({ error: 'List not found' });
        }

        // 🔒 Check ownership
        if (list.userId !== userId) {
            return res.status(403).json({ error: 'Unauthorized: List does not belong to user' });
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




app.post('/register', async(req, res) => {
    try {
        const { name, photoUri, email, password } = req.body;
        const user = { name, photoUri, email, password };
        await usersCollection.insertOne(user);
        // const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token });
    } catch (err) {
        res.status(400).json({ error: 'User already exists or invalid input' });
    }
});


app.post('/login', async(req, res) => {
    const { email, password } = req.body;
    const user = await usersCollection.findOne({ email });
    if (!user || password != user.password) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ name: user.name, email, pfp: user.photoUri, userId: user._id });
});

app.delete('/users/:userId', async(req, res) => {
    const { userId } = req.params;

    try {
        if (!userId) {
            return res.status(400).json({ error: 'Missing userId' });
        }
        const userObjectId = new ObjectId(userId);
        const userResult = await usersCollection.deleteOne({ _id: userObjectId });

        const itemsResult = await itemsCollection.deleteMany({ userId });
        const outfitsResult = await outfitsCollection.deleteMany({ userId });
        const listsResult = await listsCollection.deleteMany({ userId });

        return res.status(200).json({
            message: 'User account and all associated data deleted',
            itemsDeleted: itemsResult.deletedCount,
            outfitsDeleted: outfitsResult.deletedCount,
            listsDeleted: listsResult.deletedCount,
            userDeleted: userResult.deletedCount
        });

    } catch (err) {
        console.error('Account deletion failed:', err);
        return res.status(500).json({ error: 'Failed to delete account' });
    }
});




startServer();