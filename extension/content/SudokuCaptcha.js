class SudokuCaptcha {
  constructor(container, onSuccess, size = 9) {
    this.container = container;
    this.onSuccess = onSuccess;
    this.size = size; // 9x9 or 4x4 puzzle
    this.grid = this.generatePuzzle();
    this.render();
  }

  generatePuzzle() {
    // Start with a solved grid using backtracking
    const solvedGrid = Array.from({ length: this.size }, () => Array(this.size).fill(0));
    this.solve(solvedGrid);
    
    // Create a copy and remove numbers strategically to ensure solvability
    const puzzle = solvedGrid.map(row => [...row]);
    
    // Remove numbers in a way that ensures the puzzle remains solvable
    let removedCount = 0;
    const maxRemovals = this.size === 4 ? 8 : 45; // About 50% of cells
    const minNumbersPerRow = this.size === 4 ? 2 : 3;
    const boxSize = this.size === 4 ? 2 : 3;
    
    while (removedCount < maxRemovals) {
      const row = Math.floor(Math.random() * this.size);
      const col = Math.floor(Math.random() * this.size);
      
      if (puzzle[row][col] !== null) {
        // Check if removing this number would leave too few numbers in row/column/box
        const rowCount = puzzle[row].filter(cell => cell !== null).length;
        const colCount = puzzle.map(r => r[col]).filter(cell => cell !== null).length;
        
        // Count numbers in the box (2x2 for 4x4, 3x3 for 9x9)
        const startRow = Math.floor(row / boxSize) * boxSize;
        const startCol = Math.floor(col / boxSize) * boxSize;
        let boxCount = 0;
        for (let r = startRow; r < startRow + boxSize; r++) {
          for (let c = startCol; c < startCol + boxSize; c++) {
            if (puzzle[r][c] !== null) boxCount++;
          }
        }
        
        // Only remove if it won't leave too few numbers
        if (rowCount > minNumbersPerRow && colCount > minNumbersPerRow && boxCount > minNumbersPerRow) {
          puzzle[row][col] = null;
          removedCount++;
        }
      }
    }
    
    return puzzle;
  }

  solve(grid) {
    for (let row = 0; row < this.size; row++) {
      for (let col = 0; col < this.size; col++) {
        if (grid[row][col] === 0) {
          const nums = this.shuffle([...Array(this.size).keys()].map(n => n + 1));
          for (let num of nums) {
            if (this.isSafe(grid, row, col, num)) {
              grid[row][col] = num;
              if (this.solve(grid)) return true;
              grid[row][col] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  isSafe(grid, row, col, num) {
    // Check row & column
    for (let i = 0; i < this.size; i++) {
      if (grid[row][i] === num || grid[i][col] === num) return false;
    }
    // Check box (2x2 for 4x4, 3x3 for 9x9)
    const boxSize = this.size === 4 ? 2 : 3;
    const startRow = Math.floor(row / boxSize) * boxSize;
    const startCol = Math.floor(col / boxSize) * boxSize;
    for (let r = 0; r < boxSize; r++) {
      for (let c = 0; c < boxSize; c++) {
        if (grid[startRow + r][startCol + c] === num) return false;
      }
    }
    return true;
  }

  shuffle(array) {
    return array.sort(() => Math.random() - 0.5);
  }

  moveToNextCell(currentRow, currentCol) {
    // Find the next empty cell
    for (let r = currentRow; r < this.size; r++) {
      for (let c = (r === currentRow ? currentCol + 1 : 0); c < this.size; c++) {
        if (this.grid[r][c] === null) {
          const nextInput = this.container.querySelector(`input[data-row="${r}"][data-col="${c}"]`);
          if (nextInput) {
            nextInput.focus();
            return;
          }
        }
      }
    }
    
    // If no next cell found, focus the verify button
    const verifyBtn = document.getElementById('verify-sudoku-btn');
    if (verifyBtn) {
      verifyBtn.focus();
    }
  }

  handleArrowKeys(direction, currentRow, currentCol) {
    let newRow = currentRow;
    let newCol = currentCol;
    
    switch (direction) {
      case 'ArrowUp':
        newRow = Math.max(0, currentRow - 1);
        break;
      case 'ArrowDown':
        newRow = Math.min(this.size - 1, currentRow + 1);
        break;
      case 'ArrowLeft':
        newCol = Math.max(0, currentCol - 1);
        break;
      case 'ArrowRight':
        newCol = Math.min(this.size - 1, currentCol + 1);
        break;
    }
    
    // Find the next empty cell in the direction
    const targetInput = this.container.querySelector(`input[data-row="${newRow}"][data-col="${newCol}"]`);
    if (targetInput) {
      targetInput.focus();
    }
  }

  render() {
    this.container.innerHTML = '';
    const table = document.createElement('table');
    table.style.borderCollapse = 'collapse';
    table.style.margin = 'auto';
    table.style.background = '#111';
    table.style.border = '3px solid #fff';

    const boxSize = this.size === 4 ? 2 : 3;
    const cellSize = '40px'; // Keep consistent cell size
    const fontSize = '18px'; // Keep consistent font size

    this.grid.forEach((row, r) => {
      const tr = document.createElement('tr');
      row.forEach((cell, c) => {
        const td = document.createElement('td');
        td.style.border = '1px solid #fff';
        td.style.width = cellSize;
        td.style.height = cellSize;
        td.style.textAlign = 'center';
        td.style.fontSize = fontSize;
        td.style.color = '#0f0';
        td.style.fontWeight = 'bold';
        td.style.background = '#222';

        // Thicker borders for box sections
        if (c % boxSize === 0) td.style.borderLeft = '3px solid #fff';
        if (r % boxSize === 0) td.style.borderTop = '3px solid #fff';
        if (c === this.size - 1) td.style.borderRight = '3px solid #fff';
        if (r === this.size - 1) td.style.borderBottom = '3px solid #fff';

        if (cell === null) {
          const input = document.createElement('input');
          input.type = 'text';
          input.maxLength = 1;
          input.style.width = '100%';
          input.style.height = '100%';
          input.style.fontSize = '18px';
          input.style.textAlign = 'center';
          input.style.border = 'none';
          input.style.outline = 'none';
          input.style.background = '#000';
          input.style.color = '#fff';
          input.dataset.row = r;
          input.dataset.col = c;
          
          // Add keyboard input validation
          input.addEventListener('keydown', (e) => {
            // Allow only numbers 1-4 for 4x4, 1-9 for 9x9
            const maxNum = this.size === 4 ? '4' : '9';
            if (e.key >= '1' && e.key <= maxNum) {
              input.value = e.key;
              // Move to next empty cell without filling it
              setTimeout(() => {
                this.moveToNextCell(r, c);
              }, 10);
            } else if (e.key === 'Backspace' || e.key === 'Delete') {
              input.value = '';
            } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || 
                      e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
              this.handleArrowKeys(e.key, r, c);
            } else if (e.key === 'Enter') {
              // Check solution when Enter is pressed
              this.checkSolution();
            } else if (e.key === 'Tab') {
              // Allow Tab navigation
              return;
            } else {
              e.preventDefault();
            }
          });
          
          // Handle input events (paste, etc.)
          input.addEventListener('input', (e) => {
            const value = e.target.value;
            const maxNum = this.size === 4 ? '4' : '9';
            
            // Only allow single digits 1-maxNum
            if (value.length > 1) {
              e.target.value = value.slice(-1); // Keep only the last character
            }
            
            if (value && (value < '1' || value > maxNum)) {
              e.target.value = '';
            }
          });
          
          // Prevent mouse wheel and other input methods
          input.addEventListener('wheel', (e) => e.preventDefault());
          input.addEventListener('contextmenu', (e) => e.preventDefault());
          
          td.appendChild(input);
        } else {
          td.textContent = cell;
        }
        tr.appendChild(td);
      });
      table.appendChild(tr);
    });

    this.container.appendChild(table);
    
    // Focus the first empty cell
    setTimeout(() => {
      const firstInput = this.container.querySelector('input');
      if (firstInput) {
        firstInput.focus();
      }
    }, 100);
  }

  checkSolution() {
    const inputs = this.container.querySelectorAll('input');
    const gridCopy = JSON.parse(JSON.stringify(this.grid));

    inputs.forEach(input => {
      const r = parseInt(input.dataset.row);
      const c = parseInt(input.dataset.col);
      const value = parseInt(input.value) || 0;
      const maxValue = this.size === 4 ? 4 : 9;
      if (value >= 1 && value <= maxValue) {
        gridCopy[r][c] = value;
      }
    });

    // Debug: log the current state
    console.log('Checking solution:', gridCopy);
    console.log('Is solved?', this.isSolved(gridCopy));

    if (this.isSolved(gridCopy)) {
      this.onSuccess();
    } else {
      // Show error message in the parent component
      const errorDiv = document.getElementById('error-message');
      if (errorDiv) {
        errorDiv.style.display = 'block';
        errorDiv.style.color = '#ef4444';
        errorDiv.style.background = 'rgba(239, 68, 68, 0.1)';
        errorDiv.style.border = '1px solid rgba(239, 68, 68, 0.2)';
        errorDiv.textContent = '❌ Incorrect solution! Please try again.';
        
        // Add shake animation
        const container = document.querySelector('.sudoku-captcha-container');
        if (container) {
          container.classList.add('sudoku-captcha-error');
          setTimeout(() => {
            container.classList.remove('sudoku-captcha-error');
          }, 500);
        }
      }
      
      // Clear all inputs
      inputs.forEach(input => {
        input.value = '';
      });
      
      // Focus first input
      if (inputs.length > 0) {
        inputs[0].focus();
      }
    }
  }

  isSolved(grid) {
    const maxValue = this.size === 4 ? 4 : 9;
    const boxSize = this.size === 4 ? 2 : 3;
    
    // Check if all cells are filled
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (!grid[r][c] || grid[r][c] < 1 || grid[r][c] > maxValue) {
          return false;
        }
      }
    }
    
    // Check if the solution is valid
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const value = grid[r][c];
        
        // Check row
        for (let col = 0; col < this.size; col++) {
          if (col !== c && grid[r][col] === value) return false;
        }
        
        // Check column
        for (let row = 0; row < this.size; row++) {
          if (row !== r && grid[row][c] === value) return false;
        }
        
        // Check box (2x2 for 4x4, 3x3 for 9x9)
        const startRow = Math.floor(r / boxSize) * boxSize;
        const startCol = Math.floor(c / boxSize) * boxSize;
        for (let boxR = startRow; boxR < startRow + boxSize; boxR++) {
          for (let boxC = startCol; boxC < startCol + boxSize; boxC++) {
            if ((boxR !== r || boxC !== c) && grid[boxR][boxC] === value) {
              return false;
            }
          }
        }
      }
    }
    return true;
  }
}
