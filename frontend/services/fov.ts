import type { CellOfGrid } from "~/models/CellOfGrid";

// Select cells in a radius
export function getCellsInRadius(cellId : number, radius :number, numRows : number, numCols : number) : number[] {
  const cellsInRadius = [];

  const currentRow = Math.floor(cellId / numCols);
  const currentCol = cellId % numCols;

  for (let rowOffset = -radius; rowOffset <= radius; rowOffset++) {
      for (let colOffset = -radius; colOffset <= radius; colOffset++) {
      const newRow = currentRow + rowOffset;
      const newCol = currentCol + colOffset;

      // Ensure the new cell is within grid boundaries
      if (newRow >= 0 && newRow < numRows && newCol >= 0 && newCol < numCols) {
          const newCellId = newRow * numCols + newCol;
          cellsInRadius.push(newCellId);
      }
      }
  }

  return cellsInRadius;
  }


  // Getting the direction of the cells
  export function getDirectionClass(centerCell : CellOfGrid, allCells : CellOfGrid[], radius : number,  numCols : number) {
    const size = 2*radius+1;

    console.log("Number of cols: " + numCols);
    
    const upLeft = centerCell.id - numCols*radius - radius;
    const upRight = centerCell.id - numCols*radius + radius;

    const downLeft = centerCell.id + numCols*radius - radius;
    const downRight = centerCell.id + numCols*radius + radius;

    const leftSizeIds : number[] = [];
    const rightSizeIds : number[] = [];
    const cellsInRadius = getCellsInRadius(centerCell.id, radius-1, size, numCols);

    let cellValueCounter : number = upLeft + numCols;

    while(cellValueCounter < downLeft-1){
        leftSizeIds.push(cellValueCounter);
        rightSizeIds.push(cellValueCounter+radius*2);
        cellValueCounter += numCols;
    }

    console.log("centerCell: " + centerCell.id);
    console.log("upLeft: " + upLeft);
    console.log("upRight: " + upRight);
    console.log("downLeft: " + downLeft);
    console.log("downRight: " + downRight);

    console.log("leftSizeIds: " + leftSizeIds);
    console.log("rightSizeIds: " + rightSizeIds);

    allCells.forEach(cell => {
        if(cell.visibility){
            cell.classes = 'transparent-cell';
            return;
        }

        if(cell.id == upLeft){
            cell.classes = 'gradient-radial-to-br ';
        }else if(cell.id == upRight){
            cell.classes = 'gradient-radial-to-bl ';
        }else if(cell.id == downLeft){
            cell.classes = 'gradient-radial-to-tr ';
        }else if(cell.id == downRight){
            cell.classes = 'gradient-radial-to-tl ';
        }else if(cell.id > upLeft && cell.id < upRight){
            cell.classes = 'gradient-to-b ';
        }else if(cell.id > downLeft && cell.id < downRight){
            cell.classes = 'gradient-to-t ';
        }else if(leftSizeIds.includes(cell.id)){
            cell.classes = 'gradient-to-r ';
        }else if(rightSizeIds.includes(cell.id)){
            cell.classes = 'gradient-to-l ';
        }else{
            cell.classes = 'transparent-cell';
        }

        cell.visibility = true;
    });

  }
  
  