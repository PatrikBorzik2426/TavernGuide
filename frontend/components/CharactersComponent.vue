<template>
    <div 
        class=" h-full py-2 px-4 bg-light_primary sticky top-0 left-0 text-white z-[100] scrollbar-thin scrollbar-track-transparent scrollbar-thumb-transparent"
        :class="{'w-[25vw] bg-light_primary': showCharacters, 'w-[0vw] bg-transparent': !showCharacters, 'overflow-y-hidden' : !showCharacters, 'overflow-y-scroll' : showCharacters}"
        
        >
            <h1 v-if="showCharacters" class="text-white text-2xl text-center">Characters</h1>

            <nav v-if="showCharacters" class="mx-auto mt-4">
                <ul class="grid grid-cols-3 gap-4 justify-center items-center text-center uppercase">
                    <img src="@/assets/imgs/plus.svg" @click="changeTab(0)" class=" p-1 mx-auto cursor-pointer border-white border-2 rounded-full hover:animate-pulse"/>
                    <img src="@/assets/imgs/list.svg" @click="changeTab(1)" class=" p-1 mx-auto cursor-pointer border-white border-2 rounded-full hover:animate-pulse"/>
                    <img src="@/assets/imgs/npc.svg" @click="changeTab(2)" class=" p-1 mx-auto cursor-pointer border-white border-2 rounded-full hover:animate-pulse"/>
                </ul>
            </nav>

            <hr class=" border-none h-1 my-8 rounded-full bg-white">

            <form v-if="showCharacters && showTab === 0" @submit.prevent="createNewCharacter" class=" flex mt-4 flex-col gap-2 ">
                <div class="flex flex-col">
                    <label for="name">Character Name:</label>
                    <input v-model="charInputName" name="name" type="text" class=" mt-2 px-2 py-1 h-8 bg-transparent border-[3px] border-white rounded-lg">
                </div>
                <div class="flex justify-between">
                    <div class="flex flex-col">
                        <label for="health">Health:</label>
                        <input v-model="charInputHealth" name="health" type="number" class=" max-w-16 mt-2 px-2 py-1 h-8 bg-transparent border-[3px] border-white rounded-lg">
                    </div>
                    <div class="flex flex-col">
                        <label for="armour">Armour:</label>
                        <input v-model="charInputArmour" name="armour" type="number" class=" max-w-16 mt-2 px-2 py-1 h-8 bg-transparent border-[3px] border-white rounded-lg">
                    </div>
                    <div class="flex flex-col">
                        <label for="speed">Speed:</label>
                        <input v-model="charInputSpeed" name="speed" type="number" class=" max-w-16 mt-2 px-2 py-1 h-8 bg-transparent border-[3px] border-white rounded-lg">
                    </div>
                    <div class="flex flex-col">
                        <label for="fov">FOV:</label>
                        <input v-model="charInputFov" name="fov" type="number" class=" max-w-16 mt-2 px-2 py-1 h-8 bg-transparent border-[3px] border-white rounded-lg">
                    </div>
                </div>
                <div class="flex flex-col">
                    <label for="info_url">Info Url: (optional)</label>
                    <input v-model="charInputInfoUrl" name="info_url" type="text" class=" mt-2 px-2 py-1 h-8 bg-transparent border-[3px] border-white rounded-lg">
                </div>
                <div class="flex flex-col">
                    <label for="avatar" class="">Character Avatar:</label>
                    <input @change="loadImage" name="avatar" type="file" accept=".jpg,.png,.jpeg" class="">
                </div>
                <div class="flex justify-between px-1 py-2">
                    <label class="inline-flex items-center cursor-pointer">
                        <input type="checkbox" v-model="isNPCInput" class="sr-only peer">
                        <div class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-white rounded-full peer dark:bg-light_primary peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                        <span class="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">NPC?</span>
                    </label>
                    <div v-if="isNPCInput" class="flex items-baseline justify-center gap-2">
                        <label for="fov">Number of NPCs:</label>
                        <input v-model="numberOfNPCs" name="numNPC" type="number" class=" max-w-16 mt-2 px-2 py-1 h-8 bg-transparent border-[3px] border-white rounded-lg">
                    </div>
                </div>

                <button type="submit" class="p-2 mt-4 text-center text-md font-medium bg-white text-primary rounded-md hover:animate-pulse animate-infinite">Add Character</button>
            </form>
            
            <div v-else-if="showCharacters && showTab === 1" class="">
                <h3 class=" text-2xl uppercase text-center font-bold mb-8">My Character list</h3>
                <div class="flex flex-col gap-2 w-full ">
                    <div v-for="(character, index) in myCharacters" :key="index" class="flex flex-col gap-2">
                        <div class="flex w-full justify-center items-center gap-2 p-2 border-2 border-white rounded-xl">
                            <img :src="'https://localhost:3333/storage/characters/' + character.avatarUrl" class="w-full max-w-[40%] aspect-square ">
                            <div class="flex flex-col pt-2 max-w-[50%] gap-2">
                                <div class="flex flex-col justify-center items-center w-full">
                                    <label class="text-lg font-bold uppercase">Name:</label>
                                    <input @blur="updateCharacter(character)" v-model="character.name" type="text" class="mt-2 px-2 max-w-[80%] py-1 h-8 bg-transparent text-center rounded-lg">

                                    <label class="text-lg font-bold uppercase">Add to User:</label>
                                    <select 
                                        @change="onUserChange(character)" 
                                        v-model="character.user_id" 
                                        class="mt-2 px-2 max-w-full py-1 h-8 bg-transparent text-center rounded-lg border-white border-2"
                                        >
                                        <option 
                                            class="text-black text-center" 
                                            v-for="(user, index) in assignedUsers" 
                                            :key="index" 
                                            :value="user.id"
                                        >
                                            {{ user.login }}
                                        </option>
                                    </select>
                                </div>
                                <div class="flex justify-center gap-4 mx-auto h-12 w-full">
                                    <img @click="emitCharacter(character)" :src="setCharacterIcon" class=" w-8 h-8 p-1 bg-white rounded-full hover:animate-pulse hover:animate-infinite cursor-pointer">
                                    <img @click="deleteCharacter(character.id, false)" :src="deleteIcon" class=" w-8 h-8 p-1 bg-white rounded-full hover:animate-pulse hover:animate-infinite cursor-pointer">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div v-else-if="showCharacters && showTab ===2">
                <h3 class=" text-2xl uppercase text-center font-bold mb-8">My NPC list</h3>
                <div class="flex flex-col gap-2 w-full">
                    <div v-for="(character, index) in npcCharacters" :key="index" class="flex flex-col gap-2 h-fit">
                        <div class="flex w-full justify-center relative items-center gap-2 p-2 border-2 border-white rounded-xl">
                            <img :src="'https://localhost:3333/storage/characters/' + character.avatarUrl" class="w-full max-w-[40%] aspect-square ">
                            <div class="flex flex-col pt-2 max-w-[50%] gap-2">
                                <div class="flex flex-col justify-center items-center w-full">
                                    <label class="text-lg font-bold uppercase">Name:</label>
                                    <input v-model="character.name" type="text" class="mt-2 px-2 max-w-[80%] py-1 h-8 bg-transparent text-center rounded-lg">
                                </div>
                                <div class="flex justify-center gap-4 mx-auto h-12 w-full">
                                    <img @click="emitCharacter(character)" :src="setCharacterIcon" class=" w-8 h-8 p-1 bg-white rounded-full hover:animate-pulse hover:animate-infinite cursor-pointer">
                                    <img @click="deleteCharacter(character.pivot_id, true)" :src="deleteIcon" class=" w-8 h-8 p-1 bg-white rounded-full hover:animate-pulse hover:animate-infinite cursor-pointer">
                                </div>
                            </div>
                            <p class=" text-white font-bold absolute top-[0%] left-[5%]">{{ character.pivot_id }}</p>
                        </div>
                    </div>
                </div>
            </div>     
    </div>
    <button id="charactersClosing" @click="hideCharacters()" type="button" class=" w-[1.5vw] h-[4vh] absolute top-[50%] left-[24.5%] rounded-full border-2 border-white bg-light_primary z-[200]"
    :class="{'left-[24.5%]' : showCharacters, 'left-[3%]' : !showCharacters }">
            <img :src="hideIcon" class="mx-auto">
    </button>
</template>

<script setup lang="ts" >
import { defineProps, defineEmits } from 'vue';
import arrowLeft from '@/assets/imgs/arrow_left.svg';
import arrowRight from '@/assets/imgs/arrow_right.svg';
import startButton from '@/assets/imgs/play.svg';
import deleteButton from '@/assets/imgs/delete.svg';
import axios from 'axios';
import { callAxios } from '~/services/axios';
import type { Character } from '@/models/Character';
import type { User } from '@/models/User';

// Emits & Props
const props = defineProps({
    map_id: Number,
    campaign_id: Number
});

const emits = defineEmits(['characterToPlace']);

// Form constants
const charInputName = ref<string>('');
const charInputInfoUrl = ref<string>('');
const charInputHealth = ref<number>(0);
const charInputArmour = ref<number>(0);
const charInputSpeed = ref<number>(0);
const charInputAvatar = ref<File>();
const charInputFov = ref<number>(0);

const isNPCInput = ref<boolean>(false);
const numberOfNPCs = ref<number>(0);

// Display constants
const hideIcon = ref<string>(arrowLeft);
const setCharacterIcon = ref<string>(startButton);
const deleteIcon = ref<string>(deleteButton);

const showCharacters = ref<boolean>(true);
const showTab = ref<number>(0);
const myCharacters = ref<Character[]>([]);
const npcCharacters = ref<Character[]>([]);

// Functions constants
const assignedUsers = ref<User[]>([]);

function hideCharacters(){
    showCharacters.value = !showCharacters.value;

    if (showCharacters.value){
        hideIcon.value = arrowLeft;
    } else {
        hideIcon.value = arrowRight;
    }
}

// Process new user form
async function createNewCharacter(){
    if(charInputAvatar.value && charInputName.value && charInputHealth.value && charInputArmour.value && charInputSpeed.value && props.map_id){   
        
        const formData = new FormData();

        formData.append('name', charInputName.value);
        formData.append('health', charInputHealth.value.toString());
        formData.append('armour', charInputArmour.value.toString());
        formData.append('speed', charInputSpeed.value.toString());
        formData.append('fov', charInputFov.value.toString());
        formData.append('map_id', props.map_id.toString());
        formData.append('info_url', charInputInfoUrl.value);
        formData.append('avatar', charInputAvatar.value);

        if(isNPCInput.value){
            formData.append('is_npc', '1');
            formData.append('numNPC', numberOfNPCs.value.toString());
        }

        try{
            const response = await axios.post('https://localhost:3333/characters/create', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': 'Bearer ' + localStorage.getItem('bearer')
                }
            });

            console.log(response.data);

        }catch(e){
            console.log(e);
        }
    }
}

function loadImage(event : any){
    charInputAvatar.value = event.target.files[0];
}


function changeTab(number: number){
    
    if (number === 0){
        showTab.value = 0;
    }else if (number === 1){

        showTab.value = 1;

        callAxios({ map_id: props.map_id }, 'characters/listMap')
        .then((response) => {
            if (response.status === 200){
                myCharacters.value = response.characters;
            }else{
                console.error('Error fetching characters');
            }
        });

        console.log(myCharacters.value);

    }else if (number === 2){
        showTab.value = 2;

        callAxios({ map_id: props.map_id, npcs: true }, 'characters/listMap')
        .then((response) => {
            if (response.status === 200){
                npcCharacters.value = response.characters;
            }else{
                console.error('Error fetching characters');
            }
        });

        console.log(myCharacters.value);
    }
}

async function updateCharacter(character: Character){
    const response = await callAxios(character, 'characters/update');

    if (response.status === 200){
        console.log('Character updated successfully');
    }else{
        console.error('Error updating character');
    }
}

async function deleteCharacter(character_id: number, isNPC: boolean){

    const response = await callAxios({ character_id: character_id, npc : isNPC }, 'characters/delete');

    if (response.status === 200){
        console.log('Character deleted successfully');

        if(isNPC){
            const index = npcCharacters.value.findIndex((character) => character.pivot_id === character_id);
            npcCharacters.value.splice(index, 1);
        }else{
            const index = myCharacters.value.findIndex((character) => character.id === character_id);
            myCharacters.value.splice(index, 1);
        }
            
    }else{
        console.error('Error deleting character');
    }
}

async function onUserChange(character: Character){
    const selectedUser = assignedUsers.value.find(user => user.id === character.user_id);
    
    const body={
        character_id: character.id,
        user_id: selectedUser?.id,
        campaign_id: props.campaign_id,
        map_id: props.map_id
    }

    if (selectedUser){
        const response = await callAxios(body, 'characters/assignUser');

        if (response.status === 200){
            console.log('User assigned successfully');
        }else{
            console.error('Error assigning user');
        }
    }
}

function emitCharacter (character: Character){
    emits('characterToPlace', character);
}

onMounted(async () => {
   await callAxios({ campaign_id: props.campaign_id }, 'campaigns/getUsers').then((response) => {
       if (response.status === 200){
           assignedUsers.value = response.users;
           console.log("Users assigned to campaign: ", assignedUsers.value);
       }else{
           console.error('Error fetching users');
       }
   });
});

</script>