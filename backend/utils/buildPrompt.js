// backend/utils/buildPrompt.js

const promptTemplates = {
  interior: (style, roomType, features) =>
    `Create a ${style} interior design for a ${roomType} with features like ${features.join(", ")}.`,

  exterior: (style, roomType, features) =>
    `Design a ${style} exterior appearance for the ${roomType} with ${features.join(", ")}.`,

  landscape: (style, roomType, features) =>
    `Generate a ${style} landscape layout around the ${roomType}, including ${features.join(", ")}.`,

  staging: (style, roomType, features) =>
    `Virtually stage the ${roomType} in a ${style} style, incorporating elements such as ${features.join(", ")}.`,

  renovation: (style, roomType, features) =>
    `Visualize a ${style} renovation for the ${roomType} using features like ${features.join(", ")}.`
};

export function buildPrompt({ style, category, roomType, features }) {
  const generator = promptTemplates[category] || promptTemplates["interior"];
  return generator(style || "modern", roomType || "living room", features || ["natural light"]);
}