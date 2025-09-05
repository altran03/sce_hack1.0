class SudokuCaptcha {
  constructor(container, onSuccess) {
    this.container = container;
    this.onSuccess = onSuccess;
    this.size = 9; // 9x9 puzzle
    this.grid = this.generatePuzzle();
    this.render();
  }

  generatePuzzle() {
    // Start with a solved 9x9 grid using backtracking
    const emptyGrid = Array.from({ length: 9 }, () => Array(9).fill(0));
    this.solve(emptyGrid);
    
    // Remove numbers randomly to create puzzle (50% blanks)
    const puzzle = emptyGrid.map(row =>
      row.map(num => (Math.random() < 0.5 ? null : num))
    );
    return puzzle;
  }

  solve(grid) {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (grid[row][col] === 0) {
          const nums = this.shuffle([...Array(9).keys()].map(n => n + 1));
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
    for (let i = 0; i < 9; i++) {
      if (grid[row][i] === num || grid[i][col] === num) return false;
    }
    // Check 3x3 box
    const startRow = Math.floor(row / 3) * 3;
    const startCol = Math.floor(col / 3) * 3;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (grid[startRow + r][startCol + c] === num) return false;
      }
    }
    return true;
  }

  shuffle(array) {
    return array.sort(() => Math.random() - 0.5);
  }

  render() {
    this.container.innerHTML = '';
    const table = document.createElement('table');
    table.style.borderCollapse = 'collapse';
    table.style.margin = 'auto';
    table.style.background = '#111';
    table.style.border = '3px solid #fff';

    this.grid.forEach((row, r) => {
      const tr = document.createElement('tr');
      row.forEach((cell, c) => {
        const td = document.createElement('td');
        td.style.border = '1px solid #fff';
        td.style.width = '40px';
        td.style.height = '40px';
        td.style.textAlign = 'center';
        td.style.fontSize = '18px';
        td.style.color = '#0f0';
        td.style.fontWeight = 'bold';
        td.style.background = '#222';

        // Thicker borders for 3x3 sections
        if (c % 3 === 0) td.style.borderLeft = '3px solid #fff';
        if (r % 3 === 0) td.style.borderTop = '3px solid #fff';
        if (c === 8) td.style.borderRight = '3px solid #fff';
        if (r === 8) td.style.borderBottom = '3px solid #fff';

        if (cell === null) {
          const input = document.createElement('input');
          input.type = 'number';
          input.min = 1;
          input.max = 9;
          input.style.width = '100%';
          input.style.height = '100%';
          input.style.fontSize = '18px';
          input.style.textAlign = 'center';
          input.dataset.row = r;
          input.dataset.col = c;
          input.style.background = '#000';
          input.style.color = '#fff';
          td.appendChild(input);
        } else {
          td.textContent = cell;
        }
        tr.appendChild(td);
      });
      table.appendChild(tr);
    });

    const button = document.createElement('button');
    button.textContent = 'Verify';
    button.style.display = 'block';
    button.style.margin = '10px auto';
    button.addEventListener('click', () => this.checkSolution());

    this.container.appendChild(table);
    this.container.appendChild(button);
  }

  checkSolution() {
    const inputs = this.container.querySelectorAll('input');
    const gridCopy = JSON.parse(JSON.stringify(this.grid));

    inputs.forEach(input => {
      const r = parseInt(input.dataset.row);
      const c = parseInt(input.dataset.col);
      const value = parseInt(input.value);
      gridCopy[r][c] = value;
    });

    if (this.isSolved(gridCopy)) {
      alert('Captcha solved!');
      this.onSuccess();
    } else {
      alert('Incorrect! Try again.');
    }
  }

  isSolved(grid) {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (!this.isSafe(grid, r, c, grid[r][c])) return false;
      }
    }
    return true;
  }
}
