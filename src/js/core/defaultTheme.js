
const defaultTheme = {
	background: 0x000000,
	lighting: {
		azimuth: 315,
		inclination: 45
	},
	hud: {
		text: 0xffffff,
		progress: 0x00ff00,
		bezel: 0x888888,
		widgetSize: 40,
		scale: {
			bar1: 0xffffff,
			bar2: 0xff0000,
		},
		compass: {
			top1: 0xb03a14,
			top2: 0x1ab4e5,
			bottom1: 0x581d0a,
			bottom2: 0x0c536a
		},
		ahi: {
			sky: 0x106f8d,
			earth: 0x802100,
			bar: 0xffff00,
			marks: 0xffffff
		},
		cursor: 0xffff00
	},
	box: {
		bounding: 0xffffff,
		select: 0x0000ff,
		highlight: 0xff0000
	},
	routes: {
		active: 0xffff00,
		adjacent: 0xff0000,
		default: 0x888888
	},
	stations: {
		entrances: {
			text: 0xffffff
		},
		junctions: {
			text: 0xffff00,
			marker: 0xffff00
		},
		default: {
			text: 0xffffff,
			marker: 0xff0000
		}
	},
	shading: {
		single: 0xffffff,
		cursor: 0xffff00,
		cursorBase: 0x888888,
		unselected: 0x444444,
		unconnected: 0x888888,
		contours: {
			line: 0x444444,
			line10: 0x888888,
			interval: 10,
			base: 0xffffff
		}
	},
	popup: {
		text: 0xffffff,
		border: 0xffffff,
		background: 0x222222
	}
};

export { defaultTheme };