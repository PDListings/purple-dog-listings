
import React, { useState } from "react";
import axios from "axios";

const ImageEditor = () => {
  const [image, setImage] = useState(null);
  const [category, setCategory] = useState("interior");
  const [style, setStyle] = useState("modern");
  const [roomType, setRoomType] = useState("living room");
  const [features, setFeatures] = useState("");
  const [resultUrl, setResultUrl] = useState("");

  const handleSubmit = async () => {
    console.log("🔁 Submit clicked");

    if (!image) {
      alert("Please upload an image first.");
      return;
    }

    const formData = new FormData();
    formData.append("image", image);
    formData.append("category", category);
    formData.append("style", style);
    formData.append("roomType", roomType);
    formData.append("features", JSON.stringify(features.split(",")));

    console.log("🖼️ File:", image);
    console.log("📦 FormData ready");

    try {
      const response = await axios.post("/api/generate", formData);
      console.log("✅ AI response:", response.data);
      setResultUrl(response.data.url);
    } catch (err) {
      console.error("❌ Error generating image:", err);
      alert("Something went wrong while generating the image.");
    }
  };

  return (
    <div>
      <h1>Purple Dog Listings - AI Editor</h1>
      <input type="file" onChange={(e) => setImage(e.target.files[0])} />
      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        <option value="interior">Interior</option>
        <option value="exterior">Exterior</option>
      </select>
      <input
        type="text"
        placeholder="Style"
        value={style}
        onChange={(e) => setStyle(e.target.value)}
      />
      <input
        type="text"
        placeholder="Room Type"
        value={roomType}
        onChange={(e) => setRoomType(e.target.value)}
      />
      <input
        type="text"
        placeholder="Features (comma-separated)"
        value={features}
        onChange={(e) => setFeatures(e.target.value)}
      />
      <button onClick={handleSubmit}>Generate AI Edited Image</button>
      {resultUrl && <img src={resultUrl} alt="AI Edited Result" />}
    </div>
  );
};

export default ImageEditor;
