const Play = ({ color, size }) => {
	return (
		<svg
			fill={color || "#000000"}
			fillOpacity={1}
			width={size || 200}
			height={size || 200}
			viewBox="0 0 36 36"
			version="1.1"
			preserveAspectRatio="xMidYMid meet"
			xmlns="http://www.w3.org/2000/svg"
			xmlnsXlink="http://www.w3.org/1999/xlink"
		>
			<path
				class="clr-i-solid clr-i-solid-path-1"
				d="M32.16,16.08,8.94,4.47A2.07,2.07,0,0,0,6,6.32V29.53a2.06,2.06,0,0,0,3,1.85L32.16,19.77a2.07,2.07,0,0,0,0-3.7Z"
			></path>
			<rect x="0" y="0" width="36" height="36" fill-opacity="0" />
		</svg>
	);
};

export default Play;
