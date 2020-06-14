/**
Draws what's inside spaces
 */
function drawInsideSpaces(p_context, p_drawer, p_color, p_solver) {
    var items = [DrawableColor(p_color.openSquare), DrawableColor(p_color.closedSquare)];
    function selection(x, y) {
        if (p_solver.getAnswer(x, y) == SPACE.OPEN) {
            return 0;
        } else if (p_solver.getAnswer(x, y) == SPACE.CLOSED) {
            return 1;
        }
        return -1;
    }
	
	function getPearl (x, y) {
		return (p_solver.getPearl(x, y) ? 0 : -1);
	}
    var xL = p_solver.xLength;
    var yL = p_solver.yLength;
    p_drawer.drawSpaceContents(p_context, items, selection, xL, yL);
    p_drawer.drawPolyomino4x5TiledMap(p_context, document.getElementById("img_map"), 16, selection, 0, xL, yL);
	p_drawer.drawSpaceContents(p_context, [DrawableCircle(p_color.circleOut, p_color.circleIn, 1)], getPearl, xL, yL);  //TODO thickness non prise en compte !
}