# Sort & Style 👗

**Sort & Style** is a dynamic closet inventory and outfit planning app built with **React Native**, **JavaScript**, and **MongoDB**. Designed for users who want to organize their wardrobe efficiently, this app enables users to upload photos of closet items, categorize them, and create outfits, packing lists, and visual moodboards.

## 🛠 Tech Stack

- **Frontend**: React Native (Expo)
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (via Mongoose)
- **Cloud**: Cloudinary for saving images


## 🚀 Features

### Closet Item Management
- Add clothing items with a name, image, and custom category.
- Dynamically create and assign new categories (e.g., tops, shoes, accessories).

### Outfit Creation
- Combine existing clothing items into an outfit.
- Store outfits for future use, or styling under different categories (e.g., beach, formal).

### Packing Lists
- Create and save packing lists using existing closet items.
- Useful for travel or event preparation.

### Wishlists
- Build a wishlist and digital moodboards with:
  - Your saved outfits
  - External image or inspiration links
- Visual planning for seasons, events, or fashion goals.


## 📦 Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Sanj24Dev/sort-and-style.git
   cd sort-and-style/sort-and-style
   ```
2. Install dependencies
   ```bash
   npm install
   ```
3. Run the backend server in another terminal
    ```bash
    cd backend
    npm install
    node index.js
    ```
3. Start development server in sort-and-style/sort-and-style
    ```bash
    npx expo start
    ```

## 📡 API Endpoints
Basic API structure (secured with authentication):
* POST /items – Add a new closet item
* GET /items – Fetch all items
* DELETE /items – Delete an item
* POST /outfits – Create a new outfit
* GET /outfits – Get saved outfits
* DELETE /outfits – Delete an outfit
* POST /packing-lists – Create packing lists
* GET /packing-lists – Get all packing lists
* PUT /packing-lists – Update a packing list
* DELETE /packing-lists – Delete a packing list
* POST /moodboards – Save visual boards with outfit IDs and URLs
* POST /register - Add a new user
* POST /login - Login a user
* DELETE /user - Dele the user and their data

## 🎥 Demo
Check out the [demo video](./demo.mp4) to view the features of the **Sort & Style** app.


## 🤝 Contributing
Feel free to fork the repo and submit a pull request. For major changes, open an issue first to discuss the feature or fix.
