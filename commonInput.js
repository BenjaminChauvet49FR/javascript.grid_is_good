//TODO à déplacer à l'endroit plus approprié peut-être ?
const PUZZLES_KIND = {
	HEYAWAKE_LIKE : {id:2},
	MASYU_LIKE : {id:3},
	STAR_BATTLE : {id:101,squareGrid : true},
	GRAND_TOUR : {id:102}
}

//--------------------

/**
Adapts canvas to global grid
p_canvas : the canvas to adapt
p_pix : the Pix item to calculate coordinates
p_editorCore : the Global item the canvas should be adapted to
 */
function adaptCanvasAndGrid(p_canvas, p_drawer, p_editorCore) {
    p_drawer.adaptCanvasDimensions(p_canvas, {
        xLength: p_editorCore.getXLength(),
        yLength: p_editorCore.getYLength()
    });
}

//--------------------
/**
A generic straightforward function
*/
function putActionElementClick(p_idElement, p_eventFunction) {
    document.getElementById(p_idElement).addEventListener('click', p_eventFunction);
}

//--------------------
/**
View the numbers of puzzle list
*/
function viewPuzzleList(p_puzzleName) {
    var string = "";
    var listToSort = [];
    var baseString = "grid_is_good_" + p_puzzleName; //TODO ce changement...
    for (var i = 0, len = localStorage.length; i < len; i++) {
        var key = localStorage.key(i);
        if (key.startsWith(baseString)) {
            listToSort.push(parseInt(key.substring(baseString.length)));
        }
    }
    console.log(listToSort);
    listToSort = listToSort.sort(function (a, b) {
        return a - b;
    });
    var conditionalComma = "";
    for (var i = 0; i < listToSort.length; i++) {
        string += (conditionalComma + listToSort[i]);
        conditionalComma = ",";
    }
    alert(string);
}