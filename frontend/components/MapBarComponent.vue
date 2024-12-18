<template>
    <div  id="mapBar" class="flex justify-start items-center w-screen h-[15vh] max-h-[320px] bg-purple z-10 px-[5%]">
        <form @submit.prevent="createMap" v-if="showMaps" class="flex justify-center items-center min-w-fit gap-x-8">
            <div class=" flex flex-col justify-center items-end text-white">
                <div class="flex items-center gap-2">
                    <label for="mapName" class="text-white uppercase font-medium">Map Name:</label>
                    <input v-model="mapNameInput" type="text" id="mapName" name="mapName" class=" mt-2 px-2 py-1 h-8 bg-transparent border-[3px] border-white rounded-lg">
                </div>
                <div class="flex items-center gap-2">
                    <label for="mapImgUrl" class="text-white uppercase font-medium">Map Image URL:</label>
                    <input v-model="mapImgUrlInput" type="text" id="mapImgUrl" name="mapImgUrl" class=" mt-2 px-2 py-1 h-8 bg-transparent border-[3px] border-white rounded-lg">
                </div>
            </div>

            <button type="submit" class="p-2 text-center text-md font-medium bg-white text-purple rounded-md hover:animate-wiggle animate-infinite">Add Map</button>
        </form>

        <button id="mapClosingBtn" @click="hideMaps()" type="button" class=" w-[2vw] h-[3vh] fixed top-[11.5%] left-[49%] rounded-full border-2 border-white bg-purple z-50">
            <img :src="imgHide" class="mx-auto">
        </button>

        <div v-if="showMaps" class="flex items-start gap-2 ml-12 max-w-[80vw] overflow-x-scroll scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white">
            <div v-for="(map, index) in maps" :ke="index" class="flex flex-col justify-center items-center py-2 border-2 text-white font-bold rounded-xl">
                <div class=" flex flex-col gap-2 relative z-50 ml-[80%]">
                    <div class="flex flex-col gap-1 absolute ">
                        <button @click="selectCurrentMap(map)" type="button" class="flex justify-center items-center w-5 aspect-square bg-white rounded-full hover:animate-pulse animate-infinite">
                            <img src="@/assets/imgs/play.svg" alt="start session">
                        </button>
                        
                        <button @click="deleteMap(map.id)" type="button" class="flex justify-center items-center w-5 aspect-square bg-white rounded-full hover:animate-pulse animate-infinite">
                            <img src="@/assets/imgs/delete.svg" alt="delete session">
                        </button>
                    </div>
                </div>  

                <input type="text" v-model="map.name" @blur="updateMap(map.id)" class=" max-w-[80%] bg-transparent uppercase text-xl font-bold text-center">
                <!--Shorten URL at-->
                <input type="text" @blur="updateMap(map.id)" v-model="map.url" class=" max-w-[80%] bg-transparent text-md font-medium text-center">  
            </div>
        </div>

    </div>

    <div v-if="showMaps" id="gridModifier" class="flex gap-2 w-fit h-fit p-2 fixed top-[15%] left-[6%] z-50">
        <label for="grid_x" class="text-white">Grid X:</label>
        <input @blur="updateGridX()" type="number" max="99" id="grid_x" name="grid_x" v-model="grid_x" class=" w-12 h-6 p-1 bg-transparent border-[3px] text-center  border-white rounded-lg text-white">

        <label for="grid_y" class="text-white">Grid Y:</label>
        <input @blur="updateGridY()" type="number" max="99" id="grid_y" name="grid_y" v-model="grid_y" class="w-12 h-6 p-1 bg-transparent border-[3px] text-center  border-white rounded-lg text-white">
    </div>

</template>

<script setup lang="ts" >
import { ref, watch, defineEmits, defineProps } from 'vue';
import { callAxios } from '~/services/axios';
import arrowUp from '@/assets/imgs/arrow_up.svg';
import arrowDown from '@/assets/imgs/arrow_down.svg';
import type { Map } from '@/models/Map';

// Emits & Props
const emits = defineEmits(['grid_x', 'grid_y']);

const props = defineProps({
    campaign_id: Number
});

// Display constants
const showMaps = ref<boolean>(true);
const imgHide = ref<string>(arrowUp);

// Form functionality constants
const mapNameInput = ref<string>('');
const mapImgUrlInput = ref<string>('');

const grid_x = ref<number>(0);
const grid_y = ref<number>(0);

const maps = ref<Map[]>([]);
const currentMap = ref<Map>();


function hideMaps(){
    showMaps.value = !showMaps.value;
}

async function updateGridX(){
    emits('grid_x', grid_x.value);

    if (currentMap.value !== undefined){
        await updateMap(currentMap.value.id);
    }
}

async function updateGridY(){
    emits('grid_y', grid_y.value);

    if (currentMap.value !== undefined){
        await updateMap(currentMap.value.id);
    }
}

function selectCurrentMap(map: Map){
    currentMap.value = map;

    console.log('Current Map: ', currentMap.value);

    grid_x.value = map.grid_x;
    grid_y.value = map.grid_y;

    emits('grid_x', grid_x.value);
    emits('grid_y', grid_y.value);
}

async function getMaps(){
    console.log("Campaign ID: ", props.campaign_id);

    const result = await callAxios({campaign_id : props.campaign_id}, 'maps/list');

    if (result.status !== 200){
        console.error('Error fetching maps');
        return;
    }else{
        console.log('Maps fetched successfully');
        
        maps.value = result.maps;
    }
}

async function createMap(){
    if (mapNameInput.value === '' || mapImgUrlInput.value === ''){
        console.error('Please fill in all fields');
        return;
    }

    const body = {
        name: mapNameInput.value,
        url: mapImgUrlInput.value,
        campaign_id: props.campaign_id,
        grid_x: 10,
        grid_y: 10,
    }

    const result = await callAxios(body, 'maps/create');

    if (result.status !== 200){
        console.error('Error creating map');
        return;
    }else{
        console.log('Map created successfully');

        const newMap: Map = result.map;
        maps.value.push(newMap);
        
        selectCurrentMap(newMap);
    }
}

async function deleteMap(map_id: number){
    const body = {
        map_id: map_id
    }

    console.log("Deleting map body: ", body);

    const result = await callAxios(body, 'maps/delete');

    if (result.status !== 200){
        console.error('Error deleting map');
        return;
    }else{
        console.log('Map deleted successfully');

        const index = maps.value.findIndex((map) => map.id === map_id);
        maps.value.splice(index, 1);
    }
}

async function updateMap(map_id : number) {

    if (currentMap.value === undefined){
        console.error('No map selected');
        return;
    }

    const map = maps.value.find((map) => map.id === map_id);

    const body = {
        map_id: map_id,
        name: map?.name,
        url: map?.url,
        grid_x: grid_x.value,
        grid_y: grid_y.value,
        campaign_id: props.campaign_id
    }

    const result = await callAxios(body, 'maps/update');

    if (result.status !== 200){
        console.error('Error updating map');
        return;
    }else{
        console.log('Map updated successfully');
        await getMaps();
    }
}

onMounted(async () => {
    await getMaps();

    if (maps.value.length === 0){
        grid_x.value = 0;
        grid_y.value = 0;

        await updateGridX()
        await updateGridY()
    }else{
        selectCurrentMap(maps.value[0]);
    }
})

// watch for changes in showMaps and then minimize or maximize the map bar
watch(showMaps, (newValue) => {
    const mapBar = document.getElementById('mapBar');
    const mapClosingBtn = document.getElementById('mapClosingBtn');

    if (newValue){
        mapBar?.classList.remove('h-[1vh]');
        mapBar?.classList.add('h-[15vh]');
        mapClosingBtn?.classList.remove('top-[1%]');
        mapClosingBtn?.classList.add('top-[11.5%]');
        imgHide.value = arrowUp;

    } else {
        mapBar?.classList.remove('h-[15vh]');
        mapBar?.classList.add('h-[1vh]');
        mapClosingBtn?.classList.remove('top-[11.5%]');
        mapClosingBtn?.classList.add('top-[1%]');
        imgHide.value = arrowDown;
    }
})

</script>