import React, { createContext, useContext, useReducer, useEffect } from "react";

import { Grid, Button, Image } from "semantic-ui-react";

import PegChoices from "./PegChoices";
import DisplayRow from "./DisplayRow";
import DisplayCode from "./DisplayCode";
import GameInfo from "./GameInfo";
import { compareToAnswer, createSolution } from "../Common/utils";
import { HeaderImage } from "../images";
import { COLOR_SET } from "../Common/constants";
import WinLoseModal from "./WinLoseModal";
// import GiveUp from "./GiveUp";

const maxTries = 10;

const initialState = {
  numPuzzlePegs: 4,
  numColorsToUse: 5,
  colorsToUse: [],
  selectedColors: [],
  guesses: [],
  answerCodes: [],
  solution: [],
  solved: false,
};

const actions = {
  SELECT_COLOR: "SELECT_COLOR",
  SET_NUM_PUZZLE_PEGS: "SET_NUM_PUZZLE_PEGS",
  SET_NUM_COLORS_TO_USE: "SET_NUM_COLORS_TO_USE",
  SET_COLORS_TO_USE: "SET_COLORS_TO_USE",
  SUBMIT_GUESS: "SUBMIT_GUESS",
  RESET_SELECTED_COLORS: "RESET_SELECTED_COLORS",
  RESET_SOLVED: "RESET_SOLVED",
  CREATE_SOLUTION: "CREATE_SOLUTION",
  RESTART: "RESTART",
};

function gameReducer(state, action) {
  const colorSet = state.colorsToUse;
  const numPegs = state.numPuzzlePegs;
  const numColorsToUse = state.numColorsToUse;

  switch (action.type) {
    case actions.SELECT_COLOR:
      const newColors = [...state.selectedColors, action.value];
      return state.selectedColors.length < numPegs
        ? { ...state, selectedColors: newColors }
        : state;
    case actions.SUBMIT_GUESS:
      const answerCode = compareToAnswer(action.value, state.solution);
      const newAnswerCodes = [...state.answerCodes, answerCode];
      const solved =
        answerCode.indexOf("white") < 0 &&
        answerCode.length === state.numPuzzlePegs;
      const lost = newAnswerCodes.length === maxTries && !solved;
      const newGuesses = [...state.guesses, action.value];
      return {
        ...state,
        guesses: newGuesses,
        answerCodes: newAnswerCodes,
        selectedColors: [],
        solved: solved,
        lost: lost,
      };
    case actions.RESET_SELECTED_COLORS:
      return { ...state, selectedColors: [] };
    case actions.CREATE_SOLUTION:
      return { ...state, solution: createSolution(numPegs, colorSet) };
    case actions.RESTART:
      return {
        ...state,
        ...initialState,
        numPuzzlePegs: numPegs, // I don't think I need these 3 lines
        numColorsToUse: numColorsToUse,
        colorsToUse: COLOR_SET.slice(0, numColorsToUse),
        solution: createSolution(numPegs, colorSet),
        solved: false,
        lost: false,
      };
    case actions.SET_NUM_PUZZLE_PEGS:
      return { ...state, numPuzzlePegs: action.value };
    case actions.SET_NUM_COLORS_TO_USE:
      return { ...state, numColorsToUse: action.value };
    case actions.SET_COLORS_TO_USE:
      return { ...state, colorsToUse: action.value };
    default:
      return state;
  }
}

export default function GameBoard() {
  return (
    <Provider>
      <Board />
    </Provider>
  );
}

export const GameContext = createContext();

function Provider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const value = {
    selectedColors: state.selectedColors,
    colorsToUse: state.colorsToUse,
    numPuzzlePegs: state.numPuzzlePegs,
    numColorsToUse: state.numColorsToUse,
    guesses: state.guesses,
    answerCodes: state.answerCodes,
    solution: state.solution,
    solved: state.solved,
    lost: state.lost,
    selectColor: (value) => dispatch({ type: actions.SELECT_COLOR, value }),
    setNumPuzzlePegs: (value) =>
      dispatch({ type: actions.SET_NUM_PUZZLE_PEGS, value }),
    setNumColorsToUse: (value) =>
      dispatch({ type: actions.SET_NUM_COLORS_TO_USE, value }),
    setColorsToUse: (value) =>
      dispatch({ type: actions.SET_COLORS_TO_USE, value }),
    submitGuess: (value) => dispatch({ type: actions.SUBMIT_GUESS, value }),
    resetSelectColors: () => dispatch({ type: actions.RESET_SELECTED_COLORS }),
    resetSolved: () => dispatch({ type: actions.RESET_SOLVED }),
    createSolution: () => dispatch({ type: actions.CREATE_SOLUTION }),
    restart: () => dispatch({ type: actions.RESTART }),
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

function Board() {
  const {
    selectedColors,
    colorsToUse,
    numPuzzlePegs,
    numColorsToUse,
    resetSelectColors,
    setColorsToUse,
    submitGuess,
    createSolution,
    guesses,
    answerCodes,
    solution,
  } = useContext(GameContext);

  useEffect(() => {
    console.log(solution);
    if (solution.length === 0) {
      setColorsToUse(COLOR_SET.slice(0, numColorsToUse));
      createSolution(numPuzzlePegs, colorsToUse);
    }
  });

  return (
    <Grid className="main" container centered celled>
      <Grid.Row>
        <Grid.Column width={10}>
          <Image src={HeaderImage} alt={"Code Cracker"} />
          <GameInfo />
          <WinLoseModal />
        </Grid.Column>
      </Grid.Row>

      <Grid.Row className="guessed-section" centered>
        <Grid.Column width={7}>
          {answerCodes.length > 0 && (
            <Grid container celled>
              {answerCodes.map((code, idx) => (
                <Grid.Row verticalAlign="middle">
                  <Grid.Column className="gameboard-row" width={4}>
                    <DisplayCode
                      key={`code-${idx}`}
                      name={`code-${idx}`}
                      colors={code}
                    />
                  </Grid.Column>
                  <Grid.Column className="gameboard-row" width={10}>
                    <DisplayRow
                      key={`row-${idx}`}
                      name={`row-${idx}`}
                      colors={guesses[idx]}
                    />
                  </Grid.Column>
                </Grid.Row>
              ))}
            </Grid>
          )}
        </Grid.Column>
        <Grid.Column width={5}>
          <Grid.Row>
            <h3>PEG OPTIONS</h3>
            <PegChoices />
            <hr />
            <h3>GUESS:</h3>
            <DisplayRow name={`selection`} colors={selectedColors} />
            <hr />
            <div>
              <>
                <Button variant="contained" onClick={() => resetSelectColors()}>
                  Clear
                </Button>
                <Button
                  variant="contained"
                  disabled={selectedColors.length !== numPuzzlePegs}
                  onClick={() => submitGuess(selectedColors)}
                >
                  Submit
                </Button>
              </>
            </div>
          </Grid.Row>
          {/* <Grid.Row>
            <GiveUp />
          </Grid.Row> */}
        </Grid.Column>
      </Grid.Row>
    </Grid>
  );
}
