function drawing(p_context, p_drawer, p_coloursSet, p_solver) {
	p_drawer.drawFenceArray(p_context, p_solver.xLength, p_solver.yLength, getFenceRightClosure(p_solver.answerFenceGrid), getFenceDownClosure(p_solver.answerFenceGrid)); 
	p_drawer.drawGalaxiesGrid(p_context, p_solver.centersGrid);
}