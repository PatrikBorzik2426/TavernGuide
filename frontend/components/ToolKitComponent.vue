<template>
    <div class="relative">
        <img @click="showDiceSet()" src="@/assets/imgs/dice.svg" class="bg-primary text-white w-fit p-2 rounded-full cursor-pointer">
        <div v-if="showDiceRolls" class="flex items-center justify-between gap-2 p-2 absolute bg-primary w-fit h-full top-[0%] right-[110%] rounded-md">
                <p class=" text-sm w-24 text-white font-bold"> Last Roll: {{ lastRoll }}</p>
                <p @click="rollDice(4)" class=" p-1 w-8 flex justify-center items-center bg-white rounded-full aspect-square text-primary font-bold cursor-pointer">d4</p>
                <p @click="rollDice(6)" class=" p-1 w-8 flex justify-center items-center bg-white rounded-full aspect-square text-primary font-bold cursor-pointer">d6</p>
                <p @click="rollDice(8)" class=" p-1 w-8 flex justify-center items-center bg-white rounded-full aspect-square text-primary font-bold cursor-pointer">d8</p>
                <p @click="rollDice(10)" class=" p-1 w-8 flex justify-center items-center bg-white rounded-full aspect-square text-primary font-bold cursor-pointer">d10</p>
                <p @click="rollDice(12)" class=" p-1 w-8 flex justify-center items-center bg-white rounded-full aspect-square text-primary font-bold cursor-pointer">d12</p>
                <p @click="rollDice(20)" class=" p-1 w-8 flex justify-center items-center bg-white rounded-full aspect-square text-primary font-bold cursor-pointer">d20</p>
        </div>

    </div>

    <div class=" relative z-[100]" >
        <img @click="showInitiativeBar()" src="@/assets/imgs/swords.svg" class="bg-primary text-white w-fit p-2 rounded-full cursor-pointer">
        <div v-if="showInitiative">
            <div v-if="props.combatInit?.length > 0" class=" flex flex-col absolute top-[0%] right-[110%] min-w-fit h-fit bg-primary p-2 gap-2">
                <div v-for="(initiative, index) in props.combatInit" :key="index" 
                    class="flex min-w-40 w-full h-fit items-center justify-between gap-1 p-2 text-center rounded-md transition-colors"
                    :class="{'bg-white' : index===props.current_initiative, 'bg-dark/50' : index!==props.current_initiative}"
                    >
                    <p class=" text-sm text-primary font-bold w-full" >{{ `${initiative.character_name} - ${initiative.pivot_id}` }}</p>
                    <p class=" text-sm text-primary font-bold w-full">{{ `${initiative.randomRoll} + ${initiative.initiative}` }}</p>
                </div>
            </div>
            <div class="flex flex-col absolute gap-2 top-[120%] h-fit bg-primary py-2 px-1 rounded-md cursor-pointer">
                <img @click="startCombat()" src="@/assets/imgs/play_white.svg" type="button" class=" p-1 bg-primary border-2 border-white  rounded-full hover:animate-pulse" >
                <img @click="nextPlayerInitiative()" src="@/assets/imgs/arrow_right.svg" type="button" class=" p-1 bg-primary border-2 border-white  rounded-full hover:animate-pulse" >
                <img @click="clearInitiative()" src="@/assets/imgs/reset.svg" type="button" class=" p-1 bg-primary border-2 border-white  rounded-full hover:animate-pulse" >
            </div>
        </div>
    </div>

    <div class="relative">
        <img @click="showSoundsBar()" src="@/assets/imgs/radio.svg" class=" bg-primary text-white w-fit p-2 rounded-full cursor-pointer">
        <div v-if="showSounds" class=" w-fit h-fit bg-primary absolute top-[-550%] right-[110%] z-[100] p-2 rounded-md overflow-hide">
            <div class=" flex flex-col gap-2 justify-between w-72 mb-4">
                <input @change="loadSound" name="sound" type="file" accept=".mp3,.wav,.ogg" class=" w-56 overflow-y-hidden text-white">
                <div class=" flex gap-1">
                    <img @click="uploadSound" src="@/assets/imgs/plus_primary.svg" class="bg-white text-primary font-medium p-1 rounded-full w-8 cursor-pointer hover:animate-pulse">
                    <img @click="stopSound" src="@/assets/imgs/stop_primary.svg" class="bg-white text-primary font-medium p-1 rounded-full w-8 cursor-pointer hover:animate-pulse">
                    <label class="inline-flex items-center cursor-pointer">
                        <input v-model="soundIsEffect" type="checkbox" @click="changeIsEffect()" class="sr-only peer">
                        <div class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4  rounded-full peer dark:bg-light_primary peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:border after:rounded-full after:h-5 after:w-5 after:transition-all  peer-checked:bg-gray-950"></div>
                        <span class="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300 text-left uppercase">Sound Effect?</span>
                    </label>
        
                </div>
            </div>
            
            <ul class="flex flex-col gap-2 max-h-64 overflow-y-scroll overflow-x-hidden scrollbar-thin ">
                <li v-for="(sound,index) in sounds" :key="index" >
                    <div v-if="checkToDisplaySound(sound)" class="flex justify-between gap-1 items-center border-white border-2 p-1 rounded-md">
                        <p class="text-white max-w-[70%]">{{ sound.name }}</p>
                        <div class="flex gap-1">
                            <img @click="playSound(sound)" src="@/assets/imgs/play.svg" class="bg-white text-primary font-medium p-1 rounded-full w-8 cursor-pointer hover:animate-pulse">
                            <img @click="deleteSound(sound)" src="@/assets/imgs/delete.svg" class="bg-white text-primary font-medium p-1 rounded-full w-8 cursor-pointer hover:animate-pulse">
                        </div>
                    </div>
                </li>
            </ul>
        </div>
    </div>

    <div class="Notes">
        <img @click="" src="@/assets/imgs/notes.svg" class=" bg-primary text-white w-fit p-2 rounded-full cursor-pointer">
    </div>

</template>
<script setup lang="ts">
import { ref, defineProps } from 'vue';
import type {CombatInit} from '~/models/CombatInit';
import { callAxios } from '~/services/axios';
import type { Sound } from '~/models/Sound';
import axios from 'axios';

const props = defineProps<{
  combatInit: CombatInit[] | null;
  campaign_id: number;
  map_id: number;
  current_initiative: number;
}>();

const localIP = useRuntimeConfig().public.localIP;

const apiBaseUrl = 'https://localhost:3333';

const lastRoll = ref<number>(0);

// Display constants
const showDiceRolls = ref<boolean>(false);
const showInitiative = ref<boolean>(false);
const showSounds = ref<boolean>(false);
const currentInitiativeTurn = ref<number>(0);

// Form constants
const newSoundFile = ref<File | null>(null);
const sounds = ref<Sound[]>([]);
const soundIsEffect = ref<boolean>(false);

function showDiceSet () {
    showDiceRolls.value = !showDiceRolls.value;
}

function showInitiativeBar () {
    showInitiative.value = !showInitiative.value;
}

function showSoundsBar () {
    showSounds.value = !showSounds.value;
}

function changeIsEffect() {
    soundIsEffect.value = !soundIsEffect.value;
}

function clearInitiative() {
    const body = {
        campaign_id: props.campaign_id,
        map_id: props.map_id,
    }

    callAxios(body,'combats/end')
}

function checkToDisplaySound(sound : Sound){
    if (soundIsEffect.value){
        if(sound.effect){
            return true;
        }else{
            false
        }
    }else{
        if(!sound.effect){
            return true;
        }else{
            false
        }
    }
}

function rollDice (sides: number) {
    for (let i = 0; i < 10; i++) {
        setTimeout(() => {
            lastRoll.value = Math.floor(Math.random() * sides) + 1;
        }, 100 * i);
    }
}

async function nextPlayerInitiative() {
    const body ={
        campaign_id: props.campaign_id,
        map_id: props.map_id,
    }

    await callAxios(body,'combats/next')
}

async function startCombat() {
    currentInitiativeTurn.value = 0;

    const body = {
        campaign_id: props.campaign_id,
        map_id: props.map_id,
    }

    await callAxios(body,'combats/start')
}

async function listSounds(){
    const result = await callAxios({},'sounds/list')

    if (result.status === 200){
        sounds.value = result.sounds;
    }
}

function loadSound(event : any){
    console.log(event.target.files[0])
    newSoundFile.value = event.target.files[0];
}

async function uploadSound() {
    const formData = new FormData();
    
    if (newSoundFile.value !== null){

        formData.append('sound', newSoundFile.value);
        formData.append('file_name', newSoundFile.value.name);
        formData.append('is_effect', soundIsEffect.value ? '1' : '0');
        
        const response = await axios.post(`${apiBaseUrl}/sounds/upload`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': 'Bearer ' + localStorage.getItem('bearer')
            },
        });

        console.log(response)

        await listSounds();

    }
}

async function deleteSound(sound : Sound) {
    const body = {
        sound_name: sound.name,
    }

    await callAxios(body,'sounds/delete')

    await listSounds();

}   

async function playSound(sound : Sound) {
    const body = {
        sound_name: sound.name,
        map_id: props.map_id,
    }

    await callAxios(body,'sounds/play')
}

async function stopSound() {
    const body = {
        map_id: props.map_id,
    }

    await callAxios(body,'sounds/stop')
}

onMounted(async ()=>{
    await listSounds();
})

watch(() => currentInitiativeTurn.value, (newValue) => {
    if (newValue >= props.combatInit!.length) {
        currentInitiativeTurn.value = 0;
    }
});

</script>