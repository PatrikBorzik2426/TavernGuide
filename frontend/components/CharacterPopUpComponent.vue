<template>
    <div class="w-full rounded-full relative z-[200]">
        <img @contextmenu.prevent="showCharacterMenu()" :src="'http://localhost:3333/storage/characters/' + props.character?.avatarUrl" class="w-full h-full">
        <div v-if="showMenu" 
        class=" w-64 h-fit p-4 bg-light_primary absolute rounded-xl border-2 border-white"
        :class="{ 'bottom-[120%]' : props.cell?.y >= 5, ' top-[120%] left-[120%]' : props.cell?.y < 5 }"
        >
            <div class="flex justify-between">
                <p class="uppercase font-medium text-white">Stats Menu</p>
                <p @click="showCharacterMenu()" class="mb-4 text-white font-medium hover:font-bold cursor-pointer text-right"> ✕ </p>
            </div>
            <form class=" grid grid-cols-3 gap-2 w-full h-full">
                <p class=" uppercase font-bold text-center text-white col-start-2">From</p>
                <p class=" uppercase font-bold text-center text-white col-start-3">To</p>

                <label for="maxHealth" class=" col-start-1 text-white font-medium">Health:</label>
                <input @blur="updateUser()" name="maxHealth" v-model="characterCurrentHealth" type="number" class="col-start-2 max-h-fit bg-primary border-white border-2 rounded-md text-white text-center" placeholder="Health">
                <input @blur="updateUser()" name="currentHealth" v-model="characterHealth" type="number" class="col-start-3 max-h-fit bg-primary border-white border-2 rounded-md text-white text-center" placeholder="Health">
                
                <label for="armour" class="col-start-1 text-white font-medium">Armour:</label>
                <input @blur="updateUser()" name="armour" v-model="armour" type="number" class="col-start-2 max-h-fit bg-primary border-white border-2 rounded-md text-white text-center" placeholder="Health">
                
                <label for="speed" class="col-start-1 text-white font-medium">Speed:</label>
                <input @blur="updateUser()" name="speed" v-model="speed" type="number" class="col-start-2 max-h-fit bg-primary border-white border-2 rounded-md text-white text-center" placeholder="Health">
                
                <label for="fov" class="col-start-1 text-white font-medium">FOV:</label>
                <input @blur="updateUser()" name="fov" v-model="fov" type="number" class="col-start-2 max-h-fit bg-primary border-white border-2 rounded-md text-white text-center" placeholder="Health">
            
                <label for="initiative" class="col-start-1 text-white font-medium">Initiative:</label>
                <input @blur="updateUser()" name="initiative" v-model="initiative" type="number" class="col-start-2 max-h-fit bg-primary border-white border-2 rounded-md text-white text-center" placeholder="Health">

            </form>
            <div class="flex justify-between mt-4">
                <img v-if="props.currentUser?.id === props.currentDmId" 
                @click="changeTokenHidden()" 
                :src="hideToken ? eyeOff : eye" 
                class="p-2 bg-primary rounded-full w-10 cursor-pointer hover:animate-pulse animate-infinite"
                />
                <img @click="addCharacterToCombat" src="@/assets/imgs/swords.svg" class=" p-2 bg-primary rounded-full w-10 cursor-pointer hover:animate-pulse animate-infinite">
                <img v-if="props.currentUser?.id === props.currentDmId" @click="removeFromCell()" src="@/assets/imgs/delete_white.svg" class=" p-2 bg-primary rounded-full w-10 cursor-pointer hover:animate-pulse animate-infinite">
            </div>
        </div>
        <div class="absolute top-[100%] left-[0%] w-full">
            <p v-if="currentUser?.id === currentDmId" class=" text-white p-1 font-bold bg-dark text-[10px] text-center rounded-full absolute bottom-[100%]">{{ currentCharacter?.pivot_id }}</p>
            <p class="uppercase font-medium bg-light_primary/70  text-white text-sm text-center rounded-full">{{ currentCharacter?.name }}</p>
            <div class=" w-full h-2 bg-red-200 rounded-full">
                <div class="max-w-full h-full bg-red-500 rounded-full" :style="{ width: (characterCurrentHealth / characterHealth) * 100 + '%' }"></div>
            </div>
            <p v-if="currentUser?.id === currentDmId" class="p-1 text-white font-bold bg-blue-500 text-center rounded-full absolute bottom-[100%] left-[80%]">{{ armour }}</p>
        </div>
    </div>

</template>
<script setup lang="ts">
import { ref, defineProps } from 'vue';
import type { Character } from '@/models/Character';
import type { CellOfGrid } from '@/models/CellOfGrid';
import { callAxios } from '@/services/axios';
import type { User } from '~/models/User';
import eyeOff from '@/assets/imgs/eye_off.svg';
import eye from '@/assets/imgs/eye.svg';

const props = defineProps({
    character : Object as () => Character | null,
    cell : Object as () => CellOfGrid,
    currentUser : Object as () => User | null,
    currentDmId : Number,
    campaignId : Number,
    mapId : Number
});


const showMenu = ref<boolean>(false);

const currentCell = ref<CellOfGrid | undefined>(props.cell);
const currentCharacter = ref<Character | null | undefined>(props.character);

const characterHealth = ref<number>(currentCharacter.value?.health || 0);
const characterCurrentHealth = ref<number>(currentCharacter.value?.current_health || 0);
const armour = ref<number>(currentCharacter.value?.armour || 0);
const speed = ref<number>(currentCharacter.value?.speed || 0);
const fov = ref<number>(currentCharacter.value?.fov || 0);
const hideToken = ref<boolean>(currentCharacter.value?.hidden || false);
const initiative = ref<number>(currentCharacter.value?.initiative || 0);

async function updateUser() {
    currentCharacter.value!.health = characterHealth.value;
    currentCharacter.value!.current_health = characterCurrentHealth.value;
    currentCharacter.value!.armour = armour.value;
    currentCharacter.value!.speed = speed.value;
    currentCharacter.value!.fov = fov.value;
    currentCharacter.value!.hidden = hideToken.value;
    currentCharacter.value!.initiative = initiative.value;

    const body = {
        id: currentCharacter.value?.id,
        name: currentCharacter.value?.name,
        avatarUrl: currentCharacter.value?.avatarUrl,
        x: currentCharacter.value?.x,
        y: currentCharacter.value?.y,
        status: currentCharacter.value?.status,
        user_id: currentCharacter.value?.user_id,
        pivot_id: currentCharacter.value?.pivot_id,
        health: characterHealth.value,
        current_health: characterCurrentHealth.value,
        armour: armour.value,
        speed: speed.value,
        fov: fov.value,
        initiative: initiative.value,
        hidden: hideToken.value,
    }

    await callAxios(body, 'characters/update');
}

function changeTokenHidden() {
    hideToken.value = !hideToken.value;
    updateUser();
}

function showCharacterMenu() {
    if(props.currentUser?.id !== currentCharacter.value?.user_id && props.currentUser?.id !== props.currentDmId) {
        return;
    }else{
        showMenu.value = !showMenu.value;
    }

}

function removeFromCell() {
    if(props.currentUser?.id !== currentCharacter.value?.user_id) return;

    currentCell.value!.character = null;
    currentCharacter.value!.cell_id = null;

    const body = {
        id: currentCharacter.value?.id,
        name: currentCharacter.value?.name,
        avatarUrl: currentCharacter.value?.avatarUrl,
        x: currentCharacter.value?.x,
        y: currentCharacter.value?.y,
        status: currentCharacter.value?.status,
        user_id: currentCharacter.value?.user_id,
        pivot_id: currentCharacter.value?.pivot_id,
        health: characterHealth.value,
        current_health: characterCurrentHealth.value,
        armour: armour.value,
        speed: speed.value,
        fov: fov.value,
        initiative: initiative.value,
        hidden: hideToken.value,
        action: 'remove',
    }

    callAxios(body, 'characters/update');
    showMenu.value = false;
}

async function addCharacterToCombat() {
    if (currentCharacter.value){

        currentCharacter.value.initiative = initiative.value;
        
        const randomD20roll = Math.floor(Math.random() * 20) + 1;
        
        const body = {
            campaign_id: props.campaignId,
            map_id: props.mapId,
            character_id: currentCharacter.value.id,
            initiative: initiative.value,
            random_roll: randomD20roll,
            owner_id: currentCharacter.value.user_id,
            pivot_id: currentCharacter.value.pivot_id,
        }
        
        await callAxios(body,'combats/initiate');
        
        showMenu.value = false;
    }
}

watch(() => props.character, (newValue) => {
    currentCharacter.value = newValue;
    characterHealth.value = newValue?.health || 0;
    characterCurrentHealth.value = newValue?.current_health || 0;
    armour.value = newValue?.armour || 0;
    speed.value = newValue?.speed || 0;
    fov.value = newValue?.fov || 0;
    hideToken.value = newValue?.hidden || false;
    initiative.value = newValue?.initiative || 0;
});

</script>