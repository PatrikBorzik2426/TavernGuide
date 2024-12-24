<template>
  <div class="flex flex-col bg-dark w-screen h-screen">
    <MapBarComponent :campaign_id="campaign_id" @grid_x="updateGridX" @grid_y="updateGridY" @img_url="setMaxResolution" @map_id="setMapId"
     />
    <div class=" gap-2 w-full h-full max-w-[100vw] bg-dark overflow-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-primary">  
      <div class="flex flex-col max-w-fit gap-y-2 fixed top-[20%] left-[90%] mb-4 justify-center z-20">
        <img src="@/assets/imgs/zoom_in.svg" @click="zoomIn" class="bg-primary text-white w-fit p-2 rounded-full cursor-pointer">
        <img src="@/assets/imgs/zoom_out.svg" @click="zoomOut" class="bg-primary text-white w-fit p-2 rounded-full cursor-pointer">
        <img src="@/assets/imgs/reset.svg" @click="resetZoom" class="bg-gray-500 text-white w-fit p-2 rounded-full cursor-pointer">
        
        <label class="inline-flex items-center cursor-pointer">
            <input v-model="uncoverMode" type="checkbox" @click="changeUncoverMode()" class="sr-only peer">
            <div class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4  rounded-full peer dark:bg-light_primary peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:border after:rounded-full after:h-5 after:w-5 after:transition-all  peer-checked:bg-primary"></div>
            <span class="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300 text-left uppercase">Ucover mode</span>
        </label>
        
        <label class="inline-flex items-center cursor-pointer">
            <input v-model="addWallsMode" type="checkbox" @click="changeWallsMode()" class="sr-only peer">
            <div class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4  rounded-full peer dark:bg-light_primary peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:border after:rounded-full after:h-5 after:w-5 after:transition-all  peer-checked:bg-primary"></div>
            <span class="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300 text-left uppercase">Add Walls mode</span>
        </label>
        
        <label class="inline-flex items-center cursor-pointer">
            <input v-model="fogOFWar" type="checkbox" @click="changeFoW()" class="sr-only peer">
            <div class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4  rounded-full peer dark:bg-light_primary peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:border after:rounded-full after:h-5 after:w-5 after:transition-all  peer-checked:bg-primary"></div>
            <span class="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300 text-left uppercase">FOW</span>
        </label>
        <ToolKitComponent :combat-init="combatInitiative" :campaign_id="campaign_id" :map_id="currentMapId" :current_initiative="currentPlayerTurn"/>
      </div>

      <CharactersComponent :map_id="currentMapId" :campaign_id="campaign_id" @character-to-place="placeCharacter" />

      <!-- Editor Grid -->
      <div
        id="editorComponent"
        class="grid bg-dark mx-auto transition-transform duration-500 z-10 relative aspect-auto -mt-[90vh] "
        :style="{ 
          transform: `scale(${zoomLevel})`, 
          transformOrigin: 'top', 
          backgroundImage: `url(${gridBackgroundUrl})`, 
          backgroundSize: '100% 100%', 
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          minWidth: `${maxGridWidth}px`,
          minHeight: `${maxGridHeight}px`,
          aspectRatio: `${(maxGridWidth||16) / ( maxGridHeight||9)}`,
        }"
      >
        <div
          v-for="cell in cellsOfGrid"
          :key="cell.id + forcedUpdateGrid"
          :class="`w-full aspect-square border-[1px] bg-dark/95  border-red-500/50 relative ${cell.classes}`"
          @click="toggleCellVisibility(cell)"
          :style="{
              '--tw-gradient-from': '#1F1F1F',
              '--tw-gradient-to': 'transparent',
          }"
        >
          <CharacterPopUpComponent v-if="cell.character" :character="cell.character" :cell="cell" :current-user="currentUser" :current-dm-id="currentDmId" :campaign-id="campaign_id" :map-id="currentMapId" />
        </div>
      </div>

      <!-- <SoundBarComponent />
      <ObjectBarComponent /> -->
      <audio ref="soundPlayer" class="hidden"></audio>
    </div>
  </div>
</template>

<script setup lang="ts">
import { callAxios } from '~/services/axios';
import { ref, onBeforeMount, defineEmits, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Subscription, Transmit } from '@adonisjs/transmit-client';
import type { CellOfGrid } from '@/models/CellOfGrid';
import type { User } from '@/models/User';
import { getCellsInRadius, getDirectionClass } from '~/services/fov';
import type { Character } from '@/models/Character';
import type { CombatInit } from '@/models/CombatInit';

// Props, router, emits & transmit setup
const router = useRouter();
const campaign_id = <number>router.currentRoute.value.query.campaign_id?.valueOf();
const currentMapId = ref<number>(0);

// Transmit setup
const transmit = new Transmit({
  baseUrl: 'http://127.0.0.1:3333',
});

const backendUrl = 'http://127.0.0.1:3333/';

let unsubscribeCurrentMapCharacters = ref<Function>();
let activeSubscribeCharMovement : Subscription;

let unsubscribeCombat = ref<Function>();
let activeSubscribeCombat : Subscription;

let unsubscribeSounds = ref<Function>();
let activeSubscribeSounds : Subscription;

// Combat
const combatInitiative = ref<CombatInit[]>([])
const combatAction = ref<string>('')
const combatStarted = ref<boolean>(false);
const currentPlayerTurn = ref<number>(0);

// Sounds
const soundPlayer = ref<HTMLAudioElement | null>(null);

// Grid constants
const cellsOfGrid = ref<CellOfGrid[]>([]);
const numberOfColumns = ref<number>(12);
const numberOfRows = ref<number>(10);
const maxCellWidth = ref<number>(window.outerWidth / numberOfColumns.value);
const gridBackgroundUrl = ref<string>('');
const maxGridWidth = ref<number>();
const maxGridHeight = ref<number>();
const forcedUpdateGrid = ref<number>(0);

// Functionality constants
const currentUser = ref<User | null>(null);
const currentCampaign = ref<number>(0);
const currentDmId = ref<number>(0);

// Cells modes
const uncoverMode = ref<boolean>(false);
const addWallsMode = ref<boolean>(false);
const wallCells = ref<CellOfGrid[]>([]);
const characters = ref<Character[]>([]);
const fogOFWar = ref<boolean>(false);

const firstUncoverClick = ref<CellOfGrid>();
const secondUncoverClick = ref<CellOfGrid>();

// Zoom functionality
const zoomLevel = ref<number>(1);

//Character placement
const characterToMoveBool = ref<boolean>(false); 
const cellToClear = ref<CellOfGrid | null>(null);

function zoomIn() {
  setTimeout(() => {
    zoomLevel.value = Math.min(zoomLevel.value + 0.1, 3);
  }, 250);
}

function zoomOut() {
  setTimeout(() => {
    zoomLevel.value = Math.max(zoomLevel.value - 0.1, 0.25);
  }, 250);
}

function resetZoom() {
  setTimeout(() => {
    zoomLevel.value = 1;
  }, 250);
}

// Grid creation logic
function createGrid(editorComponent: HTMLElement | null) {
  cellsOfGrid.value = [];

  editorComponent?.style.setProperty(
    'grid-template-columns',
    'repeat(' + numberOfColumns.value + ', 1fr)'
  );

  editorComponent?.style.setProperty(
    'grid-template-rows',
    'repeat(' + numberOfRows.value + ', 1fr)'
  );

  while (cellsOfGrid.value.length < numberOfColumns.value * numberOfRows.value) {
    cellsOfGrid.value.push({
      id: cellsOfGrid.value.length,
      x: cellsOfGrid.value.length % numberOfColumns.value,
      y: Math.floor(cellsOfGrid.value.length / numberOfColumns.value),
      visibility: false,
      classes: '',
      character: null,
      viewedBy: []
    });
  }
}

function applyGradients(centerCell : CellOfGrid, radius : number, numRows : number, numCols : number, cellsOfGrid : CellOfGrid[]) {
  
  const affectedCellsIds = getCellsInRadius(centerCell.id, radius, numRows, numCols);
  const affectedCells = affectedCellsIds.map(id => cellsOfGrid[id]);

  getDirectionClass(centerCell, affectedCells, radius, numberOfColumns.value, wallCells.value, currentUser.value?.id, currentDmId.value, fogOFWar.value);
}

// Toggle visibility of a cell
async function toggleCellVisibility(cell: CellOfGrid) {
  if (addWallsMode.value){
    const index = wallCells.value.findIndex((wallCell) => wallCell.id === cell.id)

    if (index !== -1){
      wallCells.value.splice(index, 1);
      cell.classes = cell.classes.replace('bg-red-500/30', '');
      return;
    }

    wallCells.value.push(cell);
    
    cell.classes = cell.classes+'bg-red-500/30';
    return;
  }

  console.log('Uncover mode', uncoverMode.value);

  if (uncoverMode.value){
    if (firstUncoverClick.value === undefined){
      firstUncoverClick.value = cell;
      return;
    }

    if (secondUncoverClick.value === undefined){
    
      secondUncoverClick.value = cell;
      cell.visibility = true;

      const cellIdsToReveal : number[] = []

      // Firstuncovered click specifies the topright corner of the rectangle and seconduncover click specifies the bottomleft corner

      const Xmin = Math.min(firstUncoverClick.value.x, secondUncoverClick.value.x);
      const Xmax = Math.max(firstUncoverClick.value.x, secondUncoverClick.value.x);

      const Ymin = Math.min(firstUncoverClick.value.y, secondUncoverClick.value.y);
      const Ymax = Math.max(firstUncoverClick.value.y, secondUncoverClick.value.y);

      for (let i = Xmin; i <= Xmax; i++){
        for (let j = Ymin; j <= Ymax; j++){
          const cellId = j * numberOfColumns.value + i;

          cellIdsToReveal.push(cellId);

          if(cellsOfGrid.value[cellId].classes === 'transparent-cell'){
            cellsOfGrid.value[cellId].visibility = false;
            cellsOfGrid.value[cellId].classes = '';
          }else{
            cellsOfGrid.value[cellId].visibility = true;
            cellsOfGrid.value[cellId].classes = 'transparent-cell';
          }
        }
      }

      firstUncoverClick.value = undefined;
      secondUncoverClick.value = undefined;

      const body ={
        map_id: currentMapId.value,
        campaign_id: campaign_id,
        cell_ids: cellIdsToReveal
      }

      await callAxios(body, 'maps/reveal');

      return;
    }
  }

  if (cell.character && !characterToMoveBool.value){
    characterToMoveBool.value = true;
    cellToClear.value = cell;
    return
  }

  if (cell.character === null && cellToClear.value !== null){
    
    cell.character = cellToClear.value.character;
    cellToClear.value.character = null;

    characterToMoveBool.value = false;
  
    console.log(cell.character)

    if (cell.character){
      cell.character.x = cell.x;
      cell.character.y = cell.y;
      console.log('Moving character to', cell);

      const body = {
        id: cell.character.id,
        name: cell.character.name,
        avatarUrl : cell.character.avatarUrl,
        x: cell.x,
        y: cell.y,
        health: cell.character.health,
        current_health: cell.character.current_health,
        armour: cell.character.armour,
        speed: cell.character.speed,
        fov: cell.character.fov,
        status: cell.character.status,
        user_id: cell.character.user_id,
        pivot_id: cell.character.pivot_id,
        hidden: cell.character.hidden,
        initiative: cell.character.initiative,
        action: '',
        last_cells: []
      }

      await callAxios(body, 'characters/update');
      const radius = cell.character.fov;
      applyGradients(cell, radius, numberOfRows.value, numberOfColumns.value, cellsOfGrid.value);
    }

    return;
  }
}

function changeUncoverMode(){
  uncoverMode.value = !uncoverMode.value;
  addWallsMode.value = false;

  if (uncoverMode.value){
    firstUncoverClick.value = undefined;
    secondUncoverClick.value = undefined;
  }
}

async function changeWallsMode(){
  addWallsMode.value = !addWallsMode.value;
  uncoverMode.value = false;

  if (addWallsMode.value){
    firstUncoverClick.value = undefined;
    secondUncoverClick.value = undefined;
  }

  if (addWallsMode.value === false && wallCells.value.length > 0){
    const body = {
      arrayOfObjects : wallCells.value,
      campaign_id : campaign_id,
      map_id : currentMapId.value
    }

    await callAxios(body, 'objects/createWalls');
  }

}

async function changeFoW(){
  fogOFWar.value = !fogOFWar.value;

  cellsOfGrid.value.forEach((cell) => {
    if (currentDmId.value !== currentUser.value?.id){
      cell.visibility = false;
      cell.classes = '';
    }
  });

  const body = {
    campaign_id: campaign_id,
    map_id: currentMapId.value,
    fow: fogOFWar.value
  }

  await callAxios(body,'objects/fow');
}

function updateGridX(value: number) {
  numberOfColumns.value = value;
  createGrid(document.getElementById('editorComponent'));
}

function updateGridY(value: number) {
  numberOfRows.value = value;
  createGrid(document.getElementById('editorComponent'));
}

async function setMapId(map_id: number) {
  
  if (unsubscribeCurrentMapCharacters.value){
    console.log('Unsubscribing from map', currentMapId.value);
    await unsubscribeCurrentMapCharacters.value();
    await activeSubscribeCharMovement.delete();
  }else{
    console.log('No subscription to unsubscribe from');
  }

  currentMapId.value = map_id;

  if (activeSubscribeCharMovement){
    await activeSubscribeCharMovement.delete();
  }

  if(unsubscribeCurrentMapCharacters.value){
    await unsubscribeCurrentMapCharacters.value();
  }
  
  if(unsubscribeCombat.value){
    await unsubscribeCombat.value();
    await activeSubscribeCombat.delete();
  }

  if(unsubscribeSounds.value){
    await unsubscribeSounds.value();
    await activeSubscribeSounds.delete();
  }

  await subscribeToCurrentCharMovement();
  await subscribeToCombat();
  await subscribeToSounds();
  await loadWalls();
}

async function loadWalls(){
  const result = await callAxios({ campaign_id: campaign_id, map_id: currentMapId.value }, 'objects/listWalls');

  if (result.status === 200){
    const wallData = result.walls;
    const wallCellIds = wallData.map((wall : any) => wall.size);
    
    wallCells.value = []

    wallCellIds.forEach((cellId : number) => {
      cellsOfGrid.value[cellId].classes = 'bg-red-500/30';
      wallCells.value.push(cellsOfGrid.value[cellId]);
    });

  }

}

function setMaxResolution(url: string) {
  gridBackgroundUrl.value = url;
  const image = new Image();
  image.src = url;

  image.onload = async () => {
    maxGridWidth.value = image.width;
    maxGridHeight.value = image.height;
  }

}

// Character placement
async function placeCharacter(character : Character) {
  console.log('Placing character', character);
  if (character.x===-1 && character.y===-1 || character.x===0 && character.y===0){
    console.log('Character has no position setting position to 0,0');

    while (cellsOfGrid.value[(character.x * character.y)].character){
      character.x++;
      character.y++;
    }

    character.x = 0;
    character.y = 0;
    
    await callAxios(character, 'characters/update');

    const cellId = character.y * character.x;

    const cell : CellOfGrid = cellsOfGrid.value[cellId];

    cell.character = character;

    console.log('Character placed at cell', cell);

    const radius = character.fov;

    applyGradients(cell, radius, numberOfRows.value, numberOfColumns.value, cellsOfGrid.value);

    return;
  }else{

    await callAxios(character, 'characters/update');

    const cellId = character.y*numberOfColumns.value + character.x;

    const cell : CellOfGrid = cellsOfGrid.value[cellId];

    cell.character = character;

    console.log('Character placed at cell', cell);

    const radius = character.fov;

    applyGradients(cell, radius, numberOfRows.value, numberOfColumns.value, cellsOfGrid.value);

    return;
  }
}

// Move character to new cell
function moveReceivedCharacter(character : Character){
  for (let i = 0; i < cellsOfGrid.value.length; i++){
    if (cellsOfGrid.value[i].character?.pivot_id === character.pivot_id){
      cellsOfGrid.value[i].character = null;
    }
  }

  const cellId = character.y*numberOfColumns.value + character.x;

  const cell : CellOfGrid = cellsOfGrid.value[cellId];

  cell.character = character;

  console.log('Character placed at cell', cell);

  const radius = character.fov;

  applyGradients(cell, radius, numberOfRows.value, numberOfColumns.value, cellsOfGrid.value);

  return;
}

// Subscription to character movements

async function subscribeToCurrentCharMovement() {
  const broadcast = `campaign.${campaign_id}:map.${currentMapId.value}:characters`;

  activeSubscribeCharMovement = transmit.subscription(broadcast);
  await activeSubscribeCharMovement.create()

  unsubscribeCurrentMapCharacters.value = activeSubscribeCharMovement.onMessage((message : any) =>{
    const character : Character = message.character;
    const playerMoveId : number = message.player_moved;

    // Check if user is in the characters list
    const characterIndex = characters.value.findIndex((char) => char.pivot_id === character.pivot_id);

    if (characterIndex === -1){
      characters.value.push(character);
      
      if (playerMoveId !== currentUser.value?.id){
        placeCharacter(character);
      }

    }else{
      const char = characters.value[characterIndex];
      
      char.x = character.x;
      char.y = character.y;
      char.current_health = character.current_health;
      char.health = character.health;
      char.armour = character.armour;
      char.speed = character.speed;
      char.fov = character.fov;
      char.status = character.status;
      char.hidden = character.hidden;
      char.user_id = character.user_id;
      char.pivot_id = character.pivot_id;
      char.initiative = character.initiative;

      if (playerMoveId !== currentUser.value?.id){
        moveReceivedCharacter(char);
      }
    }
    
  });

  console.log('Subscribed to', broadcast);
  
}


async function subscribeToCombat() {
  const broadcast = `campaign:${campaign_id}map:${currentMapId.value}:combat`;

  activeSubscribeCombat = transmit.subscription(broadcast);
  await activeSubscribeCombat.create();

  unsubscribeCombat.value = activeSubscribeCombat.onMessage((message : any) => {
    const action = message.action;

    if (action === 'end'){
      combatStarted.value = false;
      combatAction.value = '';
      combatInitiative.value = [];
      currentPlayerTurn.value = 0;
      return;
    }

    if (action === 'next'){
      currentPlayerTurn.value++;

      if (currentPlayerTurn.value >= combatInitiative.value.length){
        currentPlayerTurn.value = 0;
      }

      return;
    }

    if (action === 'start' || combatStarted.value){
      combatAction.value = action;
      combatStarted.value = true;
      currentPlayerTurn.value = 0;
      return;
    }

    const characterInit = {
      character_name: message.character_name,
      randomRoll: message.random_roll,
      initiative: message.initiative,
      pivot_id: message.pivot_id,
      owner_id: message.owner_id
    }

    // Check if array has an obeject with the new pivot_id

    console.log(combatInitiative.value);

    const characterIndex = combatInitiative.value.findIndex((char) => char.pivot_id === characterInit.pivot_id);

    if (characterIndex === -1){
        combatInitiative.value.push(characterInit);
        // Sort array based on initiative
        combatInitiative.value.sort((a, b) => {
        return b.randomRoll + b.initiative - (a.randomRoll + a.initiative)});
      }

    console.log('Received combat message', message);
  });
  
}

async function subscribeToSounds() {
  const broadcast = `playSound:map_${currentMapId.value}`;

  activeSubscribeSounds = transmit.subscription(broadcast);
  await activeSubscribeSounds.create();

  unsubscribeSounds.value = activeSubscribeSounds.onMessage((message : any) => {
    const soundUrl = message.sound_url;
    const action = message.action;

    if (action === 'stop'){
      if (soundPlayer.value){
        soundPlayer.value.pause();
        soundPlayer.value.currentTime = 0;
      }
    }
    
    if (action === 'play'){
      if (soundPlayer.value){
        soundPlayer.value.src = backendUrl + soundUrl;
        soundPlayer.value.loop = true;
        soundPlayer.value.play();
      }
    }

  });
}

onMounted(async () => {
  const resultCampaign = await callAxios({ campaign_id: campaign_id }, 'campaigns/get');

  if (resultCampaign.status === 200) {
    currentCampaign.value = resultCampaign.campaign;
  }

  console.log('Current campaign', currentCampaign.value, "with DM", currentDmId.value);

  const editorComponent = document.getElementById('editorComponent');
  createGrid(editorComponent);
  
});

onBeforeMount(async () => {
  const result = await callAxios({}, 'auth/simpleAuth');

  if (result.status === 200) {
    currentUser.value = result.user;
  } else {
    router.push('auth');
  }

  const resultDm = await callAxios({ campaign_id: campaign_id }, 'campaigns/getDm');

  if (resultDm.status === 200) {
    currentDmId.value = resultDm.dm_id;
  }

});

watch(() => numberOfColumns.value, (newValue) => {
  maxCellWidth.value = window.outerWidth / newValue - 5;
});

watch(() => wallCells.value, (newValue) => {

});

</script>

<style scoped>
#editorComponent {
  overflow: hidden;
}

  .gradient-radial-to-tr {
      background-color: transparent;
      background: radial-gradient(200% 150% at 0% 100%, var(--tw-gradient-from), var(--tw-gradient-to));
  }

  .gradient-radial-to-tl {
      background-color: transparent;
      background: radial-gradient(200% 150% at 100% 100%, var(--tw-gradient-from), var(--tw-gradient-to));
  }

  .gradient-radial-to-br {
      background-color: transparent;
      background: radial-gradient(200% 150% at 0% 0%, var(--tw-gradient-from), var(--tw-gradient-to));
  }

  .gradient-radial-to-bl {
      background-color: transparent;
      background: radial-gradient(200% 150% at 100% 0%, var(--tw-gradient-from), var(--tw-gradient-to));
  }

  .gradient-to-b {
      background-color: transparent;
      background: linear-gradient(to bottom, var(--tw-gradient-from), var(--tw-gradient-to));
  }

  .gradient-to-t {
      background-color: transparent;
      background: linear-gradient(to top, var(--tw-gradient-from), var(--tw-gradient-to));
  }

  .gradient-to-l {
      background-color: transparent;
      background: linear-gradient(to left, var(--tw-gradient-from), var(--tw-gradient-to));
  }

  .gradient-to-r {
      background-color: transparent;
      background: linear-gradient(to right, var(--tw-gradient-from), var(--tw-gradient-to));
  }

  .transparent-cell{
      background-color: transparent;
  }

  .position-sticky-top {
      position: sticky;
      top: 0;
  }

</style>
