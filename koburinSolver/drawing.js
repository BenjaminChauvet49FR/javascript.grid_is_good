function drawInsideSpaces(p_context, p_drawer, p_colorSet, p_solver) {
	p_drawer.drawSolverLinkInsideSpaces(p_context, p_colorSet, p_solver); 
	var supposedNumber;
	const fontSize = p_drawer.getPixInnerSide();
	p_context.font = fontSize+"px Arial";
	p_context.textAlign = 'left'; 
	p_context.textBaseline = 'top';
	p_context.fillStyle = p_colorSet.numberWrite;
	for(var iy=0; iy<p_solver.yLength; iy++) {
		for(var ix=0; ix<p_solver.xLength; ix++) {
			supposedNumber = p_solver.getNumber(ix, iy);
			if (supposedNumber != null) {
				p_context.fillText(supposedNumber, p_drawer.getPixInnerXLeft(ix)+2, p_drawer.getPixInnerYUp(iy)+2);
			}
		}
	}
}