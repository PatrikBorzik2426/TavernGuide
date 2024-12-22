<template>
    <div class="py-4 px-8 w-full h-full">
        <div v-if="generalError.length > 0" class=" bg-purple h-16 w-fit p-4 fixed top-2 right-2 flex justify-center items-center text-center text-medium text-white rounded-md">
            <p>{{ generalError }}</p>
        </div>

        <h1 class=" text-4xl text-white font-bold uppercase">Campaigns</h1>
        <div class="flex flex-col gap-8 mt-8">
            <form @submit.prevent="verifyCreationForm" class="flex items-center gap-8 text-white max-w-[800px]">
                <div class=" w-full flex flex-col mt-auto">
                    <label for="name" class=" uppercase font-bold text-lg">Name</label>
                    <input v-model="nameInput" type="text" name="username" class=" mt-2 px-2 py-1 h-11 bg-transparent border-[3px] border-purple rounded-md"
                    :class="{'mb-2': nameError !== '' || descriptionError !== ''}"
                    >
                    <p class=" relative font-extralight text-red-500 animate-pulse animate-twice">{{ nameError }}</p>
                </div>
               
                <div class=" w-full flex flex-col mt-auto">
                    <label for="description" class=" uppercase font-bold text-lg">Description</label>
                    <input v-model="descriptionInput" type="text" name="username" class=" mt-2 px-2 py-1 h-11 bg-transparent border-[3px] border-purple rounded-md"
                    :class="{'mb-2': nameError !== '' || descriptionError !== ''}"
                    >
                    <p class=" font-extralight text-red-500 animate-pulse animate-twice">{{ descriptionError }}</p>
                </div>

                <button type="submit" 
                class="px-4 py-2 min-w-fit mt-auto max-h-fit border-[3px] border-purple bg-purple text-white font-medium uppercase rounded-md hover:bg-white hover:text-purple transition-colors hover:border-white"
                :class="{'my-auto': nameError !== '' || descriptionError !== ''}"
                >
                Create New Campaign
                </button>
            </form>
            <form @submit.prevent="joinCampaign()" class="flex items-center gap-8 text-white w-3/12">
                <div class=" w-full flex flex-col mt-auto">
                    <label for="campaign_name" class=" uppercase font-bold text-lg">Campaign Name</label>
                    <input v-model="campaignNameToJoin" type="text" name="campaign_name" class=" mt-2 px-2 py-1 h-11 bg-transparent border-[3px] border-purple rounded-md">
                </div>
                <button type="submit" 
                class="px-4 py-2 min-w-fit mt-auto max-h-fit border-[3px] border-purple bg-purple text-white font-medium uppercase rounded-md hover:bg-white hover:text-purple transition-colors hover:border-white"                >
                JOIN
                </button>
            </form>
        </div>
        
        <ul class=" grid grid-cols-4 gap-8 w-full mt-12 text-white">
            <li v-for="(campaign, index) in campaigns" :key="index" 
            class=" flex flex-col justify-center items-center gap-y-4 w-full h-full bg-purple p-8 rounded-lg"
            >   
                <input v-model="campaign.name" @blur="updateCampaign(index, campaign.id)" type="text" class=" bg-transparent uppercase text-xl font-bold text-center">
                <input v-model="campaign.description" @blur="updateCampaign(index, campaign.id)" type="text" class=" bg-transparent text-lg text-center">
                <p>DM: <span class="font-bold ">{{ campaign.dm.login }}</span></p>
                <div class="flex gap-x-4">
                    <button @click="openCampaign(index)" type="button" class="flex justify-center items-center w-10 aspect-square bg-white rounded-full hover:animate-pulse animate-infinite">
                        <img src="@/assets/imgs/play.svg" alt="start session">
                    </button>

                    <button @click="deleteCampaign(campaign.id)" v-if="props.user.id === campaign.dm.id" type="button" class="flex justify-center items-center w-10 aspect-square bg-white rounded-full hover:animate-pulse animate-infinite">
                        <img src="@/assets/imgs/delete.svg" alt="delete session">
                    </button>
                </div>     
            </li>
        </ul>
    </div>
</template>

<script setup lang="ts" >
import { ref, defineProps, onBeforeMount } from 'vue';
import type { User } from '@/models/User.js';
import type { Campaign } from '@/models/Campaign.js';
import { Transmit } from '@adonisjs/transmit-client';
import { callAxios } from '~/services/axios';
import { useRouter } from 'vue-router';


// Props, router & transmit setup
const props = defineProps({
  user: {
    type: Object as () => User,
    required: true,
  },
});

const router = useRouter();

const transmit = new Transmit({
    baseUrl: 'http://localhost:3333'
})

// Form data
const nameInput = ref<string>('');
const descriptionInput = ref<string>('');

// Error messages
const nameError = ref<string>('');
const descriptionError = ref<string>('');
const generalError = ref<string>('');

// Functionality constants
const campaigns = ref<Campaign[]>([]);
const campaignNameInputs = ref<string[]>([]);
const campaignDescriptionInputs = ref<string[]>([]);
const campaignNameToJoin = ref<string>('');

async function verifyCreationForm(){
    if (nameInput.value === ''){
        nameError.value = 'Name cannot be empty';
    }else{
        nameError.value = '';
    }

    if (descriptionInput.value === ''){
        descriptionError.value = 'Description cannot be empty';
    }else{
        descriptionError.value = '';
    }

    if (nameError.value === '' && descriptionError.value === ''){
        await createCampaign();
    }
}

async function createCampaign(){
    const body = {
        name: nameInput.value,
        description: descriptionInput.value,
    }   

    const result = await callAxios(body, 'campaigns/create')

    console.log(result);

    if (result.status === 200){
        console.log('Campaign created');
        nameInput.value = '';
        descriptionInput.value = '';

        campaigns.value.push(result.campaign)

        campaignNameInputs.value.push(result.campaign.name);
        campaignDescriptionInputs.value.push(result.campaign.description);

    }else{
        console.log('Campaign not created');
        generalError.value = 'Campaign not created';

        setTimeout(() => {
            generalError.value = '';
        }, 5000)
    }
}

async function fetchCampaigns(){
    const result = await callAxios({}, 'campaigns/list')

    console.log(result);

    if (result.status === 200){

        console.log('Campaigns fetched');
        campaigns.value = result.campaigns;

        for (let i = 0; i < campaigns.value.length; i++){
            campaignNameInputs.value.push(campaigns.value[i].name);
            campaignDescriptionInputs.value.push(campaigns.value[i].description);
        }

    }else{
        console.log('Campaigns not fetched');
        generalError.value = 'Campaigns not fetched';

        setTimeout(() => {
            generalError.value = '';
        }, 5000)
    }
}

async function  deleteCampaign(campaign_id : number) {
    const body = {
        campaign_id: campaign_id
    }

    const result = await callAxios(body, 'campaigns/delete')

    console.log(result);

    if (result.status === 200){
        console.log('Campaign deleted');
        campaigns.value = campaigns.value.filter(campaign => campaign.id !== campaign_id);
    }else{
        console.log('Campaign not deleted');
        generalError.value = 'Campaign not deleted';

        setTimeout(() => {
            generalError.value = '';
        }, 5000)
    }
    
}

async function updateCampaign(arrayIndex: number, campaign_id: number){
    // Check if update is needed
    if (campaignNameInputs.value[arrayIndex] === campaigns.value[arrayIndex].name && campaignDescriptionInputs.value[arrayIndex] === campaigns.value[arrayIndex].description){
        return;
    }else{
        campaignNameInputs.value[arrayIndex] = campaigns.value[arrayIndex].name;
        campaignDescriptionInputs.value[arrayIndex] = campaigns.value[arrayIndex].description;        
    }

    const body = {
        campaign_id: campaign_id,
        name: campaigns.value[arrayIndex].name,
        description: campaigns.value[arrayIndex].description
    }

    const result = await callAxios(body, 'campaigns/update')

    console.log(result);

    if (result.status === 200){
        console.log('Campaign updated');
        fetchCampaigns();
    }else{
        console.log('Campaign not updated');
        generalError.value = 'Campaign not updated';

        setTimeout(() => {
            generalError.value = '';
        }, 5000)
    }
    
}

async function joinCampaign() {
    const result = await callAxios({campaign_name: campaignNameToJoin.value}, 'campaigns/join')

    if (result.status == 200){
        console.log('Campaign joined');

        console.log(result);

        campaigns.value.push(result.campaign);

        campaignNameInputs.value.push(result.campaign.name);
        campaignDescriptionInputs.value.push(result.campaign.description);

        return;
    }else{
        console.log('Campaign not joined');
        
        generalError.value = 'Campaign not joined ';

        setTimeout(() => {
            generalError.value = '';
        }, 5000)
    }
    
}

function openCampaign(index: number){
    router.push({name: 'editor', query: {campaign_id: campaigns.value[index].id}})
}

onBeforeMount(async () => {
    await fetchCampaigns();
})

</script>