<template>
    <div class="flex flex-col bg-dark w-screen h-screen">

      <InitiativeComponent :current-user="currentUser" :combat-init="combatInitiative" :action="currentCombatAction" :current-initiative="currentPlayerTurn" :campaign_id="campaign_id" :map_id="currentMapId"/>

      <div class=" gap-2 w-full h-full max-w-[100vw] bg-dark overflow-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-primary">  
        <div class="flex flex-col max-w-fit gap-y-2 fixed top-[20%] left-[90%] mb-4 justify-center z-20">
          <img src="@/assets/imgs/zoom_in.svg" @click="zoomIn" class="bg-primary text-white w-fit p-2 rounded-full cursor-pointer">
          <img src="@/assets/imgs/zoom_out.svg" @click="zoomOut" class="bg-primary text-white w-fit p-2 rounded-full cursor-pointer">
          <img src="@/assets/imgs/reset.svg" @click="resetZoom" class="bg-gray-500 text-white w-fit p-2 rounded-full cursor-pointer">
        </div>
  
        <div
          id="editorComponent"
          class="grid bg-dark mx-auto transition-transform duration-500 z-10 relative aspect-auto mt-[5vh] "
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
            :class="`w-full aspect-square border-[1px] bg-dark/100  border-red-500/50 relative ${cell.classes}`"
            @click="toggleCellVisibility(cell)"
            :style="{
                '--tw-gradient-from': '#1F1F1F',
                '--tw-gradient-to': 'transparent',
            }"
          >
            <CharacterPopUpComponent v-if="cell.character && !cell.character.hidden && cell.visibility" :character="cell.character" :cell="cell" :current-user="currentUser" :current-dm-id="currentDmId" :campaign-id="campaign_id" :map-id="currentMapId" />
          </div>
        </div>
       </div>
       <audio ref="soundPlayer" class=" hidden "></audio>
       <audio ref="effectPlayer" class=" hidden "></audio>
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
  import type { Map } from '@/models/Map';
import type { CombatInit } from '~/models/CombatInit';
  
  // Props, router, emits & transmit setup
  const router = useRouter();
  const campaign_id = <number>router.currentRoute.value.query.campaign_id?.valueOf();
  const currentMapId = ref<number>(0);
  
  const apiBaseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'https://localhost:3333'  // For local access
  : 'https://192.168.1.177:3333'  // For external devices

  // Transmit setup
  const transmit = new Transmit({
    baseUrl: apiBaseUrl,
  });

  const backendUrl = apiBaseUrl + '/';

  // Subscriptions
  let unsubscribeActiveMap = ref<Function>();
  
  let unsubscribeCurrentMapCharacters = ref<Function>();
  let activeSubscribeCharMovement : Subscription;

  let unsubscribeReveal = ref<Function>();
  let activeSubscribeReveal : Subscription;

  let unsubscribeCombat = ref<Function>();
  let activeSubscribeCombat : Subscription;

  let unsubscribeSounds = ref<Function>();
  let activeSubscribeSounds : Subscription;

  let unsubscribeFow = ref<Function>();
  let activeSubscribeFow : Subscription;

  // Sounds
  const soundPlayer = ref<HTMLAudioElement | null>(null);
  const effectPlayer = ref<HTMLAudioElement | null>(null);
  
  // Grid constants
  const cellsOfGrid = ref<CellOfGrid[]>([]);
  const numberOfColumns = ref<number>(12);
  const numberOfRows = ref<number>(10);
  const maxCellWidth = ref<number>(window.outerWidth / numberOfColumns.value - 5);
  const gridBackgroundUrl = ref<string>('');
  const maxGridWidth = ref<number>();
  const maxGridHeight = ref<number>();
  const forcedUpdateGrid = ref<number>(0);

  const wallCells = ref<CellOfGrid[]>([]);
  const fow = ref<boolean>(false);

  // Functionality constants
  const currentUser = ref<User | null>(null);
  const currentCampaign = ref<number>(0);
  const currentDmId = ref<number>(0);
  
  // Zoom functionality
  const zoomLevel = ref<number>(1);
  
  //Character placement
  const characters = ref<Character[]>([]);
  const characterToMoveBool = ref<boolean>(false); 
  const cellToClear = ref<CellOfGrid | null>(null);

  //Combat
  const combatInitiative = ref<CombatInit[]>([])
  const currentCombatAction = ref<string>('')
  const combatStarted = ref<boolean>(false);
  const currentPlayerTurn = ref<number>(0);
  

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

    console.log('Creating grid with', numberOfColumns.value, 'columns and', numberOfRows.value, 'rows');
  
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
        viewedBy: [],
      });
    }
  }

  function applyGradients(centerCell : CellOfGrid, radius : number, numRows : number, numCols : number, cellsOfGrid : CellOfGrid[]) {
    const affectedCellsIds = getCellsInRadius(centerCell.id, radius, numRows, numCols);
    const affectedCells = affectedCellsIds.map(id => cellsOfGrid[id]);
  
    getDirectionClass(centerCell, affectedCells, radius, numberOfColumns.value, wallCells.value, currentUser.value?.id, currentDmId.value, fow.value);

    forcedUpdateGrid.value++;

    console.log(affectedCells);
  }
  
  // Toggle visibility of a cell
  async function toggleCellVisibility(cell: CellOfGrid) {
    if (cell.character && !characterToMoveBool.value){
      if (cell.character?.status.includes('npc')){
        console.log('NPC character clicked');
        return;
      }

      characterToMoveBool.value = true;
      cellToClear.value = cell;
      return
    }

    if (cell.character === null && characterToMoveBool.value && cellToClear.value !== null){
      console.log('Character to move', cell.character);

      cell.character = cellToClear.value.character;
      cellToClear.value.character = null;

      characterToMoveBool.value = false;
    
      if (cell.character){
        cell.character.x = cell.x;
        cell.character.y = cell.y;

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
      await activeSubscribeReveal.delete();
    }

    if(unsubscribeCurrentMapCharacters.value){
      await unsubscribeCurrentMapCharacters.value();
    }

    if(unsubscribeReveal.value){
      await unsubscribeReveal.value();
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
    await subscribeToReveal();
    await subscribeToCombat();
    await subscribeToSounds();
    await subscribeToFow();
    await loadWalls();
  }

  async function loadWalls(){
  const result = await callAxios({ campaign_id: campaign_id, map_id: currentMapId.value }, 'objects/listWalls');

  if (result.status === 200){
    const wallData = result.walls;
    const wallCellIds = wallData.map((wall : any) => wall.size);
    
    wallCells.value = []

    wallCellIds.forEach((cellId : number) => {
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

      if (cell.character.status.includes('npc')){
        return;
      }

      applyGradients(cell, radius, numberOfRows.value, numberOfColumns.value, cellsOfGrid.value);

      return;
    }else{
      const cellId = character.y*numberOfColumns.value + character.x;

      const cell : CellOfGrid = cellsOfGrid.value[cellId];

      cell.character = character;

      console.log('Character placed at cell', cell);

      const radius = character.fov;

      if (cell.character.status.includes('npc')){
        return;
      }

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

    if (cell.character.status.includes('npc')){
        return;
    }

    applyGradients(cell, radius, numberOfRows.value, numberOfColumns.value, cellsOfGrid.value);

    return;
  }
  
  // Subscriptions
  async function  subscribeToActiveMap() {
    const broadcast = `campaign:${campaign_id}:map:active`;

    const activeSubscribe = transmit.subscription(broadcast);
    await activeSubscribe.create();

    unsubscribeActiveMap.value = activeSubscribe.onMessage((message : any) => {
      const mapBody : Map = message.map;
      
      console.log('Received active map', mapBody);

      setMapId(mapBody.id);
      setMaxResolution(mapBody.url);
      updateGridX(mapBody.grid_x);
      updateGridY(mapBody.grid_y);
    });
    
    console.log("Subscribed to channeL: ", broadcast);
  }

  // Subscription to character movements

  async function subscribeToCurrentCharMovement() {
    const broadcast = `campaign.${campaign_id}:map.${currentMapId.value}:characters`;

    activeSubscribeCharMovement = transmit.subscription(broadcast);
    await activeSubscribeCharMovement.create()

    unsubscribeCurrentMapCharacters.value = activeSubscribeCharMovement.onMessage((message : any) =>{
      const character : Character = message.character;
      const playerMoveId : number = message.player_moved;
      const action : string = message.action;

      console.log('Received message', message);

      // Check if user is in the characters list
      const characterIndex = characters.value.findIndex((char) => char.pivot_id === character.pivot_id);

      console.log('Character index', characterIndex);

      if (action === 'delete'){
        if (characterIndex !== -1){
          characters.value.splice(characterIndex, 1);
        }

        for (let i = 0; i < cellsOfGrid.value.length; i++){
          if (cellsOfGrid.value[i].character?.id === character.id){
            cellsOfGrid.value[i].character = null;
          }
        }
      }

      if (characterIndex === -1){
        characters.value.push(character);
        
        if (playerMoveId !== currentUser.value?.id && !character.hidden){
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

        if (playerMoveId !== currentUser.value?.id && !char.hidden){
          moveReceivedCharacter(char);
        }

        if (char.hidden && !char.status.includes('npc')){
          const cellId = char.y*numberOfColumns.value + char.x;

          const cell : CellOfGrid = cellsOfGrid.value[cellId];

          // const cellsToHide = getCellsInRadius(cell.id, char.fov, numberOfRows.value, numberOfColumns.value);

          // for (let i = 0; i < cellsToHide.length; i++){
          //   const cell = cellsOfGrid.value[cellsToHide[i]];

          //   cell.visibility = false;
          //   cell.classes = '';
          // }

          cell.character = null;
        }
        }
    });

    console.log('Subscribed to', broadcast);
  }

  async function subscribeToReveal(){
    const broadcast = `campaign:${campaign_id}:map:${currentMapId.value}:reveal`;

    activeSubscribeReveal = transmit.subscription(broadcast);
    await activeSubscribeReveal.create();

    unsubscribeReveal.value = activeSubscribeReveal.onMessage((message : any) => {
      const cellIds = message.cellIds;

      for (let i = 0; i < cellIds.length; i++){
        const cell = cellsOfGrid.value[cellIds[i]];

        if (cell.visibility){
          cell.visibility = false;
          cell.classes = '';
        }else{
          cell.visibility = true;
          cell.classes = 'transparent-cell';
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
        combatInitiative.value = [];
        currentPlayerTurn.value = 0;
        currentCombatAction.value = '';
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
        currentCombatAction.value = action;
        combatStarted.value = true;
        currentPlayerTurn.value = 0;
        return;
      }

      const characterInit = {
        character_name: message.character_name,
        randomRoll: message.random_roll,
        initiative: message.initiative,
        pivot_id: message.pivot_id,
        owner_id: message.owner_id,
      }

      currentCombatAction.value = action;

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
      const effect = message.effect;

      console.log('Received sound message', JSON.stringify(message));

      if (action === 'stop'){
        if (soundPlayer.value){
          soundPlayer.value.pause();
          soundPlayer.value.currentTime = 0;
        }
        if(effectPlayer.value){
          effectPlayer.value.pause();
          effectPlayer.value.currentTime = 0;
        }
      }
      
      if (action === 'play'){
        if (effect){
          if (effectPlayer.value){
            effectPlayer.value.src = backendUrl + soundUrl;
            effectPlayer.value.loop = false;
            effectPlayer.value.play();
          }
        }else{
          if (soundPlayer.value){
            soundPlayer.value.src = backendUrl + soundUrl;
            soundPlayer.value.loop = true;
            soundPlayer.value.play();
          }
        }
      }

    });
  }

  async function subscribeToFow(){
    const broadcast = `campaign:${campaign_id}:map:${currentMapId.value}`;

    activeSubscribeFow = transmit.subscription(broadcast);
    await activeSubscribeFow.create();

    unsubscribeFow.value = activeSubscribeFow.onMessage((message : any) => {
      const fowStatus = message.fow;

      fow.value = fowStatus;

      if (fowStatus){
        for (let i = 0; i < cellsOfGrid.value.length; i++){
          cellsOfGrid.value[i].visibility = false;
          cellsOfGrid.value[i].classes = '';
        }
      }
    });
  }

  onMounted(async () => {
    const result = await callAxios({ campaign_id: campaign_id }, 'maps/getActive');

    if (result.status === 200){
      console.log('Active map', result.map);

      setMapId(result.map.id);
      setMaxResolution(result.map.url);
      updateGridX(result.map.grid_x);
      updateGridY(result.map.grid_y);
    }


    await subscribeToActiveMap();
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
  