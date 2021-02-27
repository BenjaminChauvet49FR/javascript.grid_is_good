// Note : a slight mix of Koburin drawing and LoopSolver drawing
function drawing(p_context, p_drawer, p_colorSet, p_solver) {
	// VERY ADVISED TO put methods that draw the grid in first, as they generally begin with a canvas clean.
	// I didn't bother in other solvers since the drawing of the grid was held by the "main" file.
	p_drawer.drawFenceArray(p_context, p_solver.xLength, p_solver.yLength, getFenceRightClosure(p_solver), getFenceDownClosure(p_solver)); 
	// p_solver.getFenceRight / getFenceDown have no power here. Closures required. 
	
	var supposedNumber;
	const fontSize = p_drawer.getPixInnerSide();
	p_context.font = fontSize+"px Arial";
	p_context.textAlign = 'center'; 
	p_context.textBaseline = 'middle';
	p_context.fillStyle = p_colorSet.numberWrite;
	for(var iy=0; iy<p_solver.yLength; iy++) {
		for(var ix=0; ix<p_solver.xLength; ix++) {			
			supposedNumber = p_solver.getNumber(ix, iy);
			if (supposedNumber != null) {
				p_context.fillText(supposedNumber, p_drawer.getPixCenterX(ix), p_drawer.getPixCenterY(iy));
			}
		}
	}
}