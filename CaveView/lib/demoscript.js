var demoScript = [
	{
		caption: 'A web cave survey viewer...',
		delay: 5,
		view: {
			zScale: 0.5
		}
	},
	{
		caption: 'Displays center lines ...',
		delay: 7,
		view: {
			view: CV.VIEW_ELEVATION_S
		},
	},
	{
		caption: 'splay legs ...',
		delay: 3,
		view: {
			splays: true
		}
	},
	{
		caption: 'passage walls ...',
		delay: 5,
		view: {
			splays: false,
			walls: true
		}
	},
	{
		caption: '...',
		delay: 2,
		view: {
			autoRotate: true,
			autoRotateRate: 2.0
		}
	},
	{
		caption: 'Supports multiple cave shading modes ...',
		delay: 5,
		view: {
			shadingMode: CV.SHADING_SINGLE
		}
	},
	{
		caption: 'by height ...',
		delay: 5,
		view: {
			shadingMode: CV.SHADING_HEIGHT
		}
	},
	{
		caption: 'leg length ...',
		delay: 5,
		view: {
			shadingMode: CV.SHADING_LENGTH
		}
	},
	{
		caption: 'leg inclination ...',
		delay: 5,
		view: {
			shadingMode : CV.SHADING_INCLINATION
		}
	},
	{
		caption: 'survey section ...',
		delay: 5,
		view: {
			section: 1,
			walls: false,
			shadingMode: CV.SHADING_SURVEY
		}
	},
	{
		caption: 'depth below surface ...',
		delay: 5,
		view: {
			section: 0,
			shadingMode: CV.SHADING_DEPTH
		}
	},
	{
		caption: 'and selected paths',
		delay: 3,
		view: {
			section: 0,
			shadingMode: CV.SHADING_PATH
		},
		route: 'demo'
	},
	{
		caption: 'and another path.',
		delay: 3,
		route: 'demo2'
	},
	{
		caption: 'Terrain',
		delay: 3,
		view: {
			autoRotate: false,
			view: CV.VIEW_PLAN
		}
	},
	{
		caption: 'Terrain (tiled at multiple resolutions)',
		delay: 5,
		view: {
			terrainOpacity: 1,
			terrain: true,
			view: CV.VIEW_PLAN
		}
	},
	{
		caption: 'Map Overlays',
		delay: 5,
		view: {
			terrainOpacity: 1,
			terrain: true,
			terrainShading: CV.SHADING_OVERLAY
		}
	},
	{
		caption: 'Adjustable terrain transparency',
		delay: 5,
		view: {
			terrainOpacity: 0.4,
		}
	},
	{
		caption: 'On screen indicators',
		delay: 5,
		view: {
			view: CV.VIEW_ELEVATION_S,
			terrain: false,
			HUD: true
		}
	},
	{
		caption: 'Optional bounding box',
		delay: 5,
		view: {
			box: true,
		}
	},
	{
		caption: 'Vertical scaling from x 0.25',
		delay: 5,
		view: {
			zScale: 0
		}
	},
	{
		caption: '... to x 4',
		delay: 5,
		view: {
			zScale: 1.0,
			terrainOpacity: 1,
			terrain: false
		}
	},/*
	{
		caption: 'Fullscreen mode ...',
		delay: 3
	},
	{
		caption: 'Fullscreen mode',
		delay: 3,
		view: {
			fullscreen: true
		}
	}, */
	{
		caption: 'Focus on selected survey sections',
		delay: 5,
		view: {
			zScale: 0.5,
			sectionByName: 'p8.bens_dig',
			box: false
		}
	},
	{
		caption: 'limit view to selected section',
		delay: 5,
		view: {
			box: false,
			cut: true,
			walls: true,
			shadingMode: CV.SHADING_HEIGHT,
			view: CV.VIEW_ELEVATION_S
		}
	},
	{
		caption: 'Station markers - ( junctions in yellow )',
		delay: 5,
		view: {
			box: false,
			walls: false,
			shadingMode: CV.SHADING_HEIGHT,
			autoRotate: true,
			autoRotateRate: 1.0,
			stations: true
		}
	},
	{
		caption: 'Station labels',
		delay: 5,
		view: {
			stationLabels: true
		}
	},
	{
		caption: 'Orthographic view',
		delay: 5,
		view: {
			view: CV.VIEW_ELEVATION_N,
			cameraType: CV.CAMERA_ORTHOGRAPHIC
		}
	},
	{
		caption: 'mouse controls to rotate, pan and zoom ...',
		delay: 5,
		view: {
			section: 0,
			entrances: false,
			cameraType: CV.CAMERA_PERSPECTIVE,
			box: false,
			shadingMode: CV.SHADING_HEIGHT,
			terrainShading: CV.SHADING_SHADED,
			walls: true,
			HUD: true,
			autoRotate: false,
			stations: true,
			stationLabels: false,
			fullscreen: false
		}
	},
	{
		caption: 'mouse with right button - rotate view point...',
		delay: 2
	},
	{
		caption: 'mouse with left button - pan view point...',
		delay: 2
	},
	{
		caption: 'mouse wheel to zoom...',
		delay: 2
	},
	{
		caption: '... have a go!',
		delay: 2
	}
];
