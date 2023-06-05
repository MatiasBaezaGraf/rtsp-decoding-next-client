export default function handler(req, res) {
	let ip = req.headers["x-real-ip"];

	const forwardedFor = req.headers["x-forwarded-for"];
	if (!ip && forwardedFor) {
		ip = forwardedFor?.split(",").at(0) ?? "Unknown";
	}

	res.status(200).json({ ip: ip });
}
