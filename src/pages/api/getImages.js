import fs from "fs";
import path from "path";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "50mb", // Accept more than 10mb
    },
  },
};

export const getImages = () => {
  const imagesDirectory = path.join(process.cwd(), "public/color_game/images");

  // Read all files from the directory
  const filenames = fs.readdirSync(imagesDirectory);

  // Lowercase the filenames, filter out non-image files if necessary, and map to image objects
  const imageObjects = filenames.map((filename, index) => {
    const [color, name] = filename.toLowerCase().split("-");
    return {
      id: index + 1,
      image: `/color_game/images/${filename.toLowerCase()}`,
      color,
      name: name ? name.replace(".png", "") : "",
    };
  });

  return imageObjects;
};

export default function handler(req, res) {
  if (req.method === "GET") {
    const images = getImages();
    res.status(200).json(images);
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
