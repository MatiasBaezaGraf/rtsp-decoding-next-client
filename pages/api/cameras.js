import fs from "fs";
import path from "path";

export default function handler(req, res) {
	const filePath = path.join(process.cwd(), "public/data/cameras.txt");

	if (req.method === "GET") {
		// Handle GET request to read the cameras file
		try {
			const fileContent = fs.readFileSync(filePath, "utf-8");
			const camerasString = fileContent.trim(); // Remove any leading/trailing white spaces
			const camerasArray = camerasString
				.split(",")
				.map((camera) => camera.trim());
			res.status(200).json({ cameras: camerasArray });
		} catch (error) {
			console.error(error);
			res.status(500).json({ error: "Failed to read cameras file" });
		}
	} else if (req.method === "POST") {
		// Handle POST request to update the cameras file
		const { cameras } = req.body;

		try {
			const fileContent = cameras.join(",");
			fs.writeFileSync(filePath, fileContent, "utf-8");
			res.status(200).json({ message: "Cameras file updated successfully" });
		} catch (error) {
			console.error(error);
			res.status(500).json({ error: "Failed to write cameras file" });
		}
	} else {
		res.status(405).json({ error: "Method not allowed" });
	}
}
