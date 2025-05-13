import React, { useState } from "react";
import axios from "axios";

const ImageEditor = () => {
  const [image, setImage] = useState(null);
  const [style, setStyle] = useState("modern");
  const [category, setCategory] = useState("interior");
  const [roomType, setRoomType] = useState("living room");
  const [features, setFeatures] = useState("");
  const [aiUrl, setAiUrl] = useState("");
  const [originalUrl, setOriginalUrl] = useState("");
  const [promptUsed, setPromptUsed] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const imageStyle = {
    maxWidth: "100%",
    border: "1px solid #ccc",
    borderRadius: "8px",
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ["image/png", "image/jpeg"];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!allowedTypes.includes(file.type)) {
        alert("Only PNG and JPEG files are allowed.");
        return;
      }

      if (file.size > maxSize) {
        alert("File size exceeds 5MB.");
        return;
      }

      setImage(file);
    }
  };

  const handleGenerate = async () => {
    if (!image) {
      alert("Please upload an image.");
      return;
    }

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("image", image);
    formData.append("style", style);
    formData.append("category", category);
    formData.append("roomType", roomType);
    formData.append(
      "features",
      features ? JSON.stringify(features.split(",").map((f) => f.trim())) : "[]"
    );

    try {
      const response = await axios.post("/api/images/generate", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("✅ Backend response:", response.data);

      setAiUrl(response.data.aiGeneratedUrl);
      setOriginalUrl(response.data.uploadedUrl);
      setPromptUsed(response.data.prompt);
    } catch (err) {
      console.error("Image generation failed:", err);
      setError("An error occurred while generating the image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setImage(null);
    setStyle("modern");
    setCategory("interior");
    setRoomType("living room");
    setFeatures("");
    setAiUrl("");
    setOriginalUrl("");
    setPromptUsed("");
    setError("");
  };

  return (
    <div className="space-y-4 p-4">
      <label>
        Upload an image:
        <input type="file" onChange={handleFileChange} aria-label="Upload an image" />
      </label>
      <label>
        Style:
        <input
          type="text"
          placeholder="Style"
          value={style}
          onChange={(e) => setStyle(e.target.value)}
          aria-label="Style"
        />
      </label>
      <label>
        Category:
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Category"
        >
          <option value="interior">Interior</option>
          <option value="exterior">Exterior</option>
        </select>
      </label>
      <label>
        Room Type:
        <input
          type="text"
          placeholder="Room Type"
          value={roomType}
          onChange={(e) => setRoomType(e.target.value)}
          aria-label="Room Type"
        />
      </label>
      <label>
        Features (comma separated):
        <input
          type="text"
          placeholder="Features"
          value={features}
          onChange={(e) => setFeatures(e.target.value)}
          aria-label="Features"
        />
      </label>
      <button onClick={handleGenerate} disabled={loading}>
        {loading ? "Generating..." : "Generate"}
      </button>
      <button onClick={handleReset}>Reset</button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {aiUrl && (
        <div>
          <h3>AI Generated Image:</h3>
          <img src={aiUrl} alt="AI Edited" style={imageStyle} />
          <p>
            <strong>URL:</strong>{" "}
            <a href={aiUrl} target="_blank" rel="noopener noreferrer">
              {aiUrl}
            </a>
          </p>
        </div>
      )}

      {originalUrl && (
        <div>
          <h3>Original Uploaded Image:</h3>
          <img src={originalUrl} alt="Original Upload" style={imageStyle} />
        </div>
      )}

      {promptUsed && (
        <p>
          <strong>Prompt used:</strong> {promptUsed}
        </p>
      )}
    </div>
  );
};

export default ImageEditor;