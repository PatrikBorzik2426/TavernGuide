<template>
    <main v-if="authorized" class="w-screen h-screen flex bg-dark">
        <SideBarComponent @main-window-index="changeMainWindowComponent" />
        <component :is="windows[currentWindow].component" :user="currentUser" />
    </main>
</template>

<script setup lang="ts" >
import { onBeforeMount } from 'vue';
import { callAxios } from '~/services/axios';
import { useRouter } from 'vue-router';
import CampaignComponent from '@/components/CampaignComponent.vue'
import CharactersComponent from '@/components/CharactersComponent.vue'
import type {User} from '@/models/User.js';

// Default constants for the main window
const route = useRouter();
const authorized = ref<boolean>(false);

// Content constants
const windows = [
    { component: CampaignComponent},
    { component: CharactersComponent}
];

// Functionality constants for the main window
const currentWindow = ref<number>(0);
const currentUser = ref<User>();


// Functions
function changeMainWindowComponent(index: number){
    currentWindow.value = index;
}

onBeforeMount(async () => {
    const result = await callAxios({}, 'auth/simpleAuth');

    if (result.status === 200){
        console.log('User is logged in');
        authorized.value = true;
        currentUser.value = result.user;
    }else{
        console.log('User is not logged in');
        route.push('auth')
    }
});
</script>