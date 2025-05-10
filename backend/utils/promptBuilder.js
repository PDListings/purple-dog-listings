function generatePrompt({ category, style, roomType, features }) {
  const featuresText = features?.length ? \`Include features such as \${features.join(", ")}.\` : "";

  if (category === "exterior") {
    return \`
      You are an AI landscape designer. Enhance the exterior of this home with a \${style} style.
      Make realistic improvements to landscaping, pathways, garden, and lighting.
      \${featuresText}
      Ensure results are photorealistic and appealing for real estate listings.
    \`;
  }

  if (category === "interior") {
    return \`
      You are an AI interior designer. Redesign the \${roomType} with a \${style} aesthetic.
      Add suitable furniture, lighting, and decor.
      \${featuresText}
      Focus on creating a visually appealing design for home buyers.
    \`;
  }

  return "Enhance the photo with realistic real estate improvements.";
}

module.exports = { generatePrompt };
