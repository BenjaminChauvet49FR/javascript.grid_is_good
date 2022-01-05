/**
Draws what's inside spaces
 */
function drawInsideSpaces(p_context, p_drawer, p_color, p_solver) {
    var items = [DrawableColor(p_color.openSpace), DrawableColor(p_color.closedSpace)];
    function selection(x, y) {
        if (p_solver.getAnswer(x, y) == ADJACENCY.YES) {
            return 0;
        } else if (p_solver.getAnswer(x, y) == ADJACENCY.NO) {
            return 1;
        }
        return -1;
    }
	
	function getPearl (x, y) {
		return (p_solver.getPearl(x, y) ? 0 : -1);
	}
    var xL = p_solver.xLength;
    var yL = p_solver.yLength;
    p_drawer.drawSpaceContents2Dimensions(p_context, items, selection, xL, yL);
    p_drawer.drawPolyomino4x5TiledMap(p_context, document.getElementById("img_map"), 16, selection, 0, xL, yL);
	p_drawer.drawSpaceContentsCoorsList(p_context, [DrawableCircle(p_color.circleOut, p_color.circleIn)], getPearl, p_solver.pearlSpacesList);  // Note : no thickness taken into account
}