<template>
</template>

<script setup lang="ts" >
import { callAxios } from '../services/axios.js' 
import { useRouter } from 'vue-router';

const router = useRouter();

async function simpleAuth(){
    const result = await callAxios({}, 'auth/simpleAuth');
    
    if (result.status === 200){
        console.log(result.message);
        router.push('/dashboard');
    }else{
        console.log(result.message);
        router.push('/auth');
    }
}

simpleAuth();


</script>