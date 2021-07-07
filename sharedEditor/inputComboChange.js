var inputOptions = {
	forceMonoCharacter : false,
	lockedWalls : false,
	minNumber : 0,
	maxNumber : null,
	nonNumericStrings : []
}

//How to use the change of a combobox. Credits : https://www.scriptol.fr/html5/combobox.php
function comboChange(p_thelist, p_canvas, p_drawer, p_editorCore, p_saveLoadMode, p_fields) {
    var idx = p_thelist.selectedIndex;
    var content = p_thelist.options[idx].innerHTML;
	
	// Default options
	p_editorCore.setWallsOn();
	p_editorCore.setMarginInfo(MARGIN_KIND.NONE);
	p_editorCore.resetMargins();
	p_editorCore.maskAllGrids(); 
	var hasStars = false;
	var hasBounds = false;
	forcedSizePuzzle = false;
	
	// Default input options 
	inputOptions.forceMonoCharacter = false;
	inputOptions.minNumber = 0;
	inputOptions.maxNumber = null;
	inputOptions.nonNumericStrings = []; // Note : not useful yet !
	inputOptions.lockedWalls = false;
	
	// Specific options
    switch (content) { // Should break be forgotten, following instructions are read... and saveLoadModeId is overset ! This was problematic with Stitches !
		case 'CurvingRoad' : 
			p_editorCore.setWallsOff();
			saveLoadModeId = PUZZLES_KIND.CURVING_ROAD;
			p_editorCore.setVisibleGrids([GRID_ID.PEARL]); break;
		case 'Masyu':
			p_editorCore.setWallsOff();
			saveLoadModeId = PUZZLES_KIND.MASYU;
			p_editorCore.setVisibleGrids([GRID_ID.PEARL]); break;
		case 'Usotatami':
			p_editorCore.setWallsOff();
			saveLoadModeId = PUZZLES_KIND.NUMBERS_ONLY;
			p_editorCore.setVisibleGrids([GRID_ID.NUMBER_SPACE]); break;
		case 'Chocona': case 'CountryRoad': case 'Detour': case 'Heyawake': case 'Shimaguni':
			saveLoadModeId = PUZZLES_KIND.REGIONS_NUMERICAL_INDICATIONS;
			p_editorCore.setVisibleGrids([GRID_ID.NUMBER_REGION]); break;
		case 'Hakoiri':
			saveLoadModeId = PUZZLES_KIND.REGIONS_PLAYSTATION_SHAPES;
			p_editorCore.setVisibleGrids([GRID_ID.PLAYSTATION_SHAPES]); break;
		case 'Hakyuu': case 'Usoone':
			saveLoadModeId = PUZZLES_KIND.REGIONS_NUMBERS;
			p_editorCore.setVisibleGrids([GRID_ID.NUMBER_SPACE]); 
			if (content == 'Usoone') {
				inputOptions.forceMonoCharacter = true;
				inputOptions.maxNumber = 4;
			}
			break; // Forgot break !!
		case 'SternenSchlacht':
			saveLoadModeId = PUZZLES_KIND.STAR_BATTLE; 
			p_editorCore.maskAllGrids();
			hasStars = true; break;
		case 'Akari': case 'Koburin': case 'Shugaku':
			p_editorCore.setWallsOff();
			saveLoadModeId = PUZZLES_KIND.NUMBERS_X_ONLY;
			p_editorCore.setVisibleGrids([GRID_ID.DIGIT_X_SPACE]); break;
		case 'Yajilin': case 'Yajikabe': // Can also include Yajisan-Kazusan
			p_editorCore.setWallsOff();
			saveLoadModeId = PUZZLES_KIND.YAJILIN_LIKE;
			p_editorCore.setVisibleGrids([GRID_ID.YAJILIN_LIKE]); break;
		case 'Tapa': 
			p_editorCore.setWallsOff();
			saveLoadModeId = PUZZLES_KIND.TAPA;
			p_editorCore.setVisibleGrids([GRID_ID.TAPA]); break;
		case 'Stitches':
			saveLoadModeId = PUZZLES_KIND.STITCHES;
			p_editorCore.setMarginInfo(MARGIN_KIND.NUMBERS_LEFT_UP);
			hasBounds = true;
			break;
		case 'Gappy':
			saveLoadModeId = PUZZLES_KIND.ONLY_ONE_NUMBER_LEFT_UP_SQUARE;
			p_editorCore.setMarginInfo(MARGIN_KIND.NUMBERS_LEFT_UP);
			p_editorCore.setWallsOff();
			break; 
		case 'Sudoku':
			saveLoadModeId = PUZZLES_KIND.SUDOKU;
			const sudokuId = getSudokuIdFromLabel(p_fields.fieldSudoku.value);
			p_editorCore.setVisibleGrids([GRID_ID.NUMBER_SPACE]); 
			forcedSizePuzzle = true;
			p_editorCore.addWalledGridForceSize(getSudokuWallGrid(sudokuId).array);
			inputOptions.lockedWalls = true; 
			inputOptions.forceMonoCharacter = sudokuId.max < 10;
			inputOptions.minNumber = sudokuId.min;
			inputOptions.maxNumber = sudokuId.max;
			break; 
		default: // norinori, lits, entryExit... no numbers, only regions
			saveLoadModeId = PUZZLES_KIND.WALLS_ONLY;
			break; 
    } // Credits for multiple statements in cases : https://stackoverflow.com/questions/13207927/switch-statement-multiple-cases-in-javascript
	this.adaptCanvasAndGrid(p_canvas, p_drawer, p_editorCore);
	const squarePuzzle = correspondsToSquarePuzzle(saveLoadModeId); 
	maskElementConditional(p_fields.spanXYSeparated, squarePuzzle || forcedSizePuzzle);
	maskElementConditional(p_fields.spanXYBound, !squarePuzzle || forcedSizePuzzle);
	maskElementConditional(p_fields.spanStars, !hasStars);
	maskElementConditional(p_fields.spanSelectSudoku, saveLoadModeId != PUZZLES_KIND.SUDOKU);
	maskElementConditional(p_fields.submitResizeGrid, forcedSizePuzzle);
	maskElementConditional(p_fields.spanBounds, !hasBounds);
	copySaveModeInto(saveLoadModeId, p_saveLoadMode);
}


function maskElementConditional(p_field, p_visible) {
	if (p_visible) {
		p_field.style.display = "none";
	} else {
		p_field.style.display = "inline-block";
	}
}