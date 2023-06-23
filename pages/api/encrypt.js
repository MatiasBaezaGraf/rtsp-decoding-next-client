import crypto from "crypto";

export default function handler(req, res) {
	if (req.method === "POST") {
		const key = req.body.apiKey;

		const encryptedKey = encrypt(key);

		res.status(200).send({ key: encryptedKey });
	} else {
		res.status(405).send("Method not allowed");
	}
}

// Encryption function
const encrypt = (text) => {
	const iv = Buffer.from(process.env.NEXT_PUBLIC_ENCRYPTION_IV, "hex");
	const keyToUse = crypto
		.createHash("sha256")
		.update(String(process.env.NEXT_PUBLIC_ENCRYPTION_KEY))
		.digest("base64")
		.slice(0, 32);
	const cipher = crypto.createCipheriv("aes-256-cbc", keyToUse, iv);
	let encrypted = cipher.update(text, "utf8", "hex");
	encrypted += cipher.final("hex");

	return encrypted;
	// return {
	// 	encryptedText: encrypted,
	// 	iv: iv.toString("hex"),
	// };
};
