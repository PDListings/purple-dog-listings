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
    const formData = new FormData();
    formData.append("image", image);
    formData.append("category", category);
    formData.append("style", style);
    formData.append("roomType", roomType);
    formData.append("features", JSON.stringify(features.split(",")));

    const response = await axios.post("http://localhost:5000/edit-home-image", formData);
    setResultUrl(response.data.url);
  };

  return (
    <div>
      <input type="file" onChange={(e) => setImage(e.target.files[0])} />
      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        <option value="interior">Interior</option>
        <option value="exterior">Exterior</option>
      </select>
      <input type="text" placeholder="Style" value={style} onChange={(e) => setStyle(e.target.value)} />
      <input type="text" placeholder="Room Type" value={roomType} onChange={(e) => setRoomType(e.target.value)} />
      <input type="text" placeholder="Features (comma-separated)" value={features} onChange={(e) => setFeatures(e.target.value)} />
      <button onClick={handleSubmit}>Generate AI Edited Image</button>
      {resultUrl && <img src={resultUrl} alt="AI Edited Result" />}
    </div>
  );
};

export default ImageEditor;
