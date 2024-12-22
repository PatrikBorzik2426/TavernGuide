<template>
    <div class="relative">
        <img @click="showDiceSet()" src="@/assets/imgs/dice.svg" class="bg-purple text-white w-fit p-2 rounded-full cursor-pointer">
        <div v-if="showDiceRolls" class="flex items-center justify-between gap-2 p-2 absolute bg-purple w-fit h-full top-[0%] right-[110%] rounded-md">
                <p class=" text-sm w-20 text-white font-bold"> Last Roll: {{ lastRoll }}</p>
                <p @click="rollDice(4)" class=" p-1 w-8 flex justify-center items-center bg-white rounded-full aspect-square text-purple font-bold cursor-pointer">d4</p>
                <p @click="rollDice(6)" class=" p-1 w-8 flex justify-center items-center bg-white rounded-full aspect-square text-purple font-bold cursor-pointer">d6</p>
                <p @click="rollDice(8)" class=" p-1 w-8 flex justify-center items-center bg-white rounded-full aspect-square text-purple font-bold cursor-pointer">d8</p>
                <p @click="rollDice(10)" class=" p-1 w-8 flex justify-center items-center bg-white rounded-full aspect-square text-purple font-bold cursor-pointer">d10</p>
                <p @click="rollDice(12)" class=" p-1 w-8 flex justify-center items-center bg-white rounded-full aspect-square text-purple font-bold cursor-pointer">d12</p>
                <p @click="rollDice(20)" class=" p-1 w-8 flex justify-center items-center bg-white rounded-full aspect-square text-purple font-bold cursor-pointer">d20</p>
        </div>

    </div>

    <div class=" relative z-[100]" >
        <img @click="showInitiativeBar()" src="@/assets/imgs/swords.svg" class="bg-purple text-white w-fit p-2 rounded-full cursor-pointer">
        <div v-if="showInitiative">
            <div v-if="props.combatInit?.length > 0" class=" flex flex-col absolute top-[0%] right-[110%] min-w-fit h-fit bg-purple p-2 gap-2">
                <div v-for="(initiative, index) in props.combatInit" :key="index" 
                    class="flex min-w-40 w-full h-fit items-center justify-between gap-1 p-2 text-center rounded-md transition-colors"
                    :class="{'bg-white' : index===props.current_initiative, 'bg-dark/50' : index!==props.current_initiative}"
                    >
                    <p class=" text-sm text-purple font-bold w-full" >{{ `${initiative.character_name} - ${initiative.pivot_id}` }}</p>
                    <p class=" text-sm text-purple font-bold w-full">{{ `${initiative.randomRoll} + ${initiative.initiative}` }}</p>
                </div>
            </div>
            <div class="flex flex-col absolute gap-2 top-[120%] h-fit bg-purple py-2 px-1 rounded-md cursor-pointer">
                <img @click="startCombat()" src="@/assets/imgs/play_white.svg" type="button" class=" p-1 bg-purple border-2 border-white  rounded-full hover:animate-pulse" >
                <img @click="nextPlayerInitiative()" src="@/assets/imgs/arrow_right.svg" type="button" class=" p-1 bg-purple border-2 border-white  rounded-full hover:animate-pulse" >
                <img @click="clearInitiative()" src="@/assets/imgs/reset.svg" type="button" class=" p-1 bg-purple border-2 border-white  rounded-full hover:animate-pulse" >
            </div>
        </div>
    </div>

    <div class="relative">
        <img @click="" src="@/assets/imgs/radio.svg" class=" bg-purple text-white w-fit p-2 rounded-full cursor-pointer">
    </div>

    <div class="Notes">
        <img @click="" src="@/assets/imgs/notes.svg" class=" bg-purple text-white w-fit p-2 rounded-full cursor-pointer">
    </div>

</template>
<script setup lang="ts">
import { ref, defineProps } from 'vue';
import type {CombatInit} from '~/models/CombatInit';
import { callAxios } from '~/services/axios';

const props = defineProps<{
  combatInit: CombatInit[] | null;
  campaign_id: number;
  map_id: number;
  current_initiative: number;
}>();

const lastRoll = ref<number>(0);

// Display constants
const showDiceRolls = ref<boolean>(false);
const showInitiative = ref<boolean>(false);

function showDiceSet () {
    showDiceRolls.value = !showDiceRolls.value;
}

function showInitiativeBar () {
    showInitiative.value = !showInitiative.value;
}

function clearInitiative() {
}

function rollDice (sides: number) {
    for (let i = 0; i < 10; i++) {
        setTimeout(() => {
            lastRoll.value = Math.floor(Math.random() * sides) + 1;
        }, 100 * i);
    }
}

function nextPlayerInitiative() {
    currentInitiativeTurn.value++;
}

async function startCombat() {
    currentInitiativeTurn.value = 0;

    const body = {
        campaign_id: props.campaign_id,
        map_id: props.map_id,
    }

    await callAxios(body,'combats/start')
}

watch(() => props.combatInit, (newValue) => {
   
    newValue?.sort((a, b) => {
        return b.randomRoll + b.initiative - (a.randomRoll + a.initiative);
    });
    
});

watch(() => currentInitiativeTurn.value, (newValue) => {
    if (newValue >= props.combatInit!.length) {
        currentInitiativeTurn.value = 0;
    }
});

</script>