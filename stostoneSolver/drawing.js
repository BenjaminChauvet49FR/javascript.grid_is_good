/**
Draws what's inside spaces 
*/
function drawInsideSpaces(p_context, p_drawer, p_coloursSet, p_solver) {
	var items = [DrawableX(p_coloursSet.cross), DrawableX(p_coloursSet.crossLight)];
	function selectionMap(x, y) {
		if(p_solver.getAnswer(x, y) == FILLING.YES) {
			return 1;
		}
		if(p_solver.getAnswer(x, y) == FILLING.NO) {
			return 0;
		}
		return -1;
	}
	
	function selectionCross(x, y) {
		if(p_solver.getAnswer(x, y) == FILLING.NO) {
			return (p_solver.containsClueSpace(x, y) ? 1 : 0);
		}
		return -1;
	}
	p_drawer.drawSpaceContents2Dimensions(p_context, items, selectionCross, p_solver.xLength, p_solver.yLength);
	p_drawer.drawPolyomino4x5TiledMap(p_context,document.getElementById("img_map_polyomino"), 16, selectionMap, 1, p_solver.xLength, p_solver.yLength);
	
	selectionRegion = function(p_index) {
		const forcedValue = p_solver.forcedValue(p_index);		
		if (forcedValue != null) {			
			const space = p_solver.getSpaceCoordinates(p_index, 0);
			const writeColour = p_solver.getAnswer(space.x, space.y) == FILLING.YES ? p_coloursSet.reflectWrite : p_coloursSet.standardWrite;
			return new DrawRegionArgument(space.x, space.y, forcedValue, writeColour) ;
		} else {
			return null;
		}
	}
	p_drawer.drawRegionIndications(p_context, selectionRegion, p_solver.regions.length, FONTS.ARIAL);
}

