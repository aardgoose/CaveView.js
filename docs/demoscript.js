const demoScript = [
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
			view: CV2.VIEW_ELEVATION_S
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
			shadingMode: CV2.SHADING_SINGLE
		}
	},
	{
		caption: 'by height ...',
		delay: 5,
		view: {
			shadingMode: CV2.SHADING_HEIGHT
		}
	},
	{
		caption: 'leg length ...',
		delay: 5,
		view: {
			shadingMode: CV2.SHADING_LENGTH
		}
	},
	{
		caption: 'leg inclination ...',
		delay: 5,
		view: {
			shadingMode : CV2.SHADING_INCLINATION
		}
	},
	{
		caption: 'survey section ...',
		delay: 5,
		view: {
			sectionName: 'p8',
			walls: false,
			shadingMode: CV2.SHADING_SURVEY
		}
	},
	{
		caption: 'depth below surface ...',
		delay: 5,
		view: {
			sectionByName: '',
			shadingMode: CV2.SHADING_DEPTH
		}
	},
	/*
	{
		caption: 'and selected paths',
		delay: 3,
		view: {
			shadingMode: CV2.SHADING_PATH
		},
		route: 'demo'
	},
	{
		caption: 'and another path.',
		delay: 3,
		route: 'demo2'
	},
	*/
	{
		caption: 'Terrain',
		delay: 3,
		view: {
			autoRotate: false,
			shadingMode: CV2.SHADING_HEIGHT,
			view: CV2.VIEW_PLAN
		}
	},
	{
		caption: 'Terrain (tiled at multiple resolutions)',
		delay: 5,
		view: {
			terrainOpacity: 1,
			terrain: true,
			view: CV2.VIEW_PLAN
		}
	},
	{
		caption: 'Terrain - contoured',
		delay: 5,
		view: {
			autoRotate: false,
			terrainOpacity: 0.5,
			terrainShading: CV2.SHADING_CONTOURS,
			view: CV2.VIEW_PLAN
		}
	},
	{
		caption: 'Map Overlays',
		delay: 5,
		view: {
			terrain: true,
			terrainShading: 'OSM',
			terrainOpacity: 1
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
			view: CV2.VIEW_ELEVATION_S,
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
	},
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
			shadingMode: CV2.SHADING_HEIGHT,
			view: CV2.VIEW_ELEVATION_S
		}
	},
	{
		caption: 'Station markers - ( junctions in yellow )',
		delay: 5,
		view: {
			box: false,
			walls: false,
			shadingMode: CV2.SHADING_HEIGHT,
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
			view: CV2.VIEW_ELEVATION_N,
			cameraType: CV2.CAMERA_ORTHOGRAPHIC
		}
	},
	{
		caption: 'mouse controls to rotate, pan and zoom ...',
		delay: 5,
		view: {
			sectionByName: '',
			entrances: false,
			cameraType: CV2.CAMERA_PERSPECTIVE,
			box: false,
			shadingMode: CV2.SHADING_HEIGHT,
			terrainShading: CV2.SHADING_SHADED,
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
		endScript: true,
		delay: 2
	}
];
