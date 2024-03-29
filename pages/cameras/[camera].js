import Decibelmeter from "@/components/Decibelmeter";
import FullScreen from "@/components/FullScreen";
import Pause from "@/components/Pause";
import Play from "@/components/Play";
import Head from "next/head";
import { useRouter } from "next/router";
import { useState, useRef, useEffect } from "react";

// Every call is made through the API routes, which are defined in the pages/api folder
// in order to communicate with the server, which is running on a closed port

const Player = () => {
	const serverPort = process.env.NEXT_PUBLIC_SERVER_PORT;
	// State to keep track of the IP address of the server where the whole system is running
	const [ip, setIp] = useState(null);

	const router = useRouter();
	// State to keep track of whether the client is connected to a stream or not
	// This is used to determine whether to show the "Connect" or "Disconnect" button
	// and to determine whether to show the video player or not
	const [connected, setConnected] = useState(false);
	const [disableDisconnect, setDisableDisconnect] = useState(true);

	// State to keep track of whether the server is online or not
	const [serverOnline, setServerOnline] = useState(false);

	// State to keep track of the error message to display to the user
	// if there is an error connecting to the stream
	const [errorMessage, setErrorMessage] = useState("");

	const [stream, setStream] = useState(undefined);
	const [port, setPort] = useState(undefined);

	const [player, setPlayer] = useState(null);
	const [pause, setPause] = useState(false);
	const [fullscreen, setFullscreen] = useState(false);

	const [processId, setProcessId] = useState(null);

	const [histogram, setHistogram] = useState(false);
	const [vectorscope, setVectorscope] = useState(false);
	const [waveform, setWaveform] = useState(false);

	const videoCanvasRef = useRef(null);
	let animationFrameId = null;

	useEffect(() => {
		// Set the IP address of the server
		// This is used to determine whether the server is online or not
		setIp(window.location.hostname);

		// Set the port and stream name from the URL query parameters if they are not set and
		// if they are present in the URL query parameters
		if (stream == undefined) {
			setStream(router.query.stream);
		}
		if (port == undefined) {
			setPort(router.query.port);
		}

		// The interval is defined to render the scopes at a fixed rate
		// This is done to avoid rendering the scopes at a very high rate
		// which would cause the performance to drop significantly
		let previousTimestamp = 0;
		const interval = 50; // Set your desired interval in milliseconds

		const copyCanvas = (timestamp) => {
			// Calculate the time difference since the last frame
			const elapsed = timestamp - previousTimestamp;
			if (elapsed >= interval) {
				console.log("Volumen", player.volume);
				// Get the canvas and context
				const canvas = videoCanvasRef.current;
				const context = canvas.getContext("2d");
				const width = canvas.width;
				const height = canvas.height;

				const imageData = context.getImageData(
					0,
					0,
					canvas.width,
					canvas.height
				);
				const pixels = imageData.data;

				// Render the RGB histogram
				//-------------------------------------------------------------------------------------------------
				if (histogram == true) {
					renderMultiRGBHistogram(pixels);
				}

				// Render the Vectorscope
				//-------------------------------------------------------------------------------------------------
				if (vectorscope == true) {
					renderVectorscope(pixels);
				}
				// Render the Waveform
				//-------------------------------------------------------------------------------------------------
				if (waveform == true) {
					renderWaveform(pixels, width, height);
				}

				// Render histogram and vectorscope
				//-------------------------------------------------------------------------------------------------
				//renderHistogramAndVectorscope(pixels);

				// Update the previous timestamp
				previousTimestamp = timestamp;
			}
			// Request the next frame if any of the conditions are still met
			if (histogram || vectorscope || waveform) {
				animationFrameId = requestAnimationFrame(copyCanvas);
			}
		};

		if (ip != null) {
			checkServerStatus();
		}

		// Only if the histogram, vectorscope, or waveform buttons are enabled, start the animation loop
		// and render the selected scopes
		if (histogram || vectorscope || waveform) {
			console.log("Starting animation");
			animationFrameId = requestAnimationFrame(copyCanvas);
		}

		// This function is called when the user clicks the "Connect" button
		// It checks if the server is online and if the stream is valid
		if (connected) {
			setTimeout(() => {
				confirmProcess();
			}, 500);
		}

		return () => {
			// Stop the animation loop when the histogram, vectorscope, or waveform is disabled or enabled
			// clean the unused scopes
			cleanScopes();
			console.log("Cleanup");
			cancelAnimationFrame(animationFrameId);
		};
	}, [
		histogram,
		vectorscope,
		waveform,
		ip,
		connected,
		router.query.port,
		router.query.stream,
	]);

	const renderMultiRGBHistogram = (pixels) => {
		const canvasGrayscale = document.getElementById("grayscale");
		const contextGrayscale = canvasGrayscale.getContext("2d");

		const canvasRed = document.getElementById("red");
		const contextRed = canvasRed.getContext("2d");

		const canvasGreen = document.getElementById("green");
		const contextGreen = canvasGreen.getContext("2d");

		const canvasBlue = document.getElementById("blue");
		const contextBlue = canvasBlue.getContext("2d");

		const histogramHeight = canvasRed.height;

		// Clear the canvas
		contextRed.clearRect(0, 0, canvasRed.width, canvasRed.height);
		contextGreen.clearRect(0, 0, canvasGreen.width, canvasGreen.height);
		contextBlue.clearRect(0, 0, canvasBlue.width, canvasBlue.height);
		contextGrayscale.clearRect(
			0,
			0,
			canvasGrayscale.width,
			canvasGrayscale.height
		);

		// Calculate color distribution
		const distribution = {
			red: new Array(256).fill(0),
			green: new Array(256).fill(0),
			blue: new Array(256).fill(0),
			grayscale: new Array(256).fill(0),
		};

		for (let i = 0; i < pixels.length; i += 12) {
			const red = pixels[i];
			const green = pixels[i + 1];
			const blue = pixels[i + 2];

			// Calculate the grayscale value for the pixel
			const grayscale = Math.round((red + green + blue) / 3);

			// Increment the respective channel count in the distribution
			distribution.red[red]++;
			distribution.green[green]++;
			distribution.blue[blue]++;
			distribution.grayscale[grayscale]++;
		}

		// Find the maximum count in the distribution for scaling
		const redMaxCount = Math.max(...distribution.red);
		const greenMaxCount = Math.max(...distribution.green);
		const blueMaxCount = Math.max(...distribution.blue);
		const grayscaleMaxCount = Math.max(...distribution.grayscale);

		// Calculate the scaling factor for histogram height
		const redScalingFactor = histogramHeight / redMaxCount;
		const greenScalingFactor = histogramHeight / greenMaxCount;
		const blueScalingFactor = histogramHeight / blueMaxCount;
		const grayscaleScalingFactor = histogramHeight / grayscaleMaxCount;

		// Plot the histogram
		for (let i = 0; i < 256; i = i + 1) {
			const x = i;

			const redHeight = distribution.red[i] * redScalingFactor;
			const greenHeight = distribution.green[i] * greenScalingFactor;
			const blueHeight = distribution.blue[i] * blueScalingFactor;
			const grayscaleHeight =
				distribution.grayscale[i] * grayscaleScalingFactor;

			// Calculate the height of the next bar in the histogram
			// This is used to draw the line from the current bar to the next bar
			const nextRedHeight = distribution.red[i + 1] * redScalingFactor;
			const nextGreenHeight = distribution.green[i + 1] * greenScalingFactor;
			const nextBlueHeight = distribution.blue[i + 1] * blueScalingFactor;
			const nextGrayscaleHeight =
				distribution.grayscale[i + 1] * grayscaleScalingFactor;

			// Draw the vertical lines for each channel

			contextRed.strokeStyle = "red";
			contextRed.beginPath();
			contextRed.moveTo(x * 2, histogramHeight);
			contextRed.lineTo(x * 2, histogramHeight - redHeight);
			contextRed.lineTo((x + 1) * 2, histogramHeight - nextRedHeight);
			contextRed.stroke();

			contextGreen.strokeStyle = "green";
			contextGreen.beginPath();
			contextGreen.moveTo(x * 2, histogramHeight);
			contextGreen.lineTo(x * 2, histogramHeight - greenHeight);
			contextGreen.lineTo((x + 1) * 2, histogramHeight - nextGreenHeight);
			contextGreen.stroke();

			contextBlue.strokeStyle = "blue";
			contextBlue.beginPath();
			contextBlue.moveTo(x * 2, histogramHeight);
			contextBlue.lineTo(x * 2, histogramHeight - blueHeight);
			contextBlue.lineTo((x + 1) * 2, histogramHeight - nextBlueHeight);
			contextBlue.stroke();

			contextGrayscale.strokeStyle = "white";
			contextGrayscale.beginPath();
			contextGrayscale.moveTo(x * 2, histogramHeight);
			contextGrayscale.lineTo(x * 2, histogramHeight - grayscaleHeight);
			contextGrayscale.lineTo(
				(x + 1) * 2,
				histogramHeight - nextGrayscaleHeight
			);
			contextGrayscale.stroke();
		}
	};

	const renderVectorscope = (pixels) => {
		const canvas = document.getElementById("colorWheelCanvas");
		const context = canvas.getContext("2d");
		const colorWheelImg = document.getElementById("colorWheelImg");

		context.drawImage(colorWheelImg, 0, 0, 500, 500);

		// Analyze the pixels in the image from top-left to bottom-right by cols
		for (let i = 0; i < pixels.length; i = i + 24) {
			const r = pixels[i + 0];
			const g = pixels[i + 1];
			const b = pixels[i + 2];

			// Calculate the hue
			let red = r / 255;
			let green = g / 255;
			let blue = b / 255;

			const max = Math.max(red, green, blue);
			const min = Math.min(red, green, blue);

			let hue;

			if (max === min) {
				hue = 0; // achromatic (gray)
			} else {
				const delta = max - min;
				if (max === red) {
					hue = ((green - blue) / delta) % 6;
				} else if (max === green) {
					hue = (blue - red) / delta + 2;
				} else {
					hue = (red - green) / delta + 4;
				}
				hue = (hue * 60 + 360) % 360; // convert to degrees
			}

			//Calculate the saturation
			const saturation = (max === 0 ? 0 : (max - min) / max) * 100;

			//Calculate the value
			const value = max * 100;

			//Get the canvas center
			const centerX = canvas.width / 2;
			const centerY = canvas.height / 2;

			//Convert the polar coordinates to cartesian coordinates
			const angleInRadians = hue * (Math.PI / 180);

			const endX = centerX - saturation * 2 * Math.sin(angleInRadians);
			const endY = centerY - saturation * 2 * Math.cos(angleInRadians);

			context.beginPath();
			context.moveTo(endX, endY); // Starting point (center of the canvas)
			context.lineTo(endX, endY + 0.08); // Endpoint calculated based on angle and distance
			context.strokeStyle = "white"; // Set line color
			context.lineWidth = 1; // Set line width
			context.stroke(); // Draw the line
		}

		// const saturation = Math.sqrt(red * red + green * green + blue * blue);
	};

	const renderWaveform = (pixels, width, height) => {
		const canvas = document.getElementById("waveFormCanvas");
		const context = canvas.getContext("2d");
		const waveformHeight = canvas.height;

		// Clear the canvas
		context.clearRect(0, 0, canvas.width, canvas.height);

		// Calculate the width of each waveform sample
		const sampleWidth = canvas.width / pixels.length;

		// Analyze the pixels in the image from top-left to bottom-right by cols
		let index = 0;

		//Commented lines in the two for loops and the index at the bottom of the function are for
		//renderind the waveform in better quality but it takes more time to render therefore
		//if heavily affects the performance of the stream

		for (let col = 0; col < width; col += 4) {
			//for (let col = 0; col < width; col += 2) {
			for (let row = height - 1; row >= 0; row = row - 2) {
				//for (let row = height - 1; row >= 0; row = row - 1) {
				//0 red, 1 green, 2 blue, 3 alpha
				const red = pixels[row * (width * 4) + col * 4 + 0];
				const green = pixels[row * (width * 4) + col * 4 + 1];
				const blue = pixels[row * (width * 4) + col * 4 + 2];

				// Calculate the average value (brightness) of the pixel
				const brightness = (red + green + blue) / 3;

				// Calculate the vertical position for the waveform sample
				const y = waveformHeight - (brightness * waveformHeight) / 255;

				// Draw the line for the waveform sample
				context.beginPath();
				context.moveTo(index * sampleWidth, y);
				context.lineTo(index * sampleWidth, y + 0.7);
				context.stroke();
				context.strokeStyle = "green";

				//index = index + 8;
				index = index + 32;
			}
		}
	};

	const cleanScopes = () => {
		if (!histogram) {
			const GScanvas = document.getElementById("grayscale");
			const GScontext = GScanvas.getContext("2d");
			const Rcanvas = document.getElementById("red");
			const Rcontext = Rcanvas.getContext("2d");
			const Gcanvas = document.getElementById("green");
			const Gcontext = Gcanvas.getContext("2d");
			const Bcanvas = document.getElementById("blue");
			const Bcontext = Bcanvas.getContext("2d");

			GScontext.clearRect(0, 0, GScanvas.width, GScanvas.height);
			Rcontext.clearRect(0, 0, Rcanvas.width, Rcanvas.height);
			Gcontext.clearRect(0, 0, Gcanvas.width, Gcanvas.height);
			Bcontext.clearRect(0, 0, Bcanvas.width, Bcanvas.height);
		}
		if (!vectorscope) {
			const canvas = document.getElementById("colorWheelCanvas");
			const context = canvas.getContext("2d");
			context.clearRect(0, 0, canvas.width, canvas.height);
		}
		if (!waveform) {
			const canvas = document.getElementById("waveFormCanvas");
			const context = canvas.getContext("2d");
			context.clearRect(0, 0, canvas.width, canvas.height);
		}
	};

	const clearCanvas = () => {
		const canvas = videoCanvasRef.current;
		const context = canvas.getContext("2d");
		context.clearRect(0, 0, canvas.width, canvas.height);
	};

	// This function checks if the started process runs or crashed
	// If it doesn't run, it will reset all the states and show an error message
	const confirmProcess = async () => {
		const url = new URL("/api/confirmProcess", window.location.origin);

		url.searchParams.append("port", serverPort);

		const processConfirmed = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ processId: processId }),
		});

		const processConfirmedText = await processConfirmed.json();

		if (processConfirmed.status == 200) {
			console.log(processConfirmedText.message);
			setDisableDisconnect(false);
		} else {
			console.error(processConfirmedText);
			setErrorMessage("Error del servidor: Verifique el URL del stream");
			setConnected(false);
			setPlayer(null);
			if (player != null) player.destroy();
			clearCanvas();
		}
	};

	const startProcessAndConnect = async () => {
		const url = new URL("/api/startProcess", window.location.origin);

		url.searchParams.append("port", serverPort);

		const response = await fetch(url, {
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
			const processId = JSON.parse(responseText);
			console.log(`Process ID: ${processId}`);
			setConnected(true);
			let url = `ws://${ip}:${port}`;
			let canvas = document.getElementById("video-canvas");
			setPlayer(new JSMpeg.Player(url, { canvas: canvas, disableGl: true }));
			setProcessId(processId);
			setErrorMessage("");
			updateCameraList();
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
		const url = new URL("/api/stopProcess", window.location.origin);

		url.searchParams.append("port", serverPort);

		const response = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ processId: processId }),
		});

		// If the process stopped successfully, set the connected state to false, destroy the player object for it to stop looking for a stream
		if (response.status == 200) {
			console.log(await response.text());
			setPause(false);
			setConnected(false);
			player.destroy();
			setPlayer(null);
			clearCanvas();
		} else {
			console.log(`Status ${response.status} - ${await response.text()}`);
			setPause(false);
			setConnected(false);
			player.destroy();
			setPlayer(null);
			clearCanvas();
		}
	};

	//This function is called when the user clicks the "Connect" button and the connection is successful
	//It updates the camera list and sets the stream and ports in the cameras.json files, so the next time
	//the user opens the app, the stream and port are already set
	const updateCameraList = async () => {
		const camerasResponse = await fetch("/api/cameras");
		const camerasJson = await camerasResponse.json();
		const cameras = camerasJson.cameras;

		const newStream = stream;
		const newPort = port;

		cameras.forEach((camera) => {
			if (camera.name == router.query.camera) {
				camera.stream = newStream;
				camera.port = newPort;
			}
		});

		fetch("/api/cameras", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ cameras: cameras }),
		})
			.then((response) => response.json())
			.then((data) => {
				console.log(data);
			})
			.catch((error) => {
				console.error("Error:", error);
			});
	};

	// This fuction is called when the page is loaded
	// It checks if the server is online to display the correct message to the user
	// and to enable or disable the "Connect" button
	const checkServerStatus = async () => {
		const url = new URL("/api/status", window.location.origin);

		url.searchParams.append("port", serverPort);

		fetch(url, {
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
	};

	const playAndPause = () => {
		if (player != null) {
			if (player.isPlaying) {
				setPause(true);
				player.pause();
			} else {
				setPause(false);
				player.play();
			}
		}
	};

	const fullScreen = () => {
		if (fullscreen) {
			document.exitFullscreen();
			setFullscreen(false);
		} else {
			document.getElementById("video").requestFullscreen();
			setFullscreen(true);
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

			<div className="flex flex-col items-center min-h-screen bg-[#292929]">
				<h1 className="text-3xl font-bold pt-[20px] text-white">
					{router.query.camera}
				</h1>

				<div
					id="video"
					className="relative border-[1px] border-[#222222] my-[20px] w-[800px] h-[450px]"
				>
					<div
						className={`absolute top-0 left-0 w-full h-full flex flex-col justify-center text-center bg-[#626262] z-20 ${
							connected ? "opacity-0" : "opacity-1"
						}`}
					>
						<button
							className={`cursor-default p-[5px] border-y-[1px] ${
								serverOnline
									? "border-green-600 bg-green-300/20 text-green-100"
									: "border-red-600 bg-red-300/20 text-red-100"
							} ${connected ? "hidden" : "block"}`}
						>
							{serverOnline ? "Server Online" : "Server Offline"}
						</button>
					</div>

					<div
						onDoubleClick={fullScreen}
						onClick={playAndPause}
						className={`absolute w-full h-full flex flex-col items-center justify-center z-30 transform duration-[300ms]  ${
							pause ? "opacity-1 scale-90" : "opacity-0 scale-100"
						}`}
					>
						<Play color="#222222" />
					</div>

					<button
						className={`absolute bottom-0 right-0 bg-transparent z-30 p-[10px] transform duration-[300ms] hover:scale-110 ${
							connected ? "block" : "hidden"
						}`}
						onClick={fullScreen}
					>
						<FullScreen active={fullscreen} />
					</button>

					<button
						className={`absolute bottom-0 left-0 bg-transparent z-30 p-[10px] transform duration-[300ms] hover:scale-110 ${
							connected ? "block" : "hidden"
						}`}
						onClick={playAndPause}
					>
						{pause ? (
							<Play size={30} color="#e3e3e1" />
						) : (
							<Pause size={30} color="#e3e3e1" />
						)}
					</button>

					<canvas
						ref={videoCanvasRef}
						id="video-canvas"
						className=" top-0 left-0 w-full h-full opacity-1"
						width={1920}
						height={1080}
					></canvas>
				</div>
				<div className="flex flex-row  items-center">
					<input
						onChange={(e) => setStream(e.target.value)}
						type="text"
						disabled={connected}
						placeholder="URL del Stream"
						className="border-2 border-[#696969] rounded-md p-2 m-2 text-white bg-[#474747] outline-none w-[300px]"
						value={stream}
					/>
					<input
						onChange={(e) => setPort(e.target.value)}
						type="text"
						disabled={connected}
						placeholder="Puerto"
						className="border-2 border-[#696969] rounded-md p-2 m-2 text-white bg-[#474747] outline-none w-[100px]"
						value={port}
					/>

					{!connected ? (
						<button
							onClick={() => {
								startProcessAndConnect();
							}}
							disabled={!serverOnline}
							className={`bg-white border-black border-[1px] text-black  rounded-md p-2 m-2 hover:bg-white/80 ${
								!serverOnline && "bg-white/30 text-black hover:bg-white/30"
							}`}
						>
							Conectar
						</button>
					) : (
						<button
							onClick={() => {
								setDisableDisconnect(true);
								stopProcess();
							}}
							disabled={disableDisconnect}
							className={`bg-white  border-black  border-[1px] text-black rounded-md p-2 m-2 hover:bg-white/80 ${
								!serverOnline && "bg-white/30 text-black hover:bg-white/30"
							}`}
						>
							Desconectar
						</button>
					)}
				</div>
				{errorMessage && (
					<div className="m-[5px] p-[5px] rounded text-red-200 bg-transparent border-[1px] border-red-500 text-center">
						{errorMessage}
					</div>
				)}
				<div className="flex flex-row justify-center items-center my-[4px]">
					{/* Buttons to toggle videoscopes */}

					<button
						onClick={(e) => setHistogram(!histogram)}
						className={` border-[1px] border-black  p-2 my-[20px]  hover:bg-black/30  ${
							histogram && "bg-black/30 text-stone-300 hover:bg-black/30"
						} text-white rounded-l-md`}
					>
						Histograma
					</button>

					<button
						onClick={(e) => setVectorscope(!vectorscope)}
						className={` border-[1px] border-black  p-2 my-[20px]  hover:bg-black/30  ${
							vectorscope && "bg-black/30 text-stone-300 hover:bg-black/30"
						} text-white `}
					>
						Vectorscopio
					</button>

					<button
						onClick={(e) => setWaveform(!waveform)}
						className={` border-[1px] border-black  p-2 my-[20px]  hover:bg-black/30  ${
							waveform && "bg-black/30 text-stone-300 hover:bg-black/30"
						} text-white  rounded-r-md`}
					>
						Forma de onda
					</button>
				</div>

				{/* ----------------------------------------------------------- FROM HERE DOWN IS THE CODE FOR THE VIDEOSCOPES ----------------------------------------------------------- */}

				<div className="flex flex-row justify-center">
					{/* HISTOGRAMS */}
					<div
						className={`flex-col justify-center ${
							histogram ? "block" : "hidden"
						}`}
					>
						<canvas
							className="m-[10px] bg-[#474747] border-[1px] border-[#696969]"
							id="grayscale"
							width={512}
							height={130}
						/>
						<canvas
							className="m-[10px] bg-[#474747] border-[1px] border-[#696969]"
							id="red"
							width={512}
							height={130}
						/>
						<canvas
							className="m-[10px] bg-[#474747] border-[1px] border-[#696969]"
							id="green"
							width={512}
							height={130}
						/>
						<canvas
							className="m-[10px] bg-[#474747] border-[1px] border-[#696969]"
							id="blue"
							width={512}
							height={130}
						/>
					</div>
					{/* WAVEFORM  */}
					<div className={`relative ${waveform ? "block" : "hidden"}`}>
						<div className="absolute h-full w-full z-30 px-[30px] py-[40px] flex flex-col justify-between">
							<hr className="bg-transparent border-stone-400/25 border-t-[1px] border-b-[0px]" />
							<hr className="bg-transparent border-stone-400/25 border-t-[1px] border-b-[0px]" />
							<hr className="bg-transparent border-stone-400/25 border-t-[1px] border-b-[0px]" />
							<hr className="bg-transparent border-stone-400/25 border-t-[1px] border-b-[0px]" />
							<hr className="bg-transparent border-stone-400/25 border-t-[1px] border-b-[0px]" />
							<hr className="bg-transparent border-stone-400/25 border-t-[1px] border-b-[0px]" />
							<hr className="bg-transparent border-stone-400/25 border-t-[1px] border-b-[0px]" />
							<hr className="bg-transparent border-stone-400/25 border-t-[1px] border-b-[0px]" />
							<hr className="bg-transparent border-stone-400/25 border-t-[1px] border-b-[0px]" />
							<hr className="bg-transparent border-stone-400/25 border-t-[1px] border-b-[0px]" />
							<hr className="bg-transparent border-stone-400/25 border-t-[1px] border-b-[0px]" />
						</div>
						<div className="absolute h-full w-full z-30 p-[30px] flex flex-col justify-between">
							<h1 className="text-white text-[10px] -translate-x-[20px]">
								100
							</h1>
							<h1 className="text-white text-[10px] -translate-x-[20px]">90</h1>
							<h1 className="text-white text-[10px] -translate-x-[20px]">80</h1>
							<h1 className="text-white text-[10px] -translate-x-[20px]">70</h1>
							<h1 className="text-white text-[10px] -translate-x-[20px]">60</h1>
							<h1 className="text-white text-[10px] -translate-x-[20px]">50</h1>
							<h1 className="text-white text-[10px] -translate-x-[20px]">40</h1>
							<h1 className="text-white text-[10px] -translate-x-[20px]">30</h1>
							<h1 className="text-white text-[10px] -translate-x-[20px]">20</h1>
							<h1 className="text-white text-[10px] -translate-x-[20px]">10</h1>
							<h1 className="text-white text-[10px] -translate-x-[20px]">0</h1>
						</div>
						<canvas
							className="m-[30px] py-[20px] bg-black border-[1px] border-[#353535]"
							id="waveFormCanvas"
							width={500}
							height={500}
						/>
					</div>
				</div>
				{/* VECTORSCOPE */}
				<img
					id="colorWheelImg"
					src="/VectorScope.png"
					alt="color wheel"
					className="w-[500px] h-[500px] hidden"
				/>
				<canvas
					id="colorWheelCanvas"
					width="500"
					height="500"
					className={`transform rotate-[-14deg] p-[10px] ${
						vectorscope ? "block" : "hidden"
					}`}
				/>
				<div className="h-[60px]" />
			</div>
		</>
	);
};

export default Player;
