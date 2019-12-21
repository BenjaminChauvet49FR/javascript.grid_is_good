/**
Gives the correct wall color from a wall type (a #RRGGBB string) 
@p_wallType : a type of wall between 2 spaces
*/

function wallToColor( p_wallType){
	switch(p_wallType){
		case (WALL_OPEN):
			return (colors.open_wall);break;
		case (WALL_CLOSED):
			return (colors.closed_wall);break;
	}
	return "#ffffff";
	
}