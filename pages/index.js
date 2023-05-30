import Head from "next/head";
import Script from "next/script";
import { useState, useRef, useEffect } from "react";

const Home = () => {
	// State to keep track of whether the client is connected to a stream or not
	// This is used to determine whether to show the "Connect" or "Disconnect" button
	// and to determine whether to show the video player or not
	const [connected, setConnected] = useState(false);

	// State to keep track of whether the server is online or not
	const [serverOnline, setServerOnline] = useState(false);

	// State to keep track of the error message to display to the user
	// if there is an error connecting to the stream
	const [errorMessage, setErrorMessage] = useState("");

	const [stream, setStream] = useState("");
	const [port, setPort] = useState("");

	const [player, setPlayer] = useState(null);
	const [processId, setProcessId] = useState(null);

	const videoCanvasRef = useRef(null);
	const visibleCanvasRef = useRef(null);

	useEffect(() => {
		const originalCanvasContext = videoCanvasRef.current.getContext("webgl");
		const visibleCanvasContext = visibleCanvasRef.current.getContext("2d");

		const copyCanvas = () => {
			visibleCanvasContext.drawImage(videoCanvasRef.current, 0, 0);
			requestAnimationFrame(copyCanvas);
		};

		copyCanvas();

		fetch("http://localhost:3000/status", {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
		})
			.then(async (response) => {
				if (response.status == 200) {
					setServerOnline(true);
				} else {
					setServerOnline(false);
				}
			})
			.catch((err) => {
				setServerOnline(false);
				console.error(err);
			});
	}, []);

	const startProcessAndConnect = async () => {
		const response = await fetch("http://localhost:3000/startProcess", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ stream: stream, port: port }),
		});

		const responseText = await response.text();

		if (response.status == 200) {
			// If the process started successfully, connect to the stream and set the connected state to true
			// Log the process ID
			const processId = JSON.parse(responseText).processId;
			console.log(`Process ID: ${processId}`);
			setConnected(true);
			let url = `ws://localhost:${port}`;
			let canvas = document.getElementById("video-canvas");
			setPlayer(new JSMpeg.Player(url, { canvas: canvas }));
			setProcessId(processId);
			setErrorMessage("");
		} else if (response.status == 400) {
			// If the process failed to start, the error message is set and displayed to the user
			console.error(`Error: ${response.status} - ${responseText}`);
			setErrorMessage(responseText);
		} else if (response.status == 401) {
			// In this particular case, the port ir outside of the authorized range
			console.error(`Error: ${response.status} - ${responseText}`);
			setErrorMessage(responseText);
		}
	};

	const stopProcess = async () => {
		const response = await fetch("http://localhost:3000/stopProcess", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ processId: processId }),
		});

		// If the process stopped successfully, set the connected state to false, destroy the player object for it to stop looking for a stream
		if (response.status == 200) {
			console.log(await response.text());
			setConnected(false);
			player.destroy();
			setPlayer(null);
		} else {
			console.log(`Status ${response.status} - ${await response.text()}`);
			setConnected(false);
			player.destroy();
			setPlayer(null);
		}
	};

	return (
		<>
			<Head>
				<title>Stream Player</title>
				<meta name="description" content="Stream Player" />
				<meta name="keywords" content="Stream Player" />
				<meta name="author" content="Matías Baeza Graf | matiasbaezagraf.com" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
			</Head>
			<div className="flex flex-col items-center h-screen bg-[#f8f8f8]">
				<h1 className="text-3xl font-bold pt-[20px] text-black">
					Stream Player
				</h1>
				<div className="relative border-[1px] border-[#c4c4c4] my-[20px]">
					<div
						className={`absolute top-0 left-0 w-full h-full flex flex-col justify-center text-center bg-[#626262] z-20 ${
							connected ? "opacity-0" : "opacity-1"
						}`}
					>
						<button
							className={`cursor-default p-[5px] border-y-[1px] ${
								serverOnline
									? "border-green-600 bg-green-300/20 text-green-900"
									: "border-red-600 bg-red-300/20 text-red-900"
							}`}
						>
							{serverOnline ? "Server Online" : "Server Offline"}
						</button>
					</div>
					<canvas
						ref={videoCanvasRef}
						id="video-canvas"
						className="absolute top-0 left-0 w-[800px] h-[450px] opacity-1"
						width={800}
						height={450}
					></canvas>
					<canvas
						ref={visibleCanvasRef}
						id="visible-canvas"
						className="opacity-0"
						width={800}
						height={450}
					></canvas>
				</div>
				<div className="flex flex-row items-center">
					<input
						onChange={(e) => setStream(e.target.value)}
						type="text"
						disabled={connected}
						placeholder="Enter Stream URL"
						className="border-2 border-black rounded-md p-2 m-2 text-black"
					/>
					<input
						onChange={(e) => setPort(e.target.value)}
						type="text"
						disabled={connected}
						placeholder="PORT"
						className="border-2 border-black rounded-md p-2 m-2 text-black"
					/>
					{!connected ? (
						<button
							onClick={startProcessAndConnect}
							disabled={!serverOnline}
							className={`bg-black border-2 border-black rounded-md p-2 m-2 hover:bg-black/30  ${
								!serverOnline && "bg-black/30 text-stone-300 hover:bg-black/30"
							}`}
						>
							Connect
						</button>
					) : (
						<button
							onClick={stopProcess}
							disabled={!serverOnline}
							className={`bg-black border-2 border-black rounded-md p-2 m-2 hover:bg-black/30 ${
								!serverOnline && "bg-black/30 text-stone-300 hover:bg-black"
							}`}
						>
							Disconnect
						</button>
					)}
				</div>
				{errorMessage && (
					<div className="m-[5px] p-[5px] rounded text-red-900 bg-red-300/20 border-[1px] border-red-500 text-center">
						{errorMessage}
					</div>
				)}
			</div>
		</>
	);
};

export default Home;
