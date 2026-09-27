import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';

import { displayOption, taskInstruction, taskQuestion } from '../domain/tasks/presentation';
import { shuffled } from '../domain/tasks/bank';
import { colors } from '../theme';
import type { Task } from '../types/tasks';

type Props = {
  task: Task;
  onCorrect: () => void;
  onWrong: () => void;
  disabled?: boolean;
  showVisualHelp?: boolean;
};

const COLOR_MAP: Record<string, string> = {
  w: '#FFFFFF',
  y: '#F2C94C',
  b: '#4F6FD6'
};

export function TaskInteraction({
  task,
  onCorrect,
  onWrong,
  disabled = false,
  showVisualHelp = true
}: Props) {
  const [selectedCells, setSelectedCells] = useState<number[]>([]);
  const [gridValues, setGridValues] = useState<(string | number)[]>([]);
  const [sudokuValues, setSudokuValues] = useState<Record<number, number>>({});
  const [activeSudoku, setActiveSudoku] = useState<number | null>(null);
  const [codeLetters, setCodeLetters] = useState<string[]>([]);
  const [memoryPhase, setMemoryPhase] = useState<'memorize' | 'answer'>('memorize');
  const [selectedOption, setSelectedOption] = useState<string | number | null>(null);

  const options = useMemo(() => shuffled(task.options ?? []), [task.id]);

  useEffect(() => {
    setSelectedCells([]);
    setSudokuValues({});
    setActiveSudoku(null);
    setCodeLetters([]);
    setMemoryPhase('memorize');
    setSelectedOption(null);

    if (task.renderer === 'color_grid_copy') {
      const size = Number(task.content?.rows ?? 0) * Number(task.content?.columns ?? 0);
      setGridValues(Array.from({ length: size }, () => 'w'));
    } else if (task.renderer === 'binary_grid_copy') {
      const size = Number(task.content?.rows ?? 0) * Number(task.content?.columns ?? 0);
      setGridValues(Array.from({ length: size }, () => 0));
    } else {
      setGridValues([]);
    }

    const memoryRenderers = new Set([
      'image_memory',
      'location_memory_grid',
      'sequence_memory',
      'number_memory',
      'pair_memory'
    ]);

    if (!memoryRenderers.has(task.renderer)) return;

    const seconds = Number(task.content?.display_seconds ?? 3);
    const timer = setTimeout(() => setMemoryPhase('answer'), seconds * 1000);

    return () => clearTimeout(timer);
  }, [task.id, task.renderer, task.content]);

  if (
    task.renderer === 'image_memory' ||
    task.renderer === 'location_memory_grid' ||
    task.renderer === 'sequence_memory' ||
    task.renderer === 'number_memory' ||
    task.renderer === 'pair_memory'
  ) {
    const answerPrompt = String(
      task.content?.answer_prompt ?? 'Wybierz poprawną odpowiedź.'
    );

    if (memoryPhase === 'memorize') {
      return (
        <View style={styles.taskCard}>
          <Text style={styles.memoryLabel}>ZAPAMIĘTAJ</Text>

          {task.renderer === 'pair_memory' ? (
            <View style={styles.memoryPairs}>
              {((task.content?.memorize_pairs ?? []) as Array<{
                item: string;
                pair: string;
              }>).map((pair, index) => (
                <View key={index} style={styles.memoryPair}>
                  <Text style={styles.memoryItem}>{pair.item}</Text>
                  <Text style={styles.memoryArrow}>→</Text>
                  <Text style={styles.memoryItem}>{pair.pair}</Text>
                </View>
              ))}
            </View>
          ) : task.renderer === 'location_memory_grid' ? (
            <MemoryLocationGrid task={task} />
          ) : (
            <View style={styles.memoryItems}>
              {((task.content?.memorize_items ?? []) as Array<string | number>).map(
                (item, index) => (
                  <View key={index} style={styles.memoryItemBox}>
                    <Text style={styles.memoryItem}>{String(item)}</Text>
                  </View>
                )
              )}
            </View>
          )}

          <Text style={styles.memoryCountdown}>
            Za chwilę elementy znikną.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.taskCard}>
        <Text style={styles.memoryLabel}>TERAZ ODPOWIEDZ</Text>
        <Text style={styles.memoryQuestion}>{answerPrompt}</Text>

        <View style={styles.options}>
          {options.map((option) => {
            const selected = String(selectedOption) === String(option);

            return (
              <Pressable
                key={String(option)}
                style={[styles.option, selected ? styles.optionSelected : null]}
                disabled={disabled}
                onPress={() => setSelectedOption(option)}
              >
                <Text style={styles.optionText}>
                  {displayMemoryOption(option)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <CheckButton
          disabled={disabled || selectedOption == null}
          onPress={() => {
            String(selectedOption) === String(task.correct_answer)
              ? onCorrect()
              : onWrong();
          }}
        />
      </View>
    );
  }

  if (task.renderer === 'sudoku_grid') {
    const grid = (task.content?.grid ?? []) as Array<Array<number | null>>;
    const missingPositions = (task.content?.missing_positions ?? []) as Array<[number, number]>;
    const correct = Array.isArray(task.correct_answer) ? task.correct_answer : [];

    const blankIndexByCell = new Map<number, number>();
    missingPositions.forEach(([row, col], index) => {
      blankIndexByCell.set(row * 4 + col, index);
    });

    function checkSudoku() {
      const complete = correct.every(
        (value, index) => sudokuValues[index] === Number(value)
      );

      if (complete) onCorrect();
      else onWrong();
    }

    return (
      <TaskShell task={task}>
        <View style={styles.sudokuGrid}>
          {grid.flatMap((row, rowIndex) =>
            row.map((value, colIndex) => {
              const cellIndex = rowIndex * 4 + colIndex;
              const blankIndex = blankIndexByCell.get(cellIndex);
              const isBlank = blankIndex !== undefined;
              const selected = isBlank && activeSudoku === blankIndex;

              return (
                <Pressable
                  key={cellIndex}
                  style={[
                    styles.sudokuCell,
                    selected ? styles.sudokuCellActive : null
                  ]}
                  disabled={!isBlank || disabled}
                  onPress={() => isBlank && setActiveSudoku(blankIndex)}
                >
                  <Text style={styles.sudokuText}>
                    {isBlank ? sudokuValues[blankIndex] ?? '' : value}
                  </Text>
                </Pressable>
              );
            })
          )}
        </View>

        <View style={styles.numberPad}>
          {[1, 2, 3, 4].map((value) => (
            <Pressable
              key={value}
              style={styles.smallOption}
              disabled={disabled || activeSudoku === null}
              onPress={() => {
              if (disabled) return;
                if (activeSudoku === null) return;
                setSudokuValues((current) => ({
                  ...current,
                  [activeSudoku]: value
                }));
              }}
            >
              <Text style={styles.optionText}>{value}</Text>
            </Pressable>
          ))}
        </View>

        <CheckButton
          disabled={
            disabled ||
            correct.some((_, index) => sudokuValues[index] === undefined)
          }
          onPress={checkSudoku}
        />
      </TaskShell>
    );
  }

  if (task.renderer === 'color_grid_copy') {
    const pattern = (task.content?.pattern ?? []) as string[];
    const colors = ['w', ...((task.content?.colors ?? []) as string[])];

    function cycleCell(index: number) {
      if (disabled) return;
      const current = String(gridValues[index] ?? 'w');
      const nextIndex = (colors.indexOf(current) + 1) % colors.length;
      setGridValues((values) =>
        values.map((value, cellIndex) =>
          cellIndex === index ? colors[nextIndex] : value
        )
      );
    }

    return (
      <TaskShell task={task}>
        <Text style={styles.miniLabel}>Wzór</Text>
        <Grid
          values={pattern}
          columns={Number(task.content?.columns ?? 4)}
          renderCell={(value) => (
            <View
              style={[
                styles.colorCell,
                { backgroundColor: COLOR_MAP[String(value)] ?? '#FFFFFF' }
              ]}
            />
          )}
        />

        <Text style={styles.miniLabel}>Twoja siatka</Text>
        <Grid
          values={gridValues}
          columns={Number(task.content?.columns ?? 4)}
          renderCell={(value, index) => (
            <Pressable
              style={[
                styles.colorCell,
                { backgroundColor: COLOR_MAP[String(value)] ?? '#FFFFFF' }
              ]}
              onPress={() => cycleCell(index)}
              disabled={disabled}
            />
          )}
        />

        <CheckButton
          disabled={disabled}
          onPress={() => {
            const correct = pattern.every(
              (value, index) => String(gridValues[index]) === String(value)
            );
            correct ? onCorrect() : onWrong();
          }}
        />
      </TaskShell>
    );
  }

  if (task.renderer === 'binary_grid_copy') {
    const pattern = (task.content?.pattern ?? []) as number[];

    return (
      <TaskShell task={task}>
        <Text style={styles.miniLabel}>Wzór</Text>
        <Grid
          values={pattern}
          columns={Number(task.content?.columns ?? 4)}
          renderCell={(value) => (
            <View
              style={[
                styles.binaryCell,
                Number(value) === 1 ? styles.binaryCellFilled : null
              ]}
            />
          )}
        />

        <Text style={styles.miniLabel}>Twoja siatka</Text>
        <Grid
          values={gridValues}
          columns={Number(task.content?.columns ?? 4)}
          renderCell={(value, index) => (
            <Pressable
              style={[
                styles.binaryCell,
                Number(value) === 1 ? styles.binaryCellFilled : null
              ]}
              disabled={disabled}
              onPress={() =>
                setGridValues((values) =>
                  values.map((cell, cellIndex) =>
                    cellIndex === index ? (Number(cell) === 1 ? 0 : 1) : cell
                  )
                )
              }
            />
          )}
        />

        <CheckButton
          disabled={disabled}
          onPress={() => {
            const correct = pattern.every(
              (value, index) => Number(gridValues[index]) === Number(value)
            );
            correct ? onCorrect() : onWrong();
          }}
        />
      </TaskShell>
    );
  }

  if (task.renderer === 'visual_search') {
    const grid = (task.content?.grid ?? []) as number[];
    const target = (task.content?.target ?? []) as number[];
    const validMatches = findVisualSearchMatches(
      grid,
      Number(task.content?.rows ?? 5),
      Number(task.content?.columns ?? 5),
      target
    );

    return (
      <TaskShell task={task}>
        <Text style={styles.targetText}>
          Szukaj: {target.join('  ')}
        </Text>

        <View style={styles.searchGrid}>
          {grid.map((value, index) => {
            const selected = selectedCells.includes(index);
            return (
              <Pressable
                key={index}
                style={[
                  styles.searchCell,
                  selected ? styles.searchCellSelected : null
                ]}
                disabled={disabled}
                onPress={() =>
                  setSelectedCells((current) =>
                    current.includes(index)
                      ? current.filter((item) => item !== index)
                      : current.length < target.length
                        ? [...current, index]
                        : current
                  )
                }
              >
                <Text style={styles.searchText}>{value}</Text>
              </Pressable>
            );
          })}
        </View>

        <CheckButton
          disabled={disabled || selectedCells.length !== target.length}
          onPress={() => {
            const actual = [...selectedCells].sort((a, b) => a - b);

            const correct = validMatches.some((match) => {
              const expected = [...match].sort((a, b) => a - b);
              return (
                actual.length === expected.length &&
                actual.every((value, index) => value === expected[index])
              );
            });

            correct ? onCorrect() : onWrong();
          }}
        />
      </TaskShell>
    );
  }

  if (task.renderer === 'symbol_code') {
    const legend = task.content?.legend ?? {};
    const code = (task.content?.code ?? []) as string[];

    return (
      <TaskShell task={task}>
        <View style={styles.legend}>
          {Object.entries(legend).map(([symbol, letter]) => (
            <View key={symbol} style={styles.legendItem}>
              <Text style={styles.legendSymbol}>{symbol}</Text>
              <Text style={styles.legendLetter}>{String(letter)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.codeRow}>
          {code.map((symbol, index) => (
            <View key={index} style={styles.codeColumn}>
              <Text style={styles.codeSymbol}>{symbol}</Text>
              <TextInput
                value={codeLetters[index] ?? ''}
                onChangeText={(value) =>
                  setCodeLetters((current) => {
                    const next = [...current];
                    next[index] = value.slice(-1).toUpperCase();
                    return next;
                  })
                }
                maxLength={1}
                autoCapitalize="characters"
                style={styles.codeInput}
                editable={!disabled}
              />
            </View>
          ))}
        </View>

        <CheckButton
          disabled={disabled || codeLetters.length < code.length || codeLetters.some((value) => !value)}
          onPress={() => {
            const answer = codeLetters.join('').toUpperCase();
            answer === String(task.correct_answer).toUpperCase()
              ? onCorrect()
              : onWrong();
          }}
        />
      </TaskShell>
    );
  }

  return (
    <TaskShell task={task}>
      {task.renderer === 'equation_with_dots' && showVisualHelp ? (
        <DotHint task={task} />
      ) : null}

      {task.renderer === 'command_grid_plan' ? (
        <CommandGrid task={task} />
      ) : null}

      <View style={styles.options}>
        {options.map((option) => {
          const selected = String(selectedOption) === String(option);

          return (
            <Pressable
              key={String(option)}
              style={[styles.option, selected ? styles.optionSelected : null]}
              disabled={disabled}
              onPress={() => setSelectedOption(option)}
            >
              <Text style={styles.optionText}>{displayOption(option)}</Text>
            </Pressable>
          );
        })}
      </View>

      <CheckButton
        disabled={disabled || selectedOption == null}
        onPress={() => {
          String(selectedOption) === String(task.correct_answer)
            ? onCorrect()
            : onWrong();
        }}
      />
    </TaskShell>
  );
}

function TaskShell({
  task,
  children
}: {
  task: Task;
  children: ReactNode;
}) {
  return (
    <View style={styles.taskCard}>
      <Text style={styles.instruction}>{taskInstruction(task)}</Text>
      <Text style={styles.question}>{taskQuestion(task)}</Text>
      {children}
    </View>
  );
}

function DotHint({ task }: { task: Task }) {
  const left = Number(task.content?.left ?? 0);
  const right = Number(task.content?.right ?? 0);
  const isSubtraction = task.subcategory === 'subtraction';
  const [marked, setMarked] = useState<number[]>([]);

  useEffect(() => {
    setMarked([]);
  }, [task.id]);

  if (isSubtraction) {
    return (
      <View style={styles.dotHintBox}>
        <Text style={styles.dotHintText}>
          Odznacz {right} kropek, a potem policz te, które zostały.
        </Text>
        <View style={styles.dotWrap}>
          {Array.from({ length: left }, (_, index) => {
            const removed = marked.includes(index);

            return (
              <Pressable
                key={index}
                style={[styles.dot, removed ? styles.dotRemoved : null]}
                onPress={() =>
                  setMarked((current) => {
                    if (current.includes(index)) {
                      return current.filter((item) => item !== index);
                    }

                    if (current.length >= right) return current;
                    return [...current, index];
                  })
                }
              />
            );
          })}
        </View>
        <Text style={styles.dotCounter}>
          Odznaczono: {marked.length} z {right}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.dotHintBox}>
      <Text style={styles.dotHintText}>
        Masz {left}. Dodaj jeszcze {right}.
      </Text>
      <View style={styles.additionGroups}>
        <View style={styles.dotGroup}>
          <Text style={styles.dotGroupLabel}>{left}</Text>
          <View style={styles.dotWrap}>
            {Array.from({ length: left }, (_, index) => (
              <View key={index} style={styles.dot} />
            ))}
          </View>
        </View>

        <Text style={styles.plus}>+</Text>

        <View style={styles.dotGroup}>
          <Text style={styles.dotGroupLabel}>{right}</Text>
          <View style={styles.dotWrap}>
            {Array.from({ length: right }, (_, index) => {
              const counted = marked.includes(index);
              return (
                <Pressable
                  key={index}
                  style={[styles.dot, counted ? null : styles.dotOutline]}
                  onPress={() =>
                    setMarked((current) =>
                      current.includes(index)
                        ? current.filter((item) => item !== index)
                        : [...current, index]
                    )
                  }
                />
              );
            })}
          </View>
        </View>
      </View>

      <Text style={styles.dotCounter}>Razem policzono: {left + marked.length}</Text>
    </View>
  );
}

function CommandGrid({ task }: { task: Task }) {
  const size = Number(task.content?.grid_size ?? 4);
  const start = (task.content?.start ?? [0, 0]) as [number, number];
  const target = (task.content?.target ?? [0, 0]) as [number, number];
  const obstacles = (task.content?.obstacles ?? []) as Array<[number, number]>;

  const obstacleKeys = new Set(obstacles.map(([row, col]) => `${row}:${col}`));
  const cells = Array.from({ length: size * size }, (_, index) => index);

  return (
    <View style={[styles.commandGrid, { width: size * 58 }]}>
      {cells.map((index) => {
        const row = Math.floor(index / size);
        const col = index % size;
        const isStart = row === start[0] && col === start[1];
        const isTarget = row === target[0] && col === target[1];
        const isObstacle = obstacleKeys.has(`${row}:${col}`);

        return (
          <View
            key={index}
            style={[
              styles.commandCell,
              isObstacle ? styles.commandObstacle : null,
              isTarget ? styles.commandTarget : null
            ]}
          >
            <Text style={styles.commandCellText}>
              {isStart ? '🤖' : isTarget ? '⭐' : isObstacle ? '■' : ''}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function MemoryLocationGrid({ task }: { task: Task }) {
  const size = Number(task.content?.grid_size ?? 3);
  const position = (task.content?.position ?? [0, 0]) as [number, number];
  const item = String(task.content?.item ?? '★');
  const cells = Array.from({ length: size * size }, (_, index) => index);

  return (
    <View style={[styles.memoryLocationGrid, { width: size * 62 }]}>
      {cells.map((index) => {
        const row = Math.floor(index / size);
        const col = index % size;
        const visible = row === position[0] && col === position[1];

        return (
          <View key={index} style={styles.memoryLocationCell}>
            <Text style={styles.memoryItem}>{visible ? item : ''}</Text>
          </View>
        );
      })}
    </View>
  );
}

function findVisualSearchMatches(
  grid: Array<string | number>,
  rows: number,
  columns: number,
  target: Array<string | number>
) {
  const matches: number[][] = [];

  if (!target.length) return matches;

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col <= columns - target.length; col += 1) {
      const indexes = target.map(
        (_, offset) => row * columns + col + offset
      );

      const isMatch = indexes.every(
        (index, offset) => String(grid[index]) === String(target[offset])
      );

      if (isMatch) matches.push(indexes);
    }
  }

  return matches;
}

function displayMemoryOption(option: string | number) {
  const labels: Record<string, string> = {
    top_left: '↖ Góra lewa',
    top_right: '↗ Góra prawa',
    bottom_left: '↙ Dół lewy',
    bottom_right: '↘ Dół prawy',
    center: '● Środek',
    top: '↑ Góra',
    bottom: '↓ Dół',
    left: '← Lewo',
    right: '→ Prawo'
  };

  return labels[String(option)] ?? String(option);
}

function CheckButton({
  disabled,
  onPress
}: {
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.checkButton, disabled ? styles.checkDisabled : null]}
      disabled={disabled}
      onPress={onPress}
    >
      <Text style={styles.checkText}>SPRAWDŹ</Text>
    </Pressable>
  );
}

function Grid({
  values,
  columns,
  renderCell
}: {
  values: Array<string | number>;
  columns: number;
  renderCell: (value: string | number, index: number) => ReactNode;
}) {
  return (
    <View style={[styles.genericGrid, { width: columns * 48 }]}>
      {values.map((value, index) => (
        <View key={index}>{renderCell(value, index)}</View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  taskCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 24,
    padding: 22
  },
  instruction: {
    color: colors.muted,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center'
  },
  question: {
    color: colors.text,
    fontSize: 38,
    lineHeight: 46,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 18,
    marginBottom: 24
  },
  options: {
    gap: 10
  },
  option: {
    minHeight: 58,
    borderColor: colors.border,
    borderWidth: 2,
    borderRadius: 18,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12
  },
  optionSelected: {
    borderColor: colors.accentDark,
    backgroundColor: '#EEF6F2'
  },
  smallOption: {
    minWidth: 58,
    minHeight: 54,
    borderColor: colors.border,
    borderWidth: 2,
    borderRadius: 16,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center'
  },
  optionText: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900'
  },
  dotHintBox: {
    borderRadius: 18,
    backgroundColor: '#F6F7F5',
    padding: 14,
    marginBottom: 20
  },
  dotHintText: {
    color: colors.muted,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12
  },
  dotWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 7
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.text,
    borderWidth: 2,
    borderColor: colors.text
  },
  dotOutline: {
    backgroundColor: '#FFF'
  },
  dotRemoved: {
    backgroundColor: '#FFF',
    opacity: 0.45
  },
  dotCounter: {
    color: colors.text,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 12
  },
  additionGroups: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12
  },
  dotGroup: {
    maxWidth: 150,
    alignItems: 'center'
  },
  dotGroupLabel: {
    color: colors.muted,
    fontWeight: '900',
    marginBottom: 6
  },
  plus: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900'
  },
  sudokuGrid: {
    width: 248,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignSelf: 'center'
  },
  sudokuCell: {
    width: 62,
    height: 62,
    borderWidth: 1,
    borderColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF'
  },
  sudokuCellActive: {
    backgroundColor: '#E8F3ED'
  },
  sudokuText: {
    color: colors.text,
    fontSize: 25,
    fontWeight: '900'
  },
  numberPad: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 18
  },
  miniLabel: {
    color: colors.muted,
    fontWeight: '900',
    marginTop: 8,
    marginBottom: 8,
    textAlign: 'center'
  },
  genericGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignSelf: 'center',
    marginBottom: 16
  },
  colorCell: {
    width: 46,
    height: 46,
    borderWidth: 1,
    borderColor: colors.border
  },
  binaryCell: {
    width: 46,
    height: 46,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FFF'
  },
  binaryCellFilled: {
    backgroundColor: colors.text
  },
  targetText: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 16
  },
  searchGrid: {
    width: 260,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignSelf: 'center'
  },
  searchCell: {
    width: 52,
    height: 52,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF'
  },
  searchCellSelected: {
    backgroundColor: '#E8F3ED',
    borderColor: colors.accentDark,
    borderWidth: 2
  },
  searchText: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '900'
  },
  commandGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignSelf: 'center',
    marginBottom: 18
  },
  commandCell: {
    width: 58,
    height: 58,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF'
  },
  commandTarget: {
    backgroundColor: '#FFF8E8'
  },
  commandObstacle: {
    backgroundColor: '#E7E9EC'
  },
  commandCellText: {
    fontSize: 25
  },
  memoryLabel: {
    color: colors.accentDark,
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 18
  },
  memoryItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center'
  },
  memoryItemBox: {
    minWidth: 70,
    minHeight: 70,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10
  },
  memoryItem: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '900'
  },
  memoryCountdown: {
    color: colors.muted,
    textAlign: 'center',
    marginTop: 18,
    fontWeight: '700'
  },
  memoryQuestion: {
    color: colors.text,
    fontSize: 26,
    lineHeight: 34,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 22
  },
  memoryPairs: {
    gap: 10
  },
  memoryPair: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FFF'
  },
  memoryArrow: {
    color: colors.muted,
    fontSize: 22,
    fontWeight: '900'
  },
  memoryLocationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignSelf: 'center'
  },
  memoryLocationCell: {
    width: 62,
    height: 62,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF'
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20
  },
  legendItem: {
    minWidth: 64,
    padding: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center'
  },
  legendSymbol: {
    fontSize: 24
  },
  legendLetter: {
    color: colors.text,
    fontWeight: '900',
    marginTop: 3
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    flexWrap: 'wrap'
  },
  codeColumn: {
    alignItems: 'center'
  },
  codeSymbol: {
    fontSize: 28,
    marginBottom: 6
  },
  codeInput: {
    width: 52,
    height: 54,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 14,
    textAlign: 'center',
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
    backgroundColor: '#FFF'
  },
  checkButton: {
    backgroundColor: colors.accent,
    borderRadius: 18,
    padding: 15,
    alignItems: 'center',
    marginTop: 20
  },
  checkDisabled: {
    opacity: 0.45
  },
  checkText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '900'
  }
});
