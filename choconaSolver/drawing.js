
/**
Draws what's inside spaces 
*/
function drawInsideSpaces(p_context, p_drawer, p_colours, p_solver) {
	var items = [DrawableColor(p_colours.chocolateSquare), 
				 DrawableX(p_colours.lackingSquare)];
				
	function selection(x,y) {
		if (p_solver.getAnswer(x,y) == CHOCONA.YES) {
			return 0;
		} else if(p_solver.getAnswer(x,y) == CHOCONA.NO){
			return 1;
		}
		return -1;
	}
	
	p_drawer.drawSpaceContents(p_context, items, selection, p_solver.xLength, p_solver.yLength);
	p_drawer.drawPolyomino4x5TiledMap(p_context,document.getElementById("img_map"),16,selection,0,p_solver.xLength,p_solver.yLength);

	function selectionRegion(p_index) {
		const forcedValue = p_solver.getForcedValue(p_index);
		if (forcedValue == NOT_FORCED) {
			return null;
		} else {
			const space = p_solver.getFirstSpaceRegion(p_index, 0);
			const writeColour = p_solver.getAnswer(space.x,space.y) == CHOCONA.YES ? p_colours.insideIndicationsOnFilled : p_colours.insideIndicationsOnWhite;
			return new DrawRegionArgument(space.x, space.y, forcedValue, writeColour) ;
		}
	}
	p_drawer.drawRegionValues(p_context, selectionRegion, p_solver.regions.length, "Arial");
}