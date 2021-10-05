function clickCanvasActionGalaxy(event, p_canvas, p_drawer, p_editorCore, p_xLength, p_yLength) {
	const indexKnot = p_drawer.getClickKnotRD(event, p_canvas, p_xLength, p_yLength);
	if (indexKnot != null) {
		p_editorCore.manageGalaxyGridRightDown(indexKnot.x, indexKnot.y);
		return;
	}
	const indexWallR = p_drawer.getClickWallR(event, p_canvas, p_xLength, p_yLength);
	if (indexWallR != null) {
		p_editorCore.manageGalaxyGridRight(indexWallR.x, indexWallR.y);
		return;
	}
	const indexWallD = p_drawer.getClickWallD(event, p_canvas, p_xLength, p_yLength);
	if (indexWallD != null) {
		p_editorCore.manageGalaxyGridDown(indexWallD.x, indexWallD.y);
		return;
	}
	const indexSpaces = p_drawer.getClickSpace(event, p_canvas, p_xLength, p_yLength);
	if (indexSpaces != null) {
		p_editorCore.manageGalaxyGridSpace(indexSpaces.x, indexSpaces.y);
	}
}

function clickCornerAction(event, p_canvas, p_drawer, p_editorCore, p_xLength, p_yLength) {
	var indexCornerRD = p_drawer.getClickKnotRD(event, p_canvas, p_xLength, p_yLength);
	if (indexCornerRD != null) {			
		const gridId = GRID_ID.KNOTS;
		const x = indexCornerRD.x;
		const y = indexCornerRD.y;
		p_editorCore.set(gridId, x, y, p_editorCore.get(gridId, x, y) == null ? SYMBOL_ID.KNOT_HERE : null); //551551 ce qui sera à faire quand on sauvegardera !
		return true;
	}
	return false;
}