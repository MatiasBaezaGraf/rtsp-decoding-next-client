export default function handler(req, res) {
	const { port } = req.query;

	const body = req.body;

	if (req.method === "POST") {
		fetch(`http://localhost:${port}/startProcess`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(body),
		})
			.then(async (response) => {
				const message = await response.text();

				if (response.status == 200) {
					const processId = JSON.parse(message).processId;
					res.status(200).json(processId);
				} else if (response.status == 400) {
					res.status(400).send(message);
				} else if (response.status == 401) {
					res.status(401).send(message);
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
