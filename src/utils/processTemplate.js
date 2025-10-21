import fs from "fs/promises";

const processTemplate = async (templatePath, replacements) => {
  try {
    let content = await fs.readFile(templatePath, "utf-8");
    for (const [key, value] of Object.entries(replacements)) {
      content = content.replaceAll(`{{${key}}}`, value);
    }
    return content;
  } catch (err) {
    console.error("Template processing error:", err.message);
    throw err;
  }
};

export default processTemplate;
