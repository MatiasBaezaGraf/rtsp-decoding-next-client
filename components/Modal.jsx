const Modal = ({ children, isOpen, onClose }) => {
	if (!isOpen) return null;

	return (
		<div className="absolute flex flex-col justify-center items-center h-screen w-screen bg-black/50 z-30">
			<div className="relative bg-[#1c2630] w-auto rounded shadow-lg mb-[40vh]">
				{children}
			</div>
		</div>
	);
};

export default Modal;
