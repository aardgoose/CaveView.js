"use strict";

var CV = CV || {};

CV.MATERIAL_LINE       = 1;
CV.MATERIAL_SURFACE    = 2;

CV.CAMERA_ORTHOGRAPHIC = 1;
CV.CAMERA_PERSPECTIVE  = 2;

// preset camera views

CV.VIEW_PLAN           = 1;
CV.VIEW_ELEVATION_N    = 2;
CV.VIEW_ELEVATION_S    = 3;
CV.VIEW_ELEVATION_E    = 4;
CV.VIEW_ELEVATION_W    = 5;

// shading types

CV.SHADING_HEIGHT      = 1;
CV.SHADING_LENGTH      = 2;
CV.SHADING_INCLINATION = 3;
CV.SHADING_CURSOR      = 4;
CV.SHADING_SINGLE      = 5;
CV.SHADING_SURVEY      = 6; 
CV.SHADING_OVERLAY     = 7;
CV.SHADING_SHADED      = 8;
CV.SHADING_DEPTH       = 9;
CV.SHADING_PW          = 10;

// layer tags for scene objects

CV.FEATURE_BOX           = 1;
CV.FEATURE_SELECTION_BOX = 2;
CV.FEATURE_ENTRANCES     = 3;
CV.FEATURE_TERRAIN       = 4;
CV.FACE_WALLS            = 5;
CV.FACE_SCRAPS           = 6;

CV.LEG_CAVE              = 7;
CV.LEG_SPLAY             = 8;
CV.LEG_SURFACE           = 9;

// flags in legs exported by Cave models

CV.NORMAL  = 0;
CV.SURFACE = 1;
CV.SPLAY   = 2;
CV.DIVING  = 3;

CV.upAxis = new THREE.Vector3( 0, 0, 1 );
