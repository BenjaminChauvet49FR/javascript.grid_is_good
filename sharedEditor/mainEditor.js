
// All the main variables
var drawer = new Drawer();
var editorCore = new EditorCore(10, 10);
editorCore.addCleanGrid(GRID_ID.NUMBER_REGION, 10, 10);
editorCore.addCleanGrid(GRID_ID.NUMBER_SPACE, 10, 10);
editorCore.addCleanGrid(GRID_ID.PEARL, 10, 10);
var canevas = document.getElementById("canevas");
var context = canevas.getContext("2d");
var modesManager = {
    clickSpace: null,
    clickWallD: null,
    clickWallR: null
};
var actualFieldX;
var actualFieldY;

//The main draw function (at start)
function drawCanvas() {
    drawer.drawEditableGrid(context, editorCore);
}

// Canvas
canevas.addEventListener('click', function (event) {
    clickCanvas(event, canevas, drawer, editorCore, modesManager)
}, false);
setInterval(drawCanvas, 30);

const fieldX = document.getElementById("input_number_xLength");
const fieldY = document.getElementById("input_number_yLength");
const fieldXY = document.getElementById("input_number_xyLength");
const fieldName = document.getElementById("input_grid_name");
const puzzleTypeComboBox = document.getElementById("select_puzzle_type");

const fieldStars = document.getElementById("input_number_stars");


var actualFieldX = fieldX;
var actualFieldY = fieldY;

adaptCanvasAndGrid(canevas, drawer, editorCore);

putActionElementClick("submit_view_puzzle_list", function (event) {
    viewPuzzleList(puzzleTypeComboBox.options[puzzleTypeComboBox.selectedIndex].innerHTML)
});

putActionElementClick("submit_save_grid", function (event) {
    saveAction(editorCore, fieldName.value, saveLoadModeId, {numberStars : fieldStars.value}) 
});

putActionElementClick("submit_load_grid", function (event) {
    loadAction(canevas, drawer, editorCore, fieldName.value, saveLoadModeId, {
        xLengthField: actualFieldX,
        yLengthField: actualFieldY,
		numberStarsField : fieldStars
    })
});
putActionElementClick("submit_auto_name", function (event) {
    fieldName.value = puzzleTypeComboBox.options[puzzleTypeComboBox.selectedIndex].innerHTML
});
putActionElementClick("submit_new_grid", function (event) {
    restartAction(canevas, drawer, editorCore, actualFieldX.value, actualFieldY.value)
});
putActionElementClick("submit_resize_grid", function (event) {
    resizeAction(canevas, drawer, editorCore, actualFieldX.value, actualFieldY.value)
});

putActionElementClick("submit_rotate_clockwise", function (event) {
    rotateCWAction(canevas, drawer, editorCore)
});
putActionElementClick("submit_rotate_uturn", function (event) {
    rotateUTurnAction(canevas, drawer, editorCore)
});
putActionElementClick("submit_rotate_counter_clockwise", function (event) {
    rotateCCWAction(canevas, drawer, editorCore)
});
putActionElementClick("submit_mirror_horizontal", function (event) {
    mirrorHorizontalAction(canevas, drawer, editorCore)
});
putActionElementClick("submit_mirror_vertical", function (event) {
    mirrorVerticalAction(canevas, drawer, editorCore)
});

putActionElementClick("submit_wall_selection", function (event) {
    actionBuildWallsAroundSelection(editorCore)
});
putActionElementClick("submit_clear_selection", function (event) {
    actionUnselectAll(editorCore)
});

combo(document.getElementById('select_puzzle_type')); //TODO c'est comme ça que ça se passe au démarrage, j'espère que c'est chargé. On peut le mettre directement sur la combobox ? Mais ce serait peut-être un peu lourd pour le mélange fond/forme, non ?

//How to use the change of a combobox. Credits : https://www.scriptol.fr/html5/combobox.php
function combo(thelist) {
    var idx = thelist.selectedIndex;
    var content = thelist.options[idx].innerHTML;
    console.log(content);
	// Default options
	editorCore.setModePathOff();
	editorCore.setWallsOn();
	// Specific options
    switch (content) {
		case 'CurvingRoad':
			editorCore.setWallsOff();
			saveLoadModeId = PUZZLES_KIND.MASYU_LIKE.id;
			break;
		case 'Masyu':
			editorCore.setWallsOff();
			saveLoadModeId = PUZZLES_KIND.MASYU_LIKE.id;
			break;
		case 'Nurikabe':
			editorCore.setWallsOff();
			saveLoadModeId = PUZZLES_KIND.NURIKABE_LIKE.id;
			break;
		case 'GrandTour':
			editorCore.setModePathOn();
			saveLoadModeId = PUZZLES_KIND.HEYAWAKE_LIKE.id;
			break;	
		case 'SternenSchlacht':
			saveLoadModeId = PUZZLES_KIND.STAR_BATTLE.id;
			break;
		default:
			saveLoadModeId = PUZZLES_KIND.HEYAWAKE_LIKE.id;
			break;
    }
	const squarePuzzle = correspondsToSquarePuzzle(saveLoadModeId); 
	if (squarePuzzle) {
		actualFieldX = fieldXY;
		actualFieldY = fieldXY; 
	} else {
		actualFieldX = fieldX;
		actualFieldY = fieldY;
	}
	fieldX.disabled = squarePuzzle;
	fieldY.disabled = squarePuzzle;
	fieldXY.disabled = !squarePuzzle;
}

/**
Matches true if puzzle is square-shaped. 
TODO obviously not the best way, obviously it only takes account of Star battle, but hey it's temporary !
*/
function correspondsToSquarePuzzle(p_id) {
	return (p_id == PUZZLES_KIND.STAR_BATTLE.id);
}

//-------------------------
// Mode of selection

var textMode = document.getElementById("span_mode");
setMode(textMode, modesManager, ENTRY.SPACE, MODE_NORMAL);
function setupEventListenerCaption(elementId, modeValue) {
    addEventListenerAndCaptionActionSubmit(editorCore, modesManager, textMode, elementId, ENTRY.SPACE, modeValue);
}
setupEventListenerCaption("submit_normal_mode", MODE_NORMAL);
setupEventListenerCaption("submit_select_mode", MODE_SELECTION);
setupEventListenerCaption("submit_select_rectangles_mode", MODE_SELECTION_RECTANGLE);
setupEventListenerCaption("submit_erase_mode", MODE_ERASE);
setupEventListenerCaption("submit_digit_region_mode", MODE_NUMBER_REGION);
setupEventListenerCaption("submit_digit_space_mode", MODE_NUMBER_SPACE);
setupEventListenerCaption("submit_add_white", MODE_PEARL_WHITE);
setupEventListenerCaption("submit_add_black", MODE_PEARL_BLACK);
setupEventListenerCaption("submit_add_combined_left", MODE_ARROW_COMBINED_LEFT);
setupEventListenerCaption("submit_add_combined_up", MODE_ARROW_COMBINED_UP);
setupEventListenerCaption("submit_add_combined_right", MODE_ARROW_COMBINED_RIGHT);
setupEventListenerCaption("submit_add_combined_down", MODE_ARROW_COMBINED_DOWN);

// Editor input symbol
document.getElementById("submit_add_white").addEventListener('click', function () {
    editorCore.setInputSymbol(SYMBOL_ID.WHITE)
});

document.getElementById("submit_add_black").addEventListener('click', function () {
    editorCore.setInputSymbol(SYMBOL_ID.BLACK)
});

document.getElementById("submit_add_combined_left").addEventListener('click', function () {
    editorCore.setInputSymbol(SYMBOL_ID.COMBINED_LEFT)
});
document.getElementById("submit_add_combined_up").addEventListener('click', function () {
    editorCore.setInputSymbol(SYMBOL_ID.COMBINED_UP)
});
document.getElementById("submit_add_combined_right").addEventListener('click', function () {
    editorCore.setInputSymbol(SYMBOL_ID.COMBINED_RIGHT)
});
document.getElementById("submit_add_combined_down").addEventListener('click', function () {
    editorCore.setInputSymbol(SYMBOL_ID.COMBINED_DOWN)
});


// Changes on spinboxes
document.getElementById("input_number_value_region").addEventListener('change', function () {
    editorCore.setInputNumber(this.value);
	setMode(textMode, modesManager, ENTRY.SPACE, MODE_NUMBER_REGION);
	applyChangesForSpaceMode(editorCore);
});

document.getElementById("input_number_value_space").addEventListener('change', function () {
    editorCore.setInputNumber(this.value);
	setMode(textMode, modesManager, ENTRY.SPACE, MODE_NUMBER_SPACE);
	applyChangesForSpaceMode(editorCore);
});

document.getElementById("input_add_combined_value").addEventListener('change', function () {
    editorCore.setCombinedInputNumber(this.value);
});


