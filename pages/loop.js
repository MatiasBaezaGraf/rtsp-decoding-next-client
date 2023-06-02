import { useState, useEffect } from "react";

const Loop = () => {
	const [red, setRed] = useState(0);
	const [green, setGreen] = useState(0);
	const [blue, setBlue] = useState(0);

	const [activeRed, setActiveRed] = useState(false);
	const [activeGreen, setActiveGreen] = useState(false);
	const [activeBlue, setActiveBlue] = useState(false);

	let animationFrameId = null;

	useEffect(() => {
		let previousTimestamp = 0;
		const interval = 1000;

		console.log("useEffect called");

		const sumCount = (timestamp) => {
			// Calculate the time difference since the last frame
			const elapsed = timestamp - previousTimestamp;
			if (elapsed >= interval) {
				// If the time difference is greater than the interval, add 1 to the count
				if (activeRed) {
					sumRed();
				}
				if (activeGreen) {
					sumGreen();
				}
				if (activeBlue) {
					sumBlue();
				}

				// Set the previous timestamp to the current timestamp
				previousTimestamp = timestamp;
			}
			// Request the next frame
			animationFrameId = requestAnimationFrame(sumCount);
		};

		// Request the first frame to start the loop
		// This is only called once
		console.log(activeRed, activeGreen, activeBlue);

		if (activeRed || activeGreen || activeBlue) {
			animationFrameId = requestAnimationFrame(sumCount);
		}

		return () => {
			// Cancel the animation frame when the component is unmounted
			cancelAnimationFrame(animationFrameId);
		};
	}, [activeRed, activeGreen, activeBlue]);

	const sumRed = () => {
		setRed((count) => count + 1);
	};

	const sumGreen = () => {
		setGreen((count) => count + 1);
	};

	const sumBlue = () => {
		setBlue((count) => count + 1);
	};

	return (
		<div className="flex flex-col items-center p-[20px]">
			<h1 className="font-bold text-[35px] text-violet-200">Count</h1>
			<div className="flex flex-row">
				<h1 className="p-[10px] font-bold text-[25px] text-red-200">{red}</h1>
				<h1 className="p-[10px] font-bold text-[25px] text-green-200">
					{green}
				</h1>
				<h1 className="p-[10px] font-bold text-[25px] text-blue-200">{blue}</h1>
			</div>
			<div className="flex flex-row">
				<input
					className="border-2 border-black rounded-md p-2 m-2 text-black"
					type="checkbox"
					checked={activeRed}
					onChange={(e) => setActiveRed(e.target.checked)}
				/>
				<input
					className="border-2 border-black rounded-md p-2 m-2 text-black"
					type="checkbox"
					checked={activeGreen}
					onChange={(e) => setActiveGreen(e.target.checked)}
				/>
				<input
					className="border-2 border-black rounded-md p-2 m-2 text-black"
					type="checkbox"
					checked={activeBlue}
					onChange={(e) => setActiveBlue(e.target.checked)}
				/>
			</div>
		</div>
	);
};

export default Loop;
