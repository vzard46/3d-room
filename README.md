# Interactive 3D Room Portfolio

An immersive, interactive 3D portfolio website built with **Three.js**, **GSAP**, and **Vite**.

## 🎮 Features
- **3D Interactive Room**: Explore a developer's workspace in 3D.
- **Raycasting Interaction**: Click on objects (Laptop, Frames, etc.) to trigger actions.
- **Glassmorphism UI**: Modern, clean popup overlays.
- **Smooth Animations**: Powered by GSAP for camera movements and object feedback.
- **Responsive**: Adapts to desktop and mobile screens.

## 🚀 Getting Started

### 1. Installation
This project uses Node.js and Vite.

```bash
npm install
```

### 2. Run Locally
Start the development server:

```bash
npm run dev
```
Open the local URL provided (usually `http://localhost:5173`).

### 3. Customization

#### 3D Model
- Replace the model file at `/public/portfolio_room.glb` with your own.
- Ensure the file is a valid `.glb` (glTF binary).

#### Connecting Objects
To make your specific 3D objects interactive, you need to match their names in the code.
1. Run the project and open the **Browser Console** (F12).
2. Click on an object in the 3D scene.
3. Look for the log: `Clicked Object Name: <Name>`.
4. Open `main.js` and update the `interactables` array with these exact names:

```javascript
const interactables = [
    { name: "My_Laptop_Mesh_Name", action: "section", target: "about-me", label: "About Me" },
    // ...
];
```

## 🛠 Tech Stack
- **Three.js**: 3D Rendering
- **GSAP**: Animation Library
- **Vite**: Build Tool & Dev Server
