
// All the main variables
var drawer = new Drawer();
var editorCore = new EditorCore(10, 10);
Object.keys(GRID_ID).forEach(id => {
	editorCore.addCleanGrid(GRID_ID[id], 10, 10); //  See GRID_ID in EditorCore
});

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
const fieldXMove = document.getElementById("input_number_xMove");
const fieldYMove = document.getElementById("input_number_yMove");
const fieldName = document.getElementById("input_grid_name");
const puzzleTypeComboBox = document.getElementById("select_puzzle_type");

const fieldStars = document.getElementById("input_number_stars");


var actualFieldX = fieldX;
var actualFieldY = fieldY;

adaptCanvasAndGrid(canevas, drawer, editorCore);

function puzzleName() {
	return puzzleTypeComboBox.options[puzzleTypeComboBox.selectedIndex].innerHTML;
}

putActionElementClick("submit_view_puzzle_list", function (event) {
    viewPuzzleList(puzzleName())
});
putActionElementClick("submit_remove_puzzle", function (event) {
    removeAction(puzzleName(), fieldName.value)
});
putActionElementClick("submit_rename_puzzle", function (event) {
    renameAction(puzzleName(), fieldName)
});
putActionElementClick("submit_save_grid", function (event) {
    saveAction(editorCore, puzzleName(), fieldName.value, saveLoadModeId, {numberStars : parseInt(fieldStars.value, 10)}) 
});
putActionElementClick("submit_load_grid", function (event) {
    editorLoadAction(canevas, drawer, editorCore, puzzleName(), fieldName.value, saveLoadModeId, {
        xLengthField: actualFieldX,
        yLengthField: actualFieldY,
		numberStarsField : fieldStars
    })
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
putActionElementClick("submit_move_selection", function (event) {
    actionMoveSelection(editorCore, parseInt(fieldXMove.value, 10), parseInt(fieldYMove.value, 10));
});
putActionElementClick("submit_copy_selection", function (event) {
    actionCopySelection(editorCore, parseInt(fieldXMove.value, 10), parseInt(fieldYMove.value, 10));
});

function combo(p_docElt) {
	comboChange(p_docElt, editorCore);
}

combo(document.getElementById('select_puzzle_type')); //TODO c'est comme ça que ça se passe au démarrage, j'espère que c'est chargé. On peut le mettre directement sur la combobox ? Mais ce serait peut-être un peu lourd pour le mélange fond/forme, non ?

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
    addEventListenerAndCaptionActionSubmitForEditor(editorCore, modesManager, textMode, elementId, ENTRY.SPACE, modeValue);
}
setupEventListenerCaption("submit_normal_mode", MODE_NORMAL);
setupEventListenerCaption("submit_select_mode", MODE_SELECTION);
setupEventListenerCaption("submit_select_rectangles_mode", MODE_SELECTION_RECTANGLE);
setupEventListenerCaption("submit_erase_mode", MODE_ERASE);
setupEventListenerCaption("submit_add_symbols_prompt", MODE_SYMBOLS_PROMPT);

// Changes on spinboxes (relic of when buttons and spinboxes were used for regions and spaces)
/*document.getElementById("input_number_value_region").addEventListener('change', function () {
    editorCore.setInputNumber(this.value);
	setMode(textMode, modesManager, ENTRY.SPACE, MODE_NUMBER_REGION);
	applyChangesForSpaceMode(editorCore);
});

document.getElementById("input_number_value_space").addEventListener('change', function () {
    editorCore.setInputNumber(this.value);
	setMode(textMode, modesManager, ENTRY.SPACE, MODE_NUMBER_SPACE);
	applyChangesForSpaceMode(editorCore);
});*/