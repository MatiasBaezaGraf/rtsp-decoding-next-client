export default function handler(req, res) {
	const ip = req.socket.remoteAddress;
	res.status(200).json({ ip });
}
