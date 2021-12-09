
// All the main variables
var drawer = new Drawer();
var editorCore = new EditorCore(10, 10);
var saveLoadMode = {}; // Used in inputEditor

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

//The main draw function (at start)
function drawCanvas() {
    drawer.drawEditableGrid(context, editorCore);
}

// Canvas
canevas.addEventListener('click', function (event) {
    clickCanvasAction(event, canevas, drawer, editorCore, modesManager)
}, false);
setInterval(drawCanvas, 30);
const fieldXMove = document.getElementById("input_number_xMove");
const fieldYMove = document.getElementById("input_number_yMove");
const fieldName = document.getElementById("input_grid_name");
const puzzleTypeComboBox = document.getElementById("select_puzzle_type");


const fieldsDefiningPuzzle = {	
	fieldStars : document.getElementById("input_number_stars"),
	fieldBounds : document.getElementById("input_number_bounds"),
	fieldX : document.getElementById("input_number_xLength"),
	fieldY : document.getElementById("input_number_yLength"),
	fieldXY : document.getElementById("input_number_xyLength"),
	fieldSudoku : document.getElementById("select_sudoku_type"),
	// 
	spanXYSeparated : document.getElementById("span_xy_separated"),
	spanXYBound : document.getElementById("span_xy_bound"),
	spanSelectSudoku : document.getElementById("span_select_sudoku"),
	spanStars : document.getElementById("span_stars"),
	spanMesh : document.getElementById("span_mesh"),
	spanBounds : document.getElementById("span_bounds"),
	submitResizeGrid : document.getElementById("submit_resize_grid")
}

const actionButtons = {
	wallsAroundSelection : document.getElementById("submit_wall_selection"),
	stateSpace : document.getElementById("submit_banned_space_mode"),
	wildCards : document.getElementById("submit_add_wild_cards"),
	symbolPrompt : document.getElementById("submit_add_symbols_prompt"),
	massSymbolsPrompt : document.getElementById("submit_add_mass_symbol_prompt"),
	oneSymbol : document.getElementById("submit_add_one_symbol")
}

function comboMain() {
	combo(puzzleTypeComboBox);
}
comboMain();

adaptCanvasAndGrid(canevas, drawer, editorCore);
fillSudokuSelectCombobox(fieldsDefiningPuzzle.fieldSudoku);

function puzzleName() {
	const name = puzzleTypeComboBox.options[puzzleTypeComboBox.selectedIndex].innerHTML;
	if (name == 'Sudoku') {
		const sudokuMode = getSudokuIdFromLabel(fieldsDefiningPuzzle.fieldSudoku.value);
		return name + "_" + sudokuMode.savedId + "_";
	}
	return name;
}

putActionElementClick("submit_display_menu", function (event) {
    switchVisibilityDivAction(document.getElementById("div_puzzle_management_menu"));
});

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
	const sudokuMode = getSudokuIdFromLabel(fieldsDefiningPuzzle.fieldSudoku.value);
    saveAction(editorCore, puzzleName(), fieldName.value, saveLoadMode, 
	{numberStars : parseInt(fieldsDefiningPuzzle.fieldStars.value, 10), 
	 numberBounds : parseInt(fieldsDefiningPuzzle.fieldBounds.value, 10), 
	 sudokuMode : sudokuMode}) 
});
putActionElementClick("submit_load_grid", function (event) {
    const sudokuMode = getSudokuIdFromLabel(fieldsDefiningPuzzle.fieldSudoku.value);
	editorLoadAction(canevas, drawer, editorCore, puzzleName(), fieldName.value, saveLoadMode, fieldsDefiningPuzzle, {sudokuMode : sudokuMode})
});

putActionElementClick("submit_new_grid", function (event) {
    restartAction(canevas, drawer, editorCore, fieldsDefiningPuzzle/*actualFieldX.value, actualFieldY.value*/)
});
putActionElementClick("submit_resize_grid", function (event) {
    resizeAction(canevas, drawer, editorCore, fieldsDefiningPuzzle/*actualFieldX.value, actualFieldY.value*/)
});

putActionElementClick("submit_rotate_clockwise", function (event) {
    rotateCWAction(canevas, drawer, editorCore); // Not 100% sure
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
putActionElementClick("submit_unselect", function (event) {
    actionUnselectAll(editorCore)
});
putActionElementClick("submit_move_selection", function (event) {
    actionMoveSelection(editorCore, parseInt(fieldXMove.value, 10), parseInt(fieldYMove.value, 10));
});
putActionElementClick("submit_copy_selection", function (event) {
    actionCopySelection(editorCore, parseInt(fieldXMove.value, 10), parseInt(fieldYMove.value, 10));
});
putActionElementClick("submit_clear_spaces_selection", function (event) {
    actionClearContentsSelection(editorCore);
});
putActionElementClick("submit_undo_symbols_prompt", function (event) {
    actionUndoSymbolsPrompt(editorCore);
});

// Widgets whose states can change + setup
function combo(p_docElt) {
	comboChange(p_docElt, canevas, drawer, editorCore, saveLoadMode, fieldsDefiningPuzzle, actionButtons);
}
combo(document.getElementById('select_puzzle_type')); //TODO c'est comme ça que ça se passe au démarrage, j'espère que c'est chargé. On peut le mettre directement sur la combobox ? Mais ce serait peut-être un peu lourd pour le mélange fond/forme, non ?

function comboSudoku(p_docElt) {
	comboSudokuChange(p_docElt, canevas, drawer, editorCore, saveLoadMode, fieldsDefiningPuzzle);
}

function checkboxTransparencyChange(p_checkbox) {
	editorCore.setTransparencyState(p_checkbox.checked);
}
checkboxTransparencyChange(document.getElementById('checkbox_transparency_empty_spaces'));

//-------------------------
// Mode of selection

var textMode = document.getElementById("span_mode");
setMode(textMode, modesManager, ENTRY.SPACE, MODE_SYMBOLS_PROMPT);
function setupEventListenerCaption(elementId, modeValue) {
    addEventListenerAndCaptionActionSubmitForEditor(editorCore, modesManager, textMode, elementId, ENTRY.SPACE, modeValue);
}
setupEventListenerCaption("submit_banned_space_mode", MODE_WALL_SPACE);
setupEventListenerCaption("submit_select_mode", MODE_SELECTION);
setupEventListenerCaption("submit_select_rectangles_mode", MODE_SELECTION_RECTANGLE);
setupEventListenerCaption("submit_erase_mode", MODE_ERASE);
setupEventListenerCaption("submit_add_symbols_prompt", MODE_SYMBOLS_PROMPT);
setupEventListenerCaption("submit_add_wild_cards", MODE_ADD_WILD_CARDS);
setupEventListenerCaption("submit_add_one_symbol", MODE_ADD_ONE_SYMBOL);
const addMassSymbolPromptSubmitElement = getSubmitElementSetValue("submit_add_mass_symbol_prompt", MODE_MASS_SYMBOL_PROMPT);
addMassSymbolPromptSubmitElement.addEventListener('click', function(event) {
	setSymbolAndTextAction(editorCore, textMode, modesManager);
});
//setupEventListenerCaption("submit_add_mass_symbol_prompt", MODE_MASS_SYMBOL_PROMPT);