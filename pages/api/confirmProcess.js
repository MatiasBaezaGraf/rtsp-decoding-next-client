export default function handler(req, res) {
	const { port } = req.query;

	const body = req.body;

	if (req.method === "POST") {
		fetch(`http://localhost:${port}/process`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(body),
		})
			.then(async (response) => {
				const message = await response.text();
				if (response.status == 200) {
					res.status(200).json({ message });
				} else if (response.status == 404) {
					res.status(404).json({ message });
				}
			})
			.catch((err) => {
				res.status(500).json({ error: "Server is offline" });
				console.error(err);
			});
	} else {
		res.status(405).json({ error: "Method not allowed" });
	}
}
