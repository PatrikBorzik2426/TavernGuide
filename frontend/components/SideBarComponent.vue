<template>
    <div v-if="generalError.length > 0" class=" bg-primary h-16 w-fit p-4 fixed top-2 right-2 flex justify-center items-center text-center text-medium text-white rounded-md">
        <p>{{ generalError }}</p>
    </div>

    <div class=" w-fit min-w-[200px] h-full bg-primary flex flex-col p-4 text-white">
        <h3 class=" font-bold text-2xl">{{currentUser?.login}}</h3>
        <hr class=" my-4 border-none h-1 bg-white rounded-full">

        <ul class=" text-lg flex flex-col gap-y-4">
            <li
            @click="emitChosenWindow(index)"
            v-for="(item, index) in menuItems" 
            :key="index" 
            class="flex gap-x-4 cursor-pointer hover:font-medium"
            :class="{ 'font-medium': index === chosenWindow }"
            >
                <img :src="item.icon" alt="menu icon">
                <span>{{ item.label }}</span>
            </li>
        </ul>

        <button @click="logout" type="button" class="flex w-4/5 p-2 mx-auto mt-auto justify-between items-center  text-lg bg-white text-primary rounded-md hover:animate-wiggle animate-infinite">
            <span class="uppercase font-medium">Logout</span>
            <img src="../assets/imgs/off_button.svg">
        </button>
    </div>
</template>

<script setup lang="ts" >
    import {ref, defineEmits} from 'vue';
    import campaignIcon from '@/assets/imgs/campaign.svg';
    import maskIcon from '@/assets/imgs/mask.svg';
    import { callAxios } from '~/services/axios';
    import { useRouter } from 'vue-router';
    import type { User } from '~/models/User';

    const router = useRouter();
    const emit = defineEmits(['mainWindowIndex']);
    const currentUser = ref<User | null>(null);

    const menuItems = [
        { label: 'Campaigns', icon: campaignIcon },
        { label: 'Characters', icon: maskIcon },
    ];

    const chosenWindow = ref<number>(0);
    const generalError = ref<string>('');

    async function logout() {
        const result = await callAxios({}, 'auth/logout');
        
        if (result){
            if (result.status === 200){
                console.log('Logout successful');
                router.push({name: 'auth'});
            }else{
                generalError.value = 'Logout failed';

                setTimeout(() => {
                    generalError.value = '';
                }, 5000);
            }
        }
    
    }

    function emitChosenWindow(index: number){
        chosenWindow.value = index;
        emit('mainWindowIndex', index);
    }

    onMounted(async () => {
        const result = await callAxios({},'auth/simpleAuth')

        if (result){
            if (result.status === 200){
                currentUser.value = result.user;
            }else{
                router.push({name: 'auth'});
            }
        }
    });


</script>