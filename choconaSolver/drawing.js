
/**
Draws what's inside spaces 
*/
function drawInsideSpaces(p_context,p_drawer,p_color,p_solver){
	var items = [DrawableColor(p_color.chocolateSquare), 
				DrawableColor(p_color.lackingSquare)];
				
	function selection(x,y) {
		if (p_solver.getAnswer(x,y) == CHOCONA.YES) {
			return 0;
		} else if(p_solver.getAnswer(x,y) == CHOCONA.NO){
			return 1;
		}
		return -1;
	}
	
	p_drawer.drawSpaceContents(p_context,items,selection,p_solver.xLength,p_solver.yLength);
	p_drawer.drawPolyomino4x5TiledMap(p_context,document.getElementById("img_map"),16,selection,0,p_solver.xLength,p_solver.yLength);

	var pixLeft,pixDown,space;
	const fontSize = p_drawer.getPixInnerSide()/2;
	p_context.font = fontSize+"px Arial";
	p_context.textAlign = 'left'; 
	p_context.textBaseline = 'top';
	for(var i=0;i<p_solver.regions.length;i++) {
		if (p_solver.getForcedValue(i) != NOT_FORCED) {
			space = p_solver.getFirstSpaceRegion(i,0);
			pixLeft = p_drawer.getPixInnerXLeft(space.x)+2;
			pixUp = p_drawer.getPixInnerYUp(space.y)+2;
			if (p_solver.getAnswer(space.x,space.y) == CHOCONA.YES) {
				p_context.fillStyle = p_color.insideIndicationsOnWhite;
			} else {
				p_context.fillStyle = p_color.insideIndicationsOnFilled;
			}
			p_context.fillText(p_solver.getForcedValue(i),pixLeft,pixUp);
		}
	}
	
}

