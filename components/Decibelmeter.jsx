import { useState, useEffect, useRef } from "react";

const Decibelmeter = () => {
	const [decibels, setDecibels] = useState(0);
	const audioRef = useRef(null);

	useEffect(() => {
		let audioContext;
		let mediaStream;

		const initializeCapture = async () => {
			try {
				// Create an AudioContext instance
				audioContext = new window.AudioContext();

				// Get the audio stream from the browser tab
				mediaStream = await navigator.mediaDevices.getUserMedia({
					audio: true,
				});

				// Create a MediaStreamAudioSourceNode from the media stream
				const sourceNode = audioContext.createMediaStreamSource(mediaStream);

				// Connect the audio source to the audio context destination
				sourceNode.connect(audioContext.destination);
			} catch (error) {
				console.error("Error capturing audio:", error);
			}
		};

		initializeCapture();

		return () => {
			// Clean up resources when the component unmounts
			if (audioContext) {
				audioContext.close();
			}
			if (mediaStream) {
				mediaStream.getTracks().forEach((track) => track.stop());
			}
		};
	}, []);

	return (
		<div>
			<audio ref={audioRef} controls />
		</div>
	);
};

export default Decibelmeter;
