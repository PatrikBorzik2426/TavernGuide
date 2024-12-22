<template>
 <div v-if="props.combatInit?.length>0 && combatStarted" class="flex p-4 w-fit h-fit bg-purple text-white fixed top-[65%] left-[70%] z-[100] gap-10 items-center rounded-md">
    <img src="@/assets/imgs/swords.svg" class=" p-2 w-3/12 h-fit mx-auto bg-purple border-2 border-white  rounded-full" >
    <div v-if="currentUser?.id === combatInit[props.currentInitiative].owner_id" class=" flex flex-col w-44">
        <div v-for="(phase,index) in options" :key="index" class=" flex w-full gap-8">
            <div class="w-1 h-12 relative"
                :class = "{ 
                    'bg-white' : index === currentIndex,
                    'bg-white/50' : index !== currentIndex
                }"
            >
                <div 
                class=" w-6 aspect-square rounded-full border-white border-2 bg-purple absolute top-3 -left-2.5 "
                :class = "{ 
                    'bg-white' : index === currentIndex,
                    'bg-purple' : index !== currentIndex,
                    'border-white/50' : index !== currentIndex
                }"
                ></div>
            </div>
            <div @click="proceedInTurn()" class=" flex items-center animate-pulse animate-infinite hover:animate-none hover:cursor-pointer">
                <p class="ml-auto"
                :class = "{ 
                    'text-white' : index === currentIndex,
                    'text-white/50' : index !== currentIndex
                }"
                >{{ phase.name }}</p>
                <img v-if="index === currentIndex" src="@/assets/imgs/arrow_right.svg" class="w-fit">
            </div>
        </div>
    </div>
    <div v-else class=" flex flex-col w-44">
        <p class=" text-white">It's {{ combatInit[props.currentInitiative].character_name }}'s turn</p>
    </div>
 </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { User } from '~/models/User';
import type { CombatInit } from '~/models/CombatInit';
import { callAxios } from '~/services/axios';


const options = [
    { name: 'Action', number: 1},
    { name: 'Bonus Action', number: 2},
    { name: 'Reaction', number: 3},
    { name: 'Movement', number: 4}
]

// Props

const props = defineProps<{
    combatInit: CombatInit[] | null;
    currentUser: User | null;
    action: string;
    currentInitiative: number;
    campaign_id: number;
    map_id: number;
}>();

// Functional constants
const currentIndex = ref<number>(0);
const combatStarted = ref<boolean>(false);
const myTurnFinished = ref<boolean>(false);
const myTurnStarted = ref<boolean>(false);


async function proceedInTurn() {
    
    currentIndex.value++;
    
    if (currentIndex.value === options.length) {
        const body ={
            campaign_id: props.campaign_id,
            map_id: props.map_id,
        }

        await callAxios(body, 'combats/next')
    }
}

watch(() => props.action, (newVal) => {
    if (newVal === 'end') {
        currentIndex.value = 0;
    }else if (newVal === 'start') {
        combatStarted.value = true;
    }
})

</script>