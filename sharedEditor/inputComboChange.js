var inputOptions = {
	forceMonoCharacter : false,
	lockedWalls : false,
	minNumber : 0,
	maxNumber : null,
	nonNumericStrings : [],
	monoSymbolToEnter : null ,// Must match a symbol that will be entered to the grid. 
	monoSymbolGridId : null
}

//How to use the change of a combobox. Credits : https://www.scriptol.fr/html5/combobox.php
function comboChange(p_thelist, p_canvas, p_drawer, p_editorCore, p_saveLoadMode, p_fields, p_buttons) {
    var idx = p_thelist.selectedIndex;
    var content = p_thelist.options[idx].innerHTML;
	
	// Default options
	p_editorCore.setWallsOn();
	p_editorCore.setMarginInfo(MARGIN_KIND.NONE);
	p_editorCore.resetMargins();
	p_editorCore.maskAllGrids(); 
	p_editorCore.setVisibleEdges(true);
	var hasStars = false;
	var hasBounds = false;
	var forcedSizePuzzle = false;
	var usesChains = true;
	
	// Default input options 
	inputOptions.forceMonoCharacter = false;
	inputOptions.minNumber = 0;
	inputOptions.maxNumber = null;
	inputOptions.nonNumericStrings = []; // Note : not useful yet !
	inputOptions.lockedWalls = false;
	inputOptions.monoSymbolToEnter = null;
	
	// Specific options
    switch (content) { // Should break be forgotten, following instructions are read... and saveLoadModeId is overset ! This was problematic with Stitches !
		case 'CurvingRoad' : 
			inputOptions.monoSymbolToEnter = SYMBOL_ID.WHITE;
			inputOptions.monoSymbolGridId = GRID_ID.PEARL;
			usesChains = false;
			p_editorCore.setWallsOff();
			saveLoadModeId = PUZZLES_KIND.CURVING_ROAD;
			p_editorCore.setVisibleGrids([GRID_ID.PEARL]); break;
		case 'Masyu':
			p_editorCore.setWallsOff();
			saveLoadModeId = PUZZLES_KIND.MASYU;
			p_editorCore.setVisibleGrids([GRID_ID.PEARL]); break;
		case 'Fillomino': case 'Rukkuea': case 'SlitherLink': case 'Usotatami':
			p_editorCore.setWallsOff();
			saveLoadModeId = PUZZLES_KIND.NUMBERS_ONLY;
			p_editorCore.setVisibleGrids([GRID_ID.NUMBER_SPACE]); 
			if (content == 'Rukkuea') {
				inputOptions.forceMonoCharacter = true;
				inputOptions.maxNumber = 5;
			}
			if (content == 'SlitherLink') {
				inputOptions.forceMonoCharacter = true;
				inputOptions.maxNumber = 4; // "4" would mean a loop reduced to a square, but so be it 
				p_editorCore.setVisibleEdges(false);
			}
			break;
		case 'AYE-Heya': case 'Chocona': case 'CountryRoad': case 'Detour': case 'Heyawake': case 'Regionalin': case 'Shimaguni':
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
			usesChains = false;
			saveLoadModeId = PUZZLES_KIND.STAR_BATTLE; 
			p_editorCore.maskAllGrids();
			hasStars = true; break;
		case 'Akari': case 'Koburin': case 'Linesweeper': case 'Shakashaka': case 'Shugaku': case 'Sukoro':
			p_editorCore.setWallsOff();
			saveLoadModeId = PUZZLES_KIND.DIGITS_X_ONLY;
			inputOptions.maxNumber = (content == 'Linesweeper' ? 8 : 4);
			if (content == 'Sukoro') {
				inputOptions.minNumber = 1;
			}
			p_editorCore.setVisibleGrids([GRID_ID.DIGIT_X_SPACE]); break;
		case 'CanalView': case 'Corral': case 'Kuromasu': case 'Nurikabe':
			p_editorCore.setWallsOff();
			saveLoadModeId = PUZZLES_KIND.NUMBERS_X_ONLY;
			p_editorCore.setVisibleGrids([GRID_ID.NUMBER_X_SPACE]); break;
		case 'Yajilin': case 'Yajikabe': // Can also include Yajisan-Kazusan
			p_editorCore.setWallsOff();
			saveLoadModeId = PUZZLES_KIND.YAJILIN_LIKE;
			p_editorCore.setVisibleGrids([GRID_ID.YAJILIN_LIKE]); break;
		case 'Tapa': 
			p_editorCore.setWallsOff();
			saveLoadModeId = PUZZLES_KIND.TAPA;
			p_editorCore.setVisibleGrids([GRID_ID.TAPA]); break;
		case 'Stitches':
			usesChains = false;
			saveLoadModeId = PUZZLES_KIND.STITCHES;
			p_editorCore.setMarginInfo(MARGIN_KIND.NUMBERS_LEFT_UP);
			hasBounds = true;
			break;
		case 'Gappy':
			usesChains = false;
			saveLoadModeId = PUZZLES_KIND.ONLY_ONE_NUMBER_LEFT_UP_SQUARE;
			p_editorCore.setMarginInfo(MARGIN_KIND.NUMBERS_LEFT_UP);
			p_editorCore.setWallsOff();
			break; 
		case 'Putteria':
			saveLoadModeId = PUZZLES_KIND.XS_AND_ONE_O_PER_REGION;
			p_editorCore.setVisibleGrids([GRID_ID.OX]);
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
		case 'Galaxies':
			usesChains = false;
			saveLoadModeId = PUZZLES_KIND.GALAXIES;
			p_editorCore.setVisibleGrids([GRID_ID.GALAXIES]); 
			p_editorCore.setWallsOff();
			break; 
		case 'Moonsun':
			saveLoadModeId = PUZZLES_KIND.MOONSUN;
			p_editorCore.setVisibleGrids([GRID_ID.MOONSUN]); break;
			break; 
		case 'Yagit':
			saveLoadModeId = PUZZLES_KIND.YAGIT;
			p_editorCore.setVisibleGrids([GRID_ID.YAGIT, GRID_ID.KNOTS]); 
			p_editorCore.setWallsOff(); break;
			break; 	
		case 'GrandTour':
			usesChains = false;
			saveLoadModeId = PUZZLES_KIND.WALLS_ONLY;
			p_editorCore.setLinksOnly();
		default: // norinori, lits, entryExit... no numbers, only regions. 
			usesChains = false;
			saveLoadModeId = PUZZLES_KIND.WALLS_ONLY;
			break; 
    } // Credits for multiple statements in cases : https://stackoverflow.com/questions/13207927/switch-statement-multiple-cases-in-javascript
	if (usesChains) {		
		p_editorCore.setVisibleWildcardGrid();
	}
	copySaveModeInto(saveLoadModeId, p_saveLoadMode);
	adaptCanvasAndGrid(p_canvas, p_drawer, p_editorCore);
	
	const squarePuzzle = correspondsToSquarePuzzle(saveLoadModeId); 
	maskElementConditional(p_fields.spanXYSeparated, squarePuzzle || forcedSizePuzzle);
	maskElementConditional(p_fields.spanXYBound, !squarePuzzle || forcedSizePuzzle);
	maskElementConditional(p_fields.spanStars, !hasStars);
	maskElementConditional(p_fields.spanSelectSudoku, saveLoadModeId != PUZZLES_KIND.SUDOKU);
	maskElementConditional(p_fields.submitResizeGrid, forcedSizePuzzle);
	maskElementConditional(p_fields.spanBounds, !hasBounds);
	maskElementConditional(p_fields.spanMesh, p_editorCore.hasVisibleEdges() || p_editorCore.holdsLinks());
	maskElementConditional(p_buttons.stateSpace, !p_editorCore.hasWalls());
	maskElementConditional(p_buttons.wallsAroundSelection, !p_editorCore.hasWalls());
	maskElementConditional(p_buttons.symbolPrompt, !usesChains);
	maskElementConditional(p_buttons.wildCards, !usesChains);
	maskElementConditional(p_buttons.massSymbolsPrompt, !usesChains);
	maskElementConditional(p_buttons.oneSymbol, inputOptions.monoSymbolToEnter == null);
}


function maskElementConditional(p_field, p_visible) {
	if (p_visible) {
		p_field.style.display = "none";
	} else {
		p_field.style.display = "inline-block";
	}
}