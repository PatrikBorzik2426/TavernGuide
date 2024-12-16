<template>
    <main class=" flex justify-center items-center w-screen h-screen bg-dark font-manrope">
        <div v-if='displayLoginForm' class="flex justify-center w-[60%] h-[50%] items-center gap-10">
            <LoginComponent @register="handleChange"/>
             <img src="../assets/imgs/tavern_guide_logo.svg" class=" w-[20vw] animate-fade-left">
        </div>

        <div v-else class="flex justify-center w-[60%] h-[50%] items-center gap-10">
             <img src="../assets/imgs/tavern_guide_logo.svg" class=" w-[20vw] animate-fade-right">
             <RegisterComponent @login="handleChange"/>
        </div>

    </main>

</template>

<script setup lang="ts">
import { ref } from 'vue';

const displayLoginForm = ref<boolean>(true);

// Function for checking difference between the two forms
function checkWhatFormToDisplay(data : string){
    if (data === 'login'){
        displayLoginForm.value = true;
    } else {
        displayLoginForm.value = false;
    }
}

// Function for changing the display form when child component emits an event
function handleChange(data: string){
    console.log(data);
    checkWhatFormToDisplay(data);
}

</script>