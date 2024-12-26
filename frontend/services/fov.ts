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
  export function getDirectionClass(centerCell : CellOfGrid, allCells : CellOfGrid[], radius : number,  numCols : number, walls: CellOfGrid[], currentUserId: number | undefined, dmId: number, fow: boolean) {
    
    const centerCharacter = centerCell.character;
    const wallsOriginIds = walls.map(wall => wall.id);

    const upLeft = centerCell.id - numCols*radius - radius;
    const upRight = centerCell.id - numCols*radius + radius;

    const downLeft = centerCell.id + numCols*radius - radius;
    const downRight = centerCell.id + numCols*radius + radius;

    const leftSizeIds : number[] = [];
    const rightSizeIds : number[] = [];

    let wallsIds : number[] = [];

    let cellValueCounter : number = upLeft + numCols;

    // Setting cells to the character

    if(centerCharacter){
        if (fow){
            try{
                centerCharacter.last_cells.forEach(cell => {
                    if (cell.viewedBy.length < 2 && cell.viewedBy.length > 0){
                        
                        const indexInWalls = wallsOriginIds.indexOf(cell.id);

                        if (indexInWalls != -1 && currentUserId === dmId){
                            cell.classes = 'bg-red-500/30';
                        }else{
                            cell.classes = '';
                        }

                        cell.visibility = false;
                        cell.viewedBy = cell.viewedBy.filter(viewer => viewer.id != centerCharacter.id);
                        
                        
                    }

                });
            }catch(e)
            {
                console.log("Error: ", e);
            }
        }

        centerCharacter.last_cells = allCells;
    }

    while(cellValueCounter < downLeft-1){
        leftSizeIds.push(cellValueCounter);
        rightSizeIds.push(cellValueCounter+radius*2);
        cellValueCounter += numCols;
    }

    // Filter only walls ids that are in the allCells
    const wallsInRadius = walls.filter(wall => allCells.some(cell => cell.id == wall.id));
    // Sort by id
    wallsInRadius.sort((a, b) => a.id - b.id);
    wallsIds = wallsInRadius.map(wall => wall.id);


    const indexOfCentral = wallsOriginIds.indexOf(centerCell.id);

    if (indexOfCentral != -1){
        if(currentUserId === dmId){
            centerCell.classes = 'bg-red-500/30';
        }
        return;
    }


    if(centerCell.id in wallsOriginIds){
        return;
    }

    let wallMaxTop : CellOfGrid | null = null
    let wallMaxBottom : CellOfGrid | null = null
    let wallMaxLeft : CellOfGrid | null = null
    let wallMaxRight : CellOfGrid | null = null

    let wallMaxLeftTop : CellOfGrid[] = []
    let wallMaxRightTop : CellOfGrid[] = []
    let wallMaxLeftBottom : CellOfGrid[] = [] 
    let wallMaxRightBottom : CellOfGrid[] = [] 
    wallsInRadius.forEach(wall => {

        const direction = getDirection(centerCell, wall.id, numCols);
        console.log("Direction: ", direction);

        switch(direction){
            case "up":
                if(!wallMaxTop || wallMaxTop.id < wall.id){
                    wallMaxTop = wall;
                }
                break;
            case "down":
                if(!wallMaxBottom || wallMaxBottom.id > wall.id){
                    wallMaxBottom = wall;
                }
                break;
            case "left":
                if(!wallMaxLeft || wallMaxLeft.id < wall.id){
                    wallMaxLeft = wall;
                }
                break;
            case "right":
                if(!wallMaxRight || wallMaxRight.id > wall.id){
                    wallMaxRight = wall;
                }
                break;
            case "up-left":
                // Add the object of CellInGrid from WallsInRadius
                wallMaxLeftTop.push(wall);
                break;
            case "up-right":
                wallMaxRightTop?.push(wall);
                break;
            case "down-left":
                wallMaxLeftBottom?.push(wall);
                break;
            case "down-right":
                wallMaxRightBottom?.push(wall);
                break;
        }
    });

    allCells.forEach(cell => {
        if (centerCharacter){
            cell.viewedBy.push(centerCharacter);
        }

        const index = wallsOriginIds.indexOf(cell.id);

        if(index != -1 && currentUserId === dmId){
            cell.classes = 'bg-red-500/30';
            return;
        }

        if(cell.visibility){
            cell.classes = 'transparent-cell';
            return;
        }


        cell.classes = ''

        let breakLoop = false;
        const direction = getDirection(centerCell, cell.id, numCols);

        switch(direction){
            case "up":
                if (wallMaxTop && cell.id < wallMaxTop.id){
                    return;
                }
                break;
            case "down":
                if (wallMaxBottom && cell.id > wallMaxBottom.id){
                    return;
                }
                break;
            case "left":
                if (wallMaxLeft && cell.id < wallMaxLeft.id){
                    return;
                }
                break;
            case "right":
                if (wallMaxRight && cell.id > wallMaxRight.id){
                    return;
                }
                break;
            case "up-left":
                wallMaxLeftTop.forEach(wall => {
                    console.log("Wall x: ", wall.x, "Wall y: ", wall.y, "Cell x: ", cell.x, "Cell y: ", cell.y);
                    if((cell.x < wall.x && cell.y < wall.y) || (cell.x == wall.x && cell.y < wall.y) || (cell.x < wall.x && cell.y == wall.y) && !(cell.id in wallsOriginIds)){
                        breakLoop = true;
                        return;
                    }
                })
                break;
            case "up-right":
                wallMaxRightTop.forEach(wall => {
                    if((cell.x > wall.x && cell.y < wall.y) || (cell.x == wall.x && cell.y < wall.y) || (cell.x > wall.x && cell.y == wall.y) && !(cell.id in wallsOriginIds)){
                        breakLoop = true;
                        return;
                    }
                })
                break;
            case "down-left":
                wallMaxLeftBottom.forEach(wall => {
                    if((cell.x < wall.x && cell.y > wall.y) || (cell.x == wall.x && cell.y > wall.y) || (cell.x < wall.x && cell.y == wall.y) && !(cell.id in wallsOriginIds)){
                        breakLoop = true;
                        return;
                    }
                })
                break;
            case "down-right":
                wallMaxRightBottom.forEach(wall => {
                    if((cell.x > wall.x && cell.y > wall.y) || (cell.x == wall.x && cell.y > wall.y) || (cell.x > wall.x && cell.y == wall.y) && !(cell.id in wallsOriginIds)){
                        breakLoop = true;
                        return;
                    }
                })
                break;
        }

        if (breakLoop){
            return;
        }
        
        // if(cell.id == upLeft){
        //     cell.classes = 'gradient-radial-to-br ';
        // }else if(cell.id == upRight){
        //     cell.classes = 'gradient-radial-to-bl ';
        // }else if(cell.id == downLeft){
        //     cell.classes = 'gradient-radial-to-tr ';
        // }else if(cell.id == downRight){
        //     cell.classes = 'gradient-radial-to-tl ';
        // }else if(cell.id > upLeft && cell.id < upRight){
        //     cell.classes = 'gradient-to-b ';
        // }else if(cell.id > downLeft && cell.id < downRight){
        //     cell.classes = 'gradient-to-t ';
        // }else if(leftSizeIds.includes(cell.id)){
        //     cell.classes = 'gradient-to-r ';
        // }else if(rightSizeIds.includes(cell.id)){
        //     cell.classes = 'gradient-to-l ';
        // }else {
        //     cell.classes = 'transparent-cell';
        // }

        cell.classes = 'transparent-cell';

        cell.visibility = true;
    });

  }

  function getDirection(centerCell : CellOfGrid, cellToCompare : number, numCols:number) : string {
    const centerRow = Math.floor(centerCell.id / numCols);
    const centerCol = centerCell.id % numCols;

    const row = Math.floor(cellToCompare / numCols);
    const col = cellToCompare % numCols;

    if(row < centerRow && col == centerCol){
        return "up";
    }else if(row > centerRow && col == centerCol){
        return "down";
    }else if(row == centerRow && col < centerCol){
        return "left";
    }else if(row == centerRow && col > centerCol){
        return "right";
    }else if(row < centerRow && col < centerCol){
        return "up-left";
    }else if(row < centerRow && col > centerCol){
        return "up-right";
    }else if(row > centerRow && col < centerCol){
        return "down-left";
    }else if(row > centerRow && col > centerCol){
        return "down-right";
    }

    return "";

  }
  
  