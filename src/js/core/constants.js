
export const VERSION = '2.4.0';

export const CAMERA_NONE         = 0;
export const CAMERA_ORTHOGRAPHIC = 1;
export const CAMERA_PERSPECTIVE  = 2;
export const CAMERA_ANAGLYPH     = 3;

export const CAMERA_OFFSET       = 600;

// preset camera views

export const VIEW_NONE           = 0;
export const VIEW_PLAN           = 1;
export const VIEW_ELEVATION_N    = 2;
export const VIEW_ELEVATION_S    = 3;
export const VIEW_ELEVATION_E    = 4;
export const VIEW_ELEVATION_W    = 5;

// mouse selection operation mode

export const MOUSE_MODE_NORMAL     = 0;
export const MOUSE_MODE_ROUTE_EDIT = 1;
export const MOUSE_MODE_DISTANCE   = 2;
export const MOUSE_MODE_TRACE_EDIT = 3;
export const MOUSE_MODE_ENTRANCES  = 4;

// shading types

export const SHADING_HEIGHT       = 1;
export const SHADING_LENGTH       = 2;
export const SHADING_INCLINATION  = 3;
export const SHADING_CURSOR       = 4;
export const SHADING_SINGLE       = 5;
export const SHADING_SURVEY       = 6;
export const SHADING_OVERLAY      = 7;
export const SHADING_SHADED       = 8;
export const SHADING_RELIEF       = 8;
export const SHADING_DEPTH        = 9;
export const SHADING_PATH         = 10;
export const SHADING_DEPTH_CURSOR = 11;
export const SHADING_DISTANCE     = 13;
export const SHADING_CONTOURS     = 15;
export const SHADING_SURFACE      = 17;
export const SHADING_DUPLICATE    = 18;
export const SHADING_CUSTOM       = 19;
export const SHADING_Z            = 20;

// layer tags for scene objects

export const FEATURE_SURVEY        = 0;
export const LEG_CAVE              = 1;
export const LEG_SPLAY             = 2;
export const LEG_SURFACE           = 3;
export const FEATURE_BOX           = 4;
export const FEATURE_SELECTED_BOX  = 5;
export const FEATURE_ENTRANCES     = 6;
export const FEATURE_TERRAIN       = 7;
export const FEATURE_STATIONS      = 8;
export const FEATURE_TRACES        = 9;
export const FACE_WALLS            = 11;
export const FACE_SCRAPS           = 12;
export const LABEL_STATION         = 13;
export const SURVEY_WARNINGS       = 14;
export const LABEL_STATION_COMMENT = 15;
export const CLUSTER_MARKERS       = 16;
export const FEATURE_ENTRANCE_DOTS = 17;
export const FEATURE_GRID          = 18;
export const LEG_DUPLICATE         = 19;

export const WALL_OVAL             = 1; // based on Therion .lox types
export const WALL_SQUARE           = 2;
export const WALL_DIAMOND          = 3;

// bit mask
export const STATION_NORMAL = 1;
export const STATION_ENTRANCE = 2;
export const STATION_XSECT = 4;

export const TERRAIN_BASIC   = 0;
export const TERRAIN_STENCIL = 1;
export const TERRAIN_BLEND   = 2;
