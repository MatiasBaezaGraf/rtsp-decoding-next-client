import fs from "fs";
import path from "path";

export default function handler(req, res) {
	if (req.method === "GET") {
		try {
			const filePath = "public/data/cameras.json";
			const jsonData = fs.readFileSync(filePath, "utf-8");
			const data = JSON.parse(jsonData);

			res.status(200).json(data);
		} catch (error) {
			console.error(error);
			res.status(500).json({ error: "Error reading JSON file" });
		}
	} else if (req.method === "POST") {
		try {
			const filePath = path.join(process.cwd(), "public/data/cameras.json");
			const data = req.body;

			fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

			res.status(200).json({ message: "Cameras set/updated successfully" });
		} catch (error) {
			console.error(error);
			res.status(500).json({ message: "Error updating cameras" });
		}
	} else {
		res.status(405).send("Method not allowed");
	}
}
