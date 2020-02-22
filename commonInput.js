// Fonctions à créer : clickWallRAction, clickWallDAction, clickSpaceAction, getLocalStorageName (déjà géré ailleurs ?)

function clickCanvas(event,p_canvas,p_drawer,p_editorCore,p_modes){
	var wallOK = false;
	var indexWallR = p_drawer.getClickWallR(event,p_canvas,p_editorCore);
	var indexWallD = p_drawer.getClickWallD(event,p_canvas,p_editorCore);
	if (indexWallR != null){
		clickWallRAction(p_editorCore,indexWallR.x, indexWallR.y, p_modes);
		wallOK = true;
	}
	if (indexWallD != null){
		clickWallDAction(p_editorCore,indexWallD.x, indexWallD.y, p_modes);
		wallOK = true;
	}
	if (wallOK){
		return;
	}
	var indexSpaces = p_drawer.getClickSpace(event,p_canvas,p_editorCore);
	if (indexSpaces != null){
		clickSpaceAction(p_editorCore,indexSpaces.x, indexSpaces.y, p_modes);
	}
}

/**
Transform the grid
*/

function rotateCWAction(p_canvas,p_drawer,p_editorCore){
	p_editorCore.rotateCWGrid();
	adaptCanvasAndGrid(p_canvas,p_drawer,p_editorCore);
}

function rotateUTurnAction(p_canvas,p_drawer,p_editorCore){
	p_editorCore.rotateUTurnGrid();
	adaptCanvasAndGrid(p_canvas,p_drawer,p_editorCore);
}

function rotateCCWAction(p_canvas,p_drawer,p_editorCore){
	p_editorCore.rotateCCWGrid();
	adaptCanvasAndGrid(p_canvas,p_drawer,p_editorCore);
}

function mirrorHorizontalAction(p_canvas,p_drawer,p_editorCore){
	p_editorCore.mirrorHorizontalGrid();
	adaptCanvasAndGrid(p_canvas,p_drawer,p_editorCore);
}

function mirrorVerticalAction(p_canvas,p_drawer,p_editorCore){
	p_editorCore.mirrorVerticalGrid();
	adaptCanvasAndGrid(p_canvas,p_drawer,p_editorCore);
}