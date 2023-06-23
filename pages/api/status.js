export default function handler(req, res) {
	const { ip, port } = req.query;

	if (req.method === "GET") {
		fetch(`http://${localhost}:${port}/status`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
		})
			.then(async (response) => {
				if (response.status == 200) {
					res.status(200).json({ message: "Server is online" });
				} else {
					res.status(500).json({ error: "Server is offline" });
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
