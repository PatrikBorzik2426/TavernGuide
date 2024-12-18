<template>
    <div class="flex flex-col bg-dark w-screen h-screen">
      <MapBarComponent :campaign_id="campaign_id" @grid_x="updateGridX" @grid_y="updateGridY" />
      <div class="w-full h-full max-w-[100vw] p-4 bg-dark overflow-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-purple">
        <ObjectBarComponent />
  
        <!-- Zoom Controls -->
        <div class="flex flex-col max-w-fit gap-y-2 fixed top-[20%] left-[90%] mb-4 justify-center z-20">
          <button @click="zoomIn" class="bg-purple text-white px-4 py-2 rounded">Zoom In</button>
          <button @click="zoomOut" class="bg-purple text-white px-4 py-2 rounded">Zoom Out</button>
          <button @click="resetZoom" class="bg-gray-500 text-white px-4 py-2 rounded">Reset</button>
        </div>
  
        <!-- Editor Grid -->
        <div
          id="editorComponent"
          class="grid bg-dark p-2 mx-auto transition-transform duration-200 z-10 relative"
          :style="{ 
            transform: `scale(${zoomLevel})`, 
            transformOrigin: 'top', 
            backgroundImage: `url(${gridBackgroundUrl})`, 
            backgroundSize: '99% 98%', 
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
          }"
        >
          <div
            v-for="cell in cellsOfGrid"
            :key="cell.id"
            class="w-full aspect-square border-[1px] border-purple relative"
            @click="toggleCellVisibility(cell)"
          >
            <!-- Overlay for uncovered cells -->
            <div
              v-if="!visibleCells.includes(cell.id)"
              class="absolute inset-0 bg-dark transition-opacity duration-300"
              :style="{}"
            ></div>
          </div>
        </div>
  
        <SoundBarComponent />
        <CharacterBarComponent />
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { callAxios } from '~/services/axios';
  import { ref, onBeforeMount, defineEmits, watch, onMounted } from 'vue';
  import { useRouter } from 'vue-router';
  import { Transmit } from '@adonisjs/transmit-client';
  import type { CellOfGrid } from '@/models/CellOfGrid';
  import type { User } from '~/models/User';
  
  // Props, router, emits & transmit setup
  const router = useRouter();
  const campaign_id = <number>router.currentRoute.value.query.campaign_id?.valueOf();
  
  // Transmit setup
  const transmit = new Transmit({
    baseUrl: 'http://localhost:3333',
  });
  
  // Grid constants
  const cellsOfGrid = ref<CellOfGrid[]>([]);
  const numberOfColumns = ref<number>(12);
  const numberOfRows = ref<number>(10);
  const maxCellWidth = ref<number>(window.outerWidth / numberOfColumns.value - 5);
  const gridBackgroundUrl = ref<string>('https://www.cats.org.uk/media/13139/220325case013.jpg');
  
  // State for visible cells
  const visibleCells = ref<number[]>([]);
  
  // Functionality constants
  const currentUser = ref<User | null>(null);
  const currentCampaign = ref<number>(0);
  
  // Zoom functionality
  const zoomLevel = ref<number>(1);
  
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
      });
    }
  }
  
  // Toggle visibility of a cell
  function toggleCellVisibility(cell: CellOfGrid) {
    if (visibleCells.value.includes(cell.id)) {
      visibleCells.value = visibleCells.value.filter((id) => id !== cell.id);
    } else {
      visibleCells.value.push(cell.id);
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
  
  onMounted(async () => {
    const resultCampaign = await callAxios({ campaign_id: campaign_id }, 'campaigns/get');
  
    if (resultCampaign.status === 200) {
      currentCampaign.value = resultCampaign.campaign;
    }
  
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
  });
  
  watch(() => numberOfColumns.value, (newValue) => {
    maxCellWidth.value = window.outerWidth / newValue - 5;
  });
  </script>
  
  <style scoped>
  #editorComponent {
    overflow: hidden;
  }
  </style>
  