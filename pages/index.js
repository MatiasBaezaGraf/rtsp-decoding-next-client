import Modal from "@/components/Modal";
import Head from "next/head";
import { useEffect, useState } from "react";

const Home = () => {
	const [cameras, setCameras] = useState(null);
	const [currentCamera, setCurrentCamera] = useState("Camara 1");

	const [modalIsOpen, setModalIsOpen] = useState(false);
	const [cameraName, setCameraName] = useState("");

	const updateCameras = () => {
		fetch("/api/cameras", {
			method: "POST",
			body: JSON.stringify({ cameras }),
			headers: {
				"Content-Type": "application/json",
			},
		})
			.then((res) => res.json())
			.then((data) => {
				console.log(data);
			});
	};

	useEffect(() => {
		// Fetch cameras from a local file through an API route when the component mounts
		let camerasToSet = [];

		if (cameras == null) {
			fetch("/api/cameras")
				.then((res) => res.json())
				.then((data) => {
					camerasToSet = data.cameras;
					setCameras(camerasToSet);
					setCurrentCamera(camerasToSet[0]);
				});
		} else {
			// Update cameras file when cameras state changes
			updateCameras();
		}
	}, [cameras]);

	// If cameras is null, show a loading message
	if (cameras == null) {
		return (
			<div className="w-screen h-screen flex flex-col justify-center items-center">
				<h1 className="text-[40px] font-bold">Cargando Cámaras</h1>
			</div>
		);
	}

	return (
		<>
			<Head>
				<title>Home</title>
			</Head>
			<Modal isOpen={modalIsOpen} onClose={() => setModalIsOpen(false)}>
				<div className="flex flex-col items-start justify-center px-[30px] py-[23px]">
					<div className="flex flex-row justify-between items-center">
						<h1 className="text-[25px] font-bold mr-[30px]">Agregar Cámara</h1>
						<button
							onClick={() => setModalIsOpen(false)}
							className="text-[22px] text-red-400 font-bold hover:text-red-600"
						>
							x
						</button>
					</div>
					<input
						type="text"
						placeholder="Nombre de la cámara"
						className="border-[1px] border-black rounded-md p-[10px] w-[100%] mt-[20px] bg-[#031830] text-white"
						value={cameraName}
						onChange={(e) => setCameraName(e.target.value)}
					/>
					<button
						onClick={() => {
							// Add the new camera to the cameras array and reset the input value
							setCameras([...cameras, cameraName]);
							setCurrentCamera(cameraName);
							setCameraName("");
							setModalIsOpen(false);
						}}
						className="border-[1px] border-black rounded-md p-[10px] w-[100%] mt-[20px] hover:bg-black/30"
					>
						Confirmar
					</button>
				</div>
			</Modal>
			<main className="bg-[#353535] items-center">
				<div className="flex flex-col ">
					<div className="flex flex-row justify-center desktop:h-[8vh] h-[10vh]">
						<button
							onClick={() => setModalIsOpen(true)}
							className="absolute bg-blue-400 left-0 border-l-[0px] border-[1px] border-blue-900  p-2 my-[20px]  hover:bg-blue-400/30  rounded-r-md"
						>
							Agregar Cámara +
						</button>

						{cameras.map((camera, index) => {
							return (
								<button
									key={camera}
									onClick={() => setCurrentCamera(camera)}
									className={`border-[1px] border-black  p-2 my-[20px]  hover:bg-black/30  ${
										currentCamera === camera &&
										"bg-black/30 text-stone-300 hover:bg-black/30"
									} ${!cameras[index - 1] && "rounded-l-md"} ${
										!cameras[index + 1] && "rounded-r-md"
									}`}
								>
									{camera}
								</button>
							);
						})}

						<button
							onClick={() => {
								// Remove the current camera from the cameras array and set the current camera to the first one
								setCameras(
									cameras.filter((camera) => camera !== currentCamera)
								);
								setCurrentCamera(cameras[0]);
							}}
							className="absolute bg-red-400 right-0 border-r-[0px] border-[1px] border-red-900  p-2 my-[20px]  hover:bg-red-400/30  rounded-l-md"
						>
							Eliminar Cámara
						</button>
					</div>
					{cameras.map((camera) => {
						return (
							<iframe
								key={camera}
								src={`http://localhost:3000/cameras/${camera}`}
								className={`h-[92vh] ${currentCamera !== camera && "hidden"}`}
								width="100%"
								height="100%"
								frameBorder="0"
								allowFullScreen
							></iframe>
						);
					})}
				</div>
			</main>
		</>
	);
};

export default Home;
