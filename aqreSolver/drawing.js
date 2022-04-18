/**
Draws what's inside spaces 
*/
function drawInsideSpaces(p_context, p_drawer, p_coloursSet, p_solver, p_selectionSet) {
	const bgSelectionItems = [DrawableColor(p_coloursSet.selectedSpace), DrawableColor(p_coloursSet.selectedCornerSpace)];
	bgSelectionSelection = function(x, y) {
		if (p_solver.getRegionIndex(x, y) == WALLGRID.OUT_OF_REGIONS) {
			return -1;
		}
		return p_selectionSet.getDrawingSelectionIndex(x, y, 0, 1);
	}
	p_drawer.drawSpaceContents2Dimensions(p_context, bgSelectionItems, bgSelectionSelection, p_solver.xLength, p_solver.yLength);
	
	var items = [DrawableColor(p_coloursSet.openSpace), DrawableColor(p_coloursSet.closedSpace)];
	function selection(x, y) {
		if(p_solver.getAnswer(x, y) == ADJACENCY.YES) {
			return 0;
		} else if(p_solver.getAnswer(x, y) == ADJACENCY.NO) {
			return 1;
		}
		return -1;
	}
	p_drawer.drawSpaceContents2Dimensions(p_context, items, selection, p_solver.xLength, p_solver.yLength);
	p_drawer.drawPolyomino4x5TiledMap(p_context, document.getElementById("img_map"), 16, selection, 0, p_solver.xLength, p_solver.yLength);
	
	function selectionRegion(p_index) {
		const forcedValue = p_solver.expectedNumberInRegion(p_index);
		if (forcedValue == NOT_FORCED) {
			return null;
		} else {
			const space = p_solver.getSpaceCoordinates(p_index, 0);
			const writeColour = p_solver.getAnswer(space.x, space.y) == ADJACENCY.NO ? p_coloursSet.reflectWrite : p_coloursSet.standardWrite;
			return new DrawRegionArgument(space.x, space.y, forcedValue, writeColour) ;
		}
	}
	p_drawer.drawRegionIndications(p_context, selectionRegion, p_solver.regions.length, FONTS.ARIAL);
}

